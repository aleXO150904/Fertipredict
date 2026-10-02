/** Full 24-hour periods since successful login, independent of browser timezone. */
export function daysSinceLogin(value: string | null | undefined, now = Date.now()): number | null {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? Math.max(0, Math.floor((now - timestamp) / 86400000)) : null;
}
export function lastLoginLabel(value: string | null | undefined, now = Date.now()): string {
  const days = daysSinceLogin(value, now);
  return days === null ? "Sin registro" : days === 0 ? "Menos de 1 día" : `${days} ${days === 1 ? "día" : "días"}`;
}
export function lastLoginDate(value: string | null | undefined): string {
  if (!value || !Number.isFinite(Date.parse(value))) return "Sin inicio de sesión registrado";
  return new Date(value).toLocaleString("es-PE", { timeZone: "America/Lima", dateStyle: "short", timeStyle: "short" });
}
