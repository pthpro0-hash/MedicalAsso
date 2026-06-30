import { PrismaClient } from "@prisma/client/index";
import { calculateCandidateScore } from "@/server/services/matching";
import { assertCanMutate, computeAssignmentStatus, validateRecommendationStatusChange } from "@/server/services/workflow";
import { buildDashboardMetrics } from "@/server/services/dashboard";
import { createRecommendationPdf } from "@/server/services/documents";

const prisma = new PrismaClient();

async function audit(actorUserId: string, action: string, entityType: string, entityId: string, after?: unknown) {
  await prisma.auditLog.create({
    data: {
      actorUserId,
      action,
      entityType,
      entityId,
      afterJson: after ? JSON.stringify(after) : null
    }
  });
}

async function main() {
  const staff = await prisma.user.findUniqueOrThrow({ where: { email: "staff@example.com" } });
  const readonly = await prisma.user.findUniqueOrThrow({ where: { email: "readonly@example.com" } });
  const stamp = Date.now();

  const doctorA = await prisma.doctor.create({
    data: {
      name: `스모크내과${stamp}`,
      licenseNumber: `S-${stamp}-1`,
      medicalInstitutionName: "스모크내과의원",
      specialty: "내과",
      phone: "010-9000-0001",
      availableRegions: "서울 강남구",
      availableDays: "월,수",
      maxFacilityCount: 3,
      currentFacilityCount: 0,
      educationStatus: "COMPLETED",
      status: "AVAILABLE"
    }
  });
  await audit(staff.id, "DOCTOR_CREATE", "Doctor", doctorA.id, doctorA);

  const doctorB = await prisma.doctor.create({
    data: {
      name: `스모크가정${stamp}`,
      licenseNumber: `S-${stamp}-2`,
      medicalInstitutionName: "스모크가정의학과",
      specialty: "가정의학과",
      phone: "010-9000-0002",
      availableRegions: "서울 강남구",
      availableDays: "화,목",
      maxFacilityCount: 3,
      currentFacilityCount: 1,
      educationStatus: "COMPLETED",
      status: "AVAILABLE"
    }
  });
  await audit(staff.id, "DOCTOR_CREATE", "Doctor", doctorB.id, doctorB);

  const facility = await prisma.facility.create({
    data: {
      name: `스모크요양원${stamp}`,
      facilityType: "노인요양시설",
      address: "서울 강남구 테스트로 1",
      capacity: 40,
      currentResidents: 35,
      managerName: "스모크담당",
      phone: "02-9000-0000",
      status: "NEEDS_DOCTOR"
    }
  });
  await audit(staff.id, "FACILITY_CREATE", "Facility", facility.id, facility);

  const request = await prisma.recommendationRequest.create({
    data: {
      facilityId: facility.id,
      requestType: "NEW",
      requestedSpecialty: "내과",
      preferredDays: "월",
      reason: "스모크 신규 추천 업무",
      requestedAt: new Date(),
      createdBy: staff.id
    }
  });
  await audit(staff.id, "RECOMMENDATION_REQUEST_CREATE", "RecommendationRequest", request.id, request);

  const scores = [doctorA, doctorB].map((doctor) => calculateCandidateScore(doctor, { requestedSpecialty: request.requestedSpecialty, facilityAddress: facility.address }));
  if (scores[0] <= 0 || scores[1] <= 0) throw new Error("후보 점수 계산 실패");

  await prisma.recommendationCandidate.createMany({
    data: [
      { recommendationRequestId: request.id, doctorId: doctorA.id, rank: 1, reason: "전문과목 및 지역 일치" },
      { recommendationRequestId: request.id, doctorId: doctorB.id, rank: 2, reason: "대체 후보" }
    ]
  });
  await prisma.recommendationRequest.update({ where: { id: request.id }, data: { status: "CANDIDATES_SELECTED" } });
  await audit(staff.id, "RECOMMENDATION_CANDIDATES_SAVE", "RecommendationRequest", request.id);

  const pdf = await createRecommendationPdf(
    {
      facilityName: facility.name,
      requestedAt: request.requestedAt,
      candidates: [
        { name: doctorA.name, specialty: doctorA.specialty, medicalInstitutionName: doctorA.medicalInstitutionName, phone: doctorA.phone },
        { name: doctorB.name, specialty: doctorB.specialty, medicalInstitutionName: doctorB.medicalInstitutionName, phone: doctorB.phone }
      ],
      associationName: "지역의사협의회",
      managerName: staff.name
    },
    `smoke-recommendation-${stamp}.pdf`
  );
  const document = await prisma.document.create({
    data: {
      type: "RECOMMENDATION_LETTER",
      fileName: `smoke-recommendation-${stamp}.pdf`,
      filePath: pdf.filePath,
      mimeType: "application/pdf",
      size: pdf.size,
      relatedEntityType: "RecommendationRequest",
      relatedEntityId: request.id
    }
  });
  await audit(staff.id, "RECOMMENDATION_LETTER_PDF_CREATE", "Document", document.id, document);

  validateRecommendationStatusChange({
    from: "CANDIDATES_SELECTED",
    to: "SENT_TO_FACILITY",
    candidateCount: 2,
    hasRecommendationLetter: true,
    hasAssignment: false,
    hasContract: false,
    actorRole: "STAFF"
  });
  await prisma.recommendationRequest.update({ where: { id: request.id }, data: { status: "SENT_TO_FACILITY" } });
  await audit(staff.id, "RECOMMENDATION_SENT_MARK", "RecommendationRequest", request.id);

  const assignment = await prisma.assignment.create({
    data: {
      facilityId: facility.id,
      doctorId: doctorA.id,
      recommendationRequestId: request.id,
      contractStartDate: new Date("2026-07-01T00:00:00.000+09:00"),
      contractEndDate: new Date("2027-06-30T00:00:00.000+09:00"),
      status: computeAssignmentStatus(new Date("2027-06-30T00:00:00.000+09:00")),
      registrationFee: 100000,
      registrationFeePaid: true
    }
  });
  await prisma.recommendationRequest.update({ where: { id: request.id }, data: { status: "CONTRACT_REGISTERED" } });
  await audit(staff.id, "ASSIGNMENT_CONTRACT_CREATE", "Assignment", assignment.id, assignment);

  const complaint = await prisma.complaint.create({
    data: {
      facilityId: facility.id,
      doctorId: doctorA.id,
      assignmentId: assignment.id,
      type: "COMMUNICATION",
      title: `스모크 재추천 필요 ${stamp}`,
      content: "행정 소통 이슈로 재추천이 필요합니다.",
      status: "RERECOMMENDATION_NEEDED",
      receivedAt: new Date()
    }
  });
  await audit(staff.id, "COMPLAINT_CREATE", "Complaint", complaint.id, complaint);
  const rerequest = await prisma.recommendationRequest.create({
    data: {
      facilityId: facility.id,
      requestType: "RERECOMMENDATION",
      reason: `${complaint.title}: ${complaint.content}`,
      status: "RECEIVED",
      requestedAt: new Date(),
      createdBy: staff.id,
      memo: `민원 ${complaint.id}에서 생성`
    }
  });
  await audit(staff.id, "RERECOMMENDATION_REQUEST_CREATE", "RecommendationRequest", rerequest.id, rerequest);

  let readOnlyBlocked = false;
  try {
    assertCanMutate(readonly.role as "READ_ONLY");
  } catch {
    readOnlyBlocked = true;
  }
  if (!readOnlyBlocked) throw new Error("READ_ONLY 수정 차단 실패");

  const [doctors, facilities, requests, assignments, complaints] = await Promise.all([
    prisma.doctor.findMany(),
    prisma.facility.findMany(),
    prisma.recommendationRequest.findMany(),
    prisma.assignment.findMany(),
    prisma.complaint.findMany()
  ]);
  const metrics = buildDashboardMetrics({ today: new Date(), doctors, facilities, requests, assignments, complaints });
  if (metrics.totalDoctors < 7 || metrics.totalFacilities < 6 || metrics.pendingComplaints < 1) {
    throw new Error("대시보드 집계 검증 실패");
  }

  const auditCount = await prisma.auditLog.count({ where: { entityId: { in: [request.id, assignment.id, rerequest.id] } } });
  if (auditCount < 3) throw new Error("AuditLog 검증 실패");

  console.log("SMOKE_OK", {
    requestId: request.id,
    assignmentId: assignment.id,
    complaintId: complaint.id,
    rerecommendationRequestId: rerequest.id,
    documentId: document.id,
    readOnlyBlocked
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
