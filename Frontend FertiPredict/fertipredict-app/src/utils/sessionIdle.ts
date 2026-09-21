export const IDLE_WARNING_MS = 20 * 60 * 1000;
export const IDLE_LOGOUT_MS = 30 * 60 * 1000;
export const ACTIVITY_KEY = "fertipredict:last-activity";
export function idleStage(lastActivity: number, now: number): "active" | "warning" | "expired" {
  const elapsed = Math.max(0, now - lastActivity);
  return elapsed >= IDLE_LOGOUT_MS ? "expired" : elapsed >= IDLE_WARNING_MS ? "warning" : "active";
}
