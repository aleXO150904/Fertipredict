/** Offset-free historical dates must not be interpreted in the browser's timezone. */
export function formatPredictionDate(value: string | null | undefined): string {
  if (!value) return "No registrada";
  if (!/(Z|[+-]\d{2}:\d{2})$/i.test(value)) {
    const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2})(?::(\d{2})(?:\.\d+)?)?$/.exec(value);
    return parts
      ? `${parts[3]}/${parts[2]}/${parts[1]}, ${parts[4]}:${parts[5] ?? "00"} (zona horaria no registrada)`
      : "Fecha no válida";
  }
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) return "Fecha no válida";
  return `${new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima", day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).format(instant)} (Lima, UTC−05:00)`;
}
