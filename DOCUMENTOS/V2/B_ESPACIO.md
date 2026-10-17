# V2 · Subproyecto B — Espacio

Especificación del diseño aprobado en brainstorming entre el 16 y el 17 de octubre de 2026. Parte del [ROADMAP](ROADMAP.md).

- Notas del brainstorming: [B_NOTAS_BRAINSTORMING.md](B_NOTAS_BRAINSTORMING.md)
- Maquetas (no se borran): [B_MAQUETA/](B_MAQUETA/). Base visual aprobada: **05** (las vistas), **06** (cómo se ve cada cosa e interacción) y **07** (ajustes finales).
- Sistema visual para pasar a Figma: [B_SISTEMA_VISUAL.md](B_SISTEMA_VISUAL.md)

## 1. Objetivo

El Espacio es "el calendario que tu cabeza entiende": ver todo sin saturar, organizar con libertad, planificar a la manera de cada uno (calendario, proyectos, notas, ideas) y que impresione siendo tranquilo y ordenado. Quien llegue con sus cosas debe encontrarlas acomodadas solas y después ajustarlas.

Hoy el Espacio es un mapa de un solo espacio a la vez, con posiciones a mano (x/y) y espacios planos. Se reemplaza por completo.

## 2. Estructura (aprobada)

| Concepto | Qué es | Reglas |
|---|---|---|
| **General** | La mesa principal. Una por persona; contiene todo. | No se borra ni se renombra su id (`general`). |
| **Mesa** | Un área de la vida o un proyecto grande: Trabajo, Universidad, Proyecto 4. | Vive dentro de General. **Un solo nivel**: no hay mesas dentro de mesas. "Mesa nueva" solo se ofrece en General. Es la unidad que se compartirá en el subproyecto G. |
| **Grupo** | Un conjunto de cosas dentro de una mesa (materia, lanzamiento, operación). | Vive en una mesa (General incluida). Puede tener **grupos dentro, sin límite**. El padre debe estar en la misma mesa; no se permiten ciclos. |
| **Rutina** | Un grupo que **se repite** (cada día, cada semana, ciertos días). | Igual que un grupo, más su repetición (§2.1). |
| **Cosa** (ítem) | Los 8 tipos actuales. | Vive en una mesa y, opcionalmente, en un grupo o rutina. Se conecta con cualquier cosa de cualquier mesa (dependencias actuales). |

### 2.1 Rutinas que se repiten (versión simple)

- Frecuencias: **cada día**, **cada semana** (el día de la semana de inicio) o **ciertos días** (lunes a domingo).
- Las cosas que están **directamente en la rutina** son el **modelo**: definen qué se repite y a qué hora. El modelo no aparece en Tiempo, Resumen, Calendario, Neka ni en el puntaje.
- Cada vez que toca, se crea una **ocurrencia**: un subgrupo de la rutina con id determinista `<idRutina>~<AAAA-MM-DD>` y nombre `<Rutina> · <día>`, con copias del modelo en ese día (misma hora y duración). Las dependencias entre cosas del modelo se reconectan dentro de la ocurrencia, como en el "Reutilizar" de la V1.
- Se generan las ocurrencias que falten **desde hoy hasta 6 días más**, al abrir la app o volver a ella. El id determinista evita duplicados entre dispositivos.
- Una ocurrencia anterior sin completar no bloquea la siguiente: queda como cualquier cosa atrasada.
- En Mesas y Plano, una rutina muestra solo sus ocurrencias de hoy en adelante y las atrasadas sin completar. Las pasadas completas se juntan en "Anteriores" para no llenar la vista.
- "Aplicar ahora" (el "Reutilizar" de la V1) se mantiene para cualquier grupo.
- Fuera de alcance: cada mes, excepciones, terminar en una fecha.

### 2.2 Datos y migración

- `workspaces` (mesas) **no cambia** de forma: toda mesa que no sea `general` es secundaria.
- `groups` agrega: `parentId` (`""` = grupo raíz de su mesa), `repeat` (`"" | "diario" | "semanal" | "dias"`), `repeatDays` (números 0–6) y `repeatStart` (fecha ISO). Que `repeat` no esté vacío convierte el grupo en rutina.
- Ítems: **sin campos nuevos**. `x` pasa a guardar el **orden de la ficha** en Plano dentro de su grupo o mesa; `y` queda en 0. Así no cambia la regla de Firestore de ítems.
- `AppData.version` pasa de 1 a **2**, con una función pura `migrarV1aV2`:
  - grupos con los campos nuevos vacíos;
  - `x` reasignado como orden (de arriba hacia abajo y de izquierda a derecha según la posición vieja);
  - `y = 0`.
  
  Se aplica al cargar datos locales, al importar un respaldo (se aceptan v1 y v2) y al leer registros de la nube.
- Antes de migrar se guarda un **respaldo automático** local.
- **Reglas de Firestore:** el registro `groups` agrega los 4 campos. Hay que **publicar las reglas** (`npm run deploy`) antes de probar sincronización real con grupos nuevos. Ese paso se pide explícitamente al usuario; no se hace solo.

## 3. Las tres vistas (aprobadas)

Muestran los **mismos datos** y cada una tiene una protagonista. Un botón de tres segmentos arriba a la derecha cambia entre ellas (íconos: órbita · cubo · mapa). Comparten:

- el **selector de tiempo**: Hoy · Semana · 2 semanas · Todo. Lo que no tiene fecha o está en curso se ve siempre;
- la **hoja** al tocar;
- el menú de **crear**;
- la **selección múltiple**;
- el **idioma visual** (§4).

La app recuerda en el dispositivo la última vista y el último tiempo elegido. La primera vez abre en **Mesas, en General**.

### 3.1 Tiempo: "cuándo" (2D)

- Hoy al centro. Los anillos son **mañana**, **el resto del tiempo elegido** y, afuera, **sin fecha o en curso**.
- Cada mesa es una **porción del círculo**, y General tiene la suya para sus cosas sueltas. Los grupos no cambian la forma; lo de una rutina aparece en cada día que toca.
- **No aparecen notas ni ideas**, porque no son de tiempo.
- La posición es la fecha. **Mantener y arrastrar** hacia el centro o hacia afuera cambia la fecha: encaja en cada día, vibra en cada encaje y muestra la fecha mientras se arrastra. Soltar en el anillo de afuera deja la cosa sin fecha.
- Pellizcar cambia el tiempo elegido (es el mismo selector).

### 3.2 Mesas: "cómo está armado y cuánto pesa" (3D)

- **Todo en el mismo eje:**
  - **General** arriba al centro, con sus cosas como **cubitos conectados** y las **fuentes** conectadas desde afuera. En B solo hay una fuente real: **Neka** (el chat). **Google Calendar** se agrega en el subproyecto C. No se muestran fuentes falsas.
  - Debajo, las **mesas**, alrededor del mismo eje.
  - Al acercarse a una mesa, aparecen sus **grupos** como pisos debajo; al seguir acercándose, los subgrupos, sin límite.
- **Mesa = piso grueso** con borde en degradé de su color. **Grupo = piso delgado. Rutina = piso delgado con ↻.**
- El tamaño de cada piso **depende de cuánto contiene**, con mínimo y máximo para que nada tape al resto.
- **La altura de un cubito es su carga** (§4.2). Notas e ideas son planas. Al completar algo, el cubito **baja hasta quedar plano** y la mesa adelgaza. El grosor de una mesa refleja su carga pendiente.
- Los puntos dentro de un piso lejano son las cosas, en cúmulos con conexiones (maqueta 02).
- **Al bajar a una mesa o grupo:**
  - lo de arriba se vuelve un **vidrio** casi transparente;
  - las mesas no relacionadas se apagan o desaparecen;
  - las relacionadas por una conexión se mantienen visibles, unidas por un cable.
- Gestos:
  - un dedo recorre;
  - **dos dedos giran** alrededor del eje e inclinan (inclinación limitada);
  - pellizcar acerca y aleja;
  - **tocar una mesa o grupo baja a ella**;
  - "‹ volver" sube.
- Las conexiones entre mesas se ven siempre como **cables**. Se crean desde la hoja ("Conectar con…"), no arrastrando en 3D.

### 3.3 Plano: "tu orden" (2D)

- **De lejos**, que es como parte siempre al entrar a Plano:
  - las cosas sueltas de General arriba;
  - cada mesa como un **bloque de color**, con sus grupos como bloques adentro;
  - las cosas como **puntos con conexiones**, no fichas.
- **De cerca**, al tocar un bloque para entrar:
  - **fichas ordenadas** en grilla (maqueta 05): ícono, título, dato útil, barra de avance y marca de carga;
  - los grupos como zonas suaves, y las notas e ideas junto a las tareas;
  - lo que no cabe queda en "+ N más".
- Es la vista donde **tú decides el orden**:
  - mantener y arrastrar una ficha la reordena (cambia `x`);
  - si cae en otra zona, cambia de grupo o de mesa;
  - arrastrar desde el puntito de una ficha hasta otra la conecta.
- Una idea convertida en tarea queda conectada a su idea.

### 3.4 Común a las tres

- **Tocar** una cosa abre la **hoja**: el `ItemEditor` actual dentro del `Sheet` del sistema A, con editar, completar, conectar y borrar. Además:
  - se dibujan sus **conexiones** en la vista actual, incluso hacia otras mesas, con un aviso en el borde ("2 en Estudios ›") si quedan fuera de pantalla;
  - la hoja tiene **"Ver dónde está"**, que abre Plano en su grupo.
- **Crear** es **igual en las tres**:
  - los 8 tipos, más **Rutina**, más **Mesa** (esta última solo en General);
  - la vista solo **rellena lo suyo**: Tiempo, la fecha del anillo tocado; Mesas y Plano, la mesa, el grupo y el lugar;
  - una nota o idea creada desde Tiempo queda en la mesa en que estás, y un aviso dice dónde quedó.
- **Selección múltiple:**
  - mantener presionado **sin mover** entra en modo selección (con vibración);
  - mantener **y mover** arrastra;
  - con varias elegidas se puede juntarlas en una rutina o grupo, sacarlas, moverlas a otra mesa o conectarlas.

## 4. Idioma visual

### 4.1 Igual en las tres vistas

| Señal | Significa |
|---|---|
| Ícono | Tipo de cosa |
| Encendido / tenue | Dentro o fuera del tiempo elegido |
| Hueco | Sin fecha |
| Apagado con ✓ | Completada |
| Borde punteado | Bloqueada (espera algo) |
| Anillo violeta | Seleccionada |
| Etiqueta "Urgente" | Prioridad urgente |
| ●●○ | Carga (en fichas) |
| Color | Mesa. Los colores son provisorios: su significado se define después y queda fuera de B |

**Regla:** la forma y la posición son solo para la pregunta de cada vista. El resto va como marcas iguales en las tres.

**Escalera de lectura:**
- lejos, un punto con color y encendido;
- a media distancia, un punto con ícono;
- cerca, la ficha o cubito con todo.

### 4.2 Carga

`cargaDe(item)`:
- **0** si es Nota, Idea, completada o borrada;
- en otro caso, `dificultad × clamp(duración/60, 0.25, 4)`, con la dificultad de `difficultyOf`.

Se usa para la altura en Mesas y las marcas ●●○ en Plano. La carga de una mesa o grupo es la suma de lo pendiente que tiene dentro.

## 5. Cómo se construye

Unidades, de abajo hacia arriba:

1. **Datos** (`utils/model.ts`, `storage.ts`, `syncModel.ts`, `cloudRecords.ts`, `back/firestore.rules`): campos nuevos de grupos, `migrarV1aV2` y validaciones:
   - "Mesa nueva" solo en General;
   - el padre de un grupo debe estar en la misma mesa;
   - sin ciclos.
2. **Cerebro común** (`utils/espacio.ts`, puro): árbol mesa → grupos → cosas; filtro del tiempo elegido y "siempre visible"; `cargaDe`; conexiones de una cosa (requisitos y dependientes, cualquier mesa); `esModelo(item)`.
3. **Rutinas** (`utils/rutinas.ts`, puro): ocurrencias que faltan en una ventana de fechas, con id determinista. Los filtros de tiempo de Resumen, Calendario, Neka y puntaje excluyen el modelo.
4. **Acomodo** (`utils/acomodo/`, puro, sin React):
   - `tiempo`: ángulo por mesa y radio por día, con encaje;
   - `plano`: tamaño de zonas y grilla de fichas según `x`;
   - `mesas`: pisos en el eje común, tamaño según contenido, proyección 3D propia (giro, inclinación, zoom) y `elegir(x, y)` para saber qué se tocó.
5. **Piezas de pantalla** (`components/ui/espacio/`, con los tokens del sistema A):
   - botón de 3 vistas;
   - selector de tiempo;
   - hoja de cosa;
   - menú crear;
   - barra de selección múltiple;
   - capa de conexiones;
   - aviso de borde.
6. **Vistas**:
   - `Tiempo` (SVG, puntos tocables como vistas reales);
   - `Plano` (vistas reales y SVG para las curvas);
   - `Mesas` (**Skia**, `@shopify/react-native-skia`, dibujando la proyección del punto 4).
   
   `EspacioTrabajo.tsx` pasa a ser la pantalla contenedora. Se eliminan `CanvasContent`, `InfiniteCanvas`, `WorkspaceBar`, `ZoomControl` y `AddFab` cuando ya no se usen.

**Decisión 3D:** falso 3D calculado por nosotros y dibujado con Skia. Se confirma con una **prueba de 1–2 días en el iPhone y en web** (fluidez al girar y nitidez del texto) antes de construir la vista completa. Plan B: el mismo cálculo dibujado con `react-native-svg`. El usuario probará Skia un tiempo y podría pedir cambiar a three.js. Para eso la proyección y el acomodo quedan separados del dibujo.

**Gestos y movimiento:** Gesture Handler y Reanimated, como en el sistema A. Vibración al encajar y al seleccionar. Con "reducir movimiento" activado, se respeta y no hay giros animados.

**Accesibilidad:**
- Plano es la base accesible, porque usa vistas reales.
- En Tiempo, los puntos son vistas tocables con nombre.
- En Mesas, una capa invisible de vistas con nombre sobre lo visible permite usar VoiceOver, y cada piso dice su nombre y cuántas cosas tiene.
- Áreas táctiles de 44 pt mínimo.

**Rendimiento:** hasta unas 300 cosas. Mesas dibuja solo el piso actual, uno más abajo y el vidrio de arriba. Objetivo: giro fluido en el iPhone.

## 6. Pruebas

En el runner propio (`npm test`), escritas antes del código (TDD):

- migración v1 → v2 (local, respaldo y nube) sin pérdida de datos;
- validaciones de estructura (mesa solo en General, padre en la misma mesa, sin ciclos);
- rutinas:
  - diaria, semanal y ciertos días;
  - id determinista sin duplicados;
  - el modelo no aparece en los filtros de tiempo;
- filtro del tiempo elegido y "siempre visible";
- `cargaDe` y carga de mesa o grupo;
- conexiones entre mesas;
- acomodo:
  - encaje por día en Tiempo;
  - grilla y orden en Plano;
  - tamaño, proyección y `elegir` en Mesas.

Más `npm run typecheck`, `build:web`, `tests/styles.cjs` (sin colores ni tamaños sueltos), revisión visual en web a 375×812 y **prueba en iPhone**.

## 7. Orden y semanas

| Semana | Qué |
|---|---|
| 1 · 17–24 oct | Datos y migración; cerebro común; rutinas (puro); prueba de Mesas con Skia en iPhone y web |
| 2 · 25–31 oct | Piezas comunes; Plano (lejos y cerca, crear, mover, conectar, selección); Tiempo |
| 3 · 1–7 nov | Mesas completo; generación de rutinas en la app; pulido; publicar reglas (con permiso); prueba en iPhone |

Por ahora no se corren las fechas de C a G (el usuario lo pidió): el avance va rápido. Se revisa al terminar la semana 2.

## 8. Fuera de alcance

- Compartir mesas (subproyecto G).
- Google Calendar como fuente (C).
- Neka con IA (D).
- El significado de los colores.
- Rutinas mensuales o con excepciones.
- 3D libre tipo videojuego.
- El archivo de Figma: B entrega el documento del sistema visual.

## 9. Criterios de éxito

- Las 3 vistas muestran los mismos datos reales y se cambia entre ellas sin perder el tiempo elegido.
- Se puede crear, editar, completar, mover, conectar, juntar y sacar desde cualquier vista.
- Los datos de la V1 aparecen acomodados solos tras la migración, sin pérdida.
- Una rutina diaria genera sus cosas cada día sin duplicarse entre dispositivos.
- En el iPhone, Mesas gira y baja de piso con fluidez y el texto se lee.
- Pruebas, typecheck y `build:web` en verde.
