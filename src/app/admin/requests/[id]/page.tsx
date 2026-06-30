import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/auth";
import { createAssignmentAction, generateRecommendationLetterAction, markRecommendationSentAction, saveCandidatesAction, updateRecommendationStatusAction } from "@/server/actions";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatCurrency } from "@/components/format";
import { assignmentStatusLabels, documentTypeLabels, doctorStatusLabels, educationStatusLabels, requestStatusLabels, requestTypeLabels } from "@/server/constants";
import { calculateCandidateScore } from "@/server/services/matching";
import { buildRecommendationLetterText } from "@/server/services/documents";
import { ActionModal } from "@/components/action-modal";

export default async function RequestDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ doctorQ?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const search = await searchParams;
  const [request, doctors, documents] = await Promise.all([
    prisma.recommendationRequest.findUnique({
      where: { id },
      include: {
        facility: true,
        creator: true,
        candidates: { include: { doctor: true }, orderBy: { rank: "asc" } },
        assignments: { include: { doctor: true, facility: true }, orderBy: { createdAt: "desc" } }
      }
    }),
    prisma.doctor.findMany({
      where: search.doctorQ
        ? { OR: [{ name: { contains: search.doctorQ } }, { specialty: { contains: search.doctorQ } }, { medicalInstitutionName: { contains: search.doctorQ } }, { availableRegions: { contains: search.doctorQ } }] }
        : {},
      orderBy: [{ status: "asc" }, { currentFacilityCount: "asc" }]
    }),
    prisma.document.findMany({ where: { relatedEntityType: "RecommendationRequest", relatedEntityId: id }, orderBy: { createdAt: "desc" } })
  ]);
  if (!request) notFound();
  const canWrite = user.role !== "READ_ONLY";
  const candidateScores = doctors
    .map((doctor) => ({
      doctor,
      score: calculateCandidateScore(doctor, { requestedSpecialty: request.requestedSpecialty, facilityAddress: request.facility.address })
    }))
    .sort((a, b) => b.score - a.score);

  const letterPreview = request.candidates.length
    ? buildRecommendationLetterText({
        facilityName: request.facility.name,
        requestedAt: request.requestedAt,
        candidates: request.candidates.map((candidate) => ({
          name: candidate.doctor.name,
          specialty: candidate.doctor.specialty,
          medicalInstitutionName: candidate.doctor.medicalInstitutionName,
          phone: candidate.doctor.phone
        })),
        associationName: "지역의사협의회",
        managerName: user.name
      })
    : "";

  return (
    <>
      <PageHeader title={`${request.facility.name} 추천 요청`} description={`${requestTypeLabels[request.requestType]} · ${formatDate(request.requestedAt)}`} actions={<Link className="button secondary" href="/admin/requests">목록</Link>} />
      {!canWrite ? <div className="notice">READ_ONLY 계정은 후보 저장, 문서 생성, 상태 변경, 계약 등록을 할 수 없습니다.</div> : null}
      <section className="grid two">
        <div className="panel">
          <h2>요청 기본정보</h2>
          <p><strong>상태</strong> <StatusBadge label={requestStatusLabels[request.status]} value={request.status} /></p>
          <p><strong>요양원</strong> {request.facility.name} · {request.facility.address}</p>
          <p><strong>희망 전문과목</strong> {request.requestedSpecialty ?? "-"}</p>
          <p><strong>희망 요일</strong> {request.preferredDays ?? "-"}</p>
          <p><strong>요청 사유</strong><br />{request.reason}</p>
          <form action={updateRecommendationStatusAction} className="toolbar">
            <input type="hidden" name="id" value={request.id} />
            <select name="status" defaultValue={request.status}>
              {Object.entries(requestStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <button className="button secondary" disabled={!canWrite} type="submit">상태 변경</button>
          </form>
        </div>
        <div className="panel">
          <h2>저장된 추천 후보</h2>
          {request.candidates.length === 0 ? <div className="empty">저장된 후보가 없습니다.</div> : request.candidates.map((candidate) => (
            <p key={candidate.id}>{candidate.rank}. {candidate.doctor.name} / {candidate.doctor.specialty} / {candidate.doctor.medicalInstitutionName} <span className="muted">{candidate.reason}</span></p>
          ))}
        </div>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <h2>후보 검색 및 복수 추천 저장</h2>
        <form className="toolbar">
          <input name="doctorQ" placeholder="이름, 전문과목, 기관, 지역" defaultValue={search.doctorQ ?? ""} />
          <button className="button secondary" type="submit">후보 검색</button>
        </form>
        <form action={saveCandidatesAction}>
          <input type="hidden" name="requestId" value={request.id} />
          <div className="table-wrap">
            <table>
              <thead><tr><th>선택</th><th>순위</th><th>의사</th><th>전문과목</th><th>소속</th><th>가능 지역</th><th>교육</th><th>담당</th><th>상태</th><th>점수</th><th>사유</th></tr></thead>
              <tbody>{candidateScores.map(({ doctor, score }, index) => {
                const checked = request.candidates.some((candidate) => candidate.doctorId === doctor.id);
                return (
                  <tr key={doctor.id}>
                    <td><input type="checkbox" name="doctorId" value={doctor.id} defaultChecked={checked} disabled={!canWrite || ["ON_HOLD", "STOPPED"].includes(doctor.status)} /></td>
                    <td><input name={`rank_${doctor.id}`} type="number" defaultValue={request.candidates.find((candidate) => candidate.doctorId === doctor.id)?.rank ?? index + 1} /></td>
                    <td><Link href={`/admin/doctors/${doctor.id}`}>{doctor.name}</Link></td>
                    <td>{doctor.specialty}</td>
                    <td>{doctor.medicalInstitutionName}</td>
                    <td>{doctor.availableRegions ?? "-"}</td>
                    <td><StatusBadge label={educationStatusLabels[doctor.educationStatus]} value={doctor.educationStatus} /></td>
                    <td>{doctor.currentFacilityCount}/{doctor.maxFacilityCount}</td>
                    <td><StatusBadge label={doctorStatusLabels[doctor.status]} value={doctor.status} /></td>
                    <td><strong>{score}</strong></td>
                    <td><input name={`reason_${doctor.id}`} defaultValue={request.candidates.find((candidate) => candidate.doctorId === doctor.id)?.reason ?? ""} /></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
          <div className="toolbar" style={{ marginTop: 12 }}><button className="button" disabled={!canWrite} type="submit">추천 후보 저장</button></div>
        </form>
      </section>

      <section className="grid two" style={{ marginTop: 16 }}>
        <div className="panel">
          <h2>추천서 미리보기/PDF</h2>
          {letterPreview ? <pre style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{letterPreview}</pre> : <div className="empty">후보 저장 후 추천서 미리보기가 표시됩니다.</div>}
          <form action={generateRecommendationLetterAction} className="toolbar">
            <input type="hidden" name="requestId" value={request.id} />
            <button className="button" disabled={!canWrite || request.candidates.length === 0} type="submit">추천서 PDF 생성</button>
          </form>
          <form action={markRecommendationSentAction} className="toolbar">
            <input type="hidden" name="requestId" value={request.id} />
            <button className="button secondary" disabled={!canWrite || documents.filter((doc) => doc.type === "RECOMMENDATION_LETTER").length === 0} type="submit">발송 완료 처리</button>
          </form>
          <h3>문서 이력</h3>
          {documents.length === 0 ? <div className="empty">생성된 문서가 없습니다.</div> : documents.map((document) => <p key={document.id}>{documentTypeLabels[document.type]} · <Link href={`/api/documents/${document.id}`}>{document.fileName}</Link> · {formatDate(document.createdAt)}</p>)}
        </div>
        <div className="panel">
          <h2>최종 지정 및 계약</h2>
          <ActionModal triggerLabel="최종 지정/계약 등록" title="최종 지정 및 계약 등록" description="요양원이 최종 선택한 촉탁의사와 계약 기간을 등록합니다." disabled={!canWrite || request.candidates.length === 0}>
            <form action={createAssignmentAction} className="form-grid">
              <input type="hidden" name="recommendationRequestId" value={request.id} />
              <input type="hidden" name="facilityId" value={request.facilityId} />
              <div className="field full"><label>최종 지정 의사</label><select name="doctorId" required>{request.candidates.map((candidate) => <option key={candidate.doctorId} value={candidate.doctorId}>{candidate.doctor.name}</option>)}</select></div>
              <div className="field"><label>계약 시작일</label><input name="contractStartDate" type="date" required /></div>
              <div className="field"><label>계약 종료일</label><input name="contractEndDate" type="date" required /></div>
              <div className="field"><label>등록비</label><input name="registrationFee" type="number" /></div>
              <div className="field"><label>등록비 납부</label><input name="registrationFeePaid" type="checkbox" /></div>
              <div className="field full"><label>메모</label><textarea name="memo" /></div>
              <div className="field full"><button className="button" disabled={!canWrite || request.candidates.length === 0} type="submit">최종 지정/계약 등록</button></div>
            </form>
          </ActionModal>
          <h3>계약 이력</h3>
          {request.assignments.length === 0 ? <div className="empty">등록된 계약이 없습니다.</div> : request.assignments.map((assignment) => (
            <p key={assignment.id}>{assignment.doctor.name} · {formatDate(assignment.contractStartDate)}~{formatDate(assignment.contractEndDate)} · {formatCurrency(assignment.registrationFee)}원 <StatusBadge label={assignmentStatusLabels[assignment.status]} value={assignment.status} /></p>
          ))}
        </div>
      </section>
    </>
  );
}
