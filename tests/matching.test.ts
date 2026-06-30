import { describe, expect, it } from "vitest";
import { calculateCandidateScore } from "@/server/services/matching";

describe("candidate matching score", () => {
  it("scores education, availability, specialty, region, and workload", () => {
    const score = calculateCandidateScore(
      {
        educationStatus: "COMPLETED",
        status: "AVAILABLE",
        specialty: "내과",
        availableRegions: "서울 강남구, 서울 서초구",
        currentFacilityCount: 2
      },
      {
        requestedSpecialty: "내과",
        facilityAddress: "서울 강남구 테헤란로"
      }
    );

    expect(score).toBe(100);
  });

  it("heavily penalizes on-hold or stopped doctors", () => {
    const score = calculateCandidateScore(
      {
        educationStatus: "COMPLETED",
        status: "STOPPED",
        specialty: "가정의학과",
        availableRegions: "부산",
        currentFacilityCount: 1
      },
      {
        requestedSpecialty: "가정의학과",
        facilityAddress: "부산 해운대구"
      }
    );

    expect(score).toBe(0);
  });
});
