import { describe, expect, it } from "vitest";
import {
  assertCanMutate,
  validateRecommendationStatusChange
} from "@/server/services/workflow";

describe("recommendation workflow rules", () => {
  it("blocks CANDIDATES_SELECTED when no candidates are saved", () => {
    expect(() =>
      validateRecommendationStatusChange({
        from: "UNDER_REVIEW",
        to: "CANDIDATES_SELECTED",
        candidateCount: 0,
        hasRecommendationLetter: false,
        hasAssignment: false,
        hasContract: false,
        actorRole: "STAFF"
      })
    ).toThrow("추천 후보가 없으면 후보추천완료로 변경할 수 없습니다.");
  });

  it("blocks SENT_TO_FACILITY before recommendation letter exists", () => {
    expect(() =>
      validateRecommendationStatusChange({
        from: "CANDIDATES_SELECTED",
        to: "SENT_TO_FACILITY",
        candidateCount: 2,
        hasRecommendationLetter: false,
        hasAssignment: false,
        hasContract: false,
        actorRole: "STAFF"
      })
    ).toThrow("추천서 생성 전에는 발송 완료 처리할 수 없습니다.");
  });

  it("blocks READ_ONLY mutations", () => {
    expect(() => assertCanMutate("READ_ONLY")).toThrow("READ_ONLY 권한은 데이터를 변경할 수 없습니다.");
  });

  it("allows a fully prepared contract registration transition", () => {
    expect(
      validateRecommendationStatusChange({
        from: "ASSIGNED",
        to: "CONTRACT_REGISTERED",
        candidateCount: 2,
        hasRecommendationLetter: true,
        hasAssignment: true,
        hasContract: true,
        actorRole: "STAFF"
      })
    ).toEqual({ ok: true });
  });
});
