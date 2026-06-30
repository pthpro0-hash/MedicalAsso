export type UserRole = "SUPER_ADMIN" | "STAFF" | "REVIEWER" | "READ_ONLY";
export type RecommendationStatus =
  | "RECEIVED"
  | "UNDER_REVIEW"
  | "CANDIDATES_SELECTED"
  | "SENT_TO_FACILITY"
  | "ASSIGNED"
  | "CONTRACT_REGISTERED"
  | "CLOSED"
  | "CANCELED";

const orderedStatuses: RecommendationStatus[] = [
  "RECEIVED",
  "UNDER_REVIEW",
  "CANDIDATES_SELECTED",
  "SENT_TO_FACILITY",
  "ASSIGNED",
  "CONTRACT_REGISTERED",
  "CLOSED"
];

export function assertCanMutate(role: UserRole) {
  if (role === "READ_ONLY") {
    throw new Error("READ_ONLY 권한은 데이터를 변경할 수 없습니다.");
  }
}

export function assertCanManageUsers(role: UserRole) {
  if (role !== "SUPER_ADMIN") {
    throw new Error("SUPER_ADMIN 권한이 필요합니다.");
  }
}

export function validateRecommendationStatusChange(input: {
  from: RecommendationStatus;
  to: RecommendationStatus;
  candidateCount: number;
  hasRecommendationLetter: boolean;
  hasAssignment: boolean;
  hasContract: boolean;
  actorRole: UserRole;
}) {
  if (input.to === "CANCELED") {
    return { ok: true };
  }

  if (input.from === "CLOSED" && input.actorRole !== "SUPER_ADMIN") {
    throw new Error("종결된 추천 요청은 SUPER_ADMIN만 다시 열 수 있습니다.");
  }

  if (input.to === "CANDIDATES_SELECTED" && input.candidateCount < 1) {
    throw new Error("추천 후보가 없으면 후보추천완료로 변경할 수 없습니다.");
  }

  if (input.to === "SENT_TO_FACILITY" && !input.hasRecommendationLetter) {
    throw new Error("추천서 생성 전에는 발송 완료 처리할 수 없습니다.");
  }

  if (input.to === "ASSIGNED" && !input.hasAssignment) {
    throw new Error("최종 지정 의사가 없으면 지정완료로 변경할 수 없습니다.");
  }

  if (input.to === "CONTRACT_REGISTERED" && !input.hasContract) {
    throw new Error("계약이 없으면 계약등록완료로 변경할 수 없습니다.");
  }

  if (input.to === "CLOSED" && input.from !== "CONTRACT_REGISTERED") {
    throw new Error("계약등록완료 전에는 종결할 수 없습니다.");
  }

  const fromIndex = orderedStatuses.indexOf(input.from);
  const toIndex = orderedStatuses.indexOf(input.to);
  if (fromIndex >= 0 && toIndex >= 0 && toIndex < fromIndex && input.actorRole !== "SUPER_ADMIN") {
    throw new Error("일반 관리자는 이전 상태로 되돌릴 수 없습니다.");
  }

  return { ok: true };
}

export function computeAssignmentStatus(endDate: Date, today = new Date()) {
  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((end.getTime() - startOfToday.getTime()) / 86_400_000);
  if (daysLeft < 0) return "EXPIRED";
  if (daysLeft <= 30) return "EXPIRING_SOON";
  return "ACTIVE";
}
