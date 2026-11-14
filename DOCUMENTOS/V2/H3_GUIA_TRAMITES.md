# Guía: trámites de Google y Microsoft (H3)

Son dos trámites de unos 15–20 minutos cada uno. No piden tarjeta en el caso de Google. Microsoft **quizás** la pida para crear una cuenta gratis de Azure: si pasa, para ahí y avísame.

Al final me pasas **dos ID**: uno de Google y uno de Microsoft. Son públicos: no son contraseñas ni secretos, así que los puedes pegar en el chat. **Nunca me pases un «secreto de cliente» ni una contraseña**; no los necesitamos.

Las cuatro direcciones que se repiten abajo:

```
http://localhost:8081
http://localhost:8082
https://nekal-973b2.web.app
https://nekal-973b2.firebaseapp.com
```

---

## Parte 1 · Google (Gmail + Calendar)

Entra a <https://console.cloud.google.com> con la cuenta dueña del proyecto de Firebase.

1. **Elegir el proyecto.** Arriba a la izquierda, en el selector de proyectos, elige **nekal-973b2** (es el mismo de Firebase).
2. **Activar las dos APIs.** Menú ☰ → *APIs y servicios* → *Biblioteca*.
   - Busca **Gmail API** → *Habilitar*.
   - Vuelve, busca **Google Calendar API** → *Habilitar*.
3. **Pantalla de consentimiento.** Menú ☰ → *APIs y servicios* → *Pantalla de consentimiento de OAuth*. Puede aparecer como **«Google Auth Platform»**; si dice *Comenzar*, tócalo.
   - **Información de la app:** nombre `Nekal`; correo de asistencia: el tuyo.
   - **Público:** **Externo**.
   - **Datos de contacto:** tu correo.
   - Acepta y *Crear*.
4. **Usuarios de prueba.** En *Público* (*Audience*), deja el estado en **Prueba** (*Testing*), no lo publiques.
   - En *Usuarios de prueba* → *Agregar usuarios*. Pon cada cuenta de Gmail que usará Nekal: la tuya, la de PruebaClaude si es Gmail, y las de quienes la probarán (máximo 100).
   - Solo esas cuentas podrán conectarse.
5. **Permisos.** En *Acceso a los datos* (*Data access*) → *Agregar o quitar permisos*. Pega estas dos líneas en *Agregar manualmente* y luego *Actualizar* y *Guardar*:
   ```
   https://www.googleapis.com/auth/calendar
   https://www.googleapis.com/auth/gmail.modify
   ```
   Si este paso te confunde, sáltalo: en modo prueba Nekal igual puede pedirlos.
6. **Crear el ID de cliente.** En *Clientes* (o *Credenciales* → *Crear credenciales* → *ID de cliente de OAuth*):
   - Tipo de aplicación: **Aplicación web**.
   - Nombre: `Nekal web`.
   - **Orígenes autorizados de JavaScript:** agrega las **cuatro direcciones** de arriba, una por una.
   - **URI de redireccionamiento autorizados:** agrega también las **cuatro direcciones** (Nekal vuelve a su misma página).
   - *Crear*.
7. **Copiar el ID.** Te muestra un **ID de cliente** que termina en `.apps.googleusercontent.com`. **Ese es el que me pasas.**
   - El «secreto del cliente» que aparece al lado **no** lo necesitamos: no lo copies ni me lo pases.

> Cuando conectes por primera vez, Google mostrará «Google no verificó esta app». Es normal en modo prueba: toca **Avanzado → Ir a Nekal**.

---

## Parte 2 · Microsoft (Outlook)

Entra a <https://entra.microsoft.com> con tu cuenta de Microsoft (la de Outlook/Hotmail sirve).

- Si te dice que tu cuenta personal no puede entrar, o te pide **crear una cuenta de Azure**, prueba en <https://portal.azure.com>.
- Si ahí te pide **tarjeta**, **para y avísame**: lo vemos juntos (Google sigue funcionando igual mientras tanto).

1. **Registrar la app.** Busca **«Registros de aplicaciones»** (*App registrations*) → *Nuevo registro*.
   - Nombre: `Nekal`.
   - **Tipos de cuenta compatibles:** la opción que incluye **«cuentas Microsoft personales»**: *Cuentas en cualquier directorio organizativo y cuentas personales de Microsoft (como Skype, Xbox)*.
   - **URI de redirección:** en el menú elige **Aplicación de página única (SPA)** y escribe `https://nekal-973b2.web.app`.
   - *Registrar*.
2. **Copiar el ID.** En *Información general* aparece **«Id. de aplicación (cliente)»**, un código con guiones. **Ese es el que me pasas.**
3. **Las otras direcciones.** Menú izquierdo → *Autenticación*. En la sección *Aplicación de página única*, agrega las otras **tres** direcciones (`http://localhost:8081`, `http://localhost:8082` y `https://nekal-973b2.firebaseapp.com`) → *Guardar*.
4. **Permisos** (opcional: si no se agregan aquí, Nekal igual los pide al conectar).
   - Menú izquierdo → *Permisos de API* → *Agregar un permiso*.
   - En la pantalla «Solicitud de permisos de API», toca la **tarjeta grande de arriba, «Microsoft Graph»**.
   - Luego **Permisos delegados**. Aparece un buscador; escribe cada nombre y marca:
   - `Calendars.ReadWrite`
   - `Mail.ReadWrite`
   - `Mail.Send`
   - `offline_access`
   - (`User.Read` ya viene puesto)

   Luego *Agregar permisos*. No hace falta «consentimiento del administrador».

---

## Parte 3 · Pásame esto

```
Google: xxxxxxxx.apps.googleusercontent.com
Microsoft: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Cuentas de prueba que agregaste en Google: ...
¿Microsoft pidió tarjeta o algo raro?: sí / no
```

Yo los guardo en `front/.env.local`, que nunca se sube a git.
