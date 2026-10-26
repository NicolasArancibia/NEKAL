# Subproyecto F · Amigos — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar amigos con un código de 6 caracteres y una solicitud que el otro acepta, y ver el perfil en corto de cada amigo (nivel, logros conseguidos y áreas), con datos reales en Firebase y el logro «Primer amigo».

**Architecture:**
- **Lógica pura y probada** en `front/src/utils/amigos/`: `codigo`, `tarjeta`, `amistades` y `ejemplo`. No importa React, React Native ni Firebase.
- **Firebase**: tres colecciones nuevas (`codigos`, `amistades`, `perfiles`) fuera de la caja privada `users/{uid}`, protegidas por reglas. Solo `utils/amigos/nube.ts` habla con Firestore.
- **Estado**: `utils/AmigosContext.tsx` escucha amistades y tarjetas, publica tu tarjeta y expone acciones. La UI vive en `components/ui/amigos/`.

**Tech Stack:**
- Expo 57, React Native 0.86, React 19, TypeScript, Firebase JS SDK 12 (Firestore).
- `Share` de `react-native` (ya incluido) para «Compartir».
- Pruebas con `node:test` mediante `front/tests/run.cjs`; reglas con `@firebase/rules-unit-testing` en el emulador (`npm run test:firestore`, Java 21 instalado el 26/10).

**Spec:** [F_AMIGOS.md](F_AMIGOS.md), con el registro en [F_NOTAS_BRAINSTORMING.md](F_NOTAS_BRAINSTORMING.md). Maquetas: [02](F_MAQUETA/02-amigos-a-y-b.html), [03](F_MAQUETA/03-que-ve-un-amigo.html), [04](F_MAQUETA/04-agregar-con-codigo.html) y [05](F_MAQUETA/05-estados.html).

## Global Constraints

**Trabajo**
- Rama `v2/f-amigos` desde `main`. Git solo local. `skills-lock.json` y `IDEAS_ESPACIODETRABAJO/FAV/` no se tocan.
- Ejecución nativa con ledger en `.superpowers/sdd/F_PLAN_IMPLEMENTACION/progress.md`. Cada decisión fuera del plan = `Ruling` en el ledger.
- **Sin dependencias nuevas.** Antes de usar una API de Expo o React Native que no esté ya en el código, consultar la doc (MCP `context7`).
- Los archivos de `src/utils/amigos/` salvo `nube.ts` son puros. Se agregan a la lista de `tests/run.cjs` y compilan a `.test-build/amigos/`.
- En PowerShell, antes de `npm run test:firestore`, refrescar el PATH para que encuentre Java: `$env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")`.

**Interfaz (sistema A)**
- Solo tokens de `styles/theme.ts` y componentes de `components/ui/base/`; sin colores, `fontSize` ni `fontWeight` sueltos (lo verifica `tests/styles.cjs`). Texto siempre con `Txt`. Íconos Ionicons `*-outline`. Toques de 44×44 o más (botones `small` con `hitSlop`, como `Button`).
- El círculo de inicial de un amigo: fondo `color.primarySoft`, letra `color.primary` (tu propio avatar sigue en `color.primary`). El número rojo: fondo `color.danger`, texto `onPrimary`.
- Con `useReducedMotion()`: sin resortes, solo fundidos. Neka (pose 3) solo en los estados vacíos, una vez por pantalla.

**Textos fijos** (tuteo, se copian tal cual):
- **Perfil:** «Amigos», «Agregar», «Nivel N», «Ver todas», «quiere agregarte», «Aceptar», «Rechazar», «n de 25».
- **Hoja:** «Amigos», «Cerrar», «Tu código», «Compartir», «Agregar con un código», «Solicitudes», «Enviadas», «Pendiente», «Cancelar», «Tus amigos», «Nivel N · M logros», «Cambiar mi código», «Tu código actual dejará de funcionar. Tus amigos no se pierden.», «Primero, tu nombre», «Tus amigos te van a reconocer por tu nombre. Escríbelo y te damos tu código.», «Escribir mi nombre».
- **Agregar amigo:** «Agregar amigo», «Pídele su código a tu amigo. Lo encuentra en su Perfil, en Amigos.», «Código de tu amigo», «Buscar», «Buscando…», «¿Le envías una solicitud?», «Enviar solicitud», «Enviando…», «Le enviamos tu solicitud a {nombre}.».
- **Avisos (`AVISOS`):** «No encontramos ese código. Revisa que esté bien escrito.», «Ese es tu código.», «Ya son amigos.», «Ya le enviaste una solicitud.», «Esa persona ya te envió una solicitud.», «Sin conexión. Revisa tu internet y reintenta.», «No se pudo completar. Revisa tu conexión y reintenta.».
- **Perfil de un amigo:** «En Nekal desde {mes} de {año}», «Logros», «Ver sus N logros», «Sus áreas», «cómo va en cada una», «1 mesa» / «N mesas», «Eliminar amigo», «¿Eliminar a {nombre}? Ya no verán sus perfiles. Para volver a ser amigos, uno tiene que enviar otra solicitud.», «Eliminar», «Su perfil aparece cuando abra Nekal.».
- **Estados:** «Comparte tu código o pega el de un amigo para ver cómo va cada uno.» + «Agregar amigo»; «Crea una cuenta para agregar amigos. Así tu progreso también queda guardado.» + «Crear cuenta».
- **Compartir:** «Agrégame en Nekal con mi código NEKA-XXXXXX».
- **Logro:** nombre y corto «Primer amigo», frase «Te hiciste amigo de alguien en Nekal.», pista «Agrega a alguien con su código.».
- **VoiceOver:** botón de personas «Amigos»; pestaña «Perfil, 1 solicitud» / «Perfil, N solicitudes»; «Volver a Amigos».

**Datos**
- Colecciones y campos exactos de la spec §5.1. Ids: `codigos/{CODIGO}`, `amistades/{uidMenor_uidMayor}`, `perfiles/{uid}`.
- `back/firestore.rules` se edita en la Task 5 y **solo se publica con `npm run deploy:rules` y permiso explícito del usuario** (Task 8).
- No se escribe ni se guarda la clave de PruebaClaude: el usuario inicia sesión. El log del servidor web imprime el token de App Check: leerlo solo con filtro y nunca repetirlo.

## Review Focus

1. **Un código que empieza con «NEKA».** N, E, K y A están en el alfabeto, así que `NEKA7K` es un código válido y no se le quita nada; «NEKA» solo se quita si, sin guiones ni espacios, quedan 10 caracteres. → Task 1, `amigos: código que empieza con NEKA`.
2. **Un teléfono recién abierto, sin internet.** Si se publicara antes de leer la nube, subiría «Nivel 1» encima de la tarjeta real. Se publica solo con la base remota conocida y sin «Conectando»/«Sincronizando». → Task 3, `amigos: listo para publicar`.
3. **Los dos se envían solicitud a la vez.** Hay un solo papel por pareja: el segundo `create` falla por reglas y la app muestra «Esa persona ya te envió una solicitud.» cuando la lista ya la trae. → Task 4 `amigos: revisar envío` y Task 5 `F: segundo envío a la misma pareja falla`.
4. **Alguien se hace pasar por otro en la solicitud.** `nombreDe` debe ser el nombre de la tarjeta de quien envía y `nombrePara` el del código. → Task 5, `F: nombre falso en la solicitud falla`.
5. **Sin internet al apretar un botón.** El botón no queda pegado: a los 10 s vuelve con «Sin conexión…». Las acciones que deben confirmarse usan transacción (fallan sin red en vez de quedar en cola). → Task 8, paso de la prueba real con modo avión.

## Estructura de archivos

| Archivo | Qué hace |
|---|---|
| `utils/amigos/codigo.ts` | `ALFABETO`, `LARGO`, `nuevoCodigo`, `normalizarCodigo`, `mostrarCodigo` |
| `utils/amigos/tarjeta.ts` | `Tarjeta`, `agruparAreas`, `areasDe`, `areasOrdenadas`, `tarjetaDe`, `mismaTarjeta`, `listoParaPublicar` |
| `utils/amigos/amistades.ts` | `Amistad`, `idPar`, `otroDe`, `listas`, `revisarEnvio`, `AVISOS`, `filasAmigos` |
| `utils/amigos/ejemplo.ts` | datos de `nekalAmigos()` |
| `utils/amigos/nube.ts` | Firestore: buscar, enviar, aceptar, borrar, publicar, crear código, escuchar, `conPlazo` |
| `utils/AmigosContext.tsx` | `AmigosProvider`, `useAmigos` |
| `utils/model.ts`, `utils/progreso/logros.ts` (modificar) | `primer-amigo`, `Hechos.amigos` |
| `utils/useProgreso.ts`, `components/ui/progreso/{LogroNuevo,GrillaLogros,HojaLogros}.tsx` (modificar) | amigos en los logros, «25» |
| `components/ui/amigos/` | `Inicial`, `TarjetaSolicitud`, `FilaAmigo`, `FilaArea`, `SeccionAmigos`, `HojaAmigos`, `PerfilAmigo` |
| `pages/Perfil.tsx`, `components/ui/base/TabBar.tsx`, `navigation/TabNavigator.tsx` (modificar) | pantallas y número de la pestaña |
| `back/firestore.rules` (modificar) | reglas de §5.2 |
| `tests/amigos.cjs` (nuevo), `tests/progreso.cjs`, `tests/rules.cjs`, `tests/firestore.cjs`, `tests/run.cjs` (modificar) | pruebas |

Para las pruebas de amigos: `now = new Date(2030, 4, 12, 18, 0).getTime()` (como `tests/progreso.cjs`).

---

### Task 1: Código de amigo

**Files:**
- Create: `front/src/utils/amigos/codigo.ts`, `front/tests/amigos.cjs`
- Modify: `front/tests/run.cjs` (compilar `src/utils/amigos/codigo.ts`; `require("./amigos.cjs")` antes de `styles.cjs`)

**Interfaces:**
- Produces:
  ```ts
  export const ALFABETO = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  export const LARGO = 6;
  export function nuevoCodigo(azar: () => number = Math.random): string; // ALFABETO[Math.floor(azar() * 31)] × 6
  export function normalizarCodigo(texto: string): string | null;
  export function mostrarCodigo(codigo: string): string; // "NEKA-" + codigo
  ```
- `normalizarCodigo`: mayúsculas, quitar espacios y guiones; si quedan 10 caracteres y empieza con «NEKA», quitar esas 4; válido solo si quedan exactamente 6 caracteres del alfabeto.

- [ ] **Step 1: Pruebas (fallan):**
  - `amigos: normalizar código`: «neka-7kq2px», « 7KQ 2PX », «NEKA7KQ2PX» y «7kq-2px» → `7KQ2PX`; «7KQ2P0», «7KQ2PO», «7KQ2PI», «7KQ2P1», «7KQ2PL», «7KQ2P», «7KQ2PXY» y «» → `null`.
  - `amigos: código que empieza con NEKA` (RF1): «NEKA7K» → `NEKA7K`; «neka-neka7k» → `NEKA7K`.
  - `amigos: código nuevo`: `nuevoCodigo(() => 0)` → `222222`; `nuevoCodigo(() => 0.9999)` → `ZZZZZZ`; 200 códigos con `Math.random` cumplen `normalizarCodigo(c) === c`.
  - `amigos: mostrar código`: `7KQ2PX` → `NEKA-7KQ2PX`.
- [ ] **Step 2:** `npm test` (desde la raíz). Expected: FAIL (no existe `.test-build/amigos/codigo.js`).
- [ ] **Step 3:** Implementar `codigo.ts`.
- [ ] **Step 4:** `npm test` y `npm run typecheck`. Expected: PASS.
- [ ] **Step 5: Commit** `V2/F: código de amigo`.

---

### Task 2: Logro «Primer amigo» y catálogo de 25

**Files:**
- Modify: `front/src/utils/model.ts` (`LOGRO_IDS` suma `"primer-amigo"` al final), `front/src/utils/progreso/logros.ts`, `front/src/pages/Perfil.tsx` (línea «n de 24»), `front/src/components/ui/progreso/GrillaLogros.tsx` («Ver los 24 logros» en etiqueta y texto), `front/src/components/ui/progreso/HojaLogros.tsx` (comentario), `front/tests/progreso.cjs`, `front/tests/rules.cjs`

**Interfaces:**
- Produces:
  ```ts
  // progreso/logros.ts
  export type Hechos = { /* los 11 de hoy */ amigos: number };
  export function hechosDe(d: AppData, now: number, amigos = 0): Hechos;
  // CATALOGO suma, al final: primera("primer-amigo", "Primer amigo", "Primer amigo", "people-outline",
  //   "Te hiciste amigo de alguien en Nekal.", "Agrega a alguien con su código.")
  // cumple("primer-amigo", h) === h.amigos >= 1; avance → { valor: 0, texto: "Pendiente" } si no cumple
  ```
- Los textos «24» pasan a `LOGRO_IDS.length` (Perfil: «`${logrados.length} de ${LOGRO_IDS.length}`»; GrillaLogros: «Ver los `${LOGRO_IDS.length}` logros»).
- `readBackup` ya acota con `LOGRO_IDS.length`; no cambia.

- [ ] **Step 1: Pruebas (fallan):**
  - En `logros: catálogo de 24 con ids únicos`: renombrar a «de 25» y esperar 25.
  - `logros: primer amigo`: con `emptyData`, `cumple("primer-amigo", hechosDe(d, now, 0))` es `false` y con `1` es `true`; `avance` con 0 da «Pendiente».
  - `logros: primer amigo visto se queda sin amigos`: `d.logros = [{ id: "primer-amigo", at }]` → `desbloqueados(d, hechosDe(d, now, 0))` lo incluye y `porVer` no.
  - En `tests/rules.cjs`, `datos: logro desconocido, duplicado o más de 24 se rechaza` pasa a llamarse «… o más de 25». Se mantiene el caso de 25 copias de `racha-3` (falla por duplicado) y se agrega: `readBackup` con los 25 ids distintos → acepta.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** `npm test` y `npm run typecheck`. Expected: PASS (las demás pruebas de logros no cambian: `amigos` vale 0 por omisión).
- [ ] **Step 5: Commit** `V2/F: logro Primer amigo y catálogo de 25`.

---

### Task 3: Tarjeta y áreas

**Files:**
- Create: `front/src/utils/amigos/tarjeta.ts`
- Modify: `front/tests/amigos.cjs`, `front/tests/run.cjs`

**Interfaces:**
- Consumes: `totalPoints`, `AppData`, `Area`, `LogroId` (model); `nivelDe`; `dia1De`; `ratings`, `areaDe`, `AREAS` (mesas); `hechosDe`, `desbloqueados` (Task 2); `CONECTANDO`, `SINCRONIZANDO` (estadosNube).
- Produces:
  ```ts
  export type AreaTarjeta = { valor: number; mesas: number };
  export type Tarjeta = { nombre: string; roles: string; desde: string; nivel: number; puntos: number;
    logros: LogroId[]; areas: Partial<Record<Area, AreaTarjeta>>; codigo: string };
  export function agruparAreas(filas: { area: Area; valor: number | null }[]): Tarjeta["areas"];
  export function areasDe(d: AppData, now: number): Tarjeta["areas"]; // agruparAreas de ratings + areaDe
  export function areasOrdenadas(areas: Tarjeta["areas"]): ({ area: Area } & AreaTarjeta)[];
  export function tarjetaDe(d: AppData, now: number, amigos: number, codigo: string): Tarjeta;
  export function mismaTarjeta(a: Tarjeta, b: Tarjeta | null): boolean;
  export function listoParaPublicar(e: { conCuenta: boolean; base: boolean; estadoNube: string; nombre: string }): boolean;
  ```
- `tarjetaDe`: `nombre`/`roles` de `d.profile` recortados; `desde = dia1De(d, now)`; `puntos = Math.round(totalPoints(d))`; `nivel = nivelDe(puntos).nivel`; `logros = desbloqueados(d, hechosDe(d, now, amigos))` ordenados por `at` de `d.logros` de más nuevo a más viejo (uno sin ver cuenta como `now`; empate = orden del catálogo); `areas = areasDe(d, now)`.
- `agruparAreas`: ignora `valor === null`; por área, `valor = Math.round(promedio)` y `mesas` = cuántas entraron.
- `areasOrdenadas`: de mayor a menor `valor`; empate en el orden de `AREAS`.
- `mismaTarjeta`: `false` si `b` es `null`; compara todos los campos, con `logros` en orden y `areas` por contenido (sin importar el orden de las claves).
- `listoParaPublicar`: `conCuenta && base && estadoNube !== CONECTANDO && estadoNube !== SINCRONIZANDO && nombre.trim() !== ""`.

- [ ] **Step 1: Pruebas (fallan):**
  - `amigos: agrupar áreas`: `[estudio 70, estudio 61, salud 85, trabajo null]` → `{ estudio: { valor: 66, mesas: 2 }, salud: { valor: 85, mesas: 1 } }`.
  - `amigos: áreas de una cuenta vacía`: `areasDe(emptyData(), now)` → `{}`.
  - `amigos: áreas ordenadas`: salud 85, trabajo 78, estudio 66 en ese orden; con hogar 50 y social 50, hogar va antes.
  - `amigos: tarjeta de cuenta vacía`: perfil «Sofía Rojas» / «Estudiante» → nivel 1, puntos 0, `desde` = `localDay(new Date(now))`, logros `[]`, áreas `{}`, el código recibido.
  - `amigos: tarjeta con logros recientes primero`: `d.logros` con `primera-mesa` (1 de mayo) y `racha-3` (10 de mayo) → `["racha-3", "primera-mesa"]`.
  - `amigos: misma tarjeta`: copia igual → `true`; `null` → `false`; un logro distinto → `false`; mismas áreas con claves en otro orden → `true`.
  - `amigos: listo para publicar` (RF2): `true` solo con cuenta, base, estado «Sincronizado» y nombre; `false` sin base, con `CONECTANDO`, con `SINCRONIZANDO`, sin cuenta y con nombre «  ».
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** `npm test` y `npm run typecheck`. Expected: PASS.
- [ ] **Step 5: Commit** `V2/F: tarjeta y áreas`.

---

### Task 4: Amistades, avisos y datos de ejemplo

**Files:**
- Create: `front/src/utils/amigos/amistades.ts`, `front/src/utils/amigos/ejemplo.ts`
- Modify: `front/tests/amigos.cjs`, `front/tests/run.cjs`

**Interfaces:**
- Consumes: `Tarjeta` (Task 3).
- Produces:
  ```ts
  export type Amistad = { id: string; de: string; para: string; estado: "pendiente" | "aceptada";
    nombreDe: string; nombrePara: string; codigo: string };
  export type Persona = { uid: string; nombre: string };
  export function idPar(a: string, b: string): string; // menor_mayor, comparación de texto
  export function otroDe(a: Amistad, yo: string): Persona;
  export function listas(amistades: Amistad[], yo: string): { recibidas: Amistad[]; enviadas: Amistad[]; amigos: Amistad[] };
  export type Revision = { tipo: "ok" } | { tipo: "propio" | "ya-amigos" | "ya-enviada" } | { tipo: "te-envio"; id: string };
  export function revisarEnvio(persona: Persona, yo: string, amistades: Amistad[]): Revision;
  export const AVISOS: Record<"no-existe" | "propio" | "ya-amigos" | "ya-enviada" | "te-envio" | "sin-conexion" | "error", string>;
  export type FilaAmigo = { uid: string; id: string; nombre: string; nivel: number | null; logros: number | null; tarjeta: Tarjeta | null };
  export function filasAmigos(amigos: Amistad[], yo: string, tarjetas: Record<string, Tarjeta | null | undefined>): FilaAmigo[];
  // ejemplo.ts
  export const YO_EJEMPLO = "ejemplo-yo";
  export function amigosDeEjemplo(): { codigo: string; amistades: Amistad[]; tarjetas: Record<string, Tarjeta | null> };
  ```
- `listas`: recibidas = `pendiente` con `para === yo`; enviadas = `pendiente` con `de === yo`; amigos = `aceptada`. Cada lista por el nombre del otro (`localeCompare(_, "es")`).
- `revisarEnvio`: `propio` si `persona.uid === yo`; si hay amistad con ese uid: `aceptada` → `ya-amigos`, pendiente mía → `ya-enviada`, pendiente suya → `te-envio` con su `id`; si no, `ok`.
- `filasAmigos`: nombre, nivel y `logros.length` de la tarjeta si existe; si no, el nombre de `otroDe` y `null`. Por nombre.
- `amigosDeEjemplo` (maquetas 02–04): código `7KQ2PX`; Camila Soto (recibida), Diego Lagos (enviada), Javiera Muñoz (nivel 11, 5.980 pts, 17 logros, salud 85·1, trabajo 78·1, estudio 66·2), Martín Pérez (nivel 6, 8 logros) y Tomás Reyes **sin tarjeta** (aceptadas).

- [ ] **Step 1: Pruebas (fallan):**
  - `amigos: id de pareja`: `idPar("b","a") === idPar("a","b") === "a_b"`.
  - `amigos: listas`: con una recibida, una enviada y dos aceptadas, cada una en su lista y en orden de nombre («Ángela» antes que «Bruno»).
  - `amigos: revisar envío` (RF3): `propio`, `ya-amigos`, `ya-enviada`, `te-envio` con el id, y `ok`.
  - `amigos: filas de amigos`: Tomás sin tarjeta sale con su nombre de la solicitud y `nivel: null`; Javiera con nivel 11 y 17 logros.
  - `amigos: datos de ejemplo`: `listas` da 1 recibida, 1 enviada y 3 amigos; `filasAmigos` deja a Tomás sin tarjeta.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** `npm test` y `npm run typecheck`. Expected: PASS.
- [ ] **Step 5: Commit** `V2/F: amistades, avisos y datos de ejemplo`.

---

### Task 5: Reglas de Firestore

**Files:**
- Modify: `back/firestore.rules`, `front/tests/firestore.cjs`

**Interfaces:**
- Funciones nuevas de reglas (junto a las de hoy):
  ```
  function codigoOk(c) {return c is string && c.matches('^[2-9A-HJKMNP-Z]{6}$');}
  function nombreOk(v) {return v is string && v.size() > 0 && v.size() <= 80;}
  function par(a,b) {return a < b ? a + '_' + b : b + '_' + a;}
  function amigoDe(uid) {let p = /databases/$(database)/documents/amistades/$(par(uid, request.auth.uid)); return exists(p) && get(p).data.estado == 'aceptada';}
  function areaOk(a,k) {return !(k in a) || (fields(a[k],['valor','mesas']) && a[k].valor is int && a[k].valor >= 0 && a[k].valor <= 100 && a[k].mesas is int && a[k].mesas >= 1 && a[k].mesas <= 100);}
  ```
- `perfiles/{uid}`: `read` si `auth.uid == uid || amigoDe(uid)`; `create, update` si `owner(uid)` y `fields` exactos de la spec §4.1 con los límites de §5.2 (`logros.hasOnly([...25 ids])`, `areas.keys().hasOnly([6 áreas])` + `areaOk` por cada área, `codigoOk(codigo)`, `getAfter(codigos/codigo).data.uid == uid`, `actualizado == request.time`); `delete` si `owner(uid)`.
- `codigos/{codigo}`: `get` con cuenta; sin `list`; `create` como spec §5.2 (`getAfter(perfiles/auth.uid).data.codigo == codigo`); `update` solo `nombre` por el dueño; `delete` el dueño.
- `amistades/{id}`: `read` y `delete` si `auth.uid in resource.data.miembros`; `create` como spec §5.2, más `nombrePara == get(codigos/codigo).data.nombre` y `nombreDe == get(perfiles/de).data.nombre` (RF4); `update` como spec §5.2.
- `users/{uid}/logros`: la lista de ids suma `'primer-amigo'`.

- [ ] **Step 1: Pruebas en `tests/firestore.cjs`** (bloque «V2/F», con `alice`, `bob`, `carol` y un `tarjeta(codigo, nombre)` de ayuda; tiempos con `serverTimestamp()`):
  - `F: código y tarjeta`: alice crea código + tarjeta en un lote (ok); crear un código sin la tarjeta (falla); bob crea el mismo código de alice (falla); listar `codigos` (falla); bob hace `get` del código de alice (ok); tarjeta con nivel 999, un logro inventado o el área «deporte» (falla).
  - `F: solicitud`: bob envía a alice con el código de alice (ok); carol envía a alice con el código de bob (falla); bob se envía a sí mismo (falla); bob envía con `estado: 'aceptada'` (falla).
  - `F: segundo envío a la misma pareja falla` (RF3): alice envía a bob con el papel ya creado (falla).
  - `F: nombre falso en la solicitud falla` (RF4): `nombreDe` distinto de la tarjeta de bob (falla).
  - `F: aceptar y leer`: con la amistad pendiente, bob no lee la tarjeta de alice (falla); bob acepta (falla); alice acepta cambiando `codigo` (falla); alice acepta bien (ok); ahora bob lee la tarjeta de alice y alice la de bob (ok); carol no lee la amistad ni la tarjeta (falla); la consulta `where("miembros", "array-contains", "bob")` de bob (ok).
  - `F: eliminar`: carol borra la amistad (falla); bob la borra (ok); bob ya no lee la tarjeta de alice (falla).
  - `F: logro primer-amigo`: un logro visto `primer-amigo` en `users/alice/logros` con `a.commit(...)`, como el bloque de E (ok).
- [ ] **Step 2:** Refrescar el PATH y `npm run test:firestore`. Expected: FAIL en el bloque F.
- [ ] **Step 3:** Escribir las reglas.
- [ ] **Step 4:** `npm run test:firestore`. Expected: todos los «OK Firestore» de antes y los nuevos «OK Firestore: F …»; `npm test` sigue en verde.
- [ ] **Step 5: Commit** `V2/F: reglas de códigos, amistades y tarjetas`.

---

### Task 6: Nube, contexto y logros con amigos

**Files:**
- Create: `front/src/utils/amigos/nube.ts`, `front/src/utils/AmigosContext.tsx`
- Modify: `front/src/navigation/TabNavigator.tsx` (`AmigosProvider` por fuera de `NekaProvider`), `front/src/utils/useProgreso.ts` y `front/src/components/ui/progreso/LogroNuevo.tsx` (pasan `useAmigos().cuantos` a `hechosDe`)

**Interfaces:**
- Consumes: Tasks 1–4; `database()` (`utils/firebase`); `useApp()` (`user`, `data`, `cloudStatus`, `remoteData`).
- Produces:
  ```ts
  // nube.ts (Firestore; no se prueba en node)
  export function conPlazo<T>(p: Promise<T>, ms = 10000): Promise<T>;            // rechaza con Error("sin-conexion")
  export function buscarCodigo(db: Firestore, codigo: string): Promise<Persona | null>; // getDocFromServer
  export function enviarSolicitud(db: Firestore, yo: string, otro: Persona, codigo: string): Promise<void>;
  export function aceptarSolicitud(db: Firestore, id: string): Promise<void>;
  export function borrarAmistad(db: Firestore, id: string): Promise<void>;
  export function publicarTarjeta(db: Firestore, uid: string, t: Tarjeta, antes: Tarjeta | null): Promise<void>;
  export function crearCodigo(db: Firestore, uid: string, t: Tarjeta, viejo: string | null): Promise<void>;
  export function escucharAmistades(db: Firestore, uid: string, cb: (a: Amistad[]) => void, error: () => void): () => void;
  export function escucharTarjeta(db: Firestore, uid: string, cb: (t: Tarjeta | null) => void, error: () => void): () => void;
  // AmigosContext.tsx
  export type Busqueda = { tipo: "encontrado"; persona: Persona; codigo: string }
    | { tipo: "aviso"; aviso: keyof typeof AVISOS; id?: string };
  export type Amigos = {
    activo: boolean; // con cuenta o con ejemplo
    estado: "invitado" | "cargando" | "listo" | "sin-conexion";
    miCodigo: string | null;
    recibidas: Amistad[]; enviadas: Amistad[]; amigos: FilaAmigo[];
    solicitudes: number; cuantos: number;
    buscar(texto: string): Promise<Busqueda>;
    enviar(persona: Persona, codigo: string): Promise<void>;
    aceptar(id: string): Promise<void>;
    borrar(id: string): Promise<void>; // Rechazar, Cancelar y Eliminar
    cambiarCodigo(): Promise<void>;
  };
  export function AmigosProvider(props: { children: ReactNode }): JSX.Element;
  export function useAmigos(): Amigos;
  ```
- **Transacciones** (fallan sin red en vez de quedar en cola): `enviarSolicitud` (lee `codigos/{codigo}` y `perfiles/{yo}`, escribe la amistad con `nombreDe` de esa tarjeta), `aceptarSolicitud` y `crearCodigo` (escribe código + tarjeta y borra el viejo). `publicarTarjeta` es un lote normal (puede quedar en cola) y actualiza el `nombre` del código solo si cambió respecto de `antes`. Todas las acciones van con `conPlazo`.
- **`buscar`:** `normalizarCodigo` nulo → `no-existe`; igual a `miCodigo` → `propio`; `buscarCodigo` nulo → `no-existe`; si no, `revisarEnvio`.
- **Errores:** `sin-conexion` (plazo o `unavailable`) y `error` (cualquier otro) se muestran con `AVISOS`.
- **Publicación:** con `listoParaPublicar({ conCuenta, base: remoteData !== null, estadoNube: cloudStatus, nombre })` y tu tarjeta ya leída: sin código → `crearCodigo` con `nuevoCodigo()` (hasta 5 intentos si el código choca); con código → `tarjetaDe(...)`, y si `!mismaTarjeta(t, ultima)`, publicar a los 2 s.
- **Sesión:** con `user` escucha tus amistades, tu tarjeta y la de cada amigo aceptado; al cambiar `user?.uid` o quedar invitado, deja de escuchar y limpia.
- **`nekalAmigos(modo?)`** (solo `__DEV__`, registrado en `AmigosProvider`, como `useDemo`): sin argumento carga `amigosDeEjemplo()` (`activo` = true aunque sea invitado) y devuelve «Listo: amigos de ejemplo cargados.»; `"vacio"` deja solo el código («Listo: sin amigos.»); `false` lo apaga («Listo: amigos de ejemplo apagados.»). Con ejemplo, las acciones cambian solo ese estado (buscar cualquier código válido que no sea `7KQ2PX` encuentra a «Diego Lagos»).

- [ ] **Step 1:** Implementar `nube.ts` y `AmigosContext.tsx`; conectar `TabNavigator`, `useProgreso` y `LogroNuevo`.
- [ ] **Step 2:** `npm test`, `npm run typecheck`. Expected: PASS.
- [ ] **Step 3: Verificar** en modo invitado (`preview_start` `nekal-web-invitado`, puerto 8082): la app carga como antes, `nekalAmigos()` en la consola devuelve «Listo: amigos de ejemplo cargados.» y no hay errores en consola. Las pantallas se revisan en la Task 7.
- [ ] **Step 4: Commit** `V2/F: nube y contexto de amigos`.

---

### Task 7: Pantallas

**Files:**
- Create: `front/src/components/ui/amigos/{Inicial,TarjetaSolicitud,FilaAmigo,FilaArea,SeccionAmigos,HojaAmigos,PerfilAmigo}.tsx`
- Modify: `front/src/pages/Perfil.tsx`, `front/src/components/ui/base/TabBar.tsx`

**Interfaces:**
- Consumes: `useAmigos()` (Task 6); `areasOrdenadas`, `mostrarCodigo`, `AVISOS`; `AREAS`; `CATALOGO`; `Medalla`, `Anillo`; `mesYAnio`; `haptic`; base (`Sheet`, `Card`, `Button`, `Field`, `SectionTitle`, `EmptyState`, `PressableScale`, `Txt`).
- Produces:
  ```ts
  export type Pagina = { tipo: "amigos" } | { tipo: "agregar" } | { tipo: "amigo"; uid: string };
  // HojaAmigos: { pagina: Pagina | null; onPagina(p: Pagina): void; onClose(): void; onEditarPerfil(): void }
  // SeccionAmigos: { onAbrir(p: Pagina): void; onCrearCuenta(): void }
  // PerfilAmigo: { fila: FilaAmigo; onEliminado(): void }
  // Inicial: { nombre: string; size?: number }
  ```
- **Perfil:** estado `hoja: Pagina | null`. Botón de personas (con el número) solo si `activo`. `SeccionAmigos` bajo tu tarjeta. «Crear cuenta» usa el mismo camino que `onConectar` de Ajustes; «Escribir mi nombre» cierra la hoja y abre «Editar perfil».
- **SeccionAmigos:** sin `activo` → `EmptyState` (pose 3) de invitado; activo sin amigos ni solicitudes → `EmptyState` «Agregar amigo»; si no, hasta 2 `TarjetaSolicitud` (con «Ver todas» si hay más) y la fila horizontal (`ScrollView horizontal`): «Agregar» + `Inicial` con nombre de pila y «Nivel N».
- **HojaAmigos** (`Sheet` grande, título según página; en «agregar» y «amigo», botón ‹ con «Volver a Amigos»): páginas de la spec §6.2. «Compartir»: `Share.share({ message })`; en web, si `navigator.share` no existe, muestra el texto con `Txt selectable` bajo el código; un `AbortError` no muestra nada. Confirmaciones de «Cambiar mi código» y «Eliminar amigo» dentro de la hoja (tarjeta `dangerSoft`, como la maqueta 05).
- **Botones con trabajo:** texto «Buscando…» / «Enviando…», deshabilitados mientras esperan; al terminar enviar o aceptar, `haptic.success()`. Un error se muestra con su texto de `AVISOS` bajo el botón.
- **Sin conexión mientras miras:** con `estado === "sin-conexion"`, la hoja muestra arriba «Sin conexión. Revisa tu internet y reintenta.» en `Txt` secundario y sigue mostrando lo último cargado.
- **TabBar:** en la pestaña Perfil, si `solicitudes > 0`, la píldora roja con el número y la etiqueta de VoiceOver de los textos fijos.

- [ ] **Step 1:** Implementar los componentes y los cambios de Perfil y TabBar.
- [ ] **Step 2:** `npm test` (incluida `tests/styles.cjs`), `npm run typecheck`. Expected: PASS.
- [ ] **Step 3: Verificar** en modo invitado (8082) con `nekalDemo()` y `nekalAmigos()`, a 390 px de ancho:
  - Perfil con la solicitud de Camila, la fila y el número 1 en la pestaña y en el botón; «Aceptar» la pasa a amigos y el número desaparece.
  - Hoja Amigos: código, Compartir (en web muestra el texto), Solicitudes, Enviadas (Diego, Cancelar), Tus amigos, Cambiar mi código con su confirmación.
  - Agregar: código mal escrito («No encontramos…»), `7KQ2PX` («Ese es tu código.»), uno válido → Diego → Enviar → aviso «Le enviamos tu solicitud a Diego.».
  - Perfil de Javiera (áreas en orden, «Ver sus 17 logros», Eliminar con confirmación) y de Tomás («Su perfil aparece cuando abra Nekal.»).
  - `nekalAmigos("vacio")` → estado sin amigos; `nekalAmigos(false)` → estado invitado. Perfil sin nombre → «Primero, tu nombre».
  - Tomar capturas para el usuario. Sin errores en consola.
- [ ] **Step 4: Commit** `V2/F: sección y hoja de amigos en el Perfil`.

---

### Task 8: Auditoría, reglas publicadas y prueba real

**Files:**
- Modify: `back/firestore.rules` y `front/tests/firestore.cjs` solo si la auditoría encuentra algo.

- [ ] **Step 1:** Auditar `back/firestore.rules` con la skill `firebase-security-rules-auditor`. Corregir lo que encuentre con una prueba nueva en `tests/firestore.cjs` y volver a correr `npm run test:firestore`. Expected: todo OK.
- [ ] **Step 2:** **Pedir permiso al usuario** y publicar con `npm run deploy:rules`. Expected: «Deploy complete!».
- [ ] **Step 3: Prueba real** con el servidor `nekal-web` (8081): el usuario inicia sesión con PruebaClaude en el navegador de Claude y crea una segunda cuenta (idealmente en su iPhone con Expo Go). Recorrido: compartir el código, buscar, enviar, ver el número en la otra cuenta sin recargar, aceptar, ver el perfil y las áreas, que salte «Primer amigo» al cerrar la hoja, cambiar el código (el viejo deja de encontrarse) y eliminar (el otro deja de ver la tarjeta). En el iPhone, con modo avión, «Buscar» vuelve a los 10 s con «Sin conexión. Revisa tu internet y reintenta.» (RF5).
- [ ] **Step 4: Verificar** en la consola de Firebase (o con lecturas desde la app) que `perfiles/{uid}` no guarda nombres de mesas.
- [ ] **Step 5: Commit** (si hubo cambios) `V2/F: reglas auditadas y publicadas`.

---

### Task 9: Cierre

- [ ] **Step 1:** `npm test`, `npm run typecheck`, `npm --prefix front run build:web` y `npm run test:firestore`. Expected: todo en verde.
- [ ] **Step 2:** Autorrevisión final del diff de la rama (`/code-review`), corrigiendo lo que encuentre.
- [ ] **Step 3:** Copiar el ledger a `DOCUMENTOS/V2/F_REGISTRO_IMPLEMENTACION.md`, con los pasos de la prueba en el iPhone y los pendientes menores.
- [ ] **Step 4:** Línea de F en `CLAUDE.md` (sección Reglas) y fila F del ROADMAP («Terminado y mezclado en `main` el …», sin mover fechas).
- [ ] **Step 5:** Commit `V2/F: registro, CLAUDE.md y ROADMAP`; mezclar en `main` con `git merge --no-ff v2/f-amigos -m "Mezcla V2/F: Amigos (código, solicitudes, perfil en corto y Primer amigo)"`; borrar la rama.
