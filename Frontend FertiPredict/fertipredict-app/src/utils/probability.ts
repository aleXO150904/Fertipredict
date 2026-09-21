/** The ML API supplies P(HIGH) as a percentage (0–100), not a fraction. */
export function formatProbability(value: number): string {
  return Number.isFinite(value) && value >= 0 && value <= 100
    ? `${value.toFixed(2)}%` : "No registrado";
}

export function probabilityBarWidth(value: number): number {
  return Number.isFinite(value) && value >= 0 && value <= 100 ? value : 0;
}
