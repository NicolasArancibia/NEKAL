# H4 · Calendario en espejo (Google y Outlook) — registro de implementación

Copia del ledger de ejecución (`.superpowers/sdd/H4_PLAN_IMPLEMENTACION/progress.md`) al cerrar la fase, 17/11/2026. Spec: [H3_CONEXIONES.md](H3_CONEXIONES.md) §7 · Plan: [H4_PLAN_IMPLEMENTACION.md](H4_PLAN_IMPLEMENTACION.md).

**Resultado:** el calendario de Nekal es un espejo de Google y Outlook, sin servidor: lo creado, movido, editado o borrado de un lado aparece del otro (también lo que mueve Neka). Lo que creas en Nekal va a las cuentas que elijas en Ajustes (Google, Outlook, ambas o ninguna), cada una en un calendario «Nekal». Probado con cuentas reales el 16–17/11 en la versión de prueba (`https://nekal-973b2--conexiones-ejdpfomm.web.app`, vence el 16/12). 388 pruebas, reglas en emulador, typecheck y build:web en verde; reglas publicadas.

**Cómo funciona (resumen):** cada ítem guarda un enlace por cuenta (`origen` + `copias`) con la `firma` de los campos espejados; cambio local = la firma cambió, cambio afuera = otra `version` (etag / changeKey); gana lo más reciente; lo de solo lectura vuelve a como está afuera. Ventana: 14 días atrás y 60 adelante. Lo de afuera no cuenta para el progreso, las atrasadas ni los choques de todo el día, y Neka lo trata como fijo.

**Pendiente (fuera de H4):** probar en el iPhone con Nekal *instalada* (Agregar a inicio) que la vuelta de Google y Microsoft regresa a la app y no a Safari. Mientras `main` no se publique, la web normal (`nekal-973b2.web.app`) no conoce el espejo: usar solo la versión de prueba.

**Menores diferidos:** día completo de Graph en zonas con desfase positivo; `$top`/`$select` codificados como `%24`; `ListRow` con `size={20}` suelto.

---

# SDD ledger — plan: DOCUMENTOS/V2/H4_PLAN_IMPLEMENTACION.md

Rama v2/h4-espejo desde main 9c021f6 (+ commit del plan). Spec: DOCUMENTOS/V2/H3_CONEXIONES.md.
Ruling: se ejecuta sin esperar la revisión del plan — el usuario pidió «tú haz todo» y «sigue con H4»; el diseño (spec §7) ya estaba aprobado — costo si mal: ajustar después de la prueba.
Ruling: día completo = scheduledAt 00:00 local, duration 1440, origen.diaCompleto; no ocupa tiempo (choques/huecos lo ignoran) — Nekal no tiene ese concepto y el planner exige duración 5..1440 — costo: una vista más fina después.

## Pre-flight
| Tareas | Produce → consume | Hallazgo |
|---|---|---|
| 1 → 2,3 | Origen, Conexiones.destinoNekal | coinciden |
| 2 → 3 | EventoFuera, camposDeEvento, firmaDe, limitesVentana | coinciden |
| 2 → 5 | desdeGoogle/desdeGraph, cuerpoGoogle/cuerpoGraph | coinciden |
| 3 → 6 | planDeSincronizacion, aplicarEnNekal, aplicarResultados, hayCambiosLocales | coinciden |
| 5 → 6 | calendarios*/eventos*/guardarEvento*/borrarEvento*/crearCalendarioNekal* | coinciden |
| 4 → 7 | esExterno, ocupaTiempo | coinciden |
Task 1: RED: sync.cjs (formato nuevo) y emulador con reglas de HEAD (0 OK, falla en la migración); GREEN 351 + 16 OK Firestore. Ruling: se actualizó la prueba H3 «conexiones: quitar» al formato con destinoNekal — cambio intencional — costo: ninguno.
Task 1: complete (commits 382a1f4..4cdc538, tests: npm --prefix front test → ℹ duration_ms 1524.468)
Task 1: Ruling: prettier reformateó líneas ajenas de storage.ts; se restauró con un commit aparte (solo mis 2 cambios) — desde ahora prettier solo en archivos nuevos — costo: un commit extra.
Task 2: RED = compilación (eventos.ts ausente); GREEN 354. espejo.ts queda como stub hasta Task 3.
Task 2: complete (commits 6b691cf..4704171, tests: npm --prefix front test → ℹ duration_ms 1501.7731)
Task 3: Ruling: destinoNekal guarda «proveedor:correo» (claveCuenta), no solo el correo — el usuario tiene el mismo correo en Google y Outlook — test «espejo: destino…» RED→GREEN — costo: ninguno (aún sin datos reales con destino).
Task 3: Ruling: datos sin destinoNekal (H3) toman la primera cuenta; "" explícito = «No copiar» — spec §6.2 (la primera conectada queda elegida) — costo: ninguno.
Task 3: RED: 10 pruebas espejo fallaban con espejo.ts vacío; GREEN 364.
Task 3: complete (commits 4704171..1f5d094, tests: npm --prefix front test → ℹ duration_ms 1494.3637)
Task 4: RED 3 pruebas (esExterno/ocupaTiempo/linea); GREEN 367. Ruling: la regla de Neka sobre lo de Google/Outlook va en conversar.ts (instrucciones compartidas) — costo: ninguno.
Task 4: complete (commits 1f5d094..914a9b3, tests: npm --prefix front test → ℹ duration_ms 1494.6988)
Task 5: complete (commits 914a9b3..13da27b, tests: npm --prefix front run typecheck → > tsc --noEmit)
Task 6: Ruling: la pasada por cuenta vive en conexiones/sincronizar.ts con la red inyectada (probada con una red falsa: 4 pruebas) en vez de solo dentro del contexto — más pruebas, mismo comportamiento — costo: un archivo más. RED 5 → GREEN 372. CalendarioFuera pasó a tipos.ts (google.ts arrastraba process a las pruebas).
Task 6: complete (commits 13da27b..41f87d8, tests: npm --prefix front test → ℹ duration_ms 1511.2591)
Task 7: Ruling: el origen en la fila es texto («Google», «Outlook», «en Google») dentro del detail de ListRow, sin logo — ListRow solo acepta texto en el detail — costo: menos fiel a la maqueta C1 (logo chico).
Task 7: Ruling: OrigenItem.tsx del plan pasó a AvisoOrigen.tsx (aviso del editor + textoOrigen) — mismo papel — costo: ninguno.
Task 7: Ruling (fuera del plan, encontrado al verificar): progreso/dias.ts excluye esExterno (cosasDelDia, historial, inicioHistoria) — si no, los eventos de afuera bajaban «cuánto cumpliste» y corrían el día 1 — test «progreso: los eventos de Google/Outlook no cuentan…» RED→GREEN, suite 373.
Task 7: Ruling: Resumen también muestra los externos con ícono de calendario y sin círculo de hecho (como la Agenda) — costo: ninguno.
Task 7: verificado en invitado (8082, móvil) con nekalConexiones("eventos"): Agenda con 4 eventos (Google/Outlook/Todo el día), editor con «De Outlook · …», selector de destino que cambia, Resumen sin «Completar» en externos; consola sin errores.
Task 7: complete (commits 41f87d8..d17f344, tests: npm --prefix front test → ℹ duration_ms 1864.0546)
Final review: /code-review high (en esta sesión, sin subagente revisor) — 9 hallazgos.
Final: fixed reconectar tras desconectar borraba los eventos de afuera — soltarCuenta quita origen — test «revisión H4: desconectar y reconectar nunca borra…» RED→GREEN, suite 379/379.
Final: fixed evento que deja de llegar (calendario oculto) se borraba afuera en la pasada siguiente — aPapelera quita origen — test «…va a la papelera sin borrarse afuera» RED→GREEN.
Final: fixed el espejo corría antes de la primera sincronización (duplicados en dispositivo nuevo) — esperandoNube — test RED→GREEN.
Final: fixed un cambio local reescribía inicio/fin y acortaba eventos de varios días — PATCH solo con lo cambiado (cambiosGoogle/cambiosGraph según la firma anterior) — test RED→GREEN.
Final: fixed dos dispositivos importaban el mismo evento dos veces — plan.duplicados → papelera sin origen — test RED→GREEN.
Final: fixed un 403 al editar se reintentaba para siempre — «prohibido» → origen.soloLectura y vuelve a como está afuera — test RED→GREEN.
Final: minor (deferred): día completo de Graph en zonas con desfase positivo cae un día antes (Chile, −03, no se ve afectado).
Final: minor (deferred): $top/$select se codifican como %24 en URLSearchParams (Graph suele aceptarlo; revisar si la prueba real falla).
Final: minor (deferred): ListRow icono size={20} suelto (tests/styles.cjs no lo marca).
Task 8: con permiso del usuario (16/11): reglas publicadas (deploy:rules OK) y canal conexiones actualizado.
Task 8: el usuario reportó «algo falló» en la prueba real (16/11); pendiente diagnóstico con systematic-debugging.

Task 8 (16/11, prueba real): Google funciona en ambos sentidos; Outlook importa pero no recibe lo creado en Nekal, y con el chip en Outlook las cosas seguían en Google.
Ruling: no se pudo reproducir la falla de Outlook sin la sesión del usuario (Graph no se ve desde aquí); se agregó el motivo del error por cuenta en Ajustes para la próxima prueba. Lo de «seguía en Google» se explica por el modelo de un solo origen: lo ya copiado a Google seguía enlazado ahí.
Ruling: pedido del usuario → varios destinos (`destinos: string[]`) e ítems con `copias` (una por cuenta). Commit e51dd2a, 388 pruebas, reglas en emulador OK, typecheck y build OK. Falta: publicar reglas + canal (con permiso) y que el usuario pruebe Outlook.
Publicado (16/11): reglas con destinos/copias y canal conexiones (vence 2026-12-16), verificado que sirve la versión nueva.
Task 8 (17/11): el usuario confirmó con cuentas reales que el espejo funciona con Google y Outlook (eventos creados afuera se ven con su origen; una tarea de Nekal quedó «en Google y Outlook»).
Task 8: Ruling (encontrado en la captura del usuario): la vista Mes dejaba marcar como hecho lo de Google/Outlook — ahora ícono de calendario y sin círculo, igual que Agenda — verificado en invitado (8082) con nekalConexiones("eventos") — commit 20454a1, 388 pruebas, typecheck y build OK.
Task 8: pendiente fuera de H4 → prueba en iPhone con Nekal instalada (Agregar a inicio): ¿la vuelta de Google/Microsoft regresa a la app o a Safari?
Task 8: complete — cierre: registro, ROADMAP, CLAUDE.md, sistema de diseño y mezcla en main.
