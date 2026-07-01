import { describe, expect, it } from "vitest";
import { getLoginFailureMessage } from "@/server/services/login-errors";

describe("login error messages", () => {
  it("explains database connection failures without exposing the Prisma stack trace", () => {
    const error = Object.assign(new Error("Can't reach database server at `localhost:5432`"), {
      code: "P1001"
    });

    expect(getLoginFailureMessage(error)).toBe(
      "데이터베이스에 연결할 수 없습니다. PostgreSQL을 실행하고 migration/seed를 적용한 뒤 다시 로그인하세요."
    );
  });

  it("uses a generic message for unexpected login failures", () => {
    expect(getLoginFailureMessage(new Error("unexpected"))).toBe("로그인 처리 중 오류가 발생했습니다.");
  });
});
