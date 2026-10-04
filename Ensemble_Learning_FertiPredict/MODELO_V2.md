# Integración del modelo calibrado

El archivo model_ensemble.pkl inspeccionado es VotingClassifier, no CalibratedClassifierCV. Se mantiene como predeterminado. El 2026-10-04 se reemplazó el archivo predeterminado por el suministrado en Downloads/model_ensemble.pkl, después de comprobar tres solicitudes ASGI sintéticas. Este nuevo archivo sigue siendo VotingClassifier; no contiene model_calibrated del notebook.

La API conserva POST /predict y las entradas y salidas existentes: riskLevel, probability (P(HIGH) en porcentaje 0–100) y explanation. El adaptador respeta el orden de variables entrenadas y admite los nombres de hormonas con espacios o guiones bajos. Para el VotingClassifier se conserva la explicación original del primer árbol; para el calibrado se usa SHAP por permutaciones sobre predict_proba del modelo completo, para la clase predicha. Esta última explicación es aproximada y debe medirse en Render antes de habilitarla para todos los usuarios.

## Pendiente para activar el nuevo modelo

1. En la sesión entrenada de Colab, ejecutar el contenido de exportar_modelo_calibrado_colab.py. Este exporta model_calibrated, no el modelo antiguo que exporta la última celda del notebook.
2. Extraer el ZIP en esta carpeta. Se requieren model_calibrated.joblib, metadata.json, explanation_reference.json y requirements-model.txt.
3. Preparar un entorno con la versión de Python y las dependencias indicadas por metadata.json. Ajustar también Requirements.txt y Dockerfile para esas versiones antes de desplegar. No basta con añadir imbalanced-learn: las versiones deben coincidir con el entrenamiento.
4. Probar localmente estableciendo MODEL_PATH=model_calibrated.joblib y BACKGROUND_PATH=explanation_reference.json. Comparar probabilidades con la prueba exportada y medir tiempos de predicción/SHAP. No se necesita volver a entrenar al arrancar Render.
5. Solo después de esas pruebas, publicar los artefactos y desplegar el servicio ML existente con esas variables. Si el tamaño impide subirlos a GitHub, decidir almacenamiento de artefactos antes del despliegue.

El entorno local inspeccionado tiene scikit-learn 1.9.0 pero el pickle actual contiene estimadores de 1.6.1. Se observaron también avisos de versión de XGBoost. Un pickle que carga no garantiza equivalencia numérica entre versiones.

No se han cambiado los contratos del backend web, el frontend ni los registros históricos. No se ha desplegado nada en Render desde esta tarea.

## Sustitución local del 2026-10-04

- SHA-256 instalado: `0459f488607978a8a72904432d36631da23802e76dc94c62992e1db5cfa1f274`.
- Respaldo anterior fuera de la carpeta de despliegue: `C:\Users\Alex\Documents\Codex\2026-09-10\mira-analiza-todo-mi-c-digo\outputs\model-backups\model_ensemble-af70a484e4b68fd7b2416f38a8785024d4159ab1bcf5fb551aafd4f28abd12a5.pkl`.
- Verificación: tres POST /predict, 26 valores SHAP finitos, clase y P(HIGH) × 100 iguales a la inferencia directa, GET /ping, GET /health y entrada incompleta rechazada con 422. Resultados y avisos en model-validation-2026-10-04.json. Son pruebas técnicas con datos sintéticos, no una evaluación de exactitud clínica.
- La probabilidad conserva la semántica existente: probabilidad de clase HIGH; no representa necesariamente la confianza de la clase mostrada.
- El entorno local ejecutó correctamente las pruebas pero emitió avisos de versiones de scikit-learn (entrenamiento 1.6.1; ejecución 1.9.0) y serialización XGBoost. Falta obtener del notebook las versiones originales y comprobar resultados en el entorno de Render antes de publicar. No se cambiaron versiones a ciegas.
- Esta carpeta pertenece al repositorio Git Fertipredict. No se hizo push ni despliegue. Reiniciar la API local para cargar el archivo nuevo; si MODEL_PATH está configurado, debe apuntar a model_ensemble.pkl para usarlo.
- Para volver al modelo previo: detener la API, copiar el respaldo sobre model_ensemble.pkl y reiniciar.

## Copia al repositorio Fertipredict

Modelo y adaptador aplicados en esta carpeta. Respaldo de los archivos reemplazados: C:\Users\Alex\Documents\Codex\2026-09-10\mira-analiza-todo-mi-c-digo\outputs\fertipredict-ml-backup-20261004-032831

