# H2 · Vistas: círculo, agenda, Plano y atrasadas — plan de implementación

> **Para quien ejecute:** `superpowers:executing-plans` (ejecución nativa, tarea por tarea, sin subagentes; como en D, E, F y H1). Pasos con casillas `- [ ]`. Ledger en `.superpowers/sdd/H2_PLAN_IMPLEMENTACION/progress.md`; cada decisión fuera del plan = `Ruling`.

**Meta:** que el Espacio y el Calendario se lean bien con ~130 cosas: Espacio solo con el círculo, Calendario con Mes · Agenda · Plano, lo atrasado fuera de la vista (pero a un toque) y Neka preguntando por lo importante que se pasó. Nada se borra solo.

**Arquitectura:** una regla pura (`estaAtrasada`, en `utils/espacio.ts`) que usan el círculo, los choques, las ocurrencias de rutinas, el contexto de Neka y la pregunta del Resumen. Dos módulos puros nuevos (`agenda.ts`, `atrasadas.ts`) y uno de preferencias (`prefsEspacio.ts`). La interfaz se arma después, ya probada la lógica. No se toca el modelo de datos ni las reglas de Firestore.

**Tecnología:** TypeScript, runner propio de Node (`npm test`), React Navigation (parámetros de pestaña). Sin dependencias nuevas.

**Spec:** [H2_VISTAS.md](H2_VISTAS.md). Maquetas aprobadas: [H/02](H_MAQUETA/02-vistas-circulo-agenda.html) y [H/03](H_MAQUETA/03-espacio-calendario-neka.html).

## Restricciones globales

- Rama `v2/h2-vistas`; commits `V2/H2: …` con `Co-Authored-By`. Revisar `git diff` antes de cada commit: el formateador reescribe líneas ajenas (si pasa, aplicar el cambio con un script).
- TDD en `utils`: la prueba falla antes del código. Pruebas nuevas en `front/tests/vistas.cjs`, registradas en `run.cjs` (`require` y, en la lista de `tsc`, `utils/agenda.ts`, `utils/atrasadas.ts`, `utils/prefsEspacio.ts`).
- UI solo con `styles/theme.ts` y `components/ui/base/`; texto con `Txt`; íconos Ionicons de línea; `tests/styles.cjs` lo verifica. Copiar las maquetas, no inventar.
- Antes de cerrar: `npm test`, `npm run typecheck`, `npm --prefix front run build:web`, recorrido en el navegador (invitado, 8082, `nekalDemo()`), y tu prueba en el iPhone.
- **No se publica** (`deploy:web`) sin que lo pidas. El hosting guarda en caché 1 hora: abrir con `?v=…`.
- «Atrasada» = pendiente, con fecha (`scheduledAt`, si no `dueAt`), de **hace más de 2 días de calendario**; lo sin fecha no vence; Nota e Idea no cuentan.

## Revisión de casos que la spec no nombra

| # | Caso | Qué debe pasar | Prueba en |
|---|---|---|---|
| 1 | Fecha futura pero `startDate` viejo | No es atrasada | Task 1 |
| 2 | Nota o Idea con fecha vieja | No es atrasada ni se cuenta | Task 1 |
| 3 | Hoja con 300 atrasadas | «A la papelera» actúa de a 200 y avisa; las que otras cosas necesitan se omiten, no fallan | Task 8 |
| 4 | Cuenta sin atrasadas ni importantes | Sin píldora, sin pregunta, Agenda sin días vacíos | Tasks 4, 8, 9 |
| 5 | Pasa la medianoche con la app abierta | Se recalcula con `now`; lo ya preguntado se compara por día | Task 9 |
| 6 | Preferencia guardada con `"mesas"` o `"plano"` | Se lee como círculo | Task 6 |

---

## Archivos

| Archivo | Cambio |
|---|---|
| `utils/espacio.ts` | + `ATRASO_DIAS`, `estaAtrasada`, `atrasadas`, `esImportante` |
| `utils/acomodo/tiempo.ts` | no dibuja atrasadas; + `agruparNodos` |
| `utils/planner.ts` | `findConflicts` ignora atrasadas |
| `utils/rutinas.ts` | `ocurrencias`: lo más viejo que `ATRASO_DIAS` pasa a «anteriores» |
| `utils/neka.ts`, `utils/agente/contexto.ts` | sin atrasadas; pregunta por lo importante; línea de importantes |
| `utils/agenda.ts` (nuevo) | `agenda()` |
| `utils/atrasadas.ts` (nuevo) | `siguientePregunta`, `aHoy`, `aPapelera` |
| `utils/prefsEspacio.ts` (nuevo) | `leerPrefs` |
| `utils/demo.ts` | + atrasadas e importantes de ejemplo |
| `components/ui/base/Segmentos.tsx` (nuevo), `NekaCard.tsx` | control de segmentos; hasta 3 botones |
| `components/ui/espacio/PlanoVista.tsx`, `HojaAtrasadas.tsx`, `HojaCosas.tsx` (nuevos), `TiempoVista.tsx`, `useEspacioPrefs.ts`, `index.ts`; `VistaSelector.tsx` (se elimina) | UI |
| `pages/Calendario.tsx`, `pages/EspacioTrabajo.tsx`, `pages/Resumen.tsx`, `navigation/TabNavigator.tsx` | UI y parámetros de navegación |
| `tests/vistas.cjs` (nuevo), `run.cjs`, `demo.cjs` | pruebas |

---

### Task 1: la regla de «atrasada»

**Archivos:** modificar `utils/espacio.ts`; crear `tests/vistas.cjs` (ayudantes `ti`, `cosa`, `con` copiados de `estabilidad.cjs`, con `now` = lun 2 nov 2026 10:10) y registrarlo en `run.cjs`.

**Interfaces — produce:**
```ts
export const ATRASO_DIAS = 2;
export function estaAtrasada(i: Item, now: number): boolean;
export function atrasadas(d: AppData, now: number): Item[];   // más recientes primero
export function esImportante(i: Item): boolean;               // urgente | dueAt | tipo Deadline
```
`estaAtrasada` = no borrada, no completada, no pasiva, con `fechaDe(i)` y `diasHasta(fechaDe(i), now) < -ATRASO_DIAS`.

- [ ] **Paso 1: pruebas que fallan.** `estaAtrasada`: hace 2 días → `false`, hace 3 → `true`; sin fecha → `false`; completada → `false`; Nota con fecha vieja → `false`; fecha futura con `startDate` de septiembre → `false`; usa `scheduledAt` antes que `dueAt`; solo `dueAt` vieja → `true`. `atrasadas`: devuelve solo atrasadas, la más reciente primero, sin las de rutinas (modelos). `esImportante`: urgente → sí; con `dueAt` → sí; tipo Deadline → sí; media sin fecha límite → no.
- [ ] **Paso 2: verlas fallar** (`npm test`: «estaAtrasada is not a function»).
- [ ] **Paso 3: implementar** en `espacio.ts` (usa `diasHasta`, `fechaDe`, `timedItems`, `passive`).
- [ ] **Paso 4: `npm test`** en verde. **Paso 5: commit** `V2/H2: regla de atrasadas`.

---

### Task 2: aplicar la regla (círculo, choques, rutinas, Neka)

**Archivos:** `utils/acomodo/tiempo.ts`, `utils/planner.ts`, `utils/rutinas.ts`, `utils/neka.ts`, `utils/agente/contexto.ts`; pruebas en `vistas.cjs`.

**Consume:** `estaAtrasada`, `esImportante`, `atrasadas`. **Produce:** el mismo comportamiento de siempre, sin lo atrasado.

- [ ] **Paso 1: pruebas que fallan:**
  - `acomodoTiempo: no dibuja atrasadas` — 3 cosas de hoy y 5 atrasadas (hace 3–30 días): solo 3 nodos; una de hace 1 día sí sale en «hoy».
  - `findConflicts: ignora lo atrasado` — «plazo vencido» hace 5 días → sin conflicto; hace 1 día → con conflicto.
  - `ocurrencias: lo más viejo que 2 días pasa a anteriores aunque tenga pendientes` — ocurrencia de hace 5 días con una cosa pendiente → en `anteriores`; de hace 1 día pendiente → en `actuales`; `sinAnteriores` oculta la primera y conserva la segunda.
  - `nekaState: lo atrasado no cuenta como vencido` — 10 cosas con plazo hace 20 días y ninguna reciente → `kind` ≠ `"vencido"`; con una de ayer → `"vencido"`.
  - `contexto: sin atrasadas` — la lista de «Cosas» no las incluye; con 2 importantes atrasadas agrega una línea `Atrasadas importantes: 2.` y sin ellas no hay línea.
- [ ] **Paso 2: verlas fallar.**
- [ ] **Paso 3: implementar.** `acomodoTiempo`: saltar con `estaAtrasada`. `findConflicts`: agregar `&& !estaAtrasada(i, now)` al filtro de `items`. `ocurrencias`: `anteriores` = (día < hoy y todo completado) **o** día < `hoy − ATRASO_DIAS` (aritmética con `new Date(y, m, d − 2)`). `nekaState`: `overdue` sin atrasadas. `contexto`: filtrar y sumar la línea.
- [ ] **Paso 4: `npm test`** (las 296 anteriores siguen verdes; si una prueba vieja suponía lo contrario, se ajusta con `Ruling`). **Paso 5: commit** `V2/H2: la regla de atrasadas en círculo, choques, rutinas y Neka`.

---

### Task 3: burbujas «+N» (lógica)

**Archivos:** `utils/acomodo/tiempo.ts`; pruebas en `vistas.cjs`.

**Interfaces — produce:**
```ts
export type Burbuja = { workspaceId: string; anillo: NodoTiempo["anillo"]; x: number; y: number; ids: string[] };
export function agruparNodos(nodos: NodoTiempo[], max?: number): { puntos: NodoTiempo[]; burbujas: Burbuja[] };
```
Por cada sector y anillo con más de `max` (6) nodos: quedan los 3 primeros como puntos y el resto en una burbuja en su centroide.

- [ ] **Paso 1: pruebas que fallan:** 6 nodos → sin burbuja; 7 → 3 puntos y una burbuja con 4 `ids`; `puntos.length + Σ ids = nodos.length` (no se pierde ninguno); el centroide es el promedio; grupos de otro sector no se mezclan.
- [ ] **Pasos 2–5:** fallar, implementar, `npm test`, commit `V2/H2: agruparNodos`.

---

### Task 4: la agenda (lógica)

**Archivos:** crear `utils/agenda.ts`; `run.cjs` (lista de `tsc`); pruebas en `vistas.cjs`.

**Interfaces — produce:**
```ts
export type FilaAgenda = { item: Item; inicio: string; fin: string; minutos: number; choca: boolean; hecha: boolean };
export type DiaAgenda = { dia: string; filas: FilaAgenda[] };
export function agenda(d: AppData, now: number, dias?: number, mesa?: string): DiaAgenda[];
```
Cosas con hora (`scheduledAt`, si no `dueAt`) de hoy a `hoy + dias` (14 por defecto), no pasivas, no atrasadas, de la mesa `mesa` si se da. Solo salen días con cosas. Hoy incluye las hechas (`hecha: true`); los demás días no. `choca` = la cosa está en un choque `overlap` de `findConflicts`.

- [ ] **Paso 1: pruebas que fallan:** orden por hora; días sin cosas no aparecen; `fin = inicio + minutos`; dos cosas superpuestas → ambas `choca`; una atrasada no sale; filtro por mesa; sin cosas → `[]`; lo sin hora no sale.
- [ ] **Pasos 2–5:** fallar, implementar, `npm test`, commit `V2/H2: agenda`.

---

### Task 5: Calendario con Mes · Agenda (interfaz)

**Archivos:** crear `components/ui/base/Segmentos.tsx` (exportar en `base/index.ts`); modificar `pages/Calendario.tsx`, `navigation/TabNavigator.tsx`.

**Interfaces:** `Segmentos({ opciones: [string, string][]; valor: string; onCambio(v: string): void })` (cápsula violeta suave, activo blanco con sombra, como `VistaSelector` pero con texto). `TabParamList.Calendario`: `{ modo?: "mes" | "agenda" | "plano"; destino?: Destino } | undefined`.

- [ ] **Paso 1:** abrir la maqueta H/02 cuadro D y H/03 cuadro F; el código copia su estructura (encabezado, segmentos, chips de mesa, filas con hora–hora, minutos y mesa, «Choca», «Arreglar con Neka»).
- [ ] **Paso 2: implementar** los segmentos y la Agenda con `agenda()`. El modo se guarda en `AsyncStorage` (`nekal:calendario`) y por defecto es Mes (como hoy). «Arreglar con Neka» llama a `neka.enviar("Arregla los choques de hoy", "rapido")`. «Ver más» amplía 14 días más. El modo Plano queda por ahora como un aviso «Pronto» (se construye en la Task 6).
- [ ] **Paso 3: `npm test`, `typecheck`** (incluye `styles.cjs`). **Paso 4: verificar en el navegador** (invitado + `nekalDemo()`): Mes sigue igual; Agenda muestra días, choques y filtros. **Paso 5: commit** `V2/H2: Calendario con Agenda`.

---

### Task 6: el Plano pasa al Calendario

**Archivos:** crear `components/ui/espacio/PlanoVista.tsx`; modificar `pages/Calendario.tsx`, `pages/EspacioTrabajo.tsx` (solo para extraer), `espacio/index.ts`.

**Interfaces:** `PlanoVista({ destino?: Destino | null })` contiene lo que hoy es la rama de Plano de `EspacioTrabajo`: ‹ volver, «Editar», `PlanoCerca`/`PlanoLejos`, crear (+), `BarraSeleccion`, `HojaCosa`, `MenuCrear`, `FormMesa`, `FormGrupo` y el aviso. Calendario lo muestra en el modo `"plano"` y lee `route.params`.

- [ ] **Paso 1:** extraer el estado y el render del Plano de `EspacioTrabajo` a `PlanoVista` sin cambiar su comportamiento; `EspacioTrabajo` sigue funcionando (todavía con su selector) usando el mismo componente para su modo Plano.
- [ ] **Paso 2:** en Calendario, el segmento «Plano» muestra `PlanoVista`; con `route.params.destino`, abre ese lugar. «Ver dónde está» (`HojaCosa`) y el aviso del borde (`TiempoVista.onEntrar`) navegan con `navigation.navigate("Calendario", { modo: "plano", destino })`.
- [ ] **Paso 3: `npm test`, `typecheck`.** **Paso 4: navegador:** entrar a un grupo, ordenar, «Ver dónde está» desde el círculo. **Paso 5: commit** `V2/H2: el Plano en el Calendario`.

---

### Task 7: Espacio solo con el círculo

**Archivos:** crear `utils/prefsEspacio.ts`; modificar `useEspacioPrefs.ts`, `pages/EspacioTrabajo.tsx`, `TiempoVista.tsx`; crear `components/ui/espacio/HojaCosas.tsx`; eliminar `VistaSelector.tsx`.

**Interfaces — produce:** `leerPrefs(raw: string | null): { ventana: Ventana }` (ignora cualquier `vista` guardada; ventana inválida → `"semana"`). `useEspacioPrefs()` devuelve `{ ventana, listo, setVentana }`. `HojaCosas({ titulo, items, onAbrir, onCerrar })` lista cosas para abrir.

- [ ] **Paso 1: pruebas que fallan** (`vistas.cjs`): `leerPrefs('{"vista":"mesas","ventana":"2semanas"}')` → `{ ventana: "2semanas" }`; `null` → `"semana"`; JSON roto → `"semana"`; ventana desconocida → `"semana"`.
- [ ] **Paso 2: verlas fallar. Paso 3: implementar** `leerPrefs` y el hook.
- [ ] **Paso 4: interfaz** (maqueta H/03 cuadro E): `EspacioTrabajo` muestra título «Espacio», selector de tiempo y `TiempoVista` + crear + selección + hoja + formularios; sin selector de vistas, sin «Editar», sin Plano. `TiempoVista`: dibuja `agruparNodos` (burbuja «+N» abre `HojaCosas`); un toque en un punto lo **marca** y muestra su nombre y hora (con sus flechas de dependencias); un segundo toque lo abre. Quitar `VistaSelector` de `index.ts`.
- [ ] **Paso 5: `npm test`, `typecheck`; navegador** (126 cosas del demo: legible, burbujas, nombre al tocar). **Paso 6: commit** `V2/H2: Espacio solo con el círculo`.

---

### Task 8: hoja «Atrasadas»

**Archivos:** crear `utils/atrasadas.ts` y `components/ui/espacio/HojaAtrasadas.tsx`; modificar `pages/EspacioTrabajo.tsx` (píldora), `pages/Calendario.tsx` (fila en Agenda); pruebas en `vistas.cjs`.

**Interfaces — produce:**
```ts
export const MAX_PAPELERA = 200;
export function aHoy(d: AppData, id: string, now: number): AppData;          // lanza Error("Hoy no cabe.")
export function aPapelera(d: AppData, ids: string[]): { data: AppData; omitidas: number };
```
`aHoy`: primer hueco libre **de hoy** desde ahora (`buscarHueco` con `hasta` = fin de la jornada, respetando fijos) y lo guarda como `scheduledAt`. `aPapelera`: `deleteItem` de hasta `MAX_PAPELERA` ids; las que no se pueden (otras cosas dependen de ellas) quedan en `omitidas`.

- [ ] **Paso 1: pruebas que fallan:** `aHoy` con hueco → `scheduledAt` hoy ≥ ahora y `estaAtrasada` pasa a `false`; sin hueco hoy → lanza «Hoy no cabe.» y no cambia nada; `aPapelera` con 3 ids → 3 `deletedAt`; con 250 → solo 200; una con dependiente → `omitidas: 1` sin lanzar.
- [ ] **Paso 2: verlas fallar. Paso 3: implementar** las dos funciones.
- [ ] **Paso 4: interfaz** (H/02 cuadro C y H/03 cuadro H): `HojaAtrasadas` con *Importantes* arriba (etiqueta «Con entrega» si tiene `dueAt` o es Deadline, «Urgente» si lo es), luego *Las demás*; cada fila abre la cosa (`ItemEditor`), «A hoy» (muestra «Hoy no cabe» si no) y completar (`useToggleDone`); abajo «Mandar las N a la papelera» con confirmación. Píldora «N atrasadas ›» en el Espacio y fila «N atrasadas hace más de 2 días ›» arriba de la Agenda; ambas abren la hoja y se ocultan si N = 0.
- [ ] **Paso 5: `npm test`, `typecheck`; navegador. Paso 6: commit** `V2/H2: hoja Atrasadas`.

---

### Task 9: Neka pregunta por lo importante

**Archivos:** `utils/atrasadas.ts`, `utils/neka.ts`, crear `utils/usePreguntadas.ts`; modificar `components/ui/base/NekaCard.tsx`, `pages/Resumen.tsx`; pruebas en `vistas.cjs`.

**Interfaces — produce:**
```ts
export function siguientePregunta(d: AppData, now: number, preguntadas: Record<string, string>): Item | null;
// NekaState gana acciones?: NekaAction[]; NekaAction.target suma "reprogramar" | "hecha" | "soltar" | "atrasadas"
export function nekaState(data: AppData, now?: number, preguntadas?: Record<string, string>): NekaState;
```
`siguientePregunta`: una atrasada **importante**, no preguntada hoy (`preguntadas[id] !== día`), la más importante primero (urgente, luego con entrega o Deadline) y, dentro de eso, la más reciente; `null` si no hay. `nekaState` devuelve `kind: "pregunta"` (por encima de «vencido», por debajo de «conflicto») con `message` = `«<título>» era importante y se pasó hace N días. ¿Qué hago con ella?` y tres `acciones` (Reprogramar · Ya la hice · Soltarla).

- [ ] **Paso 1: pruebas que fallan:** una importante atrasada → la devuelve; urgente antes que con entrega; entre iguales, la más reciente; `preguntadas[id] === hoy` → la siguiente; ninguna importante → `null`; una no importante atrasada → `null`; `nekaState` con pregunta → `kind "pregunta"`, 3 acciones y el mensaje con «hace N días»; sin preguntas el estado es el de siempre.
- [ ] **Paso 2: verlas fallar. Paso 3: implementar.**
- [ ] **Paso 4: interfaz** (H/03 cuadro G): `NekaCard` pinta `acciones` (hasta 3 botones pequeños) y un pie «Tienes N más. **Ver la lista**» (abre `HojaAtrasadas`). `usePreguntadas` lee/escribe `nekal:atrasadas:preguntadas` (`{ id: día }`); el Resumen marca la cosa al mostrarla (y la conserva en pantalla durante esa sesión). **Reprogramar**: `neka.enviar("Reprograma «título» en el primer hueco libre", "rapido")` (plan que tú aceptas, de H1). **Ya la hice**: `useToggleDone`. **Soltarla**: `aPapelera` de esa cosa, con aviso.
- [ ] **Paso 5: `npm test`, `typecheck`; navegador. Paso 6: commit** `V2/H2: Neka pregunta por lo importante que se pasó`.

---

### Task 10: demo, verificación y cierre

**Archivos:** `utils/demo.ts`, `tests/demo.cjs`; documentación.

- [ ] **Paso 1: pruebas que fallan** (`demo.cjs`): `sembrarDemo` agrega ≥ 30 cosas atrasadas (hace 3–40 días), al menos 2 importantes (una urgente, otra con `dueAt`) y sigue siendo idempotente y de ≤ 400 documentos.
- [ ] **Paso 2: implementar** en `demo.ts`. **Paso 3:** `npm test`, `typecheck`, `build:web`; comprobar que `dist` no contiene la clave de AI Studio.
- [ ] **Paso 4: recorrido en el navegador** (invitado + `nekalDemo()`): Espacio legible con «N atrasadas», hoja, agenda con choques, Plano con la regla aplicada, pregunta de Neka y sus tres respuestas.
- [ ] **Paso 5: documentación:** `H2_REGISTRO_IMPLEMENTACION.md` (copia del ledger), línea en `CLAUDE.md` (Mesas retirada del acceso, regla de atrasadas, Plano en el Calendario) y fila en el `ROADMAP`.
- [ ] **Paso 6: tu prueba en el iPhone** y decisión sobre el Plano (§2.6 de la spec). **Paso 7:** mezclar en `main` con `--no-ff` y borrar la rama, **solo con tu visto bueno**.

---

## Revisión del plan frente a la spec

- Cobertura: §2.1 → Task 7; §2.2 → Tasks 5–6; §2.3 → Tasks 1–2; §2.4 → Task 8; §2.5 → Tasks 8–9; §2.6 → Task 10; §3 → Tasks 1–2; §4 → Tasks 3, 5–9; §5 → Task 7; §6 → todas.
- Consistencia: `estaAtrasada`/`esImportante`/`atrasadas` (Task 1) los usan 2, 4, 8 y 9; `agruparNodos` (3) lo usa la interfaz de 7; `agenda` (4), la de 5; `aHoy`/`aPapelera` (8), las hojas de 8 y 9; `leerPrefs` (7), el hook de 7.
- Lo que conviene revisar: **la pregunta de Neka se muestra una vez al día por cosa** (se marca al mostrarla), y en la misma sesión se queda en pantalla. Si prefieres un botón «Más tarde», se agrega en la Task 9.
