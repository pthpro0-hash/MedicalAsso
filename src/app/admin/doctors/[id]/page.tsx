import { notFound } from "next/navigation";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/auth";
import { updateDoctorAction } from "@/server/actions";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/components/format";
import { assignmentStatusLabels } from "@/server/constants";
import { DoctorForm } from "@/components/entity-forms";

export default async function DoctorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const doctor = await prisma.doctor.findUnique({
    where: { id },
    include: { assignments: { include: { facility: true }, orderBy: { contractEndDate: "desc" } }, educationRecords: true }
  });
  if (!doctor) notFound();

  return (
    <>
      <PageHeader title={doctor.name} description={`${doctor.specialty} · ${doctor.medicalInstitutionName}`} />
      <section className="panel">
        <h2>기본 정보 수정</h2>
        <DoctorForm action={updateDoctorAction} doctor={doctor} disabled={user.role === "READ_ONLY"} />
      </section>
      <section className="grid two" style={{ marginTop: 16 }}>
        <div className="panel">
          <h2>교육 이력</h2>
          {doctor.educationRecords.length === 0 ? <div className="empty">등록된 교육 이력이 없습니다.</div> : doctor.educationRecords.map((record) => <p key={record.id}>{record.courseName} · {formatDate(record.completedAt)}</p>)}
        </div>
        <div className="panel">
          <h2>담당 시설 이력</h2>
          {doctor.assignments.length === 0 ? <div className="empty">담당 시설 이력이 없습니다.</div> : doctor.assignments.map((assignment) => (
            <p key={assignment.id}>{assignment.facility.name} · {formatDate(assignment.contractStartDate)}~{formatDate(assignment.contractEndDate)} <StatusBadge label={assignmentStatusLabels[assignment.status]} value={assignment.status} /></p>
          ))}
        </div>
      </section>
    </>
  );
}
