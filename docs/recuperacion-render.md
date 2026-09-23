# Activar recuperación por correo en Render

El flujo genera enlaces personales de un solo uso que caducan a los 20 minutos. No puede entregar correos sin un proveedor y remitente autorizado. Las cuentas registradas son destinatarios, no remitentes.

## Resend por HTTPS

1. Crear una cuenta en https://resend.com e iniciar sesión.
2. Para una prueba inicial, usar el remitente de pruebas autorizado por Resend y como destinatario el correo de la propia cuenta Resend. Las restricciones del modo de pruebas impiden usarlo con todos los usuarios.
3. Para producción, añadir un dominio propio en Resend, completar su verificación DNS y elegir un remitente de ese dominio. El subdominio gratuito fertipredict.vercel.app no permite gestionar esos registros DNS. No usar una dirección @gmail.com como dominio de envío propio.
4. Crear una API key con permiso de envío. Guardarla solo como secreto del backend en Render, nunca en Vercel, GitHub o el chat.
5. En el servicio web `fertipredict` de Render, configurar Environment:

| Variable | Valor |
| --- | --- |
| MAIL_PROVIDER | resend |
| RESEND_API_KEY | Clave privada generada en Resend |
| MAIL_FROM | Remitente autorizado por Resend |
| PASSWORD_RESET_ENABLED | true |
| FRONTEND_URL | https://fertipredict.vercel.app/ |

6. Desplegar el backend con los cambios. Esta opción usa HTTPS y no necesita las variables SMTP.
7. Solicitar recuperación desde la web para una cuenta de prueba registrada y autorizada como destinataria. Comprobar los registros de entrega en Resend y la bandeja/spam; abrir el enlace, cambiar la contraseña y comprobar el acceso. Reutilizar el enlace debe fallar. No introducir correos reales de terceros en pruebas.

La respuesta del formulario no confirma que exista una cuenta ni que se haya entregado el mensaje: se mantiene genérica para proteger los usuarios. Ante fallos, consultar los registros del proveedor y el mensaje sanitizado del backend. No publicar enlaces de recuperación ni claves en logs.

El modo SMTP existente se conserva con MAIL_PROVIDER=smtp, pero Render Free bloquea los puertos 25, 465 y 587.

Referencias: https://render.com/docs/free y https://resend.com/docs/api-reference/emails/send-email
