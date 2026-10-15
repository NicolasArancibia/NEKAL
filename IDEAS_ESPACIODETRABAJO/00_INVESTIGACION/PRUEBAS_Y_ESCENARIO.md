# Escenario y pruebas sin código

Fecha: 8 de octubre de 2026. Ningún dato de este escenario procede de la cuenta del usuario.

## Escenario común: 3 espacios, 4 grupos, 16 ítems

| Espacio | Grupo | Tipo | Título |
|---|---|---|---|
| Trabajo | Lanzamiento | Goal | Lanzar proyecto — 2/4 hitos |
| Trabajo | Lanzamiento | Nota | Brief creativo |
| Trabajo | Lanzamiento | Idea | Nueva bienvenida |
| Trabajo | Lanzamiento | Tarea | Diseñar propuesta |
| Trabajo | Lanzamiento | Meeting | Revisión de diseño |
| Trabajo | Lanzamiento | Deadline | Entrega final |
| Trabajo | Operación | Tarea | Preparar demo |
| Trabajo | Operación | Evento | Demo interna |
| Estudios | Proyecto de curso | Goal | Entregar investigación — 1/3 hitos |
| Estudios | Proyecto de curso | Nota | Bibliografía |
| Estudios | Proyecto de curso | Tarea | Sintetizar fuentes |
| Estudios | Proyecto de curso | Deadline | Entrega del informe |
| Estudios | Sin grupo | Tarea | Inscripción al taller |
| Personal | Semana personal | Tarea | Confirmar visita |
| Personal | Semana personal | Visita | Visita al museo |
| Personal | Semana personal | Idea | Ruta de fin de semana |

Trabajo tiene 8 ítems; Estudios, 5; Personal, 3. “Sin grupo” es una sección visual para el ítem no agrupado, no un quinto grupo. Los hitos de Goals no suman ítems nuevos.

Para el recorrido: Preparar demo está pendiente; Entrega final no está completada; Sintetizar fuentes está en curso y tampoco completada. No se fijan fechas ni estados de todos los otros ítems porque no son necesarios para esta comparación.

## Relaciones

La notación A → B significa “B requiere completar A”.

- Diseñar propuesta → Revisión de diseño.
- Revisión de diseño → Entrega final.
- Entrega final → Preparar demo.
- Sintetizar fuentes → Preparar demo, cruzando Estudios hacia Trabajo.
- Preparar demo → Demo interna.
- Sintetizar fuentes → Entrega del informe.
- Confirmar visita → Visita al museo.

Las cuatro vistas de escritorio muestran solo las tres conexiones directas de la selección Preparar demo. Las otras permanecen ocultas en ese estado visual. Notas e Ideas no tienen dependencias.

## Recorrido propuesto, no ejecutado en una app

1. Vista global: reconocer Trabajo y Estudios.
2. Abrir Trabajo / Operación y seleccionar Preparar demo.
3. Leer “Espera 2 requisitos”.
4. Identificar Entrega final y Sintetizar fuentes.
5. Abrir Sintetizar fuentes dentro de Estudios / Proyecto de curso.
6. Completarla en el escenario simulado.
7. Regresar a Preparar demo: todavía espera Entrega final.
8. Volver al mapa conservando selección, escala y contexto.

La imagen móvil ilustra los pasos previos a completar el requisito. El botón “Marcar completada” no se ejecutó ni modifica datos reales.

## Qué se revisó en esta entrega

Se inspeccionaron visualmente los resultados de ImageGen y se realizaron estas revisiones:

- Islas: retirada de árboles, rocas, escaleras y formas de terreno; superficies geométricas más cercanas a la referencia.
- Red: corrección de un extremo que parecía una segunda punta de flecha.
- Universo: retirada de líneas decorativas entre notas/ideas y sustitución de iconos que sugerían personas.
- Móvil: separación de Demo interna y Preparar demo como actividades hermanas; eliminación del evento dentro de la tarjeta seleccionada.
- Territorios: revisión de tipos, contadores, pertenencia y conexiones seleccionadas.

Esto es revisión de consistencia visual realizada por el equipo asistente. No es una prueba con usuarios ni una comprobación de código, dispositivos, contraste CSS o rendimiento.

## Prueba comparativa de las imágenes

Comparar Islas, Red y Territorios con el mismo escenario. Evaluar Universo por separado como exploración adicional: su cámara hipotética añade una variable que estas imágenes no prueban.

Puede hacerse señalando sobre la imagen y describiendo el siguiente paso. No requiere construir nada.

| Tarea | Respuesta esperada | Criterio inicial |
|---|---|---|
| Encontrar Preparar demo | Trabajo / Operación | Localizable en la vista; no confundir con Demo interna |
| Indicar pertenencia | Espacio Trabajo, grupo Operación | Ambos nombres explícitos; no depender solo del color |
| Explicar bloqueo | Faltan Entrega final y Sintetizar fuentes | Las dos, con sentido de flecha inequívoco |
| Encontrar requisito externo | Sintetizar fuentes, Estudios / Proyecto de curso | Ruta comprensible y regreso visible |
| Distinguir contenido | Brief creativo es Nota; Nueva bienvenida es Idea | No atribuirles un estado pendiente ni dependencias |
| Interpretar progreso | Lanzar proyecto tiene 2 de 4 hitos internos | No contar cuatro tareas adicionales |
| Encontrar un ítem sin grupo | Inscripción al taller, Estudios | No atribuirlo a Proyecto de curso |
| Interpretar resumen | Personal representa 3 ítems | En Universo siguen contados aunque estén plegados |
| Completar Sintetizar fuentes | Preparar demo aún espera Entrega final | No declarar la demo automáticamente disponible |
| Hacer el recorrido en móvil | Ubicar → entender requisitos → abrir requisito → volver | Ningún paso esencial depende de hover o arrastre |

Puntuación útil por tarea: 0 = no se puede responder; 1 = exige inferencia; 2 = información explícita. No se han asignado notas a supuestos participantes.

Registrar atractivo visual por separado, de 1 a 5. Una preferencia estética no compensa una dependencia mal interpretada.

## Objetivos para un futuro prototipo, pendientes

- Encontrar un ítem desde la vista general con hasta 3 selecciones.
- Llegar a un requisito externo en hasta 2 selecciones desde el ítem elegido.
- Recuperar contexto al volver.
- Representar o contabilizar todos los ítems plegados.
- Cero líneas ambiguas en la selección.
- Mismas respuestas en móvil y escritorio.
- Títulos largos completos en detalle.
- Diferenciar pendiente, en curso y completado incluso sin colores.

Los números de pasos son objetivos propuestos, no estándares científicos.

## Casos de presión para otra ronda

Preparar variantes de 6, 30 y 150 ítems; esos tamaños son condiciones de prueba, no capacidades prometidas. Añadir un espacio vacío, un grupo vacío, muchos grupos, un título extenso, nombres parecidos, múltiples requisitos, actividad completada y búsqueda sin resultados.

Comprobar si se conserva orientación al filtrar, plegar, cambiar de vista y volver desde otro espacio. La densidad debe resolverse con resumen y enfoque, no solo reduciendo el tamaño de todo.

Una prueba exploratoria futura podría incluir 5–8 personas representativas, rotando el orden de los estilos para reducir el efecto de aprendizaje. Sería exploratoria, no estadísticamente representativa. Medir aciertos, errores, ayuda solicitada, tiempo y preferencia solo cuando existan participantes e interacción suficientemente comparable.

## Límites visibles que deben guiar la siguiente ronda

Los textos inclinados en Islas necesitan una solución de lectura frontal. Algunas marcas de check pueden parecer estado completado aunque representen el tipo Tarea. En Universo los volúmenes transparentes pueden superponerse. El recorrido móvil representa pocos estados y requiere desplazamiento para el contenido fuera de la pantalla.

Estos puntos se conservan como preguntas de diseño; ninguna imagen pretende ser una especificación final de componentes ni demostrar que los controles funcionen.

