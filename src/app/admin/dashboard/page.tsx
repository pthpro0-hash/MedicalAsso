import Link from "next/link";
import { prisma } from "@/server/db";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/components/format";
import { buildDashboardKpiCards, daysUntil } from "@/server/services/dashboard";
import { computeAssignmentStatus } from "@/server/services/workflow";
import { assignmentStatusLabels, complaintStatusLabels, doctorStatusLabels, requestStatusLabels } from "@/server/constants";
import { DashboardKpiCards } from "@/app/admin/dashboard/dashboard-kpi-cards";

export default async function DashboardPage() {
  const [doctors, facilities, requests, assignmentsRaw, complaints] = await Promise.all([
    prisma.doctor.findMany(),
    prisma.facility.findMany(),
    prisma.recommendationRequest.findMany({ include: { facility: true }, orderBy: { requestedAt: "desc" } }),
    prisma.assignment.findMany({ include: { facility: true, doctor: true }, orderBy: { contractEndDate: "asc" } }),
    prisma.complaint.findMany({ include: { facility: true }, orderBy: { receivedAt: "desc" } })
  ]);

  const assignments = assignmentsRaw.map((assignment) => ({ ...assignment, status: computeAssignmentStatus(assignment.contractEndDate) }));
  const today = new Date();
  const kpiCards = buildDashboardKpiCards({
    today,
    doctors,
    facilities,
    requests: requests.map((request) => ({
      id: request.id,
      status: request.status,
      requestType: request.requestType,
      requestedAt: request.requestedAt,
      facilityName: request.facility.name,
      requestedSpecialty: request.requestedSpecialty
    })),
    assignments: assignments.map((assignment) => ({
      id: assignment.id,
      facilityId: assignment.facilityId,
      status: assignment.status,
      contractEndDate: assignment.contractEndDate,
      facilityName: assignment.facility.name,
      doctorName: assignment.doctor.name
    })),
    complaints: complaints.map((complaint) => ({
      id: complaint.id,
      status: complaint.status,
      type: complaint.type,
      receivedAt: complaint.receivedAt,
      facilityName: complaint.facility.name,
      title: complaint.title
    }))
  });

  return (
    <>
      <PageHeader
        title="대시보드"
        description="오늘 처리할 추천 요청, 만료 예정 계약, 민원 상태를 확인합니다."
        actions={
          <>
            <Link className="button secondary" href="/admin/doctors">촉탁의사 등록</Link>
            <Link className="button secondary" href="/admin/facilities">요양원 등록</Link>
            <Link className="button" href="/admin/requests">추천 요청 등록</Link>
          </>
        }
      />

      <DashboardKpiCards cards={kpiCards} />

      <section className="grid two" style={{ marginTop: 16 }}>
        <div className="panel">
          <h2>오늘 처리할 추천 요청</h2>
          <QueueTable
            rows={requests
              .filter((request) => ["RECEIVED", "UNDER_REVIEW", "CANDIDATES_SELECTED"].includes(request.status))
              .slice(0, 6)
              .map((request) => ({
                href: `/admin/requests/${request.id}`,
                title: request.facility.name,
                meta: formatDate(request.requestedAt),
                badge: requestStatusLabels[request.status],
                status: request.status
              }))}
          />
        </div>
        <div className="panel">
          <h2>계약 만료 예정</h2>
          <QueueTable
            rows={assignments
              .filter((assignment) => daysUntil(assignment.contractEndDate) <= 90)
              .slice(0, 6)
              .map((assignment) => ({
                href: "/admin/assignments",
                title: `${assignment.facility.name} / ${assignment.doctor.name}`,
                meta: `${formatDate(assignment.contractEndDate)} · ${daysUntil(assignment.contractEndDate)}일 남음`,
                badge: assignmentStatusLabels[assignment.status],
                status: assignment.status
              }))}
          />
        </div>
        <div className="panel">
          <h2>민원 처리 대기</h2>
          <QueueTable
            rows={complaints
              .filter((complaint) => complaint.status !== "CLOSED")
              .slice(0, 6)
              .map((complaint) => ({
                href: `/admin/complaints/${complaint.id}`,
                title: `${complaint.facility.name} · ${complaint.title}`,
                meta: formatDate(complaint.receivedAt),
                badge: complaintStatusLabels[complaint.status],
                status: complaint.status
              }))}
          />
        </div>
        <div className="panel">
          <h2>확인 필요한 촉탁의사</h2>
          <QueueTable
            rows={doctors
              .filter((doctor) => doctor.educationStatus !== "COMPLETED" || doctor.status !== "AVAILABLE" || doctor.currentFacilityCount > doctor.maxFacilityCount)
              .slice(0, 6)
              .map((doctor) => ({
                href: `/admin/doctors/${doctor.id}`,
                title: doctor.name,
                meta: `${doctor.specialty} · ${doctor.currentFacilityCount}/${doctor.maxFacilityCount}곳`,
                badge: doctorStatusLabels[doctor.status],
                status: doctor.status
              }))}
          />
        </div>
      </section>
    </>
  );
}

function QueueTable({ rows }: { rows: Array<{ href: string; title: string; meta: string; badge: string; status: string }> }) {
  if (rows.length === 0) return <div className="empty">표시할 업무가 없습니다.</div>;
  return (
    <div className="table-wrap">
      <table>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.href}-${row.title}`}>
              <td><Link href={row.href}>{row.title}</Link><div className="muted">{row.meta}</div></td>
              <td><StatusBadge label={row.badge} value={row.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
