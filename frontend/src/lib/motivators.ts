import type { Risk } from "../api";

/** Honest numeric cues — never framed as outage probability or safety score. */
export function minutesUntilExpiry(risk: Risk, now = Date.now()) {
  const ms = Date.parse(risk.expires_at) - now;
  return Math.max(0, Math.ceil(ms / 60000));
}

export function freshnessCue(risk: Risk, status: string | null, now = Date.now()) {
  if (status === "stale") {
    return "Assessment expired — refresh before building a new plan.";
  }
  if (status !== "current") return null;
  const mins = minutesUntilExpiry(risk, now);
  if (mins <= 5) {
    return `${mins} min left before this assessment goes stale.`;
  }
  return `Assessment stays current for about ${mins} more minutes.`;
}

export function indexCue(indexValue: number | null, scale: number | null) {
  if (indexValue == null || scale == null) return null;
  return `${indexValue} of ${scale} weather stress points (not an outage probability).`;
}
