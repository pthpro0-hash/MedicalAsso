import Link from "next/link";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/auth";
import { createDoctorAction } from "@/server/actions";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/components/format";
import { doctorStatusLabels, educationStatusLabels } from "@/server/constants";
import { DoctorForm } from "@/components/entity-forms";
import { ActionModal } from "@/components/action-modal";

export default async function DoctorsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; educationStatus?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const canWrite = user.role !== "READ_ONLY";
  const doctors = await prisma.doctor.findMany({
    where: {
      AND: [
        params.q
          ? {
              OR: [
                { name: { contains: params.q } },
                { medicalInstitutionName: { contains: params.q } },
                { specialty: { contains: params.q } },
                { availableRegions: { contains: params.q } }
              ]
            }
          : {},
        params.status ? { status: params.status } : {},
        params.educationStatus ? { educationStatus: params.educationStatus } : {}
      ]
    },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <>
      <PageHeader
        title="촉탁의사 관리"
        description="후보자 정보, 교육 이수, 추천 가능 상태를 관리합니다."
        actions={
          <ActionModal triggerLabel="촉탁의사 등록" title="촉탁의사 신규 등록" description="추천 후보 의사의 기본 정보와 활동 가능 조건을 입력합니다." disabled={!canWrite}>
            <DoctorForm action={createDoctorAction} disabled={!canWrite} />
          </ActionModal>
        }
      />
      {!canWrite ? <div className="notice">READ_ONLY 계정은 촉탁의사 정보를 생성하거나 수정할 수 없습니다.</div> : null}

      <section className="panel">
        <h2>검색/필터</h2>
        <form className="toolbar">
          <input name="q" placeholder="이름, 기관, 전문과목, 지역" defaultValue={params.q ?? ""} />
          <select name="status" defaultValue={params.status ?? ""}>
            <option value="">상태 전체</option>
            {Object.entries(doctorStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select name="educationStatus" defaultValue={params.educationStatus ?? ""}>
            <option value="">교육 전체</option>
            {Object.entries(educationStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <button className="button secondary" type="submit">검색</button>
        </form>
      </section>

      <section style={{ marginTop: 16 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>이름</th><th>전문과목</th><th>소속</th><th>연락처</th><th>가능 지역</th><th>교육</th><th>담당 시설</th><th>상태</th><th>수정일</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doctor) => (
                <tr key={doctor.id}>
                  <td><Link href={`/admin/doctors/${doctor.id}`}>{doctor.name}</Link></td>
                  <td>{doctor.specialty}</td>
                  <td>{doctor.medicalInstitutionName}</td>
                  <td>{doctor.phone}</td>
                  <td>{doctor.availableRegions ?? "-"}</td>
                  <td><StatusBadge label={educationStatusLabels[doctor.educationStatus]} value={doctor.educationStatus} /></td>
                  <td>{doctor.currentFacilityCount}/{doctor.maxFacilityCount}</td>
                  <td><StatusBadge label={doctorStatusLabels[doctor.status]} value={doctor.status} /></td>
                  <td>{formatDate(doctor.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {doctors.length === 0 ? <div className="empty">등록된 촉탁의사가 없습니다.</div> : null}
        </div>
      </section>
    </>
  );
}
