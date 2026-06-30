import { notFound } from "next/navigation";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/auth";
import { updateFacilityAction } from "@/server/actions";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/components/format";
import { assignmentStatusLabels, requestStatusLabels } from "@/server/constants";
import { FacilityForm } from "@/components/entity-forms";

export default async function FacilityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const facility = await prisma.facility.findUnique({
    where: { id },
    include: {
      recommendationRequests: { orderBy: { requestedAt: "desc" } },
      assignments: { include: { doctor: true }, orderBy: { contractEndDate: "desc" } },
      complaints: { orderBy: { receivedAt: "desc" } }
    }
  });
  if (!facility) notFound();
  return (
    <>
      <PageHeader title={facility.name} description={facility.address} />
      <section className="panel">
        <h2>기본 정보 수정</h2>
        <FacilityForm action={updateFacilityAction} facility={facility} disabled={user.role === "READ_ONLY"} />
      </section>
      <section className="grid three" style={{ marginTop: 16 }}>
        <div className="panel"><h2>추천 요청</h2>{facility.recommendationRequests.map((request) => <p key={request.id}>{formatDate(request.requestedAt)} <StatusBadge label={requestStatusLabels[request.status]} value={request.status} /></p>)}</div>
        <div className="panel"><h2>계약 이력</h2>{facility.assignments.map((assignment) => <p key={assignment.id}>{assignment.doctor.name} · {formatDate(assignment.contractEndDate)} <StatusBadge label={assignmentStatusLabels[assignment.status]} value={assignment.status} /></p>)}</div>
        <div className="panel"><h2>민원 이력</h2>{facility.complaints.map((complaint) => <p key={complaint.id}>{complaint.title} · {formatDate(complaint.receivedAt)}</p>)}</div>
      </section>
    </>
  );
}
