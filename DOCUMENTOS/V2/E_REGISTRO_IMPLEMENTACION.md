# V2 · E — Registro de implementación (Gamificación)

Copia del registro de avance de la ejecución del [plan](E_PLAN_IMPLEMENTACION.md) (spec: [E_GAMIFICACION.md](E_GAMIFICACION.md)). Cada `Ruling` es una decisión tomada al implementar, con su costo si resultara equivocada; los `minor (deferred)` son pendientes menores para revisar después.

Spec: DOCUMENTOS/V2/E_GAMIFICACION.md · Rama: v2/e-gamificacion (desde main 6b4e5dd) · Ejecución nativa; revisión final = autorrevisión (preferencia del usuario).

## Pre-flight
- T1→T2: RAZON_COMPLETADO (model) y timeOn (../neka, puro) — ok.
- T1→T4: nivelDe, puntosParaNivel, cosasListas, desdeElDia1().dia1 — ok.
- T2→T4: historial, rachas, Dia.tenias/hechas para semanaPerfecta y dia100 — ok.
- T3→T5: Area, AREA_IDS (model), AREAS, areaSugerida (mesas) — ok.
- T4→T5: LOGRO_IDS, LogroVisto (model) — ok; mismas 24 ids en reglas.
- T1–T4→T6: useProgreso junta nivelDe, desdeElDia1, semanas12, rachas, puntosSemana, ratings, hechosDe — ok.
- T2→T6/T7: Heatmap usa Dia, textoDia, semanas12(d, now, mesaId) — ok.
- T4→T7/T8: CATALOGO, avance, paraPerfil, siguiente, verLogros — ok.
- Task 1: Ruling: el editor dice «antes de las HH:MM» si la fecha límite es hoy (el plan solo nombra día de semana o fecha) — «antes del domingo» siendo domingo confunde — costo: un texto.
- Task 1: Ruling: no hubo pruebas viejas de rules.cjs que dependieran de la urgencia (usan dueAt para choques y validación); no se cambió ningún valor — costo: ninguno.
- Task 1: Nota de proceso: el formateador (hook y prettier) reformatea líneas ajenas en archivos viejos; se revisa el diff antes de cada commit y se restauran.
Task 1: complete (commits 6b4e5dd..539ecb8, tests: npm --prefix front test → ℹ duration_ms 1434.9362)
- Task 2: Ruling: cosasDelDia usa timedItems (como «Hoy»), que además excluye los modelos de rutina; el plan solo decía «no pasivas, no borradas» — la spec manda la misma regla que «Hoy» — costo: ninguno si «Hoy» es la referencia.
Task 2: complete (commits 539ecb8..8ae1fe0, tests: npm --prefix front test → ℹ duration_ms 1513.9227)
- Task 3: Ruling: se exporta etiquetaDe(ahora, antes) y la prueba de ±5 usa números; la integración con el ejemplo da «Sube» (63 → 78) — armar datos que den exactamente +5 era frágil — costo: ninguno.
- Task 3: Ruling: las entradas de la mesa usan timedItems (sin modelos de rutina, que nunca se completan y contarían como vencidos) — costo: ninguno.
Task 3: complete (commits 8ae1fe0..e598fe6, tests: npm --prefix front test → ℹ duration_ms 1448.3552)
- Task 4: Ruling: avance() de un logro ya cumplido devuelve {valor: 1, texto: «Logrado»} (el plan solo define bloqueados) — así la UI no muestra «7/7» — costo: ninguno.
- Task 4: Ruling: miles() se arma con regex («1.000»), no con toLocaleString, para no depender del idioma de Node/Hermes — costo: ninguno.
Task 4: complete (commits e598fe6..d47f6b0, tests: npm --prefix front test → ℹ duration_ms 1441.1848)
- Task 5: Ruling: las reglas suman 'logros' también a las listas de lectura y de borrado (el plan solo nombraba validValue); sin lectura, SyncEngine falla al leer la colección — costo si falta: la sincronización se rompe.
- Task 5: Ruling: la validación local de mesas no cuenta claves (solo exige `area` válida si existe), para no rechazar datos locales viejos; las reglas sí exigen 3 o 4 claves en la nube — costo: una mesa local rara se rechazaría recién al sincronizar (como hoy).
- Task 5: Ruling: las pruebas de datos van en tests/rules.cjs (estilo test()) y no en sync.cjs (asserts sueltos) — costo: ninguno.
- Task 5: Ruling: el formulario no muestra «Área» al editar General (General no tiene rating) — costo: ninguno.
- Task 5: Ruling (secuencia): hasta publicar las reglas, esta versión no puede sincronizar con una cuenta real (lee `logros`). Las verificaciones de las Tasks 6–8 se hacen en modo invitado con nekalDemo(); PruebaClaude se prueba en la Task 9 después de publicar — costo: la prueba con la cuenta real queda al final.
Task 5: complete (commits d47f6b0..d05c0fd, tests: npm --prefix front test → ℹ duration_ms 1462.8564)
- Task 6: Ruling: la historia (heatmap, racha, logros) parte en inicioHistoria = el día más antiguo entre el día 1 y la primera cosa con fecha pasada; «Empezaste el …» sigue con el día 1 de la spec. Con el demo, el heatmap pintaba 3 días llenos y la racha decía 0 — prueba «la historia empieza en la primera cosa con fecha» RED→GREEN, 242/242 — costo: con importaciones (C) la historia puede ir más atrás.
- Task 6: Ruling: historial agrupa cosas y puntos por día una vez (antes recorría todo por cada día) — costo: ninguno.
- Task 6: Ruling: SectionTitle pasa a components/ui/base (lo usan Resumen y Perfil); celdas del heatmap con hitSlop de 1,5 (con 44 se pisarían); singulares «1 día/cosa/nivel»; sin niveles subidos: «Desde ahí completaste N cosas».
- Task 6: Ruling: servidor extra «nekal-web-invitado» (puerto 8082, .claude/launch.json ignorado por git) para verificar en modo invitado sin tocar la sesión de PruebaClaude.
- Task 6: Nota: el log del servidor de desarrollo imprime el token de depuración de App Check (lo hace el SDK de Firebase en web dev). No se repite; leer logs solo con filtro.
- Task 6: Verificado en el navegador (invitado + nekalDemo): racha 3 / récord 3 coinciden con los tonos; tocar el viernes cambia la línea a «viernes 23 de oct · 1 de 1 (100%)»; el anillo se ve igual y lleva al Perfil.
Task 6: complete (commits d05c0fd..6de568e, tests: npm --prefix front test → ℹ duration_ms 1465.9419)
- Task 7: Ruling: la sección Cuenta vive en Ajustes, pero «Conectar mi cuenta» y «Revisar cambios en conflicto» cierran Ajustes y abren su hoja desde el Perfil (props onConectar/onRevisar) — Ajustes evita a propósito paneles anidados (modales anidados en iPhone) — costo: un paso más de animación.
- Task 7: Ruling: Medalla recibe `avance` como número (no {valor, texto}); el texto lo pone la grilla — costo: ninguno.
- Task 7: Ruling: sin mesas propias, «Tus mesas» muestra «Crea una mesa en el Espacio para ver cómo vas en cada una.» (el plan no lo decía) — costo: un texto.
- Task 7: Ruling: en la hoja de 24 logros el avance de un bloqueado sale una vez (bajo el nombre), no repetido a la derecha — costo: ninguno.
- Task 7: Ruling: fechaLarga/mesLargo/mesYAnio pasan a utils/progreso/desde.ts (los usan CurvaDesde y Perfil).
- Task 7: Verificado en el navegador (invitado + demo): Perfil como la maqueta 03 («En Nekal desde octubre de 2026», nivel con riel blanco, 5 de 24 logros, áreas sugeridas), mesa Personal se abre con su heatmap y «1 completada · 2 vencidas en 4 semanas», hoja de 24 logros por familia con pistas, Ajustes con Cuenta arriba, «Conectar mi cuenta» abre la hoja de inicio, y cambiar Casa a «Social» en FormMesa se ve en el Perfil.
Task 7: complete (commits 6de568e..1c25e5d, tests: npm --prefix front test → ℹ duration_ms 1483.7222)
- Task 8: Ruling: el modal espera 500 ms después de que no quede ninguna hoja abierta (y se cancela si se abre otra): en iOS un Modal no se presenta mientras otro todavía se está cerrando — costo: medio segundo de espera.
- Task 8: Ruling: además de hojas, grabación y hoja del plan, el modal espera a que no haya sincronización en curso (cloudBusy), para no mostrar logros que otro dispositivo ya vio y todavía no llegan — costo: puede aparecer unos segundos después.
- Task 8: Ruling: LogroNuevo calcula hechosDe con Date.now() y no usa useProgreso (useNow necesita estar dentro de una pantalla; el modal vive en el TabNavigator) — costo: ninguno.
- Task 8: Ruling: el anillo de la medalla parte en 75% y se completa (el plan no fijaba el punto de partida) — costo: ninguno.
- Task 8: Verificado en el navegador (invitado + demo): al entrar sale UNA tarjeta «Ya tenías 5 logros» con la línea de niveles; al cerrar se guardan los 5 y al recargar no vuelve. Crear una meta completada desde el editor muestra «Primera meta cumplida» después de que el editor se cierra (cuadro a mitad: medalla gris con trofeo y anillo llenándose; final: violeta con textos y Neka); «Ver mis logros» lleva al Perfil (6 de 24, 96 pts). RF3 estricto (logro que aparece con una hoja abierta sin cerrarla) se garantiza por `libre` (hojas === 0); «reducir movimiento» queda para la prueba en iPhone.
Task 8: complete (commits 1c25e5d..3bfc901, tests: npm --prefix front test → ℹ duration_ms 1448.9033)
- Task 9 Step 1: auditoría de reglas (skill firebase-security-rules-auditor): puntaje 5; único detalle menor: `at` de logros se valida como string ≤40, no como fecha ISO (solo afecta datos propios). /security-review no corre sin remoto (origin/HEAD); se hizo a mano sobre main...HEAD: sin secretos en el diff, validación local replica las reglas.
- Final: minor (deferred): validar `at` de logros como fecha ISO en reglas y storage.
- Final: minor (deferred): el SDK de Firebase imprime el token de depuración de App Check en el log del servidor de desarrollo web (preexistente, de D; solo local).
Final review: self-review (sin subagentes, por preferencia del usuario).
- Final: fixed el modal usaba cloudBusy (siempre false) y podía repetir «Ya tenías N logros» en un segundo dispositivo antes de traer los logros vistos — prueba «logros: el modal espera la primera sincronización y las hojas» RED→GREEN, suite 243/243. Los estados viven en utils/estadosNube.ts (los usa SyncEngine).
- Final: minor (deferred): mesas.entradas busca la recompensa de cada cosa sin fecha con rewards.find (O(n·m)); con miles de cosas convendría un Map.
- Final: minor (deferred): useProgreso se recalcula por datos o día; una cosa cuya hora pasa durante el día entra al rating con el próximo cambio.
- Final: minor (deferred): «Tus días» recuerda el día elegido; pasada la medianoche con la app abierta queda en ayer hasta tocar otro.
- Final: minor (deferred): una cuenta que al lanzar E tiene 1–3 logros ve tarjetas sueltas sin la línea de la baja de nivel (la spec la pone solo en la tarjeta resumen).
- Final: minor (deferred): cosasDelDia quedó exportada sin uso (diaDe usa historial).
- Final: Ruling: «reducir movimiento» no se puede activar desde el navegador integrado; se verifica en la prueba del iPhone (paso 7) — costo: si falla, se arregla tras esa prueba.
