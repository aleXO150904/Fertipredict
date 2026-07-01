import { useEffect, useState, type ReactNode } from "react";
import "./Dashboard.css";

// ─── Types ───────────────────────────────────────────────────────────────────
type IconKey = "activity" | "people" | "target" | "trending";

interface Metrics {
  predictionsThisMonth: number;
  totalCouples: number;
  modelAccuracy: number;
  detectedCases: number;
  predictionsChange: number;
  couplesChange: number;
  accuracyChange: number;
  detectedChange: number;
}

interface MonthlyTrend {
  month: string;
  predictions: number;
  detections: number;
}

interface FactorItem {
  factor: string;
  percentage: number;
}

interface RiskDistribution {
  low: number;
  moderate: number;
  high: number;
}

// ─── API ─────────────────────────────────────────────────────────────────────
import { api } from "../../services/api";

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await api.get<T>(path);
  return res.data;
}

// ─── Chart constants ─────────────────────────────────────────────────────────
const C_TEAL  = "#17C3C3";
const C_GREEN = "#4CAF8E";
const C_AXIS  = "#E2E0DA";
const C_LABEL = "#5A6B73";
const C_INK   = "#1B2B33";
const LC_X1 = 50, LC_X2 = 500, LC_Y2 = 205;

const PIE_COLORS = ["#1A6B7A", "#5DD5D0", "#A8E8E3", "#2DB5C0", "#3ED4A0"];

// ─── Icons ───────────────────────────────────────────────────────────────────
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

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ label, value, change, icon }: { label: string; value: string; change: string; icon: IconKey }) {
  return (
    <div className="db-kpi-card">
      <div className="db-kpi-top">
        <div className="db-kpi-icon">{ICONS[icon]}</div>
        <span className="db-kpi-change">{change}</span>
      </div>
      <div className="db-kpi-value">{value}</div>
      <div className="db-kpi-label">{label}</div>
    </div>
  );
}

// ─── Line Chart ──────────────────────────────────────────────────────────────
function LineChartSVG({ data }: { data: MonthlyTrend[] }) {
  if (!data.length) return null;

  const maxVal = Math.max(...data.map(d => Math.max(d.predictions, d.detections)), 1);
  const gridVals = [0, Math.round(maxVal * 0.25), Math.round(maxVal * 0.5), Math.round(maxVal * 0.75), maxVal];
  const LC_H = LC_Y2 - 20;
  const LC_W = LC_X2 - LC_X1;

  function lcX(i: number) { return LC_X1 + (i / Math.max(data.length - 1, 1)) * LC_W; }
  function lcY(v: number) { return LC_Y2 - (v / maxVal) * LC_H; }
  function lcPts(key: "predictions" | "detections") {
    return data.map((d, i) => `${lcX(i).toFixed(1)},${lcY(d[key]).toFixed(1)}`).join(" ");
  }

  return (
    <svg className="db-chart-svg" viewBox="0 0 520 248">
      {gridVals.map((v) => (
        <g key={v}>
          <line x1={LC_X1} y1={lcY(v)} x2={LC_X2} y2={lcY(v)} stroke={C_AXIS} strokeWidth="1" />
          <text x={LC_X1 - 6} y={lcY(v) + 4} fontSize="11" fill={C_LABEL} textAnchor="end">{v}</text>
        </g>
      ))}
      {data.map((d, i) => (
        <text key={d.month} x={lcX(i)} y={LC_Y2 + 18} fontSize="11" fill={C_LABEL} textAnchor="middle">{d.month}</text>
      ))}
      <polyline points={lcPts("predictions")} fill="none" stroke={C_TEAL}  strokeWidth="2.5" strokeLinejoin="round" />
      <polyline points={lcPts("detections")}  fill="none" stroke={C_GREEN} strokeWidth="2.5" strokeLinejoin="round" />
      {data.map((d, i) => <circle key={`p${i}`} cx={lcX(i)} cy={lcY(d.predictions)} r="4" fill={C_TEAL} />)}
      {data.map((d, i) => <circle key={`d${i}`} cx={lcX(i)} cy={lcY(d.detections)}  r="4" fill={C_GREEN} />)}
      <line x1="76"  y1="237" x2="90"  y2="237" stroke={C_TEAL}  strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="83"  cy="237" r="3.5" fill={C_TEAL} />
      <text x="95"  y="241" fontSize="11" fill={C_LABEL}>Predicciones</text>
      <line x1="183" y1="237" x2="197" y2="237" stroke={C_GREEN} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="190" cy="237" r="3.5" fill={C_GREEN} />
      <text x="202" y="241" fontSize="11" fill={C_LABEL}>Detecciones</text>
    </svg>
  );
}

// ─── Pie Chart ───────────────────────────────────────────────────────────────
function polar(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function piePath(cx: number, cy: number, r: number, s: number, e: number) {
  const sp = polar(cx, cy, r, s);
  const ep = polar(cx, cy, r, e);
  const big = e - s > 180 ? 1 : 0;
  return `M${cx} ${cy} L${sp.x.toFixed(2)} ${sp.y.toFixed(2)} A${r} ${r} 0 ${big} 1 ${ep.x.toFixed(2)} ${ep.y.toFixed(2)}Z`;
}

function PieChartSVG({ data }: { data: FactorItem[] }) {
  if (!data.length) return null;
  const cx = 320, cy = 150, r = 100, lr = 148;
  let deg = 0;

  return (
    <svg className="db-chart-svg" viewBox="0 0 700 310">
      {data.map((f, idx) => {
        const startDeg = deg;
        const endDeg   = deg + f.percentage * 3.6;
        deg = endDeg;
        const midDeg  = (startDeg + endDeg) / 2;
        const path    = piePath(cx, cy, r, startDeg, endDeg);
        const edgePt  = polar(cx, cy, r + 6, midDeg);
        const labelPt = polar(cx, cy, lr, midDeg);
        const isRight = labelPt.x > cx + 15;
        const isLeft  = labelPt.x < cx - 15;
        const anchor  = isRight ? "start" : isLeft ? "end" : "middle";
        const tx = isRight ? labelPt.x + 5 : isLeft ? labelPt.x - 5 : labelPt.x;
        const color = PIE_COLORS[idx % PIE_COLORS.length];

        return (
          <g key={f.factor}>
            <path d={path} fill={color} />
            <line x1={edgePt.x.toFixed(1)} y1={edgePt.y.toFixed(1)} x2={labelPt.x.toFixed(1)} y2={labelPt.y.toFixed(1)} stroke={color} strokeWidth="1.5" />
            <text x={tx.toFixed(1)} y={(labelPt.y + 4).toFixed(1)} fontSize="12" fill={C_INK} textAnchor={anchor} fontFamily="Inter, -apple-system, sans-serif">
              {f.factor}: {f.percentage}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Bar Chart ───────────────────────────────────────────────────────────────
function BarChartSVG({ data }: { data: { label: string; value: number; color: string }[] }) {
  if (!data.length) return null;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const gridMax = Math.ceil(maxVal / 150) * 150;
  const gridVals = [0, gridMax * 0.25, gridMax * 0.5, gridMax * 0.75, gridMax].map(Math.round);
  const LC_H = LC_Y2 - 20;
  const BC_BW = 100;

  function bcY(v: number)  { return LC_Y2 - (v / gridMax) * LC_H; }
  function bcH(v: number)  { return (v / gridMax) * LC_H; }
  function bcCX(i: number) { return LC_X1 + 75 + i * 150; }

  return (
    <svg className="db-chart-svg" viewBox="0 0 520 248">
      {gridVals.map((v) => (
        <g key={v}>
          <line x1={LC_X1} y1={bcY(v)} x2={LC_X2} y2={bcY(v)} stroke={C_AXIS} strokeWidth="1" />
          <text x={LC_X1 - 6} y={bcY(v) + 4} fontSize="11" fill={C_LABEL} textAnchor="end">{v}</text>
        </g>
      ))}
      {data.map((b, i) => (
        <g key={b.label}>
          <rect x={bcCX(i) - BC_BW / 2} y={bcY(b.value)} width={BC_BW} height={bcH(b.value)} fill={b.color} rx="4" />
          <text x={bcCX(i)} y={LC_Y2 + 18} fontSize="11" fill={C_LABEL} textAnchor="middle">{b.label}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── Loading / Error ──────────────────────────────────────────────────────────
function LoadingSpinner() {
  return (
    <div className="dashboard-loading">
      <div className="dashboard-spinner" />
      Cargando datos del dashboard…
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [trend,   setTrend]   = useState<MonthlyTrend[]>([]);
  const [factors, setFactors] = useState<FactorItem[]>([]);
  const [risk,    setRisk]    = useState<RiskDistribution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [m, t, f, r] = await Promise.all([
          fetchJSON<Metrics>("/api/dashboard/metrics"),
          fetchJSON<MonthlyTrend[]>("/api/dashboard/monthly-trend"),
          fetchJSON<FactorItem[]>("/api/dashboard/factor-distribution"),
          fetchJSON<RiskDistribution>("/api/dashboard/risk-distribution"),
        ]);
        setMetrics(m);
        setTrend(t);
        setFactors(f);
        setRisk(r);
      } catch {
        setError("No se pudieron cargar los datos. Verifica la conexión con el servidor.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const updateDate = new Date().toLocaleDateString("es-PE", {
    day: "numeric", month: "long", year: "numeric",
  });

  const kpiStats = metrics
    ? [
        { label: "Predicciones este Mes",  value: metrics.predictionsThisMonth.toLocaleString("es-PE"), change: `+${metrics.predictionsChange}%`, icon: "activity"  as IconKey },
        { label: "Parejas Evaluadas",    value: metrics.totalCouples.toLocaleString("es-PE"),     change: `+${metrics.couplesChange}%`,     icon: "people"    as IconKey },
        { label: "Precisión del Modelo", value: `${metrics.modelAccuracy}%`,                      change: `+${metrics.accuracyChange}%`,    icon: "target"    as IconKey },
        { label: "Casos Detectados",     value: metrics.detectedCases.toLocaleString("es-PE"),    change: `+${metrics.detectedChange}%`,    icon: "trending"  as IconKey },
      ]
    : [];

  const riskBars = risk
    ? [
        { label: "Bajo Riesgo",  value: risk.low,      color: "#17C3A0" },
        { label: "Riesgo Medio", value: risk.moderate,  color: "#1DADC0" },
        { label: "Alto Riesgo",  value: risk.high,      color: "#5DD5D0" },
      ]
    : [];

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Dashboard</h1>
          <p>Resumen del sistema predictivo de infertilidad · Actualizado el {updateDate}</p>
        </div>
      </div>

      {error && <div className="dashboard-error">{error}</div>}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="db-kpi-grid">
            {kpiStats.map((s) => <KpiCard key={s.label} {...s} />)}
          </div>

          <div className="db-charts-row">
            <div className="db-chart-card">
              <h3 className="db-chart-title">Tendencia Mensual</h3>
              <LineChartSVG data={trend} />
            </div>
            <div className="db-chart-card">
              <h3 className="db-chart-title">Distribución de Factores</h3>
              <PieChartSVG data={factors} />
            </div>
          </div>

          <div className="db-chart-card">
            <h3 className="db-chart-title">Categorización por Nivel de Riesgo</h3>
            <BarChartSVG data={riskBars} />
          </div>
        </>
      )}
    </div>
  );
}