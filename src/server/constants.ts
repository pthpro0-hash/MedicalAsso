export const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "전체 관리자",
  STAFF: "사무국",
  REVIEWER: "검토자",
  READ_ONLY: "조회 전용"
};

export const doctorStatusLabels: Record<string, string> = {
  AVAILABLE: "추천 가능",
  NEEDS_REVIEW: "확인 필요",
  FULL: "배정 포화",
  ON_HOLD: "보류",
  STOPPED: "중지"
};

export const educationStatusLabels: Record<string, string> = {
  COMPLETED: "이수 완료",
  PENDING: "이수 대기",
  UNKNOWN: "미확인"
};

export const facilityStatusLabels: Record<string, string> = {
  NORMAL: "정상",
  NEEDS_DOCTOR: "촉탁의 필요",
  CONTRACT_EXPIRING: "계약 만료 예정",
  RERECOMMENDATION: "재추천",
  INACTIVE: "비활성"
};

export const requestStatusLabels: Record<string, string> = {
  RECEIVED: "접수",
  UNDER_REVIEW: "검토중",
  CANDIDATES_SELECTED: "후보추천완료",
  SENT_TO_FACILITY: "발송 완료",
  ASSIGNED: "지정 완료",
  CONTRACT_REGISTERED: "계약등록완료",
  CLOSED: "종결",
  CANCELED: "취소"
};

export const requestTypeLabels: Record<string, string> = {
  NEW: "신규",
  CHANGE: "변경",
  RENEWAL: "재계약",
  RERECOMMENDATION: "재추천"
};

export const assignmentStatusLabels: Record<string, string> = {
  ACTIVE: "진행중",
  EXPIRING_SOON: "만료 예정",
  EXPIRED: "만료",
  TERMINATED: "해지",
  RENEWAL_PENDING: "재계약 대기"
};

export const complaintTypeLabels: Record<string, string> = {
  SCHEDULE: "방문 일정 문제",
  COMMUNICATION: "소통 문제",
  DOCUMENT: "서류 문제",
  SCOPE_MISUNDERSTANDING: "업무 범위 오해",
  GUARDIAN: "보호자 민원",
  CONTRACT_CHANGE: "계약 변경",
  OTHER: "기타"
};

export const complaintStatusLabels: Record<string, string> = {
  RECEIVED: "접수",
  UNDER_REVIEW: "검토중",
  CHECKING: "확인중",
  ADJUSTED: "조정완료",
  RERECOMMENDATION_NEEDED: "재추천필요",
  CLOSED: "종결"
};

export const documentTypeLabels: Record<string, string> = {
  CERTIFICATE: "교육 이수증",
  RECOMMENDATION_LETTER: "추천서",
  CONTRACT: "계약서",
  REQUEST_FORM: "요청서",
  INTERNAL_NOTE: "내부 메모",
  OTHER: "기타"
};

export const writableRoles = ["SUPER_ADMIN", "STAFF", "REVIEWER"];
