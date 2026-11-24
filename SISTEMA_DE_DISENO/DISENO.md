# Nekal · Sistema de diseño (documento maestro)

Actualizado el **14/11/2026**. Reúne lo que hoy es verdad en la app (código) y en las maquetas aprobadas. Donde algo es solo una propuesta, dice **(propuesta)**. Lo que cambió respecto de los documentos viejos está en [CONTRADICCIONES_Y_CAMBIOS.md](CONTRADICCIONES_Y_CAMBIOS.md).

> **Fuente de verdad del código:** `front/src/styles/theme.ts` y `front/src/components/ui/base/`. Esta carpeta guarda **copias** para consultar; si cambias el código, actualiza aquí (ver [README.md](README.md)).

---

## 1. Principios

- Dirección **B v3**: violeta sobre fondo lavanda muy claro, tarjetas blancas muy redondeadas con sombra suave, sensación de app de iPhone «pero no tan Apple».
- **Una sola cosa destacada por pantalla**; el resto liviano.
- Neka (la mascota) aparece como máximo **una vez por pantalla** y solo cuando comunica algo.
- Textos cortos y concretos, sin frases motivacionales genéricas. Tuteo, español neutro de Chile.
- El color **nunca** es la única señal: siempre va con texto o ícono.
- Todo sale de `theme.ts`: **no hay colores, tamaños de letra, espacios, radios ni sombras sueltos** (lo verifica `front/tests/styles.cjs`; copia en `tokens/`).
- Sin modo oscuro (fuera de alcance hasta hoy).

## 2. Colores

### 2.1 Base (`color` en theme.ts)

| Token | Valor | Uso |
|---|---|---|
| `primary` | `#7546EC` | Marca, selección, acción principal |
| `primarySoft` | `#EFE7FF` | Fondo de íconos, chips, tarjeta de Neka |
| `background` | `#FAF8FF` | Fondo de pantalla |
| `surface` | `#FFFFFF` | Tarjetas, paneles, barra inferior |
| `ink` | `#241D38` | Texto principal |
| `inkSecondary` | `#6F6683` | Texto de apoyo (≥ 4.5:1 sobre `background`) |
| `inkDone` | `#776E8A` | Cosas completadas (tachadas) |
| `line` | `#EEE9F6` | Divisores y bordes |
| `lineStrong` | `#948BA6` | Bordes de campos e interruptores apagados (≥ 3:1, WCAG 1.4.11) |
| `danger` / `dangerSoft` | `#B42A55` / `#FCE8EF` | Conflictos, errores, urgente |
| `success` | `#2F9E77` | Completado, confirmaciones |
| `warning` | `#E8962E` | Avisos |
| `onPrimary` | `#FFFFFF` | Texto sobre violeta |
| `backdrop` | `rgba(32,20,54,.35)` | Fondo atenuado tras paneles y modales |

### 2.2 Espacio (fase B)

| Token | Valor | Uso |
|---|---|---|
| `mapDot` | `#DBCEF6` | Decorativo del mapa (no es texto) |
| `mapEdge` | `#CFBAF6` | Decorativo del mapa |
| `cable` | `#B9A6F4` | Conexiones entre mesas |
| `vidrio` | `rgba(255,255,255,.18)` | Mesa «tranquila» en vidrio |
| `vidrioBorde` | `#D3C6F5` | Borde del vidrio |
| `sombraPiso` | `rgba(70,40,140,.20)` | Sombra de piso |

### 2.3 Gamificación (fase E)

- `medallaApagada` `#F6F3FC`: medalla aún no lograda.
- `heat` (heatmap «Tus días», de 0 a 4): `#EEE9F6` · `#DCCFFB` · `#BBA3F6` · `#9773F0` · `#7546EC`.

### 2.4 Colores de mesa (`COLORES_MESA` en `utils/colores.ts`)

Se guardan en cada mesa (`Workspace.color`) y solo se usan en puntos, franjas, anillos y detalles, nunca como fondo grande. De cada uno `tonos()` deriva el tono suave y los degradés.

| Mesa de ejemplo | Color |
|---|---|
| Violeta | `#7546EC` |
| Verde | `#2E9E6B` |
| Naranjo | `#D9693C` |
| Tranquila (gris) | `#948BA6` |

### 2.5 Colores que aparecen en maquetas pero **aún no existen en el código**

Maqueta `05-conexiones-correo-calendario.html` (aprobada 13/11). Hay que agregarlos a `theme.ts` cuando se construya H3 (si no, `tests/styles.cjs` los rechaza):

| Valor | Para qué se usa en la maqueta | Nombre sugerido |
|---|---|---|
| `#FFF4DF` | Fondo del aviso «Permiso vencido» y de la etiqueta de sol | `warningSoft` |
| `#8A5A00` | Texto de ese aviso (un ámbar oscuro: `warning` `#E8962E` no da contraste sobre claro) | `warningInk` |
| `#F4F1FB` | Fondo de una cifra destacada (`.hh-num`) | por decidir (¿`medallaApagada` `#F6F3FC`?) |

`#18161D` y `#ECEAF2` son solo el marco del teléfono de las maquetas; no son parte de la app.

## 3. Tipografía

Fuente: **Plus Jakarta Sans** (400, 500, 600, 700, 800), con `expo-font`. En React Native cada peso es una familia distinta: el componente `Txt` la resuelve. Cifras tabulares en horas.

| Estilo | Tamaño / peso / interlineado / tracking | Uso |
|---|---|---|
| `largeTitle` | 26 / 800 / 32 / −0.6 | Título de pantalla |
| `title` | 20 / 700 / 26 / −0.3 | Título de panel |
| `headline` | 15 / 700 / 20 / 0 | Encabezado de sección |
| `body` | 14 / 500 / 20 / 0 | Texto normal |
| `callout` | 13 / 500 / 18 / 0 | Horas y detalles |
| `caption` | 12 / 500 / 16 / 0 | Notas pequeñas |

Todo texto va con `Txt` (`variant`, `tone`, `weight`, `tabular`). Tonos: `ink`, `secondary`, `primary`, `danger`, `done`, `onPrimary`.

## 4. Espaciado, radios y sombras

- **Espaciado** (`space`): `xs 4` · `sm 8` · `md 12` · `lg 16` · `xl 20` · `xxl 24` · `xxxl 32` · `screen 18` (margen lateral).
- **Radios** (`radius`): `sm 12` (campos, chips pequeños, aviso) · `badge 14` (insignia de ícono) · `md 20` (tarjetas) · `lg 26` (tarjeta destacada, hojas) · `pill 999` (botones, chips, etiquetas).
- **Sombras** (`shadow`): `card` `0 6 20 rgba(90,51,164,.08)` · `raised` `0 12 32 rgba(40,20,90,.18)` (hojas y menús flotantes).

## 5. Tamaños (`size`)

Toque mínimo **44** · ícono 22 · ícono de pestaña 23 (activo 29) · barra inferior 56 · cierre de hoja arrastrando 120 px o 800 de velocidad · máximo de «Hoy» en el resumen 6.

## 6. Movimiento y vibración

- Resortes (`motion`): `gentle` (20 / 180 / 1) para hojas y tarjetas que se expanden; `snappy` (18 / 420 / 0.6) para el toque. Presionar escala a **0.97**; fundido 180 ms.
- Con «Reducir movimiento» no hay resortes ni escalas: solo fundidos (`useReducedMotion`).
- Vibraciones con `utils/haptics.ts` (en web no hacen nada): selección al cambiar de pestaña, éxito al completar o aceptar.
- CSS de las maquetas: `cubic-bezier(0.34, 1.56, 0.64, 1)` imita el resorte `snappy`.

## 7. Íconos

Solo **Ionicons de línea** (`*-outline`), 22–24 px, en `primary` o `ink`. Sin emojis ni íconos rellenos. Íconos de las 6 áreas: Estudio `school-outline` · Trabajo `briefcase-outline` · Salud `barbell-outline` · Hogar `home-outline` · Social `people-outline` · Personal `heart-outline`. Íconos de pestañas: Resumen `grid-outline` · Calendario `calendar-outline` · Espacio `git-network-outline` · Chat `chatbubble-outline` · Perfil `person-outline`.

## 8. Componentes base (`components/ui/base/`, copia en `componentes/base/`)

| Componente | Qué es |
|---|---|
| `Txt` | Único que dibuja texto; aplica la escala tipográfica. |
| `PressableScale` | Respuesta al toque (escala 0.97 con resorte; opacidad si hay «reducir movimiento»). |
| `Button` | `primary` (píldora violeta) · `secondary` (lavanda) · `danger` · `plain`. Alto mínimo 44. |
| `Card` | Superficie blanca radio 20 con sombra `card`; `featured` = lavanda, radio 26. |
| `Chip` | Filtro seleccionable (activo violeta lleno). |
| `Segmentos` | Cápsula lavanda con segmentos de texto; el activo, blanco con sombra (Mes · Agenda). |
| `Tag` | Etiqueta corta: `danger`, `primary`, `neutral`. |
| `Contador` | Número rojo sobre un ícono (solicitudes de amistad). |
| `IconBadge` | Ícono de línea violeta en cuadrado `primarySoft` (42 px, radio 14). |
| `Field` · `Toggle` | Campo de texto (alto 46, borde `lineStrong`, foco violeta) e interruptor. |
| `Disclosure` | Sección desplegable para explicaciones largas. |
| `EmptyState` | Pose de Neka + frase corta + acción opcional. |
| `Sheet` | Panel que sube desde abajo (radio 26 arriba, sombra `raised`); se cierra arrastrando, tocando el fondo o con «Cerrar». |
| `TabBar` | Barra inferior a todo el ancho, solo íconos; el activo más grande y violeta. |
| `ScreenHeader` · `SectionTitle` | Encabezado de pestaña (fecha + título grande + accesorio) y título de sección con detalle a la derecha. |
| `SyncBanner` | Aviso bajo el encabezado, **solo** cuando hay un problema de guardado. |
| `ListRow` | Hora + círculo de completar (con el color de la mesa) + título + `Tag`; toda la fila se toca. |
| `ProgressBar` | Barra de 10 px redondeada (`riel="blanco"` sobre tarjeta lavanda). |
| `LevelRing` | Nivel de la cuenta con su avance al siguiente. |
| `NekaCard` | Tarjeta destacada con la pose y el mensaje de Neka y sus botones. |
| `nekaImage` | Pose → imagen (ver §10). |

### Componentes por área

- **Espacio** (`componentes/espacio/`): `SelectorTiempo` (4 píldoras), `TiempoVista`, `HojaCosa`, `HojaCosas`, `HojaAtrasadas`, `MenuCrear`, `BarraSeleccion`, `ConectarCon`, `AvisoBorde`, `FormMesa`, `FormGrupo`, y el código de Mesas 3D (`Mesas*`) y Plano (`Plano*`, `FichaPlano`) que sigue en el repositorio pero **apagado**.
- **Neka** (`componentes/neka/`): `HojaPlan`, `TarjetaPlan`, `DiaPlan`, `CapaGrabando`, `InterruptorVoz`, `ChatSinIA`. Chat en `ChatUi/`.
- **Progreso** (`componentes/progreso/`): `TarjetaNivel`, `Medalla`, `GrillaLogros`, `HojaLogros`, `LogroNuevo` (modal), `Heatmap`, `TusDias`, `FilaMesa`, `Anillo`, `CurvaDesde`.
- **Amigos** (`componentes/amigos/`): `SeccionAmigos`, `HojaAmigos`, `FilaAmigo`, `FilaArea`, `PerfilAmigo`, `TarjetaSolicitud`, `Inicial`.
- **Cosas:** `ItemCard`, `ItemEditor` (hoja con tipo por `Chip`).

## 9. Marco y navegación

- Cinco pestañas: Resumen · Calendario · Espacio · Chat con Neka · Perfil. Barra inferior pegada abajo, fondo `surface`, borde superior `line`, respeta el área segura; inactivo 23 px `inkSecondary`, activo 29 px `primary`; área táctil ≥ 44; vibración de selección.
- Sin barra superior: cada pantalla usa `ScreenHeader`.
- `SyncBanner` solo ante: error de guardado, conflicto, sin conexión o cambios sin guardar.
- Hojas (`Sheet`): manija arriba, fondo atenuado con `backdrop`, adaptan al teclado; el botón «Cerrar» siempre existe.

## 10. Neka (la mascota)

Hay **18 poses** originales (`assets/neka-poses/`); la app usa **6**, cada una con significado fijo:

| Pose | Cuándo aparece |
|---|---|
| 1 | Todo listo por hoy (`listo`) |
| 3 | Saludo: cuenta nueva, día libre, sin amigos, invitado, bienvenida |
| 5 | Celebra un logro nuevo (modal `LogroNuevo`) |
| 7 | Pensando: hay cosas por revisar; armando un plan en el chat |
| 14 | Atención: conflicto, cosa vencida, pregunta por lo atrasado |
| 15 | Día con cosas pendientes (`dia`) |

Situaciones de `nekaState` (gana la primera que se cumple): `conflicto` · `pregunta` (cosa importante atrasada, de a una: Reprogramar / Ya la hice / Soltarla) · `vencido` · `revisar` · `nuevo` · `listo` · `dia` · `libre`.

Plan de Neka (fase H1): el plan explica por qué mueve cada cosa, avisa los choques sin bloquear, muestra «La agenda cambió» + «Pedir de nuevo» si la agenda cambia mientras lo miras, y propone mañana lo que no cabe hoy. Un fallo de IA aparece en el chat pero no se guarda en el historial.

## 11. Pantallas (`pantallas-referencia/`) y vistas vigentes

| Pantalla | Qué muestra hoy |
|---|---|
| **Resumen** | Saludo, `LevelRing`, `NekaCard`, «Lo siguiente», «Hoy» (máx. 6), «Progreso» y «Tus días» |
| **Calendario** | `Segmentos` **Mes · Agenda** (el Plano existe pero está apagado) + filtros con `Chip` |
| **Espacio** | **Solo el círculo del tiempo** (`SelectorTiempo`, burbujas «+N»). Mesas 3D y Plano apagados |
| **Chat** | Burbujas, propuestas con Aceptar / Descartar, voz y audio |
| **Perfil** | Nivel, logros, tus mesas con rating, amigos, sincronización |
| **Ajustes** | Listas agrupadas con `Disclosure`, abre como `Sheet` |
| **Bienvenida / Login** | Neka pose 3, `Field` y `Button` |

**Apagado con un flag** (`tokens/vistasActivas.ts` → `PLANO_ACTIVO = false`): el Plano no se veía bien en iPhone (2/11/2026). Nada se borró.

**Atrasada** = pendiente, con fecha y más de 2 días vencida. Es una regla derivada (no se guarda), no cuenta para el círculo, los choques ni Neka, y nunca se borra sola.

## 12. Gamificación, amigos y vocabulario visual

- **Nivel:** llegar al nivel n cuesta `50 · n · (n − 1)` puntos; `LevelRing` y `TarjetaNivel`.
- **Logros:** 25, `Medalla` violeta con ícono blanco y «Logrado»; gris con candado y anillo de avance si falta. Modal `LogroNuevo` con Neka pose 5; espera a que no haya hojas abiertas ni sincronización.
- **Heatmap «Tus días»:** 5 tonos según el % de lo que tenías ese día completado; un día suma a la racha desde el tono 2.
- **Rating por mesa:** 0 a 100 con anillo del color de la mesa y el ícono del área.
- **Amigos:** código de 6 caracteres; un amigo ve nivel, logros y áreas con promedio, **nunca** nombres de mesas ni cosas. Contador rojo en el botón de personas.
- **Glosario:** cosa/ítem, tipos (Nota, Idea, Evento, Visita, Meeting, Deadline, Goal, Tarea), mesa (**General** es la raíz), grupo, rutina, área, rating, fija/flexible, plan, choque, atrasada, racha.

## 13. Conexiones y primer uso (H3) — **aprobado el 13/11, aún sin construir**

Maqueta `05-conexiones-correo-calendario.html`:

- **Primer uso:** «Conecta tus cuentas» con Google y Outlook como dos filas grandes; «Ahora no» siempre visible; al volver de Google confirma lo traído y ofrece Outlook.
- **Ajustes → Cuentas conectadas:** estado de cada cuenta, destino de lo creado en Nekal (calendario «Nekal»), agregar otra; permiso vencido con botón grande de actualizar; desconectar confirma qué pasa con los eventos.
- **Calendario en espejo:** los eventos de afuera llevan ícono de calendario y logo de la cuenta; lo de Nekal copiado dice «en Google»; el detalle avisa que el cambio también llega a Outlook.
- **Correo con Neka:** solo lo importante (pide algo, pregunta, trae fecha o se relaciona con Nekal), texto simple sin rastreo, «Responder» y «Crear tarea»; Neka redacta un borrador editable y ofrece agendar la fecha. *(D1 en v2, 13/11: propuesta.)*
- **Tutorial guiado** (`04-…`, 6 pasos, la app se oscurece y se ilumina una cosa por paso): **propuesta sin aprobar**.
- **La pestaña Chat pasa a llamarse «IA»** (ícono de destellos) con un selector **Chat | Correo**. Hoy el código sigue con «Chat con Neka».
- Todo esto se ve junto en `maquetas/MEGA_MAQUETA/mega-maqueta-v2.html`, sección «Conexiones con Google y Outlook».

## 14. Accesibilidad

Contraste ≥ 4.5:1 en texto normal; bordes de campo ≥ 3:1; toque ≥ 44; `accessibilityLabel` en todo botón de ícono; arrastrar nunca es la única forma de cerrar; «Reducir movimiento» respetado; nada depende solo del color.

## 15. Cómo se mantiene

Ver [README.md](README.md): cada cambio de diseño se anota en [REGISTRO_DE_CAMBIOS.md](REGISTRO_DE_CAMBIOS.md) y se actualiza esta carpeta.
