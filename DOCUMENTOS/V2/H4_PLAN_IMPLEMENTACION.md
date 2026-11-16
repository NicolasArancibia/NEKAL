# H4 · Calendario en espejo (Google y Outlook): plan de implementación

> **Para quien ejecute:** `superpowers:executing-plans` (nativo, tarea por tarea, como en H3). Pasos `- [ ]`. Ledger en `.superpowers/sdd/H4_PLAN_IMPLEMENTACION/progress.md`; cada decisión fuera del plan es un `Ruling`.

**Meta:** al conectar una cuenta, sus eventos (de 14 días atrás a 60 días adelante) aparecen en Nekal. Desde ahí:
- lo que se edita, mueve o borra en un lado cambia en el otro;
- lo que se crea en Nekal con hora se copia a un calendario «Nekal» de la cuenta elegida;
- Neka ve todo y trata lo de afuera como fijo.

**Arquitectura:**
- **Lógica pura y con pruebas:**
  - `eventos.ts` traduce Google y Graph ↔ Nekal;
  - `espejo.ts` decide qué hacer a cada lado con `planDeSincronizacion`, y `aplicarEnNekal` / `aplicarResultados` lo aplican a `AppData`.
- **Red, solo web:** `google.ts` y `microsoft.ts` ganan las llamadas de calendario (listar, crear, cambiar, borrar).
- **Contexto:** `ConexionesContext` corre `sincronizar()`:
  - al cargar, cada 5 min y al volver a la app;
  - 3 s después de un cambio local que toque el espejo.
- **Cambio local, sin timestamps:** se detecta por **firma**, el texto con los campos espejados (título, inicio, duración, lugar, día completo). Funciona también con lo que Neka mueve sin tocar `updatedAt`.
- **Cambio afuera:** se detecta por **versión** (etag en Google, changeKey en Graph).

**Spec:** [H3_CONEXIONES.md](H3_CONEXIONES.md) §5.2, §5.3, §6.2, §6.3, §7, §8, §11 (fila H4). Maqueta aprobada: [H/05](H_MAQUETA/05-conexiones-correo-calendario.html) C1, C2 y B1 («Lo que creas en Nekal va a»).

## Restricciones globales

- **Rama y commits:**
  - Rama `v2/h4-espejo` desde `main`; commits `V2/H4: …` con `Co-Authored-By`.
  - Hay cambios ajenos sin commitear (`front/src/utils/model.ts`, `CLAUDE.md`): en esos archivos se commitea solo lo propio, armando el índice desde `HEAD` (como en H3).
  - **No se cambia de rama con `checkout`**: se crea con `git switch -c` (lleva los cambios ajenos tal cual) y la mezcla se hace con `commit-tree` / `update-ref` (como en H3).
- **TDD en `utils`:** pruebas en `front/tests/conexiones.cjs`; agregar `src/utils/conexiones/eventos.ts` y `src/utils/conexiones/espejo.ts` a la lista de `tsc` de `run.cjs`.
- **Ventana:** `VENTANA = { atras: 14, adelante: 60 }` días desde hoy (00:00 local).
- **Identidad:** `proveedor + cuenta + idExterno`. **Nunca se duplica** al reconectar.
- **Lo de afuera en Nekal:**
  - `type: "Evento"`, `workspaceId: "general"`, `flexible: false`, `countsForScore: false`;
  - título recortado a 160 y descripción a 100 000;
  - un título vacío pasa a «(Sin título)».
- **Día completo:**
  - `scheduledAt` = 00:00 local del primer día, `duration: 1440`, `origen.diaCompleto: true`;
  - **no ocupa tiempo**: no choca ni bloquea huecos, y la Agenda dice «Todo el día».
- **Varios días:** un ítem en el primer día, con `duration` tope 1440.
- **Rutinas** (ítems de un grupo con `repeat`) y Nota/Idea: **no** se copian afuera.
- **Calendario «Nekal»:** se busca por nombre exacto `Nekal` entre los calendarios propios de la cuenta. Si no existe, se crea la primera vez que hay algo que copiar. Su id no se guarda.
- **Solo lectura** (feriados, calendarios compartidos sin permiso): se importan con `origen.soloLectura: true`. Si se editan en Nekal, vuelve la versión de afuera.
- **Pases:** igual que H3 (nunca en Firestore ni en registros). Un 401 marca la cuenta como «Toca para actualizar» y la pasada sigue con las demás cuentas.
- **Publicar:** reglas y canal de prueba **solo con permiso**. Se pide una sola vez, al terminar el código: reglas + canal `conexiones` actualizado.
- **Antes de cerrar:** `npm test`, `npm run typecheck`, `npm --prefix front run build:web`, `/code-review high`, y prueba real del usuario (computador + iPhone **con Nekal instalada**).

## Revisión de casos que la spec no nombra

| # | Caso | Qué debe pasar | Prueba en |
|---|---|---|---|
| 1 | Se creó el evento en el calendario «Nekal», pero la app se cerró antes de guardar `origen` | En la próxima pasada el evento del calendario Nekal con igual título e inicio que un ítem sin `origen` **se vincula**, no se importa como nuevo | Task 3 |
| 2 | Evento borrado afuera mientras se editaba en Nekal | Gana el más reciente (`actualizado` de afuera vs `updatedAt` de Nekal); si afuera ya no existe, el ítem va a la papelera | Task 3 |
| 3 | Borrar en Nekal algo que afuera ya no existe (404/410) | Cuenta como borrado: se quita `origen` y no se reintenta | Task 3 |
| 4 | Ítem con `origen` fuera de la ventana | No se toca (ni se borra ni se actualiza) | Task 3 |
| 5 | Neka mueve un evento externo (sin cambiar `updatedAt`) | La firma cambia y el cambio se envía afuera | Task 3 |
| 6 | Evento de Google sin `summary`, con 300 caracteres o con zona horaria distinta | «(Sin título)», recortado a 160 y hora correcta en el dispositivo | Task 2 |

---

## Archivos

| Archivo | Cambio |
|---|---|
| `utils/conexiones/tipos.ts` | + `Origen`, `EventoFuera`, `Ventana`; `Conexiones` + `destinoNekal` |
| `utils/conexiones/eventos.ts` (nuevo) | Google/Graph → `EventoFuera`; `EventoFuera` → campos de `Item`; `Item` → cuerpo de Google/Graph; `firmaDe` |
| `utils/conexiones/espejo.ts` (nuevo) | `planDeSincronizacion`, `aplicarEnNekal`, `aplicarResultados`, `hayCambiosLocales` |
| `utils/conexiones/estado.ts` | `normalizarConexiones` + `destinoNekal`; `agregarCuenta` elige destino si está vacío; `quitarCuenta` lo limpia |
| `utils/model.ts`, `utils/storage.ts`, `utils/syncModel.ts`, `back/firestore.rules` | `Item.origen?` y `destinoNekal` |
| `utils/espacio.ts`, `utils/planner.ts` | `esExterno`, `ocupaTiempo`; atrasadas sin externos; choques y huecos sin día completo |
| `utils/agente/contexto.ts` | la línea dice de dónde viene y que es fija |
| `utils/conexiones/google.ts`, `microsoft.ts` | llamadas de calendario |
| `utils/ConexionesContext.tsx` | `sincronizar()`, disparadores, desconectar quita lo importado |
| `components/ui/conexiones/SeccionCuentas.tsx`, `HojaConectar.tsx`, `OrigenItem.tsx` (nuevo); `pages/Calendario.tsx`; `components/ui/ItemEditor.tsx` | UI |
| `tests/conexiones.cjs`, `tests/run.cjs`, `tests/sync.cjs`, `tests/firestore.cjs`, `tests/vistas.cjs` o `estabilidad.cjs` | pruebas |

---

### Task 1: tipos, `Item.origen` y `destinoNekal` (modelo, sync y reglas)

**Interfaces — produce:**
```ts
// tipos.ts
export type Origen = {
  proveedor: Proveedor; cuenta: string; calendario: string; idExterno: string;
  version: string; firma: string; creadoEn: "fuera" | "nekal";
  diaCompleto: boolean; soloLectura: boolean;
};
export type Conexiones = { cuentas: Cuenta[]; ofrecido: boolean; destinoNekal: string };
// model.ts
Item.origen?: Origen   // opcional, como Workspace.area
```

- `CONEXIONES_VACIAS` y `emptyData()` pasan a tener `destinoNekal: ""`. `normalizarConexiones` acepta `destinoNekal` (string ≤ 320; si no está, `""`).
- `agregarCuenta`: si `destinoNekal === ""`, queda con el correo de la cuenta nueva (spec §6.2: «la primera cuenta que se conecta queda elegida»).
- `quitarCuenta`: si quita la cuenta destino, `destinoNekal` pasa a la siguiente cuenta (o `""`).
- `readBackup`: un ítem con `origen` mal formado lo pierde (se normaliza con `normalizarOrigen(v): Origen | undefined`, exportada desde `estado.ts`). `validateRecords` acota los strings de `origen` (≤ 1000 cada uno).
- **Reglas:**
  - `item(v)` acepta las 27 claves de hoy **o** esas 27 + `origen`, con `origenOk(o)`: claves exactas de `Origen`, `proveedor in ['google','microsoft']`, `creadoEn in ['fuera','nekal']`, los bool como bool y los strings con `str(…,1000)`;
  - `settings/conexiones` pasa a `fields(v,['cuentas','ofrecido','destinoNekal']) && str(v.destinoNekal,320)`.
- [ ] **Step 1: pruebas que fallan:**
  - `conexiones.cjs`: `"espejo: destino al conectar y desconectar"`:
    - agregar `google/a` → `destinoNekal: "a"`;
    - agregar `microsoft/b` → sigue `"a"`;
    - quitar `a` → `"b"`;
    - quitar `b` → `""`.
  - `"espejo: origen mal formado"`: `normalizarOrigen({ ...válido, proveedor: "yahoo" })` → `undefined`, y lo válido vuelve igual.
  - `sync.cjs`: un ítem con `origen` va y vuelve por `recordsOf` / `dataOf`, y `settings/conexiones` trae `destinoNekal`.
  - `firestore.cjs`:
    - acepta un ítem con `origen` válido;
    - rechaza `origen` con una clave extra o con `proveedor: "yahoo"`;
    - acepta `settings/conexiones` con `destinoNekal` y rechaza el formato viejo sin él.
- [ ] **Step 2:** fallan (`npm test`; el emulador con Java 21 en el PATH).
- [ ] **Step 3:** implementar.
- [ ] **Step 4:** pasan las dos suites y `typecheck`.
- [ ] **Step 5:** commit `V2/H4: origen en ítems y destino de Nekal`.

### Task 2: `eventos.ts`: traducir eventos (puro)

**Interfaces — produce:**
```ts
export type EventoFuera = {
  id: string; calendario: string; titulo: string; inicio: string /*ISO*/; minutos: number;
  diaCompleto: boolean; lugar: string; descripcion: string; version: string;
  actualizado: string /*ISO*/; soloLectura: boolean; cancelado: boolean;
};
export const VENTANA: { atras: number; adelante: number };     // 14, 60
export function limitesVentana(ahora: number): { desde: string; hasta: string }; // ISO; desde = 00:00 local de hoy − 14 d
export function desdeGoogle(e: any, calendario: string, soloLectura: boolean): EventoFuera | null; // null si no tiene inicio
export function desdeGraph(e: any, calendario: string, soloLectura: boolean): EventoFuera | null;
export function firmaDe(f: { title: string; scheduledAt: string; duration: number; location: string; diaCompleto: boolean }): string;
export function camposDeEvento(e: EventoFuera): Pick<Item, "title"|"scheduledAt"|"duration"|"location"|"description"|"startDate">;
export function cuerpoGoogle(i: Item): object;  // { summary, location, start, end } (día completo: date / date+1)
export function cuerpoGraph(i: Item, zona: string): object; // { subject, location:{displayName}, start, end, isAllDay }
```

- **Google:**
  - `start.dateTime` (con offset) o `start.date` (día completo, 00:00 local). `end` igual; los minutos salen de `end − start`.
  - `etag` → `version`, `updated` → `actualizado`, `status === "cancelled"` → `cancelado`.
- **Graph:**
  - con `Prefer: outlook.timezone="UTC"` las fechas llegan sin `Z`: se agrega.
  - `isAllDay` → día completo; `changeKey` → `version`, `lastModifiedDateTime` → `actualizado`, `isCancelled` → `cancelado`, `bodyPreview` → `descripcion`, `location.displayName` → `lugar`.
- **`camposDeEvento`:**
  - `duration` = día completo ? 1440 : `min(1440, max(5, minutos))`;
  - `startDate` = `localDay(inicio)`;
  - recorta el título y la descripción, y el título vacío pasa a «(Sin título)».
- **`firmaDe`:** `JSON.stringify([title, scheduledAt, duration, location, diaCompleto])`.
- [ ] **Step 1: pruebas que fallan** (`"espejo: eventos de Google"`, `"espejo: eventos de Graph"`, `"espejo: campos y cuerpos"`), con datos de ejemplo escritos en la prueba:
  - un evento con hora `2026-11-20T10:00:00-03:00`, 90 min, de 10:00 a 11:30;
  - un día completo `date: "2026-11-21"`: `inicio` a las 00:00 local, `diaCompleto: true`;
  - uno sin `summary` → «(Sin título)»;
  - uno con 300 caracteres de título → `camposDeEvento` da 160;
  - un Graph con `dateTime: "2026-11-20T13:00:00.0000000"` → `inicio` `2026-11-20T13:00:00.000Z`;
  - `cuerpoGoogle` de un ítem de día completo usa `start.date` / `end.date` del día siguiente;
  - `firmaDe` cambia si cambia la hora y no cambia si cambia `status`.
- [ ] **Step 2–4:** fallan → implementar → pasan.
- [ ] **Step 5:** commit `V2/H4: traducir eventos de Google y Graph`.

### Task 3: `espejo.ts`: qué hacer a cada lado (puro)

**Interfaces — produce:**
```ts
export type AccionFuera =
  | { tipo: "crear"; itemId: string; cuerpo: Item }               // va al calendario «Nekal»
  | { tipo: "actualizar"; itemId: string; origen: Origen; cuerpo: Item }
  | { tipo: "borrar"; itemId: string; origen: Origen };
export type PlanEspejo = {
  crearEnNekal: EventoFuera[];
  actualizarEnNekal: { itemId: string; evento: EventoFuera }[];
  vincular: { itemId: string; evento: EventoFuera }[];            // caso 1 de la revisión
  aPapelera: string[];                                            // itemIds
  fuera: AccionFuera[];
};
export function planDeSincronizacion(o: {
  data: AppData; eventos: EventoFuera[]; cuenta: Cuenta; calendarioNekal: string | null;
  copiarAqui: boolean; ahora: number;
}): PlanEspejo;
export function aplicarEnNekal(d: AppData, cuenta: Cuenta, p: PlanEspejo, ahora: number): AppData;
export type ResultadoFuera =
  | { itemId: string; ok: true; origen: Origen | null }   // null = quitar origen (borrado)
  | { itemId: string; ok: false; error: "pase" | "red" | "otro" };
export function aplicarResultados(d: AppData, r: ResultadoFuera[]): AppData;
export function hayCambiosLocales(d: AppData, conexiones: Conexiones, ahora: number): boolean;
```

**Reglas** (spec §7; «ítem de la cuenta» = `origen.proveedor/cuenta` iguales a la cuenta; «en ventana» = su `scheduledAt` dentro de `limitesVentana`):

| Caso | Acción |
|---|---|
| Evento no cancelado sin ítem con su `idExterno` | si es del calendario «Nekal» y hay un ítem **sin** `origen`, no borrado, con igual `title` y `scheduledAt` → `vincular`; si no → `crearEnNekal` |
| Ítem de la cuenta, no borrado, con evento y `version` distinta | si la firma local == `origen.firma` → `actualizarEnNekal`; si no, si `soloLectura` → `actualizarEnNekal`; si no, gana el más reciente (`evento.actualizado` > `item.updatedAt` → `actualizarEnNekal`, si no → `fuera.actualizar`) |
| Ítem de la cuenta, no borrado, misma `version`, firma local ≠ `origen.firma` | `soloLectura` → `actualizarEnNekal`; si no → `fuera.actualizar` |
| Ítem de la cuenta, no borrado, en ventana, sin evento (o evento cancelado) | `aPapelera` |
| Ítem de la cuenta con `deletedAt` | `fuera.borrar` (salvo `soloLectura`: se quita `origen` en `aplicarResultados` con `ok: true, origen: null`) |
| `copiarAqui` y ítem sin `origen`, no borrado, con `scheduledAt`, no rutina, no Nota/Idea, en ventana | `fuera.crear` |

- **`aplicarEnNekal`:**
  - crea los ítems con `camposDeEvento` + `origen` (`creadoEn: "fuera"`, `firma` = `firmaDe` del ítem creado);
  - actualiza los campos espejados y el `origen` (`version`, `firma`);
  - en `vincular` pone `origen` (`creadoEn: "nekal"`);
  - en `aPapelera` pone `deletedAt` (y deja `origen`).
  - **No toca `updatedAt`**: lo de afuera no es un cambio local.
- **`aplicarResultados`:** pone el `origen` devuelto, o lo quita con `null`; los errores no cambian nada.
- **`hayCambiosLocales`:** hay algún ítem con `origen` cuya firma ≠ `origen.firma`, o con `deletedAt` y `origen`, o (si `destinoNekal`) un ítem que `fuera.crear` copiaría.
- [ ] **Step 1: pruebas que fallan** (`"espejo: …"`; una por fila de la tabla, más los casos 1–5 de la revisión):
  - **reconectar dos veces = 0 duplicados:** aplicar dos veces el mismo plan con los mismos eventos deja la misma cantidad de ítems;
  - un ítem movido por «Neka» (cambia `scheduledAt` sin tocar `updatedAt`) → `fuera.actualizar`;
  - un ítem fuera de la ventana no se toca;
  - una rutina no se copia.
- [ ] **Step 2–4:** fallan → implementar → pasan.
- [ ] **Step 5:** commit `V2/H4: espejo (puro)`.

### Task 4: lo externo en el resto de la app (puro)

- `espacio.ts`:
  - `esExterno(i) = i.origen?.creadoEn === "fuera"`;
  - `ocupaTiempo(i) = !i.origen?.diaCompleto`;
  - `estaAtrasada` devuelve `false` si `esExterno(i)`.
- `planner.ts`: `findConflicts`, `proposeSlot`, `buscarHueco` y `correrDesde` filtran con `ocupaTiempo`.
- `agente/contexto.ts`: la línea de un ítem con `origen` agrega `· de Google` / `· de Outlook` (y `· todo el día`). Las instrucciones de Neka (donde estén las reglas de «fija») agregan una línea: «Lo que viene de Google u Outlook es fijo: no lo muevas salvo que el usuario lo pida».
- [ ] **Step 1: pruebas que fallan** (en `vistas.cjs` o `estabilidad.cjs`, con los ayudantes de ahí):
  - un evento externo de hace 5 días, pendiente, no es atrasado;
  - un día completo encima de una tarea no da choque, y `buscarHueco` lo ignora;
  - la línea del contexto dice «de Google».
- [ ] **Step 2–4:** fallan → implementar → pasan.
- [ ] **Step 5:** commit `V2/H4: lo externo en atrasadas, choques, huecos y Neka`.

### Task 5: llamadas de calendario (red, solo web)

**`google.ts` produce:**
```ts
export type CalendarioFuera = { id: string; nombre: string; soloLectura: boolean; esNekal: boolean };
export function calendariosGoogle(token: string): Promise<CalendarioFuera[]>;   // calendarList, solo `selected`; soloLectura = accessRole ∉ {owner, writer}; esNekal = summary === "Nekal" && accessRole === "owner"
export function eventosGoogle(token: string, cals: CalendarioFuera[], ahora: number): Promise<EventoFuera[]>; // events.list singleEvents=true, timeMin/timeMax, paginando nextPageToken
export function crearCalendarioNekalGoogle(token: string): Promise<string>;
export function guardarEventoGoogle(token: string, cal: string, i: Item, idExterno?: string): Promise<EventoFuera>; // insert o patch
export function borrarEventoGoogle(token: string, cal: string, idExterno: string): Promise<void>; // 404/410 = ok
```

- **`microsoft.ts`** produce lo mismo con sufijo `Graph`: `/me/calendars` (`canEdit`; `esNekal` = `name === "Nekal"`), `/me/calendars/{id}/calendarView?startDateTime&endDateTime&$top=200`, paginando `@odata.nextLink`, con `Prefer: outlook.timezone="UTC"` y `outlook.body-content-type="text"`. Crear es `POST /me/calendars/{id}/events`, cambiar `PATCH /me/events/{id}` y borrar `DELETE /me/events/{id}`.
- **Errores:** un 401 lanza `Error("pase")`; otro no-2xx lanza `Error("red")`.
- [ ] **Step 1:** implementar. **Step 2:** `typecheck`. **Step 3:** commit `V2/H4: llamadas de calendario`.

### Task 6: `sincronizar()` en `ConexionesContext`

- **Una cuenta a la vez**, con un candado (`useRef`) para no correr dos pasadas juntas. Por cada cuenta con pase:
  1. listar los calendarios;
  2. listar los eventos;
  3. `plan = planDeSincronizacion(…)`;
  4. `change(d => aplicarEnNekal(d, cuenta, plan, ahora))`;
  5. las acciones `fuera`, una por una; para `crear`, primero el calendario Nekal (buscar; si no, crear);
  6. `change(d => aplicarResultados(d, resultados))`.
- Un `Error("pase")` deja la cuenta en `actualizar` (recalcula el estado) y sigue con la siguiente.
- **Disparadores:**
  - tras recoger una vuelta con `ok`;
  - al montar;
  - cada 5 min;
  - al volver la app (`AppState`);
  - 3 s después de un cambio de `data.items` si `hayCambiosLocales`.
- **`desconectar`:** antes de `quitarCuenta`, los ítems `creadoEn: "fuera"` de esa cuenta van a la papelera, y los `creadoEn: "nekal"` pierden `origen` (spec §8).
- **`HojaConectar` A2:** «Traje tus eventos de las próximas semanas. Neka ya los tiene en cuenta.»
- **`nekalConexiones()`:** suma el modo `"eventos"`, que carga 4 eventos de ejemplo (uno de cada proveedor, uno de día completo y uno de solo lectura) con `aplicarEnNekal`, para revisar la UI en invitado.
- [ ] **Step 1:** implementar. **Step 2:** `typecheck` y `npm test`. **Step 3:** commit `V2/H4: sincronizar el espejo`.

### Task 7: UI del espejo

- **`OrigenItem.tsx`:** el logo chico (`LogoCuenta` con `chico`) + «Google» u «Outlook», para la fila.
- **Agenda (`pages/Calendario.tsx`):** en la fila de un ítem con `origen`, el `detail` empieza con el proveedor; un día completo dice «Todo el día · Google». Lo `creadoEn: "nekal"` agrega «· en Google». La marca de un externo es un ícono de calendario, no el círculo de hecho (maqueta C1). Si `ListRow` no lo permite, se agrega una prop `icono` opcional a `ListRow` (base).
- **`ItemEditor`:** arriba, si tiene `origen`:
  - «De Google · correo» (o Outlook);
  - debajo, «Si lo cambias aquí, también cambia en Google.»;
  - con `soloLectura`, en cambio: «Solo lectura: los cambios vuelven a como está en Google.» (maqueta C2).
- **`SeccionCuentas`:** «Lo que creas en Nekal va a», con un `Chip` por cuenta + «No copiar» que actualiza `destinoNekal`, y el texto «Se guarda en un calendario llamado «Nekal», separado de tus otros eventos.» (maqueta B1).
- [ ] **Step 1:** implementar. **Step 2:** `npm test` (estilos) y `typecheck`. **Step 3:** en invitado (8082, móvil) con `nekalConexiones("eventos")`: Agenda con los 4 eventos, el día completo, el detalle y el selector de destino. Capturas en el ledger. **Step 4:** commit `V2/H4: UI del espejo`.

### Task 8: prueba real y cierre

- [ ] **Step 1 (usuario):** **pedir permiso** para `npm run deploy:rules` y para actualizar el canal (`firebase hosting:channel:deploy conexiones --expires 30d`).
- [ ] **Step 2 (usuario), en localhost:8081 y en el iPhone con Nekal *instalada*:**
  - conectar → aparecen los eventos;
  - crear un evento en Google → aparece en Nekal (≤ 5 min con la app abierta o al volver a ella);
  - mover un evento en Nekal → cambia en Google;
  - crear una tarea con hora en Nekal → aparece en el calendario «Nekal»;
  - borrar en ambos sentidos;
  - desconectar y reconectar: 0 duplicados.
- [ ] **Step 3:** `verification-before-completion` (test, typecheck, build), `/code-review high` y un solo pase de arreglos con TDD.
- [ ] **Step 4:** documentar:
  - registro `DOCUMENTOS/V2/H4_REGISTRO_IMPLEMENTACION.md` (copia del ledger);
  - línea en `CLAUDE.md` (solo la propia);
  - fila del ROADMAP;
  - `SISTEMA_DE_DISENO/REGISTRO_DE_CAMBIOS.md` (y `CONTRADICCIONES_Y_CAMBIOS.md` si algo difiere de la maqueta).
- [ ] **Step 5:** mezclar en `main` con `commit-tree` («Mezcla V2/H4: calendario en espejo») y borrar la rama.
