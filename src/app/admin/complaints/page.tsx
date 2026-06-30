import Link from "next/link";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/auth";
import { createComplaintAction } from "@/server/actions";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/components/format";
import { complaintStatusLabels, complaintTypeLabels } from "@/server/constants";
import { ActionModal } from "@/components/action-modal";

export default async function ComplaintsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const [complaints, facilities, doctors, assignments] = await Promise.all([
    prisma.complaint.findMany({
      where: {
        AND: [
          params.status ? { status: params.status } : {},
          params.q ? { OR: [{ title: { contains: params.q } }, { content: { contains: params.q } }, { facility: { name: { contains: params.q } } }] } : {}
        ]
      },
      include: { facility: true, doctor: true },
      orderBy: { receivedAt: "desc" }
    }),
    prisma.facility.findMany({ orderBy: { name: "asc" } }),
    prisma.doctor.findMany({ orderBy: { name: "asc" } }),
    prisma.assignment.findMany({ include: { facility: true, doctor: true }, orderBy: { contractEndDate: "desc" } })
  ]);
  return (
    <>
      <PageHeader
        title="민원·재추천"
        description="추천·계약·소통 관련 행정 민원과 재추천 요청을 관리합니다."
        actions={
          <ActionModal triggerLabel="민원 등록" title="민원 등록" description="행정 민원만 기록하고 환자 진료정보는 입력하지 않습니다." disabled={user.role === "READ_ONLY"}>
            <form action={createComplaintAction} className="form-grid">
              <div className="field"><label>요양원</label><select name="facilityId" required>{facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.name}</option>)}</select></div>
              <div className="field"><label>촉탁의사</label><select name="doctorId"><option value="">선택 안 함</option>{doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name}</option>)}</select></div>
              <div className="field full"><label>관련 계약</label><select name="assignmentId"><option value="">선택 안 함</option>{assignments.map((assignment) => <option key={assignment.id} value={assignment.id}>{assignment.facility.name} / {assignment.doctor.name}</option>)}</select></div>
              <div className="field"><label>유형</label><select name="type" defaultValue="COMMUNICATION">{Object.entries(complaintTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
              <div className="field"><label>상태</label><select name="status" defaultValue="RECEIVED">{Object.entries(complaintStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
              <div className="field"><label>접수일</label><input name="receivedAt" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></div>
              <div className="field full"><label>제목</label><input name="title" required /></div>
              <div className="field full"><label>내용</label><textarea name="content" required /></div>
              <div className="field full"><label>처리 메모</label><textarea name="memo" /></div>
              <div className="field full"><button className="button" disabled={user.role === "READ_ONLY"} type="submit">민원 등록</button></div>
            </form>
          </ActionModal>
        }
      />
      <div className="notice">이 화면은 촉탁의 추천·계약·소통 관련 행정 민원 관리를 위한 화면입니다. 환자 진료기록, 처방 내용, 민감한 건강정보는 입력하지 마세요.</div>
      {user.role === "READ_ONLY" ? <div className="notice">READ_ONLY 계정은 민원 등록 또는 상태 변경을 할 수 없습니다.</div> : null}
      <section className="panel">
        <h2>검색/필터</h2>
        <form className="toolbar">
          <input name="q" placeholder="제목, 내용, 요양원" defaultValue={params.q ?? ""} />
          <select name="status" defaultValue={params.status ?? ""}>
            <option value="">상태 전체</option>
            {Object.entries(complaintStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <button className="button secondary" type="submit">검색</button>
        </form>
      </section>
      <section className="table-wrap" style={{ marginTop: 16 }}>
        <table>
          <thead><tr><th>접수일</th><th>요양원</th><th>촉탁의사</th><th>유형</th><th>제목</th><th>상태</th></tr></thead>
          <tbody>{complaints.map((complaint) => (
            <tr key={complaint.id}>
              <td>{formatDate(complaint.receivedAt)}</td>
              <td>{complaint.facility.name}</td>
              <td>{complaint.doctor?.name ?? "-"}</td>
              <td>{complaintTypeLabels[complaint.type]}</td>
              <td><Link href={`/admin/complaints/${complaint.id}`}>{complaint.title}</Link></td>
              <td><StatusBadge label={complaintStatusLabels[complaint.status]} value={complaint.status} /></td>
            </tr>
          ))}</tbody>
        </table>
        {complaints.length === 0 ? <div className="empty">등록된 민원이 없습니다.</div> : null}
      </section>
    </>
  );
}
