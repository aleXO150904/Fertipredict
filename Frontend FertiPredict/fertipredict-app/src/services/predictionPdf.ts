import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { PatientDTO, PredictionDTO } from "../types/prediction";

type Row = [string, string];
const text = (value: unknown) => value === null || value === undefined || value === "" ? "No registrado" : String(value);
const yesNo = (value: boolean | null | undefined) => value == null ? "No registrado" : value ? "Sí" : "No";
const option = (value: number | null | undefined, labels: string[]) => value == null ? "No registrado" : labels[value] ?? "No registrado";

/** The API returns probability on a 0–100 scale, including values below 1%. */
export function predictionProbability(value: number): string {
  return Number.isFinite(value) && value >= 0 && value <= 100 ? `${value.toFixed(1)}%` : "No registrado";
}

export function createPredictionPdf(pred: PredictionDTO, featureLabels: Record<string, string> = {}) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const id = `PRD-${String(pred.id).padStart(3, "0")}`;
  doc.setProperties({ title: `FertiPredict - ${id}`, author: "FertiPredict", subject: "Reporte de predicción" });
  doc.setFillColor(49, 46, 129);
  doc.rect(0, 0, 210, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold"); doc.setFontSize(19);
  doc.text("FertiPredict", 16, 14);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  doc.text(`Reporte de predicción | ${id}`, 16, 24);
  doc.setFontSize(8);
  doc.text(`Exportado: ${new Date().toLocaleString("es-PE")}`, 194, 24, { align: "right" });
  let y = 40;
  function section(title: string, rows: Row[]) {
    if (y > 245) { doc.addPage(); y = 20; }
    autoTable(doc, {
      startY: y, margin: { left: 16, right: 16, top: 20, bottom: 20 },
      head: [[{ content: title, colSpan: 2 }]], body: rows,
      theme: "striped", rowPageBreak: "avoid",
      styles: { font: "helvetica", fontSize: 9, cellPadding: 3, overflow: "linebreak", textColor: [30, 41, 59] },
      headStyles: { fillColor: [49, 46, 129], fontStyle: "bold", textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 247, 252] },
      columnStyles: { 0: { cellWidth: 65, fontStyle: "bold" }, 1: { cellWidth: 113 } },
      didDrawPage: data => { y = (data.cursor?.y ?? 20) + 9; },
    });
  }
  const date = new Date(pred.date);
  const risk: Record<string, string> = { HIGH: "Alto", MODERATE: "Medio", MEDIUM: "Medio", LOW: "Bajo", PENDING: "Pendiente" };
  section("Resultado", [
    ["ID de predicción", id], ["ID de pareja", text(pred.couple?.id)],
    ["Fecha de predicción", Number.isNaN(date.getTime()) ? "No registrada" : date.toLocaleString("es-PE")],
    ["Nivel de riesgo", risk[pred.riskLevel?.toUpperCase()] ?? text(pred.riskLevel)],
    ["Probabilidad de alto riesgo", predictionProbability(pred.probability)],
  ]);
  function patient(title: string, p: PatientDTO | null | undefined) {
    if (!p) { section(title, [["Datos del paciente", "No registrados"]]); return; }
    const rows: Row[] = [
      ["Nombre", text(p.fullName)], ["Correo electrónico", text(p.email)], ["Teléfono", text(p.phone)],
      ["Edad (años)", text(p.age)], ["IMC", text(p.imc)], ["Fumador/a", yesNo(p.smoker)],
      ["Consumo de alcohol", option(p.alcoholConsumption, ["Nunca", "Ocasional", "Frecuente", "Diario"])],
      ["Ejercicio", option(p.exerciseLevel, ["Sedentario", "Leve", "Moderado", "Intenso"])],
      ["Alimentación", option(p.dietType, ["Deficiente", "Regular", "Saludable"])],
    ];
    const m = p.maleFactors;
    if (m) rows.push(["Concentración espermática (M/mL)", text(m.spermCountMPerMl)], ["Motilidad espermática (%)", text(m.spermMotilityPct)],
      ["Morfología espermática (%)", text(m.spermMorphologyPct)], ["Varicocele", yesNo(m.varicocele)],
      ["Exposición a tóxicos/calor", yesNo(m.heatToxicExposure)], ["Historial familiar de infertilidad", yesNo(m.familyInfertilityHistory)]);
    const f = p.femaleFactors;
    if (f) rows.push(["PCOS (SOP)", yesNo(f.pcos)], ["Ciclo menstrual", f.periodRegularity == null ? "No registrado" : f.periodRegularity ? "Regular" : "Irregular"],
      ["Endometriosis", yesNo(f.endometriosis)], ["Hormona AMH", text(f.amh)], ["Hormona FSH", text(f.fsh)],
      ["Obstrucción tubárica", yesNo(f.tubalObstruction)], ["Abortos previos", text(f.previousAbortions)],
      ["Historial familiar de infertilidad", yesNo(f.familyInfertilityHistory)]);
    section(title, rows);
  }
  patient("Paciente masculino", pred.couple?.malePatient);
  patient("Paciente femenino", pred.couple?.femalePatient);
  const factors = Object.entries(pred.explanation ?? {}).filter(([, value]) => Number.isFinite(value))
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  section("Explicación del modelo (SHAP)", factors.length ? factors.map(([key, value]): Row => [featureLabels[key] ?? key, `${value > 0 ? "+" : ""}${value.toFixed(4)}`]) : [["Factores", "No hay explicación disponible"]]);
  section("Sobre este reporte", [["Interpretación", "Los valores SHAP son contribuciones a la salida del modelo para la clase predicha. No representan causalidad ni porcentajes de pacientes."],
    ["Uso del resultado", "Estimación del modelo para apoyar la evaluación profesional. No constituye un diagnóstico."]]);
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
    doc.text(`FertiPredict | ${id}`, 16, 287);
    doc.text(`Página ${page} de ${pages}`, 194, 287, { align: "right" });
  }
  return doc;
}
