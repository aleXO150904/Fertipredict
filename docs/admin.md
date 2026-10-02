# Administración

El rol ADMIN habilita «Administrar usuarios» en el menú, permite cambiar entre Médico (USER) y Administrador (ADMIN), y activar o desactivar cuentas. El registro público continúa creando solamente cuentas USER activas.

El listado de predicciones y los cuatro indicadores/gráficos del dashboard son globales para ADMIN; USER consulta únicamente sus propias predicciones. Ambos conservan los filtros y exportaciones. ADMIN puede editar y eliminar cualquier predicción; USER solo puede modificar las propias. La edición por un administrador conserva el autor original y recalcula el resultado con el modelo. La eliminación mantiene la confirmación existente en la interfaz.

Desactivar una cuenta impide iniciar sesión y bloquea sus siguientes solicitudes autenticadas. El contador credentialsVersion invalida sus tokens anteriores incluso después de reactivarla. Los roles se consultan desde la base de datos en cada solicitud. El administrador no puede desactivar ni degradar su propia cuenta. Las modificaciones administrativas se serializan con bloqueo de filas para evitar pérdida concurrente de los administradores activos.

## Publicación

### Último inicio de sesión

La tabla exclusiva de ADMIN muestra el último ingreso exitoso y los días completos (24 horas) transcurridos. La fecha se registra en el servidor como Instant UTC y se presenta en hora de Lima. Intentos fallidos, cuentas desactivadas, registro de cuentas y solicitudes de una sesión abierta no cuentan como un nuevo login. No es un indicador de presencia en línea. El contador recalcula cada minuto; «Actualizar lista» consulta nuevos ingresos registrados en el servidor.

La columna `users.last_login_at` es nullable. Hibernate ddl-auto=update la añade al desplegar; para esquemas administrados manualmente, ejecutar `Backend FertiPredict/app/migrations/last-login-schema.sql`. No se inventan datos históricos: se muestra «Sin registro» hasta el siguiente login exitoso. El dato no se incluye en UserDTO ni en la respuesta pública de autenticación.

En «Administrar usuarios», la columna «Permiso de inicio de sesión» contiene «Activar cuenta» o «Desactivar cuenta». El filtro de estado permite encontrar cuentas activas/inactivas. Cada cambio requiere confirmación y muestra su resultado. PUT /api/admin/users/{id}/access recibe únicamente {"active":true|false}; PUT /api/admin/users/{id}/role recibe únicamente {"role":"USER"|"ADMIN"}. Cambiar el acceso conserva el rol y cambiar el rol conserva el estado actual en base de datos.

La migración `Backend FertiPredict/app/migrations/user-access-schema.sql` prepara el estado de acceso y la versión de credenciales sin reactivar cuentas ya desactivadas.

Publicar backend y frontend juntos. El backend usa actualmente Hibernate ddl-auto=update y añade la columna users.active (boolean, default true). Los usuarios existentes permanecen activos; los valores nulos heredados se interpretan como activos. Si el entorno usa migraciones o desactiva ddl-auto, ejecutar previamente:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;
```

Se requiere al menos una cuenta ADMIN existente para acceder al panel. Esta implementación no cambia roles de cuentas reales ni modifica la base de producción durante el desarrollo.

Endpoints administrativos: GET /api/admin/users y PUT /api/admin/users/{id}, con cuerpo {"role":"USER"|"ADMIN", "active":true|false}. Se devuelven DTO públicos, nunca contraseñas ni tokens. Las rutas de datos requieren sesión; únicamente autenticación y los endpoints de salud permanecen públicos.
