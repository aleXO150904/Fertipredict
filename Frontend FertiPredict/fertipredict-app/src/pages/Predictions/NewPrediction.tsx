import { useState, type FormEvent } from "react";
import { predictionService } from "../../services/predictionService";
import type { PredictionDTO, CoupleDTO, PatientDTO, MaleFactorsDTO, FemaleFactorsDTO } from "../../types/prediction";
import "./NewPrediction.css";

/* ── init helpers (only used for state initialization) ───── */
function boolToStr(v: boolean | null | undefined): string {
  return v == null ? "" : v ? "1" : "0";
}
function numToStr(v: number | null | undefined): string {
  return v == null ? "" : String(v);
}
function numToVal(v: number | null | undefined): number | "" {
  return v == null ? "" : v;
}

interface NewPredictionProps {
  onBack: () => void;
  predictionToEdit?: PredictionDTO;
}

export default function NewPrediction({ onBack, predictionToEdit }: NewPredictionProps) {
  const isEditing = !!predictionToEdit;
  const male = predictionToEdit?.couple?.malePatient;
  const female = predictionToEdit?.couple?.femalePatient;
  const mf = male?.maleFactors;
  const ff = female?.femaleFactors;

  // State for basic info
  const [maleName, setMaleName] = useState(male?.fullName ?? "");
  const [maleEmail, setMaleEmail] = useState(male?.email ?? "");
  const [malePhone, setMalePhone] = useState(male?.phone ?? "");
  const [femaleName, setFemaleName] = useState(female?.fullName ?? "");
  const [femaleEmail, setFemaleEmail] = useState(female?.email ?? "");
  const [femalePhone, setFemalePhone] = useState(female?.phone ?? "");

  // State for Male Factors
  const [maleAge, setMaleAge] = useState<number | "">(numToVal(male?.age));
  const [maleImc, setMaleImc] = useState<number | "">(numToVal(male?.imc));
  const [spermCount, setSpermCount] = useState<number | "">(numToVal(mf?.spermCountMPerMl));
  const [spermMotility, setSpermMotility] = useState<number | "">(numToVal(mf?.spermMotilityPct));
  const [spermMorphology, setSpermMorphology] = useState<number | "">(numToVal(mf?.spermMorphologyPct));
  const [varicocele, setVaricocele] = useState(boolToStr(mf?.varicocele));
  const [maleToxicExposure, setMaleToxicExposure] = useState(boolToStr(mf?.heatToxicExposure));
  const [maleSmoker, setMaleSmoker] = useState(boolToStr(male?.smoker));
  const [maleAlcohol, setMaleAlcohol] = useState(numToStr(male?.alcoholConsumption));
  const [maleExercise, setMaleExercise] = useState(numToStr(male?.exerciseLevel));
  const [maleDiet, setMaleDiet] = useState(numToStr(male?.dietType));
  const [maleFamilyHistory, setMaleFamilyHistory] = useState(boolToStr(mf?.familyInfertilityHistory));

  // State for Female Factors
  const [femaleAge, setFemaleAge] = useState<number | "">(numToVal(female?.age));
  const [femaleImc, setFemaleImc] = useState<number | "">(numToVal(female?.imc));
  const [periodRegularity, setPeriodRegularity] = useState(boolToStr(ff?.periodRegularity));
  const [pcos, setPcos] = useState(boolToStr(ff?.pcos));
  const [endometriosis, setEndometriosis] = useState(boolToStr(ff?.endometriosis));
  const [amh, setAmh] = useState<number | "">(numToVal(ff?.amh));
  const [fsh, setFsh] = useState<number | "">(numToVal(ff?.fsh));
  const [tubalObstruction, setTubalObstruction] = useState(boolToStr(ff?.tubalObstruction));
  const [abortions, setAbortions] = useState<number | "">(numToVal(ff?.previousAbortions));
  const [femaleSmoker, setFemaleSmoker] = useState(boolToStr(female?.smoker));
  const [femaleAlcohol, setFemaleAlcohol] = useState(numToStr(female?.alcoholConsumption));
  const [femaleExercise, setFemaleExercise] = useState(numToStr(female?.exerciseLevel));
  const [femaleDiet, setFemaleDiet] = useState(numToStr(female?.dietType));
  const [femaleFamilyHistory, setFemaleFamilyHistory] = useState(boolToStr(ff?.familyInfertilityHistory));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ riskLevel: string; probability: number; explanation?: Record<string, number> } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!maleName || !femaleName || !maleEmail || !femaleEmail) {
      setError("Por favor, completa los nombres y correos de la pareja.");
      return;
    }

    setLoading(true);

    try {
      const maleFactors: MaleFactorsDTO = {
        spermCountMPerMl: spermCount === "" ? null : Number(spermCount),
        spermMotilityPct: spermMotility === "" ? null : Number(spermMotility),
        spermMorphologyPct: spermMorphology === "" ? null : Number(spermMorphology),
        varicocele: varicocele === "" ? null : (varicocele === "1"),
        heatToxicExposure: maleToxicExposure === "" ? null : (maleToxicExposure === "1"),
        familyInfertilityHistory: maleFamilyHistory === "" ? null : (maleFamilyHistory === "1"),
      };

      const malePatient: PatientDTO = {
        fullName: maleName,
        email: maleEmail,
        phone: malePhone,
        sex: 'M',
        age: maleAge === "" ? null : Number(maleAge),
        imc: maleImc === "" ? null : Number(maleImc),
        smoker: maleSmoker === "" ? null : (maleSmoker === "1"),
        alcoholConsumption: maleAlcohol === "" ? null : Number(maleAlcohol),
        exerciseLevel: maleExercise === "" ? null : Number(maleExercise),
        dietType: maleDiet === "" ? null : Number(maleDiet),
        maleFactors: maleFactors,
      };

      const femaleFactors: FemaleFactorsDTO = {
        pcos: pcos === "" ? null : (pcos === "1"),
        periodRegularity: periodRegularity === "" ? null : (periodRegularity === "1"),
        previousAbortions: abortions === "" ? null : Number(abortions),
        endometriosis: endometriosis === "" ? null : (endometriosis === "1"),
        amh: amh === "" ? null : Number(amh),
        fsh: fsh === "" ? null : Number(fsh),
        tubalObstruction: tubalObstruction === "" ? null : (tubalObstruction === "1"),
        familyInfertilityHistory: femaleFamilyHistory === "" ? null : (femaleFamilyHistory === "1"),
      };

      const femalePatient: PatientDTO = {
        fullName: femaleName,
        email: femaleEmail,
        phone: femalePhone,
        sex: 'F',
        age: femaleAge === "" ? null : Number(femaleAge),
        imc: femaleImc === "" ? null : Number(femaleImc),
        smoker: femaleSmoker === "" ? null : (femaleSmoker === "1"),
        alcoholConsumption: femaleAlcohol === "" ? null : Number(femaleAlcohol),
        exerciseLevel: femaleExercise === "" ? null : Number(femaleExercise),
        dietType: femaleDiet === "" ? null : Number(femaleDiet),
        femaleFactors: femaleFactors,
      };

      const couple: CoupleDTO = {
        id: predictionToEdit?.couple?.id ?? 0,
        malePatient,
        femalePatient,
      };

      const res = isEditing
        ? await predictionService.update(predictionToEdit!.id, { couple })
        : await predictionService.create({ couple });

      setResult({ riskLevel: res.riskLevel, probability: res.probability, explanation: res.explanation });
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err: any) {
      setError(
        isEditing
          ? "Error al actualizar predicción: Verifica tu conexión al modelo ML y backend."
          : "Error al registrar predicción: Verifica tu conexión al modelo ML y backend."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function getRiskText(level: string) {
    const l = level.toUpperCase();
    if (l === 'HIGH') return "Alto";
    if (l === 'MEDIUM' || l === 'MODERATE') return "Moderado";
    if (l === 'LOW') return "Bajo";
    return level;
  }

  function getRiskClass(level: string) {
    const l = level.toUpperCase();
    if (l === 'HIGH') return "result-high";
    if (l === 'MEDIUM' || l === 'MODERATE') return "result-mod";
    if (l === 'LOW') return "result-low";
    return "";
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

  function getInterpretation(riskLevel: string, probability: number) {
    const pct = probability * (probability <= 1 ? 100 : 1);
    const level = riskLevel.toUpperCase();

    if (level === "LOW") {
      return `Con un ${pct.toFixed(1)}% de probabilidad de riesgo alto, la pareja presenta indicadores clínicos favorables. La posibilidad de infertilidad es baja y no se requieren intervenciones inmediatas.`;
    }
    if (level === "MODERATE" || level === "MEDIUM") {
      return `Con un ${pct.toFixed(1)}% de probabilidad de riesgo alto, la pareja presenta factores de riesgo moderados. Se recomienda evaluación más detallada y posible intervención clínica.`;
    }
    if (level === "HIGH") {
      return `Con un ${pct.toFixed(1)}% de probabilidad de riesgo alto, el modelo identifica un perfil de alto riesgo de infertilidad. Se recomienda evaluación especializada prioritaria.`;
    }
    return `El modelo predice un ${pct.toFixed(1)}% de probabilidad de riesgo alto.`;
  }

  return (
    <div className="new-prediction-page">
      <div className="page-header">
        <div className="page-header-text">
          <button type="button" className="btn-back" onClick={onBack}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Volver
          </button>
          <h1 style={{ marginTop: '16px' }}>{isEditing ? "Editar Predicción" : "Nueva Predicción"}</h1>
          <p>{isEditing ? "Actualiza los datos clínicos y recalcula la predicción" : "Registra una nueva evaluación clínica para la pareja"}</p>
        </div>
      </div>

      {result && (
        <div className={`prediction-result-banner ${getRiskClass(result.riskLevel)}`}>
          <div className="result-top">
            <span className="result-badge">{getRiskText(result.riskLevel)}</span>
            <span className="result-label">{isEditing ? "Predicción Actualizada" : "Predicción Completada"}</span>
          </div>
          <div className="result-prob" style={{ marginBottom: '12px' }}>
            Probabilidad de infertilidad: <strong>{(result.probability * (result.probability <= 1 ? 100 : 1)).toFixed(1)}%</strong>
          </div>

          <p className="result-interpretation" style={{ marginBottom: '16px' }}>
            {getInterpretation(result.riskLevel, result.probability)}
          </p>

          {result.explanation && getTop5(result.explanation).length > 0 && (
            <div className="shap-section" style={{ marginBottom: '16px' }}>
              <div className="shap-title">Top 5 factores más influyentes en esta predicción</div>
              {getTop5(result.explanation).map(([feature, value]) => {
                const maxAbs = Math.abs(getTop5(result.explanation)[0][1]);
                const pct = (Math.abs(value) / maxAbs) * 100;
                const isPositive = value >= 0;
                const label = FEATURE_LABELS[feature] || feature;
                return (
                  <div className="shap-row" key={feature}>
                    <div className="shap-label" title={label}>{label}</div>
                    <div className="shap-bar-wrap">
                      <div
                        className={`shap-bar ${isPositive ? "positive" : "negative"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className={`shap-value ${isPositive ? "positive" : "negative"}`}>
                      {isPositive ? "+" : ""}{value.toFixed(4)}
                    </div>
                    <div className={`shap-dir ${isPositive ? "positive" : "negative"}`}>
                      {isPositive ? "↑ aumenta riesgo" : "↓ reduce riesgo"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button type="button" className="btn-predict" onClick={onBack} style={{ padding: '10px 20px', fontSize: '14px' }}>
            Ver en la Tabla de Predicciones
          </button>
        </div>
      )}

      <form className="prediction-form" onSubmit={handleSubmit}>

        {/* Datos Generales */}
        <div className="section-card">
          <div className="section-header">
            <div className="section-dot dot-couple"></div>
            <h3>Datos Generales de la Pareja</h3>
          </div>

          <div className="subsection">
            <h4 className="subsection-title">Paciente Masculino</h4>
            <div className="fields-grid">
              <div className="field">
                <label>Nombre Completo *</label>
                <input type="text" value={maleName} onChange={e=>setMaleName(e.target.value)} required placeholder="Ej. Alejandro Alberto" />
              </div>
              <div className="field">
                <label>Correo Electrónico *</label>
                <input type="email" value={maleEmail} onChange={e=>setMaleEmail(e.target.value)} required placeholder="ejemplo@correo.com" />
              </div>
              <div className="field">
                <label>Teléfono</label>
                <input type="text" value={malePhone} onChange={e=>setMalePhone(e.target.value)} placeholder="Ej. 912345678" />
              </div>
            </div>
          </div>

          <div className="subsection" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
            <h4 className="subsection-title">Paciente Femenino</h4>
            <div className="fields-grid">
              <div className="field">
                <label>Nombre Completo *</label>
                <input type="text" value={femaleName} onChange={e=>setFemaleName(e.target.value)} required placeholder="Ej. María González" />
              </div>
              <div className="field">
                <label>Correo Electrónico *</label>
                <input type="email" value={femaleEmail} onChange={e=>setFemaleEmail(e.target.value)} required placeholder="ejemplo@correo.com" />
              </div>
              <div className="field">
                <label>Teléfono</label>
                <input type="text" value={femalePhone} onChange={e=>setFemalePhone(e.target.value)} placeholder="Ej. 912345678" />
              </div>
            </div>
          </div>
        </div>

        {/* Factores Masculinos */}
        <div className="section-card">
          <div className="section-header">
            <div className="section-dot dot-male"></div>
            <h3>Factores del Paciente Masculino</h3>
          </div>
          <div className="fields-grid">
            <div className="field">
              <label>Edad (años) *</label>
              <input type="number" min="18" max="80" value={maleAge} onChange={e=>setMaleAge(e.target.value ? Number(e.target.value) : "")} required placeholder="Ej. 34" />
            </div>
            <div className="field">
              <label>IMC *</label>
              <input type="number" step="0.1" value={maleImc} onChange={e=>setMaleImc(e.target.value ? Number(e.target.value) : "")} required placeholder="Ej. 24.5" />
            </div>
            <div className="field">
              <label>Concentración Esperma *</label>
              <input type="number" step="0.1" value={spermCount} onChange={e=>setSpermCount(e.target.value ? Number(e.target.value) : "")} required placeholder="Ej. 40.0" />
            </div>
            <div className="field">
              <label>Motilidad Esperm. (%) *</label>
              <input type="number" step="0.1" value={spermMotility} onChange={e=>setSpermMotility(e.target.value ? Number(e.target.value) : "")} required placeholder="Ej. 40" />
            </div>
            <div className="field">
              <label>Morfología Esperm. (%) *</label>
              <input type="number" step="0.1" value={spermMorphology} onChange={e=>setSpermMorphology(e.target.value ? Number(e.target.value) : "")} required placeholder="Ej. 4" />
            </div>
            <div className="field">
              <label>Varicocele *</label>
              <select value={varicocele} onChange={e=>setVaricocele(e.target.value)} required>
                <option value="">Seleccionar…</option><option value="1">Sí</option><option value="0">No</option>
              </select>
            </div>
            <div className="field">
              <label>Exp. a Tóxicos *</label>
              <select value={maleToxicExposure} onChange={e=>setMaleToxicExposure(e.target.value)} required>
                <option value="">Seleccionar…</option><option value="1">Expuesto</option><option value="0">No Expuesto</option>
              </select>
            </div>
            <div className="field">
              <label>Fumador *</label>
              <select value={maleSmoker} onChange={e=>setMaleSmoker(e.target.value)} required>
                <option value="">Seleccionar…</option><option value="1">Sí</option><option value="0">No</option>
              </select>
            </div>
            <div className="field">
              <label>Consumo Alcohol *</label>
              <select value={maleAlcohol} onChange={e=>setMaleAlcohol(e.target.value)} required>
                <option value="">Seleccionar…</option><option value="0">Nunca</option><option value="1">Ocasional</option><option value="2">Frecuente</option><option value="3">Diario</option>
              </select>
            </div>
            <div className="field">
              <label>Ejercicio *</label>
              <select value={maleExercise} onChange={e=>setMaleExercise(e.target.value)} required>
                <option value="">Seleccionar…</option><option value="0">Sedentario</option><option value="1">Leve</option><option value="2">Moderado</option><option value="3">Intenso</option>
              </select>
            </div>
            <div className="field">
              <label>Tipo Dieta *</label>
              <select value={maleDiet} onChange={e=>setMaleDiet(e.target.value)} required>
                <option value="">Seleccionar…</option><option value="0">Deficiente</option><option value="1">Regular</option><option value="2">Saludable</option>
              </select>
            </div>
            <div className="field">
              <label>Historial Infertilidad *</label>
              <select value={maleFamilyHistory} onChange={e=>setMaleFamilyHistory(e.target.value)} required>
                <option value="">Seleccionar…</option><option value="0">No presenta</option><option value="1">Sí presenta</option>
              </select>
            </div>
          </div>
        </div>

        {/* Factores Femeninos */}
        <div className="section-card">
          <div className="section-header">
            <div className="section-dot dot-female"></div>
            <h3>Factores del Paciente Femenino</h3>
          </div>
          <div className="fields-grid">
            <div className="field">
              <label>Edad (años) *</label>
              <input type="number" min="18" max="60" value={femaleAge} onChange={e=>setFemaleAge(e.target.value ? Number(e.target.value) : "")} required placeholder="Ej. 31" />
            </div>
            <div className="field">
              <label>IMC *</label>
              <input type="number" step="0.1" value={femaleImc} onChange={e=>setFemaleImc(e.target.value ? Number(e.target.value) : "")} required placeholder="Ej. 22.5" />
            </div>
            <div className="field">
              <label>Ciclo Menstrual *</label>
              <select value={periodRegularity} onChange={e=>setPeriodRegularity(e.target.value)} required>
                <option value="">Seleccionar…</option><option value="1">Regular</option><option value="0">Irregular</option>
              </select>
            </div>
            <div className="field">
              <label>PCOS (SOP) *</label>
              <select value={pcos} onChange={e=>setPcos(e.target.value)} required>
                <option value="">Seleccionar…</option><option value="1">Sí</option><option value="0">No</option>
              </select>
            </div>
            <div className="field">
              <label>Endometriosis *</label>
              <select value={endometriosis} onChange={e=>setEndometriosis(e.target.value)} required>
                <option value="">Seleccionar…</option><option value="1">Sí</option><option value="0">No</option>
              </select>
            </div>
            <div className="field">
              <label>Hormona AMH *</label>
              <input type="number" step="0.1" value={amh} onChange={e=>setAmh(e.target.value ? Number(e.target.value) : "")} required placeholder="Ej. 2.5" />
            </div>
            <div className="field">
              <label>Hormona FSH *</label>
              <input type="number" step="0.1" value={fsh} onChange={e=>setFsh(e.target.value ? Number(e.target.value) : "")} required placeholder="Ej. 6.0" />
            </div>
            <div className="field">
              <label>Obstrucción Tubaria *</label>
              <select value={tubalObstruction} onChange={e=>setTubalObstruction(e.target.value)} required>
                <option value="">Seleccionar…</option><option value="1">Sí</option><option value="0">No</option>
              </select>
            </div>
            <div className="field">
              <label>Abortos Previos *</label>
              <input type="number" value={abortions} onChange={e=>setAbortions(e.target.value ? Number(e.target.value) : "")} required placeholder="Ej. 0" />
            </div>
            <div className="field">
              <label>Fumadora *</label>
              <select value={femaleSmoker} onChange={e=>setFemaleSmoker(e.target.value)} required>
                <option value="">Seleccionar…</option><option value="1">Sí</option><option value="0">No</option>
              </select>
            </div>
            <div className="field">
              <label>Consumo Alcohol *</label>
              <select value={femaleAlcohol} onChange={e=>setFemaleAlcohol(e.target.value)} required>
                <option value="">Seleccionar…</option><option value="0">Nunca</option><option value="1">Ocasional</option><option value="2">Frecuente</option><option value="3">Diario</option>
              </select>
            </div>
            <div className="field">
              <label>Ejercicio *</label>
              <select value={femaleExercise} onChange={e=>setFemaleExercise(e.target.value)} required>
                <option value="">Seleccionar…</option><option value="0">Sedentario</option><option value="1">Leve</option><option value="2">Moderado</option><option value="3">Intenso</option>
              </select>
            </div>
            <div className="field">
              <label>Tipo Dieta *</label>
              <select value={femaleDiet} onChange={e=>setFemaleDiet(e.target.value)} required>
                <option value="">Seleccionar…</option><option value="0">Deficiente</option><option value="1">Regular</option><option value="2">Saludable</option>
              </select>
            </div>
            <div className="field">
              <label>Historial Infertilidad *</label>
              <select value={femaleFamilyHistory} onChange={e=>setFemaleFamilyHistory(e.target.value)} required>
                <option value="">Seleccionar…</option><option value="0">No presenta</option><option value="1">Sí presenta</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        <div className="action-row">
          <button type="submit" className="btn-predict" disabled={loading}>
            {loading ? (
              <><span className="spinner-small" /> {isEditing ? "Actualizando…" : "Procesando con ML..."}</>
            ) : (
              <><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg> {isEditing ? "Actualizar Predicción" : "Generar Predicción"}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}