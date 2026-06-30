import Link from "next/link";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/auth";
import { refreshAssignmentStatusesAction } from "@/server/actions";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency, formatDate } from "@/components/format";
import { assignmentStatusLabels } from "@/server/constants";
import { computeAssignmentStatus } from "@/server/services/workflow";
import { daysUntil } from "@/server/services/dashboard";

export default async function AssignmentsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const assignments = await prisma.assignment.findMany({
    where: {
      AND: [
        params.status ? { status: params.status } : {},
        params.q ? { OR: [{ facility: { name: { contains: params.q } } }, { doctor: { name: { contains: params.q } } }, { doctor: { specialty: { contains: params.q } } }] } : {}
      ]
    },
    include: { facility: true, doctor: true, recommendationRequest: true },
    orderBy: { contractEndDate: "asc" }
  });

  return (
    <>
      <PageHeader
        title="지정/계약 현황"
        description="최종 지정 의사와 계약 시작일/종료일, 만료 예정 상태를 확인합니다."
        actions={<form action={refreshAssignmentStatusesAction}><button className="button secondary" disabled={user.role === "READ_ONLY"} type="submit">만료 상태 갱신</button></form>}
      />
      <section className="panel">
        <h2>검색/필터</h2>
        <form className="toolbar">
          <input name="q" placeholder="요양원, 의사, 전문과목" defaultValue={params.q ?? ""} />
          <select name="status" defaultValue={params.status ?? ""}>
            <option value="">상태 전체</option>
            {Object.entries(assignmentStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <button className="button secondary" type="submit">검색</button>
        </form>
      </section>
      <section className="table-wrap" style={{ marginTop: 16 }}>
        <table>
          <thead><tr><th>요양원</th><th>촉탁의사</th><th>전문과목</th><th>계약 시작</th><th>계약 종료</th><th>상태</th><th>등록비</th><th>납부</th><th>남은 일수</th></tr></thead>
          <tbody>{assignments.map((assignment) => {
            const computedStatus = computeAssignmentStatus(assignment.contractEndDate);
            return (
              <tr key={assignment.id}>
                <td><Link href={`/admin/facilities/${assignment.facilityId}`}>{assignment.facility.name}</Link></td>
                <td><Link href={`/admin/doctors/${assignment.doctorId}`}>{assignment.doctor.name}</Link></td>
                <td>{assignment.doctor.specialty}</td>
                <td>{formatDate(assignment.contractStartDate)}</td>
                <td>{formatDate(assignment.contractEndDate)}</td>
                <td><StatusBadge label={assignmentStatusLabels[computedStatus]} value={computedStatus} /></td>
                <td>{formatCurrency(assignment.registrationFee)}원</td>
                <td>{assignment.registrationFeePaid ? "납부" : "미납"}</td>
                <td>{daysUntil(assignment.contractEndDate)}일</td>
              </tr>
            );
          })}</tbody>
        </table>
        {assignments.length === 0 ? <div className="empty">등록된 계약이 없습니다.</div> : null}
      </section>
    </>
  );
}
