# V2 · Subproyecto A — Sistema de diseño

Especificación aprobada en brainstorming el 15 de octubre de 2026. Parte del [ROADMAP](ROADMAP.md) (semanas 1–2).

Maqueta de referencia aprobada: [A_MAQUETA/resumen-b-v3.html](A_MAQUETA/resumen-b-v3.html) (dirección **B v3**).

## 1. Objetivo

Dar a Nekal una identidad visual propia y una sensación de app de iPhone, sin perder lo que ya funciona (violeta, lavanda, Neka, 5 secciones).

Problemas que resuelve, según el usuario:

- Demasiada información junta en cada pantalla.
- Textos de relleno con tono genérico de IA ("Haz espacio para lo importante", "Un paso a la vez").
- Se ve genérica y plana.
- No se siente como app de iPhone (sin animaciones, ventanas a pantalla completa, sin gestos).

Problemas detectados en el código:

- 12 tamaños de letra distintos y ~40 colores escritos a mano fuera de `globalStyles.ts`.
- La barra inferior usa un violeta distinto al principal (`#7B5CFA` frente a `#7546EC`).
- Fuente del sistema, sin tipografía propia.
- Reanimated y Gesture Handler instalados pero sin usar; `GestureHandlerRootView` no está montado.

Referencias del usuario: app nativa de Apple "pero no tan Apple"; mascota presente pero no infantil ni recargada de color; la claridad de Structured; nada tan cuadrado y rígido como Things 3 o Notion. Se permite reemplazar partes del diseño actual si hace falta.

## 2. Dirección visual (B v3)

- Fondo lavanda muy claro, tarjetas blancas con sombra suave y esquinas redondeadas.
- Fuente redondeada propia (Plus Jakarta Sans).
- Una sola cosa destacada por pantalla; el resto liviano.
- Neka aparece en una tarjeta principal y reacciona a la situación.
- Nivel en un círculo arriba a la derecha; tarjeta "Progreso" con barra gruesa (crecerá con la gamificación, subproyecto E).
- Barra inferior a todo el ancho, pegada abajo, **solo íconos**; el activo más grande y violeta.
- Pocos íconos, siempre de línea simple y violeta.

## 3. Base visual (tokens)

Archivo único: `front/src/styles/theme.ts`. Ninguna pantalla ni componente usa colores, tamaños de letra, espaciados, radios ni sombras fuera de este archivo.

### Colores

| Token | Valor | Uso |
|---|---|---|
| `primary` | `#7546EC` | Marca, selección, acciones principales |
| `primarySoft` | `#EFE7FF` | Fondos de íconos, chips, tarjeta de Neka |
| `background` | `#FAF8FF` | Fondo de pantalla |
| `surface` | `#FFFFFF` | Tarjetas, paneles, barra inferior |
| `ink` | `#241D38` | Texto principal |
| `inkSecondary` | `#6F6683` | Texto secundario (contraste ≥ 4.5:1 sobre `background`) |
| `inkDone` | `#776E8A` | Ítems completados (tachados) |
| `line` | `#EEE9F6` | Divisores y bordes |
| `danger` / `dangerSoft` | `#B42A55` / `#FCE8EF` | Conflictos, errores |
| `success` | `#2F9E77` | Completado |
| `warning` | `#E8962E` | Avisos |

Los colores de cada espacio se mantienen (campo `color` del espacio) y solo se usan en puntos, franjas y detalles, nunca como fondo de bloques grandes. El color nunca es el único indicador: siempre va con texto o ícono.

### Tipografía

Fuente: **Plus Jakarta Sans** (pesos 400, 500, 600, 700, 800), cargada con `expo-font` y `@expo-google-fonts/plus-jakarta-sans`. En React Native cada peso es una familia distinta: el componente `Txt` resuelve la familia según el estilo.

| Estilo | Tamaño / peso | Uso |
|---|---|---|
| `largeTitle` | 26 / 800 | Título de pantalla ("Hola, Sofía") |
| `title` | 20 / 700 | Título de panel |
| `headline` | 15 / 700 | Encabezados de sección ("Lo siguiente", "Hoy") |
| `body` | 14 / 500 | Texto normal |
| `callout` | 13 / 500 | Horas, detalles |
| `caption` | 12 / 500 | Notas pequeñas |

Mínimo absoluto: 11 px. Las horas usan cifras tabulares.

### Espaciado, radios y sombras

- Espaciado en pasos de 4: `4 · 8 · 12 · 16 · 20 · 24 · 32`. Margen lateral de pantalla: 18.
- Radios: `sm 12` (campos, chips), `md 20` (tarjetas), `lg 26` (tarjeta de Neka), `pill 999` (botones píldora).
- Sombras: `card` (suave, para tarjetas) y `raised` (para paneles y elementos flotantes).

### Movimiento

- `spring.gentle`: paneles, tarjetas que se expanden.
- `spring.snappy`: respuesta al toque.
- Si el sistema tiene "Reducir movimiento", los resortes se reemplazan por fundidos cortos (`useReducedMotion` de Reanimated).

## 4. Componentes base

Carpeta nueva `front/src/components/ui/base/`, un componente por archivo y un `index.ts`. Todos usan solo tokens del tema.

| Componente | Responsabilidad |
|---|---|
| `Txt` | Texto con `variant` de la tabla tipográfica y `tone` (`ink`, `secondary`, `primary`, `danger`, `done`). No acepta `fontSize` libre. |
| `ScreenHeader` | Fecha pequeña opcional + título grande + accesorio a la derecha (por ejemplo `LevelRing`). |
| `Card` | Superficie blanca con radio `md` y sombra `card`. Variante `featured` con degradado lavanda. |
| `NekaCard` | Mensaje + botón opcional + pose de Neka. Recibe un `NekaState` (sección 7). |
| `Button` | Variantes `primary` (píldora violeta), `secondary` (lavanda), `danger`, `plain`. Tamaños normal y pequeño. Al tocar escala a 0.97 con `spring.snappy`. Altura mínima 44. |
| `Chip` | Filtro seleccionable. |
| `Tag` | Etiqueta corta con color y texto ("Choca", "Urgente", "Vencida"). |
| `ListRow` | Hora + punto de color + título + `Tag` opcional; tachado si está completado. Toda la fila es tocable. |
| `IconBadge` | Ícono Ionicons de línea, violeta, en cuadrado `primarySoft` de radio 14. |
| `ProgressBar` | Barra de 10 px, redondeada, con degradado violeta. |
| `LevelRing` | Círculo con el nivel y el avance al siguiente. |
| `Field`, `Toggle` | Campos de texto y switches con el estilo nuevo. |
| `EmptyState` | Pose de Neka + una frase corta + acción opcional. |
| `Sheet` | Panel que sube desde abajo (sección 5). |
| `TabBar` | Barra inferior (sección 5). |
| `SyncBanner` | Aviso de sincronización (sección 5). |

Regla de íconos: solo **Ionicons de línea** (`*-outline`), 22–24 px, en `primary` o `ink`. Sin emojis ni íconos rellenos.

`Common.tsx` y `globalStyles.ts` siguen funcionando durante la migración y se eliminan cuando ninguna pantalla los use.

## 5. Navegación y marco

### Barra superior

Se elimina `Topbar` (logo, Neka, avatar y textos de estado). Cada pantalla usa `ScreenHeader`.

### Aviso de sincronización (`SyncBanner`)

Aparece bajo el encabezado **solo cuando hay un problema**, usando los datos existentes de `AppContext` (`error`, `conflict`, `cloudStatus`, `pendingChanges`). No cambia `SyncEngine`.

| Situación | Texto | Acción |
|---|---|---|
| `error` presente | "No se pudo guardar." | Reintentar |
| `conflict` presente | "Hay cambios en conflicto." | Revisar → Perfil |
| `cloudStatus` empieza con "Sin conexión" | "Sin conexión · N cambios guardados en este dispositivo" | — |
| `cloudStatus` = "Cambios sin guardar" | "Cambios sin guardar. Exporta un respaldo." | Ajustes |

En cualquier otro estado (sincronizado, guardando, sincronizando, modo local) no se muestra. El detalle completo sigue en Perfil. El modal "Sincronizando con Firebase…" de `AppNavigator` se mantiene, con el estilo nuevo.

### Barra inferior (`TabBar`)

- Todo el ancho, pegada abajo, fondo `surface`, borde superior `line`, respeta el área segura.
- Solo íconos (Ionicons de línea): Resumen `grid-outline`, Calendario `calendar-outline`, Espacio `git-network-outline`, Chat `chatbubble-outline`, Perfil `person-outline`.
- Inactivo: 23 px, `inkSecondary`. Activo: 29 px, `primary`, transición con `spring.snappy`.
- Cada pestaña mantiene `accessibilityRole="tab"`, `accessibilityLabel` y `accessibilityState`. Área táctil ≥ 44.
- Vibración de selección al cambiar de pestaña (iPhone).

### Paneles (`Sheet`)

Reemplaza el `Sheet` actual de pantalla completa. Lo usan el editor de ítems, Ajustes y los formularios.

- Sube con `spring.gentle`; fondo oscurecido.
- Manija visible arriba; se cierra arrastrando hacia abajo (umbral de distancia o velocidad), tocando el fondo o con el botón "Cerrar".
- Se adapta al teclado.
- Hecho con Reanimated + Gesture Handler (sin librería extra) para que funcione igual en web y en iPhone. Se monta `GestureHandlerRootView` en `App.tsx`.
- Accesible: el botón "Cerrar" siempre existe; arrastrar nunca es la única forma de cerrar.

## 6. Movimiento y vibraciones

- Toques: escala 0.97 con `spring.snappy` en lugar de bajar opacidad.
- Completar una tarea: el check se llena con resorte, el título se tacha y vibra con "éxito".
- Cambiar de pestaña: vibración de selección.
- Vibraciones con `expo-haptics`, encapsuladas en `front/src/utils/haptics.ts` (en web no hace nada).
- "Reducir movimiento" activo: sin resortes ni escalas; solo fundidos.

## 7. Neka según la situación

Función pura nueva `nekaState(data: AppData, now: number): NekaState` en `front/src/utils/neka.ts`, con pruebas.

```ts
type NekaState = {
  kind: "conflicto" | "vencido" | "revisar" | "nuevo" | "listo" | "dia" | "libre";
  pose: 1 | 3 | 7 | 14 | 15; // archivo front/assets/Img/Neka_Pose{n}.png
  message: string;
  action?: { label: string; target: "chat" | "crear" | "item"; itemId?: string };
};
```

"Ítems de hoy": activos, accionables (no Nota ni Idea), con `scheduledAt` o `dueAt` en el día local actual.

Se evalúa en este orden y gana la primera regla que se cumple:

| # | Condición | kind | Pose | Mensaje (ejemplo) | Acción |
|---|---|---|---|---|---|
| 1 | Hay un conflicto `overlap` con algún ítem de hoy | `conflicto` | 14 | "A las 14:00 se te juntan «Revisión de sprint» y «Clase de estadística»." | Resolver → chat |
| 2 | Hay ítems no completados con `dueAt` vencido | `vencido` | 14 | "Se te pasó «Entrega del informe»." / "Tienes 3 entregas vencidas." | Ver → item (si es uno) / chat |
| 3 | Hay otros conflictos (`dependency`, `capacity`, `deadline`, superposiciones de otros días) | `revisar` | 7 | "Encontré 2 cosas por ordenar." | Revisar → chat |
| 4 | No existe ningún ítem activo | `nuevo` | 3 | "Hola, soy Neka. Crea tu primera tarea y te ayudo a ordenarla." | Crear tarea → crear |
| 5 | Hay ítems de hoy y todos están completados | `listo` | 1 | "Listo por hoy. Sumaste 40 puntos." | — |
| 6 | Hay ítems de hoy pendientes | `dia` | 15 | "Hoy tienes 4 cosas. La siguiente es a las 16:00." | — |
| 7 | No hay ítems para hoy | `libre` | 3 | "Hoy no tienes nada agendado." | Crear → crear |

Detalles:

- Singular y plural correctos ("1 cosa", "4 cosas").
- Horas en formato local 24 h (`HH:mm`).
- "Puntos de hoy": suma de recompensas con fecha de hoy, excluyendo las claves `:budget` (misma regla que los puntos semanales actuales).
- Si el ítem siguiente no tiene hora, el mensaje omite "La siguiente es a las…".

Reglas de presencia: Neka aparece como máximo una vez por pantalla y solo cuando comunica algo. En el Chat usa la pose 7 mientras arma una propuesta.

## 8. Textos

Reglas:

- Cortos: una oración por tarjeta; títulos de 1 a 3 palabras.
- Concretos: horas, números y nombres; sin eslóganes ni frases motivacionales genéricas.
- Botones con verbo directo ("Resolver", "Crear tarea", "Mover", "Aceptar", "Descartar").
- Errores: qué pasó + qué hacer.
- Explicaciones largas fuera de la vista principal, en desplegables (por ejemplo "¿Cómo se calculan los puntos?").
- Tuteo, español neutro de Chile.

Se revisan con la skill `design:ux-copy` al reescribir cada pantalla.

| Actual | Nuevo |
|---|---|
| "Un paso a la vez. Haz espacio para lo importante." | Mensaje de Neka según la sección 7 |
| "TU CAMINO CON NEKA · 0 puntos" | Tarjeta "Progreso": "Nivel 4 · 340 pts" |
| "Revisamos superposiciones, plazos y dependencias cada vez que cambias tus ítems." | Se elimina |
| "ESPACIO PARA LO IMPORTANTE" | Se elimina con la barra superior |
| "Una mirada tranquila a lo que viene." | Se elimina |
| "Una organización que se adapta a ti." | Se elimina |

## 9. Pantallas

| Pantalla | Cambios |
|---|---|
| **Resumen** | Rehecha según la maqueta B v3: `ScreenHeader` con fecha, "Hola, {primer nombre}" (solo "Hola" si el perfil no tiene nombre) y `LevelRing`; `NekaCard`; "Lo siguiente" (`Card` con `IconBadge` del tipo de ítem y "en X min"); "Hoy" con `ListRow` y contador "N de M listo"; "Progreso" con `ProgressBar`. Se quitan "Progreso por espacio", la lista "Prioridades" y la tarjeta de conflictos (los cubre Neka). |
| **Calendario** | `ScreenHeader`; mes con el estilo nuevo (día seleccionado en `primary`, hoy marcado); filtros como `Chip`; lista del día con `ListRow`. |
| **Chat (Neka)** | Burbujas con el estilo nuevo; propuestas de reorganización como `Card` con **Aceptar** / **Descartar**; Neka en pose 7 mientras propone. |
| **Perfil** | Listas agrupadas tipo Ajustes de iPhone; estado de sincronización y revisión de conflictos con el estilo nuevo. |
| **Ajustes** | Listas agrupadas; explicaciones largas (fórmula de puntos, privacidad) en desplegables; se abre como `Sheet`. |
| **Bienvenida / Inicio de sesión** | Neka pose 3 saludando, menos texto, `Field` y `Button` nuevos. |
| **Editor de ítems** | Se abre como `Sheet`; tipo de ítem con `Chip`; secciones claras por tipo. Si ayuda a la claridad, `ItemEditor.tsx` (571 líneas) se divide en archivos por sección. |
| **Espacio** | Solo tokens, `TabBar`, `Sheet` y textos. El mapa se rediseña en el subproyecto B. |

## 10. Dependencias nuevas

- `@expo-google-fonts/plus-jakarta-sans` (y `expo-font` si no viene incluido).
- `expo-haptics`.

Ambas deben funcionar en Expo Go con el SDK 57. Se verifica la versión compatible en la documentación de Expo v57 (MCP `context7`) e instalando con `npx expo install` antes de usarlas.

## 11. Orden de implementación

Cada paso deja la app funcionando y termina con un commit en el git local.

1. **Base:** `theme.ts`, carga de fuente (la app espera a que cargue antes de mostrarse), presets de movimiento, `haptics.ts`, `GestureHandlerRootView` y componentes base.
2. **Marco:** `TabBar`, eliminación de `Topbar`, `SyncBanner`, `Sheet`; el editor de ítems abre como panel.
3. **Resumen** con `nekaState`.
4. **Calendario.**
5. **Chat.**
6. **Perfil y Ajustes.**
7. **Bienvenida e inicio de sesión.**
8. **Editor de ítems.**
9. **Espacio** (solo estilo).
10. **Limpieza:** eliminar `Common.tsx` y `globalStyles.ts`; comprobar que no quedan colores (`#…`) ni `fontSize` fuera de `theme.ts`.

## 12. Pruebas y criterios de aceptación

Pruebas:

- `nekaState`: pruebas unitarias escritas antes del código (TDD) en `front/tests/neka.cjs`, agregando `neka.ts` a la compilación de `front/tests/run.cjs`. Cubren las 7 reglas, su prioridad, singular/plural, ítem siguiente sin hora y puntos de hoy.
- En cada paso: `npm test`, `npm run typecheck` y `npm --prefix front run build:web`.
- Visual: cada pantalla revisada en el navegador a 375 × 812 y comparada con la maqueta.
- Accesibilidad: contraste ≥ 4.5:1 en texto normal, áreas táctiles ≥ 44, `accessibilityLabel` en elementos sin texto; revisión final con `design:accessibility-review`.
- iPhone: prueba del usuario en Expo Go al final (también cierra el pendiente de V1).

El subproyecto está listo cuando:

- Todas las pantallas usan los componentes base y los tokens; no quedan colores ni tamaños de letra sueltos.
- El Resumen coincide con la maqueta B v3.
- No hay barra superior; el aviso de sincronización aparece solo ante problemas.
- Los paneles suben desde abajo y se cierran deslizando, tocando el fondo o con "Cerrar".
- Hay animaciones de resorte, vibraciones en iPhone y se respeta "Reducir movimiento".
- Los textos siguen las reglas de la sección 8.
- `npm test`, `typecheck` y `build:web` pasan.
- El usuario lo probó en su iPhone con Expo Go.

## 13. Fuera de alcance

- Modo oscuro.
- Rediseño del mapa del Espacio y "General como raíz" (subproyecto B).
- Visual de logros, rating y heatmap (subproyecto E); la tarjeta "Progreso" queda preparada para crecer.
- Funciones nuevas o cambios en sincronización, modelo de datos o reglas de Firestore.

## 14. Riesgos

- **Fuente en web:** sin esperar la carga se ve un salto de letra; se resuelve mostrando la pantalla de carga hasta que la fuente esté lista.
- **Reanimated 4 en web:** confirmar que los resortes y gestos del `Sheet` funcionan en `npm run web` antes de migrar todas las ventanas.
- **`Modal` en web:** hoy `Sheet` desactiva la animación en web; el panel nuevo debe probarse en ambas plataformas.
- **Editor de ítems:** es el archivo más grande; dividirlo puede afectar el flujo de guardado. Se mantiene la lógica (`saveItem` y validaciones) intacta y solo cambia la presentación.
