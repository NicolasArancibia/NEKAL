# Subproyecto A · Sistema de diseño — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar a toda la app el sistema de diseño B v3: tokens únicos, fuente Plus Jakarta Sans, componentes base, barra inferior solo con íconos, paneles deslizables, Neka según contexto y textos reescritos.

**Architecture:** Un archivo de tokens (`front/src/styles/theme.ts`) y una carpeta de componentes base (`front/src/components/ui/base/`). La lógica nueva y testeable va en funciones puras (`utils/neka.ts`, `utils/syncBanner.ts`). `Common.tsx` actúa como adaptador hacia los componentes base durante la migración y se elimina al final. Las pantallas se migran de a una; la app queda funcionando después de cada tarea.

**Tech Stack:** Expo 57.0.24, React Native 0.86.3, React 19.2.3, TypeScript 6, React Navigation 7, Reanimated 4.5.1 + react-native-worklets 0.10.4, Gesture Handler 2.32.0, react-native-svg 15.15.4, @expo/vector-icons 15 (Ionicons). Pruebas con `node:test` mediante `front/tests/run.cjs`.

**Spec:** [A_SISTEMA_DE_DISENO.md](A_SISTEMA_DE_DISENO.md) · Maqueta: [A_MAQUETA/resumen-b-v3.html](A_MAQUETA/resumen-b-v3.html)

## Global Constraints

- Antes de escribir código que use una API de Expo, consultar la doc de Expo v57 (MCP `context7`, ver `front/AGENTS.md`).
- Dependencias nuevas permitidas: `expo-font`, `@expo-google-fonts/plus-jakarta-sans` y `expo-haptics`, instaladas desde `front/` con `npx expo install`. Ninguna otra.
- Reanimated 4: para volver al hilo JS desde un worklet usar `scheduleOnRN` de `react-native-worklets` (no `runOnJS`). Gestos con la API `Gesture.Pan()` + `GestureDetector`.
- En la interfaz (`front/App.tsx`, `src/components`, `src/pages`, `src/navigation`) no hay colores (`#…`, `rgb(…)`, `rgba(…)`), ni `fontSize` o `fontWeight` numéricos: todo sale de `front/src/styles/theme.ts` y el texto se dibuja con `Txt`. Los colores de espacios guardados como datos en `utils/model.ts` no cambian.
- Decisión del plan: la tarjeta destacada de Neka y la barra de progreso usan colores sólidos (`primarySoft` / `primary`) en vez del degradado de la maqueta, para no sumar dependencias.
- Íconos: solo Ionicons de línea (`*-outline`), 22–24 px (barra inferior: 23 inactivo y 29 activo), en `color.primary` o `color.ink`. Sin emojis ni íconos rellenos.
- Letra mínima: 11 px. Área táctil mínima: 44 × 44 (con `hitSlop` si el elemento visible es menor).
- Contraste de texto ≥ 4.5:1. `color.success` (3.35:1) y `color.warning` (2.38:1) **nunca** se usan como color de texto, solo en puntos y rellenos. Sobre `color.primarySoft` el texto es `ink` o `primary` (`inkSecondary` da 4.49:1).
- Textos: una oración por tarjeta, títulos de 1–3 palabras, concretos (horas, números, nombres), botones con verbo, errores con "qué pasó + qué hacer", tuteo neutro. Sin eslóganes.
- Neka aparece como máximo una vez por pantalla.
- Con "Reducir movimiento" activo (`useReducedMotion()`), no hay resortes ni escalas; solo fundidos de `motion.fadeMs`.
- No cambiar `SyncEngine`, la forma de `AppData`, las validaciones de `model.ts` ni `back/firestore.rules`.
- Cada tarea termina con `npm test`, `npm run typecheck` y `npm --prefix front run build:web` en verde (desde la raíz) y un commit en el git local.
- Commits en español, terminando con la línea `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Textos largos** (título de ítem de 80 caracteres, nombre de perfil largo, mensaje de Neka con dos títulos largos): nada se desborda; `ListRow` y el saludo cortan a 1 línea con "…", y `NekaCard` permite hasta 4 líneas. → Task 5, paso de verificación.
2. **Teclado sobre un panel** (editor de ítems o inicio de sesión en iPhone, campo al final): el campo enfocado queda visible. → Task 4 (`KeyboardAvoidingView` del `Sheet`) y Task 12 (prueba en iPhone).
3. **Límites del día** (ítem a las 23:59 de hoy, a las 00:15 de mañana, con plazo hoy pero sin horario): "hoy" usa el día local. → Task 2, test `todayItems: límites del día`.
4. **Muchos ítems hoy** (12): "Hoy" muestra los 6 primeros por hora y un botón "Ver 6 más" que abre el Calendario. → Task 5.
5. **Completar algo bloqueado** desde el círculo de `ListRow` (dependencia sin terminar): se muestra el mensaje de error de `saveItem` y el círculo queda sin marcar. → Task 5, paso de verificación.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---|---|
| `front/src/styles/theme.ts` (nuevo) | Tokens: color, espaciado, radios, sombras, tipografía, movimiento, tamaños |
| `front/src/utils/haptics.ts` (nuevo) | Vibraciones; no hace nada en web |
| `front/src/utils/neka.ts` (nuevo) | Ítems de hoy, siguiente ítem, puntos de hoy, formato de horas y `nekaState` |
| `front/src/utils/syncBanner.ts` (nuevo) | Decide si hay aviso de sincronización y qué dice |
| `front/src/components/ui/base/*` (nuevo) | Componentes base, uno por archivo, más `index.ts` y `nekaImages.ts` |
| `front/App.tsx` | Carga de fuente y `GestureHandlerRootView` |
| `front/src/navigation/TabNavigator.tsx` | `TabBar` nueva; sin `Topbar` |
| `front/src/components/ui/Common.tsx` | Adaptador temporal hacia `base/`; se elimina en Task 12 |
| `front/src/pages/*.tsx`, `front/src/components/ui/**` | Migración pantalla por pantalla |
| `front/tests/theme.cjs`, `neka.cjs`, `syncBanner.cjs`, `styles.cjs` (nuevos) | Pruebas |
| `front/tests/run.cjs` | Compila y ejecuta las pruebas nuevas |

Se eliminan: `components/layout/Topbar.tsx`, `Navbar.tsx`, `ScreenLayout.tsx` y `components/ui/ChatUi/ChatHeader.tsx` (Task 4); `components/ui/Common.tsx` y `styles/globalStyles.ts` (Task 12).

---

### Task 1: Tokens, fuente, gestos y vibraciones

**Files:**
- Create: `front/src/styles/theme.ts`, `front/src/utils/haptics.ts`, `front/tests/theme.cjs`
- Modify: `front/App.tsx`, `front/tests/run.cjs`, `front/package.json` y `front/package-lock.json` (vía `npx expo install`)

**Interfaces:**
- Produces: `color`, `space`, `radius`, `shadow`, `font`, `type`, `motion`, `size` y los tipos `Weight` y `TypeVariant` desde `styles/theme.ts`; `haptic.selection(): void`, `haptic.success(): void` y `haptic.light(): void` desde `utils/haptics.ts`.

- [ ] **Step 1: Instalar dependencias** (desde `front/`)

Run: `npx expo install expo-font @expo-google-fonts/plus-jakarta-sans expo-haptics`
Expected: las 3 aparecen en `front/package.json` con versiones elegidas por Expo para el SDK 57.

- [ ] **Step 2: Escribir el test que falla** — `front/tests/theme.cjs`

```js
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { color, type } = require("../.test-build/styles/theme.js");
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
test("tema: contraste de texto ≥ 4.5", () => {
  for (const [fg, bg] of [
    [color.ink, color.background], [color.inkSecondary, color.background],
    [color.inkSecondary, color.surface], [color.inkDone, color.background],
    [color.onPrimary, color.primary], [color.danger, color.dangerSoft],
    [color.primary, color.primarySoft], [color.primary, color.background],
  ]) assert.ok(contrast(fg, bg) >= 4.5, `${fg} sobre ${bg}`);
});
test("tema: ningún estilo de texto bajo 11 px", () => {
  for (const v of Object.values(type)) assert.ok(v.size >= 11);
});
```

- [ ] **Step 3: Agregar la compilación del tema a `front/tests/run.cjs`**

Después de la compilación actual, un segundo `spawnSync` de `tsc` que compile solo `src/styles/theme.ts` con `--outDir .test-build/styles` y las mismas opciones (si se agregara a la primera lista, cambiaría la carpeta raíz de salida y rompería los `require` existentes). Después agregar `require("./theme.cjs");`.

Run: `npm test` (desde la raíz)
Expected: FAIL, no encuentra `src/styles/theme.ts`.

- [ ] **Step 4: Crear `front/src/styles/theme.ts`** con exactamente estos valores (sin importar React Native, para que compile en las pruebas):

```ts
export const color = {
  primary: "#7546EC", primarySoft: "#EFE7FF", background: "#FAF8FF", surface: "#FFFFFF",
  ink: "#241D38", inkSecondary: "#6F6683", inkDone: "#776E8A", line: "#EEE9F6",
  danger: "#B42A55", dangerSoft: "#FCE8EF", success: "#2F9E77", warning: "#E8962E",
  onPrimary: "#FFFFFF", backdrop: "rgba(32, 20, 54, 0.35)",
} as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, screen: 18 } as const;
export const radius = { sm: 12, badge: 14, md: 20, lg: 26, pill: 999 } as const;
export const shadow = {
  card: "0px 6px 20px rgba(90, 51, 164, 0.08)",
  raised: "0px 12px 32px rgba(40, 20, 90, 0.18)",
} as const;
export type Weight = 400 | 500 | 600 | 700 | 800;
export const font: Record<Weight, string> = {
  400: "PlusJakartaSans_400Regular", 500: "PlusJakartaSans_500Medium",
  600: "PlusJakartaSans_600SemiBold", 700: "PlusJakartaSans_700Bold",
  800: "PlusJakartaSans_800ExtraBold",
};
export const type = {
  largeTitle: { size: 26, weight: 800, lineHeight: 32, letterSpacing: -0.6 },
  title: { size: 20, weight: 700, lineHeight: 26, letterSpacing: -0.3 },
  headline: { size: 15, weight: 700, lineHeight: 20, letterSpacing: 0 },
  body: { size: 14, weight: 500, lineHeight: 20, letterSpacing: 0 },
  callout: { size: 13, weight: 500, lineHeight: 18, letterSpacing: 0 },
  caption: { size: 12, weight: 500, lineHeight: 16, letterSpacing: 0 },
} as const;
export type TypeVariant = keyof typeof type;
export const motion = {
  gentle: { damping: 20, stiffness: 180, mass: 1 },
  snappy: { damping: 18, stiffness: 420, mass: 0.6 },
  pressScale: 0.97, fadeMs: 180,
} as const;
export const size = {
  minTouch: 44, icon: 22, tabIcon: 23, tabIconActive: 29, tabBar: 56,
  sheetDragClose: 120, sheetVelocityClose: 800, todayLimit: 6,
} as const;
```

- [ ] **Step 5: Run `npm test`**

Expected: PASS (28 pruebas existentes + 2 del tema).

- [ ] **Step 6: Crear `front/src/utils/haptics.ts`**

`haptic.selection()` → `Haptics.selectionAsync()`, `haptic.success()` → `Haptics.notificationAsync(NotificationFeedbackType.Success)`, `haptic.light()` → `Haptics.impactAsync(ImpactFeedbackStyle.Light)`. Si `Platform.OS === "web"`, no hace nada. Cada promesa termina en `.catch(() => {})`.

- [ ] **Step 7: Modificar `front/App.tsx`**

- `useFonts` de `@expo-google-fonts/plus-jakarta-sans` con los 5 pesos de `font`.
- Mientras `!loaded && !error`, renderizar un `View` a pantalla completa con `backgroundColor: color.background` y un `ActivityIndicator` en `color.primary` centrado. Si `error` existe, la app se muestra igual (con la fuente del sistema), nunca queda en blanco.
- Envolver todo en `<GestureHandlerRootView style={{ flex: 1 }}>`.

- [ ] **Step 8: Verificar**

Run: `npm test`, `npm run typecheck`, `npm --prefix front run build:web`
Expected: todo en verde. Con `npm run web` la app abre igual que antes (la fuente se nota recién en Task 3).

- [ ] **Step 9: Commit**

```bash
git add front/src/styles/theme.ts front/src/utils/haptics.ts front/App.tsx front/tests/theme.cjs front/tests/run.cjs front/package.json front/package-lock.json
git commit -m "A1: tokens del tema, fuente Plus Jakarta Sans, gestos y vibraciones"
```

---

### Task 2: Lógica de Neka y del día (`utils/neka.ts`)

**Files:**
- Create: `front/src/utils/neka.ts`, `front/tests/neka.cjs`
- Modify: `front/tests/run.cjs` (agregar `"src/utils/neka.ts"` a la primera lista y `require("./neka.cjs")`)

**Interfaces:**
- Consumes: `AppData`, `Item`, `activeItems`, `passive`, `localDay` (`utils/model.ts`); `findConflicts`, `Conflict` (`utils/planner.ts`).
- Produces:
  - `type NekaPose = 1 | 3 | 7 | 14 | 15`
  - `type NekaAction = { label: string; target: "chat" | "crear" | "item"; itemId?: string }`
  - `type NekaState = { kind: "conflicto" | "vencido" | "revisar" | "nuevo" | "listo" | "dia" | "libre"; pose: NekaPose; message: string; action?: NekaAction }`
  - `todayTime(item: Item, now?: number): string`: ISO de `scheduledAt` si cae hoy, si no de `dueAt` si cae hoy, si no `""`.
  - `todayItems(data: AppData, now?: number): Item[]`: activos, no pasivos, con `todayTime` no vacío, ordenados por `todayTime`.
  - `nextItem(data: AppData, now?: number): Item | undefined`: primer ítem de hoy no completado con `todayTime` ≥ `now`.
  - `pointsToday(data: AppData, now?: number): number`: recompensas con `at` de hoy, sin claves que terminen en `:budget`.
  - `hhmm(iso: string): string`: hora local en `"HH:mm"`.
  - `timeUntil(fromMs: number, toMs: number): string`
  - `nekaState(data: AppData, now?: number): NekaState`

- [ ] **Step 1: Escribir los tests que fallan** — `front/tests/neka.cjs`

Preparación (mismo estilo que `rules.cjs`): `const n = require("../.test-build/neka.js")`, `const m = require("../.test-build/model.js")`, `now = new Date("2030-05-01T13:00:00").getTime()`, `at(day, hm)` → ISO de `2030-05-DDTHH:mm:00` local, `task(fields)` → `{ ...m.newItem(), type: "Tarea", title: "T", startDate: "2030-05-01", duration: 60, flexible: false, ...fields }` y `data(items, rewards = [])` → `{ ...m.emptyData(), items, rewards }`.

```js
test("neka: sin ítems → nuevo", () => assert.deepEqual(n.nekaState(data([]), now), {
  kind: "nuevo", pose: 3,
  message: "Hola, soy Neka. Crea tu primera tarea y te ayudo a ordenarla.",
  action: { label: "Crear tarea", target: "crear" } }));
test("neka: choque de hoy → conflicto", () => {
  const s = n.nekaState(data([
    task({ id: "a", title: "Revisión de sprint", scheduledAt: at("01", "14:00") }),
    task({ id: "b", title: "Clase de estadística", scheduledAt: at("01", "14:30") })]), now);
  assert.equal(s.kind, "conflicto"); assert.equal(s.pose, 14);
  assert.equal(s.message, "A las 14:00 se te juntan «Revisión de sprint» y «Clase de estadística».");
  assert.deepEqual(s.action, { label: "Resolver", target: "chat" });
});
test("neka: choque de otro día → revisar", () => {
  const s = n.nekaState(data([
    task({ id: "a", scheduledAt: at("03", "10:00") }),
    task({ id: "b", scheduledAt: at("03", "10:30") })]), now);
  assert.deepEqual([s.kind, s.pose, s.message], ["revisar", 7, "Encontré 1 cosa por ordenar."]);
  assert.deepEqual(s.action, { label: "Revisar", target: "chat" });
});
test("neka: una entrega vencida → vencido con ítem", () => {
  const s = n.nekaState(data([task({ id: "d", type: "Deadline", title: "Entrega del informe", dueAt: at("01", "09:00") })]), now);
  assert.deepEqual([s.kind, s.pose, s.message], ["vencido", 14, "Se te pasó «Entrega del informe»."]);
  assert.deepEqual(s.action, { label: "Ver", target: "item", itemId: "d" });
});
test("neka: varias vencidas", () => {
  const s = n.nekaState(data(["x", "y", "z"].map((id) => task({ id, type: "Deadline", dueAt: at("01", "08:00") }))), now);
  assert.equal(s.message, "Tienes 3 entregas vencidas.");
  assert.deepEqual(s.action, { label: "Ver", target: "chat" });
});
test("neka: el choque de hoy gana a lo vencido", () => {
  const s = n.nekaState(data([
    task({ id: "a", scheduledAt: at("01", "14:00") }), task({ id: "b", scheduledAt: at("01", "14:30") }),
    task({ id: "d", type: "Deadline", dueAt: at("01", "09:00") })]), now);
  assert.equal(s.kind, "conflicto");
});
test("neka: día terminado con puntos de hoy", () => {
  const s = n.nekaState(data([task({ scheduledAt: at("01", "09:00"), status: "completado" })], [
    { key: "a", itemId: "a", points: 25, at: at("01", "09:30"), reason: "" },
    { key: "b", itemId: "b", points: 15, at: at("01", "10:00"), reason: "" },
    { key: "c:budget", itemId: "c", points: 99, at: at("01", "10:00"), reason: "" },
    { key: "d", itemId: "d", points: 50, at: "2030-04-30T10:00:00.000Z", reason: "" }]), now);
  assert.deepEqual([s.kind, s.pose, s.message, s.action], ["listo", 1, "Listo por hoy. Sumaste 40 puntos.", undefined]);
});
test("neka: día terminado sin puntos", () =>
  assert.equal(n.nekaState(data([task({ scheduledAt: at("01", "09:00"), status: "completado" })]), now).message, "Listo por hoy."));
test("neka: día con cosas", () => {
  const s = n.nekaState(data([
    task({ scheduledAt: at("01", "09:00"), status: "completado" }),
    task({ scheduledAt: at("01", "16:00") }), task({ scheduledAt: at("01", "17:30") }),
    task({ scheduledAt: at("01", "19:00") }), task({ scheduledAt: at("01", "21:00") })]), now);
  assert.deepEqual([s.kind, s.pose, s.message, s.action], ["dia", 15, "Hoy tienes 4 cosas. La siguiente es a las 16:00.", undefined]);
});
test("neka: una cosa pendiente ya pasada no tiene siguiente", () =>
  assert.equal(n.nekaState(data([task({ scheduledAt: at("01", "09:00") })]), now).message, "Hoy tienes 1 cosa."));
test("neka: día libre (solo hay ideas o cosas de otro día)", () => {
  for (const items of [[{ ...m.newItem(), type: "Idea", title: "I" }], [task({ scheduledAt: at("02", "10:00") })]])
    assert.deepEqual(n.nekaState(data(items), now), {
      kind: "libre", pose: 3, message: "Hoy no tienes nada agendado.", action: { label: "Crear", target: "crear" } });
});
test("todayItems: límites del día", () => {
  const items = [
    task({ id: "late", scheduledAt: at("01", "23:59") }), task({ id: "tomorrow", scheduledAt: at("02", "00:15") }),
    task({ id: "due", type: "Deadline", dueAt: at("01", "18:00") }), task({ id: "early", scheduledAt: at("01", "08:00") })];
  assert.deepEqual(n.todayItems(data(items), now).map((i) => i.id), ["early", "due", "late"]);
});
test("timeUntil y hhmm", () => {
  const h = (min) => n.timeUntil(now, now + min * 60000);
  assert.deepEqual([h(80), h(60), h(45), h(0), h(-5)], ["en 1 h 20 min", "en 1 h", "en 45 min", "ahora", "ahora"]);
  assert.equal(n.hhmm(at("01", "07:05")), "07:05");
});
```

- [ ] **Step 2: Run `npm test`**

Expected: FAIL, no encuentra `src/utils/neka.ts`.

- [ ] **Step 3: Implementar `front/src/utils/neka.ts`** con las firmas del bloque Interfaces y estas reglas, evaluadas en orden (gana la primera):

1. **conflicto:** existe un conflicto `overlap` donde alguno de los dos ítems tiene `todayTime` no vacío. Se toma el primero de esos conflictos y se ordenan sus 2 ítems por `scheduledAt`. Mensaje: `A las ${hhmm(primero.scheduledAt)} se te juntan «${primero.title}» y «${segundo.title}».`
2. **vencido:** ítems activos, no pasivos, no completados, con `dueAt` anterior a `now`. Si es 1: `Se te pasó «${title}».` con la acción `{ label: "Ver", target: "item", itemId }`. Si son N: `Tienes N entregas vencidas.` con `{ label: "Ver", target: "chat" }`.
3. **revisar:** queda algún conflicto. N = total de `findConflicts`. `Encontré 1 cosa por ordenar.` / `Encontré N cosas por ordenar.`
4. **nuevo:** `activeItems(data).length === 0`.
5. **listo:** hay `todayItems` y todos están completados. `Listo por hoy. Sumaste N puntos.` (`1 punto` en singular); solo `Listo por hoy.` si `pointsToday` es 0.
6. **dia:** hay `todayItems` pendientes. `Hoy tienes N cosas.` (`1 cosa` en singular), donde N = pendientes, más ` La siguiente es a las HH:mm.` si `nextItem` existe.
7. **libre:** en cualquier otro caso.

`timeUntil`: minutos = `Math.round((to - from) / 60000)`. Si es ≤ 0 → `"ahora"`; si es < 60 → `"en M min"`; si no → `"en H h"` o `"en H h M min"`.

- [ ] **Step 4: Run `npm test`**

Expected: PASS (todas, incluidas las 12 de Neka).

- [ ] **Step 5: Commit**

```bash
git add front/src/utils/neka.ts front/tests/neka.cjs front/tests/run.cjs
git commit -m "A2: reglas de Neka según el contexto y utilidades del día"
```

---

### Task 3: Componentes base primitivos

**Files:**
- Create en `front/src/components/ui/base/`: `Txt.tsx`, `PressableScale.tsx`, `Button.tsx`, `Card.tsx`, `Chip.tsx`, `Tag.tsx`, `IconBadge.tsx`, `Field.tsx`, `Toggle.tsx`, `Disclosure.tsx`, `EmptyState.tsx`, `nekaImages.ts`, `index.ts`
- Modify: `front/src/components/ui/Common.tsx` (`Button`, `Chip`, `Field`, `Toggle`, `Empty` y `Loading` pasan a ser adaptadores hacia `base/`, con las mismas props que hoy)

**Interfaces:**
- Consumes: `theme.ts`, `haptic` (Task 1); `NekaPose` (Task 2).
- Produces (todo exportado desde `base/index.ts`):
  - `Txt(props: { variant?: TypeVariant; tone?: TxtTone; weight?: Weight; align?: "left" | "center" | "right"; numberOfLines?: number; strike?: boolean; tabular?: boolean; style?: StyleProp<TextStyle>; children: ReactNode; accessibilityRole?: AccessibilityRole; accessibilityLabel?: string })` con `type TxtTone = "ink" | "secondary" | "primary" | "danger" | "done" | "onPrimary"`. Valores por defecto: `variant="body"` y `tone="ink"`. Aplica `fontFamily: font[weight ?? type[variant].weight]`, `fontSize`, `lineHeight` y `letterSpacing` del token. No usa `fontWeight`.
  - `PressableScale(props: { onPress?: () => void; disabled?: boolean; style?: StyleProp<ViewStyle>; hitSlop?: number; children: ReactNode; accessibilityRole?: AccessibilityRole; accessibilityLabel?: string; accessibilityState?: AccessibilityState })`: al presionar escala a `motion.pressScale` con `withSpring(motion.snappy)`. Con movimiento reducido, opacidad 0.85 en vez de escala.
  - `Button(props: { title: string; onPress: () => void; variant?: "primary" | "secondary" | "danger" | "plain"; small?: boolean; disabled?: boolean })`. Primary: píldora `primary` con texto `onPrimary`. Secondary: `primarySoft` con texto `primary`. Danger: `danger` con texto `onPrimary`. Plain: sin fondo, texto `primary`. Alto 46 (small: 36 con `hitSlop` hasta 44). Deshabilitado: opacidad 0.4. Texto `Txt` callout de peso 700.
  - `Card(props: { children: ReactNode; variant?: "plain" | "featured"; onPress?: () => void; style?: StyleProp<ViewStyle> })`. Plain: `surface`, `radius.md`, `shadow.card`, padding `space.lg`. Featured: fondo sólido `primarySoft`, `radius.lg`, sin sombra (decisión: sin degradado para no sumar dependencias).
  - `Chip(props: { title: string; selected?: boolean; onPress: () => void })`
  - `Tag(props: { text: string; tone?: "danger" | "primary" | "neutral" })` con `type TagTone`. Danger: `dangerSoft` con texto `danger`. Primary: `primarySoft` con texto `primary`. Neutral: `line` con texto `ink`. Usa caption de peso 700.
  - `IconBadge(props: { name: keyof typeof Ionicons.glyphMap })`: cuadrado de 42 px, `radius.badge`, `primarySoft`, ícono de 22 px en `primary`.
  - `Field`: mismas props que el `Field` actual de `Common.tsx`, más `error?: string` mostrado debajo en `Txt` caption `danger`.
  - `Toggle`: mismas props que el `Toggle` actual.
  - `Disclosure(props: { title: string; children: ReactNode; defaultOpen?: boolean })`: fila tocable con `chevron-down-outline` que rota 180°; el contenido entra con `FadeIn` de Reanimated. `accessibilityState={{ expanded }}`.
  - `nekaImage(pose: NekaPose): ImageSourcePropType` en `nekaImages.ts`, con `require` estático de `front/assets/Img/Neka_Pose{1,3,7,14,15}.png`.
  - `EmptyState(props: { pose: NekaPose; text: string; action?: { label: string; onPress: () => void } })`: imagen de 96 px de alto, `Txt` body secondary centrado y `Button` secondary opcional.

- [ ] **Step 1: Crear `Txt` y `PressableScale`**, que son la base del resto.
- [ ] **Step 2: Crear `Button`, `Card`, `Chip`, `Tag`, `IconBadge`, `Field`, `Toggle`, `Disclosure`, `nekaImages` y `EmptyState`**, y exportarlos en `index.ts`.
- [ ] **Step 3: Convertir `Common.tsx` en adaptador.** `Button({ title, onPress, secondary, danger, disabled, small })` → `<base.Button variant={danger ? "danger" : secondary ? "secondary" : "primary"} …/>`. `Chip`, `Field` y `Toggle` delegan directo. `Empty({ title, detail })` → `Card` con `Txt` headline + `Txt` body secondary. `Loading` → `ActivityIndicator` en `primary` + `Txt` secondary "Cargando…". `Sheet` no cambia todavía.
- [ ] **Step 4: Verificar**

Run: `npm test`, `npm run typecheck`, `npm --prefix front run build:web`
Expected: todo en verde.
Visual: `npm run web`, viewport 375 × 812, modo invitado. Botones, chips y campos de todas las pantallas usan Plus Jakarta Sans y los colores nuevos; nada se ve roto.

- [ ] **Step 5: Commit**

```bash
git add front/src/components/ui/base front/src/components/ui/Common.tsx
git commit -m "A3: componentes base (texto, botones, tarjetas, chips, campos) y Common como adaptador"
```

---

### Task 4: Marco: barra inferior, paneles, encabezado y aviso de sincronización

**Files:**
- Create: `front/src/utils/syncBanner.ts`, `front/tests/syncBanner.cjs`, `front/src/components/ui/base/Sheet.tsx`, `TabBar.tsx`, `ScreenHeader.tsx`, `SyncBanner.tsx`
- Modify: `front/tests/run.cjs`, `front/src/components/ui/base/index.ts`, `front/src/components/ui/Common.tsx` (`Sheet` re-exporta el de `base`), `front/src/navigation/TabNavigator.tsx`, `front/src/pages/Resumen.tsx`, `Calendario.tsx`, `Chat.tsx`, `Perfil.tsx` y `EspacioTrabajo.tsx` (solo el encabezado)
- Delete: `front/src/components/layout/Topbar.tsx`, `Navbar.tsx`, `ScreenLayout.tsx`, `front/src/components/ui/ChatUi/ChatHeader.tsx`

**Interfaces:**
- Consumes: Tasks 1 y 3; `useApp()` (`error`, `conflict`, `cloudStatus`, `pendingChanges`, `retry`, `clearError`).
- Produces:
  - `type SyncInput = { error: string; hasConflict: boolean; cloudStatus: string; pendingChanges: number }`
  - `type SyncBannerState = { tone: "danger" | "neutral"; text: string; action?: { label: string; target: "retry" | "perfil" | "ajustes" } }`
  - `syncBannerFor(input: SyncInput): SyncBannerState | null`
  - `Sheet(props: { visible: boolean; title: string; onClose: () => void; children: ReactNode; size?: "auto" | "large" })`, por defecto `size="large"`. Mismas props obligatorias que el `Sheet` actual.
  - `TabBar(props: BottomTabBarProps)`
  - `ScreenHeader(props: { title: string; showDate?: boolean; right?: ReactNode })`
  - `TabParamList.Perfil` pasa a `{ settings?: boolean } | undefined`.

- [ ] **Step 1: Escribir el test que falla** — `front/tests/syncBanner.cjs`. Agregar `"src/utils/syncBanner.ts"` a la primera lista de `run.cjs` y `require("./syncBanner.cjs")`.

```js
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { syncBannerFor: f } = require("../.test-build/syncBanner.js");
const ok = { error: "", hasConflict: false, cloudStatus: "Sincronizado automáticamente", pendingChanges: 0 };
test("aviso: sin problemas no se muestra", () => {
  for (const cloudStatus of ["Sincronizado automáticamente", "Modo local", "Guardando cambios…", "Sincronizando…", "Conectando con Firebase…"])
    assert.equal(f({ ...ok, cloudStatus }), null);
});
test("aviso: error de guardado", () => assert.deepEqual(f({ ...ok, error: "x" }),
  { tone: "danger", text: "No se pudo guardar.", action: { label: "Reintentar", target: "retry" } }));
test("aviso: conflicto", () => assert.deepEqual(f({ ...ok, hasConflict: true }),
  { tone: "danger", text: "Hay cambios en conflicto.", action: { label: "Revisar", target: "perfil" } }));
test("aviso: el error gana al conflicto", () => assert.equal(f({ ...ok, error: "x", hasConflict: true }).text, "No se pudo guardar."));
test("aviso: sin conexión con cambios", () => {
  const off = "Sin conexión o sincronización pendiente · cambios conservados en este dispositivo";
  assert.deepEqual(f({ ...ok, cloudStatus: off, pendingChanges: 3 }), { tone: "neutral", text: "Sin conexión · 3 cambios guardados en este dispositivo" });
  assert.equal(f({ ...ok, cloudStatus: off, pendingChanges: 1 }).text, "Sin conexión · 1 cambio guardado en este dispositivo");
  assert.equal(f({ ...ok, cloudStatus: off, pendingChanges: 0 }).text, "Sin conexión");
});
test("aviso: cambios sin guardar", () => assert.deepEqual(f({ ...ok, cloudStatus: "Cambios sin guardar" }),
  { tone: "danger", text: "Cambios sin guardar. Exporta un respaldo.", action: { label: "Ajustes", target: "ajustes" } }));
```

- [ ] **Step 2: Run `npm test`.** Expected: FAIL (no existe `syncBanner.ts`).
- [ ] **Step 3: Implementar `syncBannerFor`** con la prioridad error > conflicto > `cloudStatus.startsWith("Sin conexión")` > `cloudStatus === "Cambios sin guardar"` > `null`.
- [ ] **Step 4: Run `npm test`.** Expected: PASS.
- [ ] **Step 5: Crear `Sheet.tsx`**
  - `Modal` con `transparent`, `animationType="none"` y `statusBarTranslucent`; el contenido envuelto en `GestureHandlerRootView`.
  - Fondo `color.backdrop` con opacidad animada (`withTiming`, `motion.fadeMs`); tocarlo cierra.
  - Panel: `surface`, radios superiores `radius.lg`, `maxWidth` 680 centrado, `shadow.raised`, padding inferior según el área segura. Alto: `large` = 92 % de la pantalla; `auto` = el contenido, con máximo 92 %.
  - Arriba, una manija (36 × 5, `radius.pill`, `color.line`), el título en `Txt` title con `accessibilityRole="header"` y un `Button` plain "Cerrar".
  - El cuerpo va en un `ScrollView` con `keyboardShouldPersistTaps="handled"`, padding `space.xl` y gap `space.lg`, dentro de un `KeyboardAvoidingView` (`behavior="padding"` en iOS).
  - Al abrir, `translateY` pasa del alto de la ventana a 0 con `withSpring(motion.gentle)`. Con movimiento reducido, solo fundido.
  - `Gesture.Pan()` solo sobre la zona de manija y título: `translateY = max(0, translationY)`. Al soltar, si `translationY > size.sheetDragClose` o `velocityY > size.sheetVelocityClose`, se cierra; si no, vuelve con `motion.gentle`.
  - El cierre interno (arrastre, fondo o "Cerrar") anima la salida con `withTiming` de 200 ms y luego llama `scheduleOnRN(onClose)`. Si el padre pasa `visible=false`, el panel se desmonta de inmediato.
  - `accessibilityViewIsModal` en el panel.
- [ ] **Step 6: Crear `TabBar.tsx`**
  - Íconos: `Resumen: "grid-outline"`, `Calendario: "calendar-outline"`, `EspacioTrabajo: "git-network-outline"`, `Chat: "chatbubble-outline"`, `Perfil: "person-outline"`.
  - Etiquetas de accesibilidad: "Resumen", "Calendario", "Espacio", "Chat con Neka" y "Perfil".
  - Fila de ancho completo, fondo `surface`, borde superior de 1 px en `line`, alto `size.tabBar` + el inset inferior.
  - Cada pestaña es un `PressableScale` con `flex: 1` y alto mínimo de 44. Ionicons de tamaño `size.tabIconActive` dentro de un `Animated.View` con escala 1 si está activa y `size.tabIcon / size.tabIconActive` si no, animada con `withSpring(motion.snappy)`. Color: `primary` activo, `inkSecondary` inactivo.
  - Mantiene la lógica de `tabPress` del `Navbar` actual y llama `haptic.selection()` al cambiar de pestaña.
  - `accessibilityRole="tab"` y `accessibilityState={{ selected }}`.
- [ ] **Step 7: Crear `ScreenHeader.tsx` y `SyncBanner.tsx`**
  - `ScreenHeader`:
    - Fila con margen superior `space.sm`: a la izquierda la fecha (si `showDate`) en caption secondary, con el formato `toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })` y la primera letra en mayúscula (→ "Jueves 15 de octubre"); debajo, el título en largeTitle con `numberOfLines={1}`. A la derecha va `right`.
    - Debajo de la fila renderiza `<SyncBanner />`.
  - `SyncBanner`:
    - Usa `syncBannerFor({ error, hasConflict: !!conflict, cloudStatus, pendingChanges })`.
    - Fila con `radius.sm`: fondo `dangerSoft` con texto `danger` (tone danger) o `primarySoft` con texto `ink` (tone neutral), más un `Button` plain small para la acción.
    - Acciones: `retry` → `clearError(); retry()`; `perfil` → `navigate("Tabs", { screen: "Perfil" })`; `ajustes` → `navigate("Tabs", { screen: "Perfil", params: { settings: true } })`.
- [ ] **Step 8: Conectar el marco**
  - `TabNavigator`: `tabBar={(p) => <TabBar {...p} />}`, `SafeAreaView` con `edges={["top"]}` y fondo `color.background`, sin `Topbar`.
  - `Common.Sheet` re-exporta `base/Sheet`. Con eso el editor de ítems y todos los paneles ya suben desde abajo.
  - Encabezados: cada página reemplaza su título por `ScreenHeader`:
    - Resumen: `showDate` y "Hola"/"Hola, {primer nombre}".
    - Calendario: "Calendario" (se borra "Tu calendario" y su subtítulo).
    - Chat: "Neka" (reemplaza `<ChatHeader />`).
    - Perfil: "Perfil".
    - Espacio: "Espacio".
  - `Perfil` lee `route.params?.settings` y abre Ajustes cuando es `true`.
  - Borrar `Topbar.tsx`, `Navbar.tsx`, `ScreenLayout.tsx` y `ChatHeader.tsx`, y comprobar con grep que nadie los importa.
- [ ] **Step 9: Verificar**

Run: `npm test`, `npm run typecheck`, `npm --prefix front run build:web`
Expected: todo en verde.
Visual (`npm run web`, 375 × 812, invitado):
- No hay barra superior y la barra inferior va pegada abajo, solo con íconos; el activo es más grande y violeta.
- Abrir el editor (botón para crear ítem en el Resumen): sube como panel. Arrastrar la manija hacia abajo con el mouse lo cierra, igual que tocar el fondo y "Cerrar".
- Un panel abierto con un campo al final se puede desplazar hasta ese campo.

- [ ] **Step 10: Commit**

```bash
git add -A front/src front/tests
git commit -m "A4: barra inferior solo íconos, paneles deslizables, encabezado y aviso de sincronización"
```

---

### Task 5: Resumen (maqueta B v3)

**Files:**
- Create: `front/src/components/ui/base/ListRow.tsx`, `ProgressBar.tsx`, `LevelRing.tsx`, `NekaCard.tsx` (y exportarlos en `index.ts`)
- Modify: `front/src/pages/Resumen.tsx` (se reescribe)

**Interfaces:**
- Consumes: `nekaState`, `todayItems`, `todayTime`, `nextItem`, `hhmm`, `timeUntil` y `NekaAction` (Task 2); `ScreenHeader`, `Card`, `IconBadge`, `Button` y `Txt` (Tasks 3–4); `typeIcons` (`components/ui/ItemCard.tsx`); `saveItem` y `totalPoints` (`model.ts`); `findConflicts` (`planner.ts`); `haptic`.
- Produces:
  - `ListRow(props: { title: string; time?: string; dotColor: string; done: boolean; tag?: { text: string; tone: TagTone }; onPress: () => void; onToggle?: () => void })`. Columna de hora de 42 px (vacía si no hay `time`). Con `onToggle`, un círculo de 22 px con borde de 2 px en `dotColor`; al completar se rellena de `primary` con `checkmark` en `onPrimary` y escala con `motion.snappy`, con `hitSlop` hasta 44 y `accessibilityRole="checkbox"`. Sin `onToggle`, un punto de 8 px. Título en `Txt` body con `numberOfLines={1}`, `strike` y tono `done` si está completado. Toda la fila es un `PressableScale`.
  - `ProgressBar(props: { value: number; accessibilityLabel: string })` con `value` entre 0 y 1: alto 10, `radius.pill`, fondo `primarySoft` y relleno `primary` cuyo ancho se anima con `motion.gentle`. `accessibilityRole="progressbar"`.
  - `LevelRing(props: { level: number; progress: number })`: círculo de 44 px dibujado con `react-native-svg`, aro de 4 px (`primarySoft` de fondo, `primary` para el avance) y el número en caption de peso 800 `primary`. `accessibilityLabel={`Nivel ${level}`}`.
  - `NekaCard(props: { state: NekaState; onAction: (a: NekaAction) => void })`: `Card` featured con padding derecho de 116, mensaje en `Txt` body de peso 600 con `numberOfLines={4}`, `Button` small primary si hay `action`, e `Image` `nekaImage(state.pose)` de 104 px de ancho anclada abajo a la derecha (oculta para accesibilidad).

- [ ] **Step 1: Crear `ListRow`, `ProgressBar`, `LevelRing` y `NekaCard`.**
- [ ] **Step 2: Reescribir `Resumen.tsx`** en este orden (`now = Date.now()` por render):
  1. `ScreenHeader` con `showDate`, el título del Task 4 y `right={<LevelRing level={level} progress={(points % 100) / 100} />}`.
  2. `NekaCard` con `nekaState(data, now)`. `onAction`: `chat` → navegar a Chat; `crear` → abrir el editor con `newItem()`; `item` → abrir el editor con ese ítem.
  3. Si hay `nextItem`: encabezado "Lo siguiente" + `timeUntil(now, Date.parse(todayTime(next)))` en callout secondary. Debajo, un `Card` con `onPress` que abre el editor, con `IconBadge name={typeIcons[next.type]}`, el título en headline (1 línea) y en callout secondary `${hhmm(inicio)}${duración > 0 ? ` – ${hhmm(fin)}` : ""} · ${nombre del espacio}`.
  4. Si hay `todayItems`: encabezado "Hoy" + `${completados} de ${total} listo`. Debajo, los primeros `size.todayLimit` como `ListRow`:
     - `time = hhmm(todayTime(i))` y `dotColor` = color del espacio;
     - `tag = { text: "Choca", tone: "danger" }` si el ítem está en un conflicto `overlap`;
     - `onPress` abre el editor.
     - `onToggle` hace `change((d) => saveItem(d, { ...actual, status: completado ? "pendiente" : "completado" }))` en un `try/catch`. Si funciona y quedó completado → `haptic.success()`. Si falla → mostrar el mensaje en `Txt` caption `danger` bajo el encabezado "Hoy".
     - Si hay más de 6 → `Button` plain `Ver ${n} más`, que navega a Calendario.
  5. "Progreso": un `Card` con una fila `Nivel ${level}` (headline) + `${points} pts` (callout secondary), una `ProgressBar` con `value=(points % 100)/100` y debajo, en caption secondary, `${100 - points % 100} pts para el nivel ${level + 1} · ${weekPoints} esta semana` (conservar el cálculo semanal actual).
  - Se eliminan: "Progreso por espacio", "Prioridades", la tarjeta de conflictos, el botón "Crear mi próximo ítem", la imagen `Neka_Pose2` y el saludo por hora.
- [ ] **Step 3: Verificar**

Run: `npm test`, `npm run typecheck`, `npm --prefix front run build:web`
Expected: todo en verde.
Visual (375 × 812, invitado; crear los ítems con el editor usando la fecha de hoy):
- Sin ítems: Neka en pose 3 con "Crear tarea".
- "Revisión de sprint" hoy 14:00 de 60 min + "Clase de estadística" hoy 14:30 → Neka pose 14 con el mensaje de choque y la etiqueta "Choca" en las dos filas.
- Un ítem con un título de 80 caracteres → corta con "…" sin desbordar (Review Focus 1).
- Tocar el círculo → se tacha, sube "N de M listo" y el mensaje de Neka se actualiza.
- 12 ítems hoy → se ven 6 filas y "Ver 6 más" abre el Calendario (Review Focus 4).
- Una tarea que depende de otra pendiente → tocar su círculo muestra el error y el círculo no se marca (Review Focus 5).
- Comparar con `DOCUMENTOS/V2/A_MAQUETA/resumen-b-v3.html`.

- [ ] **Step 4: Commit**

```bash
git add front/src/components/ui/base front/src/pages/Resumen.tsx
git commit -m "A5: Resumen nuevo con Neka según contexto, Hoy, Lo siguiente y Progreso"
```

---

### Task 6: Calendario

**Files:**
- Modify: `front/src/pages/Calendario.tsx`

**Interfaces:**
- Consumes: `ScreenHeader`, `Card`, `Chip`, `ListRow`, `EmptyState`, `Disclosure`, `Txt`, `PressableScale` y `Button` (Tasks 3–5); `hhmm`.

- [ ] **Step 1: Migrar el render** sin tocar el estado ni el filtrado actual (`items`, `onDay`, `dayItems`, `cells`, `move`):
  - `ScreenHeader` "Calendario" con `right` = `Button` secondary small "Hoy" (la acción actual).
  - Tarjeta del mes:
    - Fila con `PressableScale` de `chevron-back-outline` / `chevron-forward-outline` (accessibilityLabel "Mes anterior" / "Mes siguiente") y el mes en headline con la primera letra en mayúscula.
    - Chips de espacios.
    - Cabecera L–D en caption secondary.
    - Celdas: día seleccionado = círculo `primary` con texto `onPrimary`; hoy = texto `primary` de peso 700; hasta 3 puntos de 4 px en `primary` según la cantidad de ítems.
    - Cada celda es un `PressableScale` con `accessibilityLabel` de la fecha y la cantidad.
  - Filtros de tipo y "Mostrar completados" dentro de un `Disclosure` "Filtros" (reemplaza el botón "Filtrar tipos y completados").
  - Lista del día:
    - Encabezado con la fecha seleccionada en headline + `Button` plain "Añadir" (acción actual).
    - `ListRow` por ítem con `time = hhmm(scheduledAt || dueAt)` (vacío si no tiene hora), `onToggle` igual que en Resumen (misma lógica y manejo de error) y `onPress` que abre el editor.
    - Si no hay ítems: `EmptyState pose={3} text="Nada para este día."` con la acción "Añadir".
  - Quitar el texto final de nota sobre hora local si solo repite información; si explica algo necesario, dejarlo en caption secondary de 1 oración.
- [ ] **Step 2: Verificar.** `npm test`, `npm run typecheck`, `npm --prefix front run build:web` en verde. Visual a 375 × 812: navegar meses, seleccionar días, filtros en el desplegable, completar desde la lista.
- [ ] **Step 3: Commit** — `git add front/src/pages/Calendario.tsx` + `git commit -m "A6: Calendario con el sistema nuevo"`

---

### Task 7: Chat con Neka

**Files:**
- Modify: `front/src/pages/Chat.tsx`, `front/src/components/ui/ChatUi/ChatMessage.tsx`, `front/src/components/ui/ChatUi/ChatInput.tsx`

**Interfaces:**
- Consumes: `Txt`, `Card`, `Button`, `Chip`, `Tag`, `ListRow`, `Field`, `Toggle` y `Sheet` (`base`); `nekaImage`.

- [ ] **Step 1: Burbujas e input.**
  - `ChatMessage`: usuario = fondo `primary`, texto `onPrimary`, radios `radius.md` con la esquina inferior derecha de 4. Neka = `surface` con borde `line`, texto `ink` y esquina inferior izquierda de 4. Ancho máximo 80 %, padding `space.md`.
  - `ChatInput`: campo `surface` con `radius.pill` y botón de enviar con `PressableScale` + `arrow-up-outline` en un círculo `primary` (accessibilityLabel "Enviar").
- [ ] **Step 2: Pantalla.**
  - Texto superior: `Neka funciona en tu dispositivo. Tú apruebas cada cambio.` (caption secondary, centrado).
  - Mensaje inicial de Neka: `Hola, soy Neka. Puedo revisar choques, mostrarte pendientes o buscar un hueco para algo.`
  - Chips de respuestas rápidas sin cambios.
  - "Opciones de reorganización" pasa a llamarse "Buscar un hueco": cada candidato es una fila `Card` con el título (1 línea), la fecha en callout secondary y un `Button` small secondary "Buscar hueco".
  - Conflictos: un `Card` con encabezado "Choques" y, por conflicto, la descripción en body + un `Button` plain "Revisar".
  - Panel de propuesta:
    - `Image nekaImage(7)` de 56 px junto al título del ítem.
    - Filas "Antes" y "Propuesto" (la propuesta en `primary` de peso 700) y el motivo en callout secondary.
    - Botones `Aceptar` (primary) y `Descartar` (secondary). Se quita el párrafo explicativo largo.
  - Panel de agrupar: solo estilos.
  - Revisar los textos de respuesta de Neka en `Chat.tsx` con las reglas de copy (skill `design:ux-copy`), sin cambiar la lógica de reconocimiento de comandos.
- [ ] **Step 3: Verificar.** Pruebas, typecheck y build en verde. Visual: enviar "resumen", "conflictos" y "crear tarea: prueba"; buscar un hueco y aceptar una propuesta.
- [ ] **Step 4: Commit** — `git add front/src/pages/Chat.tsx front/src/components/ui/ChatUi` + `git commit -m "A7: Chat con Neka: burbujas, propuestas y textos"`

---

### Task 8: Perfil y Ajustes

**Files:**
- Modify: `front/src/pages/Perfil.tsx`, `front/src/pages/Ajustes.tsx`

**Interfaces:**
- Consumes: `Sheet`, `Card`, `Txt`, `Button`, `Field`, `Toggle`, `Disclosure`, `Tag` y `EmptyState` (`base`).
- Produces: `Ajustes(props: { visible: boolean; onClose: () => void })` (reemplaza `{ onBack }`).

- [ ] **Step 1: Ajustes como panel.**
  - `Ajustes` renderiza `<Sheet visible={visible} title="Ajustes" onClose={onClose}>`. `Perfil` ya no lo reemplaza en pantalla: lo abre con `visible={settings}` (incluido `route.params?.settings`).
  - Secciones como `Card` agrupadas, con encabezados de headline: "Neka", "Jornada", "Tus datos" y "Sobre Nekal".
  - Los paneles internos actuales (respaldo/importación/recuperación, papelera, puntos, privacidad) pasan a `Disclosure` dentro del mismo panel (sin paneles anidados): "Respaldar o importar", "Papelera", "¿Cómo se calculan los puntos?" y "Privacidad".
  - Se eliminan los subtítulos tipo eslogan ("Una organización que se adapta a ti.", "Cada avance cuenta", "Tu planificación sigue siendo tuya") y se dejan títulos directos.
  - La lógica de respaldo, importación, recuperación y papelera no cambia.
- [ ] **Step 2: Perfil.**
  - Tarjeta de perfil: avatar circular de 76 px `primary` con la inicial en `Txt` title `onPrimary`, el nombre en headline (1 línea), los roles en callout secondary y los `Tag` primary "Nivel N" y "N pts".
  - "Editar perfil" como `Button` secondary.
  - Fila tocable "Ajustes" con `settings-outline` + `chevron-forward-outline`, que abre el panel.
  - Se quita la tarjeta "A tu ritmo" con la imagen de Neka.
  - Tarjeta "Cuenta": correo o "Modo local", `cloudStatus` y pendientes en callout secondary. Botones "Reintentar conexión", "Revisar cambios en conflicto" (si hay), "Cerrar sesión" / "Conectar mi cuenta" / "Volver al inicio". Se quita el párrafo que repite cómo funciona la sincronización.
  - Los paneles de editar perfil, conectar cuenta y revisión de conflictos: solo estilos y textos.
- [ ] **Step 3: Verificar.** Pruebas, typecheck y build en verde. Visual: abrir y cerrar Ajustes deslizando; exportar respaldo; abrir cada desplegable; editar el perfil. El botón "Ajustes" del aviso de "Cambios sin guardar" abre Ajustes (se puede probar llamando a la navegación con `settings: true`).
- [ ] **Step 4: Commit** — `git add front/src/pages/Perfil.tsx front/src/pages/Ajustes.tsx` + `git commit -m "A8: Perfil y Ajustes como panel con desplegables"`

---

### Task 9: Bienvenida, inicio de sesión y pantallas de carga

**Files:**
- Modify: `front/src/pages/Bienvenida.tsx`, `front/src/pages/Login.tsx`, `front/src/navigation/AppNavigator.tsx`

- [ ] **Step 1: Bienvenida.** `nekaImage(3)` de 120 px, título "Nekal" en largeTitle `primary` y subtítulo `Organiza tu día. Neka te avisa si algo choca.` en body secondary. Debajo, el formulario de `Login` y el `Button` secondary "Continuar como invitado" con una línea en caption secondary: `Como invitado, tus datos quedan solo en este dispositivo.`
- [ ] **Step 2: Login.** `Card` con `Field` y `Button` de `base`. Los errores de Firebase se muestran en el `error` del `Field` correspondiente o en caption `danger` bajo el botón. Cada mensaje dice qué hacer. El texto de "Firebase aún no está configurado" queda en 2 oraciones.
- [ ] **Step 3: AppNavigator.** El error inicial se muestra en `Txt` danger con padding `space.screen`. El modal "Sincronizando con Firebase…" usa `Card` + `ActivityIndicator` `primary` + `Txt` y fondo `color.backdrop`.
- [ ] **Step 4: Verificar.** Pruebas, typecheck y build en verde. Visual: la bienvenida a 375 × 812, un error de inicio de sesión con contraseña vacía y la entrada como invitado.
- [ ] **Step 5: Commit** — `git add front/src/pages/Bienvenida.tsx front/src/pages/Login.tsx front/src/navigation/AppNavigator.tsx` + `git commit -m "A9: Bienvenida, inicio de sesión y carga con el sistema nuevo"`

---

### Task 10: Editor de ítems

**Files:**
- Modify: `front/src/components/ui/ItemEditor.tsx`

**Interfaces:**
- Consumes: `Sheet`, `Chip`, `Field`, `Toggle`, `Button`, `Txt`, `Tag` y `Disclosure` (`base`).

- [ ] **Step 1: Migrar la presentación** sin tocar `save`, `mergeValue`, las validaciones ni los adjuntos:
  - Arriba, el tipo de ítem con `Chip` en un `ScrollView` horizontal.
  - Secciones con encabezado headline: "Qué" (título, descripción/contenido), "Cuándo" (inicio, horario, duración, límite), "Detalles" (campos propios del tipo), "Subtareas"/"Hitos", "Estado y prioridad" (chips actuales), y "Relaciones" (espacio, grupo, dependencias) y "Adjuntos" como `Disclosure`.
  - Botones al final: "Guardar" primary y "Enviar a la papelera" danger, con la confirmación actual.
  - Decisión: **no** se divide el archivo en este subproyecto, para no arriesgar el flujo de guardado.
- [ ] **Step 2: Verificar.** Pruebas, typecheck y build en verde. Visual: crear y editar un ítem de cada uno de los 8 tipos; un error de validación se muestra; convertir una Idea en Tarea; el panel se desplaza hasta "Guardar".
- [ ] **Step 3: Commit** — `git add front/src/components/ui/ItemEditor.tsx` + `git commit -m "A10: editor de ítems con secciones y estilo nuevo"`

---

### Task 11: Espacio (solo estilo)

**Files:**
- Modify: `front/src/pages/EspacioTrabajo.tsx`, `front/src/components/ui/ItemCard.tsx`, `front/src/components/ui/EspacioTrabajoUi/*.tsx`
- Modify si hace falta: `front/src/styles/theme.ts` (tokens nuevos con nombre, ver Step 1)

- [ ] **Step 1: Reemplazar colores y tamaños sueltos.** Los ~25 literales de `CanvasContent`, `ZoomControl`, `WorkspaceBar`, `AddFab` e `InfiniteCanvas` pasan al token existente más cercano. Si ninguno corresponde (por ejemplo, líneas del lienzo), agregar un token con nombre en `theme.ts` bajo `color` (`mapEdge`, `mapNode`…), nunca un literal en el componente. Los textos pasan a `Txt`.
- [ ] **Step 2: Componentes.** `ItemCard` usa `Card` + `IconBadge` + `Txt` (título en 1 línea). Los paneles e inputs de la pantalla importan desde `base`. El botón flotante `AddFab` usa `PressableScale`, `add-outline` y accessibilityLabel "Crear ítem". Copy: frases cortas en los estados vacíos (por ejemplo `Pulsa + para crear tu primer ítem.`).
- [ ] **Step 3: Verificar.** Pruebas, typecheck y build en verde. Visual: el mapa, el zoom, mover nodos, la vista de lista, crear un espacio y crear un ítem desde +.
- [ ] **Step 4: Commit** — `git add front/src/pages/EspacioTrabajo.tsx front/src/components/ui front/src/styles/theme.ts` + `git commit -m "A11: Espacio con tokens y componentes base"`

---

### Task 12: Limpieza, verificación final y entrega

**Files:**
- Create: `front/tests/styles.cjs`
- Modify: `front/tests/run.cjs`, `DOCUMENTOS/V2/ROADMAP.md`, `CLAUDE.md` (raíz)
- Delete: `front/src/components/ui/Common.tsx`, `front/src/styles/globalStyles.ts`

- [ ] **Step 1: Escribir el test que falla** — `front/tests/styles.cjs`. Agregar `require("./styles.cjs")` en `run.cjs`.

```js
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path");
const front = path.resolve(__dirname, "..");
const files = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? files(path.join(d, e.name)) : /\.tsx?$/.test(e.name) ? [path.join(d, e.name)] : []);
// Solo interfaz: utils/ queda fuera porque model.ts guarda colores de espacios como datos.
const ui = [path.join(front, "App.tsx"), ...["components", "pages", "navigation"].flatMap((d) => files(path.join(front, "src", d)))];
test("estilos: sin valores sueltos en la interfaz", () => {
  const bad = [];
  for (const f of ui) {
    const text = fs.readFileSync(f, "utf8");
    for (const [name, re] of [["color", /#[0-9a-fA-F]{3,8}\b|rgba?\(/], ["fontSize", /fontSize\s*:\s*\d/], ["fontWeight", /fontWeight\s*:\s*["']?\d/]])
      if (re.test(text)) bad.push(`${path.relative(front, f)}: ${name}`);
  }
  assert.deepEqual(bad, []);
});
test("estilos: nadie importa Common ni globalStyles", () => {
  const bad = ui.filter((f) => /from ["'][^"']*(Common|globalStyles)["']/.test(fs.readFileSync(f, "utf8")));
  assert.deepEqual(bad, []);
});
```

- [ ] **Step 2: Run `npm test`.** Expected: FAIL, con la lista de archivos que aún importan `Common`/`globalStyles` o tienen literales.
- [ ] **Step 3: Migrar los imports restantes** de `Common` y `globalStyles` a `base` y `theme`, eliminar los literales que quedan y borrar `Common.tsx` y `globalStyles.ts`.
- [ ] **Step 4: Run `npm test`, `npm run typecheck` y `npm --prefix front run build:web`.** Expected: todo en verde.
- [ ] **Step 5: Revisión de accesibilidad** con la skill `design:accessibility-review` sobre las 5 pestañas, el editor y Ajustes a 375 × 812: contraste, áreas táctiles de 44 y etiquetas en los botones solo de ícono (pestañas, flechas del mes, enviar, +, círculos de completar). Corregir lo que encuentre y repetir el Step 4.
- [ ] **Step 6: Documentar.** En `ROADMAP.md`, el estado de A pasa a "Implementado; falta prueba en iPhone". En `CLAUDE.md` (sección Reglas) agregar 1 línea: "UI: usar `front/src/styles/theme.ts` y `front/src/components/ui/base/`; sin colores ni tamaños sueltos (lo verifica `tests/styles.cjs`)."
- [ ] **Step 7: Commit**

```bash
git add -A front/src front/tests DOCUMENTOS/V2/ROADMAP.md CLAUDE.md
git commit -m "A12: limpieza final, prueba de estilos sueltos y revisión de accesibilidad"
```

- [ ] **Step 8: Entrega para prueba en iPhone.** Pedir al usuario que corra `npm start`, abra Expo Go y revise:
  - la fuente;
  - las vibraciones al completar y al cambiar de pestaña;
  - cerrar paneles deslizando;
  - el teclado sobre el último campo del editor (Review Focus 2);
  - "Reducir movimiento" activado en iOS.

  Registrar lo que reporte; el subproyecto se cierra cuando lo apruebe.
