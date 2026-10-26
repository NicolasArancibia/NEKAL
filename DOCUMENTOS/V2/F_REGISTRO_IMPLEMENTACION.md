# V2 · F — Registro de implementación (Amigos)

Copia del registro de avance de la ejecución del [plan](F_PLAN_IMPLEMENTACION.md) (spec: [F_AMIGOS.md](F_AMIGOS.md)). Cada `Ruling` es una decisión tomada al implementar, con su costo si resultara equivocada; los `minor (deferred)` son pendientes menores para revisar después.

Rama: v2/f-amigos (desde main 9779245) · Ejecución nativa; revisión final = autorrevisión (preferencia del usuario). Reglas publicadas el 26/10 con permiso del usuario.

## Prueba en el iPhone (aprobada el 26/10)

El usuario probó los 7 pasos en su iPhone con Expo Go el 26/10/2026 y funcionó todo, incluido el aviso sin internet (paso 6).

Con la versión de F abierta en Expo Go y dos cuentas (por ejemplo, la tuya en el iPhone y PruebaClaude en el navegador):

1. **Perfil sin amigos:** la sección Amigos muestra a Neka con «Comparte tu código…» y «Agregar amigo».
2. **Compartir:** en la hoja Amigos, «Compartir» abre el menú del iPhone con «Agrégame en Nekal con mi código NEKA-…».
3. **Solicitud:** desde la otra cuenta te envían una solicitud; en el iPhone aparece el **1** en la pestaña Perfil y en el botón de personas, sin recargar.
4. **Aceptar:** se siente la vibración de éxito; el amigo pasa a la fila y, al cerrar la hoja, sale el modal «Primer amigo» (si no lo tenías).
5. **Perfil de un amigo:** se ve su nivel, sus logros y sus áreas, nunca los nombres de sus mesas.
6. **Sin internet:** con modo avión, «Agregar con un código» → escribir un código → «Buscar» vuelve en unos 10 s con «Sin conexión. Revisa tu internet y reintenta.» y el botón se puede volver a apretar.
7. **Eliminar:** «Eliminar amigo» pide confirmación en la misma hoja y el amigo desaparece en los dos teléfonos.

## Pendientes menores

- Al abrir la app con cuenta, la sección Amigos puede mostrar un instante «sin amigos» mientras carga.
- Si el otro rechaza o cancela justo cuando tú cancelas o rechazas, sale «No se pudo completar…» aunque la lista se actualiza sola.
- `conPlazo` (el plazo de 10 s) no tiene prueba automática; se probó a mano en el iPhone (paso 6, aprobado).
- Quien fue rechazado puede volver a enviar (no hay bloqueo); cada uno elige el nombre de su tarjeta; la tarjeta la escribe el propio teléfono (aceptado en la spec).

## Registro

Spec: DOCUMENTOS/V2/F_AMIGOS.md. Rama `v2/f-amigos` desde `main` (9779245), en la misma carpeta (forma de trabajo aprobada por el usuario en D y E; sin worktree).

## Pre-flight

| Produce → consume | Qué | Hallazgo |
|---|---|---|
| T2 → T3 | `hechosDe(d, now, amigos)`, `desbloqueados` | Coincide. |
| T3 → T4 | `Tarjeta` | Coincide. |
| T1–T4 → T6 | `normalizarCodigo`, `nuevoCodigo`, `tarjetaDe`, `mismaTarjeta`, `listoParaPublicar`, `listas`, `revisarEnvio`, `AVISOS`, `filasAmigos`, `amigosDeEjemplo`, `Persona` | Coincide (claves de `Busqueda.aviso` ⊂ `AVISOS`). |
| T6 → T7 | `useAmigos()` y `Pagina` | Coincide. |
| T5 ↔ T6 | reglas contra lo que escribe `nube.ts` | `nombreDe` sale de `perfiles/{yo}` y `nombrePara` de `codigos/{codigo}` dentro de la transacción; `crearCodigo` escribe código + tarjeta juntos (los dos `getAfter` se cumplen); `publicarTarjeta` solo cambia `nombre` del código. Coincide. |

Pre-flight: Ruling: la spec §7.1 nombra `tarjetaDe(data, now)`; el plan usa `tarjetaDe(d, now, amigos, codigo)` — hace falta `amigos` para «Primer amigo» y `codigo` para el campo de la tarjeta — costo si es incorrecto: ninguno (firma interna).

## Tareas
Task 1: complete (commits 9779245..a352b62, tests: npm test → ℹ duration_ms 1649.511)
Task 2: complete (commits a352b62..c798a55, tests: npm test → ℹ duration_ms 1596.0537)
Task 3: complete (commits c798a55..76ab092, tests: npm test → ℹ duration_ms 1619.0631)
Task 4: complete (commits 76ab092..08b8393, tests: npm test → ℹ duration_ms 1623.5348)
Task 5: complete (commits 08b8393..56782c1, tests: bash -c 'export PATH="/c/Program Files/Eclipse Adoptium/jdk-21.0.12.101-hotspot/bin:$PATH"; npm test >/dev/null && npm run test:firestore 2>&1 | grep -c "OK Firestore"' → 15)
Task 6: Ruling: `escucharTarjeta` avisa también `servidor: boolean` (`!metadata.fromCache`) — el código se crea solo si Firebase confirma que tu tarjeta no existe; con caché vacío podría crear un segundo código — costo si es incorrecto: una firma interna.
Task 6: Ruling: en `ejemplo.ts` la enviada pasa de Diego a «Valentina Ríos» y se agrega `PERSONA_EJEMPLO` (Diego) — así «Buscar» en modo ejemplo llega a «Enviar solicitud» como en la maqueta 04 en vez de «Ya le enviaste una solicitud» — costo si es incorrecto: ninguno (solo datos de desarrollo).
Task 6: Ruling: los errores de escucha solo marcan «sin conexión» con `unavailable`; un `permission-denied` al dejar de ser amigos se ignora (el listener se cierra al cambiar la lista) — costo si es incorrecto: un error de permisos real no se muestra.
Task 6: complete (commits 56782c1..fe5eab2, tests: bash -c 'npm test 2>&1 | grep -E "ℹ (pass|fail)" && npm run typecheck >/dev/null' → ℹ fail 0)
Task 7: Ruling: componente nuevo `base/Contador` (número rojo) usado por la pestaña y el botón de personas — evita que `base/TabBar` importe de `amigos/` — costo si es incorrecto: un archivo más.
Task 7: Ruling: la vuelta «‹ Amigos» va como primera fila del contenido de la hoja y no junto al título — `Sheet` solo acepta un título de texto — costo si es incorrecto: diferencia menor con la maqueta 04.
Task 7: Ruling: en la solicitud destacada del Perfil, «Rechazar» es `Button plain` (solo texto) — `Button secondary` es lavanda y desaparece sobre la tarjeta lavanda; no se agregó una variante nueva — costo si es incorrecto: diferencia menor con la maqueta 02 (allí era una píldora blanca).
Task 7: Ruling: `Sheet` suma la prop opcional `pagina`; al cambiar, el contenido vuelve arriba — sin esto el aviso «Le enviamos tu solicitud…» quedaba fuera de la vista — costo si es incorrecto: ninguno para las demás hojas (no la pasan).
Task 7: Ruling: `Inicial` suma `sobreLavanda` (fondo blanco) para la solicitud destacada — el círculo lavanda no se veía sobre la tarjeta lavanda (visto en la verificación) — costo si es incorrecto: ninguno.
Task 7: Ruling: el estado «Primero, tu nombre» no se pudo ver con `nekalAmigos()` (el ejemplo trae código); se revisa en la prueba real con la cuenta nueva (Task 8) — costo si es incorrecto: un estado sin verificar visualmente hasta entonces.
Task 7: verificado en modo invitado (8082, 390 px): invitado, solicitud + fila + número 1 en pestaña y botón, Aceptar, hoja (código, Compartir con texto en web, Enviadas, Tus amigos), Agregar (código mal escrito, propio, válido → Diego → Enviar → aviso), perfil de Javiera (áreas, «Ver sus 17 logros», Eliminar con confirmación), Tomás sin tarjeta, Cambiar mi código, «vacío» y apagado. Sin errores en consola.
Task 7: complete (commits fe5eab2..109cdfc, tests: bash -c 'npm test 2>&1 | grep -E "ℹ (pass|fail)" && npm run typecheck >/dev/null' → ℹ fail 0)
Task 8: auditoría (firebase-security-rules-auditor, autoauditoría): puntaje 4/5 antes de corregir. Hallazgo corregido: se podían acumular códigos (crear uno nuevo sin borrar el viejo) — regla `codigos.create` exige que el código anterior de la tarjeta ya no exista al final del lote; prueba `F cambiar código y nombre` (AAA777 sin borrar AAA567) RED→GREEN, emulador 15/15 OK.
Task 8: Ruling: quedan como menores aceptados (sin cambio): 1) quien fue rechazado puede volver a enviar (no hay bloqueo, fuera de alcance §10); 2) el nombre de la tarjeta lo elige cada uno, así que alguien podría ponerse el nombre de otra persona; 3) `desde` solo se acota a 10 caracteres, sin formato; 4) la tarjeta la escribe el propio teléfono (aceptado en la spec §4.3) — costo si es incorrecto: molestias o datos falsos en la tarjeta de quien los pone, sin acceso a datos ajenos.
Task 8: reglas publicadas con `npm run deploy:rules` el 26/10 con permiso del usuario («Deploy complete!»; avisos previos de funciones sin usar `step` y `reward`).
Task 8: prueba real (reglas publicadas, 8081, PruebaClaude «Claudio» + segunda cuenta del usuario): «Primero, tu nombre» visto; código creado solo al tener nombre (NEKA-78VXUR); la solicitud del usuario llegó en vivo («Perfil, 1 solicitud»); buscar su código desde Claudio → «Esa persona ya te envió una solicitud.» + Aceptar → amigos; tarjeta del amigo leída en vivo (roles, desde, nivel, 2 logros, sin áreas porque no tiene mesas con número); «Primer amigo» al cerrar la hoja y guardado como visto (8 de 25, sin errores de sincronización); cambiar código (NEKA-QNPD7Z) y el viejo → «No encontramos ese código…»; la amistad sigue.
Task 8: arreglo de texto visto en la prueba: «Nivel 1 · 1 logros» → «1 logro» en `FilaAmigo`.
Task 8: eliminar desde Claudio: confirmación «¿Eliminar a Nicolas Arancibia?», la amistad se borró y la hoja volvió a Amigos sin errores.
Task 8: el usuario confirmó que Claudio desapareció de su lista y que ya no ve su tarjeta. Pendiente del usuario: la prueba sin internet en el iPhone (modo avión → Buscar → «Sin conexión…»), queda en el registro.
Task 8: complete (commits 109cdfc..4b79a2a, tests: bash -c 'export PATH="/c/Program Files/Eclipse Adoptium/jdk-21.0.12.101-hotspot/bin:$PATH"; npm test 2>&1 | grep -E "ℹ fail" && npm run test:firestore 2>&1 | grep -c "^OK Firestore"' → 15)
Final review: self-review (no subagent tool; el usuario prefiere no usar subagentes) sobre review-9779245..4b79a2a.diff, con la Review Focus del plan: RF1 (código con NEKA) probado; RF2 (publicar solo con base remota) probado; RF3 (cruce) probado en emulador y en la prueba real; RF4 (nombre falso) probado en emulador; RF5 (sin internet) queda para la prueba del usuario en el iPhone. Sin hallazgos Critical ni Important.
Final: minor (deferred): al abrir la app con cuenta, la sección Amigos puede mostrar un instante el estado «sin amigos» mientras carga (`estado === "cargando"`).
Final: minor (deferred): si el otro rechaza o cancela justo cuando tú cancelas o rechazas, el borrado falla con «No se pudo completar…» (el papel ya no existe); la lista se actualiza sola igual.
Final: minor (deferred): `conPlazo` no tiene prueba unitaria (se verifica en la prueba sin internet del iPhone).
