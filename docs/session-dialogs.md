# Diálogos de sesión

- Cerrar sesión abre una confirmación con Cancelar y Sí, cerrar sesión.
- A los 20 minutos sin interacción se muestra un aviso. Aceptar reinicia el contador; mover el ratón sobre el aviso no lo descarta.
- A los 30 minutos se elimina el token local y se muestra la confirmación de cierre por inactividad sobre el login. Aceptar solo descarta el mensaje; el cierre no depende del clic.
- Se registran acciones de teclado, puntero, desplazamiento y tacto. Las consultas automáticas no reinician el contador. Las pestañas del mismo origen comparten la última actividad y notifican el cierre entre sí.
- El tiempo se calcula mediante marcas de fecha, incluyendo suspensión del equipo. El navegador puede retrasar temporizadores en segundo plano; se vuelve a comprobar al recuperar foco o visibilidad.
- JWT: la duración absoluta pasa de 24 a 60 minutos, configurable con `app.jwt.expiration-minutes`. Requiere desplegar el backend y volver a iniciar sesión para obtener un token nuevo. No hay renovación automática. El cierre por inactividad es un control del cliente; no revoca por sí solo una copia externa del JWT.

Comprobaciones: `npm run build` y `node --experimental-strip-types --test tests/sessionIdle.test.mjs`.
