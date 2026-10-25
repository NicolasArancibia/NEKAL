# Subproyecto E · Gamificación — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Puntaje que premia lo hecho a tiempo, niveles con curva, tus días (heatmap y racha) en el Resumen, y en el Perfil el nivel, 24 logros con su modal de revelado y un rating por mesa con área.

**Architecture:**
- **Lógica pura y probada** en `front/src/utils/progreso/`: `nivel`, `desde`, `dias`, `mesas` y `logros`. Todo se calcula desde `AppData`.
- **El puntaje** cambia en `utils/model.ts` (`difficultyOf`, `pointsFor`).
- **Datos nuevos:** solo dos. `Workspace.area` (opcional) y `AppData.logros` (logros vistos, un documento por logro).
- **Un hook**, `utils/useProgreso.ts`, junta todo para las pantallas. La UI vive en `components/ui/progreso/`.

**Tech Stack:**
- Expo 57, React Native 0.86, React 19, TypeScript.
- Reanimated 4, react-native-svg y expo-haptics, que ya están instalados.
- Pruebas con `node:test` mediante `front/tests/run.cjs`.

**Spec:** [E_GAMIFICACION.md](E_GAMIFICACION.md), con el registro en [E_NOTAS_BRAINSTORMING.md](E_NOTAS_BRAINSTORMING.md). Maquetas: [02](E_MAQUETA/02-donde-vive-el-progreso.html), [03](E_MAQUETA/03-perfil-y-resumen.html) y [04](E_MAQUETA/04-modal-de-logro.html).

## Global Constraints

**Trabajo**
- Rama `v2/e-gamificacion` desde `main`. Git solo local. `skills-lock.json` y `IDEAS_ESPACIODETRABAJO/FAV/` no se tocan.
- Sin dependencias nuevas. Antes de usar una API de Expo, Reanimated o SVG que no esté ya en el código, consultar la doc de Expo v57 (MCP `context7`).
- Los archivos de `src/utils/progreso/` son puros: no importan React, React Native ni Firebase. Se agregan a la lista de `tests/run.cjs` y compilan a `.test-build/progreso/`.

**Interfaz (sistema A)**
- Sin colores, `fontSize` ni `fontWeight` sueltos en `src/components`, `src/pages` y `src/navigation` (lo verifica `tests/styles.cjs`).
- Colores nuevos, en `styles/theme.ts`:
  - `color.medallaApagada: "#F6F3FC"`;
  - `export const heat = ["#EEE9F6", "#DCCFFB", "#BBA3F6", "#9773F0", "#7546EC"] as const`, que son los tonos 0 a 4.
- El color de cada mesa sale de sus datos (`workspace.color`).
- Texto siempre con `Txt`. Íconos Ionicons `*-outline`. Área táctil de 44×44 o más.
- Con `useReducedMotion()`: sin giros, saltos ni resortes, solo fundidos.
- **El `LevelRing` del Resumen no cambia de aspecto.** Solo se envuelve para poder tocarlo.
- Neka aparece una vez por pantalla. El modal usa la pose 5, que se suma a `NekaPose` y a `nekaImages`.

**Decisión de este plan:** `difficultyOf` cambia en toda la app, como pide la spec §3. Efecto visible: en el Espacio (`cargaDe`), las cosas cerca de su fecha ya no se ven más «pesadas».

**Textos fijos** (tuteo, se copian tal cual; `N` y `M` son números con separador de miles «1.000»):
- **Pantallas:**
  - «Tus días», «+N pts esta semana», «Racha», «Récord», «N días».
  - «Desde el día 1» y «Empezaste el 3 de agosto. Desde ahí subiste N niveles y completaste M cosas.»
  - «Tus mesas», «cómo vas en cada una», «Aún sin datos», «Sube», «Baja», «Igual», «N completadas · M vencidas en 4 semanas».
  - «Logros», «N de 24», «Ver los 24 logros», «Logrado», «Pendiente».
  - «En Nekal desde agosto de 2026», «Nivel N», «N pts para el nivel M».
- **Familias de logros en la hoja:** «Constancia», «Volumen y niveles», «Primeras veces».
- **Día:** «jueves 9 de may · 4 de 5 (80%)», «Descanso», «Sin nada agendado · completaste N». Para hoy: «Hoy · 3 de 4 (75%)», «Hoy · descanso», «Hoy · sin nada agendado · completaste N».
- **Modal:**
  - «Logro nuevo», «Genial», «Ver mis logros».
  - «Ya tenías N logros» (lanzamiento) o «N logros nuevos», con «y N más».
  - «Ahora cada nivel cuesta un poco más. Tus puntos siguen intactos.»
- **Editor:** «N pts estimados (+20% si lo terminas antes del viernes)». El día va con nombre (minúscula) si la fecha cae dentro de los próximos 6 días; si no, «12 de noviembre».
- **VoiceOver:**
  - «Nivel 8. Ver tu perfil»;
  - «Tus días, últimas 12 semanas»;
  - «Logro nuevo: Racha de 7 días»;
  - «Puntos acumulados desde el 3 de agosto: de 0 a 3.140; subiste 7 niveles».

**Datos**
- Una mesa tiene **3 claves (`id`, `name`, `color`) o 4 (+`area`)**. Un logro visto tiene **exactamente `id` y `at`**.
- `back/firestore.rules` se edita en la Task 5 y **solo se publica con `npm run deploy:rules` y permiso explícito del usuario** (Task 9).
- No se escribe ni se guarda la clave de PruebaClaude: el usuario inicia sesión.

## Review Focus

1. **Días locales con cambio de mes, año u horario.** Los días se recorren por fecha de calendario, no sumando 86.400.000 ms. Chile cambia la hora en abril y septiembre. → Task 2, `historial: cruza mes, año y horario`.
2. **Una cosa con hora y fecha límite en días distintos.** Cuenta en los dos días del heatmap, igual que en «Hoy», pero **una sola vez** en el rating (se usa la hora; si no tiene, la fecha límite). → Task 2 `dias: hora y límite en días distintos` y Task 3 `mesas: cuenta una vez`.
3. **Un logro desbloqueado con una hoja abierta en el iPhone.** Un `Modal` nativo no puede aparecer sobre otro, así que el modal espera a que no haya hojas abiertas. → Task 8, paso de verificación con el editor abierto.
4. **Cuenta vacía (`emptyData`).** Ninguna función divide por cero ni toma el máximo de una lista vacía: día 1 = hoy, rachas en 0, mesas sin rating y ningún logro. → Pruebas «cuenta vacía» en las Tasks 1 a 4.
5. **Desmarcar una cosa completada.** El % y la racha bajan; los puntos ya pagados y los logros vistos se quedan. → Task 4, `logros: desmarcar no quita lo visto`.

## Estructura de archivos

| Archivo | Qué hace |
|---|---|
| `utils/model.ts` (modificar) | `difficultyOf` sin fecha, bonus en `pointsFor`, `RAZON_COMPLETADO`, `Area`, `AREA_IDS`, `LOGRO_IDS`, `LogroVisto`, `Workspace.area?` y `AppData.logros` |
| `utils/progreso/nivel.ts` | `puntosParaNivel`, `nivelDe` |
| `utils/progreso/desde.ts` | `cosasListas`, `desdeElDia1` (día 1, curva y subidas) |
| `utils/progreso/dias.ts` | `cosasDelDia`, `diaDe`, `historial`, `rachas`, `semanas12`, `puntosSemana`, `textoDia` |
| `utils/progreso/mesas.ts` | `AREAS`, `areaSugerida`, `areaDe`, `ratingEn`, `ratingMesa`, `ratings` |
| `utils/progreso/logros.ts` | `CATALOGO`, `hechosDe`, `cumple`, `avance`, `desbloqueados`, `porVer`, `siguiente`, `verLogros`, `paraPerfil` |
| `utils/storage.ts`, `utils/syncModel.ts` (modificar) | validar `area` y `logros`, colección `logros` |
| `utils/estructura.ts` (modificar) | `crearMesa(..., id, area?)` |
| `utils/espacio.ts` (modificar) | `difficultyOf(i)` sin `now` |
| `back/firestore.rules` (modificar) | mesas con 3 o 4 claves y tipo `logros` |
| `utils/useProgreso.ts` | hook con `useMemo` para las pantallas |
| `utils/hojasAbiertas.ts` | contador de hojas abiertas (`useSyncExternalStore`) |
| `components/ui/progreso/` | `Anillo`, `Heatmap`, `TusDias`, `CurvaDesde`, `TarjetaNivel`, `Medalla`, `GrillaLogros`, `HojaLogros`, `FilaMesa`, `LogroNuevo` |
| `pages/Resumen.tsx`, `pages/Perfil.tsx`, `pages/Ajustes.tsx`, `components/ui/ItemEditor.tsx`, `components/ui/espacio/FormMesa.tsx`, `components/ui/base/{Sheet,ProgressBar,nekaImages}.ts(x)`, `navigation/TabNavigator.tsx` (modificar) | pantallas |
| `tests/progreso.cjs` (nuevo), `tests/rules.cjs`, `tests/sync.cjs`, `tests/firestore.cjs`, `tests/run.cjs` (modificar) | pruebas |

Para todas las pruebas de progreso: `now = new Date(2030, 4, 12, 18, 0).getTime()`, que es un domingo. Los ítems se arman con `m.newItem()`, como en `tests/rutinas.cjs`.

---

### Task 1: Puntaje, niveles y «desde el día 1»

**Files:**
- Modify: `front/src/utils/model.ts`, `front/src/utils/espacio.ts`, `front/src/pages/Ajustes.tsx`, `front/src/components/ui/ItemEditor.tsx`, `front/src/pages/Resumen.tsx`, `front/src/pages/Perfil.tsx`, `front/tests/run.cjs`, `front/tests/rules.cjs`
- Create: `front/src/utils/progreso/nivel.ts`, `front/src/utils/progreso/desde.ts`, `front/tests/progreso.cjs`

**Interfaces:**
- Produces:
  ```ts
  // model.ts
  export const BONUS_A_TIEMPO = 1.2;
  export const RAZON_COMPLETADO = "Ítem completado"; // saveItem lo usa en vez del literal
  export function difficultyOf(item: Item): 1 | 2 | 3;
  export function pointsFor(item: Item, all: Item[], now?: number): number;
  // progreso/nivel.ts
  export type Nivel = { nivel: number; desde: number; hasta: number; avance: number };
  export const puntosParaNivel: (n: number) => number; // 50·n·(n−1)
  export function nivelDe(puntos: number): Nivel;      // puntos < 0 → como 0
  // progreso/desde.ts
  export function cosasListas(d: AppData): number;     // no pasivas, no borradas, status "completado"
  export type Desde = { dia1: string; dias: number; listas: number; nivelesSubidos: number;
    curva: { dia: string; puntos: number }[]; subidas: { dia: string; nivel: number }[] };
  export function desdeElDia1(d: AppData, now: number): Desde;
  ```
- `difficultyOf`:
  - en `Evento`, `Visita` y `Meeting` devuelve `item.difficulty`;
  - en lo demás, carga = `steps.length + (location ? 1 : 0)`: con 5 o más da 3, con 2 o más da 2, y si no, 1.
- `pointsFor`: multiplica por `BONUS_A_TIEMPO` cuando `item.dueAt && now <= Date.parse(item.dueAt)`, antes del `round`, sin tocar el bonus de dependencias.
- `desdeElDia1`:
  - `dia1` = el `localDay` más antiguo entre `createdAt` de todas las cosas y `at` de las recompensas. Si no hay ninguno, hoy.
  - `dias` = días desde `dia1` hasta hoy, ambos incluidos.
  - `curva` = puntos acumulados (sin los `:budget`) al cierre de `dia1`, de `dia1 + 7k` y de hoy. Si hoy coincide con un `dia1 + 7k`, no se repite.
  - `subidas` = el día en que el acumulado cruza `puntosParaNivel(n)` para cada `n ≥ 2`.

- [ ] **Step 1: Pruebas (fallan)** en `tests/progreso.cjs`, que se agrega a `run.cjs`. Los archivos `progreso/nivel.ts` y `desde.ts` van en la lista de `tsc`.
  - `puntaje: dificultad por pasos y lugar, sin fecha`:
    - 0 y 1 paso → 1;
    - 2 pasos → 2;
    - 1 paso + lugar → 2;
    - 4 pasos → 2;
    - 4 pasos + lugar → 3;
    - 0 pasos con `dueAt` mañana → 1.
  - `puntaje: bonus antes, justo y atrasado`: «Entregar informe», `Tarea`, urgente, 3 pasos. Con `dueAt` en `now + 1 día` → 48; con `dueAt = now` → 48; con `dueAt = now − 60000` → 40.
  - `puntaje: sin fecha límite no hay bonus`: lo mismo sin `dueAt` → 40.
  - `puntaje: la meta congela el bonus en el primer pago`: `Goal` urgente con 3 pasos y fecha futura. `saveItem` con 1 paso hecho antes de la fecha → la recompensa `:budget` vale 48. Completarla después de la fecha → `totalPoints` = 48.
  - `nivel: bordes`: `nivelDe` de 0 → `{nivel:1, desde:0, hasta:100, avance:0}`. 99 → nivel 1. 100 → 2. 299 → 2. 300 → 3. 2800 → 8. 4500 → 10. 3140 → `{nivel:8, desde:2800, hasta:3600, avance:0.425}`.
  - `desde: cuenta vacía` → `{dia1: "2030-05-12", dias: 1, listas: 0, nivelesSubidos: 0, subidas: []}`.
  - `desde: día 1, curva y subidas`: una cosa con `createdAt` 2030-04-01 y recompensas de 100 (04-03), 200 (04-20) y 50 (05-10). Resultado:
    - `dias` 42;
    - `curva` en 04-01, 04-08, 04-15, 04-22, 04-29, 05-06 y 05-12 = `[0, 100, 100, 300, 300, 300, 350]`;
    - `subidas` = `[{dia:"2030-04-03", nivel:2}, {dia:"2030-04-20", nivel:3}]`;
    - `nivelesSubidos` 2.
  - Ajustar las pruebas viejas de `tests/rules.cjs` que dependían de la urgencia en la dificultad. Cada valor cambiado lleva un `Ruling` en el registro.
- [ ] **Step 2:** `npm test`. Expected: FAIL (`nivelDe` no existe, la dificultad da otros valores).
- [ ] **Step 3:** Implementar lo de Interfaces. Además:
  - `espacio.ts` llama `difficultyOf(i)`.
  - Resumen y Perfil reemplazan `Math.floor(points / 100) + 1` y `points % 100` por `nivelDe`. Esas pantallas se rehacen después, pero quedan correctas desde ya.
  - **Ajustes**, «¿Cómo se calculan los puntos?», se reescribe con estos 5 párrafos:
    1. «Base = 10 × dificultad × prioridad. La dificultad sale de los pasos (el lugar cuenta como uno más): 0 o 1 es baja, de 2 a 4 media y 5 o más alta. Prioridad: baja ×1, media ×1,5, urgente ×2.»
    2. «Si la cosa tiene fecha límite y la completas antes, suma un 20% más.»
    3. «Desbloquear dependencias suma 5 puntos por ítem, hasta 15 extra. Notas e ideas no suman. Eventos, visitas y reuniones solo suman si lo activas.»
    4. «Las metas entregan hasta el 80% con sus hitos y el resto al completarlas. Reabrir o marcar otra vez no duplica puntos.»
    5. «Cada nivel cuesta 100 puntos más que el anterior: el 2 llega a los 100, el 3 a los 300, el 4 a los 600 y el 5 a los 1.000.»
  - **Editor:** si no hay puntos congelados y `dueAt` es futura, suma el texto «(+20% si lo terminas antes del …)» después de «pts estimados». El estimado ya incluye el bonus.
- [ ] **Step 4:** `npm test` y `npm run typecheck`. Expected: PASS.
- [ ] **Step 5: Commit** `V2/E: puntaje a tiempo, niveles con curva y desde el día 1`.

---

### Task 2: Tus días (tonos, racha, semana)

**Files:**
- Create: `front/src/utils/progreso/dias.ts`
- Modify: `front/tests/progreso.cjs`, `front/tests/run.cjs`

**Interfaces:**
- Consumes: `RAZON_COMPLETADO`, `localDay`, `passive` (model) y `timeOn` (importado desde `../neka`, que ya es puro y se compila en las pruebas).
- Produces:
  ```ts
  export type Tono = 0 | 1 | 2 | 3 | 4;
  export type Dia = { dia: string; tenias: number; hechas: number; sinAgenda: number;
    tono: Tono; suma: boolean; descanso: boolean };
  export function cosasDelDia(d: AppData, dia: string, mesaId?: string): Item[];
  export function diaDe(d: AppData, dia: string, mesaId?: string): Dia;
  export function historial(d: AppData, desde: string, hasta: string, mesaId?: string): Dia[]; // inclusive
  export type Rachas = { racha: number; record: number; hoySuma: boolean };
  export function rachas(dias: Dia[]): Rachas; // el último elemento es hoy
  export function semanas12(d: AppData, now: number, mesaId?: string): Dia[]; // desde un lunes hasta hoy
  export function puntosSemana(d: AppData, now: number): number;
  export function textoDia(x: Dia, hoy: string): string;
  ```
- **`cosasDelDia`:** cosas no pasivas, no borradas, con `timeOn(i, dia)` (y de la mesa, si se pasa).
- **`sinAgenda`:** cantidad de `itemId` distintos (de la mesa, si se pasa) con una recompensa `RAZON_COMPLETADO` cuyo `localDay(at)` es ese día.
- **Tonos:**
  - `tenias = 0`: con `sinAgenda > 0` → tono 2 y suma; si no → tono 0 y `descanso`.
  - Si hay agenda, `p = hechas/tenias`: 0 → 0; menos de 0,5 → 1; menos de 0,75 → 2; menos de 1 → 3; 1 → 4. Suma con `p ≥ 0,5`.
- **`rachas`:**
  - Los descansos no cortan ni suman.
  - La `racha` cuenta hacia atrás desde ayer, más hoy si hoy suma. Si hoy no suma, no corta.
  - El `record` es la corrida más larga en toda la lista.
- **`historial`:** recorre por fecha de calendario (`new Date(y, m, d + 1)`).
- **`semanas12`:** parte en el lunes de hace 11 semanas, o en el lunes de la semana del día 1 si es posterior.
- **`puntosSemana`:** recompensas sin `:budget` desde el lunes a las 00:00 local. Es la regla actual del Resumen, que se mueve aquí.
- **`textoDia`:** días en español (`domingo`…`sábado`) y meses cortos (`ene`…`dic`). Hoy usa «Hoy · …» (ver Textos fijos).

- [ ] **Step 1: Pruebas (fallan):**
  - `dias: tonos de 0 a 4 de 4`: 4 tareas con hora el 2030-05-09; con k completadas, para k = 0 a 4, los tonos son `[0,1,2,3,4]` y `suma` es `[false,false,true,true,true]`.
  - `dias: sin agenda con algo hecho es tono 2 y suma`, y `dias: nada agendado ni hecho es descanso`.
  - `dias: notas, ideas y borradas no cuentan`.
  - `dias: hora y límite en días distintos` (RF2): `scheduledAt` el 05-08 y `dueAt` el 05-10 → cuenta en los dos días.
  - `rachas: descanso al medio no corta`: `[suma, descanso, suma, hoy suma]` → `racha 3`.
  - `rachas: hoy bajo el 50% no corta`: `[suma, suma, hoy 25%]` → `{racha:2, hoySuma:false}`.
  - `rachas: día en 0% con algo sin fecha hecho corta`.
  - `rachas: récord` es la corrida más larga, aunque no sea la actual.
  - `historial: cruza mes, año y horario` (RF1): de 2030-12-30 a 2031-01-02 da esas 4 fechas, y de 2030-09-01 a 2030-09-10 da 10 fechas seguidas y distintas.
  - `semanas12: cuenta nueva empieza en su primera semana`: con día 1 el 2030-05-01, el primer día es el 2030-04-29. Con día 1 en 2029 empieza 11 semanas antes del lunes 2030-05-06.
  - `puntosSemana`: suma desde el lunes 2030-05-06 y excluye los `:budget` y lo de antes.
  - `textoDia`: «jueves 9 de may · 4 de 5 (80%)», «Descanso», «Sin nada agendado · completaste 2» y «Hoy · 3 de 4 (75%)».
  - `dias: cuenta vacía` (RF4): `rachas(historial(hoy, hoy))` → `{racha:0, record:0, hoySuma:false}`.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `V2/E: tus días, tonos y racha`.

---

### Task 3: Tus mesas (rating y área)

**Files:**
- Modify: `front/src/utils/model.ts` (tipos `Area` y `AREA_IDS`), `front/tests/progreso.cjs`, `front/tests/run.cjs`
- Create: `front/src/utils/progreso/mesas.ts`

**Interfaces:**
- Produces:
  ```ts
  // model.ts
  export type Area = "estudio" | "trabajo" | "salud" | "hogar" | "social" | "personal";
  export const AREA_IDS: Area[];
  // Workspace pasa a { id; name; color; area?: Area }
  // progreso/mesas.ts
  export const AREAS: { id: Area; nombre: string; icono: string }[]; // orden y nombres de la spec §5
  export function areaSugerida(nombre: string): Area;
  export function areaDe(w: Workspace): Area;            // w.area ?? areaSugerida(w.name)
  export function ratingEn(d: AppData, mesaId: string, dia: string, now: number): number | null;
  export type RatingMesa = { mesaId: string; valor: number | null; etiqueta: "Sube" | "Baja" | "Igual" | null;
    completadas: number; vencidas: number };
  export function ratingMesa(d: AppData, mesaId: string, now: number): RatingMesa;
  export function ratings(d: AppData, now: number): RatingMesa[]; // sin General, en el orden de d.workspaces
  ```
- `AREAS` lleva los íconos `school-outline`, `briefcase-outline`, `barbell-outline`, `home-outline`, `people-outline` y `heart-outline`.
- **`areaSugerida`:** pasa el nombre a minúsculas y sin tildes (`normalize("NFD")`), lo parte en palabras y busca las de la spec §5. Gana la primera área de la tabla que coincida; si ninguna, `personal`.
- **Entradas de una mesa** (spec §5, se calculan una vez):
  - **Cosas con fecha:** cosas no pasivas, no borradas, de `workspaceId = mesaId`. El día es el de `scheduledAt` o, si no hay, el de `dueAt`: **un solo día por cosa** (RF2). Entran si están completadas o si `Date.parse(fecha) ≤ now`. `done` = completada.
  - **Cosas sin fecha completadas:** su día es el `localDay` de su recompensa `RAZON_COMPLETADO`.
- **`ratingEn(dia)`** (precisa la spec §5 para que el ejemplo y la mesa quieta den lo mismo):
  1. `A` = el día más reciente con una entrada que sea ≤ `dia`. Si no hay, el resultado es `null`.
  2. La ventana va de `A − 27` a `A`. Si tiene menos de 3 entradas, el resultado es `null`.
  3. Peso por la antigüedad respecto de `A`: 0–6 da 4, 7–13 da 3, 14–20 da 2 y 21–27 da 1.
  4. `base = round(100 · Σ peso·done ÷ Σ peso)`.
  5. El resultado es `max(0, base − 5 · floor((dia − A) / 7))`.
- **`ratingMesa`:**
  - `valor` = `ratingEn(hoy)`.
  - `etiqueta`: se compara con `ratingEn(hoy − 7)`. Si alguno es `null`, va `null`; si la diferencia es ≥ 5, «Sube»; si es ≤ −5, «Baja»; si no, «Igual».
  - `completadas` y `vencidas` cuentan las entradas de los últimos 28 días hasta hoy.

- [ ] **Step 1: Pruebas (fallan):**
  - `mesas: ejemplo de la spec`: el día X es el 2030-05-12. Hay 5 cosas el día X, todas hechas; 6 cosas el día X−7, con 4 hechas; 4 cosas el día X−14, con 3 hechas; y 5 cosas el día X−21, con 2 hechas. Todas con hora pasada. `ratingEn(X)` → 78.
  - `mesas: quieta 3 semanas resta 15`: los mismos datos, `ratingEn(X + 21)` → 63.
  - `mesas: nueva con menos de 3 es null`.
  - `mesas: etiqueta en +5 y −5`: datos que den +5 → «Sube», −5 → «Baja», +4 → «Igual».
  - `mesas: General no tiene rating`: `ratings` no incluye `"general"`.
  - `mesas: sin fecha completadas suman el día de sus puntos`.
  - `mesas: cuenta una vez` (RF2): una cosa con hora y fecha límite en días distintos es una sola entrada.
  - `mesas: areaSugerida`:

    | Nombre | Área |
    |---|---|
    | «Universidad» | estudio |
    | «Tesis de magíster» | estudio |
    | «GYM» | salud |
    | «Mi depto» | hogar |
    | «Cumpleaños» | social |
    | «Pega» | trabajo |
    | «Viajes» | personal |
    | «Clase de yoga» | estudio (gana la primera de la tabla) |

  - `mesas: areaDe usa la guardada`.
  - `mesas: cuenta vacía` (RF4): `ratings(emptyData)` → `[]`.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** `npm test` y `npm run typecheck`. Expected: PASS.
- [ ] **Step 5: Commit** `V2/E: rating por mesa y área sugerida`.

---

### Task 4: Logros (catálogo, desbloqueo y cola)

**Files:**
- Modify: `front/src/utils/model.ts` (`LOGRO_IDS`, `LogroId`, `LogroVisto`, `AppData.logros`, `emptyData`), `front/tests/progreso.cjs`, `front/tests/run.cjs`
- Create: `front/src/utils/progreso/logros.ts`

**Interfaces:**
- Consumes: `nivelDe`, `puntosParaNivel`, `cosasListas`, `desdeElDia1(d, now).dia1`, `historial` (Tasks 1 y 2).
- Produces:
  ```ts
  // model.ts
  export const LOGRO_IDS: readonly [/* los 24 de la spec §6.1, en ese orden */];
  export type LogroId = (typeof LOGRO_IDS)[number];
  export type LogroVisto = { id: LogroId; at: string };
  // AppData suma logros: LogroVisto[]; emptyData() lo trae vacío
  // progreso/logros.ts
  export type Familia = "constancia" | "volumen" | "primeras";
  export type Logro = { id: LogroId; familia: Familia; nombre: string; corto: string; icono: string; frase: string; pista?: string };
  export const CATALOGO: Logro[];
  export type Hechos = { record: number; semanaPerfecta: boolean; dia100: boolean; listas: number; puntos: number;
    nivel: number; mesas: number; rutinas: number; metas: number; audio: boolean; plan: boolean };
  export function hechosDe(d: AppData, now: number): Hechos;
  export function cumple(id: LogroId, h: Hechos): boolean;
  export function avance(id: LogroId, h: Hechos): { valor: number; texto: string };
  export function desbloqueados(d: AppData, h: Hechos): LogroId[]; // cumple o visto
  export function porVer(d: AppData, h: Hechos): LogroId[];         // cumple y no visto, en orden del catálogo
  export type Cola = { tipo: "uno"; id: LogroId } | { tipo: "resumen"; ids: LogroId[]; lanzamiento: boolean } | null;
  export function siguiente(d: AppData, h: Hechos): Cola;
  export function verLogros(d: AppData, ids: LogroId[], now: number): AppData; // sin duplicar
  export function paraPerfil(d: AppData, h: Hechos, now: number): { id: LogroId; logrado: boolean }[]; // 8
  ```
- **Textos del catálogo** (`nombre` / `frase`; `corto` solo donde cambia; `pista` solo en primeras veces):
  - **Rachas:** «Racha de N días» / «Cumpliste tu día N días seguidos.»
  - **Semana perfecta:** «Semana perfecta» / «Siete días seguidos con todo listo.»
  - **Cosas listas:** «N cosas listas» / «Ya completaste N cosas.»
  - **Niveles:** «Nivel N» / «Llegaste al nivel N.»
  - **Primeras veces:**

    | Nombre | `corto` | Frase | Pista |
    |---|---|---|---|
    | «Primera cosa completada» | «Primera cosa» | «Completaste tu primera cosa.» | «Completa cualquier cosa.» |
    | «Primera mesa» | — | «Creaste tu primera mesa.» | «Crea una mesa en el Espacio.» |
    | «Primera rutina» | — | «Creaste tu primera rutina.» | «Crea un grupo que se repita.» |
    | «Primera meta cumplida» | «Primera meta» | «Cumpliste tu primera meta.» | «Completa una meta.» |
    | «Primer día al 100%» | «Día al 100%» | «Completaste todo lo de un día.» | «Completa todo lo de un día.» |
    | «Primer audio a Neka» | «Primer audio» | «Le hablaste a Neka por primera vez.» | «Mantén el micrófono y háblale a Neka.» |
    | «Primer plan de Neka aceptado» | «Primer plan» | «Aceptaste tu primer plan de Neka.» | «Acepta un plan que te proponga Neka.» |

- **`hechosDe`:**
  - `record`: `rachas(historial(dia1, hoy))`.
  - `semanaPerfecta`: 7 días seguidos **con agenda** al 100%; los días con `tenias = 0` no cortan ni cuentan.
  - `dia100`: algún día con agenda al 100%.
  - `mesas`: mesas distintas de General.
  - `rutinas`: grupos con `repeat ≠ ""`.
  - `metas`: `Goal` completadas y no borradas.
  - `audio`: algún mensaje con `isUser && audio`.
  - `plan`: algún mensaje con `estado === "aceptado"`.
- **`avance`:**
  - rachas: `record/N`, texto «12/30»;
  - listas: «187/1.000»;
  - niveles: `puntos/puntosParaNivel(N)`, texto «70%»;
  - semana perfecta y primeras veces: 0, texto «Pendiente».
  - El valor se recorta a 1.
- **`siguiente`:**
  - con 0 por ver → `null`;
  - con 1 a 3 → `{tipo:"uno", id: el primero}`;
  - con 4 o más → `{tipo:"resumen", ids, lanzamiento: d.logros.length === 0}`.
- **`paraPerfil`:**
  - los 4 desbloqueados más recientes (`at`; un desbloqueado sin ver cuenta como `now`);
  - más los 4 bloqueados con mayor `avance.valor` (si empatan, va el orden del catálogo);
  - si falta de un lado, se completa con el otro hasta 8.

- [ ] **Step 1: Pruebas (fallan):**
  - `logros: catálogo de 24 con ids únicos`, igual a `LOGRO_IDS`.
  - `logros: umbrales`: récord 6 contra 7 para `racha-7`; 9 contra 10 cosas para `listas-10`; 999 contra 1000 puntos para `nivel-5`.
  - `logros: se queda aunque se borre lo que lo dio`: `primera-mesa` vista y la mesa borrada → sigue en `desbloqueados` y no está en `porVer`.
  - `logros: desmarcar no quita lo visto` (RF5): con 10 cosas listas y `listas-10` visto, se desmarca 1 → `listas-10` sigue desbloqueado y `totalPoints` no cambia.
  - `logros: semana perfecta con descanso al medio`: 3 días al 100%, 1 sin agenda y 4 al 100% → `true`. Con un día al 75% en medio → `false`.
  - `logros: cola`: con 2 por ver → «uno» con el primero; después de `verLogros` → el segundo. Con 4 por ver y `logros` vacío → resumen con `lanzamiento true`. Con algo ya visto → `lanzamiento false`.
  - `logros: avance y textos`: «12/30», «70%», «187/1.000», «Pendiente».
  - `logros: paraPerfil` da 4 recientes y 4 más cerca; con 1 desbloqueado da 1 + 7.
  - `logros: verLogros no duplica`.
  - `logros: cuenta vacía` (RF4): `desbloqueados(emptyData)` → `[]`.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** `npm test` y `npm run typecheck`. Expected: PASS. Las pruebas de sincronización que ya existen siguen pasando, porque `logros: []` va y vuelve igual. La validación de `logros` entra en la Task 5.
- [ ] **Step 5: Commit** `V2/E: catálogo y cola de logros`.

---

### Task 5: Área y logros vistos en los datos (validación, sincronización, reglas y formulario de mesa)

**Files:**
- Modify: `front/src/utils/storage.ts`, `front/src/utils/syncModel.ts`, `front/src/utils/estructura.ts`, `back/firestore.rules`, `front/src/components/ui/espacio/FormMesa.tsx`, `front/tests/sync.cjs`, `front/tests/rules.cjs`, `front/tests/firestore.cjs`

**Interfaces:**
- Consumes: `AREA_IDS`, `LOGRO_IDS`, `LogroVisto` (model); `AREAS`, `areaSugerida` (mesas).
- Produces: `crearMesa(d, name, color, id = uid(), area?: Area)`, que agrega `area` solo si viene.
- **`readBackup`:**
  - `logros` ausente → `[]`;
  - cada logro tiene exactamente `id` y `at`, con `id` en `LOGRO_IDS`, `at` string de hasta 40;
  - sin duplicados y con máximo 24;
  - si no, «Logros inválidos.»
  - Cada mesa tiene 3 claves, o 4 con `area` en `AREA_IDS`; si no, «Espacio inválido.»
- **`syncModel`:**
  - `COLLECTIONS` suma `"logros"`;
  - `recordsOf` escribe `logros/<id>` = `{id, at}`;
  - `dataOf` los junta;
  - `validateRecords` acota `at` a 40.
  - `cloudRecords` y `SyncEngine` ya toman `COLLECTIONS`, así que no cambian.
- **`firestore.rules`:**
  - `workspaces`: `fields(v,['id','name','color'])` **o** `fields(v,['id','name','color','area']) && v.area in ['estudio','trabajo','salud','hogar','social','personal']`, con `ident`, `str` y límites como hoy.
  - Línea nueva: `(kind=='logros' && fields(v,['id','at']) && v.id == id && v.id in [los 24 de LOGRO_IDS] && str(v.at,40))`.
- **`FormMesa`:**
  - Debajo de «Color» va el título «Área» y 6 `Chip` con `AREAS[i].nombre`.
  - Estado `area: Area | undefined`, que empieza en `inicial?.area`.
  - El chip marcado es `area ?? areaSugerida(nombre)`.
  - Tocar un chip fija `area`. Al guardar, `area` se escribe solo si está fijada.

- [ ] **Step 1: Pruebas (fallan):**
  - `datos: mesa con y sin área, ida y vuelta`, con `recordsOf`, `dataOf` y `readBackup`.
  - `datos: área inválida se rechaza` (`"deporte"`).
  - `datos: logros vistos, ida y vuelta y respaldo`.
  - `datos: logro desconocido, duplicado o más de 24 se rechaza`.
  - `datos: respaldo sin logros carga con []`.
  - `datos: crearMesa con área`.
  - En `tests/firestore.cjs`, 4 casos: mesa con área válida (ok), área inválida (falla), logro válido (ok) e id desconocido (falla). No se pueden correr porque falta Java 21; se dejan escritos.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implementar, incluidos `FormMesa` y las reglas.
- [ ] **Step 4:** `npm test`, `npm run typecheck`. Expected: PASS.
- [ ] **Step 5: Commit** `V2/E: área de mesa y logros vistos en datos, sincronización y reglas`.

---

### Task 6: Resumen (tus días, desde el día 1 y anillo tocable)

**Files:**
- Create: `front/src/utils/useProgreso.ts`, `front/src/components/ui/progreso/{Heatmap,TusDias,CurvaDesde}.tsx`
- Modify: `front/src/styles/theme.ts` (`heat`, `medallaApagada`), `front/src/pages/Resumen.tsx`

**Interfaces:**
- Produces:
  ```ts
  // useProgreso.ts — useMemo sobre [data, localDay(now)] con useNow()
  export function useProgreso(): { puntos: number; nivel: Nivel; semanas12: Dia[]; rachas: Rachas; puntosSemana: number;
    desde: Desde; mesas: RatingMesa[]; hechos: Hechos };
  // semanas12 = semanas12(d, now); rachas = rachas(historial(desde.dia1, hoy)); puntosSemana = puntosSemana(d, now)
  // Heatmap.tsx
  export default function Heatmap(p: { dias: Dia[]; hoy: string; elegido?: string; onElegir: (dia: string) => void }): JSX.Element;
  ```
- **`Heatmap`:**
  - Grilla de columnas = semanas y filas = lunes a domingo. Celdas de 15 con separación de 3 y `radius` 4. El color es `heat[tono]`.
  - Etiquetas «lun», «mié» y «vie» a la izquierda, y el mes corto donde empieza cada mes.
  - Hoy va con borde `color.ink` de 2.
  - Cada celda es tocable (`hitSlop` hasta 44) y tiene como `accessibilityLabel` su `textoDia`. El grupo se llama «Tus días, últimas 12 semanas».
- **`TusDias`:**
  - `SectionTitle` «Tus días» con «+N pts esta semana».
  - Una `Card` con una fila de dos estadísticas, separadas por una línea `color.line`: llama «N días» «Racha» y trofeo «N días» «Récord».
  - Después el `Heatmap` y una línea con el `textoDia` del día elegido (por defecto, hoy), con la leyenda «0%» ■■■■■ «100%» a la derecha.
- **`CurvaDesde`:**
  - `SectionTitle` «Desde el día 1» y una `Card` con el texto de la spec §7.2.
  - Sin Neka (ya está arriba en el Resumen). Si `desde.dias ≥ 14`, va un SVG (`react-native-svg`) de 252×112: área `color.primarySoft`, línea `color.primary` de 2,5, un punto en cada subida, etiqueta «Nivel N» solo en la primera y la última, y meses abajo.
  - El `accessibilityLabel` es el de los Textos fijos.
- **`Resumen`:**
  - Se borra la tarjeta «Progreso» (y su `weekPoints`, que pasa a `puntosSemana`).
  - Debajo de «Hoy» van `TusDias` y `CurvaDesde`.
  - El `LevelRing` va envuelto en un `PressableScale` con el label «Nivel N. Ver tu perfil», que navega a `"Perfil"`.

- [ ] **Step 1:** Implementar. Tema primero, después los componentes y por último Resumen.
- [ ] **Step 2:** `npm test` (incluye `styles.cjs`), `npm run typecheck` y `npm --prefix front run build:web`. Expected: PASS.
- [ ] **Step 3: Verificar en el navegador** (`nekal-web`, 375×812; el usuario inicia sesión con PruebaClaude):
  - el Resumen se ve como la maqueta 03;
  - tocar un día cambia la línea;
  - la racha coincide con los tonos;
  - el anillo lleva al Perfil y se ve igual que antes.

  Hacer una captura.
- [ ] **Step 4: Commit** `V2/E: tus días y desde el día 1 en el Resumen`.

---

### Task 7: Perfil (lo que muestras) y Cuenta en Ajustes

**Files:**
- Create: `front/src/components/ui/progreso/{Anillo,TarjetaNivel,Medalla,GrillaLogros,HojaLogros,FilaMesa}.tsx`
- Modify: `front/src/pages/Perfil.tsx`, `front/src/pages/Ajustes.tsx`, `front/src/components/ui/base/ProgressBar.tsx`

**Interfaces:**
- Produces:
  ```ts
  export default function Anillo(p: { size: number; grosor: number; avance: number; color: string; riel: string; children?: ReactNode }): JSX.Element;
  export default function Medalla(p: { id: LogroId; logrado: boolean; avance?: { valor: number; texto: string }; size?: 56 | 120 }): JSX.Element;
  // ProgressBar suma riel?: "suave" | "blanco" (por defecto "suave" = color.primarySoft; "blanco" = color.surface)
  ```
- **`Medalla`:**
  - Lograda: círculo `color.primary` con el ícono del catálogo en `color.onPrimary` y un anillo interior `primarySoft`.
  - Bloqueada: `color.medallaApagada` con el ícono en `color.lineStrong`, un `Anillo` de avance y un candado de 20 abajo a la derecha.
- **`Perfil`**, en el orden de la spec §7.1:
  1. `ScreenHeader` con el engranaje.
  2. La identidad: avatar, nombre, roles y «En Nekal desde agosto de 2026» (mes y año de `desde.dia1`). El lápiz abre la hoja de editar perfil que ya existe.
  3. `TarjetaNivel`: tarjeta lavanda (`Card variant="featured"`) con «Nivel N», los puntos, `ProgressBar riel="blanco"` y «N pts para el nivel M».
  4. «Logros» con «N de 24», que es `GrillaLogros` (4 columnas). Debajo, «Ver los 24 logros», que abre `HojaLogros`: una `Sheet` con las 3 familias, cada logro con su `Medalla`, nombre y frase, o la pista si está bloqueado.
  5. «Tus mesas» con `FilaMesa`:
     - `Anillo` de 44 en el color de la mesa, con el ícono de `areaDe`;
     - nombre, área, valor o «Aún sin datos»;
     - `Tag` según la etiqueta: «Sube» primary, «Baja» danger, «Igual» neutral;
     - `chevron-down-outline`. Al tocar se abre, con animación `FadeIn`, con `Heatmap` de `semanas12(d, now, mesaId)` y «N completadas · M vencidas en 4 semanas».
- **Cuenta:** el bloque «Cuenta» de `Perfil.tsx` se mueve a la primera sección de `Ajustes.tsx`, con su estado y sus hojas: inicio de sesión, conflictos y errores. Va sin cambios de texto ni de comportamiento.

- [ ] **Step 1:** Implementar.
- [ ] **Step 2:** `npm test`, `npm run typecheck`, `build:web`. Expected: PASS.
- [ ] **Step 3: Verificar en el navegador:**
  - el Perfil se ve como la maqueta 03;
  - «Ver los 24 logros» abre la hoja;
  - una mesa se abre con su heatmap;
  - en `FormMesa`, cambiar el área se refleja en la fila;
  - Ajustes muestra Cuenta arriba y cerrar sesión funciona (probarlo al final, para no tener que volver a entrar).

  Hacer una captura.
- [ ] **Step 4: Commit** `V2/E: Perfil con nivel, logros y mesas; Cuenta en Ajustes`.

---

### Task 8: Modal de logro

**Files:**
- Create: `front/src/utils/hojasAbiertas.ts`, `front/src/components/ui/progreso/LogroNuevo.tsx`
- Modify: `front/src/components/ui/base/Sheet.tsx`, `front/src/components/ui/base/nekaImages.ts`, `front/src/utils/neka.ts` (`NekaPose` suma 5), `front/src/navigation/TabNavigator.tsx`

**Interfaces:**
- Produces:
  ```ts
  // hojasAbiertas.ts
  export function abrirHoja(): () => void;    // devuelve la función para cerrarla
  export function useHojasAbiertas(): number; // useSyncExternalStore
  // LogroNuevo.tsx
  export default function LogroNuevo(p: { onVerLogros: () => void }): JSX.Element | null;
  ```
- **`Sheet`** llama `abrirHoja()` mientras `visible` y cierra en la limpieza del efecto.
- **`LogroNuevo`:**
  - **Cuándo se muestra:** usa `siguiente(data, hechos)` cuando `useHojasAbiertas() === 0 && !neka.grabando && !neka.hoja`.
  - **Contenedor:** `Modal` nativo `transparent` con `animationType="none"` y fondo `color.backdrop`. Tocar el fondo cierra.
  - **Tarjeta:**
    - `radius.lg`, blanca, a 20 de los lados y centrada.
    - Neka pose 5 de 104, arriba a la izquierda, que sobresale 62.
    - La `Medalla` de 120, «Logro nuevo», el `nombre` en `title` y la `frase` en `callout`.
    - `Button` «Genial» y `Button` plain «Ver mis logros».
  - **Resumen:** en vez de la medalla única van hasta 9 medallas en una grilla de 3, «y N más», y el título y la línea de los Textos fijos.
  - **Animación** (Reanimated):
    1. Entrada con `withSpring(motion.gentle)`: escala de 0,92 a 1 y opacidad.
    2. El anillo se completa en 450 ms con `useAnimatedProps` sobre un `Circle` animado.
    3. Giro `rotateY` de 0 a 180 con `perspective` y `backfaceVisibility: "hidden"`, `withSpring(motion.snappy)`. Al girar suena `haptic.success()`.
    4. Un brillo (escala y opacidad) y el salto de Neka (`translateY` de 18 a 0).
    5. Aparecen los textos.
    - Con movimiento reducido: solo `FadeIn`, y la medalla ya lograda.
  - **Accesibilidad:** `accessibilityViewIsModal` y `AccessibilityInfo.announceForAccessibility("Logro nuevo: …")` al mostrarse.
  - **Al cerrar** de cualquier forma: `change(d => verLogros(d, ids, Date.now()))`. «Ver mis logros» además llama `onVerLogros`.
- **`TabNavigator`** monta `<LogroNuevo onVerLogros={() => navigation.navigate("Perfil")} />` junto a `HojaPlan`.

- [ ] **Step 1:** Implementar.
- [ ] **Step 2:** `npm test`, `npm run typecheck`, `build:web`. Expected: PASS.
- [ ] **Step 3: Verificar en el navegador:**
  - al entrar con PruebaClaude sale **una** tarjeta resumen «Ya tenías N logros» con la línea de los niveles;
  - al cerrarla y recargar, no vuelve;
  - con una cuenta invitada nueva, crear una mesa muestra «Primera mesa» con su animación (captura a mitad y al final);
  - **RF3:** con el editor de una cosa abierto, completarla desde ahí no muestra el modal hasta cerrar el editor.
- [ ] **Step 4: Commit** `V2/E: modal de logro con animación y tarjeta resumen`.

---

### Task 9: Reglas, cierre y puntos de control

**Files:** `back/firestore.rules` (solo si la revisión pide cambios), `CLAUDE.md`, `DOCUMENTOS/V2/ROADMAP.md`, `DOCUMENTOS/V2/E_REGISTRO_IMPLEMENTACION.md`

- [ ] **Step 1: Revisión de reglas.** Pasar `/security-review` y la skill `firebase-security-rules-auditor` sobre el cambio de `back/firestore.rules`. Arreglar lo que salga, con prueba si toca código.
- [ ] **Step 2: PUNTO DE CONTROL — publicar reglas.** Pedir permiso explícito al usuario. Con el sí: `npm run deploy:rules`. Expected: «Deploy complete!». Recién ahí probar con PruebaClaude que:
  - cambiar el área de una mesa se sincroniza;
  - los logros vistos se guardan (sin «permiso denegado»).
- [ ] **Step 3: Verificación completa.** `npm test`, `npm run typecheck` y `npm --prefix front run build:web`, todos en verde, con la salida leída. Recorrido en el navegador de los criterios de éxito de la spec §13.
- [ ] **Step 4: Documentación.**
  - `CLAUDE.md`: una línea «Gamificación (V2/E)» con `utils/progreso/` (puro y con pruebas), `useProgreso` y `components/ui/progreso/`, en el estilo de la de D.
  - ROADMAP: fila E.
  - `E_REGISTRO_IMPLEMENTACION.md`: copia del registro con cada `Ruling` y los pendientes menores.
- [ ] **Step 5: Revisión final** de toda la rama, según executing-plans. Es una autorrevisión, por preferencia del usuario. Arreglar los hallazgos críticos e importantes con su prueba, y dejar los menores anotados.
- [ ] **Step 6: PUNTO DE CONTROL — iPhone.** El usuario prueba en Expo Go:
  1. Resumen;
  2. Perfil;
  3. tarjeta de lanzamiento;
  4. completar algo a tiempo (ver el estimado del editor);
  5. un logro nuevo con su animación y vibración;
  6. el área en el formulario de mesa;
  7. «reducir movimiento» encendido.

  Se arregla lo que reporte.
- [ ] **Step 7:** Commit `V2/E: registro, CLAUDE.md y ROADMAP`. Después, `superpowers:finishing-a-development-branch` (mezclar en `main` solo si el usuario lo elige).
