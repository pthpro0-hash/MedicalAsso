const DATABASE_CONNECTION_MESSAGE =
  "데이터베이스에 연결할 수 없습니다. PostgreSQL을 실행하고 migration/seed를 적용한 뒤 다시 로그인하세요.";

function errorCode(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return "";
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : "";
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : "";
}

export function isDatabaseConnectionError(error: unknown) {
  const message = errorMessage(error);
  return (
    errorCode(error) === "P1001" ||
    message.includes("Can't reach database server") ||
    message.includes("ECONNREFUSED") ||
    message.includes("Connection terminated unexpectedly")
  );
}

export function getLoginFailureMessage(error: unknown) {
  if (isDatabaseConnectionError(error)) return DATABASE_CONNECTION_MESSAGE;
  return "로그인 처리 중 오류가 발생했습니다.";
}
