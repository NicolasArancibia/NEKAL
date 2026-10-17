# Subproyecto B · Espacio — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el mapa actual del Espacio por la estructura General → mesas → grupos/rutinas → cosas y sus tres vistas (Tiempo, Mesas y Plano) sobre los mismos datos.

**Architecture:**
- Toda la lógica es pura y probada en `front/src/utils/`:
  - datos v2 y migración;
  - estructura (`estructura.ts`) y cerebro común (`espacio.ts`);
  - rutinas (`rutinas.ts`) y colores (`colores.ts`);
  - acomodo por vista y proyección 3D (`acomodo/`).
- Las vistas (`components/ui/espacio/`) solo dibujan lo que el acomodo calcula. Mesas usa Skia; Tiempo y Plano, vistas reales y SVG.
- La pantalla `EspacioTrabajo.tsx` las une con las piezas comunes: hoja, crear, selección y conexiones.

**Tech Stack:** Expo 57, React Native 0.86.3, React 19.2.3, TypeScript 6, React Navigation 7, Reanimated 4.5.1 + react-native-worklets, Gesture Handler 2.32, react-native-svg 15.15.4, **@shopify/react-native-skia** (nueva), Ionicons de línea. Pruebas con `node:test` mediante `front/tests/run.cjs`.

**Spec:** [B_ESPACIO.md](B_ESPACIO.md) · Sistema visual: [B_SISTEMA_VISUAL.md](B_SISTEMA_VISUAL.md) · Maquetas base: [05](B_MAQUETA/05-tres-vistas-v2.html), [06](B_MAQUETA/06-detalles-interaccion.html), [07](B_MAQUETA/07-ajustes-revision.html)

## Global Constraints

**Herramientas y dependencias**
- Antes de escribir código que use una API de Expo o de Skia, consultar la doc (MCP `context7`: Expo v57 y `/wcandillon/react-native-skia`). Ver `front/AGENTS.md`.
- Dependencia nueva permitida: **solo** `@shopify/react-native-skia`, instalada desde `front/` con `npx expo install`, más su preparación web (`canvaskit.wasm` en `front/public/`). Ninguna otra.
- Reanimated 4: para volver al hilo JS desde un worklet se usa `scheduleOnRN` de `react-native-worklets`. Los gestos usan `Gesture.*` + `GestureDetector`.

**Interfaz (reglas del sistema A)**
- Sin colores, `fontSize` ni `fontWeight` sueltos en `App.tsx`, `src/components`, `src/pages` y `src/navigation`. El color de una mesa es un **dato** (`Workspace.color`) y sus tonos salen de `utils/colores.ts`. El texto se dibuja con `Txt`. Íconos: Ionicons `*-outline`.
- Área táctil mínima 44 × 44 y letra mínima 11 px, salvo las etiquetas dibujadas dentro de Mesas, que son decorativas y también se exponen en la capa accesible.
- Con `useReducedMotion()` activo: sin resortes ni giros animados; solo fundidos.

**Datos**
- `AppData.version` pasa a **2**. `workspaces` no cambia de forma. Los ítems no tienen campos nuevos: `x` es el **orden** dentro de su contenedor y `y = 0`. `groups` suma `parentId`, `repeat`, `repeatDays` y `repeatStart`.
- `back/firestore.rules` se edita en la Task 2, pero **solo se publica (`npm run deploy`) con permiso explícito del usuario** (Task 13).

**Textos**
- Las palabras visibles son "mesa", "grupo" y "rutina", con tuteo neutro.
- Los errores dicen qué pasó y qué hacer, con una oración.

**Proceso**
- Trabajo en la rama `v2/b-espacio`.
- Cada tarea termina con `npm test`, `npm run typecheck` y `npm --prefix front run build:web` en verde (desde la raíz) y un commit en español que termina con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Puntos de control con el usuario** (el ejecutor se detiene y espera):
  1. al terminar la Task 1 (prueba 3D en el iPhone);
  2. antes de publicar reglas (Task 13);
  3. en la prueba final en el iPhone.

## Review Focus

1. **Dos dispositivos generan la misma rutina sin conexión:** al sincronizar no hay cosas duplicadas, porque los ids son deterministas y la operación queda vacía. → Task 5, test `rutinas: dos copias generan los mismos registros`.
2. **Cuenta vacía** (solo General, 0 cosas): las tres vistas se abren sin errores, con un estado vacío que invita a crear. → Tasks 10, 11 y 12, paso de verificación con una cuenta nueva.
3. **Borrar un grupo con subgrupos y cosas:** nada se pierde; todo sube al padre del grupo borrado. → Task 3, test `estructura: borrar grupo sube hijos y cosas`.
4. **Arrastrar una cosa a otro día cruzando un cambio de horario:** se mantiene la hora local. → Task 4, test `moverAFecha: conserva la hora local`.
5. **Muchas cosas** (60 en un grupo, 25 mesas): Plano muestra 8 fichas y "+52 más"; los pisos de Mesas no pasan del tamaño máximo. → Tasks 7 y 8, tests `plano: tope de fichas` y `mesas: tamaño acotado`.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---|---|
| `front/src/utils/model.ts` | Tipos v2 (`Group`, `Repeat`, `AppData.version: 2`), `validateGroup`, `copiarGrupo` (compartido por "Reutilizar" y rutinas) |
| `front/src/utils/storage.ts` | `normalizeGroup`, `migrateV1`, `readBackup` acepta v1 y v2 |
| `front/src/utils/syncModel.ts` | `dataOf` normaliza grupos; límites de los campos nuevos |
| `back/firestore.rules` | `groups` acepta la forma vieja (3 campos) y la nueva (7) |
| `front/src/utils/estructura.ts` (nuevo) | Crear, mover y borrar mesas y grupos; mover, juntar, sacar y reordenar cosas |
| `front/src/utils/espacio.ts` (nuevo) | Tiempo elegido, estado visual, carga, conexiones, árbol, modelos de rutina, `timedItems`, `moverAFecha` |
| `front/src/utils/rutinas.ts` (nuevo) | Días que toca y generación de ocurrencias |
| `front/src/utils/colores.ts` (nuevo) | Tonos de una mesa a partir de su color |
| `front/src/utils/acomodo/proyeccion.ts` (nuevo) | Cámara y proyección del falso 3D |
| `front/src/utils/acomodo/tiempo.ts`, `plano.ts`, `mesas.ts` (nuevos) | Posiciones de cada vista y `elegir` en Mesas |
| `front/src/styles/theme.ts` | Tokens nuevos del Espacio (`color.cable`, `color.vidrio`, `color.vidrioBorde`, `color.sombraPiso`) |
| `front/src/components/ui/espacio/*` (nuevo) | Piezas comunes y las tres vistas |
| `front/src/pages/EspacioTrabajo.tsx` | Pantalla contenedora (se reescribe) |
| `front/src/utils/neka.ts`, `planner.ts`, `notifications.ts`, `pages/Calendario.tsx`, `pages/Chat.tsx` | Usan `timedItems` (sin modelos de rutina) |
| `front/tests/estructura.cjs`, `espacio.cjs`, `rutinas.cjs`, `acomodo.cjs` (nuevos), `rules.cjs`, `sync.cjs`, `run.cjs` | Pruebas |

Se eliminan en la Task 10: `components/ui/EspacioTrabajoUi/` (`CanvasContent`, `InfiniteCanvas`, `WorkspaceBar`, `ZoomControl`, `AddFab`) y el bloque de prueba 3D de la Task 1.

---

### Task 1: Prueba de Mesas con Skia (iPhone y web) — punto de control

**Files:**
- Create: `front/src/utils/acomodo/proyeccion.ts`, `front/tests/acomodo.cjs`, `front/src/components/ui/espacio/PruebaMesas.tsx`, `front/src/components/ui/espacio/PruebaMesas.web.tsx`
- Modify: `front/package.json` (dependencia y `postinstall`), `front/tests/run.cjs`, `front/src/pages/EspacioTrabajo.tsx` (botón temporal "Prueba 3D")

**Interfaces:**
- Produces:
  ```ts
  export type Punto3 = { x: number; y: number; z: number };
  export type Camara = { giro: number; inclinacion: number; zoom: number; cx: number; cy: number }; // radianes
  export const INCLINACION = { min: 0.6, max: 1.15, inicial: 0.95 };
  export function proyectar(p: Punto3, c: Camara): { x: number; y: number; profundidad: number };
  export function ordenarPorProfundidad<T extends { profundidad: number }>(lista: T[]): T[]; // lejano → cercano
  ```
  Fórmula: girar en Z por `giro` (`x' = x cos g − y sin g`, `y' = x sin g + y cos g`). Después:
  - `x = cx + zoom·x'`;
  - `y = cy + zoom·(y'·cos i − z·sin i)`;
  - `profundidad = y'·sin i + z·cos i`.

- [ ] **Step 1: Pruebas de proyección (fallan)**

  En `tests/acomodo.cjs`: `proyección: el origen cae en el centro`, `proyección: subir en z sube en pantalla`, `proyección: girar 90° lleva x a y`, `proyección: más cerca = mayor profundidad` y `ordenarPorProfundidad: de lejos a cerca`.

  ```js
  const c = { giro: 0, inclinacion: 0.95, zoom: 1, cx: 150, cy: 200 };
  assert.deepEqual(pick(pr.proyectar({ x: 0, y: 0, z: 0 }, c)), { x: 150, y: 200 });
  assert.ok(pr.proyectar({ x: 0, y: 0, z: 10 }, c).y < 200);
  const g = pr.proyectar({ x: 10, y: 0, z: 0 }, { ...c, giro: Math.PI / 2 });
  assert.ok(Math.abs(g.x - 150) < 1e-9 && g.y > 200);
  ```

  Registrar en `run.cjs` la compilación de `src/utils/acomodo/proyeccion.ts` (sale a `.test-build/acomodo/`) y `require("./acomodo.cjs")`.
- [ ] **Step 2:** `npm test`. Expected: FAIL (`proyectar` no existe).
- [ ] **Step 3:** Implementar `proyeccion.ts`.
- [ ] **Step 4:** `npm test`. Expected: PASS.
- [ ] **Step 5: Instalar Skia**

  Desde `front/`, `npx expo install @shopify/react-native-skia`. Preparar web según la doc (`npx setup-skia-web` copia `canvaskit.wasm` a `front/public/`) y agregar `"postinstall": "setup-skia-web"` en `package.json`.
- [ ] **Step 6: `PruebaMesas.tsx` (nativo)**

  Un `Canvas` de Skia a pantalla completa dentro de una `Sheet` grande con:
  - 3 pisos en el mismo eje (General, 4 mesas y 2 grupos bajo la primera), con caras con degradé y etiquetas;
  - 60 cubitos con alturas variadas y texto de 11 px;
  - fuente Plus Jakarta 800 cargada con `useFont(require("@expo-google-fonts/plus-jakarta-sans/800ExtraBold/PlusJakartaSans_800ExtraBold.ttf"), 11)`.

  Gestos simultáneos sobre una `Camara` en valores compartidos: `Pan` (mover), `Pinch` (zoom 0.5–2.5), `Rotation` (giro) y `Pan` de dos dedos vertical (inclinación entre `INCLINACION.min` y `.max`). Usar `proyectar` y `ordenarPorProfundidad`.

  Es una pantalla de prueba con escena sintética; se borra en la Task 10.
- [ ] **Step 7: `PruebaMesas.web.tsx`**

  Envuelve el anterior con `WithSkiaWeb` (`getComponent={() => import("./PruebaMesas")}`, con un `fallback` que dice "Cargando 3D…"). Ruta de import según la versión instalada (la doc indica `…/lib/module/web`).
- [ ] **Step 8: Botón temporal**

  "Prueba 3D" en la parte superior de `EspacioTrabajo.tsx`, que abre `PruebaMesas`.
- [ ] **Step 9: Verificación**

  `npm test`, `npm run typecheck` y `npm --prefix front run build:web` en verde. Revisar en web (375×812) que se dibuja y gira.
- [ ] **Step 10: Commit**

  `V2/B: prueba de Mesas con Skia y proyección 3D`.
- [ ] **Step 11: PUNTO DE CONTROL**

  Pedir al usuario que pruebe en el iPhone (`npm start`, Expo Go → Espacio → "Prueba 3D") y en web: fluidez al girar y nitidez del texto. Seguir **solo** con su respuesta:
  - Si Skia funciona, se sigue.
  - Si va lento o se ve mal, se registra un `Ruling:` y la Task 12 dibuja con `react-native-svg` usando la misma proyección.
  - Si el usuario pide three.js, el ejecutor se detiene y se replanifica la Task 12.

---

### Task 2: Datos v2, migración y reglas

**Files:**
- Modify: `front/src/utils/model.ts`, `storage.ts`, `syncModel.ts`, `AppContext.tsx`, `syncStorage.ts`, `back/firestore.rules`
- Modify (tests): `front/tests/rules.cjs`, `front/tests/sync.cjs`

**Interfaces:**
- Produces:
  ```ts
  export type Repeat = "" | "diario" | "semanal" | "dias";
  export type Group = { id: string; name: string; workspaceId: string; parentId: string; repeat: Repeat; repeatDays: number[]; repeatStart: string };
  // AppData.version: 2 ; emptyData().version === 2
  export function validateGroup(group: Group, data: AppData): string | null;          // model.ts
  export function normalizeGroup(g: any): Group;                                      // storage.ts
  export function migrateV1(d: any): any;                                             // storage.ts
  ```
- Mensajes de `validateGroup`, en este orden:
  1. "El grupo necesita un nombre.";
  2. "La mesa ya no existe.";
  3. "El grupo de arriba debe estar en la misma mesa." (si el `parentId` no existe o es de otra mesa);
  4. "Un grupo no puede quedar dentro de sí mismo." (ciclo);
  5. "Indica desde qué día se repite." (`repeat` sin `repeatStart`);
  6. "Elige al menos un día." (`repeat === "dias"` sin días).
- `validateItem`: "La rutina debe pertenecer al mismo espacio." pasa a ser **"El grupo debe estar en la misma mesa."** y "El espacio ya no existe." pasa a ser **"La mesa ya no existe."**. Se actualizan los tests que buscan esos textos.

- [ ] **Step 1: Pruebas (fallan)**
  - En `rules.cjs`:
    - `datos: emptyData es v2`;
    - `migración: v1 queda en v2 con grupos completos` (los grupos pasan a `parentId: ""`, `repeat: ""`, `repeatDays: []`, `repeatStart: ""`);
    - `migración: x pasa a ser el orden` (tres ítems del mismo grupo en (100,300), (400,100) y (50,100) quedan con `x` = 2, 1, 0 y `y = 0`, ordenados por `y` y después por `x`);
    - `migración: no se pierde nada` (mismas ids, títulos y dependencias);
    - `readBackup acepta v1 y v2`;
    - `readBackup rechaza repeat desconocido`;
    - `validateGroup: ciclo`, `validateGroup: padre en otra mesa` y `validateGroup: días vacíos`.
  - En `sync.cjs`: `dataOf normaliza grupos viejos` (un registro `groups/g` con 3 campos sale con los 7).
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implementar en `model.ts`**

  Tipos y `validateGroup`. `emptyData` pasa a `version: 2`. `duplicateGroup` crea el grupo copia con `parentId: group.parentId` y `repeat: ""`.
- [ ] **Step 4: Implementar en `storage.ts`**
  - `readBackup` acepta `version` 1 o 2. Si es 1, aplica `migrateV1`; en ambos casos, `normalizeGroup` a cada grupo.
  - Valida los campos nuevos:
    - `repeat` dentro del conjunto;
    - `repeatDays` como enteros 0–6, sin repetir;
    - `repeatStart` vacío o `AAAA-MM-DD`;
    - `validateGroup` para cada grupo.
  - Mensaje de formato: "El archivo no es un respaldo Nekal válido.".
  - `migrateV1` asigna `x` por contenedor (`workspaceId` + `groupId`), ordenando por `y` y después por `x`, y deja `y = 0`.
- [ ] **Step 5: Implementar en `syncModel.ts`**

  `dataOf` pasa cada grupo por `normalizeGroup`. `validateRecords` acota `repeatStart` (≤ 10) y `repeatDays` (≤ 7 elementos).
- [ ] **Step 6: Reglas de Firestore**

  En `back/firestore.rules`, el valor `groups` acepta `fields(v,['id','name','workspaceId'])` **o** `fields(v,['id','name','workspaceId','parentId','repeat','repeatDays','repeatStart'])`, con:
  - `str(v.parentId,200)`;
  - `v.repeat in ['','diario','semanal','dias']`;
  - `v.repeatDays is list && v.repeatDays.size()<=7`;
  - `str(v.repeatStart,10)`.

  No se publica. `tests/firestore.cjs` necesita Java 21 (no instalado): se anota en el ledger.
- [ ] **Step 7: Respaldo antes de migrar**

  En `AppContext.tsx` (modo local, al leer `key.current`) y en `syncStorage.ts` (al leer la copia local), si el JSON leído tiene `version === 1`, guardar el texto tal cual en `<clave>:respaldo-v1`, una sola vez (si ya existe, no se sobrescribe), **antes** de `readBackup`.
- [ ] **Step 8:** `npm test`, `npm run typecheck` y `build:web`. Expected: PASS.
- [ ] **Step 9: Commit**

  `V2/B: datos v2 (grupos anidados y rutinas) y migración`.

---

### Task 3: Estructura (mesas, grupos y movimientos)

**Files:**
- Create: `front/src/utils/estructura.ts`, `front/tests/estructura.cjs`
- Modify: `front/tests/run.cjs`

**Interfaces:**
- Consumes: `Group`, `validateGroup`, `validateItem` y `saveItem` (Task 2).
- Produces (todas puras; lanzan `Error` con el mensaje si algo es inválido):
  ```ts
  export const GENERAL = "general";
  export type Destino = { workspaceId: string; groupId: string };           // groupId "" = suelto en la mesa
  export function crearMesa(d: AppData, name: string, color: string): { data: AppData; id: string };
  export function borrarMesa(d: AppData, id: string): AppData;              // "general" → "General no se puede borrar."; con contenido → "Vacía la mesa antes de borrarla."
  export function crearGrupo(d: AppData, g: Omit<Group, "id">): { data: AppData; id: string };
  export function editarGrupo(d: AppData, g: Group): AppData;
  export function borrarGrupo(d: AppData, id: string): AppData;             // hijos y cosas suben al parentId
  export function moverGrupo(d: AppData, id: string, a: { workspaceId: string; parentId: string }): AppData; // mueve subárbol y sus cosas de mesa
  export function moverItems(d: AppData, ids: string[], a: Destino): AppData; // al final del orden destino
  export function juntarEnGrupo(d: AppData, ids: string[], name: string, repeat?: Pick<Group, "repeat" | "repeatDays" | "repeatStart">): { data: AppData; id: string };
  export function sacarDeGrupo(d: AppData, ids: string[]): AppData;         // cada cosa sube al padre de su grupo
  export function reordenar(d: AppData, id: string, indice: number): AppData; // renumera x 0..n en su contenedor
  export function hijosDe(d: AppData, a: Destino): { grupos: Group[]; items: Item[] }; // ordenados (grupos por nombre, ítems por x)
  ```
- `juntarEnGrupo` con cosas de mesas distintas lanza "Elige cosas de una misma mesa.". El grupo nuevo queda dentro del grupo común si todas comparten uno; si no, suelto en la mesa.
- Las mesas no tienen padre: solo se crean desde General, y la interfaz solo ofrece "Mesa" ahí.

- [ ] **Step 1: Pruebas (fallan)**

  `estructura: crear mesa`, `estructura: no se borra General`, `estructura: mesa con contenido no se borra`, `estructura: grupo dentro de grupo`, `estructura: borrar grupo sube hijos y cosas` (Review Focus 3), `estructura: mover grupo cambia la mesa de su subárbol`, `estructura: moverItems conserva dependencias entre mesas`, `estructura: juntar exige una misma mesa`, `estructura: sacar sube al padre` y `estructura: reordenar renumera x`.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implementar `estructura.ts` y registrarlo en `run.cjs`.
- [ ] **Step 4:** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit**

  `V2/B: estructura de mesas y grupos`.

---

### Task 4: Cerebro común (`espacio.ts`) y exclusión de modelos de rutina

**Files:**
- Create: `front/src/utils/espacio.ts`, `front/tests/espacio.cjs`
- Modify: `front/src/utils/neka.ts:47,82`, `planner.ts:10,98`, `notifications.ts:36`, `pages/Calendario.tsx:46`, `pages/Chat.tsx:54` (cambian `activeItems` por `timedItems`), `front/tests/run.cjs`

**Interfaces:**
- Consumes: `Group`, `AppData` y `difficultyOf` (model.ts).
- Produces:
  ```ts
  export type Ventana = "hoy" | "semana" | "2semanas" | "todo";
  export const DIAS_VENTANA: Record<Ventana, number>;            // hoy 1, semana 7, 2semanas 14, todo Infinity
  export type Estado = "on" | "hoy" | "tenue" | "hueco" | "hecho" | "bloqueado";
  export function fechaDe(i: Item): string;                      // scheduledAt || dueAt || ""
  export function siempreVisible(i: Item): boolean;              // sin fecha o "en curso"
  export function enVentana(i: Item, v: Ventana, now: number): boolean; // atrasadas sin completar cuentan como dentro
  export function estadoDe(i: Item, d: AppData, v: Ventana, now: number): Estado;
  export function cargaDe(i: Item, now: number): number;          // spec §4.2
  export function cargaDeContenedor(d: AppData, a: { workspaceId: string; groupId: string }, now: number): number; // incluye subgrupos
  export function conexiones(d: AppData, id: string): { requisitos: Item[]; dependientes: Item[] };
  export function esRutina(g: Group): boolean;
  export function esModelo(i: Item, d: AppData): boolean;        // su grupo es una rutina
  export function timedItems(d: AppData): Item[];                // activeItems sin modelos
  export type Nodo = { grupo: Group; hijos: Nodo[]; items: Item[] };
  export type MesaArbol = { mesa: Workspace; grupos: Nodo[]; sueltas: Item[] };
  export function arbol(d: AppData): MesaArbol[];                // General primero; resto por nombre
  export function rutaDe(d: AppData, groupId: string): Group[];  // raíz → grupo
  export function moverAFecha(i: Item, dia: string, horaPorDefecto: number): Item;
  ```
- Prioridad de `estadoDe`:
  1. `hecho` (completado);
  2. `bloqueado` (algún requisito sin completar);
  3. `hueco` (sin fecha);
  4. `hoy` (fecha hoy o atrasada);
  5. `on` (en la ventana);
  6. `tenue`.
- Reglas de `moverAFecha(i, dia, h)`:
  - si tiene `scheduledAt`, lo mueve a `dia` conservando la hora local;
  - si no, y tiene `dueAt`, mueve ese;
  - si no tiene fecha, pone `dueAt = dia` a las `h:00` locales;
  - con `dia === ""`, borra `scheduledAt` y `dueAt`; para Evento, Visita y Meeting lanza "Un evento necesita fecha.";
  - `startDate = min(startDate, dia)`.

- [ ] **Step 1: Pruebas (fallan)**

  `ventana: semana incluye hoy+6 y excluye hoy+7`, `ventana: atrasada sin completar cuenta`, `estado: prioridades`, `carga: nota 0, completada 0, difícil de 3 h = 9`, `carga: contenedor suma subgrupos pendientes`, `conexiones: entre mesas`, `modelo: la cosa en una rutina es modelo` y `timedItems: excluye modelos`.

  Además, `moverAFecha: conserva la hora local` (Review Focus 4):
  ```js
  const i = { ...item(), scheduledAt: new Date(2030, 2, 30, 9, 15).toISOString() };
  const j = e.moverAFecha(i, "2030-04-02", 18);
  assert.equal(new Date(j.scheduledAt).getHours(), 9); assert.equal(new Date(j.scheduledAt).getMinutes(), 15);
  ```

  También `moverAFecha: evento no queda sin fecha`, `moverAFecha: sin fecha usa la hora por defecto` y `neka: un modelo de rutina no cuenta para hoy` (en `neka.cjs`).
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implementar `espacio.ts`, registrarlo en `run.cjs` y reemplazar `activeItems` por `timedItems` en los archivos listados. Las búsquedas por id siguen usando `activeItems`.
- [ ] **Step 4:** `npm test` y `npm run typecheck`. Expected: PASS.
- [ ] **Step 5: Commit**

  `V2/B: cerebro común del Espacio`.

---

### Task 5: Rutinas que se repiten

**Files:**
- Create: `front/src/utils/rutinas.ts`, `front/tests/rutinas.cjs`
- Modify: `front/src/utils/model.ts` (extraer `copiarGrupo` de `duplicateGroup`), `front/tests/run.cjs`

**Interfaces:**
- Consumes: `esRutina` y `esModelo` (Task 4), `Group` (Task 2).
- Produces:
  ```ts
  // model.ts — usado por duplicateGroup (ids uid) y rutinas (ids deterministas)
  export function copiarGrupo(d: AppData, origenId: string, dias: number, nuevo: Group,
    idItem: (viejo: string) => string, idPaso: (item: string, viejo: string) => string): AppData;
  // rutinas.ts
  export function diasQueToca(g: Group, desde: string, hasta: string): string[]; // AAAA-MM-DD, nunca antes de repeatStart
  export const idOcurrencia = (rutinaId: string, dia: string) => `${rutinaId}~${dia}`;
  export function aplicarRutinas(d: AppData, now: number): AppData;              // misma referencia si no hay nada nuevo
  export function ocurrencias(d: AppData, rutinaId: string, now: number): { actuales: Group[]; anteriores: Group[] };
  ```
- Reglas:
  - `semanal` toca el mismo día de la semana que `repeatStart`; `dias` toca en `repeatDays` (0 = domingo); `diario`, todos los días.
  - Ventana de generación: de hoy hasta hoy+6.
  - La ocurrencia es un grupo con `{ id: idOcurrencia, name: "<rutina> · <d MMM>", workspaceId, parentId: rutinaId, repeat: "" }`.
  - Sus cosas se copian del modelo con `copiarGrupo` y `dias = (dia − repeatStart)`. Los ids de las cosas son `${idOcurrencia}~${idModelo}` y los de los pasos `${idItem}~${idPaso}`.
  - Una ocurrencia que ya existe no se toca.
  - "Anteriores" son las ocurrencias de días pasados con todas sus cosas completadas.

- [ ] **Step 1: Pruebas (fallan)**

  `rutinas: diaria genera 7 días`, `rutinas: semanal solo el mismo día`, `rutinas: ciertos días`, `rutinas: nunca antes del inicio`, `rutinas: conserva hora y reconecta dependencias`, `rutinas: no duplica si ya existe` (devuelve la misma referencia), `rutinas: anteriores completas se separan` y `reutilizar sigue igual` (el test existente de `duplicateGroup` en verde).

  Y **`rutinas: dos copias generan los mismos registros`** (Review Focus 1):
  ```js
  const a = r.aplicarRutinas(base, now), b = r.aplicarRutinas(clone(base), now);
  assert.equal(s.operation(a, b), null);
  ```
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Extraer `copiarGrupo` (`duplicateGroup` pasa a usarlo con `uid`), implementar `rutinas.ts` y registrarlo en `run.cjs`.
- [ ] **Step 4:** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit**

  `V2/B: rutinas que se repiten`.

---

### Task 6: Colores de mesa y acomodo de Tiempo

**Files:**
- Create: `front/src/utils/colores.ts`, `front/src/utils/acomodo/tiempo.ts`
- Modify: `front/tests/acomodo.cjs`, `front/tests/run.cjs`, `front/src/styles/theme.ts` (tokens `cable: "#B9A6F4"`, `vidrio: "rgba(255,255,255,0.18)"`, `vidrioBorde: "#D3C6F5"`, `sombraPiso: "rgba(70,40,140,0.20)"`)

**Interfaces:**
- Consumes: `Ventana`, `estadoDe`, `fechaDe`, `timedItems` y `moverAFecha` (Task 4).
- Produces:
  ```ts
  // colores.ts — mezcla lineal en RGB con blanco/negro
  export type Tonos = { base: string; suave: string; zona: string; zonaInterna: string; bordeClaro: string; bordeOscuro: string };
  export function tonos(hex: string): Tonos; // suave = 88% blanco, zona = 92%, zonaInterna = 84%, bordeClaro = 25% blanco, bordeOscuro = 25% negro
  // acomodo/tiempo.ts
  export type Radios = { centro: number; hoy: number; manana: number; ventanaDesde: number; ventanaHasta: number; sinFecha: number };
  export type Sector = { workspaceId: string; desde: number; hasta: number }; // grados, 0 = arriba, sentido horario
  export type NodoTiempo = { id: string; workspaceId: string; x: number; y: number; estado: Estado; anillo: "hoy" | "manana" | "ventana" | "sinFecha" };
  export function radiosPara(lado: number): Radios; // centro .07, hoy .14, mañana .24, ventana .30–.40, sinFecha .47 (× lado)
  export function sectores(d: AppData): Sector[];   // proporcional a cosas de cada mesa, mínimo 30°, General incluida
  export function acomodoTiempo(d: AppData, v: Ventana, now: number, lado: number): { nodos: NodoTiempo[]; sectores: Sector[]; radios: Radios };
  export function diaDesdeRadio(r: number, radios: Radios, v: Ventana, now: number): string; // "" en el anillo sin fecha; encaja por día
  ```
- Reglas:
  - Tiempo **excluye** Nota, Idea, modelos y cosas fuera de la ventana. Excepción: con `todo`, los días de 2 a 30 se reparten en la banda de la ventana y lo posterior queda en su borde exterior.
  - Las cosas de un mismo anillo y sector se reparten a lo largo del ángulo sin solaparse (separación mínima de 14 px).
  - Las atrasadas van al anillo de hoy.

- [ ] **Step 1: Pruebas (fallan)**

  `colores: tonos de un violeta`, `tiempo: hoy en el anillo de hoy`, `tiempo: notas e ideas no aparecen`, `tiempo: sector de cada mesa con mínimo 30°`, `tiempo: sin solapes en un mismo anillo`, `tiempo: diaDesdeRadio encaja por día` (radios de cada anillo → días esperados; anillo exterior → `""`) y `tiempo: cuenta vacía` (solo sectores, 0 nodos).
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implementar y registrar en `run.cjs`; tokens en `theme.ts` (y `tests/theme.cjs` si comprueba la lista de colores).
- [ ] **Step 4:** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit**

  `V2/B: colores de mesa y acomodo de Tiempo`.

---

### Task 7: Acomodo de Plano

**Files:**
- Create: `front/src/utils/acomodo/plano.ts`
- Modify: `front/tests/acomodo.cjs`, `front/tests/run.cjs`

**Interfaces:**
- Consumes: `arbol`, `estadoDe` y `Ventana` (Task 4); `hijosDe` (Task 3).
- Produces:
  ```ts
  export type Rect = { x: number; y: number; w: number; h: number };
  export type PuntoPlano = { id: string; x: number; y: number; estado: Estado };
  export type ZonaLejos = { id: string; tipo: "mesa" | "grupo" | "rutina"; workspaceId: string; groupId: string; nombre: string; total: number; rect: Rect; puntos: PuntoPlano[]; hijos: ZonaLejos[] };
  export function acomodoPlanoLejos(d: AppData, v: Ventana, now: number, ancho: number): { sueltas: Item[]; masSueltas: number; zonas: ZonaLejos[]; alto: number };
  export type FichaPos = { id: string; rect: Rect };
  export type ZonaCerca = { id: string; nombre: string; tipo: "grupo" | "rutina"; rect: Rect; fichas: FichaPos[]; mas: number; hijos: ZonaCerca[] };
  export function acomodoPlanoCerca(d: AppData, a: Destino, ancho: number): { sueltas: FichaPos[]; zonas: ZonaCerca[]; alto: number };
  export function indiceEn(z: { fichas: FichaPos[] }, x: number, y: number): number; // posición de inserción al soltar
  export function puntosEn(ids: string[], r: Rect, estado: (id: string) => Estado): PuntoPlano[]; // deterministas, dentro de la elipse de r (también lo usa Mesas)
  export const TOPE_FICHAS = 8;
  ```
- **De lejos:**
  - las sueltas de General van primero (máximo 2 visibles, más `masSueltas`);
  - las mesas van en 2 columnas, con un alto proporcional a `√(cosas)` (mínimo 76 y máximo 240);
  - los grupos raíz de cada mesa van como zonas internas;
  - los puntos se ubican en posiciones deterministas (hash del id) dentro de la elipse de su zona, con una separación mínima de 8.
- **De cerca:**
  - grilla de 2 columnas (ancho de ficha = `(ancho − 2·12 − 8)/2`, alto 50), ordenada por `x`;
  - por zona, hasta `TOPE_FICHAS` fichas, más `mas`;
  - los subgrupos van como zonas debajo de la ficha final de su padre.

- [ ] **Step 1: Pruebas (fallan)**

  `plano: General primero y mesas en 2 columnas`, `plano: puntos deterministas y dentro de su zona`, `plano: grilla ordenada por x`, `plano: tope de fichas` (Review Focus 5: 60 cosas → 8 fichas y `mas = 52`), `plano: subgrupo debajo de su padre`, `plano: indiceEn al soltar entre dos fichas` y `plano: cuenta vacía`.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implementar y registrar.
- [ ] **Step 4:** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit**

  `V2/B: acomodo de Plano`.

---

### Task 8: Acomodo de Mesas y `elegir`

**Files:**
- Create: `front/src/utils/acomodo/mesas.ts`
- Modify: `front/tests/acomodo.cjs`, `front/tests/run.cjs`

**Interfaces:**
- Consumes: `proyectar`, `Camara` y `Punto3` (Task 1); `cargaDe`, `cargaDeContenedor`, `estadoDe`, `conexiones` y `arbol` (Task 4); `PuntoPlano` y la ubicación determinista de puntos (Task 7, exportar `puntosEn(ids: string[], rect: Rect, estado: (id: string) => Estado): PuntoPlano[]` desde `plano.ts`).
- Produces:
  ```ts
  export type Foco = { workspaceId: string; ruta: string[] };   // "general" + [] = arriba; ruta = ids de grupos
  export type Cubito = { id: string; x: number; y: number; alto: number; estado: Estado };
  export type Piso = { id: string; tipo: "general" | "mesa" | "grupo" | "rutina"; workspaceId: string; groupId: string; nombre: string; total: number;
    x: number; y: number; w: number; h: number; z: number; grosor: number; vidrio: boolean; cubitos: Cubito[]; puntos: PuntoPlano[] };
  export type Cable = { desde: Punto3; hasta: Punto3 };
  export function tamanoPiso(n: number): number;      // clamp(110 + 26·√n, 120, 260)
  export function altoCubito(carga: number): number;  // carga 0 → 1; si no, clamp(2 + 2·carga, 3, 26)
  export function grosorPiso(cargaPendiente: number, tipo: Piso["tipo"]): number; // mesa/general 10–24; grupo/rutina 5–10
  export function acomodoMesas(d: AppData, f: Foco, v: Ventana, now: number): { pisos: Piso[]; cables: Cable[] };
  export function elegir(pisos: Piso[], c: Camara, x: number, y: number): { tipo: "piso" | "cubito"; id: string } | null; // el más cercano a la cámara
  ```
- **Pisos según el foco** (z = 0, −150, −290 por nivel, todos en el mismo eje):
  - **Arriba:** General (sus sueltas como cubitos) y debajo las mesas en grilla 2×N centrada en el eje (sus cosas como puntos).
  - **En una mesa:**
    - General en `vidrio` arriba;
    - la mesa con sus sueltas como cubitos;
    - debajo, sus grupos raíz (puntos);
    - las demás mesas en `vidrio`, salvo las que tienen conexiones con la mesa en foco (sólidas, con `Cable`).
  - **En un grupo:** igual, un nivel más abajo; los ancestros quedan en `vidrio`.
- Los cubitos van en grilla de 48 con separación de 8, ordenados por `x`. `elegir` prueba primero los cubitos y después los pisos, del más cercano al más lejano.

- [ ] **Step 1: Pruebas (fallan)**

  `mesas: General arriba y mesas debajo en el mismo eje` (centros de piso alineados en el eje común), `mesas: tamaño acotado` (Review Focus 5: con n = 500 el tamaño es 260), `mesas: altura = carga y nota plana`, `mesas: en una mesa, General es vidrio y aparecen sus grupos`, `mesas: mesa conectada sólida y con cable`, `mesas: elegir cubito antes que piso` y `mesas: cuenta vacía` (solo General).
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implementar y registrar.
- [ ] **Step 4:** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit**

  `V2/B: acomodo de Mesas`.

---

### Task 9: Piezas comunes de pantalla

**Files:**
- Create in `front/src/components/ui/espacio/`: `VistaSelector.tsx`, `SelectorTiempo.tsx`, `HojaCosa.tsx`, `ConectarCon.tsx`, `MenuCrear.tsx`, `FormGrupo.tsx`, `BarraSeleccion.tsx`, `CapaConexiones.tsx`, `AvisoBorde.tsx`, `useEspacioPrefs.ts`, `index.ts`

**Interfaces:**
- Consumes: `estructura.ts` (Task 3), `espacio.ts` (Task 4), `tonos` (Task 6) y los componentes base de A (`Sheet`, `Button`, `Chip`, `Field`, `Txt`, `PressableScale`, `Toggle`).
- Produces:
  ```ts
  export type Vista = "tiempo" | "mesas" | "plano";
  VistaSelector({ vista: Vista; onCambio: (v: Vista) => void })    // íconos planet-outline · cube-outline · map-outline; etiquetas "Tiempo", "Mesas", "Plano"
  SelectorTiempo({ ventana: Ventana; onCambio: (v: Ventana) => void }) // "Hoy" · "Semana" · "2 semanas" · "Todo"
  HojaCosa({ item: Item | null; onClose: () => void; onVerDonde: (i: Item) => void }) // Sheet + ItemEditor + botones "Conectar con…" y "Ver dónde está"; oculta completar si esModelo
  ConectarCon({ item: Item; visible: boolean; onClose: () => void }) // lista buscable de cosas accionables de todas las mesas; agrega a dependencies vía saveItem
  MenuCrear({ visible: boolean; destino: Destino & { dia?: string }; onClose: () => void }) // 8 tipos + Rutina + Mesa (solo si destino.workspaceId === GENERAL y groupId === "")
  FormGrupo({ visible; inicial?: Group; destino: Destino; rutina: boolean; onClose }) // nombre; "Dentro de" (mesa y grupo padre → moverGrupo); para rutina: frecuencia + días + desde; si inicial: "Borrar grupo" (borrarGrupo)
  FormMesa({ visible; inicial?: Workspace; onClose })               // nombre y color (4 de B_SISTEMA_VISUAL §2); si inicial y no es General: "Borrar mesa" (borrarMesa)
  BarraSeleccion({ ids: string[]; onListo: () => void })            // "Juntar en rutina", "Sacar del grupo", "Mover a otra mesa", "Conectar" (solo con 2: «A» espera a «B», botón intercambiar)
  CapaConexiones({ flechas: { desde: {x;y}; hasta: {x;y} }[] })     // SVG, color.primary, punta de flecha
  AvisoBorde({ texto: string; tonoHex: string; onPress: () => void })
  useEspacioPrefs(): { vista: Vista; ventana: Ventana; setVista; setVentana; listo: boolean } // AsyncStorage "nekal:espacio"; vista inicial "mesas"
  ```
- `MenuCrear`:
  - **Tarea, Evento, Visita, Meeting, Deadline y Goal** abren `HojaCosa` con `newItem(workspaceId)`, `groupId` y, si hay `dia`, la fecha (con `moverAFecha`).
  - **Nota e Idea** desde Tiempo quedan en `destino`, y un aviso dice "Quedó en <mesa>".
  - **Rutina** y **Grupo** abren `FormGrupo`.
  - **Mesa** abre `FormMesa`.
- Los errores de `estructura.ts` se muestran dentro de la hoja.
- **Editar mesas y grupos** (en las tres vistas): mantener presionada una zona (Plano), un piso (Mesas) o una etiqueta de sector (Tiempo) abre `FormMesa` o `FormGrupo` con `inicial`. Así se renombra, se mueve un grupo a otro lugar, se cambia la frecuencia de una rutina o se borra.
- **Idea → tarea:** la conversión que ya existe en `ItemEditor` cambia el tipo de la **misma** cosa, que queda en su lugar. No se crea una conexión aparte, porque una idea no puede ser requisito (`validateItem`). Esto cumple "queda conectada a su idea" de la spec §3.3.

- [ ] **Step 1: Implementar las piezas**

  Seguir B_SISTEMA_VISUAL §4 y la maqueta 07 ("Crear" y "Juntar y sacar"). Usar `Txt` y tokens; tocar algo da `haptic.selection`.
- [ ] **Step 2: Verificación**

  `npm test` (incluye `styles.cjs`), `typecheck` y `build:web`. Expected: verde.
- [ ] **Step 3: Commit**

  `V2/B: piezas comunes del Espacio`.

---

### Task 10: Pantalla del Espacio y vista Plano

**Files:**
- Rewrite: `front/src/pages/EspacioTrabajo.tsx`
- Create: `front/src/components/ui/espacio/PlanoLejos.tsx`, `PlanoCerca.tsx`, `FichaPlano.tsx`
- Delete: `front/src/components/ui/EspacioTrabajoUi/` (todo), `PruebaMesas.tsx` y `PruebaMesas.web.tsx`, junto con el botón "Prueba 3D"

**Interfaces:**
- Consumes: Tasks 3, 4, 7 y 9.
- **Estado de la pantalla:** `vista` y `ventana` (de `useEspacioPrefs`), `foco: Foco`, `planoDestino: Destino | null` (`null` = de lejos), `seleccion: string[]`, `abierta: Item | null`, `crear: (Destino & { dia?: string }) | null`.
- **Encabezado:**
  - `ScreenHeader`, con el título según el foco y la cantidad;
  - "‹ <padre>" si no está arriba;
  - a la derecha, `VistaSelector`;
  - debajo, `SelectorTiempo`.
- **Plano de lejos** (siempre al entrar a Plano):
  - zonas de color con `tonos(mesa.color)` y puntos con conexiones (líneas a los 2 vecinos más cercanos);
  - tocar una zona → `planoDestino`;
  - pellizcar para acercar en una zona hace lo mismo.
- **Plano de cerca:**
  - `ScrollView` vertical con las fichas (`FichaPlano`: ícono, título, dato, barra de avance, ●●○, etiquetas Hoy/Urgente y estados de B_SISTEMA_VISUAL §3);
  - tocar → `HojaCosa` y `CapaConexiones` con sus flechas, más `AvisoBorde` ("N en <mesa> ›") para las que están fuera;
  - mantener y mover (`Gesture.Pan().activateAfterLongPress(350)`) → arrastra, y al soltar `indiceEn` → `reordenar`, o `moverItems` si cae en otra zona;
  - mantener quieto 500 ms → selección múltiple con vibración, y `BarraSeleccion` abajo;
  - arrastrar desde el puntito derecho de una ficha hasta otra → la primera espera a la segunda (`saveItem`; el error se muestra en un aviso);
  - tocar un espacio vacío de una zona → `MenuCrear` con ese destino;
  - "Ver dónde está" desde cualquier vista → `vista = "plano"` y `planoDestino` del ítem.
- **Estado vacío** (Review Focus 2): `EmptyState` "Crea tu primera cosa" con un botón que abre `MenuCrear` en General.
- Tiempo y Mesas muestran temporalmente "Próximamente" hasta las Tasks 11 y 12.

- [ ] **Step 1: Implementar**
- [ ] **Step 2: Verificación**
  - `npm test`, `typecheck` y `build:web`;
  - en web a 375×812, revisar: lejos → cerca, crear una tarea en un grupo, reordenar, mover a otra zona, conectar, seleccionar 3 y juntarlas en una rutina, "Ver dónde está";
  - cuenta nueva vacía.
- [ ] **Step 3: Commit**

  `V2/B: pantalla del Espacio y vista Plano`.

---

### Task 11: Vista Tiempo

**Files:**
- Create: `front/src/components/ui/espacio/TiempoVista.tsx`
- Modify: `front/src/pages/EspacioTrabajo.tsx` (reemplaza el "Próximamente")

**Interfaces:**
- Consumes: `acomodoTiempo`, `diaDesdeRadio` y `radiosPara` (Task 6); `moverAFecha` y `conexiones` (Task 4); piezas de la Task 9.
- **Fondo:**
  - SVG con los sectores (`tonos(color).suave`), los anillos (blancos, el de afuera punteado) y el centro "Hoy" con el día;
  - etiquetas de anillo ("MAÑANA", "SEMANA" o "2 SEMANAS", "SIN FECHA") y de mesa en su sector.
- **Puntos:** `PressableScale` absolutos de 44 × 44, con el círculo visible de 16 (ícono del tipo y estados de §3), con `accessibilityLabel` = "título, fecha, mesa".
- **Gestos:**
  - tocar → hoja y flechas (`CapaConexiones`) desde sus requisitos y hacia sus dependientes;
  - mantener y arrastrar → `diaDesdeRadio`, con `haptic.selection` en cada cambio de día y una píldora flotante "<fecha vieja> → <fecha nueva>"; al soltar, `change(d => saveItem(d, moverAFecha(...)))`. Si hay error ("Un evento necesita fecha."), aviso y vuelve a su lugar;
  - tocar un anillo vacío → `MenuCrear` con `dia` y el destino del foco actual (los 8 tipos; una nota o idea queda en esa mesa con el aviso "Quedó en <mesa>");
  - mantener quieto 500 ms un punto → selección múltiple con `BarraSeleccion` (moverse antes de los 500 ms activa el arrastre de fecha);
  - pellizcar → ventana siguiente o anterior.
- `useReducedMotion()`: sin animación de reacomodo.

- [ ] **Step 1: Implementar**
- [ ] **Step 2: Verificación**

  `npm test`, `typecheck` y `build:web`. En web: arrastrar "Vie" a "Mañana" y ver la fecha cambiada en la hoja; anillo vacío → crear con fecha; cuenta vacía (solo "Hoy" y sectores).
- [ ] **Step 3: Commit**

  `V2/B: vista Tiempo`.

---

### Task 12: Vista Mesas

**Files:**
- Create: `front/src/components/ui/espacio/MesasVista.tsx`, `MesasVista.web.tsx` (envoltorio `WithSkiaWeb`), `MesasLienzo.tsx` (dibujo Skia), `MesasAccesible.tsx` (capa invisible)
- Modify: `front/src/pages/EspacioTrabajo.tsx`

**Interfaces:**
- Consumes: `acomodoMesas`, `elegir` y `Foco` (Task 8); `proyectar`, `ordenarPorProfundidad`, `Camara` e `INCLINACION` (Task 1); `tonos` (Task 6). Ruling de la Task 1 si se pasó a SVG.
- **Dibujo** (por profundidad):
  - cada piso es una cara superior blanca más dos caras laterales con un degradé de `tonos(color).bordeClaro → bordeOscuro`, y una sombra elíptica (`color.sombraPiso`) bajo el piso;
  - el `vidrio` es una cara `color.vidrio` con borde punteado `color.vidrioBorde`;
  - la etiqueta del piso va en mayúsculas sobre la cara superior;
  - los cubitos llevan altura, cara oscura si su estado es `hoy` y ✓ si están completados;
  - los puntos llevan halo y líneas a los 2 vecinos;
  - los cables en `color.primary`;
  - las líneas punteadas verticales entre pisos (`color.cable`);
  - la fuente **Neka** es un cubito chico a la izquierda de General, conectado por un cable en ángulo recto.
- **Gestos** (`Camara` en valores compartidos):
  - un dedo mueve;
  - `Rotation` gira;
  - dos dedos en vertical inclinan;
  - `Pinch` hace zoom (0.5–2.5);
  - `Tap` → `elegir`: piso → baja el foco (cámara animada con `motion.gentle`); cubito → hoja;
  - `LongPress` sobre un cubito → selección múltiple (`BarraSeleccion`); sobre un piso → `FormMesa` o `FormGrupo`. En 3D no se arrastra: mover y conectar se hace con la barra o la hoja (spec §3.2);
  - "‹" sube.
- **`MesasAccesible`:** `Pressable` invisibles (opacidad 0 y accesibles) en el centro proyectado de cada piso y cubito, con `accessibilityLabel` ("Mesa Trabajo, 22 cosas" / "Tarea Preparar demo, mañana"). Se recalculan al terminar cada gesto.
- Fuera del foco no se dibujan más de 3 niveles.

- [ ] **Step 1: Implementar**
- [ ] **Step 2: Verificación**

  `npm test`, `typecheck` y `build:web`. En web: girar, inclinar, bajar a una mesa (General se vuelve vidrio y lo no relacionado se apaga) y a un grupo; abrir un cubito; ver los cables entre mesas conectadas; cuenta vacía (solo General y Neka).
- [ ] **Step 3: Commit**

  `V2/B: vista Mesas`.

---

### Task 13: Rutinas en la app, reglas y cierre — puntos de control

**Files:**
- Create: `front/src/utils/useRutinas.ts`
- Modify: `front/src/navigation/TabNavigator.tsx` (monta `useRutinas`), `CLAUDE.md` (Skia; `utils/espacio.ts`, `estructura.ts`, `rutinas.ts` y `acomodo/`), `DOCUMENTOS/V2/ROADMAP.md` (estado de B)

**Interfaces:**
- Consumes: `aplicarRutinas` (Task 5) y `change` de `useApp`.
- `useRutinas()`: cuando los datos están listos y en cada `AppState` "active", calcula `aplicarRutinas(data, Date.now())` y, si la referencia cambió, llama `change(() => next)`. Los errores se ignoran en silencio (se reintenta en la próxima activación).

- [ ] **Step 1:** Implementar y montar `useRutinas`. Verificar en web: una rutina diaria creada hoy muestra 7 ocurrencias y, al recargar, no se duplican.
- [ ] **Step 2:** `npm test`, `typecheck` y `build:web` en verde.
- [ ] **Step 3: PUNTO DE CONTROL (reglas)**

  Explicar al usuario que, para sincronizar grupos nuevos con la nube, hay que publicar las reglas, y pedir permiso para `npm run deploy` (publica reglas y web). Sin permiso, no se publica y se anota.
- [ ] **Step 4:** Actualizar `CLAUDE.md` y `ROADMAP.md` (B: "Implementado; pendiente prueba en iPhone"). Commit `V2/B: rutinas en la app y cierre`.
- [ ] **Step 5: PUNTO DE CONTROL (iPhone)**

  El usuario prueba en el iPhone las tres vistas, crear, mover, conectar, juntar y una rutina. Los ajustes que pida entran como tareas nuevas antes de terminar la rama.
