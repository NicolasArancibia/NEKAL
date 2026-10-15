# Cómo funcionarían estas propuestas

## Alcance

Estas imágenes cierran una ronda de exploración visual: permiten comparar formas de organizar el espacio de trabajo. No son una implementación ni una prueba de usabilidad o rendimiento. La referencia funcional es [V1.md](C:/Users/nicoa/OneDrive/Desktop/NombreApp_V1_Codex/documentacion/V1.md), leído como descripción del producto.

La barra superior, las cinco secciones y la ficha inferior comparten una misma estructura. Cambia la forma del mapa. Esto no implica que la app deba ofrecer siete modos al usuario: son siete alternativas de diseño para elegir una dirección.

## Qué significa cada elemento

| Dato de NEKAL | Representación propuesta |
|---|---|
| Espacio | Región, base o conjunto principal. Trabajo, Estudios y Personal son ejemplos. |
| Grupo / rutina | Agrupación de ítems dentro de un mismo espacio. Solo un nivel de grupos. |
| Ítem sin grupo | Permanece dentro de su espacio; no se fuerza a crear un grupo. Inscripción al taller lo ejemplifica. |
| Nota e Idea | Documento y bombilla. Sin estado, puntos, dependencias ni barras de avance. Idea puede convertirse en Tarea desde su detalle. |
| Tarea y Goal | Casilla y objetivo. Las subtareas e hitos son contenido interno, no nuevos niveles de grupos. |
| Evento, Visita y Meeting | Calendario, ubicación y conversación; se muestra horario cuando corresponde. |
| Deadline | Bandera y fecha límite. Su límite se distingue del horario planificado de otras actividades. |
| Dependencia | Flecha desde el requisito hacia la actividad que lo necesita. |
| Selección | Contorno o anillo morado y ficha inferior con nombre, tipo, estado cuando aplica y ubicación. |

El morado identifica la marca, selección y conexiones activas. El fondo y las superficies son blancos con divisiones lavanda. En estas escenas no hace falta colorear cada espacio de un tono distinto. Si se añaden señales de completado o vencimiento, el color debe acompañar texto o icono, nunca ser el único indicador.

La pertenencia se entiende por agrupación espacial. No se debe usar la misma línea para indicar pertenencia y dependencia. Las conexiones tenues de las redes densas son una exploración de apariencia: al llevarlas a producto habría que derivar cada enlace de una relación real y evitar conexiones decorativas que parezcan datos.

## Interacción común, pensada para móvil

1. **Entrar y orientarse.** Elegir un espacio o abrir una vista general. El acceso a Lista y búsqueda permite encontrar elementos sin recorrer todos los puntos. La vista general de varios espacios es una propuesta de esta ronda, no una capacidad verificada de la V1.
2. **Acercarse.** Desplazar y ampliar el mapa. En la propuesta de detalle progresivo, de lejos se ven grupos y cantidades; al acercarse aparecen nombres y luego información breve. Ese detalle progresivo todavía requeriría diseño e implementación.
3. **Tocar un ítem.** Destacar únicamente sus relaciones relevantes y abrir la ficha inferior. La selección permanece visible por encima de la ficha.
4. **Abrir detalle.** Editar los campos propios del tipo, revisar subtareas o hitos, adjuntos y dependencias. Nota e Idea no deben heredar acciones de completar.
5. **Mover.** Activar explícitamente un modo de movimiento. Arrastrar cambia la posición visual guardada; no debe cambiar espacio, grupo o fecha accidentalmente. Cambiar pertenencia sería una acción aparte.
6. **Crear y reutilizar.** El botón + abre los ocho tipos. El menú de un grupo ofrece reutilizar la rutina: crea copias con nuevas identidades, ajusta fechas y remapea relaciones según V1. No significa repetición automática.

En una pantalla estrecha, los filtros y rutinas pasarían a un menú o una hoja temporal; no caben todos los controles de estas composiciones anchas. La ficha puede cerrarse, quedar reducida a una cabecera o expandirse. Nada esencial debería requerir pasar el ratón. La posición de cámara debe poder recuperarse con Centrar.

Las zonas de toque necesitan ser mayores que los puntos visibles. No se ha probado aquí una composición real de móvil ni su accesibilidad; las imágenes son vistas amplias para comparar las ideas.

## Qué aporta cada alternativa

| Alternativa | Cómo se recorrería | Aspecto que cuidar |
|---|---|---|
| **1 · Volúmenes claros** | Entrar en una agrupación y aislarla para trabajar; el volumen ayuda a reconocer conjuntos. | Evitar que transparencia y superposición tapen nombres. En móvil, reducir el volumen al enfocar. |
| **2 · Plataformas por niveles** | Una base representa un espacio; las bandejas son sus grupos y las fichas son ítems. Tocar una bandeja centra su contenido. | Los niveles explican la jerarquía existente, no agregan subgrupos. La inclinación de textos tendría que reducirse al entrar al detalle. |
| **3 · Islas modulares** | Distribuir espacios sobre una retícula y encajar bandejas próximas, manteniendo huecos para las conexiones. | Ordenar visualmente como Tetris no debe mezclar grupos ni recortar títulos. La retícula sería una ayuda de colocación. |
| **4 · Red de círculos** | Ver grupos, tocar un nodo y seguir requisitos y dependientes. | Resolver solapes de etiquetas y limitar las conexiones visibles cuando hay muchos ítems. |
| **5 · Territorios** | Leer directamente título, tipo y un dato útil en tarjetas; entrar al detalle cuando hace falta. | La tarjeta ocupa más superficie que un punto. Al alejarse conviene resumir, no reducir el texto hasta volverlo ilegible. |
| **6A · Red orgánica plana** | Explorar los conjuntos de puntos y enfocar un grupo o una actividad mediante búsqueda o toque. | Cada punto debe poder identificarse. La composición no debería reordenarse continuamente y hacer perder la orientación. |
| **6B · Red orgánica con profundidad** | Usar la misma navegación de 6A con conjuntos a distancias ligeramente distintas y opción de volver a Plano. | La profundidad no significa prioridad, tiempo ni estado. Mantener el elemento activo delante y evitar que los lejanos sean ilegibles o inaccesibles. |

## El ejemplo de dependencias

Entrega final y Sintetizar fuentes son requisitos de Preparar demo. A su vez, Demo interna depende de Preparar demo.

La ficha muestra Preparar demo pendiente y sus dos requisitos. No ofrece completarla mientras siga bloqueada. Estas relaciones deben seguir las validaciones de V1: no permitir ciclos ni completar una actividad bloqueada.

La imagen 2 aísla solo las conexiones entrantes. Las otras seis muestran también la salida hacia Demo interna. La diferencia es de enfoque visual, no una regla distinta del modelo.

## Límites de estas maquetas

- Las imágenes 1–5 usan Trabajo (8 ítems), Estudios (5) y Personal (3). Las redes 6A/6B muestran una densidad ficticia mayor: no permiten contar ni validar individualmente todos los nodos.
- Sombras, tamaños y cierto desenfoque de 6B sugieren distancia en una imagen fija. En una implementación habría que conservar texto nítido y selección accesible; esto no demuestra una navegación 3D funcional.
- La vista de varios espacios, el detalle progresivo al ampliar, la retícula y el modo de profundidad son propuestas. No se presentan como funciones ya existentes.
- Los rótulos son parte de imágenes generadas y pueden tener pequeñas imperfecciones tipográficas. Los PNG sirven para decidir dirección visual, no como recursos de interfaz listos para producción.
- No se cambió código, configuración ni datos de la app. Los únicos entregables de esta ronda son imágenes y documentación bajo DOCUMENTACION2.

