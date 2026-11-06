# Fechas de predicciones — cambio del 6 de noviembre de 2026

Las predicciones nuevas guardan `created_at` como Instant en una columna PostgreSQL
`timestamp with time zone`. La API entrega `createdAt` en UTC y `date` en ISO 8601
con desplazamiento de Lima (por ejemplo `2026-11-01T21:35:39-05:00`). El navegador,
el PDF y Excel presentan la hora en America/Lima, independientemente de la zona
del servidor o del equipo del usuario.

`updated_at` guarda el instante de la última edición. Editar ya no sustituye la
fecha de creación. Estas columnas registran creación y última edición, no un
historial completo de todas las modificaciones ni quién realizó cada cambio.

La columna anterior `date` se conserva. En registros nuevos contiene la fecha
local de Lima derivada del mismo instante de creación, para los filtros y la
agrupación mensual del dashboard. La validación de fechas futuras usa el día de Lima.

## Registros anteriores

No se aplica ninguna conversión automática ni backfill. `created_at` y
`updated_at` quedan nulos para filas históricas hasta que corresponda una edición
(que solo registra `updated_at`). La fecha anterior se muestra con la advertencia
«zona horaria no registrada». Sus agrupaciones históricas siguen usando esa fecha
original, que puede no corresponder al día de Lima.

El código anterior sobrescribía `date` al editar: no se puede reconstruir la
creación original únicamente a partir de esa columna. Antes de corregir un
registro histórico, contrastar logs, backups y zona horaria del proceso que lo
guardó; documentar evidencia, valor anterior y valor corregido. No asumir UTC para
todos los registros ni restar cinco horas masivamente.

## Despliegue y comprobación

Desplegar primero el backend y después el frontend. El proyecto tiene
`spring.jpa.hibernate.ddl-auto=update`: Hibernate debe añadir las dos columnas
nulables sin modificar `date`. Comprobar el resultado en la base desplegada:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'predictions'
  AND column_name IN ('date', 'created_at', 'updated_at');
```

Tras crear una predicción de prueba autorizada, verificar `createdAt` con `Z`,
`date` con `-05:00` y `dateTimeZone = America/Lima`. Al editarla, `createdAt`
y `date` deben permanecer iguales y `updatedAt` debe cambiar. Confirmar que
tabla, PDF y Excel muestran la misma hora de Lima. El instante UTC
`2026-11-02T02:35:39Z` debe mostrarse como `01/11/2026, 21:35:39`.

No se ha accedido a la base de producción ni desplegado este cambio desde la tarea.
