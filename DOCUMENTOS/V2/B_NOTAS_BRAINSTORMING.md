# B · Espacio — notas del brainstorming

Registro de lo acordado mientras se diseñó el subproyecto B. **Cerrado el 17/10:** la versión vigente está en la [spec](B_ESPACIO.md) y el [sistema visual](B_SISTEMA_VISUAL.md). Estas notas quedan como historial; lo que dice "abierto" se resolvió en la spec. Maquetas en `B_MAQUETA/` (no se borran).

Cierre (17/10): estructura aprobada (General + mesas de un nivel; grupos anidables; rutinas = grupos que se repiten). Construcción: falso 3D con Skia, probado primero en el iPhone; el usuario lo evaluará y podría pedir three.js. 3 semanas, sin correr C a G por ahora. La hoja al tocar permite editar desde cualquier vista y tiene "Ver dónde está".

## Para qué sirve el Espacio (16/10)

- Es "el calendario que tu cabeza entiende": ver todo sin saturar, libertad para organizar, planificar mejor a la manera de cada uno, y que impresione siendo tranquilo y ordenado.
- Quien llegue con sus cosas (migración) debe encontrarlas acomodadas solas y después ajustarlas.

## Acordado

- **Selector de tiempo** común: Hoy · Semana · 2 semanas · Todo. Lo que no tiene fecha o está en curso se ve siempre.
- **3 vistas generales** de los mismos datos, con un botón de tres: **Tiempo** (órbitas, 2D) · **Mesas** (3D, estilo FAVFAVFAV 2) · **Plano** (2D, estilo fav 1, 8 y 3). Base visual: maqueta 05.
- **Mesas**: la mesa grande arriba es donde estás; abajo, lo que contiene; tocar una la sube. Tamaño según contenido; más pisos si hace falta; puntos conectados como en la maqueta 02; conexiones externas (Google Calendar, Neka) a la mesa grande.
- **General** es la mesa principal: contiene todo, incluidas las otras mesas; otra mesa puede depender de algo de General. (Modelo exacto: preguntar más adelante.)
- Los **colores** (verde, naranjo…) se definen después; pueden significar algo.
- **No implementar nada** hasta ver los detalles de las 3 vistas.

- **Una protagonista por vista** (la idea, no las palabras): Tiempo = el momento · Plano = las cosas y tu orden · Mesas = en discusión.
- **Regla:** forma y posición son para la pregunta de la vista; el resto va como marcas iguales en las tres (prioridad = etiqueta, dificultad = ●●○). Escalera de lectura: lejos punto, medio punto + ícono, cerca ficha.
- **Riesgos aceptados con su solución:** Tiempo arrastra con imán por día + vibración + fecha visible; Mesas navega y conecta desde la hoja (lo fino de arrastrar en Plano); orden Plano → Tiempo → Mesas con prueba 3D en iPhone la primera semana; notas e ideas no aparecen en Tiempo.
- **Mesas debe conservar profundidad y altura con significado** (no solo "encendido"). El usuario quiere moverse alrededor de las mesas en 3D y acercarse a partes para entrar.
- **Mesas = altura es la carga** (dificultad × duración): lo pesado se ve alto, notas e ideas planas, al completar el bloque se aplana; el grosor de una mesa es lo pendiente que tiene. El tiempo elegido se ve con brillo, no con altura. Navegación: girar con dos dedos, inclinar, pellizcar, tocar una mesa para bajar.
- **Modelo mental de Mesas (usuario, 16/10):** General siempre arriba; debajo, las mesas que contiene más las cosas propias de General, conectadas; debajo de cada mesa, sus cosas, que aparecen al acercarse. Tiempo, Plano y Plano dentro de una mesa: aprobados como dirección.
- **Rutina** = conjunto de cosas que se hacen juntas, puede vivir en cualquier mesa (ej.: "Mañana"; o una rutina de trabajo en una mesa compartida). No es un piso de mesas.
- Descartado: "una sola vista con lentes".
- **Revisión del 17/10 (maqueta 06 → 07):**
  - Crear es igual en las 3 vistas: los 8 tipos + Rutina + Mesa; la vista solo rellena lo suyo (Tiempo la fecha; Mesas y Plano la mesa y el lugar).
  - Juntar y sacar: mantener presionado para elegir varias → juntar en rutina, sacar de la rutina, mover a otra mesa, conectar. En las 3 vistas.
  - Tocar cualquier cosa en cualquier vista muestra sus conexiones, también las de otras mesas (aviso en el borde: "2 en Estudios ›").
  - Mesas: estilo de la maqueta 05 (bordes con degradé, cubitos conectados en la mesa de arriba). Todas en el mismo eje: General arriba al centro y las mesas debajo. Al bajar, lo de arriba se vuelve vidrio y las mesas no relacionadas también; se ve lo de la mesa en que estás y sus rutinas debajo. El piso de más abajo aparece al acercarse.
  - Plano: de lejos, bloques de color con puntos (como la 05); de cerca, fichas mezcladas y conectadas, no en columnas tipo tablero.
  - Guardar el sistema visual para pasarlo después a Figma.
- **Revisión del 17/10 (maqueta 07):** Tiempo perfecto. Mesas en General: "literal lo que tenía en mente". Dentro de Trabajo: que lo no relacionado se vuelva invisible al girar y que lo de abajo aparezca al acercarse. Plano parte en la vista de lejos. Plano de cerca: fichas **ordenadas** (como en la 05), no sueltas.
- **Mesa ≠ grupo ≠ rutina** (el usuario lo detectó): Lanzamiento y Operación no son mesas, son grupos dentro de Trabajo. Hay que limitar dónde se crean mesas (General → mesas secundarias → terciarias solo si de verdad hace falta). Propuesta en discusión, ver respuesta del 17/10.
- **Definiciones (usuario, 17/10):** solo hay **mesa principal (General) + mesas secundarias** (proyectos, universidad, trabajo…); no hay mesas terciarias. **Grupo** = conjunto específico de cosas dentro de una mesa (ej.: en "Proyecto 4": materia, estudios, lanzamiento, operación); los grupos pueden tener grupos dentro, sin límite. **Rutina** = grupo que se repite o reutiliza con la frecuencia que el usuario quiera (cada día, cada semana, etc.). En Mesas, los grupos **sí** aparecen como pisos debajo al acercarse, y sus subgrupos debajo de ellos al seguir acercándose.

## Abierto

- **Propósito de cada vista** (borrador; las palabras no son las finales): Tiempo = cuándo · Mesas = peso y conexiones · Plano = tu orden.
- **Interacción** (16/10, el usuario notó que se diseñó mucho "ver" y poco "hacer"): crear cada tipo de ítem con sus variables, mover, conectar, planificar proyectos, notas e ideas, cosas compartidas. Propuesta en discusión: "lo que la vista muestra es lo que la vista te deja cambiar" y "crear donde tocas: la vista rellena su dato".
- Cómo se representa cada dato (tipo, estado, prioridad, dificultad, fecha, dependencias, progreso, mesa/rutina) en cada vista.
- Nivel de detalle compartido: la pantalla de fichas (maqueta 05, pantalla 4) como destino común al entrar hasta el fondo.
- Modelo de datos de mesas (mesas dentro de mesas).
- Orden de construcción y semanas (el roadmap da 2 semanas a B; probablemente 3).
