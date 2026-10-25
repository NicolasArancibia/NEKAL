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

## Pendiente

- **Dónde vive el progreso:** A) el Perfil pasa a ser "tú y cómo vas", o B) una pantalla "Progreso" aparte. La primera maqueta ([E_MAQUETA/01-progreso.html](E_MAQUETA/01-progreso.html)) quedó genérica; el usuario pidió rehacerla bien, sin apuro, siguiendo el flujo completo.
- Después: diseño por secciones (fórmula de puntaje revisada, rating, heatmap, rachas, catálogo de logros, modal de revelado, "desde el día 1", datos y reglas), spec `E_GAMIFICACION.md`, plan y ejecución.

## Contexto que existe hoy

- Puntos por cosa completada (`pointsFor`: dificultad × prioridad + dependientes), historial `rewards` con fecha y sin duplicar; nivel = 1 cada 100 puntos.
- Resumen: anillo de nivel y tarjeta "Progreso" con barra (preparada para crecer, spec A). Perfil: nombre, nivel y puntos.
- Referencias del roadmap (videos): chips de filtro, tarjetas que se abren con su heatmap, grilla de logros bloqueados con modal de revelado.
