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

## Diseño aprobado por secciones

**1 · Puntaje y niveles** (aprobada el 25/10):
- Puntos por cosa, congelados al completarla como hoy: 10 × dificultad × prioridad (baja 1 · media 1,5 · urgente 2) + 5 por cada cosa que depende de ella (máx. 15).
- Dificultad de tareas, entregas y metas: pasos + lugar (cuenta como un paso). 0–1 = baja (1), 2–4 = media (2), 5+ = alta (3). La fecha ya no cuenta. Eventos, visitas y reuniones: la que elige el usuario, como hoy.
- Bonus a tiempo: +20% (redondeado) si la cosa tiene fecha límite y se completa antes. Ejemplo: «Entregar informe», urgente, 3 pasos → 48 a tiempo, 40 atrasado (antes: 60 un día antes, 40 una semana antes).
- Sin cambios: notas e ideas no dan puntos; metas pagan 80% por pasos y el resto al terminar; reabrir o editar no vuelve a pagar.
- Niveles: llegar al nivel n cuesta 50·n·(n−1) puntos acumulados (2 = 100, 3 = 300, 4 = 600, 5 = 1.000, 10 = 4.500). Una sola función da nivel y avance; la usan el anillo del Resumen, la tarjeta Progreso y el Perfil.
- Al lanzar E: el historial de puntos no se toca; la curva se aplica sola y el nivel baja una única vez.
- Textos: el editor muestra el estimado con «+20% si lo terminas antes del …»; Ajustes actualiza «¿Cómo se ganan puntos?».
- Pruebas: dificultad sin fecha; bonus antes / justo / atrasado; curva en 0, 99, 100, 299, 300 y 4.500.

**2 · Tus días: heatmap y racha** (aprobada el 25/10; va en el Resumen):
- Lo que tenías un día = misma regla que «Hoy»: cosas con hora o fecha límite ese día, sin notas, ideas ni borradas; cada repetición de rutina es su propia cosa. % = completadas / tenías.
- 5 tonos: vacío (nada o 0%), 1 (algo, < 50%), 2 (50–74%), 3 (75–99%), 4 (100%). Desde el tono 2 el día suma a la racha. Día sin nada agendado pero con algo completado (fecha de sus puntos): **tono 2** y suma (cambia lo dicho antes de «pintarlo suave», para que la regla no tenga excepciones).
- Racha: días seguidos que suman, contados desde ayer hacia atrás; hoy suma apenas llega al 50% y, si no llega todavía, no corta. Descanso (nada agendado ni hecho): no corta ni suma. Récord: la racha más larga desde el día 1.
- Vista: 12 semanas lun–dom, hoy con borde; cuenta más nueva → empieza en su primera semana. Tocar un día: «jueves 23 de oct · 4 de 5 (80%)», «Descanso» o «Sin nada agendado · completaste 2»; VoiceOver lee lo mismo. Arriba racha y récord; al lado del título, puntos de la semana (lun–dom).
- Costo aceptado: mover algo de día o completarlo atrasado cambia la historia de ese día.
- Lógica pura en `utils/progreso.ts`; vista en `components/ui/progreso/`.
- Pruebas: 0–4 de 4; día sin agenda con y sin algo hecho; racha con descanso al medio; hoy < 50% no corta; cambio de mes y año; cuenta de menos de 12 semanas.

**3 · Tus mesas: rating y área** (aprobada el 25/10; va en el Perfil):
- Rating 0–100 = «cómo vas ahora» en la mesa (con sus grupos y rutinas), últimas 4 semanas. Cada cosa con fecha que ya pasó cuenta: completada suma, no completada (vencida) pesa en contra; las cosas sin fecha completadas suman el día de sus puntos. Pesos por semana: esta ×4, anterior ×3, luego ×2 y ×1. Ejemplo: 5/5, 4/6, 3/4, 2/5 → (20+12+6+2)/(20+18+8+5) = 40/51 → 78.
- Mesa quieta (nada en 4 semanas): conserva su último valor y baja 5 por semana sin movimiento. Mesa nueva: «Aún sin datos» hasta tener 3 cosas evaluadas.
- Etiqueta contra hace 7 días: +5 o más «Sube», −5 o menos «Baja», si no «Igual». General no tiene rating (solo suma a puntos y nivel).
- Área: Estudio (school), Trabajo (briefcase), Salud (barbell), Hogar (home), Social (people), Personal (heart), Ionicons de línea. Se sugiere por el nombre (Universidad/tesis/curso → Estudio, gym → Salud, casa → Hogar…; si no reconoce, Personal). Se elige con 6 chips en FormMesa (debajo de nombre y color); la sugerida va marcada mientras escribes hasta que tocas otra. Mesas existentes usan la sugerida hasta que el usuario elija; solo se guarda cuando la cambia.
- Fila: anillo con el color de la mesa e ícono del área, nombre, área, número y Sube/Igual/Baja. Tocar abre ahí mismo el heatmap de esa mesa y «23 completadas · 3 vencidas en 4 semanas».
- En F, un amigo ve tus áreas (ícono y número); si ve el nombre de la mesa se decide en F.
- Pruebas: el ejemplo; mesa nueva < 3 cosas; mesa quieta 3 semanas (−15); flecha en +5 y −5; General sin rating; sugerencia de área con varios nombres.

**4a · Catálogo de logros** (aprobada el 25/10): 24, iguales para todas las cuentas.
- Constancia (7): racha de 3, 7, 14, 30, 60 y 100 días; Semana perfecta (7 días seguidos al 100%; los descansos no cortan). Íconos flame / sparkles.
- Volumen y niveles (10): 10, 50, 100, 250, 500 y 1.000 cosas listas (accionables completadas, no borradas); nivel 5, 10, 15 y 20. Íconos checkmark-done / star.
- Primeras veces (7): primera cosa completada, primera mesa, primera rutina, primera meta cumplida, primer día al 100%, primer audio a Neka, primer plan de Neka aceptado. Íconos checkmark-circle / layers / repeat / trophy / ribbon / mic / chatbubble-ellipses.
- Todo se calcula de lo existente. Un logro nunca se pierde: al desbloquearlo se guarda la fecha en que se vio (protege casos como el primer audio, porque el chat guarda solo los últimos 100 mensajes). Los logros no dan puntos.
- Perfil: 8 logros (los 4 más recientes y los 4 más cerca, con anillo de avance); «Ver los 24 logros» abre una hoja por familia. Los bloqueados de primeras veces dicen cómo conseguirlos.
- Al lanzar E: un solo modal «Ya tenías 9 logros» en vez de uno por logro. En F se puede sumar «Primer amigo».
- Pruebas: cada umbral justo antes y justo en el número; logro que se queda aunque se borre lo que lo dio; semana perfecta con descanso al medio; primera entrada sin fechas guardadas.

**4b · Modal de logro** (aprobada el 25/10, [maqueta 04](E_MAQUETA/04-modal-de-logro.html), opción B): tarjeta al centro sobre lo que estabas haciendo, fondo atenuado (`color.backdrop`), Neka pose 5 saltando desde la esquina de arriba. Animación: el anillo se completa, la medalla gira de gris con candado a violeta, brillo suave, vibración de éxito; con «reducir movimiento» solo aparece. «Genial» cierra; «Ver mis logros» lleva al Perfil. Sale una vez por logro aunque se abra en otro dispositivo. Al lanzar E: un solo modal «Ya tenías N logros».

**5 · Pantallas** (aprobada el 25/10):
- Perfil (`pages/Perfil.tsx`): encabezado con engranaje (abre Ajustes); identidad con avatar, nombre, roles y «En Nekal desde agosto de 2026», lápiz = hoja de editar perfil; tarjeta de nivel lavanda (nivel, puntos, barra, «X pts para el nivel N»; `ProgressBar` con variante de riel blanco); logros (8 + «Ver los 24 logros» en hoja por familia); tus mesas (filas con anillo, se abren ahí mismo). La sección «Cuenta» (correo, sincronización, reintentar, conflictos, cerrar sesión, modo invitado) se muda tal cual al inicio de Ajustes.
- Resumen (`pages/Resumen.tsx`): sale la tarjeta «Progreso»; debajo de «Hoy» van «Tus días» (título con «+N pts esta semana»; racha, récord y heatmap) y «Desde el día 1» (texto + curva de puntos con un punto por subida de nivel y etiqueta en la primera y la última; día 1 = fecha más antigua entre cosas y puntos; con menos de 2 semanas solo texto; VoiceOver lee un resumen). El anillo de nivel queda igual y al tocarlo lleva al Perfil.
- Modal de logro (`components/ui/progreso/LogroNuevo.tsx`): montado una vez en el TabNavigator (como HojaPlan); cuando cambian los datos revisa logros desbloqueados sin ver y los muestra de a uno; 4 o más juntos → tarjeta resumen «Ya tenías N logros». Al cerrar guarda la fecha vista. Resortes del sistema de diseño, `haptic.success`, «reducir movimiento» = solo aparece. VoiceOver anuncia «Logro nuevo: …» y el modal bloquea lo de atrás.
- Ajustes reescribe «¿Cómo se calculan los puntos?» (fórmula, bonus a tiempo, curva). Editor: «48 pts estimados (+20% si lo terminas antes del viernes)». FormMesa: 6 chips de área.

**6 · Datos, reglas y pruebas** (aprobada el 25/10): solo se guardan el área de la mesa y un documento por logro visto (id y fecha; máximo 24); reglas con forma vieja o nueva para mesas y tipo nuevo `logros`; `/security-review` y skill de auditoría; publicar reglas solo con permiso; la tarjeta del lanzamiento suma «Ahora cada nivel cuesta un poco más. Tus puntos siguen intactos.» Precisión al escribir la spec: la mesa sin el campo `area` usa la sugerida (no se guarda un área vacía).

**Spec escrita:** [E_GAMIFICACION.md](E_GAMIFICACION.md).

## Pendiente

- Revisión de la spec por el usuario; después, el plan de implementación.

**Reparto Perfil / Resumen** (aprobado con la [maqueta 03](E_MAQUETA/03-perfil-y-resumen.html); revisa la fila «Dónde vive»): pensando en F, **Perfil = lo que muestras** (nombre, nivel, logros, tus mesas; en F se suman los amigos y un amigo ve lo mismo en corto) y **Resumen = tu día a día** (tus días con racha y heatmap, desde el día 1; reemplaza la tarjeta «Progreso»). El anillo de nivel del Resumen queda igual que hoy y lleva al Perfil (al usuario no le gustó verlo cambiado en la maqueta).

## Contexto que existe hoy

- Puntos por cosa completada (`pointsFor`: dificultad × prioridad + dependientes), historial `rewards` con fecha y sin duplicar; nivel = 1 cada 100 puntos.
- Resumen: anillo de nivel y tarjeta "Progreso" con barra (preparada para crecer, spec A). Perfil: nombre, nivel y puntos.
- Referencias del roadmap (videos): chips de filtro, tarjetas que se abren con su heatmap, grilla de logros bloqueados con modal de revelado.
