# V2 · H1 — Registro de implementación (Estabilizar Neka)

Copia del registro de ejecución del [plan H1](H1_PLAN_IMPLEMENTACION.md) (1 nov 2026): cada tarea, las decisiones tomadas (`Ruling:`) con su costo si fueran erradas, la revisión final y lo que quedó pendiente. Diagnóstico de origen: [H_DIAGNOSTICO_Y_PLAN.md](H_DIAGNOSTICO_Y_PLAN.md). Maqueta: [H_MAQUETA/01-plan-de-neka-estados.html](H_MAQUETA/01-plan-de-neka-estados.html).

- Prueba en el iPhone: pendiente del usuario. Mezcla en `main`: pendiente de su visto bueno.
- Reglas de Firestore: sin cambios (H1 no toca datos guardados).


Spec: DOCUMENTOS/V2/H_DIAGNOSTICO_Y_PLAN.md (+ D_NEKA_IA.md). Ejecución nativa (inline), rama v2/h-estabilizacion desde main ff7c4e5. Sin subagentes (el usuario no los quiere).
- Setup: Ruling: sin worktree, en la rama v2/h-estabilizacion de esta carpeta — práctica del proyecto en D, E y F — costo si mal: ninguno.
- Setup: Ruling: encabezados del plan renombrados de «Tarea N» a «Task N» — task-brief solo reconoce «Task N» — costo si mal: ninguno.
- Pre-flight: T1→T2: Produces choquesDelPlan(d,pasos,marcados,now)→Choque[] / T2 consume la misma firma — consistente.
- Pre-flight: T1→T6: Choque{clave,descripcion,bloquea} — T6 lo lee igual — consistente.
- Pre-flight: T3→agente.cjs:321: el test existente afirma noCaben=[{id,titulo}]; T3 agrega `alternativa` — conflicto esperado, se ajusta en T3.
- Pre-flight: T5→T6: mensajesDelTurno y `aviso` (T5) / Chat.tsx y HojaPlan (T6) — consistentes.
- Pre-flight: T1/T2 pueden hacer fallar pruebas viejas de agente.cjs que aceptan planes que chocan — se corrigen con Ruling si pasa.
Task 1: complete (commits 2a4534d..8af3838, tests: npm test → ℹ duration_ms 1543.854)
Task 2: complete (commits 8af3838..9bc3b3d, tests: npm test → ℹ duration_ms 1548.1146)
Task 3: complete (commits 9bc3b3d..1e1ccc3, tests: npm test → ℹ duration_ms 1491.2887)
Task 4: complete (commits 1e1ccc3..2c778b9, tests: npm test → ℹ duration_ms 1501.1562)
Task 5: complete (commits 2c778b9..82b22dd, tests: npm test → ℹ duration_ms 1567.2116)
- Task 5: Ruling: el aviso de fallo también se aplica al fallo al oír un audio (soltar), no solo a turnoCon — misma causa, mismo efecto — costo si mal: ninguno.
- Task 5: Ruling: Chat.tsx muestra `neka.aviso` con el ChatMessage de siempre ya en esta tarea (no espera a la maqueta H/01) — sin eso el fallo quedaba invisible entre T5 y T6; no cambia el diseño — costo si mal: ninguno.
- Task 3: Ruling: tests/agente.cjs:321 ajustado para incluir `alternativa` en noCaben (previsto en pre-flight) — costo si mal: ninguno.
- Task 2: Ruling: el error de choque a Neka añade «si es por lo que no cabe hoy, llévalo antes a otro día» — correrDesde puede dejar lo que no cabe encima de lo corrido y Neka no podía salir del rechazo sin esa pista — costo si mal: un texto más largo en el error.
- Task 6: maqueta H/01 mostrada (DOCUMENTOS/V2/H_MAQUETA/01-plan-de-neka-estados.html, manifiesto.json); esperando aprobación del usuario antes de tocar HojaPlan.tsx
- Task 6: maqueta H/01 APROBADA por el usuario («Sí, constrúyela») — se construye HojaPlan/NekaContext
- Task 6: Ruling: con el plan parcialmente marcado y un choque que bloquea, la hoja muestra «Con lo que dejaste marcado queda un choque» y deja «Aceptar» apagado (sin «Pedir de nuevo»); la maqueta C solo cubría «todo marcado» — evita decir «La agenda cambió» cuando la causa es que desmarcaste algo — costo si mal: un texto.
- Task 6: Ruling: el aviso «Ojo:» muestra la descripción del choque tal cual, sin la coletilla «que también es fija» de la maqueta — también cubre avisos de falta de hueco (capacity) — costo si mal: un texto menos explícito.
- Task 6: Ruling: se agregó a conversar un recordatorio de una sola vez cuando Neka dice «te propongo…» sin haber armado pasos (hallazgo en vivo: tras un choque rechazado, prometía un cambio sin plan) — no estaba en el plan; 3 pruebas — costo si mal: una llamada extra a la IA en esos casos.
- Task 6: verificado en vivo (invitado, clave AI Studio): choque rechazado y plan nuevo a las 15:30; «La agenda cambió» con «Pedir de nuevo»; plan aceptado y guardado sin choques nuevos.
Task 6: complete (commits 0b4ec3e..b5d1838, tests: npm test → ℹ duration_ms 1636.1055)

## Final (antes del punto de control de la prueba en iPhone y la mezcla)
- Final review: self-review (el usuario no quiere subagentes). Sin hallazgos Critical ni Important: el hueco B/C/D está cubierto por pruebas, la IA real se probó en vivo (clave AI Studio) y el único fallo real salió en esa prueba (promesa sin plan) y quedó arreglado con prueba.
- Final: minor (deferred): en invitado, un fallo de guardado local solo se ve en Ajustes («Cambios sin guardar»); con cuenta sí hay aviso en pantalla (ya era así antes de H1).
- Final: minor (deferred): «Pedir de nuevo» repite la pregunta como un mensaje nuevo (queda dos veces en el historial) y la IA ve un instante el plan anterior como pendiente.
- Final: minor (deferred): la prioridad es solo una instrucción para Neka; no hay código que ordene por prioridad al elegir qué mover.
- Final: minor (deferred): choques que ya existían (p. ej. «Reunión de equipo × Enviar avance» en los datos de ejemplo, creado por un plan aceptado antes de H1) no se arreglan solos: Neka no los atribuye a un plan nuevo; se piden con «Arregla los choques».
- Final: rendimiento medido: ejecutar(mover) 21 ms con 126 cosas y 108 ms con 400; choquesDelPlan 5 ms y 52 ms.
- Final: build:web OK; la clave de AI Studio y el nombre de su variable no están en dist.
- Final: pruebas 296/296, typecheck limpio. Pendiente del usuario: prueba en el iPhone (Expo Go) y visto bueno para mezclar en main.
