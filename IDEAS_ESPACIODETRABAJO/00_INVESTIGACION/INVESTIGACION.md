# Investigación de diseño: espacio de trabajo de Nekal

**Fecha:** 8 de octubre de 2026  
**Estado:** investigación y maquetas; ninguna implementación.  
**Alcance:** seis referencias del usuario, revisión del modelo y del mapa local de Nekal, navegación del referente Nico Borja, documentación de productos comparables y cinco imágenes conceptuales.

## 1. Recomendación

Nekal puede tener un mapa visual propio sin obligar a trabajar siempre dentro de una red compleja. La dirección que recomiendo probar primero es **Territorios como vista habitual y Red como vista de conexiones**. Las **Islas isométricas** son una alternativa visual muy cercana a la primera referencia. El **Universo 3D** merece conservarse como exploración opcional.

Las cuatro vistas representarían los mismos espacios, grupos e ítems. Cambiar de vista no crearía una nueva tarea ni otro sistema de organización. Esta es una propuesta de diseño, todavía sin validación con usuarios.

El comportamiento central sería: localizar un espacio, abrir un grupo, seleccionar una actividad y entender qué necesita o qué habilita. La identidad visual viene de Nekal: blanco cálido, lavanda y violeta, con colores secundarios suaves para distinguir espacios.

## 2. Qué se verificó y qué no

- **Verificado en los archivos locales:** estructura de datos, ocho tipos, dependencias, límites del mapa y colores existentes.
- **Observado en Nico Borja:** mapa con cúmulos y partículas; navegación por áreas; al seleccionar AI aparece contenido del área y enlaces a proyectos; controles Mapa, Contenido y Pausar movimiento.
- **Referencias adjuntas:** se analizaron las seis imágenes como ejemplos visuales. No se asume que todas sus funciones estén disponibles o convengan a Nekal.
- **Limitación:** la pestaña compartida de Nekal tenía un identificador antiguo. Se encontró la pestaña actual, pero el navegador no permitió inspeccionarla por un fallo de conexión/control. El diagnóstico de Nekal se apoya en el código local y capturas existentes, no en una prueba funcional del despliegue.
- **Sin comprobar:** biblioteca concreta usada por Nico Borja, rendimiento de las propuestas, comportamiento táctil real o preferencia de usuarios.
- **Trabajo realizado:** lectura, investigación, generación y revisión visual. No se ejecutó la app, no se instalaron paquetes, no se modificaron datos ni se generó código.

## 3. La estructura real que debe respetarse

**Espacio → Grupo o rutina opcional → Ítem.**

Un espacio contiene grupos y también puede contener ítems sin grupo. Cada ítem pertenece a un espacio y como máximo a un grupo. Los grupos actuales tienen un solo nivel. “Proyecto” puede ser el nombre de un grupo, pero no es una entidad adicional.

| Tipo real | Información útil en el mapa |
|---|---|
| Nota | Icono de documento y título. Sin estado, puntos ni dependencias. |
| Idea | Icono de idea, título y categoría cuando haga falta. Sin estado ni dependencias. |
| Evento | Fecha y hora planificadas, duración. |
| Visita | Fecha, hora y ubicación. |
| Meeting | Fecha, hora y agenda; participantes guardados como texto. |
| Deadline | Fecha límite y estado. |
| Goal | Progreso de hitos internos, por ejemplo 2/4. |
| Tarea | Estado, duración, subtareas, horario o límite si existen. |

Los ítems accionables usan pendiente, en curso y completado; prioridad baja, media o urgente. La fecha de ejecución y la fecha límite no son lo mismo.

Los hitos de un Goal y las subtareas son un checklist interno: no son automáticamente otros nodos del mapa. Tampoco hay hoy grupos dentro de grupos, personas como nodos, colaboración entre cuentas ni relaciones semánticas Nota→Tarea. Ninguna maqueta necesita inventar esas capacidades.

**Fuentes locales:** [modelo](C:/Users/nicoa/OneDrive/Desktop/NombreApp_V1_Codex/front/src/utils/model.ts:1), [editor de ítems](C:/Users/nicoa/OneDrive/Desktop/NombreApp_V1_Codex/front/src/components/ui/ItemEditor.tsx:278), [tarjetas e iconos](C:/Users/nicoa/OneDrive/Desktop/NombreApp_V1_Codex/front/src/components/ui/ItemCard.tsx:5).

## 4. El problema del prototipo actual

El mapa actual muestra un espacio a la vez. Coloca actividades en un anillo alrededor de Neka/Tú; los grupos actúan como puntos a los que se conectan sus miembros. Es posible mover nodos y guardar posiciones, desplazar el lienzo, centrar, buscar y alternar con lista.

La oportunidad de mejora es estructural:

1. Los miembros de un grupo no quedan necesariamente cerca entre sí; el anillo general puede generar cruces.
2. Los círculos no muestran el icono del tipo que sí tiene la tarjeta de lista.
3. Prioridad y estado comparten parte del significado del color.
4. Las dependencias se dibujan punteadas sin flechas: cuesta saber qué debe completarse primero.
5. Hay dependencias entre espacios, pero la línea desaparece si el otro extremo no está en el espacio visible.
6. La distribución automática puede cambiar al buscar, porque se calcula sobre la lista filtrada.
7. No hay vista global, grupos plegables, enfoque por vecinos ni cambio de detalle con el zoom.
8. El lienzo nominalmente “infinito” tiene un tamaño fijo de 1000 × 1000; esto es una observación del código, no una medición de capacidad o rendimiento.

**Fuentes locales:** [pantalla de espacio](C:/Users/nicoa/OneDrive/Desktop/NombreApp_V1_Codex/front/src/pages/EspacioTrabajo.tsx:37), [distribución y conexiones](C:/Users/nicoa/OneDrive/Desktop/NombreApp_V1_Codex/front/src/components/ui/EspacioTrabajoUi/CanvasContent.tsx:122), [dependencias visibles](C:/Users/nicoa/OneDrive/Desktop/NombreApp_V1_Codex/front/src/components/ui/EspacioTrabajoUi/CanvasContent.tsx:173), [lienzo](C:/Users/nicoa/OneDrive/Desktop/NombreApp_V1_Codex/front/src/components/ui/EspacioTrabajoUi/InfiniteCanvas.tsx:42).

## 5. Qué tomar de cada referencia

| Referencia | Valor para Nekal | Adaptación propuesta |
|---|---|---|
| 1. Cuadrados isométricos | Pertenencia y jerarquía visibles mediante superficies apiladas. | Plataforma grande = espacio; bandeja = grupo; ficha = ítem. Altura sin significado de prioridad. |
| 2. Red clara | Un mapa amable puede funcionar sobre fondo claro. | Conservar blanco/lavanda, nombres legibles y pocas conexiones activas. La imagen es pequeña: no se infieren controles. |
| 3. Nico Borja | Identidad, exploración por áreas y sensación de un conjunto conectado. | Mantener grupos visuales y transición a detalle. Reducir partículas; ofrecer vista de contenido y pausa. |
| 4. Grafo analítico oscuro | Relaciones y exploración local. | Abrir vecinos de la selección; evitar todas las etiquetas y líneas a la vez. |
| 5. Nodos con iconos y relaciones | Diferenciar tipos y dirección. | Iconos de los ocho tipos reales; flechas solo para dependencias existentes. |
| 6. Radial por sectores | Comparar cantidades o distribución. | Posible resumen secundario de carga o tipos, si se define la medida. No sustituye el mapa operativo. |

En [Nico Borja](https://nicoborja.com/es/) el mapa conduce a contenido del portafolio. Su función principal es explorar y descubrir. En Nekal, además, hay que leer fechas, reconocer pendientes y ejecutar acciones. Esa diferencia explica por qué no copiaría literalmente la densidad de partículas.

La primera imagen contiene nombres del ecosistema Vite, pero no se verificó su procedencia exacta. No se atribuye a una biblioteca concreta.

## 6. Las cuatro direcciones visuales

### A. Islas isométricas

[Ver maqueta](C:/Users/nicoa/OneDrive/Desktop/NombreApp_V1_Codex/DOCUMENTACION2/01-islas-isometricas.png)

Losas rectangulares suaves, bandejas y fichas crean la sensación de organización tangible. La plataforma superior representa el espacio; no un supergrupo nuevo. La cámara sería fija por defecto y habría una opción plana.

**Aporta:** identidad fuerte, lectura de pertenencia, cercanía a la primera referencia.  
**A resolver:** títulos inclinados, oclusión, espacio ocupado por la perspectiva y acceso táctil.  
**Criterio:** una ficha seleccionada siempre abre un detalle frontal y legible. No elevar una tarea por urgencia: eso confundiría prioridad y jerarquía.

No exige un motor 3D completo: se puede investigar un dibujo 2D con apariencia de profundidad, habitualmente llamado 2.5D.

### B. Red de círculos

[Ver maqueta](C:/Users/nicoa/OneDrive/Desktop/NombreApp_V1_Codex/DOCUMENTACION2/02-red-de-circulos.png)

Círculos con iconos dentro de regiones suaves. Cada espacio engloba sus grupos; las flechas aparecen alrededor de la actividad seleccionada.

**Aporta:** relación directa con las referencias de red y continuidad con el mapa actual.  
**A resolver:** cruces, títulos extensos y estabilidad de posiciones.  
**Criterio:** no dejar una simulación moviéndose permanentemente. Ordenar inicialmente, estabilizar y permitir ajustar. La proximidad visual no significa dependencia.

### C. Territorios con tarjetas — recomendación inicial

[Ver maqueta](C:/Users/nicoa/OneDrive/Desktop/NombreApp_V1_Codex/DOCUMENTACION2/03-territorios.png)

Zonas delimitadas, grupos reconocibles y tarjetas pequeñas. Tiene la legibilidad de una tarjeta y la disposición libre de un mapa. Los corredores entre zonas alojan las conexiones seleccionadas.

**Aporta:** reconocimiento de tipos, textos más largos, contadores y mejor transición hacia móvil.  
**A resolver:** no convertir cada zona en un panel saturado; plegar y priorizar información.  
**Criterio:** empezar por espacios y grupos; abrir actividades al acercarse o seleccionar. La maqueta está deliberadamente desplegada para comparar su contenido con las otras.

### D. Universo 3D

[Ver maqueta](C:/Users/nicoa/OneDrive/Desktop/NombreApp_V1_Codex/DOCUMENTACION2/04-universo-3d.png)

Volúmenes translúcidos contienen cúmulos; rótulos frontales y panel fijo permiten leer. Las dependencias relevantes forman arcos. Personal está resumido en “3”, no eliminado.

**Aporta:** presencia visual y exploración espacial.  
**A resolver:** profundidad, elementos ocultos, selección, orientación, consumo y movimiento. En esta maqueta la envolvente de Operación sobresale del volumen de Trabajo: la ruta del panel conserva la pertenencia, pero la contención espacial necesita mayor precisión en otra ronda.
**Criterio:** Vista fija, Explorar 3D y Volver a plano; nunca necesitar rotar para completar una tarea básica.

No hay base para declarar que el 3D sea siempre inferior. Un estudio con 34 participantes encontró ventajas al seguir conexiones en 3D **dentro de realidad virtual**. Eso no prueba una ventaja para gestionar tareas en navegador o móvil. [Estudio de McGuffin, Servera y Forest, 2022](https://arxiv.org/abs/2207.11586).

## 7. Gramática visual compartida

| Recurso | Significado |
|---|---|
| Zona exterior, plataforma o volumen | Espacio |
| Contenedor interior, bandeja o cúmulo | Grupo/rutina |
| Tarjeta, ficha o círculo con icono | Ítem |
| Color de fondo de zona | Identidad del espacio |
| Icono y nombre del tipo | Nota, Idea, Evento, Visita, Meeting, Deadline, Goal o Tarea |
| Insignia con texto | Estado o prioridad; campos separados |
| Flecha A → B | B requiere completar A |
| Contador al plegar | Cantidad de ítems representados |
| Tamaño, distancia o altura | Recursos de disposición, salvo que una leyenda defina otra medida |

No dibujar líneas de pertenencia si el contenedor ya la explica. No conectar actividades solo porque comparten color, fecha o palabras. Si más adelante se desean relaciones “inspirado por” o “referencia”, eso exige diseñar otra relación explícita y distinguirla de una dependencia.

Un ícono de check usado para el **tipo Tarea** puede confundirse con **Completado**. Las maquetas exploran esa iconografía, pero la futura especificación debe reservar una marca inequívoca para estado y acompañarla de texto.

## 8. Comportamiento propuesto

**Vista general.** Espacios con nombre, grupos y cantidad. Los grupos secundarios pueden plegarse. El contador debe aclarar si representa todos los ítems o solo los filtrados.

**Acercarse.** Mostrar primero nombres de grupos, después actividades, luego fechas y estados. Este cambio de información según escala es zoom semántico; no basta con agrandar los mismos puntos.

**Seleccionar.** Mantener la escena estable. Resaltar el ítem y sus requisitos directos; el resto pierde énfasis sin desaparecer de forma confusa. Abrir un panel con título completo, tipo, ruta, estado, fechas pertinentes y acciones.

**Cruzar de espacio.** Si un requisito está fuera de la vista, mostrar “En Estudios: Sintetizar fuentes” como destino explícito. Entrar y volver debe recuperar la selección y posición anteriores.

**Buscar.** Resaltar coincidencias y permitir ir a ellas conservando la ubicación de lo demás. No reorganizar todo el mapa por cada letra.

**Ordenar.** Separar “mover visualmente” de “cambiar de grupo”. Arrastrar una ficha no debe cambiar silenciosamente su pertenencia. Ofrecer también “Mover a…” y “Ordenar este grupo”.

**Completar.** Actualizar el estado en todas las vistas. Si todavía falta otro requisito, explicar cuál; completar uno no equivale a desbloquear toda la actividad.

**Neka.** Puede acompañar con ayuda contextual y orientación. No necesita ser el centro de todas las conexiones ni atribuirle descubrimiento automático de relaciones.

Estos comportamientos son propuestas; los controles de las imágenes no son funciones ya implementadas.

## 9. Patrones documentados que apoyan la propuesta

- [Obsidian](https://obsidian.md/help/plugins/graph) distingue grafo global y local, profundidad, filtros y agrupación. Para Nekal: mapa general para orientarse y vecindario pequeño para entender dependencias.
- [Heptabase](https://wiki.heptabase.com/fundamental-elements) separa tarjetas de los tableros donde se representan. Para Nekal: una misma actividad puede aparecer en distintas vistas sin duplicarse ni cambiar de dueño.
- [Milanote](https://milanote.com/product/project-management) combina tareas y contenido en tableros visuales. Para Nekal: distribución estable y organización manual cuando aporte sentido.
- [Scrintal](https://scrintal.com/features/cards) presenta tarjetas con distinto nivel de información. Para Nekal: pasar de nodo compacto a lectura ampliada.
- [Linkurious](https://doc.linkurious.com/user-manual/latest/expand/) permite expansión selectiva y límites de vecinos. Para Nekal: abrir un grupo grande por subconjuntos y contar lo que permanece oculto.
- [Neo4j Bloom](https://neo4j.com/docs/bloom-user-guide/current/bloom-perspectives/perspective-creation/) organiza perspectivas por categorías y relaciones. Para Nekal: filtros de tarea comprensibles, por ejemplo “Dependencias” o “Este grupo”.

Son referencias de comportamiento, no una recomendación de migrar a esos productos o bases de datos. Un mapa de nodos no obliga por sí mismo a cambiar el almacenamiento de Nekal.

## 10. Móvil, accesibilidad y muchos elementos

[Ver recorrido móvil](C:/Users/nicoa/OneDrive/Desktop/NombreApp_V1_Codex/DOCUMENTACION2/05-recorrido-movil.png)

El recorrido propone: localizar Preparar demo, entender sus dos requisitos, abrir Sintetizar fuentes y regresar. Completar ese requisito todavía deja pendiente Entrega final.

En móvil conviene enfocar un espacio o grupo y usar un panel inferior o pantalla de detalle. La vista general puede resumir territorios. No reducir sin más el escritorio hasta volverlo ilegible.

- Estado e identidad deben entenderse sin depender solo del color. [W3C: uso del color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html).
- Dar alternativas de clic/toque a arrastrar. [W3C: movimientos de arrastre](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html).
- Ofrecer navegación por teclado, foco visible y una lista equivalente con las mismas acciones.
- Proponer objetivos táctiles de aproximadamente 44 px como criterio de diseño; comprobarlos luego en interfaz real. WCAG 2.2 AA contempla 24 × 24 CSS px o sus excepciones, no una obligación universal de 44 px. [W3C: tamaño del objetivo](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
- Pausar movimiento y respetar reducción de animación. [W3C: animación por interacción, criterio AAA](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html).
- Con muchos ítems: plegar grupos, mostrar próximos/pendientes por filtro, contar los ocultos y enfocar conexiones directas. No prometer una cantidad máxima sin medir.
- Vacíos: explicar cómo crear la primera actividad. Sin resultados: conservar el contexto y ofrecer quitar filtros. Títulos extensos: abreviar en mapa y mostrar completos al abrir.
- Actividades completadas: atenuar u ocultar mediante filtro explícito; mantener contexto suficiente para explicar los requisitos ya satisfechos.
- Accesos, permisos y datos: las maquetas usan contenido ficticio y no presuponen colaboración.

## 11. Viabilidad tecnológica, sin implementación

El proyecto local utiliza Expo 57, React Native 0.86 y React 19, con salida web. El mapa ya emplea react-native-svg. Fuente: [dependencias locales](C:/Users/nicoa/OneDrive/Desktop/NombreApp_V1_Codex/front/package.json).

| Familia | Para qué serviría | Encaje y cautela |
|---|---|---|
| SVG actual + D3 Force | Red clara, territorios y cálculo de posiciones. | Continuidad con el dibujo actual. D3 calcula posiciones; no entrega por sí solo toda la experiencia. |
| React Flow | Editor de nodos con controles preparados. | Opción para React web; no asumir integración directa en pantallas React Native. |
| Sigma.js | Exploración de grafos con WebGL. | Orientado al navegador; estudiar necesidades antes de añadir un motor para grandes redes. |
| React Native Skia | Lienzo 2D y apariencia 2.5D propia. | Soporte Expo/web/nativo; exige construir interacciones y cargar CanvasKit en web. |
| Three.js + React Three Fiber | Universo con cámara y profundidad reales. | Ruta web y nativa mediante integraciones; más trabajo de cámara, rótulos, selección y verificación por dispositivo. |

Fuentes oficiales: [D3 Force](https://d3js.org/d3-force), [SVG en Expo 57](https://docs.expo.dev/versions/v57.0.0/sdk/svg/), [React Flow](https://reactflow.dev/), [Sigma](https://www.sigmajs.org/docs/), [Skia en Expo 57](https://docs.expo.dev/versions/v57.0.0/sdk/skia/), [React Three Fiber](https://r3f.docs.pmnd.rs/getting-started/installation).

La continuidad con SVG parece el menor cambio de base; el 3D libre añade más decisiones. Son estimaciones de esfuerzo, no presupuestos ni benchmarks. La elección debe venir después de decidir qué vista merece prototiparse y qué plataformas son prioritarias.

## 12. Comparación y decisión pendiente

| Criterio cualitativo | Islas | Red | Territorios | Universo 3D |
|---|---|---|---|---|
| Jerarquía a primera vista | Fuerte por niveles | Depende de regiones | Fuerte por contenedores | Depende de envolventes |
| Leer nombres y tipos | Exige detalle frontal | Exige controlar etiquetas | Más espacio para texto | Exige rótulos frontales |
| Seguir dependencias | Viable con pocas rutas | Principal fortaleza | Viable con corredores | A validar con profundidad |
| Adaptación móvil | Mejor enfocada o plana | Mejor grafo local | Transición directa a lista/grupo | Requiere alternativa plana |
| Cercanía a las referencias | Primera imagen | Redes claras y analíticas | Síntesis funcional | Nico Borja y exploración espacial |

Esta tabla expresa juicio de diseño; no puntuaciones obtenidas de usuarios.

**Siguiente decisión de diseño:** elegir qué familia representa mejor la personalidad deseada. Después comparar con las mismas tareas, primero mediante las imágenes y luego, si se autoriza en otro momento, con un prototipo interactivo. Esta investigación no inicia esa implementación.

El protocolo y las respuestas esperadas están en [PRUEBAS_Y_ESCENARIO.md](C:/Users/nicoa/OneDrive/Desktop/NombreApp_V1_Codex/DOCUMENTACION2/PRUEBAS_Y_ESCENARIO.md). Las imágenes permiten revisar composición y significado, pero no demostrar fluidez, accesibilidad, persistencia ni eficiencia.
