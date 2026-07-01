// Tipos que coinciden con PredictionDTO, CoupleDTO, PatientDTO del backend

export interface MaleFactorsDTO {
  spermCountMPerMl: number | null;
  spermMotilityPct: number | null;
  spermMorphologyPct: number | null;
  varicocele: boolean | null;
  heatToxicExposure: boolean | null;
  familyInfertilityHistory: boolean | null;
}

export interface FemaleFactorsDTO {
  pcos: boolean | null;
  periodRegularity: boolean | null;
  previousAbortions: number | null;
  endometriosis: boolean | null;
  amh: number | null;
  fsh: number | null;
  tubalObstruction: boolean | null;
  familyInfertilityHistory: boolean | null;
}

export interface PatientDTO {
  id?: number;
  fullName: string;
  age: number | null;
  sex: string;
  email: string;
  phone: string;
  imc: number | null;
  smoker: boolean | null;
  exerciseLevel: number | null;
  alcoholConsumption: number | null;
  dietType: number | null;
  maleFactors?: MaleFactorsDTO | null;
  femaleFactors?: FemaleFactorsDTO | null;
}

export interface CoupleDTO {
  id: number;
  malePatient: PatientDTO | null;
  femalePatient: PatientDTO | null;
}

export interface PredictionDTO {
  explanation: Record<string, number> | undefined;
  id: number;
  riskLevel: string;
  probability: number;
  date: string;
  couple: CoupleDTO | null;
}
