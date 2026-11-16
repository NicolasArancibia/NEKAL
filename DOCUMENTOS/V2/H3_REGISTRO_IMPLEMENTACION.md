# H3 · Conectar cuentas (Google y Outlook) — registro de implementación

Copia del ledger de ejecución (`.superpowers/sdd/H3_PLAN_IMPLEMENTACION/progress.md`) al cerrar la fase, 16/11/2026. Spec: [H3_CONEXIONES.md](H3_CONEXIONES.md) · Plan: [H3_PLAN_IMPLEMENTACION.md](H3_PLAN_IMPLEMENTACION.md) · Guía: [H3_GUIA_TRAMITES.md](H3_GUIA_TRAMITES.md).

**Resultado:** Google y Outlook se conectan sin servidor ni plan Blaze, en el computador (localhost) y en el iPhone (versión de prueba `https://nekal-973b2--conexiones-ejdpfomm.web.app`, vence el 16/12). 349 pruebas, typecheck y build:web en verde; reglas de `settings/conexiones` publicadas.

**Pendiente para H4:** probar en el iPhone con Nekal *instalada* (Agregar a inicio) que la vuelta de Google y Microsoft regresa a la app y no a Safari; agregar la URL definitiva cuando se publique en `nekal-973b2.web.app`.

---


Rama v2/h3-conexiones desde 3a1f8b2 (main). Spec: DOCUMENTOS/V2/H3_CONEXIONES.md.

## Pre-flight
| Tareas | Produce → consume | Hallazgo |
|---|---|---|
| 1 → 2 | tipos Cuenta/Conexiones/Proveedor | coinciden |
| 1 → 5 | urlGoogle, leerVuelta, permisosGoogle, PaseGoogle | coinciden |
| 2 → 3 | normalizarConexiones, CONEXIONES_VACIAS | coinciden |
| 2,5,6 → 7 | estadoCuenta(tienePase, vence, correoPermitido), paseGoogle, paseMicrosoft | coinciden |
| 7 → 8 | useConexiones | coinciden |

Ruling: cambios ajenos sin commitear en front/src/utils/model.ts (formato + color General #7546EC) y CLAUDE.md, de otra sesión — no se tocan ni se commitean; en model.ts se commitea solo mi parte armando el índice desde HEAD — costo si mal: un commit con cambios ajenos, reversible.
Ruling: Task 2 (estadoCuenta) se implementa en la misma pasada TDD que Task 1 pero con su propio commit.
Ruling: el usuario autorizó publicar las reglas (14/11: «de ahí publica las reglas y lo pruebo»); el permiso de API de Microsoft se salta (consentimiento dinámico con cuentas personales).
Task 1: Ruling: el RED fue de compilación (archivos ausentes), no de aserción — los módulos no existían; las aserciones se vieron pasar tras implementar — costo: bajo. estado.ts queda como stub para compilar hasta Task 2.
Task 1: complete (commits 3a1f8b2..95a7022, tests: npm --prefix front test → ℹ duration_ms 1473.1164)
Task 2: complete (commits 95a7022..8ea30ab, tests: npm --prefix front test → ℹ duration_ms 1458.0307)
Task 3: RED: sync.cjs falló por settings/conexiones ausente; emulador sin la regla nueva → PERMISSION_DENIED en la migración (verificado quitando la línea y restaurándola).
Task 3: Ruling: auditoría de reglas inline en vez de cargar la skill firebase-security-rules-auditor — el cambio es una línea en una ruta solo-dueño: claves exactas (fields), lista ≤6, bool; los elementos de la lista no se validan en reglas (solo el propio dueño puede escribir su documento; validateRecords los acota en el cliente) — costo si mal: un usuario podría guardar elementos raros en su propio documento, sin efecto sobre otros.
Task 3: commit 8ea30ab..HEAD con model.ts armado desde HEAD (solo 4 líneas mías); los 28 cambios ajenos siguen sin stage.
Task 3: complete (commits 8ea30ab..5e01639, tests: npm --prefix front test → ℹ duration_ms 1503.6903)
Task 3: reglas publicadas con npm run deploy:rules (permiso del usuario 14/11) — Deploy complete.
Task 4: Ruling: íconos generados con System.Drawing de Windows (Pillow no está instalado) — mismo resultado — costo: ninguno.
Task 4: complete (commits 5e01639..e0b54a7, tests: npm --prefix front test → ℹ duration_ms 1579.1874)
Task 5: complete (commits e0b54a7..39bbe74, tests: npm --prefix front run typecheck → > tsc --noEmit)
Task 6: Ruling: @azure/msal-browser fijado en ^4.30.0, no 5.x — la v5 exige una página «redirect bridge» aparte para todos los flujos; la v4 procesa la vuelta con handleRedirectPromise en la misma página (redirectUri = origin, ya registrado) — costo si mal: migrar a v5 más adelante (agregar la página puente).
Task 6: build:web se verifica en Task 7 (microsoft.ts aún no está importado).
Task 6: complete (commits 39bbe74..726cb37, tests: npm --prefix front run typecheck → > tsc --noEmit)
Task 7: complete (commits 726cb37..0c2be43, tests: npm --prefix front run typecheck → > tsc --noEmit)
Task 8: Ruling: el detalle de una cuenta (Actualizar/Desconectar + confirmación) se despliega en la misma fila, no en un Sheet — Ajustes ya es un panel y el proyecto evita paneles anidados (Modal sobre Modal en iPhone) — costo si mal: rehacer como hoja.
Task 8: Ruling: el estado «Toca para actualizar» usa punto color.warning + texto secundario (no texto ámbar) — el tema no tiene un tono de aviso legible como texto — costo: ninguno.
Task 8: Ruling: nekalConexiones() acepta modos "hoja" | "vuelta" | "error" | false (solo __DEV__) para revisar A1/A2/error en invitado — costo: ninguno en producción.
Task 8: arreglos en la verificación: (1) la hoja se escondía al contarse a sí misma como hoja abierta → visible usa `mostrar || hojas === 0`; (2) botón dentro de botón en FilaCuenta → la parte tocable y «Actualizar» son hermanos.
Task 8: verificado en invitado (8082, móvil 375×812): A1, A2, error, Ajustes con 2 filas, desplegar y confirmar desconectar; 0 botones anidados. URL de Google aceptada (pantalla «Ir a Nekal», sin redirect_uri_mismatch); URL de Microsoft sin error AADSTS.
Task 8: complete (commits 0c2be43..11229eb, tests: npm --prefix front test → ℹ duration_ms 1580.9879)
Task 9: esperando la prueba real del usuario en http://localhost:8081 (servidor nekal-web reutilizado).
Task 9: prueba real del usuario (15/11) en su Chrome, localhost:8081: Google (nicoarancibia2003@gmail.com, pasando el aviso «app no verificada» → Continuar) y Outlook conectados, ambas filas «Activa» en Ajustes. Pendiente opcional: desconectar y cancelar a propósito.
Task 10: canal de vista previa publicado con permiso del usuario (16/11): https://nekal-973b2--conexiones-ejdpfomm.web.app (vence 2026-12-16). Ruling: la build incluyó los cambios ajenos sin commitear de model.ts (formato + color General) porque predeploy compila el árbol de trabajo — costo: el color de la mesa General en cuentas nuevas de la vista previa; nada en producción.
Task 10: el usuario conectó Google y Outlook en el iPhone con la versión de prueba (16/11), tras registrar la URL del canal en Google y Microsoft.
Final review: /code-review high (en esta sesión, sin subagente revisor) — 8 hallazgos.
Final: fixed «Actualizar» de Google silencioso sin vuelta interactiva — test «tras un intento silencioso que pide un toque…» RED→GREEN, suite 349/349.
Final: fixed la hoja se ofrecía antes de la primera sincronización — test «ofrecer la hoja solo tras la primera sincronización» RED→GREEN, suite 349/349.
Final: fixed vueltas iniciadas desde Ajustes nunca se mostraban — HojaConectar muestra cualquier `ultima` (tras redirigir, la app recarga en el Resumen); sin prueba unitaria (UI), cubierto por el mismo camino que «inicio» verificado en invitado.
Final: fixed acquireTokenSilent caía a un iframe con toda la app cada 30 s — cacheLookupPolicy AccessTokenAndRefreshToken (2); sin prueba unitaria (red).
Final: fixed recalcular se recreaba en cada sincronización — dependencia en clave estable proveedor:correo.
Final: minor (deferred): marcarOfrecido + redirección inmediata puede perder el guardado (se autocorrige: la vuelta muestra la hoja y «Continuar»/«Ahora no» lo vuelve a marcar).
Final: Ruling: reglas no validan cada elemento de settings/conexiones.cuentas — ruta solo-dueño y validateRecords lo acota en el cliente — costo si mal: un cliente modificado guarda datos raros en su propio documento.
Final: minor (deferred): tamaños numéricos sueltos en la UI de conexiones (64, 7, 104×118, íconos 15/16/18), mismo patrón que LogroNuevo; tests/styles.cjs no los marca.
