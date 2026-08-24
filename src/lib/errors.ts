export function toErrorMessage(error: unknown, fallback = "알 수 없는 오류") {
  if (error instanceof Error) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
}
