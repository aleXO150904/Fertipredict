import { useEffect, useState, type ReactNode, type FormEvent } from "react";
import { api } from "../../services/api";
import { LineChart, BarChart, PieChart, type Trend, type Factor } from "./InteractiveCharts";
import "./Dashboard.css";
type IconKey = "activity" | "people" | "target" | "trending";
function ActivityIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>;
}
function PeopleIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
}
function TargetIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>;
}
function TrendingIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 2 17" /><polyline points="17 6 23 6 23 12" /></svg>;
}

const ICONS: Record<IconKey, ReactNode> = {
  activity: <ActivityIcon />,
  people:   <PeopleIcon />,
  target:   <TargetIcon />,
  trending: <TrendingIcon />,
};

interface Metrics {
  predictionsInPeriod: number; totalCouples: number; detectedCases: number; highRiskPercentage: number;
  predictionsChange: number | null; couplesChange: number | null; detectedChange: number | null;
}
interface Risk { low: number; moderate: number; high: number }
interface Range { start: string; end: string }
const isoDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
function period(value: string): Range {
  const today = new Date();
  const start = new Date(today);
  if (value === "month") start.setDate(1);
  else if (value === "six") { start.setDate(1); start.setMonth(start.getMonth() - 5); }
  else if (value === "year") { start.setDate(1); start.setMonth(0); }
  else start.setDate(start.getDate() - Number(value) + 1);
  return { start: isoDate(start), end: isoDate(today) };
}
const formattedDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString("es-PE");
const changeLabel = (value: number | null) => value === null ? "Sin base de comparación" : `${value > 0 ? "+" : ""}${value.toLocaleString("es-PE")}% vs. periodo anterior`;

export default function DashboardPage() {
  const [range, setRange] = useState<Range>(() => period("six"));
  const [draft, setDraft] = useState<Range>(range);
  const [preset, setPreset] = useState("six");
  const [formError, setFormError] = useState("");
  const [data, setData] = useState<{ metrics: Metrics; trend: Trend[]; factors: Factor[]; risk: Risk } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [updated, setUpdated] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    const config = { params: range, signal: controller.signal };
    Promise.all([
      api.get<Metrics>("/api/dashboard/metrics", config),
      api.get<Trend[]>("/api/dashboard/monthly-trend", config),
      api.get<Factor[]>("/api/dashboard/factor-distribution", config),
      api.get<Risk>("/api/dashboard/risk-distribution", config),
    ]).then(([m, t, f, r]) => {
      if (!controller.signal.aborted) {
        setData({ metrics: m.data, trend: t.data, factors: f.data, risk: r.data });
        setUpdated(new Date().toLocaleString("es-PE"));
      }
    }).catch(() => {
      if (!controller.signal.aborted) setError("No se pudieron cargar los datos del periodo. Revisa la conexión e inténtalo de nuevo.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [range, reload]);

  function apply(event: FormEvent) {
    event.preventDefault();
    if (!draft.start || !draft.end || draft.start > draft.end || draft.end > isoDate(new Date())
        || (Date.parse(draft.end) - Date.parse(draft.start)) / 86400000 > 3660) {
      setFormError("Selecciona un intervalo válido de hasta diez años, sin fechas futuras."); return;
    }
    setFormError(""); setRange({ ...draft });
  }
  const metrics = data?.metrics;
  const cards = metrics ? [
    { label: "Predicciones del periodo", value: metrics.predictionsInPeriod.toLocaleString("es-PE"), detail: changeLabel(metrics.predictionsChange), icon: "activity" as IconKey },
    { label: "Parejas evaluadas", value: metrics.totalCouples.toLocaleString("es-PE"), detail: changeLabel(metrics.couplesChange), icon: "people" as IconKey },
    { label: "Predicciones de alto riesgo", value: metrics.detectedCases.toLocaleString("es-PE"), detail: changeLabel(metrics.detectedChange), icon: "trending" as IconKey },
    { label: "Proporción de alto riesgo", value: metrics.predictionsInPeriod ? `${metrics.highRiskPercentage.toLocaleString("es-PE")}%` : "—", detail: "Sobre las predicciones del periodo", icon: "target" as IconKey },
  ] : [];
  return <div className="dashboard-page">
    <div className="page-header"><div className="page-header-text"><h1>Dashboard</h1><p>Explora las predicciones por periodo.</p></div></div>
    <form className="db-filters" onSubmit={apply}>
      <label>Periodo<select value={preset} onChange={event => {
        const value = event.target.value; setPreset(value); setFormError("");
        if (value !== "custom") { const next = period(value); setDraft(next); setRange(next); }
      }}>
        <option value="7">Últimos 7 días</option><option value="30">Últimos 30 días</option>
        <option value="90">Últimos 90 días</option><option value="month">Este mes</option>
        <option value="six">Últimos 6 meses</option><option value="year">Este año</option><option value="custom">Personalizado</option>
      </select></label>
      <label>Desde<input type="date" required max={isoDate(new Date())} value={draft.start} onChange={e => { setDraft({ ...draft, start: e.target.value }); setPreset("custom"); }} /></label>
      <label>Hasta<input type="date" required min={draft.start} max={isoDate(new Date())} value={draft.end} onChange={e => { setDraft({ ...draft, end: e.target.value }); setPreset("custom"); }} /></label>
      <button className="btn-primary" type="submit">Aplicar filtro</button>
      <button className="btn-outline" type="button" onClick={() => setReload(n => n + 1)} disabled={loading}>Actualizar</button>
    </form>
    {formError && <p className="dashboard-error" role="alert">{formError}</p>}
    <p className="db-period">Del {formattedDate(range.start)} al {formattedDate(range.end)}, inclusive. Comparación con el intervalo anterior de igual duración.</p>
    {loading ? <div className="dashboard-loading" role="status"><span className="dashboard-spinner" />Cargando datos del periodo…</div>
      : error ? <div className="dashboard-error" role="alert">{error} <button className="link-button" onClick={() => setReload(n => n + 1)}>Reintentar</button></div>
      : data && <>
        <div className="db-kpi-grid">{cards.map(card => <div className="db-kpi-card" key={card.label} title={card.detail}>
          <div className="db-kpi-top"><div className="db-kpi-icon">{ICONS[card.icon]}</div></div>
          <div className="db-kpi-value">{card.value}</div><div className="db-kpi-label">{card.label}</div>
          <p className="db-kpi-detail">{card.detail}</p>
        </div>)}</div>
        {data.metrics.predictionsInPeriod === 0 ? <p className="db-empty" role="status">No hay predicciones en este periodo. Prueba con otras fechas.</p> : <>
          <div className="db-charts-row">
            <section className="db-chart-card"><h2 className="db-chart-title">Tendencia mensual</h2><LineChart key={range.start + range.end + updated} data={data.trend} /></section>
            <section className="db-chart-card"><h2 className="db-chart-title">Distribución de factores</h2><PieChart key={range.start + range.end + updated} data={data.factors} /></section>
          </div>
          <section className="db-chart-card"><h2 className="db-chart-title">Categorización por nivel de riesgo</h2>
            <BarChart key={range.start + range.end + updated} data={[
              { label: "Bajo riesgo", value: data.risk.low, color: "#4CAF8E" },
              { label: "Riesgo medio", value: data.risk.moderate, color: "#F59E0B" },
              { label: "Alto riesgo", value: data.risk.high, color: "#F472B6" },
            ]} /></section>
        </>}
        <p className="db-period">Actualizado: {updated}</p>
      </>}
  </div>;
}
