# V2 · H2 — Registro de implementación (Vistas simples)

Copia del registro de ejecución del [plan H2](H2_PLAN_IMPLEMENTACION.md) (2 nov 2026): cada tarea, las decisiones tomadas (`Ruling:`) con su costo si fueran erradas. Spec: [H2_VISTAS.md](H2_VISTAS.md). Maquetas: [H_MAQUETA/](H_MAQUETA/).

- Prueba en el iPhone y decisión sobre dejar o esconder el Plano: pendientes del usuario. Mezcla en `main`: pendiente de su visto bueno.
- Reglas de Firestore: sin cambios (nada nuevo se guarda; «atrasada» se deriva).
- Pendiente de la revisión final: ver el mensaje de cierre de la sesión.

# SDD ledger — plan: DOCUMENTOS/V2/H2_PLAN_IMPLEMENTACION.md

Spec: DOCUMENTOS/V2/H2_VISTAS.md. Ejecución nativa (inline), rama v2/h2-vistas. Sin subagentes (el usuario no los quiere). Maquetas H/02 y H/03 aprobadas.
- Pre-flight: T1→T2/T4/T8/T9: Produces estaAtrasada/atrasadas/esImportante / consumen las mismas firmas — consistente.
- Pre-flight: T3→T7: agruparNodos(nodos,max?)→{puntos,burbujas} / la interfaz de T7 la usa igual — consistente.
- Pre-flight: T4→T5: agenda(d,now,dias?,mesa?)→DiaAgenda[] / T5 la consume — consistente.
- Pre-flight: T8→T9: aHoy y aPapelera (T8) / T9 usa aPapelera para «Soltarla» — consistente.
- Pre-flight: T2 puede romper pruebas viejas de rutinas/planner/neka que suponían que lo atrasado cuenta — se ajustan con Ruling.
- Pre-flight: T5 deja el modo Plano como aviso «Pronto» hasta T6 — estado intermedio aceptado (no se publica).
Task 1: complete (commits 27e1f41..dff1c2d, tests: npm test → ℹ duration_ms 1818.8543)
- Task 2: Ruling: el contexto de Neka no necesita filtrar las atrasadas por código — todas tienen fecha de hace más de 2 días y su ventana (ayer…+14) ya las deja fuera; solo se agregó la línea «Atrasadas importantes: N.» y una prueba que lo fija — costo si mal: ninguno.
- Task 2: Ruling: cambios aplicados con un script (no con Edit) porque el formateador reescribe líneas ajenas en estos archivos — costo si mal: líneas de más de 80 columnas en planner.ts.
Task 2: complete (commits dff1c2d..159d3cb, tests: npm test → ℹ duration_ms 1647.8272)
Task 3: complete (commits 159d3cb..7d5cf0e, tests: npm test → ℹ duration_ms 1698.712)
- Task 4: Ruling: la agenda incluye lo pendiente de ayer y anteayer (aún no «atrasado») además de hoy en adelante — sin eso esas cosas no estarían en ninguna lista (ni agenda ni hoja Atrasadas) — costo si mal: dos secciones de días pasados al comienzo de la agenda.
Task 4: complete (commits 7d5cf0e..b1c4990, tests: npm test → ℹ duration_ms 1735.0625)
- Task 5: Ruling: cada fila de la Agenda lleva la hora de inicio en la columna de ListRow y, debajo, «hasta HH:mm · N min · Mesa» (no el rango completo de la maqueta) — ListRow reserva esa columna de hora; se agregó la prop opcional `detail` — costo si mal: un texto distinto al de la maqueta.
- Task 5: Ruling: el botón «Hoy» en Agenda sube al comienzo; en Mes va al mes de hoy; en Plano no aparece — costo si mal: ninguno.
- Task 5: verificado en el navegador (invitado + nekalDemo): Agenda con Ayer/Hoy/Mañana, «Choca» y «Arreglar con Neka»; Mes igual que antes; el modo se guarda en `nekal:calendario`.
Task 5: complete (commits b1c4990..3a50fe0, tests: npm test → ℹ duration_ms 1719.4242)
- Task 6: Ruling: EspacioTrabajo conserva su rama de Plano propia hasta la Task 7 (que la quita); PlanoVista es una copia de esa rama, no una extracción compartida — evita tocar dos pantallas a la vez; hay código duplicado unos commits — costo si mal: ninguno (la Task 7 lo elimina).
- Task 6: Ruling: en Plano, PlanoVista muestra el nombre del lugar solo cuando se entró a una mesa o grupo (el título «Calendario» ya está arriba); en la vista lejana sigue «Editar» como antes — costo si mal: un título menos.
- Task 6: verificado en el navegador: el segmento Plano muestra mesas y grupos (70 cosas); «Ver dónde está» desde el círculo abre el Calendario en Plano, en General, con «Reunión con Pía».
Task 6: complete (commits 3a50fe0..595893a, tests: npm test → ℹ duration_ms 1705.0336)
- Task 7: Ruling: el botón «Editar» del Espacio desaparece (era del Plano y de Mesas); la mesa se sigue editando manteniendo apretado su nombre en el círculo — costo si mal: un camino menos para editar General.
- Task 7: Ruling: el número «N cosas» del Espacio viene del propio círculo (onCuenta) y no de contar todo — así coincide con lo que se ve — costo si mal: ninguno.
- Task 7: verificado en el navegador: título «Espacio» sin selector, una preferencia vieja con «mesas» abre el círculo, burbuja «+11» con su lista, primer toque marca y muestra el nombre, segundo abre la hoja; sin errores. (Los errores «Element type…» que se vieron antes eran mensajes viejos del buffer de la consola y clics mal apuntados.)
Task 7: complete (commits 595893a..0c97375, tests: npm test → ℹ duration_ms 1610.827)
- Task 8: Ruling: dentro de «Importantes» el orden es el de `atrasadas()` (más reciente primero), no «urgente primero»; el orden urgente/con entrega se usa para la pregunta de Neka (Task 9) — la hoja las muestra todas juntas con su etiqueta — costo si mal: un orden distinto en la hoja.
- Task 8: Ruling: «Las demás» muestra 20 y «Ver N más» de a 20 — con cientos de filas la hoja se pondría pesada — costo si mal: un toque más para ver todo.
- Task 8: Ruling: el confirmar de la papelera es un segundo paso en la misma hoja («Sí, mandar N» / «Cancelar»), sin ventana encima, como en las hojas de Amigos — costo si mal: ninguno.
- Task 8: verificado en el navegador (35 atrasadas inyectadas en el invitado): píldora «35 atrasadas», hoja con 2 importantes y 33 más, «A hoy» deja «Pagar la patente» a las 8:15 de hoy, papelera de 34 con confirmación, estado vacío y píldora oculta. La fila de la Agenda se verifica en la Task 10 con los datos del demo.
Task 8: complete (commits 0c97375..884bb90, tests: npm test → ℹ duration_ms 1725.2872)
Task 9: Ruling: nekaState(data, now, pregunta: Item|null) recibe el Item elegido en vez de `preguntadas` — Resumen necesita conservar la cosa en pantalla y marcarla al mostrarla — cost if wrong: cambiar una firma
Task 9: Ruling: el micrófono se oculta cuando kind === "pregunta" — la tarjeta lleva 3 respuestas + pie y no cabe — cost if wrong: volver a mostrarlo
Task 9: complete (commits 884bb90..058c890, tests: npm test → ℹ duration_ms 2147.9481)
- Task 9: verificado en el navegador (invitado): la pregunta aparece (urgente primero), «Ya la hice» suma puntos y pasa a la siguiente, «Ver la lista» abre la hoja; con un choque de hoy, el choque va primero.
- Task 10: Ruling: la demo agrega 34 atrasadas fijas (2 importantes: «Renovar el pasaporte» urgente y «Entregar el formulario de beca» con entrega, más 32 pendientes de hace 3–40 días) con ids `demo-atr-*`; sigue idempotente y bajo 400 documentos — costo si mal: más ruido en la demo.
- Task 10: verificado: npm test 338/338, typecheck limpio, build:web ok y la clave de AI Studio no aparece en dist; en el navegador con nekalDemo: pregunta de Neka («1 importante más y 32 atrasadas»), Espacio con «34 atrasadas» y burbuja +11, Agenda con la fila «34 atrasadas».
