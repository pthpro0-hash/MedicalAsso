"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { signIn, signOut, requireUser } from "@/server/auth";
import { writeAuditLog } from "@/server/audit";
import { createRecommendationPdf } from "@/server/services/documents";
import {
  assertCanManageUsers,
  assertCanMutate,
  computeAssignmentStatus,
  validateRecommendationStatusChange,
  type RecommendationStatus,
} from "@/server/services/workflow";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function nullableText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value || null;
}

function integer(formData: FormData, key: string, fallback = 0) {
  const value = Number.parseInt(text(formData, key), 10);
  return Number.isFinite(value) ? value : fallback;
}

function nullableInteger(formData: FormData, key: string) {
  const value = text(formData, key);
  return value ? Number.parseInt(value, 10) : null;
}

function dateValue(formData: FormData, key: string) {
  const value = text(formData, key);
  if (!value) throw new Error(`${key} 값이 필요합니다.`);
  return new Date(`${value}T00:00:00.000+09:00`);
}

function ensureRequired(value: string, label: string) {
  if (!value) throw new Error(`${label}은(는) 필수입니다.`);
  return value;
}

export async function loginAction(_prevState: { message: string }, formData: FormData) {
  const result = await signIn(text(formData, "email"), text(formData, "password"));
  if (result.ok) redirect("/admin/dashboard");
  return { message: result.message };
}

export async function logoutAction() {
  await signOut();
  redirect("/login");
}

export async function createDoctorAction(formData: FormData) {
  const actor = await requireUser();
  assertCanMutate(actor.role);
  const doctor = await prisma.doctor.create({
    data: {
      name: ensureRequired(text(formData, "name"), "이름"),
      licenseNumber: nullableText(formData, "licenseNumber"),
      medicalInstitutionName: ensureRequired(text(formData, "medicalInstitutionName"), "소속 의료기관"),
      specialty: ensureRequired(text(formData, "specialty"), "전문과목"),
      phone: ensureRequired(text(formData, "phone"), "연락처"),
      email: nullableText(formData, "email"),
      availableRegions: nullableText(formData, "availableRegions"),
      availableDays: nullableText(formData, "availableDays"),
      maxFacilityCount: integer(formData, "maxFacilityCount", 3),
      currentFacilityCount: integer(formData, "currentFacilityCount", 0),
      educationStatus: text(formData, "educationStatus") || "UNKNOWN",
      status: text(formData, "status") || "NEEDS_REVIEW",
      memo: nullableText(formData, "memo")
    }
  });
  await writeAuditLog({ actorUserId: actor.id, action: "DOCTOR_CREATE", entityType: "Doctor", entityId: doctor.id, after: doctor });
  revalidatePath("/admin/doctors");
  redirect(`/admin/doctors/${doctor.id}`);
}

export async function updateDoctorAction(formData: FormData) {
  const actor = await requireUser();
  assertCanMutate(actor.role);
  const id = ensureRequired(text(formData, "id"), "의사 ID");
  const before = await prisma.doctor.findUniqueOrThrow({ where: { id } });
  const doctor = await prisma.doctor.update({
    where: { id },
    data: {
      name: ensureRequired(text(formData, "name"), "이름"),
      licenseNumber: nullableText(formData, "licenseNumber"),
      medicalInstitutionName: ensureRequired(text(formData, "medicalInstitutionName"), "소속 의료기관"),
      specialty: ensureRequired(text(formData, "specialty"), "전문과목"),
      phone: ensureRequired(text(formData, "phone"), "연락처"),
      email: nullableText(formData, "email"),
      availableRegions: nullableText(formData, "availableRegions"),
      availableDays: nullableText(formData, "availableDays"),
      maxFacilityCount: integer(formData, "maxFacilityCount", 3),
      currentFacilityCount: integer(formData, "currentFacilityCount", 0),
      educationStatus: text(formData, "educationStatus") || "UNKNOWN",
      status: text(formData, "status") || "NEEDS_REVIEW",
      memo: nullableText(formData, "memo")
    }
  });
  await writeAuditLog({ actorUserId: actor.id, action: before.status === doctor.status ? "DOCTOR_UPDATE" : "DOCTOR_STATUS_CHANGE", entityType: "Doctor", entityId: id, before, after: doctor });
  revalidatePath("/admin/doctors");
  revalidatePath(`/admin/doctors/${id}`);
}

export async function createFacilityAction(formData: FormData) {
  const actor = await requireUser();
  assertCanMutate(actor.role);
  const facility = await prisma.facility.create({
    data: {
      name: ensureRequired(text(formData, "name"), "시설명"),
      facilityType: nullableText(formData, "facilityType"),
      address: ensureRequired(text(formData, "address"), "주소"),
      capacity: nullableInteger(formData, "capacity"),
      currentResidents: nullableInteger(formData, "currentResidents"),
      representativeName: nullableText(formData, "representativeName"),
      managerName: nullableText(formData, "managerName"),
      phone: ensureRequired(text(formData, "phone"), "연락처"),
      email: nullableText(formData, "email"),
      status: text(formData, "status") || "NORMAL",
      memo: nullableText(formData, "memo")
    }
  });
  await writeAuditLog({ actorUserId: actor.id, action: "FACILITY_CREATE", entityType: "Facility", entityId: facility.id, after: facility });
  revalidatePath("/admin/facilities");
  redirect(`/admin/facilities/${facility.id}`);
}

export async function updateFacilityAction(formData: FormData) {
  const actor = await requireUser();
  assertCanMutate(actor.role);
  const id = ensureRequired(text(formData, "id"), "요양원 ID");
  const before = await prisma.facility.findUniqueOrThrow({ where: { id } });
  const facility = await prisma.facility.update({
    where: { id },
    data: {
      name: ensureRequired(text(formData, "name"), "시설명"),
      facilityType: nullableText(formData, "facilityType"),
      address: ensureRequired(text(formData, "address"), "주소"),
      capacity: nullableInteger(formData, "capacity"),
      currentResidents: nullableInteger(formData, "currentResidents"),
      representativeName: nullableText(formData, "representativeName"),
      managerName: nullableText(formData, "managerName"),
      phone: ensureRequired(text(formData, "phone"), "연락처"),
      email: nullableText(formData, "email"),
      status: text(formData, "status") || "NORMAL",
      memo: nullableText(formData, "memo")
    }
  });
  await writeAuditLog({ actorUserId: actor.id, action: before.status === facility.status ? "FACILITY_UPDATE" : "FACILITY_STATUS_CHANGE", entityType: "Facility", entityId: id, before, after: facility });
  revalidatePath("/admin/facilities");
  revalidatePath(`/admin/facilities/${id}`);
}

export async function createRecommendationRequestAction(formData: FormData) {
  const actor = await requireUser();
  assertCanMutate(actor.role);
  const request = await prisma.recommendationRequest.create({
    data: {
      facilityId: ensureRequired(text(formData, "facilityId"), "요양원"),
      requestType: text(formData, "requestType") || "NEW",
      requestedSpecialty: nullableText(formData, "requestedSpecialty"),
      preferredDays: nullableText(formData, "preferredDays"),
      reason: ensureRequired(text(formData, "reason"), "요청 사유"),
      requestedAt: dateValue(formData, "requestedAt"),
      memo: nullableText(formData, "memo"),
      createdBy: actor.id
    }
  });
  await writeAuditLog({ actorUserId: actor.id, action: "RECOMMENDATION_REQUEST_CREATE", entityType: "RecommendationRequest", entityId: request.id, after: request });
  revalidatePath("/admin/requests");
  redirect(`/admin/requests/${request.id}`);
}

export async function updateRecommendationStatusAction(formData: FormData) {
  const actor = await requireUser();
  assertCanMutate(actor.role);
  const id = ensureRequired(text(formData, "id"), "추천 요청 ID");
  const to = text(formData, "status") as RecommendationStatus;
  const before = await prisma.recommendationRequest.findUniqueOrThrow({
    where: { id },
    include: { candidates: true, assignments: true }
  });
  const hasRecommendationLetter = await prisma.document.count({
    where: { relatedEntityType: "RecommendationRequest", relatedEntityId: id, type: "RECOMMENDATION_LETTER" }
  });
  validateRecommendationStatusChange({
    from: before.status as RecommendationStatus,
    to,
    candidateCount: before.candidates.length,
    hasRecommendationLetter: hasRecommendationLetter > 0,
    hasAssignment: before.assignments.length > 0,
    hasContract: before.assignments.length > 0,
    actorRole: actor.role
  });
  const after = await prisma.recommendationRequest.update({
    where: { id },
    data: {
      status: to,
      reviewedAt: to === "UNDER_REVIEW" ? new Date() : before.reviewedAt,
      completedAt: to === "CLOSED" ? new Date() : before.completedAt
    }
  });
  await writeAuditLog({ actorUserId: actor.id, action: "RECOMMENDATION_REQUEST_STATUS_CHANGE", entityType: "RecommendationRequest", entityId: id, before, after });
  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${id}`);
}

export async function saveCandidatesAction(formData: FormData) {
  const actor = await requireUser();
  assertCanMutate(actor.role);
  const requestId = ensureRequired(text(formData, "requestId"), "추천 요청 ID");
  const selectedDoctorIds = formData.getAll("doctorId").map(String);
  if (selectedDoctorIds.length < 1) throw new Error("추천 후보를 1명 이상 선택하세요.");
  const uniqueDoctorIds = [...new Set(selectedDoctorIds)];
  if (uniqueDoctorIds.length !== selectedDoctorIds.length) throw new Error("같은 의사를 중복 선택할 수 없습니다.");

  const stopped = await prisma.doctor.findMany({
    where: { id: { in: uniqueDoctorIds }, status: { in: ["ON_HOLD", "STOPPED"] } }
  });
  if (stopped.length > 0) throw new Error("보류 또는 중지 상태 의사는 추천 후보로 저장할 수 없습니다.");

  const before = await prisma.recommendationCandidate.findMany({ where: { recommendationRequestId: requestId } });
  await prisma.$transaction([
    prisma.recommendationCandidate.deleteMany({ where: { recommendationRequestId: requestId } }),
    ...uniqueDoctorIds.map((doctorId, index) =>
      prisma.recommendationCandidate.create({
        data: {
          recommendationRequestId: requestId,
          doctorId,
          rank: integer(formData, `rank_${doctorId}`, index + 1),
          reason: nullableText(formData, `reason_${doctorId}`)
        }
      })
    ),
    prisma.recommendationRequest.update({ where: { id: requestId }, data: { status: "CANDIDATES_SELECTED" } })
  ]);
  const after = await prisma.recommendationCandidate.findMany({ where: { recommendationRequestId: requestId } });
  await writeAuditLog({ actorUserId: actor.id, action: "RECOMMENDATION_CANDIDATES_SAVE", entityType: "RecommendationRequest", entityId: requestId, before, after });
  revalidatePath(`/admin/requests/${requestId}`);
}

export async function generateRecommendationLetterAction(formData: FormData) {
  const actor = await requireUser();
  assertCanMutate(actor.role);
  const requestId = ensureRequired(text(formData, "requestId"), "추천 요청 ID");
  const request = await prisma.recommendationRequest.findUniqueOrThrow({
    where: { id: requestId },
    include: { facility: true, candidates: { orderBy: { rank: "asc" }, include: { doctor: true } } }
  });
  if (request.candidates.length < 1) throw new Error("추천 후보가 없으면 추천서를 생성할 수 없습니다.");

  const fileName = `recommendation-${request.id}-${Date.now()}.pdf`;
  const file = await createRecommendationPdf(
    {
      facilityName: request.facility.name,
      requestedAt: request.requestedAt,
      candidates: request.candidates.map((candidate) => ({
        name: candidate.doctor.name,
        specialty: candidate.doctor.specialty,
        medicalInstitutionName: candidate.doctor.medicalInstitutionName,
        phone: candidate.doctor.phone
      })),
      associationName: "지역의사협의회",
      managerName: actor.name
    },
    fileName
  );

  const document = await prisma.document.create({
    data: {
      type: "RECOMMENDATION_LETTER",
      fileName,
      filePath: file.filePath,
      mimeType: "application/pdf",
      size: file.size,
      relatedEntityType: "RecommendationRequest",
      relatedEntityId: requestId
    }
  });
  await writeAuditLog({ actorUserId: actor.id, action: "RECOMMENDATION_LETTER_PDF_CREATE", entityType: "Document", entityId: document.id, after: document });
  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/admin/documents");
}

export async function markRecommendationSentAction(formData: FormData) {
  const actor = await requireUser();
  assertCanMutate(actor.role);
  const id = ensureRequired(text(formData, "requestId"), "추천 요청 ID");
  formData.set("id", id);
  formData.set("status", "SENT_TO_FACILITY");
  await updateRecommendationStatusAction(formData);
  await prisma.recommendationCandidate.updateMany({ where: { recommendationRequestId: id }, data: { sentToFacility: true } });
  await writeAuditLog({ actorUserId: actor.id, action: "RECOMMENDATION_SENT_MARK", entityType: "RecommendationRequest", entityId: id });
}

export async function createAssignmentAction(formData: FormData) {
  const actor = await requireUser();
  assertCanMutate(actor.role);
  const requestId = nullableText(formData, "recommendationRequestId");
  const start = dateValue(formData, "contractStartDate");
  const end = dateValue(formData, "contractEndDate");
  if (end <= start) throw new Error("계약 종료일은 시작일보다 늦어야 합니다.");
  const assignment = await prisma.assignment.create({
    data: {
      facilityId: ensureRequired(text(formData, "facilityId"), "요양원"),
      doctorId: ensureRequired(text(formData, "doctorId"), "최종 지정 의사"),
      recommendationRequestId: requestId,
      contractStartDate: start,
      contractEndDate: end,
      status: computeAssignmentStatus(end),
      registrationFee: nullableInteger(formData, "registrationFee"),
      registrationFeePaid: formData.get("registrationFeePaid") === "on",
      memo: nullableText(formData, "memo")
    }
  });
  await prisma.doctor.update({ where: { id: assignment.doctorId }, data: { currentFacilityCount: { increment: 1 } } });
  if (requestId) {
    await prisma.recommendationRequest.update({ where: { id: requestId }, data: { status: "CONTRACT_REGISTERED" } });
  }
  await writeAuditLog({ actorUserId: actor.id, action: "ASSIGNMENT_CONTRACT_CREATE", entityType: "Assignment", entityId: assignment.id, after: assignment });
  if (requestId) {
    await writeAuditLog({ actorUserId: actor.id, action: "FINAL_DOCTOR_ASSIGN", entityType: "RecommendationRequest", entityId: requestId, after: assignment });
  }
  revalidatePath("/admin/assignments");
  if (requestId) revalidatePath(`/admin/requests/${requestId}`);
  redirect("/admin/assignments");
}

export async function createComplaintAction(formData: FormData) {
  const actor = await requireUser();
  assertCanMutate(actor.role);
  const complaint = await prisma.complaint.create({
    data: {
      facilityId: ensureRequired(text(formData, "facilityId"), "요양원"),
      doctorId: nullableText(formData, "doctorId"),
      assignmentId: nullableText(formData, "assignmentId"),
      type: text(formData, "type") || "OTHER",
      title: ensureRequired(text(formData, "title"), "제목"),
      content: ensureRequired(text(formData, "content"), "내용"),
      status: text(formData, "status") || "RECEIVED",
      receivedAt: dateValue(formData, "receivedAt"),
      memo: nullableText(formData, "memo")
    }
  });
  await writeAuditLog({ actorUserId: actor.id, action: "COMPLAINT_CREATE", entityType: "Complaint", entityId: complaint.id, after: complaint });
  revalidatePath("/admin/complaints");
  redirect(`/admin/complaints/${complaint.id}`);
}

export async function updateComplaintStatusAction(formData: FormData) {
  const actor = await requireUser();
  assertCanMutate(actor.role);
  const id = ensureRequired(text(formData, "id"), "민원 ID");
  const before = await prisma.complaint.findUniqueOrThrow({ where: { id } });
  const after = await prisma.complaint.update({
    where: { id },
    data: {
      status: text(formData, "status") || before.status,
      memo: nullableText(formData, "memo") ?? before.memo,
      resolvedAt: text(formData, "status") === "CLOSED" ? new Date() : before.resolvedAt
    }
  });
  await writeAuditLog({ actorUserId: actor.id, action: "COMPLAINT_STATUS_CHANGE", entityType: "Complaint", entityId: id, before, after });
  revalidatePath("/admin/complaints");
  revalidatePath(`/admin/complaints/${id}`);
}

export async function createRerecommendationFromComplaintAction(formData: FormData) {
  const actor = await requireUser();
  assertCanMutate(actor.role);
  const complaintId = ensureRequired(text(formData, "complaintId"), "민원 ID");
  const complaint = await prisma.complaint.findUniqueOrThrow({ where: { id: complaintId } });
  if (complaint.status !== "RERECOMMENDATION_NEEDED") {
    throw new Error("재추천필요 상태의 민원에서만 재추천 요청을 생성할 수 있습니다.");
  }
  const existing = await prisma.recommendationRequest.findFirst({
    where: { facilityId: complaint.facilityId, requestType: "RERECOMMENDATION", reason: { contains: complaint.title } }
  });
  if (existing) redirect(`/admin/requests/${existing.id}`);

  const request = await prisma.recommendationRequest.create({
    data: {
      facilityId: complaint.facilityId,
      requestType: "RERECOMMENDATION",
      requestedSpecialty: null,
      preferredDays: null,
      reason: `${complaint.title}: ${complaint.content.slice(0, 200)}`,
      requestedAt: new Date(),
      memo: `민원 ${complaint.id}에서 생성된 재추천 요청`,
      createdBy: actor.id
    }
  });
  await writeAuditLog({ actorUserId: actor.id, action: "RERECOMMENDATION_REQUEST_CREATE", entityType: "RecommendationRequest", entityId: request.id, after: request });
  revalidatePath("/admin/requests");
  redirect(`/admin/requests/${request.id}`);
}

export async function createUserAction(formData: FormData) {
  const actor = await requireUser();
  assertCanManageUsers(actor.role);
  const bcrypt = await import("bcryptjs");
  const user = await prisma.user.create({
    data: {
      name: ensureRequired(text(formData, "name"), "이름"),
      email: ensureRequired(text(formData, "email"), "이메일"),
      passwordHash: await bcrypt.hash(ensureRequired(text(formData, "password"), "비밀번호"), 12),
      role: text(formData, "role") || "STAFF",
      isActive: formData.get("isActive") !== "off"
    }
  });
  await writeAuditLog({ actorUserId: actor.id, action: "USER_ROLE_CREATE", entityType: "User", entityId: user.id, after: { id: user.id, role: user.role } });
  revalidatePath("/admin/settings/users");
}

export async function updateUserRoleAction(formData: FormData) {
  const actor = await requireUser();
  assertCanManageUsers(actor.role);
  const id = ensureRequired(text(formData, "id"), "사용자 ID");
  const before = await prisma.user.findUniqueOrThrow({ where: { id } });
  const after = await prisma.user.update({
    where: { id },
    data: { role: text(formData, "role") || before.role, isActive: formData.get("isActive") === "on" }
  });
  await writeAuditLog({ actorUserId: actor.id, action: "USER_ROLE_CHANGE", entityType: "User", entityId: id, before: { role: before.role, isActive: before.isActive }, after: { role: after.role, isActive: after.isActive } });
  revalidatePath("/admin/settings/users");
}

export async function refreshAssignmentStatusesAction() {
  const actor = await requireUser();
  assertCanMutate(actor.role);
  const assignments = await prisma.assignment.findMany();
  for (const assignment of assignments) {
    const nextStatus = computeAssignmentStatus(assignment.contractEndDate);
    if (assignment.status !== nextStatus && assignment.status !== "TERMINATED" && assignment.status !== "RENEWAL_PENDING") {
      const after = await prisma.assignment.update({ where: { id: assignment.id }, data: { status: nextStatus } });
      await writeAuditLog({ actorUserId: actor.id, action: "ASSIGNMENT_STATUS_CHANGE", entityType: "Assignment", entityId: assignment.id, before: assignment, after });
    }
  }
  revalidatePath("/admin/assignments");
  revalidatePath("/admin/dashboard");
}
