import { describe, expect, it } from "vitest";
import { buildDashboardKpiCards, buildDashboardMetrics } from "@/server/services/dashboard";

describe("dashboard metrics", () => {
  it("aggregates core counts and 30-day expiring contracts", () => {
    const today = new Date("2026-06-29T00:00:00.000Z");
    const metrics = buildDashboardMetrics({
      today,
      doctors: [
        { status: "AVAILABLE", educationStatus: "COMPLETED" },
        { status: "NEEDS_REVIEW", educationStatus: "PENDING" }
      ],
      facilities: [{ id: "f1" }, { id: "f2" }],
      requests: [
        { status: "RECEIVED" },
        { status: "UNDER_REVIEW" },
        { status: "CANDIDATES_SELECTED" },
        { status: "ASSIGNED" }
      ],
      assignments: [
        { facilityId: "f1", status: "ACTIVE", contractEndDate: new Date("2026-07-10T00:00:00.000Z") }
      ],
      complaints: [
        { status: "RECEIVED" },
        { status: "RERECOMMENDATION_NEEDED" },
        { status: "CLOSED" }
      ]
    });

    expect(metrics).toMatchObject({
      totalDoctors: 2,
      availableDoctors: 1,
      educationCompletedDoctors: 1,
      totalFacilities: 2,
      unassignedFacilities: 1,
      pendingRequests: 1,
      underReviewRequests: 1,
      candidatesSelectedRequests: 1,
      assignedRequests: 1,
      expiringWithin30Days: 1,
      pendingComplaints: 2,
      rerecommendationNeeded: 1
    });
  });

  it("builds clickable KPI cards with detail rows and management links", () => {
    const cards = buildDashboardKpiCards({
      today: new Date("2026-06-29T00:00:00.000Z"),
      doctors: [
        { id: "d1", name: "김의사", status: "AVAILABLE", educationStatus: "COMPLETED", specialty: "내과", medicalInstitutionName: "김내과", currentFacilityCount: 1, maxFacilityCount: 3 },
        { id: "d2", name: "이의사", status: "NEEDS_REVIEW", educationStatus: "PENDING", specialty: "가정의학과", medicalInstitutionName: "이의원", currentFacilityCount: 0, maxFacilityCount: 3 }
      ],
      facilities: [
        { id: "f1", name: "가요양원", status: "NORMAL", address: "서울 강남구" },
        { id: "f2", name: "나요양원", status: "NEEDS_DOCTOR", address: "서울 서초구" }
      ],
      requests: [
        { id: "r1", status: "RECEIVED", requestType: "NEW", requestedAt: new Date("2026-06-20T00:00:00.000Z"), facilityName: "나요양원", requestedSpecialty: "내과" }
      ],
      assignments: [
        { id: "a1", facilityId: "f1", status: "ACTIVE", contractEndDate: new Date("2026-07-10T00:00:00.000Z"), facilityName: "가요양원", doctorName: "김의사" }
      ],
      complaints: [
        { id: "c1", status: "RERECOMMENDATION_NEEDED", type: "COMMUNICATION", receivedAt: new Date("2026-06-25T00:00:00.000Z"), facilityName: "가요양원", title: "재추천 필요" }
      ]
    });

    expect(cards).toHaveLength(12);
    expect(cards.find((card) => card.key === "totalDoctors")).toMatchObject({
      label: "전체 촉탁의사",
      value: 2,
      managementHref: "/admin/doctors"
    });
    expect(cards.find((card) => card.key === "expiringWithin30Days")?.rows).toHaveLength(1);
    expect(cards.find((card) => card.key === "rerecommendationNeeded")?.rows[0]).toMatchObject({
      href: "/admin/complaints/c1",
      title: "가요양원 · 재추천 필요"
    });
  });
});
