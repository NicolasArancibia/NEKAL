# V2 · F — Notas del brainstorming (Amigos)

Brainstorming empezado el 26 de octubre de 2026, después de cerrar E. Parte del [ROADMAP](ROADMAP.md). Todavía **no hay spec**: estas son las decisiones tomadas hasta ahora, una pregunta a la vez.

## Entendimiento (aprobado el 26/10)

- **Alcance:** F = el perfil y poder tener amigos, nada más. Los espacios compartidos (G) quedan para después. Sin chat ni compartir cosas.
- **Para qué:** agregar a un amigo y ver su perfil en corto (nombre, nivel, logros y áreas de sus mesas). El Perfil ya es «lo que muestras» desde E.
- **Listo cuando:** dos cuentas reales se agregan y cada una ve el perfil de la otra; quien no es tu amigo no ve nada tuyo. Funciona en la web y en el iPhone.
- **Sin servidor:** datos reales en Firebase y lo que cada uno puede ver lo controlan las reglas. Sin Cloud Functions (piden el plan pagado con tarjeta).
- **Invitado:** no tiene cuenta en la nube, así que no puede tener amigos; ve «Crea una cuenta para agregar amigos».
- **Logro:** se suma «Primer amigo».
- **Pruebas:** hacen falta dos cuentas; el usuario crea una segunda cuenta de prueba y escribe la clave.

## Decidido por el usuario

| Tema | Decisión |
|---|---|
| Camino | Arquitectónico: preguntas → maquetas → diseño por secciones → spec → plan. |
| Cómo se encuentran | **Código de amigo.** Cada cuenta tiene un código corto al azar (ej. `NEKA-7KQ2`) que se comparte con un botón «Compartir» (WhatsApp, etc.) y el otro lo pega en Nekal. Se puede cambiar por uno nuevo si se filtra. Descartados: por correo (sin servidor, cualquiera podría probar correos y saber quién usa Nekal) y nombre de usuario (más trabajo, poco más que el código). |
| Solicitud | **El otro acepta.** Al pegar un código le llega «X quiere ser tu amigo/a» con Aceptar o Rechazar; hasta que acepta, ninguno ve el perfil del otro. Cualquiera de los dos puede eliminar la amistad cuando quiera. Descartado: amistad inmediata (si el código se filtra, cualquiera te ve). |
| Dónde viven | **A y B juntas** ([maqueta 01](F_MAQUETA/01-donde-viven-tus-amigos.html) → [maqueta 02](F_MAQUETA/02-amigos-a-y-b.html)). En el Perfil, bajo tu tarjeta, la sección **Amigos**: la solicitud pendiente con Aceptar / Rechazar y una fila con tus amigos y su nivel. Arriba, un botón de personas junto al engranaje. «Agregar» y ese botón abren la misma **hoja Amigos**: tu código, Compartir, Agregar con un código, solicitudes y la lista completa. La pestaña Perfil muestra cuántas solicitudes hay sin responder. Descartado: «3 amigos» en la tarjeta (la solicitud se nota menos). |
| Qué ve un amigo | **Sus áreas, sin nombres de mesas** ([maqueta 03](F_MAQUETA/03-que-ve-un-amigo.html), opción A). Al tocar a un amigo (en la fila o en la hoja Amigos) se abre una hoja con su perfil en corto: inicial, roles, «En Nekal desde», nivel con puntos, los logros que **ya consiguió** (8 + «Ver sus N logros») y **Sus áreas**: una fila por área con el promedio de sus mesas de esa área y cuántas mesas son (ej. «Estudio 66 · 2 mesas»). Al final, «Eliminar amigo». No ve cosas, calendario, racha ni chat con Neka. Descartado: mesas con nombre (pueden ser personales). |
| Agregar con código | **Ves a quién antes de enviar** ([maqueta 04](F_MAQUETA/04-agregar-con-codigo.html), opción A). En la hoja Amigos, «Agregar con un código» abre la página «Agregar amigo» (‹ vuelve): pegas el código, «Buscar» muestra **solo el nombre** y «Enviar solicitud». Queda en **Enviadas** («Pendiente») con «Cancelar». Avisos: código que no existe, tu propio código, alguien que ya es tu amigo. «Compartir» abre el menú del teléfono con «Agrégame en Nekal con mi código …». El código tendrá **6 letras** (difícil de adivinar, porque buscar muestra el nombre). Descartado: enviar directo sin ver a quién. |
| Logro | **Se suma «Primer amigo»** (logro 25, familia «primeras veces», ícono de personas). Se gana cuando se acepta tu primera amistad (la enviaste o la recibiste), con el mismo modal de E; no se pierde si después eliminas al amigo. El Perfil pasa a «de 25» y las reglas suman el id. |
| Enfoque | **Tarjeta pública + amistades** (sin servidor). La caja privada `users/{uid}` no cambia; se suman códigos, amistades y tarjetas. Descartados: que el amigo lea la caja privada (las reglas no ocultan campos) y Cloud Functions (plan pagado). |

## Diseño aprobado por secciones

**1 · Firebase y reglas** (aprobada el 26/10):

| Qué | Guarda | Lee | Escribe |
|---|---|---|---|
| `codigos/{CODIGO}` | `uid` y `nombre` | cualquiera con cuenta, solo con `get` del código exacto (sin listar) | solo el dueño |
| `amistades/{uidMenor_uidMayor}` | `de`, `para`, `miembros`, `estado` (`pendiente`/`aceptada`), `nombreDe`, `nombrePara`, `codigo`, `creada`, `aceptada` | solo los dos miembros | crea `de` (con el código real de `para`); acepta solo `para` (sin cambiar nada más); borra cualquiera de los dos |
| `perfiles/{uid}` (tarjeta) | `nombre`, `roles`, `desde`, `nivel`, `puntos`, `logros`, `areas` (área, valor, mesas), `codigo`, `actualizado` | el dueño y quien tenga amistad **aceptada** | solo el dueño |

- Enviar exige que `codigos/{codigo}.uid == para`. Borrar la amistad corta la lectura de la tarjeta al tiro.
- El código se crea en el mismo lote que actualiza `perfiles/{uid}.codigo` (regla con `getAfter`); cambiarlo borra el viejo. Los amigos actuales no se pierden.
- Límites de la tarjeta: nivel ≤ 200, ≤ 25 logros del catálogo, áreas de las 6 válidas, valores 0–100.
- `primer-amigo` se suma a la lista de logros de `users/{uid}/logros`.
- Código: 6 caracteres de `23456789ABCDEFGHJKMNPQRSTUVWXYZ` (sin 0/O/1/I/L), se muestra `NEKA-7KQ2PX`; al escribirlo se ignoran mayúsculas, guiones, espacios y «NEKA». ~887 millones de combinaciones.
- Solicitudes cruzadas: un solo papel por pareja; el segundo ve «Esa persona ya te envió una solicitud» y puede aceptarla.
- Cambio de nombre: se actualizan tarjeta y código; las pendientes guardan el nombre con que se enviaron.
- Fuera de F: borrar la cuenta y avisos push (solo el número en la pestaña Perfil).

**2 · Lógica pura en `utils/amigos/`** (aprobada el 26/10), con TDD:
- `codigo.ts`: crear (6 caracteres, azar inyectable), normalizar lo escrito (mayúsculas, guiones, espacios, «NEKA»; letras prohibidas o largo malo = no válido) y mostrar (`NEKA-7KQ2PX`).
- `tarjeta.ts`: tarjeta desde tus datos (nombre, roles, mes de inicio, nivel, puntos, logros conseguidos más recientes primero, áreas = promedio redondeado de las mesas con número, de mayor a menor) y comparación para no reescribir si no cambió.
- `amistades.ts`: id de pareja (igual en los dos sentidos), tres listas (Solicitudes, Enviadas, Tus amigos), revisión antes de enviar (propio código, ya amigos, ya enviada, te envió → Aceptar) y filas de amigos (nombre de la solicitud si la tarjeta no cargó).
- Logro: `primer-amigo` en `LOGRO_IDS` y `CATALOGO` (ícono `people-outline`); `Hechos` suma `amigos` y se cumple con ≥ 1; visto queda guardado. Los «24» escritos a mano (Perfil, GrillaLogros, HojaLogros) pasan a `LOGRO_IDS.length`.

**3 · Conexión con Firebase** (aprobada el 26/10):
- `utils/amigos/nube.ts` es lo único que habla con Firestore (buscar código, enviar, aceptar, borrar, publicar tarjeta, crear o cambiar código). `utils/AmigosContext.tsx` lo junta para las pantallas (como `NekaContext`).
- Con cuenta: escucha en vivo las amistades (`miembros` contiene tu uid) y la tarjeta de cada amigo aceptado; el número de solicitudes recibidas va a la pestaña Perfil.
- Publica tu tarjeta sola cuando cambia (espera ~2 s, no escribe si es igual) y **solo después de la primera sincronización** (un teléfono recién abierto no sube «Nivel 1»). La primera vez crea tu código; si choca con uno existente, prueba otro.
- El cálculo de logros recibe cuántos amigos tienes («Primer amigo»).
- Botones con estado «trabajando» hasta que Firebase confirma; sin internet, aviso «Sin conexión. Revisa tu internet y reintenta» tras unos segundos. Si se corta mientras miras, se mantiene lo último cargado con un aviso suave.
- «Compartir» usa el menú del teléfono; si el navegador no lo tiene, muestra el texto para copiar.
- Invitado: no se conecta; «Crea una cuenta para agregar amigos» abre «Tu cuenta Nekal». Al cerrar sesión o cambiar de cuenta, deja de escuchar y limpia.
- `nekalAmigos()` (solo desarrollo, como `nekalDemo()`) carga amigos y solicitudes de ejemplo para revisar las pantallas en modo invitado (8082). La prueba real es con PruebaClaude y una segunda cuenta del usuario.

**4 · Pantallas** (aprobada el 26/10; estados en la [maqueta 05](F_MAQUETA/05-estados.html)):
- `components/ui/amigos/`: sección Amigos del Perfil (solicitudes con Aceptar/Rechazar, máximo dos y «Ver todas»; fila con «Agregar» que se desliza), hoja Amigos con tres páginas (Amigos · Agregar amigo · perfil de un amigo; ‹ vuelve), y piezas chicas (inicial, solicitud, fila de amigo, fila de área).
- Hoja Amigos: tu código + Compartir, «Agregar con un código», Solicitudes, Enviadas, Tus amigos y al final «Cambiar mi código» (confirmación en la hoja: «Tu código actual dejará de funcionar. Tus amigos no se pierden»). Tocar un amigo en la fila del Perfil abre directo su página.
- Perfil de un amigo: maqueta 03; «Ver sus N logros» despliega el resto ahí mismo; «Eliminar amigo» se confirma en la misma hoja.
- Estados: sin amigos (Neka pose 3 + «Agregar amigo»), invitado («Crear cuenta» abre «Tu cuenta Nekal», sin botón de personas), sin nombre (la hoja pide el nombre antes de dar código).
- Cambios: Perfil con botón de personas (solo con cuenta) y sección Amigos bajo tu tarjeta; logros «de 25»; la pestaña Perfil muestra el número de solicitudes («Perfil, 1 solicitud» para el lector de pantalla); el modal de «Primer amigo» sale al cerrar la hoja.
- Cuidado: vibración de éxito al enviar y aceptar; toques ≥ 44; etiquetas en botones de ícono; solo tokens de `theme.ts` y `Txt`; amigos ordenados por nombre.

**5 · Pruebas, verificación y cierre** (aprobada el 26/10):
- Rama `v2/f-amigos`, ledger y TDD. `tests/amigos.cjs` (nuevo), `tests/progreso.cjs` (logro y catálogo de 25), `npm test`, `typecheck` y `build:web`.
- Reglas: casos en `tests/firestore.cjs` corridos en el emulador. **El usuario pidió instalar Java 21**: instalado el 26/10 (Temurin 21.0.12 con winget). Auditoría con `firebase-security-rules-auditor`; publicar con `npm run deploy:rules` solo con permiso, antes de la prueba real.
- Pantallas en modo invitado (8082) con `nekalDemo()` + `nekalAmigos()`.
- Prueba real con PruebaClaude (el usuario escribe la clave) y una segunda cuenta creada por el usuario, idealmente en su iPhone.
- Cierre como en E: autorrevisión, `F_REGISTRO_IMPLEMENTACION.md` con pasos para el iPhone, CLAUDE.md, ROADMAP y mezcla en `main`. Las fechas del ROADMAP no se mueven sin preguntar.

Spec escrita: [F_AMIGOS.md](F_AMIGOS.md).
