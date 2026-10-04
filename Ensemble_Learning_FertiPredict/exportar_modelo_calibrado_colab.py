# Copia esta celda al final de TU notebook en Colab, en la misma sesión
# donde se haya ejecutado model_calibrated.fit(X_train_cv, y_train_cv).
# No vuelve a entrenar ni exporta el modelo antiguo.
from pathlib import Path
from importlib.metadata import version
import hashlib
import json
import platform
import tempfile
import zipfile
import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.utils.validation import check_is_fitted

if "model_calibrated" not in globals() or "X_train_cv" not in globals():
    raise RuntimeError("Ejecuta primero las celdas de preparación y entrenamiento del modelo calibrado en esta sesión de Colab.")
if not isinstance(model_calibrated, CalibratedClassifierCV):
    raise TypeError("model_calibrated no es el clasificador calibrado esperado.")
check_is_fitted(model_calibrated)
features = list(X_train_cv.columns)
if len(features) != 26 or len(set(features)) != 26:
    raise ValueError("Se esperaban 26 variables clínicas distintas; revisar esquema antes de exportar.")
if hasattr(model_calibrated, "feature_names_in_") and list(model_calibrated.feature_names_in_) != features:
    raise ValueError("El orden de las variables no coincide con el entrenamiento.")
classes = [int(value) for value in model_calibrated.classes_]
if set(classes) != {0, 1, 2}:
    raise ValueError("Clases inesperadas: confirmar la correspondencia Bajo=0, Medio=1, Alto=2.")

# Referencia agregada para preparar SHAP, sin exportar filas de pacientes.
# Es una mediana por variable, no un caso clínico real ni una muestra poblacional.
baseline = X_train_cv[features].median().to_frame().T[features]
if not np.isfinite(baseline.to_numpy(dtype=float)).all():
    raise ValueError("La referencia contiene valores no numéricos o ausentes.")
probabilities = np.asarray(model_calibrated.predict_proba(baseline), dtype=float)
if probabilities.shape != (1, 3) or not np.isfinite(probabilities).all():
    raise ValueError("La salida predict_proba no tiene el formato esperado.")
if (probabilities < 0).any() or (probabilities > 1).any() or not np.allclose(probabilities.sum(axis=1), 1):
    raise ValueError("Probabilidades inválidas.")

packages = ["scikit-learn", "imbalanced-learn", "numpy", "scipy", "pandas", "joblib", "xgboost", "catboost", "lightgbm", "shap"]
versions = {package: version(package) for package in packages}
with tempfile.TemporaryDirectory() as directory:
    folder = Path(directory)
    artifact = folder / "model_calibrated.joblib"
    joblib.dump(model_calibrated, artifact, compress=3)
    restored = joblib.load(artifact)  # Solo el archivo que acabamos de generar.
    np.testing.assert_allclose(restored.predict_proba(baseline), probabilities, rtol=1e-10, atol=1e-12)
    metadata = {
        "model_version": "v2.1-smote-cv-calibrated",
        "python_version": platform.python_version(),
        "features": features,
        "classes": classes,
        "class_labels": {"0": "LOW", "1": "MODERATE", "2": "HIGH"},
        "probability_output": "predict_proba gives fractions; API probability must be P(HIGH) * 100",
        "calibration_method": model_calibrated.method,
        "dependencies": versions,
        "model_sha256": hashlib.sha256(artifact.read_bytes()).hexdigest(),
        "explanation_reference": "per-feature training median; not individual patient records",
        "smoke_test_probabilities": probabilities[0].tolist(),
        "smoke_test_class": int(model_calibrated.predict(baseline)[0]),
    }
    (folder / "metadata.json").write_text(json.dumps(metadata, indent=2, ensure_ascii=False), encoding="utf-8")
    (folder / "explanation_reference.json").write_text(baseline.to_json(orient="split"), encoding="utf-8")
    (folder / "requirements-model.txt").write_text("\n".join(f"{name}=={value}" for name, value in versions.items()) + "\n", encoding="utf-8")
    output = Path("/content/fertipredict_model_v2_1.zip")
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as archive:
        for file in folder.iterdir():
            archive.write(file, file.name)

print("Exportación verificada:", output)
print("Modelo:", metadata["model_version"], "| Variables:", len(features), "| Clases:", classes)
print("Descarga el ZIP y compártelo para adaptar y probar FastAPI antes de desplegar.")
from google.colab import files
files.download(str(output))
