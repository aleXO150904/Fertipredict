import { useState, useEffect } from "react";
import type { ReactElement } from "react";
import { predictionService } from "../../services/predictionService";
import type { PredictionDTO } from "../../types/prediction";
import "./Predictions.css";

/* ── helpers ─────────────────────────────────────────────── */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getProbabilityClass(riskLevel: string): string {
  switch (riskLevel?.toUpperCase()) {
    case "HIGH": return "high";
    case "MEDIUM": return "medium";
    case "LOW": return "low";
    default: return "";
  }
}

function formatId(id: number): string {
  return `PRD-${String(id).padStart(3, "0")}`;
}

function getCoupleName(pred: PredictionDTO): string {
  const m = pred.couple?.malePatient?.fullName;
  const f = pred.couple?.femalePatient?.fullName;
  if (m && f) return `${m} / ${f}`;
  if (m) return m;
  if (f) return f;
  return `Pareja #${pred.couple?.id ?? "—"}`;
}

function getCoupleId(pred: PredictionDTO): string {
  const id = pred.couple?.id;
  return id ? `CPL-${String(id).padStart(4, "0")}` : "—";
}

function formatProbability(prob: number): string {
  if (prob === undefined || prob === null) return "—";
  const val = prob > 1 ? prob : prob * 100;
  return `${val.toFixed(1)}%`;
}

function getProbabilityPercent(prob: number): number {
  if (prob === undefined || prob === null) return 0;
  const val = prob > 1 ? prob : prob * 100;
  return Math.min(100, Math.max(0, val));
}

/* ── RiskBadge ───────────────────────────────────────────── */
function RiskBadge({ level }: { level: string }) {
  const cls = getProbabilityClass(level);
  const labels: Record<string, string> = { HIGH: "Alto", MODERATE: "Medio", LOW: "Bajo", PENDING: "Pendiente" };
  const label = labels[level?.toUpperCase()] ?? level;

  const icons: Record<string, ReactElement> = {
    HIGH: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
    MODERATE: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
    LOW: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
        <polyline points="16 17 22 17 22 11" />
      </svg>
    ),
  };

  return (
    <span className={`risk-badge ${cls}`}>
      {icons[level?.toUpperCase()]}
      {label}
    </span>
  );
}

/* ── DetailField ─────────────────────────────────────────── */
function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="modal-detail-field">
      <span className="modal-detail-label">{label}</span>
      <span className="modal-detail-value">{value}</span>
    </div>
  );
}

const FEATURE_LABELS: Record<string, string> = {
  Edad_Masculino: "Edad masculina",
  IMC_Masculino: "IMC masculino",
  Concentracion_Esperma: "Concentración espermática",
  Motilidad_Espermatica: "Motilidad espermática",
  Morfologia_Espermatica: "Morfología espermática",
  Varicocele: "Varicocele",
  Exposicion_Toxicos_Calor_Masculino: "Exposición a tóxicos (M)",
  Fumador_Masculino: "Tabaquismo masculino",
  Consumo_Alcohol_Masculino: "Alcohol masculino",
  Nivel_Ejercicio_Masculino: "Ejercicio masculino",
  Tipo_Alimentacion_Masculino: "Alimentación masculina",
  Historial_Familiar_Infertilidad_Masculino: "Historial familiar (M)",
  Edad_Femenino: "Edad femenina",
  IMC_Femenino: "IMC femenino",
  Ciclo_Menstrual: "Ciclo menstrual",
  PCOS: "PCOS (SOP)",
  Endometriosis: "Endometriosis",
  Hormona_AMH: "Hormona AMH",
  Hormona_FSH: "Hormona FSH",
  Obstruccion_Tubaria: "Obstrucción tubárica",
  Abortos_Previos: "Abortos previos",
  Fumador_Femenino: "Tabaquismo femenino",
  Consumo_Alcohol_Femenino: "Alcohol femenino",
  Nivel_Ejercicio_Femenino: "Ejercicio femenino",
  Tipo_Alimentacion_Femenino: "Alimentación femenina",
  Historial_Familiar_Infertilidad_Femenino: "Historial familiar (F)",
};

function getTop5(explanation?: Record<string, number>) {
  if (!explanation) return [];
  return Object.entries(explanation)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 5);
}

/* ── ViewModal ───────────────────────────────────────────── */
function ViewModal({ pred, onClose }: { pred: PredictionDTO; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const male = pred.couple?.malePatient;
  const female = pred.couple?.femalePatient;
  const mf = male?.maleFactors;
  const ff = female?.femaleFactors;

  const db = (v: boolean | null | undefined) => (v == null ? "—" : v ? "Sí" : "No");
  const dn = (v: number | null | undefined, suf = "") => (v == null ? "—" : `${v}${suf}`);
  const alcohol = ["Nunca", "Ocasional", "Frecuente", "Diario"];
  const exercise = ["Sedentario", "Leve", "Moderado", "Intenso"];
  const diet = ["Deficiente", "Regular", "Saludable"];
  const da = (v: number | null | undefined, arr: string[]) =>
    v != null && arr[v] ? arr[v] : "—";

  const probPct = getProbabilityPercent(pred.probability);
  const probCls = getProbabilityClass(pred.riskLevel);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box--view" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left">
            <span className="pred-id">{formatId(pred.id)}</span>
            <RiskBadge level={pred.riskLevel} />
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-meta">
          <span>{getCoupleId(pred)}</span>
          <span>·</span>
          <span>{formatDate(pred.date)}</span>
        </div>

        <div className="modal-prob">
          <div className="prob-bar-track" style={{ flex: 1, height: 8 }}>
            <div className={`prob-bar-fill ${probCls}`} style={{ width: `${probPct}%` }} />
          </div>
          <span className="prob-value">{formatProbability(pred.probability)} de probabilidad de infertilidad</span>
        </div>

        <div className="modal-body">
          {pred.explanation && getTop5(pred.explanation).length > 0 && (
            <div className="modal-patient-section shap-section" style={{ marginBottom: '24px', backgroundColor: 'var(--color-bg)', padding: '16px', borderRadius: '8px' }}>
              <h4 className="modal-patient-title" style={{ marginBottom: '12px' }}>Explicación del Modelo (Top 5 factores)</h4>
              {getTop5(pred.explanation).map(([feature, value]) => {
                const maxAbs = Math.abs(getTop5(pred.explanation)[0][1]);
                const pct = (Math.abs(value) / maxAbs) * 100;
                const isPositive = value >= 0;
                const label = FEATURE_LABELS[feature] || feature;
                return (
                  <div className="shap-row" key={feature} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', fontSize: '13px' }}>
                    <div className="shap-label" title={label} style={{ flex: '0 0 160px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--color-text)' }}>{label}</div>
                    <div className="shap-bar-wrap" style={{ flex: 1, height: '6px', backgroundColor: 'var(--color-border)', borderRadius: '3px', position: 'relative' }}>
                      <div
                        className={`shap-bar ${isPositive ? "positive" : "negative"}`}
                        style={{ position: 'absolute', top: 0, bottom: 0, borderRadius: '3px', width: `${pct}%`, [isPositive ? 'left' : 'right']: '50%', backgroundColor: isPositive ? '#c0392b' : '#27ae60', transform: isPositive ? 'none' : 'translateX(100%)' }}
                      />
                    </div>
                    <div className={`shap-value ${isPositive ? "positive" : "negative"}`} style={{ flex: '0 0 60px', textAlign: 'right', fontWeight: 600, color: isPositive ? '#c0392b' : '#27ae60' }}>
                      {isPositive ? "+" : ""}{value.toFixed(4)}
                    </div>
                    <div className={`shap-dir ${isPositive ? "positive" : "negative"}`} style={{ flex: '0 0 110px', color: isPositive ? '#c0392b' : '#27ae60', fontSize: '12px' }}>
                      {isPositive ? "↑ aumenta riesgo" : "↓ reduce riesgo"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {male && (
            <div className="modal-patient-section">
              <h4 className="modal-patient-title modal-patient-title--male">Paciente Masculino</h4>
              <div className="modal-detail-grid">
                <DetailField label="Nombre" value={male.fullName || "—"} />
                <DetailField label="Email" value={male.email || "—"} />
                <DetailField label="Teléfono" value={male.phone || "—"} />
                <DetailField label="Edad" value={dn(male.age, " años")} />
                <DetailField label="IMC" value={dn(male.imc)} />
                <DetailField label="Fumador" value={db(male.smoker)} />
                <DetailField label="Alcohol" value={da(male.alcoholConsumption, alcohol)} />
                <DetailField label="Ejercicio" value={da(male.exerciseLevel, exercise)} />
                <DetailField label="Dieta" value={da(male.dietType, diet)} />
              </div>
              {mf && (
                <>
                  <h5 className="modal-factors-title">Factores Masculinos</h5>
                  <div className="modal-detail-grid">
                    <DetailField label="Concentración esperm." value={dn(mf.spermCountMPerMl, " M/mL")} />
                    <DetailField label="Motilidad esperm." value={dn(mf.spermMotilityPct, "%")} />
                    <DetailField label="Morfología esperm." value={dn(mf.spermMorphologyPct, "%")} />
                    <DetailField label="Varicocele" value={db(mf.varicocele)} />
                    <DetailField label="Exp. a tóxicos" value={db(mf.heatToxicExposure)} />
                    <DetailField label="Historial familiar" value={db(mf.familyInfertilityHistory)} />
                  </div>
                </>
              )}
            </div>
          )}

          {female && (
            <div className="modal-patient-section">
              <h4 className="modal-patient-title modal-patient-title--female">Paciente Femenino</h4>
              <div className="modal-detail-grid">
                <DetailField label="Nombre" value={female.fullName || "—"} />
                <DetailField label="Email" value={female.email || "—"} />
                <DetailField label="Teléfono" value={female.phone || "—"} />
                <DetailField label="Edad" value={dn(female.age, " años")} />
                <DetailField label="IMC" value={dn(female.imc)} />
                <DetailField label="Fumadora" value={db(female.smoker)} />
                <DetailField label="Alcohol" value={da(female.alcoholConsumption, alcohol)} />
                <DetailField label="Ejercicio" value={da(female.exerciseLevel, exercise)} />
                <DetailField label="Dieta" value={da(female.dietType, diet)} />
              </div>
              {ff && (
                <>
                  <h5 className="modal-factors-title">Factores Femeninos</h5>
                  <div className="modal-detail-grid">
                    <DetailField label="PCOS (SOP)" value={db(ff.pcos)} />
                    <DetailField label="Ciclo menstrual" value={ff.periodRegularity == null ? "—" : ff.periodRegularity ? "Regular" : "Irregular"} />
                    <DetailField label="Endometriosis" value={db(ff.endometriosis)} />
                    <DetailField label="Hormona AMH" value={dn(ff.amh)} />
                    <DetailField label="Hormona FSH" value={dn(ff.fsh)} />
                    <DetailField label="Obstrucción tubaria" value={db(ff.tubalObstruction)} />
                    <DetailField label="Abortos previos" value={dn(ff.previousAbortions)} />
                    <DetailField label="Historial familiar" value={db(ff.familyInfertilityHistory)} />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── DeleteModal ─────────────────────────────────────────── */
function DeleteModal({
  pred,
  deleting,
  error,
  onConfirm,
  onCancel,
}: {
  pred: PredictionDTO;
  deleting: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) { if (e.key === "Escape" && !deleting) onCancel(); }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [deleting, onCancel]);

  return (
    <div className="modal-overlay" onClick={!deleting ? onCancel : undefined}>
      <div className="modal-box modal-box--delete" onClick={(e) => e.stopPropagation()}>
        <div className="modal-delete-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" /><path d="M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </div>
        <h3 className="modal-delete-title">Eliminar Predicción</h3>
        <p className="modal-delete-message">
          ¿Estás seguro de que deseas eliminar la predicción{" "}
          <strong>{formatId(pred.id)}</strong>?
          <br />
          Esta acción no se puede deshacer.
        </p>
        {error && <p className="modal-delete-error">{error}</p>}
        <div className="modal-delete-actions">
          <button className="modal-btn-cancel" onClick={onCancel} disabled={deleting}>
            Cancelar
          </button>
          <button className="modal-btn-confirm" onClick={onConfirm} disabled={deleting}>
            {deleting ? "Eliminando…" : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── PredictionsPage ─────────────────────────────────────── */
export default function PredictionsPage({
  onNewPrediction,
  onEditPrediction,
}: {
  onNewPrediction?: () => void;
  onEditPrediction?: (pred: PredictionDTO) => void;
}) {
  const [predictions, setPredictions] = useState<PredictionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [viewPred, setViewPred] = useState<PredictionDTO | null>(null);
  const [deletePred, setDeletePred] = useState<PredictionDTO | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    predictionService
      .getAll()
      .then(setPredictions)
      .catch(() => setError("No se pudieron cargar las predicciones. Verifica tu conexión con el servidor."))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete() {
    if (!deletePred) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await predictionService.remove(deletePred.id);
      setPredictions((prev) => prev.filter((p) => p.id !== deletePred.id));
      setDeletePred(null);
    } catch {
      setDeleteError("No se pudo eliminar. Verifica tu conexión con el servidor.");
    } finally {
      setDeleting(false);
    }
  }

  const filtered = (Array.isArray(predictions) ? predictions : []).filter((p) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      formatId(p.id).toLowerCase().includes(q) ||
      getCoupleName(p).toLowerCase().includes(q) ||
      getCoupleId(p).toLowerCase().includes(q) ||
      p.riskLevel?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="predictions-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1>Predicciones Registradas</h1>
          <p>Gestiona y visualiza todas las predicciones del sistema ML</p>
        </div>
        <button className="btn-primary" id="btn-nueva-prediccion" onClick={onNewPrediction}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nueva Predicción
        </button>
      </div>

      {/* Toolbar */}
      <div className="predictions-toolbar">
        <div className="search-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="predictions-search"
            type="text"
            className="search-input"
            placeholder="Buscar por nombre, ID de pareja o nivel de riesgo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Summary */}
      {!loading && !error && (
        <div className="predictions-summary">
          <span className="summary-count">
            <strong>{filtered.length}</strong> de {predictions.length} predicción{predictions.length !== 1 ? "es" : ""}
          </span>
        </div>
      )}

      {/* Table Card */}
      <div className="predictions-table-card">
        {loading && (
          <div className="table-loading">
            <div className="spinner" />
            Cargando predicciones…
          </div>
        )}

        {error && !loading && (
          <div className="table-error">
            <svg style={{ width: 32, height: 32, margin: "0 auto 12px", display: "block" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="table-empty">
            <svg className="table-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            <h3>{search ? "Sin resultados" : "Sin predicciones"}</h3>
            <p>{search ? `No hay predicciones que coincidan con "${search}".` : "No se han registrado predicciones aún."}</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <table className="predictions-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Pareja / Pacientes</th>
                <th>Fecha</th>
                <th>Nivel de Riesgo</th>
                <th>Probabilidad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((pred) => {
                const probCls = getProbabilityClass(pred.riskLevel);
                const probPct = getProbabilityPercent(pred.probability);
                return (
                  <tr key={pred.id}>
                    <td>
                      <span className="pred-id">{formatId(pred.id)}</span>
                    </td>
                    <td>
                      <div className="couple-cell">
                        <span className="couple-cell-main">{getCoupleName(pred)}</span>
                        <span className="couple-cell-sub">{getCoupleId(pred)}</span>
                      </div>
                    </td>
                    <td>
                      <span className="date-cell">{formatDate(pred.date)}</span>
                    </td>
                    <td>
                      <RiskBadge level={pred.riskLevel} />
                    </td>
                    <td>
                      <div className="prob-cell">
                        <div className="prob-bar-track">
                          <div
                            className={`prob-bar-fill ${probCls}`}
                            style={{ width: `${probPct}%` }}
                          />
                        </div>
                        <span className="prob-value">{formatProbability(pred.probability)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="action-cell">
                        <button
                          className="action-btn action-btn--view"
                          title="Visualizar predicción"
                          onClick={() => setViewPred(pred)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                        <button
                          className="action-btn action-btn--edit"
                          title="Editar predicción"
                          onClick={() => onEditPrediction?.(pred)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          className="action-btn action-btn--delete"
                          title="Eliminar predicción"
                          onClick={() => { setDeleteError(null); setDeletePred(pred); }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6" /><path d="M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {viewPred && <ViewModal pred={viewPred} onClose={() => setViewPred(null)} />}
      {deletePred && (
        <DeleteModal
          pred={deletePred}
          deleting={deleting}
          error={deleteError}
          onConfirm={handleDelete}
          onCancel={() => { setDeletePred(null); setDeleteError(null); }}
        />
      )}
    </div>
  );
}
