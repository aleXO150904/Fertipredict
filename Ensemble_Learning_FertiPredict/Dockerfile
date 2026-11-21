FROM python:3.10-slim

WORKDIR /app

# Bound native math threads to avoid oversubscribing small Render instances.
ENV OMP_NUM_THREADS=1 OPENBLAS_NUM_THREADS=1 MKL_NUM_THREADS=1 NUMBA_NUM_THREADS=1

# Instalar dependencias del sistema necesarias para compilar algunas librerias (ej. numpy, shap)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY Requirements.txt .

RUN pip install --no-cache-dir -r Requirements.txt

# Copiar el código y los modelos (pkl)
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
