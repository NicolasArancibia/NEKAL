# V2 · B — Registro de implementación

Copia del registro de ejecución del [plan B](B_PLAN_IMPLEMENTACION.md) (17–18 oct 2026): cada tarea, las decisiones tomadas (`Ruling:`) con su costo si fueran erradas, la revisión final y lo que quedó pendiente.

Spec: DOCUMENTOS/V2/B_ESPACIO.md · rama v2/b-espacio (base main df7c3b6) · ejecución nativa
Pre-flight:
- T1→T8/T12: Punto3, Camara, INCLINACION, proyectar, ordenarPorProfundidad — consistentes.
- T2→T3/T4/T5: Group (parentId, repeat, repeatDays, repeatStart), validateGroup — consistentes.
- T3→T7/T9/T10: Destino, hijosDe, funciones de estructura — consistentes.
- T4→T5/T6/T7/T8/T9/T11: Ventana, Estado, estadoDe, fechaDe, timedItems, esModelo, moverAFecha, conexiones — consistentes.
- T6→T9..T12: tonos, tokens cable/vidrio/vidrioBorde/sombraPiso — consistentes.
- T7→T8: Rect, PuntoPlano, puntosEn — consistentes (agregado en autorrevisión).
- T8→T10/T12: Foco, acomodoMesas, elegir — consistentes.
- T5→T13: aplicarRutinas — consistente.
- Task 1: Ruling: la prueba 3D (en components/ui) usa solo tokens de theme.ts (sin hex) porque tonos() llega en T6 y styles.cjs prohíbe colores sueltos — costo si falla: colores de prueba menos fieles.
- Task 1: Ruling: lienzo en archivo propio (PruebaMesasLienzo) + marco común — PruebaMesas.web.tsx no puede importar ./PruebaMesas (se resolvería a sí mismo en web) — costo: un archivo más.
- Task 1: Ruling: el Canvas se monta cuando hay tamaño y fuentes — en web, si las dependencias del dibujo cambian después de montar, no se repinta (visto en QA) — costo: un instante sin dibujo al abrir.
- Task 1: Ruling: canvaskit.wasm en front/public/ va en .gitignore (8 MB, lo regenera postinstall) y se carga con locateFile '/canvaskit.wasm' — costo: si se clona sin npm install, falta el wasm.
- Task 1: tipos de la entrada web de Skia en src/types/skia-web.d.ts (el paquete no los publica en esa ruta).
Task 1: complete (commits df7c3b6..f305c2a, tests: npm test → ℹ duration_ms 1495.9294)
- Task 1 (revisión tras video del usuario: se veía mal, cubitos desordenados, zoom distinto a la 07): Ruling: la causa era la escena, no Skia (orden por centro en vez de por piso; faltaba degradé/puntos/vidrio; zoom sin entrar). Se rehízo la prueba según la 07 antes de decidir motor — costo: una iteración más de prueba.
- Task 1: Ruling: colores.ts (tonos) y tokens del tema (cable, vidrio, vidrioBorde, sombraPiso) adelantados desde la Task 6, con sus pruebas — los necesita la prueba — costo: la Task 6 solo hace el acomodo de Tiempo.
- Task 1: Ruling: sin gesto de inclinar (ángulo fijo 0.95, como la 07); se entra a Trabajo tocándolo o acercándose y se sale con '‹ General' o alejándose — inclinar chocaba con pellizcar — costo: si el usuario quiere inclinar, se agrega en la Task 12.
- Task 1: PUNTO DE CONTROL superado (17/10, video 2): el usuario aprueba Skia — 'se ve mucho mejor y se mueve bien'. Se sigue con Skia.
- Task 2: Ruling: la migración de x/y a orden es por contenedor y solo si hay alguna cosa con y≠0 (ordenarLegado), idempotente; se aplica en readBackup y en dataOf (la nube no trae versión) — costo: las funciones de estructura (Task 3) DEBEN renumerar el contenedor completo (y=0 en todas) al mover o reordenar.
- Task 2: Ruling: readEnvelope devuelve data y base ya migradas (antes solo validaba) — sin esto la copia local v1 quedaba sin migrar — costo: ninguno conocido.
- Task 2: Ruling: helper newGroup(name, workspaceId, extra) en model.ts y usado en Chat.tsx y EspacioTrabajo.tsx para crear grupos con los 7 campos — costo: ninguno.
- Task 2: respaldo v1 con respaldarV1() en syncStorage (clave <prefix>respaldo-v1) y AppContext local (<key>:respaldo-v1); tests/firestore.cjs no se corrió (requiere Java 21); reglas editadas, NO publicadas.
Task 2: complete (commits 9f146ec..0159318, tests: npm test → ℹ duration_ms 1490.8018)
- Task 3: Ruling: borrarMesa cuenta solo lo activo; las cosas borradas de esa mesa pasan a General (groupId "") — readBackup rechaza ítems sin mesa ("Hay ítems sin espacio.") y la persona no podría vaciar una mesa que se ve vacía — costo: restaurar algo borrado lo deja en General.
- Task 3: Ruling: editarGrupo cambia solo nombre y repetición; el lugar se cambia con moverGrupo — evita que cambie la mesa sin mover sus cosas — costo: la hoja de grupo llama a dos funciones si cambian ambas.
- Task 3: Ruling: renumeración solo de cosas activas del contenedor destino (los de origen quedan con huecos, y = 0); borrarGrupo sube también las borradas — costo: una cosa restaurada puede empatar x con otra (orden estable).
- Task 3: pruebas extra: "borrar mesa lleva lo borrado a General", "editar grupo cambia nombre y repetición, no el lugar", "hijosDe ordena grupos por nombre"; mensaje nuevo "Una de las cosas ya no existe." y "La mesa necesita un nombre.".
- Usuario (17/10): las pruebas en el navegador usan la cuenta de prueba PruebaClaude@gmail.com, con la sesión que el usuario deja iniciada (Claude no escribe la clave: Firebase Auth es externo). Antes de probar grupos nuevos con esa cuenta hay que publicar las reglas (spec §2.2) — pedir permiso.
Task 3: complete (commits 4d7281a..0b0dca8, tests: npm test → ℹ duration_ms 1541.8445)
- Task 4: Ruling: enVentana también es true para lo que se ve siempre (sin fecha o en curso), así una sola función decide qué está encendido; estadoDe sigue la prioridad del brief (hueco va antes) — costo: ninguno conocido.
- Task 4: Ruling: cargaDeContenedor usa timedItems (sin modelos de rutina) — el modelo es plantilla, contarlo duplicaría la carga de las ocurrencias — costo: una rutina sin ocurrencias se ve sin carga.
- Task 4: Ruling: rutaDe corta ciclos (dos dispositivos pueden dejar A↔B); arbol no los necesita cortar porque recorre desde las raíces — costo: grupos en ciclo o con padre inexistente no aparecen en el árbol (posible solo tras un choque de sincronización) — revisar en la revisión final.
- Task 4: OBLIGACIÓN para Task 9: el modelo de rutina sigue editable en Plano/Mesas; la hoja no debe ofrecer "completar" en un modelo (spec §2.1: el modelo no cuenta para el puntaje). saveItem no conoce rutinas.
- Task 4: pruebas extra: "ventana: sin fecha o en curso se ve siempre", "arbol: General primero, mesas por nombre y grupos anidados", "rutaDe: de la raíz al grupo" (con ciclo). Chat sigue usando items (= timedItems) para buscar propuestas: vienen de findConflicts, que ya usa timedItems.
Task 4: complete (commits 0b0dca8..5ddc658, tests: npm test → ℹ duration_ms 1531.6811)
- Task 5: Ruling: copiarGrupo lleva un 7.º parámetro opcional `ahora` (createdAt/updatedAt de las copias); las rutinas pasan el inicio del día de la ocurrencia — si cada dispositivo pusiera su hora, la nube vería dos registros distintos (createdAt choca al mezclar) — costo: createdAt de una ocurrencia es su día, no cuándo se generó (nadie lee createdAt hoy).
- Task 5: Ruling: copiarGrupo conserva x (el orden) e y = 0; ya no suma +30 como en la V1 (x/y de lienzo libre) — costo: ninguno, el test de "Reutilizar" sigue verde.
- Task 5: Ruling: nombre de ocurrencia con meses fijos ("3 may", "sep") en vez de toLocaleString — Hermes y Chrome pueden dar textos distintos y romper el determinismo — costo: ninguno.
- Task 5: Ruling: una rutina sin cosas en su modelo no genera ocurrencias (prueba extra "rutinas: sin modelo no genera") — evita grupos vacíos cada día — costo: una rutina recién creada aparece cuando le pones la primera cosa.
- Task 5: NOTA para Task 13: si la persona borra una ocurrencia, aplicarRutinas la vuelve a crear al abrir (excepciones fuera de alcance, spec §2.1). Y operation() rechaza más de 400 registros: una rutina con ~55+ cosas generaría 7 días de golpe y fallaría; el hook debería aplicar día por día si pasa — revisar.
Task 5: complete (commits 5ddc658..d417890, tests: npm test → ℹ duration_ms 1508.6825)
- Task 6: colores.ts y tokens ya estaban desde la Task 1 (ruling previo); esta tarea solo hizo acomodo/tiempo.ts. Commit "V2/B: acomodo de Tiempo" en vez de "colores de mesa y acomodo de Tiempo".
- Task 6: Ruling: los 14 px son entre centros; si no caben en el arco de su mesa, lo que sobra pasa a otra fila 14 px más afuera (garantiza la distancia dentro de un mismo anillo y mesa) — costo: con muchas cosas hoy en una mesa chica, una fila puede acercarse al anillo de mañana; en la banda de la ventana, dos filas de días distintos podrían tocarse (raro).
- Task 6: Ruling: sectores proporcionales a lo pendiente (sin completadas ni modelos); si hay más de 12 mesas o nada pendiente, partes iguales — costo: una mesa con todo completado queda con 30°.
- Task 6: Ruling: "en curso" con fecha dentro del tiempo elegido va en su día; con fecha más allá, al anillo de afuera (spec: "afuera, sin fecha o en curso"); atrasadas al de hoy — costo: ninguno conocido.
- Task 6: Ruling: diaDesdeRadio usa los mismos anillos en todos los tiempos (la banda llega al día 6 con hoy/semana, 13 con 2 semanas y 30 con todo); soltar en un día fuera del tiempo elegido deja la cosa tenue/oculta — costo: en "Hoy" se puede mandar algo a un día que no se ve.
- Task 6: diasHasta se exporta desde espacio.ts (lo usa tiempo.ts).
Task 6: complete (commits d417890..47f58a6, tests: npm test → ℹ duration_ms 1542.2253)
- Task 7: Ruling: de lejos, los grupos de General van como zonas en las 2 columnas antes de las mesas (General también puede tener grupos y el brief no decía dónde) — costo: si el usuario los quiere arriba con las sueltas, se mueven en Task 10.
- Task 7: Ruling: de lejos, adentro de una zona solo se dibuja un nivel de grupos, en grilla (2 columnas si el área mide ≥ 140); los que no caben (celdas < 30 px) suman sus puntos a los de la zona — nada desaparece — costo: con muchos grupos se ven como puntos sueltos de la mesa.
- Task 7: Ruling: alto de mesa = clamp(38·√cosas, 76, 240) (38 sale de la maqueta 07: 22 cosas → 178) — costo: ninguno.
- Task 7: Ruling: de cerca, las sueltas del contenedor no tienen tope (es lo que entraste a ver, se desplaza); el tope de 8 es por zona hija; el "+N más" ocupa la celda siguiente a la última ficha — costo: ninguno conocido.
- Task 7: puntosEn usa FNV-1a sobre el id (24 intentos; si no hay lugar a 8 px, el más alejado). Prueba extra de "todo" en Tiempo quedó en la Task 6.
Task 7: complete (commits 47f58a6..6b6ef8a, tests: npm test → ℹ duration_ms 1489.9361)
- Task 8: Ruling: Cubito lleva `lado` (48 normalmente); si las cosas sueltas no caben en el piso, la grilla se achica pareja (mín. celda 14) en vez de salirse del piso o esconder cosas — costo: con muchas sueltas los cubitos se ven chicos.
- Task 8: Ruling: piso h = 0,8·w; General mide según lo suyo (sueltas + sus grupos), no según todo; los grupos de General van en la misma grilla que las mesas (como en Plano) — costo: ninguno conocido.
- Task 8: Ruling: las mesas no se recentran al entrar: cada nivel es una grilla 2×N bajo el centro de su padre, así acercarse a una mesa es continuo; la cámara (vista) sigue al foco — costo: la Task 12 debe mover cx/cy al centro del foco.
- Task 8: Ruling: z por nivel = 0, −150, −290 y después −140 por nivel; en un grupo se ven todos los ancestros en vidrio, las hermanas (vidrio o sólidas si conectan) y las hijas — costo: con mucha profundidad los vidrios de arriba quedan fuera de pantalla.
- Task 8: Ruling: foco con un id que ya no existe se queda en el último que existe (otro dispositivo pudo borrarlo) — costo: ninguno.
- Task 8: Ruling: elegir usa el contorno convexo de las 8 esquinas proyectadas (tocar el costado de un cubito también cuenta) — costo: ninguno.
- Task 8: OBLIGACIÓN para Tasks 10–12: los acomodos reciben los datos tal cual; las ocurrencias "Anteriores" de una rutina (rutinas.ocurrencias) deben filtrarse/juntarse en la pantalla antes de acomodar (spec §2.1).
Task 8: complete (commits 6b6ef8a..f209f80, tests: npm test → ℹ duration_ms 1497.2959)
- Task 9: Ruling: ItemEditor ya trae su propio Sheet; HojaCosa lo reutiliza con 2 props nuevas (`acciones`, `sinCompletar`) en vez de envolverlo en otro Sheet — cumple la OBLIGACIÓN de la Task 4 (el modelo de rutina no ofrece "completado") — costo: ninguno.
- Task 9: Ruling: los formularios y hojas que se abren desde otra hoja se montan DENTRO de ella (ConectarCon dentro del editor; HojaCosa/FormGrupo/FormMesa dentro de MenuCrear) — en iOS dos Modal hermanos a la vez fallan — costo: al terminar se cierra todo junto.
- Task 9: Ruling: Nota/Idea desde Tiempo: el aviso "Quedará en <mesa>…" se muestra en la hoja al crear (prop opcional `aviso` de HojaCosa), no como aviso después de guardar — más simple y la persona lo ve antes — costo: no hay aviso posterior.
- Task 9: Ruling: FormGrupo recibe `juntar?: string[]` (selección múltiple → juntarEnGrupo) y un interruptor "Se repite" al juntar o editar; "Grupo" también está en MenuCrear (spec: rutina o grupo) — costo: ninguno.
- Task 9: Ruling: FormMesa.tsx se crea aunque la lista de archivos del brief no lo nombra (sí está en Produces); colores en COLORES_MESA (utils/colores.ts, datos) porque styles.cjs prohíbe hex en la interfaz; renombrar una mesa se hace en el form (General también se puede renombrar; su id no) — costo: ninguno.
- Task 9: Ruling: Chip acepta `accessibilityLabel` opcional (días "L M X…" se leen completos) — costo: ninguno.
- Task 9: Ruling: CapaConexiones dibuja la punta a mano (sin <Marker>) para que sea igual en web y iPhone; cosa nueva se crea al final del orden de su contenedor (x = máx + 1) y desde Tiempo a las 9:00 (citas en scheduledAt) — costo: ninguno.
- Task 9: verificación: npm test 131/131 (incluye styles.cjs), typecheck y build:web en verde. Sin revisión en navegador: las piezas aún no están montadas en una pantalla (Task 10).
Task 9: complete (commits f209f80..aed6350, tests: npm test → ℹ duration_ms 1547.0344)
- Task 10: Ruling: se borraron también PruebaMesasLienzo.tsx y PruebaMesasMarco.tsx (no solo PruebaMesas.tsx/.web.tsx); la Task 12 recupera el dibujo desde git (9f146ec) — costo: un `git show` en la Task 12.
- Task 10: Ruling: el estado `foco: Foco` no se agrega todavía (solo lo usa Mesas, Task 12); Plano usa `planoDestino` — costo: la Task 12 agrega `foco` y lo sincroniza con Plano.
- Task 10: Ruling: se quitó la búsqueda del Espacio V1 (no está en la spec); "Reutilizar" sigue como "Aplicar ahora" en FormGrupo al editar un grupo (spec §2.1) — costo: si el usuario extraña buscar, se agrega después.
- Task 10: Ruling: las conexiones de la cosa tocada quedan marcadas al cerrar la hoja (la hoja tapa el 92 % y no se verían); tocar el fondo las limpia antes de abrir "crear" — costo: un toque más para crear con algo marcado.
- Task 10: Ruling: "Anteriores" de una rutina se esconden con sinAnteriores() (nueva, con prueba) en Plano de lejos y de cerca; dentro de una rutina hay un chip "Anteriores (N)" para verlas — cumple la OBLIGACIÓN de la Task 8 para Plano.
- Task 10: Ruling: gruposBajo(d, a) se extrae de cargaDeContenedor (lo usa también el encabezado para contar) — costo: ninguno, pruebas verdes.
- Task 10: verificación en web (cuenta de prueba, 491×466): estado vacío ✓, crear mesa "Trabajo" ✓, entrar (tocar zona) ✓, crear 3 tareas desde el fondo y el + ✓, "Conectar con…" anidado ✓ (ficha "Espera 1", flecha borde a borde ✓), "Ver dónde está" ✓, lejos con puntos conectados (hueco, punteado) ✓, sync 0 pendientes ✓. NO verificado en web: arrastrar/reordenar, mantener para seleccionar y el puntito para conectar — el automatizador no genera "mantener y mover" que reconozca Gesture Handler (los toques sí); queda para el iPhone. NO probado: grupos/rutinas/juntar con la cuenta de prueba — las reglas publicadas rechazan grupos de 7 campos; hace falta `npm run deploy:rules` (pedir permiso).
Task 10: complete (commits aed6350..68b34a7, tests: npm test → ℹ duration_ms 1520.6543)
- Task 11: Ruling: tocar un anillo vacío crea en la mesa de la PORCIÓN tocada (no en el "foco"), con el día del anillo; el anillo de afuera crea sin fecha (dia "") — cada porción es una mesa y así es predecible; aún no existe `foco` (Task 12) — costo: si el usuario quiere que cree siempre en General, es un cambio de una línea.
- Task 11: Ruling: el arrastre de fecha se activa con 250 ms de mantener + mover y la selección con 500 ms quieto (6 px de tolerancia); pellizcar abriendo acorta el tiempo elegido y juntando lo alarga — costo: ninguno conocido.
- Task 11: Ruling: el disco de color mide lo que cabe (radio = lado/2) y los nombres de mesa van dentro del borde; en QA a 375 px el disco de 0,47·lado+18 se salía — costo: ninguno.
- Task 11: Ruling: la etiqueta de la banda dice "SEMANA", "2 SEMANAS" o "MÁS ADELANTE" (con Todo); con "Hoy" sigue diciendo "SEMANA" porque los anillos son los mismos — costo: ninguno.
- Task 11: verificación en web (modo INVITADO: la sesión de la cuenta de prueba se cerró al reiniciar y Claude no escribe la clave): sectores, anillos, "Hoy dom 18", tocar anillo de mañana en la porción Trabajo → menú con "Trabajo" + "lun, 19 oct" → tarea con fecha límite 2026-10-19 09:00 ✓, el punto aparece en el anillo de mañana ✓, etiqueta accesible "Entregar informe, lun, 19 oct, Trabajo" ✓, hoja al tocar ✓. NO verificado en web: arrastrar para cambiar la fecha, mantener para seleccionar y pellizcar (el automatizador no hace "mantener y mover") → iPhone.
Task 11: complete (commits 68b34a7..81d6ebf, tests: npm test → ℹ duration_ms 1455.1086)
- Task 12: Ruling: sin gesto de inclinar (ángulo fijo 0,95), como en la prueba aprobada en el iPhone (Ruling de la Task 1: inclinar chocaba con pellizcar) — costo: si el usuario lo pide, se agrega.
- Task 12: Ruling: pellizcar mucho (×1,7 del zoom del foco) entra al piso del centro y alejarse (×0,55) sube, como en la prueba; la cámara encuadra el foco y lo de abajo (zoom según la diagonal, 0,4–1,4) con spring motion.gentle (sin animación si reducir movimiento) — costo: ninguno conocido.
- Task 12: Ruling: se dibujan solo el nivel del foco, el de abajo y el de arriba (spec §5), filtrando lo que entrega acomodoMesas; Neka solo cuando General es un piso sólido (arriba) — costo: con mucha profundidad no se ven los vidrios lejanos.
- Task 12: Ruling: MesasAccesible solo se monta con el lector de pantalla encendido (AccessibilityInfo): con opacidad 0 igual taparía los gestos del lienzo — costo: ninguno.
- Task 12: Ruling: etiqueta de rutina en 3D = "RUTINA · NOMBRE" (la fuente de Skia puede no traer ↻); los gestos llaman a las funciones actuales vía ref (gesto memoizado) — costo: ninguno.
- Task 12: Ruling: en web el primer cuadro de Skia no se pinta si nada cambia tras montar; un "pulso" (shared value) un frame después obliga a redibujar (visto en QA) — costo: ninguno.
- Task 12: Ruling: `foco: Foco` vive en la pantalla; el encabezado ("‹ padre", título, cantidad, Editar y el +) usa el foco en Mesas y planoDestino en Plano; si el foco ya no existe vuelve arriba — costo: Plano y Mesas no comparten lugar (cambiar de vista no te deja en el mismo grupo).
- Task 12: verificación en web (modo invitado, 375×812): dibuja General con degradé, Neka conectada en ángulo recto, línea punteada y Trabajo con su punto ✓; tocar Trabajo baja (General vidrio, cubito "Entregar…" con altura) ✓; tocar el cubito abre la hoja ✓; "Ver dónde está" → Plano en Trabajo ✓. Nota de QA: las capturas del navegador vienen escaladas a ~0,925, por eso los primeros toques por coordenadas fallaban (no era la app). NO verificado en web: girar y pellizcar (dos dedos), cables entre mesas conectadas (lo cubren las pruebas de acomodo) → iPhone.
Task 12: complete (commits 81d6ebf..9e3543f, tests: npm test → ℹ duration_ms 1446.1907)
- Task 13: Ruling: useRutinas también corre cuando cambian los datos (no solo al cargar y al volver a la app), así una rutina recién creada muestra sus días al tiro; aplicarRutinas devuelve la misma referencia si no hay nada nuevo, sin bucles — costo: ninguno conocido.
- Task 13: verificación en web (invitado): rutina diaria "Mañana" + modelo "Estirar" → 7 ocurrencias 18–24 oct al tiro (8 cosas) ✓; al recargar siguen 9 cosas en total, sin duplicados ✓.
- Task 13: PUNTO DE CONTROL (reglas): PENDIENTE — se pidió permiso el 17/10 para `npm run deploy:rules` (solo reglas; `npm run deploy` publicaría también la web en producción) y el usuario aún no responde. No se publicó nada.
- Task 13: PUNTO DE CONTROL (iPhone): PENDIENTE — gestos de mantener/arrastrar/girar/pellizcar solo se pueden probar en el teléfono.
Task 13: complete (commits 9e3543f..b4017ed, tests: npm test → ℹ duration_ms 1489.4901)
- Post-13 (18/10): PUNTO DE CONTROL (reglas) RESUELTO — el usuario autorizó publicar solo las reglas; `npm run deploy:rules` → "released rules" (Firebase dijo que la versión ya estaba arriba; no se publicó la web).
- Post-13: pedido del usuario: datos de ejemplo de 2 semanas en la cuenta de prueba para probar en el celular. Ruling: función pura `sembrarDemo` (utils/demo.ts, 4 pruebas: válida, no duplica, reutiliza la mesa "Trabajo", < 400 documentos) + `nekalDemo()` en la consola solo con __DEV__ (useDemo); entra por la sincronización normal, nunca borra — costo: código de desarrollo en el repo (útil para la demo de la tesis).
- Post-13: sembrado en pruebaclaude@gmail.com: 69 cosas, 4 mesas, 10 grupos (3 rutinas, ocurrencias generadas por useRutinas), 0 cambios pendientes. Un 403 en consola no corresponde a la sincronización (estado sin pendientes ni errores).
- Post-13 (18/10): PUNTO DE CONTROL (iPhone) SUPERADO — el usuario probó en su celular con la cuenta de prueba: "funciona todo perfecto". Sin ajustes pedidos.
- Final review: /code-review high en esta sesión (sin revisor aparte: no se lanzan subagentes sin pedido del usuario). 9 hallazgos.
- Final: fixed borrar un día de rutina volvía modelo sus cosas — "estructura: un día de rutina no se borra" RED→GREEN, suite 140/140.
- Final: fixed sacar de un día de rutina lo volvía modelo — "estructura: sacar de un día de rutina no lo vuelve modelo" RED→GREEN, suite 140/140.
- Final: fixed modelo agregado otro día caía corrido — "rutinas: una cosa agregada después cae en su día" RED→GREEN, suite 140/140.
- Final: fixed rutina grande fallaba en silencio — "rutinas: de a una ocurrencia llega a lo mismo" RED→GREEN (useRutinas de a un día + aviso con el nombre de la rutina), suite 140/140.
- Final: minor (deferred): ocurrencias sin límite → con años se acerca al tope de 5000 ítems de readBackup.
- Final: minor (deferred): `now` del Espacio no avanza pasada la medianoche si no cambian los datos.
- Final: minor (deferred): fichaProps O(n²) por render.
- Final: minor (deferred): helpers duplicados (conexiones/aviso, diaCorto, MESES, vecinos, nodo).
- Final: minor (deferred): tamaños sueltos en la interfaz nueva del Espacio (CLAUDE.md: "sin colores ni tamaños sueltos").
- Final: investigado — "permission-denied" en un commit de ocurrencias (20:01): carrera entre el celular y el navegador generando las mismas ocurrencias; el motor reintenta, queda en 0 pendientes y los datos en la nube (ids deterministas, Review Focus 1). Sin cambio.
