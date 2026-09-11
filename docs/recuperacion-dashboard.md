# Recuperación de contraseña y dashboard

## Funciones implementadas

- Botón «¿Olvidaste tu contraseña?» en el acceso y formulario de correo.
- Enlace al frontend `https://fertipredict.vercel.app/` con token aleatorio, almacenado como SHA-256, válido durante 20 minutos y de un solo uso.
- Envío al correo registrado en `users.username`. El endpoint responde igual exista o no la cuenta. Se limita el envío a una solicitud por minuto por cuenta y se procesa en una cola limitada.
- Nueva contraseña de al menos 12 caracteres, confirmación y límite de 72 bytes compatible con BCrypt. Las sesiones JWT anteriores pierden validez después del restablecimiento.
- Filtros del dashboard: últimos 7, 30 o 90 días, mes actual, últimos seis meses, año actual e intervalo personalizado.
- Las cuatro consultas del dashboard reciben las mismas fechas. El día final se incluye por completo, y las comparaciones usan el intervalo anterior de igual duración.
- Detalles interactivos en líneas, barras y sectores al pasar el cursor, hacer clic, tocar o enfocar con teclado. Tabla de valores mensuales desplegable.
- Periodos sin datos muestran un estado vacío. Se quitaron los factores de ejemplo y la «precisión» fija que no se calculaba a partir del periodo. La cuarta tarjeta muestra la proporción real de predicciones de alto riesgo.

## Activación del correo

Los correos registrados son los destinatarios. FertiPredict también necesita un remitente SMTP autorizado. No se ha configurado ni probado un proveedor real y no se han enviado correos reales.

Configurar estas variables en el alojamiento del backend Java, sin guardarlas con sus valores secretos en Git:

| Variable | Uso |
| --- | --- |
| `PASSWORD_RESET_ENABLED` | `true`, una vez configurado y verificado el remitente |
| `FRONTEND_URL` | `https://fertipredict.vercel.app/` (valor predeterminado) |
| `MAIL_FROM` | Dirección de envío autorizada por el proveedor |
| `SMTP_HOST` | Servidor de correo del proveedor |
| `SMTP_PORT` | `587` por defecto, con STARTTLS |
| `SMTP_USERNAME` | Usuario SMTP |
| `SMTP_PASSWORD` | Credencial SMTP guardada como secreto del alojamiento |
| `SMTP_AUTH` / `SMTP_STARTTLS` | `true` por defecto |

Si faltan los ajustes, la recuperación devuelve un error de disponibilidad, en lugar de fingir que el correo se envió. Si el proveedor rechaza un envío ya aceptado en la cola, el backend registra el fallo sin incluir destinatarios ni tokens; el usuario puede volver a solicitarlo pasado un minuto. La cola está en memoria: solicitudes pendientes pueden perderse si el contenedor se reinicia.

El flujo usa la autenticación propia de Spring; no llama a Supabase Auth porque las cuentas existentes se guardan en la tabla `users` de la aplicación.

## Base de datos y despliegue

Se agregan cuatro columnas a `users`: `reset_token_hash`, `reset_token_expires_at`, `reset_requested_at` y `credentials_version`. La configuración actual usa Hibernate `ddl-auto=update`; para despliegues con migraciones controladas se incluye `password-reset-schema.sql`, idempotente para PostgreSQL. No se ejecutó contra Supabase.

Publicar backend y frontend juntos: la respuesta de métricas ahora usa `predictionsInPeriod` y `highRiskPercentage` en lugar de los valores anteriores ligados a un mes y una precisión fija. FastAPI no necesita cambios para estas funciones.

## Validación

- Compilación de frontend con TypeScript/Vite.
- Compilación de backend Java.
- Diez pruebas automatizadas: tokens, caducidad, reutilización, sesión anterior, contraseñas inválidas, falta de configuración, intervalos inclusivos, cruce de año, comparación anterior y ausencia de SHAP.
- Comprobación en navegador local con API simulada: navegación de recuperación, confirmación genérica, enlace de nueva contraseña, selección de periodo, envío de fechas en las cuatro consultas y detalle de los tres gráficos. Se revisó el contraste claro y la pantalla de recuperación oscura.

Pendiente: despliegue real y prueba de entrega de correo con un remitente configurado. No se ejecutó la prueba genérica `contextLoads`, que depende del entorno de base de datos del proyecto; las pruebas de esta intervención aíslan sus dependencias.

Referencias: [recuperación de contraseña de OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html) y [correo en Spring Boot](https://docs.spring.io/spring-boot/reference/io/email.html).
