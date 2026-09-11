import { useState } from "react";

export interface Trend { month: string; predictions: number; detections: number }
export interface Factor { factor: string; percentage: number }
export interface RiskBar { label: string; value: number; color: string }
const ink = "var(--color-ink-soft)";
const border = "var(--color-border)";
export const monthLabel = (month: string) => new Date(`${month}-01T12:00:00`).toLocaleDateString("es-PE", { month: "short", year: "numeric" });

function Detail({ text }: { text: string }) {
  return <div className="db-chart-detail" role="status" aria-live="polite">{text || "Pasa el cursor, toca un elemento o selecciónalo con Tab para ver el detalle."}</div>;
}
function ticks(max: number) {
  return [...new Set([0, Math.ceil(max / 4), Math.ceil(max / 2), Math.ceil(max * 3 / 4), max])];
}

export function LineChart({ data }: { data: Trend[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...data.map(d => Math.max(d.predictions, d.detections)));
  const x = (i: number) => data.length === 1 ? 275 : 50 + i / (data.length - 1) * 450;
  const y = (n: number) => 205 - n / max * 175;
  const selected = active === null ? null : data[active];
  const describe = (d: Trend) => `${monthLabel(d.month)}: ${d.predictions} predicciones; ${d.detections} de alto riesgo (${d.predictions ? (100 * d.detections / d.predictions).toFixed(1) : "0"}%).`;
  return <>
    <svg className="db-chart-svg" viewBox="0 0 550 248" aria-label="Predicciones y alto riesgo por mes">
      {ticks(max).map(n => <g key={n}><line x1="50" x2="500" y1={y(n)} y2={y(n)} stroke={border} /><text x="43" y={y(n) + 4} textAnchor="end" fill={ink} fontSize="11">{n}</text></g>)}
      {(["predictions", "detections"] as const).map((key, k) => <g key={key}>
        <polyline points={data.map((d, i) => `${x(i)},${y(d[key])}`).join(" ")} fill="none" stroke={k ? "#4CAF8E" : "#17C3C3"} strokeWidth="3" />
        {data.map((d, i) => <circle key={d.month} cx={x(i)} cy={y(d[key])} r={active === i ? 6 : 4} fill={k ? "#4CAF8E" : "#17C3C3"} />)}
      </g>)}
      {data.map((d, i) => <g key={d.month}>
        {(i % Math.ceil(data.length / 6) === 0 || i === data.length - 1) && <text x={x(i)} y="229" fill={ink} fontSize="10" textAnchor="middle">{monthLabel(d.month)}</text>}
        {active === i && <line x1={x(i)} x2={x(i)} y1="24" y2="205" stroke={ink} strokeDasharray="4 4" />}
        <rect className="db-chart-target" x={i === 0 ? 40 : (x(i - 1) + x(i)) / 2} y="20"
          width={data.length === 1 ? 470 : (i === 0 || i === data.length - 1) ? 450 / (data.length - 1) / 2 + 10 : 450 / (data.length - 1)} height="190"
          fill="transparent" tabIndex={0} role="button" aria-label={describe(d)}
          onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} onClick={() => setActive(i)}
          onKeyDown={e => { if (e.key === "Escape") setActive(null); if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActive(i); } }} />
      </g>)}
    </svg>
    <div className="db-chart-legend"><span>● Predicciones</span><span>● Alto riesgo</span></div>
    <Detail text={selected ? describe(selected) : ""} />
    <details className="db-data-table"><summary>Ver datos por mes</summary><table><thead><tr><th>Mes</th><th>Predicciones</th><th>Alto riesgo</th></tr></thead><tbody>{data.map(d => <tr key={d.month}><td>{monthLabel(d.month)}</td><td>{d.predictions}</td><td>{d.detections}</td></tr>)}</tbody></table></details>
  </>;
}

export function BarChart({ data }: { data: RiskBar[] }) {
  const [active, setActive] = useState<number | null>(null);
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const max = Math.max(1, ...data.map(d => d.value));
  const y = (n: number) => 205 - n / max * 175;
  const describe = (d: RiskBar) => `${d.label}: ${d.value} de ${total} predicciones (${total ? (100 * d.value / total).toFixed(1) : "0"}%).`;
  return <>
    <svg className="db-chart-svg" viewBox="0 0 550 248" aria-label="Predicciones por nivel de riesgo">
      {ticks(max).map(n => <g key={n}><line x1="50" x2="510" y1={y(n)} y2={y(n)} stroke={border} /><text x="43" y={y(n) + 4} textAnchor="end" fill={ink} fontSize="11">{n}</text></g>)}
      {data.map((d, i) => <g key={d.label} className="db-chart-target" tabIndex={0} role="button" aria-label={describe(d)}
        onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} onClick={() => setActive(i)}
        onKeyDown={e => { if (e.key === "Escape") setActive(null); if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActive(i); } }}>
        <rect x={75 + i * 150} y="20" width="100" height="190" fill="transparent" />
        <rect x={75 + i * 150} y={y(d.value)} width="100" height={205 - y(d.value)} rx="5" fill={d.color} opacity={active === null || active === i ? 1 : 0.5} />
        <text x={125 + i * 150} y={y(d.value) - 7} textAnchor="middle" fill={ink} fontSize="12">{d.value}</text>
        <text x={125 + i * 150} y="229" textAnchor="middle" fill={ink} fontSize="11">{d.label}</text>
      </g>)}
    </svg>
    <Detail text={active === null ? "" : describe(data[active])} />
  </>;
}

export function PieChart({ data }: { data: Factor[] }) {
  const [active, setActive] = useState<number | null>(null);
  const total = data.reduce((sum, d) => sum + d.percentage, 0);
  const colors = ["#1DADC0", "#4CAF8E", "#818CF8", "#F59E0B", "#F472B6", "#94A3B8"];
  const describe = (d: Factor) => `${d.factor}: ${d.percentage}% del peso relativo de las contribuciones SHAP del periodo. No es un porcentaje de pacientes.`;
  const point = (angle: number) => `${150 + 100 * Math.cos(angle)},${130 + 100 * Math.sin(angle)}`;
  return <>
    {!total ? <p className="db-empty">No hay explicaciones SHAP disponibles en este periodo.</p> : <>
      <svg className="db-chart-svg" viewBox="0 0 300 260" aria-label="Peso relativo de factores SHAP">
        {data.map((d, i) => {
          const start = data.slice(0, i).reduce((sum, item) => sum + item.percentage, 0) / total * 2 * Math.PI - Math.PI / 2;
          const angle = d.percentage / total * 2 * Math.PI;
          return <g key={d.factor + i} className="db-chart-target" tabIndex={0} role="button" aria-label={describe(d)}
            onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} onClick={() => setActive(i)}
            onKeyDown={e => { if (e.key === "Escape") setActive(null); if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActive(i); } }}
            opacity={active === null || active === i ? 1 : 0.5}>
            {d.percentage === total ? <circle cx="150" cy="130" r="100" fill={colors[i % colors.length]} />
              : <path d={`M150,130 L${point(start)} A100,100 0 ${angle > Math.PI ? 1 : 0} 1 ${point(start + angle)} Z`} fill={colors[i % colors.length]} />}
          </g>;
        })}
      </svg>
      <div className="db-factor-legend">{data.map((d, i) => <button type="button" key={d.factor + i} onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} onClick={() => setActive(i)}><span style={{ backgroundColor: colors[i % colors.length] }} />{d.factor} <strong>{d.percentage}%</strong></button>)}</div>
    </>}
    <Detail text={active === null ? "" : describe(data[active])} />
  </>;
}
