type DoctorMetric = { status: string; educationStatus: string };
type FacilityMetric = { id: string };
type RequestMetric = { status: string };
type AssignmentMetric = { facilityId: string; status: string; contractEndDate: Date };
type ComplaintMetric = { status: string };

export type DashboardKpiRow = {
  href: string;
  title: string;
  meta: string;
  badge?: string;
  status?: string;
};

export type DashboardKpiCard = {
  key: string;
  label: string;
  value: number;
  detailTitle: string;
  managementHref: string;
  managementLabel: string;
  emptyMessage: string;
  rows: DashboardKpiRow[];
};

type DoctorKpi = DoctorMetric & {
  id: string;
  name: string;
  specialty: string;
  medicalInstitutionName: string;
  currentFacilityCount: number;
  maxFacilityCount: number;
};

type FacilityKpi = FacilityMetric & {
  name: string;
  status: string;
  address: string;
};

type RequestKpi = RequestMetric & {
  id: string;
  requestType: string;
  requestedAt: Date;
  facilityName: string;
  requestedSpecialty: string | null;
};

type AssignmentKpi = AssignmentMetric & {
  id: string;
  facilityName: string;
  doctorName: string;
};

type ComplaintKpi = ComplaintMetric & {
  id: string;
  type: string;
  receivedAt: Date;
  facilityName: string;
  title: string;
};

export function buildDashboardMetrics(input: {
  today: Date;
  doctors: DoctorMetric[];
  facilities: FacilityMetric[];
  requests: RequestMetric[];
  assignments: AssignmentMetric[];
  complaints: ComplaintMetric[];
}) {
  const activeFacilityIds = new Set(
    input.assignments
      .filter((assignment) => assignment.status === "ACTIVE" || assignment.status === "EXPIRING_SOON")
      .map((assignment) => assignment.facilityId)
  );

  return {
    totalDoctors: input.doctors.length,
    availableDoctors: input.doctors.filter((doctor) => doctor.status === "AVAILABLE").length,
    educationCompletedDoctors: input.doctors.filter((doctor) => doctor.educationStatus === "COMPLETED").length,
    totalFacilities: input.facilities.length,
    unassignedFacilities: input.facilities.filter((facility) => !activeFacilityIds.has(facility.id)).length,
    pendingRequests: input.requests.filter((request) => request.status === "RECEIVED").length,
    underReviewRequests: input.requests.filter((request) => request.status === "UNDER_REVIEW").length,
    candidatesSelectedRequests: input.requests.filter((request) => request.status === "CANDIDATES_SELECTED").length,
    assignedRequests: input.requests.filter((request) => request.status === "ASSIGNED").length,
    expiringWithin30Days: input.assignments.filter((assignment) => daysUntil(assignment.contractEndDate, input.today) <= 30 && daysUntil(assignment.contractEndDate, input.today) >= 0).length,
    pendingComplaints: input.complaints.filter((complaint) => complaint.status !== "CLOSED").length,
    rerecommendationNeeded: input.complaints.filter((complaint) => complaint.status === "RERECOMMENDATION_NEEDED").length
  };
}

export function daysUntil(date: Date, today = new Date()) {
  const base = new Date(today);
  base.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - base.getTime()) / 86_400_000);
}

export function buildDashboardKpiCards(input: {
  today: Date;
  doctors: DoctorKpi[];
  facilities: FacilityKpi[];
  requests: RequestKpi[];
  assignments: AssignmentKpi[];
  complaints: ComplaintKpi[];
}): DashboardKpiCard[] {
  const metrics = buildDashboardMetrics(input);
  const activeFacilityIds = new Set(
    input.assignments
      .filter((assignment) => assignment.status === "ACTIVE" || assignment.status === "EXPIRING_SOON")
      .map((assignment) => assignment.facilityId)
  );
  const doctorRows = (doctors: DoctorKpi[]) =>
    doctors.map((doctor) => ({
      href: `/admin/doctors/${doctor.id}`,
      title: doctor.name,
      meta: `${doctor.specialty} · ${doctor.medicalInstitutionName} · 담당 ${doctor.currentFacilityCount}/${doctor.maxFacilityCount}곳`,
      badge: doctorStatusLabel(doctor.status),
      status: doctor.status
    }));
  const facilityRows = (facilities: FacilityKpi[]) =>
    facilities.map((facility) => ({
      href: `/admin/facilities/${facility.id}`,
      title: facility.name,
      meta: facility.address,
      badge: facilityStatusLabel(facility.status),
      status: facility.status
    }));
  const requestRows = (requests: RequestKpi[]) =>
    requests.map((request) => ({
      href: `/admin/requests/${request.id}`,
      title: request.facilityName,
      meta: `${formatKoreanDate(request.requestedAt)} · ${request.requestedSpecialty ?? "전문과목 미지정"}`,
      badge: requestStatusLabel(request.status),
      status: request.status
    }));
  const assignmentRows = (assignments: AssignmentKpi[]) =>
    assignments.map((assignment) => ({
      href: "/admin/assignments",
      title: `${assignment.facilityName} / ${assignment.doctorName}`,
      meta: `${formatKoreanDate(assignment.contractEndDate)} · ${daysUntil(assignment.contractEndDate, input.today)}일 남음`,
      badge: assignmentStatusLabel(assignment.status),
      status: assignment.status
    }));
  const complaintRows = (complaints: ComplaintKpi[]) =>
    complaints.map((complaint) => ({
      href: `/admin/complaints/${complaint.id}`,
      title: `${complaint.facilityName} · ${complaint.title}`,
      meta: `${formatKoreanDate(complaint.receivedAt)} · ${complaintTypeLabel(complaint.type)}`,
      badge: complaintStatusLabel(complaint.status),
      status: complaint.status
    }));

  return [
    {
      key: "totalDoctors",
      label: "전체 촉탁의사",
      value: metrics.totalDoctors,
      detailTitle: "전체 촉탁의사 상세",
      managementHref: "/admin/doctors",
      managementLabel: "촉탁의사 관리 화면 열기",
      emptyMessage: "등록된 촉탁의사가 없습니다.",
      rows: doctorRows(input.doctors)
    },
    {
      key: "availableDoctors",
      label: "추천 가능 촉탁의사",
      value: metrics.availableDoctors,
      detailTitle: "추천 가능 촉탁의사",
      managementHref: "/admin/doctors?status=AVAILABLE",
      managementLabel: "추천 가능 의사 필터 보기",
      emptyMessage: "추천 가능 상태의 촉탁의사가 없습니다.",
      rows: doctorRows(input.doctors.filter((doctor) => doctor.status === "AVAILABLE"))
    },
    {
      key: "educationCompletedDoctors",
      label: "교육 이수 완료",
      value: metrics.educationCompletedDoctors,
      detailTitle: "교육 이수 완료자",
      managementHref: "/admin/doctors?educationStatus=COMPLETED",
      managementLabel: "교육 이수 완료 필터 보기",
      emptyMessage: "교육 이수 완료자가 없습니다.",
      rows: doctorRows(input.doctors.filter((doctor) => doctor.educationStatus === "COMPLETED"))
    },
    {
      key: "totalFacilities",
      label: "전체 요양원",
      value: metrics.totalFacilities,
      detailTitle: "전체 요양원 상세",
      managementHref: "/admin/facilities",
      managementLabel: "요양원 관리 화면 열기",
      emptyMessage: "등록된 요양원이 없습니다.",
      rows: facilityRows(input.facilities)
    },
    {
      key: "unassignedFacilities",
      label: "미배정 요양원",
      value: metrics.unassignedFacilities,
      detailTitle: "미배정 요양원",
      managementHref: "/admin/facilities",
      managementLabel: "요양원 관리 화면 열기",
      emptyMessage: "미배정 요양원이 없습니다.",
      rows: facilityRows(input.facilities.filter((facility) => !activeFacilityIds.has(facility.id)))
    },
    {
      key: "pendingRequests",
      label: "추천 요청 대기",
      value: metrics.pendingRequests,
      detailTitle: "접수 상태 추천 요청",
      managementHref: "/admin/requests?status=RECEIVED",
      managementLabel: "접수 요청 관리 화면 열기",
      emptyMessage: "접수 상태 추천 요청이 없습니다.",
      rows: requestRows(input.requests.filter((request) => request.status === "RECEIVED"))
    },
    {
      key: "underReviewRequests",
      label: "검토 중 요청",
      value: metrics.underReviewRequests,
      detailTitle: "검토 중 추천 요청",
      managementHref: "/admin/requests?status=UNDER_REVIEW",
      managementLabel: "검토 중 요청 관리 화면 열기",
      emptyMessage: "검토 중 요청이 없습니다.",
      rows: requestRows(input.requests.filter((request) => request.status === "UNDER_REVIEW"))
    },
    {
      key: "candidatesSelectedRequests",
      label: "후보 추천 완료",
      value: metrics.candidatesSelectedRequests,
      detailTitle: "후보 추천 완료 요청",
      managementHref: "/admin/requests?status=CANDIDATES_SELECTED",
      managementLabel: "후보 추천 완료 관리 화면 열기",
      emptyMessage: "후보 추천 완료 요청이 없습니다.",
      rows: requestRows(input.requests.filter((request) => request.status === "CANDIDATES_SELECTED"))
    },
    {
      key: "assignedRequests",
      label: "지정 완료",
      value: metrics.assignedRequests,
      detailTitle: "지정 완료 추천 요청",
      managementHref: "/admin/requests?status=ASSIGNED",
      managementLabel: "지정 완료 요청 관리 화면 열기",
      emptyMessage: "지정 완료 요청이 없습니다.",
      rows: requestRows(input.requests.filter((request) => request.status === "ASSIGNED"))
    },
    {
      key: "expiringWithin30Days",
      label: "계약 만료 30일 이내",
      value: metrics.expiringWithin30Days,
      detailTitle: "30일 이내 계약 만료 예정",
      managementHref: "/admin/assignments",
      managementLabel: "계약 현황 화면 열기",
      emptyMessage: "30일 이내 만료 예정 계약이 없습니다.",
      rows: assignmentRows(input.assignments.filter((assignment) => daysUntil(assignment.contractEndDate, input.today) <= 30 && daysUntil(assignment.contractEndDate, input.today) >= 0))
    },
    {
      key: "pendingComplaints",
      label: "민원 처리 대기",
      value: metrics.pendingComplaints,
      detailTitle: "처리 대기 민원",
      managementHref: "/admin/complaints",
      managementLabel: "민원 관리 화면 열기",
      emptyMessage: "처리 대기 민원이 없습니다.",
      rows: complaintRows(input.complaints.filter((complaint) => complaint.status !== "CLOSED"))
    },
    {
      key: "rerecommendationNeeded",
      label: "재추천 필요",
      value: metrics.rerecommendationNeeded,
      detailTitle: "재추천 필요 민원",
      managementHref: "/admin/complaints?status=RERECOMMENDATION_NEEDED",
      managementLabel: "재추천 필요 민원 보기",
      emptyMessage: "재추천 필요 민원이 없습니다.",
      rows: complaintRows(input.complaints.filter((complaint) => complaint.status === "RERECOMMENDATION_NEEDED"))
    }
  ];
}

function formatKoreanDate(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(date));
}

function doctorStatusLabel(status: string) {
  return ({ AVAILABLE: "추천 가능", NEEDS_REVIEW: "확인 필요", FULL: "배정 포화", ON_HOLD: "보류", STOPPED: "중지" } as Record<string, string>)[status] ?? status;
}

function facilityStatusLabel(status: string) {
  return ({ NORMAL: "정상", NEEDS_DOCTOR: "촉탁의 필요", CONTRACT_EXPIRING: "계약 만료 예정", RERECOMMENDATION: "재추천", INACTIVE: "비활성" } as Record<string, string>)[status] ?? status;
}

function requestStatusLabel(status: string) {
  return ({ RECEIVED: "접수", UNDER_REVIEW: "검토중", CANDIDATES_SELECTED: "후보추천완료", SENT_TO_FACILITY: "발송 완료", ASSIGNED: "지정 완료", CONTRACT_REGISTERED: "계약등록완료", CLOSED: "종결", CANCELED: "취소" } as Record<string, string>)[status] ?? status;
}

function assignmentStatusLabel(status: string) {
  return ({ ACTIVE: "진행중", EXPIRING_SOON: "만료 예정", EXPIRED: "만료", TERMINATED: "해지", RENEWAL_PENDING: "재계약 대기" } as Record<string, string>)[status] ?? status;
}

function complaintTypeLabel(type: string) {
  return ({ SCHEDULE: "방문 일정 문제", COMMUNICATION: "소통 문제", DOCUMENT: "서류 문제", SCOPE_MISUNDERSTANDING: "업무 범위 오해", GUARDIAN: "보호자 민원", CONTRACT_CHANGE: "계약 변경", OTHER: "기타" } as Record<string, string>)[type] ?? type;
}

function complaintStatusLabel(status: string) {
  return ({ RECEIVED: "접수", UNDER_REVIEW: "검토중", CHECKING: "확인중", ADJUSTED: "조정완료", RERECOMMENDATION_NEEDED: "재추천필요", CLOSED: "종결" } as Record<string, string>)[status] ?? status;
}
