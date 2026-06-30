type BadgeTone = "good" | "warn" | "bad" | "neutral";

export function StatusBadge({ label, value }: { label: string; value?: string }) {
  const tone = getTone(value ?? label);
  return <span className={`badge ${tone === "neutral" ? "" : tone}`}>{label}</span>;
}

function getTone(value: string): BadgeTone {
  if (["AVAILABLE", "COMPLETED", "NORMAL", "ACTIVE", "CONTRACT_REGISTERED", "CLOSED", "ADJUSTED"].includes(value)) {
    return "good";
  }
  if (["NEEDS_REVIEW", "PENDING", "RECEIVED", "UNDER_REVIEW", "CANDIDATES_SELECTED", "EXPIRING_SOON", "RERECOMMENDATION_NEEDED"].includes(value)) {
    return "warn";
  }
  if (["STOPPED", "ON_HOLD", "INACTIVE", "CANCELED", "EXPIRED", "TERMINATED"].includes(value)) {
    return "bad";
  }
  return "neutral";
}
