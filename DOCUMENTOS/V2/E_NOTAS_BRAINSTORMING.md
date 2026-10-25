# V2 · E — Notas del brainstorming (Gamificación)

Brainstorming empezado el 25 de octubre de 2026, después de cerrar D. Parte del [ROADMAP](ROADMAP.md). Todavía **no hay spec**: estas son las decisiones tomadas hasta ahora, una pregunta a la vez.

## Decidido por el usuario

| Tema | Decisión |
|---|---|
| Camino | Arquitectónico: preguntas → maquetas → diseño por secciones → spec → plan. |
| Categoría del rating | **Mesas + área de vida.** El rating se ve por mesa (Trabajo, Universidad…). Cada mesa elige un área de una lista corta (Estudio, Trabajo, Salud, Hogar, Social, Personal), sugerida por su nombre y editable. El área sirve para el ícono y para compararse con amigos en F. Lo suelto en General suma al puntaje y nivel, pero a ningún rating. |
| Rating | **Sube y baja suave.** Sube al completar cosas de esa mesa; baja un poco con cosas vencidas o semanas sin moverla. Es "cómo vas ahora" en esa área. El nivel y los puntos totales nunca bajan. |
| Heatmap | **Cuánto cumpliste de tu día:** color según el % de lo que tenías ese día que completaste. Un día sin nada agendado pero con cosas completadas se pinta suave. |
| Logros | Tres familias: **constancia (rachas), volumen y niveles, primeras veces**. Fuera: logros por área. El **catálogo es el mismo para todas las cuentas** (no depende de las mesas ni de lo que haga cada uno). Los números que propuse (3/7/30 días, 10/50/100 cosas, nivel 5/10…) eran ejemplos: se ajustan en el diseño. |
| Motor | **Calcular todo de lo que ya hay** (historial de puntos con fecha + cosas con su día y estado). Solo se guarda el área de cada mesa y qué logros ya se vieron (para que el modal de revelado no se repita en otro dispositivo). Costo aceptado: si mueves algo de día, la historia de ese día cambia. |
| Dónde vive | **El Perfil es tu progreso** ([maqueta 02](E_MAQUETA/02-donde-vive-el-progreso.html), opción A). Arriba tu nombre (tocar = editar perfil) y el engranaje de Ajustes; abajo nivel, tus días, tus mesas, logros y "desde el día 1". Cuenta y sincronización se mudan a Ajustes. La tarjeta "Progreso" del Resumen lleva a la pestaña Perfil (no hay pantalla aparte). Al usuario le gustó cómo quedó el contenido de la maqueta. |

| Puntaje | **Ajuste fino.** Se mantiene 10 × dificultad × prioridad + dependencias, pero la dificultad sale de pasos y lugar (ya no de lo cerca que está la fecha, que premiaba dejar todo para el final o atrasarse) y terminar antes de la fecha límite da un bonus. Niveles con curva: cada nivel cuesta 100 más que el anterior (nivel 2 = 100, 3 = 300, 4 = 600, 5 = 1.000, 10 = 4.500 acumulados). Con ~33 pts al día: nivel 8 a los 3 meses y 16 al año (hoy serían 30 y 120). Los puntos ganados se mantienen; el nivel se recalcula una vez al lanzar E. |
| Racha | **La mitad de tu día.** Un día cuenta si completaste al menos el 50% de lo que tenías ese día (la misma cuenta que pinta el heatmap). Un día sin nada agendado es descanso: no corta la racha ni suma; si ese día igual completas algo, suma. |

## Pendiente

- Diseño por secciones (fórmula de puntaje revisada, rating, heatmap, rachas, catálogo de logros, modal de revelado, "desde el día 1", datos y reglas), spec `E_GAMIFICACION.md`, plan y ejecución.

## Contexto que existe hoy

- Puntos por cosa completada (`pointsFor`: dificultad × prioridad + dependientes), historial `rewards` con fecha y sin duplicar; nivel = 1 cada 100 puntos.
- Resumen: anillo de nivel y tarjeta "Progreso" con barra (preparada para crecer, spec A). Perfil: nombre, nivel y puntos.
- Referencias del roadmap (videos): chips de filtro, tarjetas que se abren con su heatmap, grilla de logros bloqueados con modal de revelado.
