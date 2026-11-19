# H5 · Correo con Neka (Gmail y Outlook) — registro de implementación

Copia del ledger de ejecución (`.superpowers/sdd/H5_PLAN_IMPLEMENTACION/progress.md`) al cerrar la fase, 19/11/2026. Spec: [H3_CONEXIONES.md](H3_CONEXIONES.md) §6.4, §6.5, §8 y §11 · Plan: [H5_PLAN_IMPLEMENTACION.md](H5_PLAN_IMPLEMENTACION.md) · Maqueta: `H_MAQUETA/05` (D1–D3).

**Resultado:** la pestaña Chat pasa a ser **IA** (Chat | Correo). Correo junta Gmail y Outlook de los últimos 7 días, sin guardar ningún correo: primero el filtro del proveedor (Principal de Gmail, Prioritarios de Outlook) y después Neka, que solo lee remitente, asunto y primeras líneas, y deja en «Lo importante» lo que te pide algo, te pregunta, trae una fecha o tiene que ver con tus cosas. Desde cada correo: responder en el mismo hilo (escrito por ti o con un borrador de Neka que puedes editar; nada se envía sin tocar Enviar), «Crear tarea» y «Al calendario». Si Neka falla, se muestra todo lo principal.

**Prueba real (19/11, en la versión de prueba `https://nekal-973b2--conexiones-ejdpfomm.web.app`):** con las cuentas reales del usuario (Gmail y Outlook), correos de prueba en los dos sentidos: bandeja mezclada por hora, abrir marca leído en el proveedor, respuestas en el mismo hilo con tildes y saltos de línea, borrador de Neka enviado por Outlook, «Al calendario» y «Crear tarea» con los datos del correo, Neka ordenando 86 correos («6 son para ti»). También se probó otra vez el espejo de H4 (Google ↔ Nekal ↔ Outlook, papelera incluida). La prueba encontró y arregló 3 errores que trababan la sincronización o el texto (ver «Task 6»). 406 pruebas, typecheck y build:web en verde; sin reglas nuevas.

**Configuración necesaria:** cada dominio nuevo donde corra Nekal (canal de prueba, dominio propio) hay que agregarlo también a la clave reCAPTCHA Enterprise «Nekal web» (Google Cloud → Seguridad → Fraud Defense); si no, App Check falla y Neka responde 401.

**Pendiente (fuera de H5):** prueba en el iPhone con Nekal *instalada*. La web normal (`nekal-973b2.web.app`) sigue con código viejo hasta publicar `main`.

**Menores diferidos:** Reply-To con varias direcciones; Gmail vuelve a pedir metadatos en cada recarga; cuenta Microsoft con login Gmail muestra ese correo aunque envía desde @outlook.com; Neka a veces marca «fecha» lo ya pasado o una promoción.

---

# SDD ledger — plan: DOCUMENTOS/V2/H5_PLAN_IMPLEMENTACION.md

Rama v2/h5-correo desde main 1b8bb82 (+ commit del plan 1c4174e). Spec: DOCUMENTOS/V2/H3_CONEXIONES.md §6.4–6.5.
Ruling: se ejecuta sin esperar la revisión del plan — el usuario pidió «tú haz todo» y «sigue con H5»; el diseño (spec §6.4–6.5 y maqueta 05 D1–D3) ya estaba aprobado — costo si mal: ajustar después de la prueba.
Ruling: el módulo de Neka para el correo se llama `conexiones/correoNeka.ts` (el spec decía `neka.ts`) — ya existe `utils/neka.ts` y confundiría — costo: ninguno.

## Pre-flight
| Tareas | Produce → consume | Hallazgo |
|---|---|---|
| 1 → 2 | CorreoResumen, CorreoCompleto | coinciden |
| 1 → 3 | desdeGmail*, desdeGraph*, respuestaGmail, mezclar | coinciden |
| 2,3 → 4 | Clase, clasificar, leerBorrador/Borrador, RedCorreo, traerBandeja, AvisoCuenta | coinciden |
| 2,4 → 5 | useCorreo, CorreoEnLista, textoRazon, accion, resumenBandeja, tareaDesdeCorreo, eventoDesdeCorreo | coinciden |
Task 1: RED = compilación (correo.ts ausente). Ruling: la prueba de quoted-printable de Gmail se cambió por una de charset ISO-8859-1 — la API de Gmail ya entrega `body.data` sin la codificación de transferencia; queda el charset — costo si mal: un correo QP se vería con «=F3» (se vería en la prueba real).
Task 1: complete (commits 1c4174e..75fa209, tests: npm --prefix front test → ℹ duration_ms 1493.6565)
Task 2: RED = compilación (correoNeka.ts ausente); GREEN 400.
Task 2: Ruling: `Clase.fecha` es fecha local «AAAA-MM-DD[THH:mm]» (no ISO UTC) — así se sabe si trae hora (tarea sin hora → 18:00, evento sin hora → 09:00) — costo: ninguno, solo vive en memoria.
Task 2: Ruling: `pedidoBorrador` recibe `ahora` opcional (4.º parámetro) y `eventoDesdeCorreo` un `extra {titulo, minutos}` para «Agregar» desde el borrador — Neka necesita la fecha de hoy para «el sábado» — costo: ninguno.
Task 2: Ruling: las ids que ve Neka son «c1…cN» por lote, no las de Gmail/Graph — menos texto y nada que no necesita — costo: ninguno.
Task 2: complete (commits 75fa209..d1137b9, tests: npm --prefix front test → ℹ duration_ms 1584.7792)
Task 3: RED = compilación (bandeja.ts ausente); GREEN 402; typecheck OK. Ruling: un «pase» lanzado por `listar` (401) también es aviso «pase» — mismo efecto que sin token — costo: ninguno. En microsoft.ts el `desdeGraph` del correo se importa como `correoDeGraph` (choca con el del calendario).
Task 3: complete (commits d1137b9..2c5485f, tests: npm --prefix front test → ℹ duration_ms 1506.8423)
Task 4: Ruling: los correos de ejemplo viven en `conexiones/ejemploCorreo.ts` (no dentro de ConexionesContext) y cualquier ejemplo activo usa esa red — el contexto ya es largo — costo: ninguno. Ruling: `useCorreo` expone además `actualizando` (para tirar hacia abajo) — costo: ninguno.
Task 4: complete (commits 2c5485f..ce4898f, tests: npm --prefix front run typecheck → > tsc --noEmit)
Task 5: Ruling (TDD, fuera del plan): `horaCorreo` y `textoInicio` en correoNeka.ts para la hora de la fila y la cita del borrador — test «hora corta de la fila y fecha de la cita» RED→GREEN, 403.
Task 5: Ruling (encontrado al verificar): «Agregar» cerraba la hoja y perdía el borrador — ahora al cerrar el editor vuelve la respuesta tal como estaba (sin volver a ofrecer la cita) — costo: un estado más en BandejaCorreo.
Task 5: Ruling: además de tirar hacia abajo hay un botón de actualizar en la tarjeta de Neka — en la web RefreshControl no se puede tirar — costo: ninguno.
Task 5: verificado en invitado (8082, móvil 375 y escritorio) con nekalConexiones("correo") y Gemini real: «De 6 correos de esta semana, 4 son para ti», razones y acciones correctas, «2 correos más» desplegable, abrir marca leído, Neka redacta y ofrece la cita, Agregar → editor y vuelve al borrador, Enviar → «Respuesta enviada a Ana Pérez.», Crear tarea con plazo viernes 23:59; Chat sin cambios; consola sin errores; build:web OK.
Task 5: complete (commits ce4898f..89fbd0f, tests: npm --prefix front test → ℹ duration_ms 1515.1117)
Final review: /code-review high (en esta sesión, sin subagente revisor) — 8 hallazgos.
Final: fixed dos recargas a la vez clasificaban dos veces (cuota de Neka) — unaALaVez — test «revisión H5: una recarga a la vez» RED→GREEN, suite 406/406.
Final: fixed la respuesta por Outlook perdía los saltos de línea (`comment` es HTML) — htmlDeTexto — test «revisión H5: la respuesta de Outlook conserva los saltos de línea» RED→GREEN, suite 406/406.
Final: fixed las celdas de tabla se pegaban en el texto plano — </td>/</th> → espacio — test «revisión H5: las celdas de una tabla no se pegan» RED→GREEN, suite 406/406.
Final: Ruling: tras «Agregar», una respuesta escrita a mano volvía como «Borrador de Neka» — se corrigió (deNeka solo si Neka escribió) sin prueba automática (es estado de UI); verificado por typecheck — costo si mal: una etiqueta equivocada.
Final: Ruling: los tamaños sueltos de FilaCorreo (punto 7 px, gap 2) aparecieron cambiados en disco a `space.sm` / `space.xs` (otra sesión o formateador); se aceptan y se commitean — cumplen CLAUDE.md — costo: ninguno.
Final: minor (deferred): Reply-To con varias direcciones se lee como una sola (responde solo a la última).
Final: minor (deferred): cada recarga pide de nuevo los metadatos de hasta 100 correos de Gmail (sin caché por id).
Final: minor (deferred): «Sobre Reunión de equipo» conserva la mayúscula del título que devuelve Neka.
Final: nota de proceso: la primera versión de la prueba unaALaVez dejaba una promesa sin resolver y colgaba `npm test`; corregida antes de commitear.
Final: fixed «Sobre Reunión…» con mayúscula — cambio pedido por el usuario en este mismo chat (btw) — prueba agregada en «textos de la fila y del encabezado», suite 406/406.
Publicado (17/11): canal conexiones con H5 (vence 2026-12-17).
Task 6 (pendiente): prueba real del usuario con Gmail y Outlook; después, cierre (registro, ROADMAP, CLAUDE.md, sistema de diseño, mezcla en main).

Task 6: prueba real (19/11, Claude en el navegador integrado con la cuenta del usuario; Claude in Chrome no conectado):
- Funciona: bandeja con Gmail + Outlook mezclada por hora; abrir marca leído en el proveedor; responder escrito a mano en Gmail y en Outlook llega en el mismo hilo, con saltos de línea y tildes; Crear tarea abre el editor con título y descripción; calendario: evento de Google y de Outlook llegan a Nekal (hora bien), evento de Nekal llega a los dos («Nekal»), papelera en Nekal lo borra de los dos, borrar en Google lo manda a la papelera de Nekal.
- Task 6: Ruling: bug real — settings/conexiones no existía en la nube (la migración V1 crea solo lo que había entonces); el primer cambio de conexiones chocaba (before = valor por defecto, nube = nada) y trababa TODA la sincronización (5 cambios). Fix: mergeOperation usa el valor por defecto para settings/* ausentes — prueba «missing settings record» RED→GREEN, suite 406/406 — commit 35230e2.
- Task 6: Ruling: bug real — Gmail entrega el cuerpo en UTF-8 aunque diga ISO-8859-1 (correos enviados desde Outlook): «Â¿Puedes», «ConfÃ­rmame». Fix: leer como UTF-8 si es válido, si no con su charset — prueba en «Gmail resumen y completo» RED→GREEN — commit 35230e2.
- Task 6: Ruling: con Neka caída el encabezado decía «35 son para ti»; ahora «Tienes N correos de esta semana.» — prueba RED→GREEN — commit 35230e2.
- Task 6: Ruling: bug real (de V2/B, no de H5) — dataOf reordena posiciones viejas (ordenarLegado, x) sin escribirlas; la regla de conflicto de ítems (type/deletedAt) lo tomaba como cambio de otro dispositivo: mandar algo a la papelera trababa la sincronización. Fix: la regla ignora x/y — prueba «layout-only difference» RED→GREEN, la prueba de conflicto real sigue — commit adfa337.
- Publicado (19/11): canal conexiones con 35230e2 + adfa337 (vence 2026-12-19). Build incluye cambios ajenos sin commitear de model.ts (formato + color #7546EC del espacio General por defecto).
- PENDIENTE (bloquea el cierre): Neka/Gemini no funciona en el canal: App Check «ReCAPTCHA error» → 401 en Firebase AI. Casi seguro falta agregar el dominio nekal-973b2--conexiones-ejdpfomm.web.app a la clave reCAPTCHA Enterprise (Google Cloud → Seguridad → reCAPTCHA). Lo hace el usuario. Sin eso no se probó: clasificar, borrador de Neka, «Al calendario».
- Final: minor (deferred): con una cuenta Microsoft cuyo login es un Gmail, Nekal dice «Se envía desde …@gmail.com» aunque Graph envía desde …@outlook.com (y «para» muestra el login).
- Limpieza: quedó en Outlook el evento «PRUEBA NEKAL desde Outlook» (vie 20/11 17:00); Outlook web en el navegador integrado no lo borró. Destinos vuelto a solo Google. Correos de prueba «PRUEBA NEKAL…» quedan en las bandejas.
- Resuelto (19/11, con permiso del usuario): dominio nekal-973b2--conexiones-ejdpfomm.web.app agregado a la clave reCAPTCHA Enterprise «Nekal web» (Google Cloud → Fraud Defense); tardó ~3 min en aplicarse.
- Task 6: Neka con correo real OK: «De 86 correos de esta semana, 6 son para ti»; los 3 de prueba en Lo importante; borrador de Neka correcto y enviado por Outlook; «Al calendario» abre Evento vie 20 16:00, 60 min, con título y texto.
- Final: minor (deferred): Neka marca «fecha» correos con fecha ya pasada (envío entregado 18 nov) y alguna promoción (Meshy, 24 ene) cae en Lo importante.
Task 6: complete (prueba real con Gmail y Outlook; falta solo el cierre: registro, ROADMAP, CLAUDE.md, sistema de diseño, mezcla en main).
