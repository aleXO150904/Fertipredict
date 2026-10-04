from pathlib import Path
import os
from model_runtime import ModelRuntime
from fastapi import FastAPI
from fastapi.responses import FileResponse
from pydantic import BaseModel
import joblib
import numpy as np
import shap
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware

#Para consumir la API
app = FastAPI(title="FertiPredict ML API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # o ["null"] si abres el HTML como archivo local
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def serve_frontend():
    return FileResponse(BASE_DIR / "index.html")

# Paths are resolved relative to this service, independent of the launch directory.
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / os.getenv("MODEL_PATH", "model_ensemble.pkl")
BACKGROUND_PATH = BASE_DIR / os.getenv("BACKGROUND_PATH", "background_data.pkl")
model = joblib.load(MODEL_PATH)
background = (pd.read_json(BACKGROUND_PATH, orient="split")
              if BACKGROUND_PATH.suffix == ".json" else joblib.load(BACKGROUND_PATH))
runtime = ModelRuntime(model, background)

@app.get("/ping")
def ping():
    from fastapi.responses import PlainTextResponse
    return PlainTextResponse("pong")

class PredictionInput(BaseModel):
    Edad_Masculino: int
    IMC_Masculino: float
    Concentracion_Esperma: float
    Motilidad_Espermatica: float
    Morfologia_Espermatica: float
    Varicocele: int
    Exposicion_Toxicos_Calor_Masculino: int
    Fumador_Masculino: int
    Consumo_Alcohol_Masculino: int
    Nivel_Ejercicio_Masculino: int
    Tipo_Alimentacion_Masculino: int
    Historial_Familiar_Infertilidad_Masculino: int

    Edad_Femenino: int
    IMC_Femenino: float
    Ciclo_Menstrual: int
    PCOS: int
    Endometriosis: int
    Hormona_AMH: float
    Hormona_FSH: float
    Obstruccion_Tubaria: int
    Abortos_Previos: int
    Fumador_Femenino: int
    Consumo_Alcohol_Femenino: int
    Nivel_Ejercicio_Femenino: int
    Tipo_Alimentacion_Femenino: int
    Historial_Familiar_Infertilidad_Femenino: int


@app.post("/predict")
def predict(data: PredictionInput):
    # Construir el DataFrame con los nombres exactos que espera el modelo
    input_dict = {
        "Edad_Masculino": data.Edad_Masculino,
        "IMC_Masculino": data.IMC_Masculino,
        "Concentracion_Esperma": data.Concentracion_Esperma,
        "Motilidad_Espermatica": data.Motilidad_Espermatica,
        "Morfologia_Espermatica": data.Morfologia_Espermatica,
        "Varicocele": data.Varicocele,
        "Exposicion_Toxicos_Calor_Masculino": data.Exposicion_Toxicos_Calor_Masculino,
        "Fumador_Masculino": data.Fumador_Masculino,
        "Consumo_Alcohol_Masculino": data.Consumo_Alcohol_Masculino,
        "Nivel_Ejercicio_Masculino": data.Nivel_Ejercicio_Masculino,
        "Tipo_Alimentacion_Masculino": data.Tipo_Alimentacion_Masculino,
        "Historial_Familiar_Infertilidad_Masculino": data.Historial_Familiar_Infertilidad_Masculino,

        "Edad_Femenino": data.Edad_Femenino,
        "IMC_Femenino": data.IMC_Femenino,
        "Ciclo_Menstrual": data.Ciclo_Menstrual,
        "PCOS": data.PCOS,
        "Endometriosis": data.Endometriosis,
        "Hormona_Antimulleriana_(amh)": data.Hormona_AMH,
        "hormona_foliculoestimulante_(fsh)": data.Hormona_FSH,
        "Obstruccion_Tubaria": data.Obstruccion_Tubaria,
        "Abortos_Previos": data.Abortos_Previos,
        "Fumador_Femenino": data.Fumador_Femenino,
        "Consumo_Alcohol_Femenino": data.Consumo_Alcohol_Femenino,
        "Nivel_Ejercicio_Femenino": data.Nivel_Ejercicio_Femenino,
        "Tipo_Alimentacion_Femenino": data.Tipo_Alimentacion_Femenino,
        "Historial_Familiar_Infertilidad_Femenino": data.Historial_Familiar_Infertilidad_Femenino
    }
    return runtime.predict(input_dict)

@app.get("/health")
def health_check():
    return {"status": "ok"}

#Comandos para levantar la FastAPI
#venv\Scripts\activate
#uvicorn main:app --reload --port 8000

#Comandos para levantar la FastAPI
#venv\Scripts\activate
#uvicorn main:app --reload --port 8000