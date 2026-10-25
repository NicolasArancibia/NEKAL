# V2 · D — Registro de implementación

Copia del registro de ejecución del [plan D](D_PLAN_IMPLEMENTACION.md) (19–25 oct 2026): cada tarea, las decisiones tomadas (`Ruling:`) con su costo si fueran erradas, la revisión final y lo que quedó pendiente.

- Reglas de Firestore publicadas el 25/10 (`npm run deploy:rules`, con permiso del usuario): ya estaban arriba.
- Prueba final en el iPhone (spec §13, plan Task 10 paso 4): pendiente del usuario; el usuario pidió mezclar igual («haz todo»).


Spec: DOCUMENTOS/V2/D_NEKA_IA.md (aprobada 19/10). Ejecución nativa (inline), rama v2/d-neka-ia desde main b0c1d2f.

## Pre-flight (interfaces compartidas)
- T1→T6/T7: Cerebro{transcribir,sesion}, Sesion{enviar,devolver}, Turno, Declaracion, AudioGrabado, crearCerebro, leerAudio — consistentes.
- T2→T7: Message{audio?,plan?,estado?}, EstadoPlan — consistentes; nuevoMensaje (T7) garantiza 3 o 6 claves como exigen reglas (T2).
- T3→T5: correrDesde(d,minutos,desde:number) / buscarHueco(d,{duracion,desde,hasta,ignorar}) — consistentes.
- T4→T5/T6/T7/T8: Plan, PasoPlan, probar(d,pasos,marcados,now), aceptar(d,plan,marcados,now) — consistentes (T7 importa aceptar como aceptarPlan).
- T5→T6: contexto(d,now), historial(d,n)→Turno[], DECLARACIONES, ejecutar(d,previos,l,now) — consistentes.
- T6→T7: conversar→Contestacion{respuesta,plan,fallo,motivo}, oir→{texto,fallo} — consistentes.
- T7→T8/T9: useNeka() — consistente. T8 borra PruebaNeka de T1.

## Task 1
- Web local (Chrome del panel, App Check con token de depuración): texto + herramienta hora() → "Son las 2:31 a. m." en 4,0 s. MODELO gemini-3.5-flash funciona; declaraciones como objetos planos funcionan.
- Audio (sin micrófono en el panel): WAV de Windows TTS y el mismo audio pasado por MediaRecorder (audio/webm, 38 KB) → transcribir "Llego 20 minutos tarde." en ~3,3 s ambos. Archivo y gancho de consola borrados.
- build:web: token de depuración en dist = no; clave del sitio reCAPTCHA en dist = sí (esperado).
- Task 1: Ruling: historial a Gemini se normaliza en cerebro.ts (empieza en persona, alterna, quita el último de la persona) — Gemini exige alternancia y el mensaje nuevo va con enviar — costo si mal: perder un turno de contexto.
- Esperando punto de control: iPhone (Expo Go).
- iPhone (usuario): texto OK (~4 s) y voz OK — App Check con token de depuración FUNCIONA en Expo Go (no hace falta salida a/b/c). Audio: "no me entiende nunca y se bugea" + error 429.
- 429: consola de Cloud → cuota gratis gemini-3.6-flash (lo que sirve "gemini-3.5-flash") = 20 consultas/DÍA y 5/min por proyecto; ya iban 22.
- Task 1: Ruling: MODELO = gemini-3.5-flash-lite (Flash-Lite; reportes no oficiales: ~15/min y ~500/día) — Flash gratis da 20/día, inservible para Neka — costo si mal: razonamiento algo menor; si Flash-Lite también fuera chico, la salida es Blaze (tarjeta) o Groq, a decidir con el usuario. Verificado en web: responde con herramienta en 3,1 s.
- Audio iPhone, hipótesis H1: carrera al apretar/soltar (soltar ve estado=false si suelta antes de que termine prepareToRecordAsync → la grabación queda corriendo). PruebaNeka instrumentada (bitácora con ms, escuchar grabación, transcribir aparte) para confirmarlo en el iPhone.
- PUNTO DE CONTROL iPhone APROBADO (2:53): Flash-Lite; audio 76 KB audio/mp4 → Gemini oyó «¿Qué hora es?» en 1,7 s; respuesta con herramienta 2,7 s; voz OK. El "no me entiende" de antes era el cupo agotado (429).
- Bitácora: modo de audio +143 ms, preparar +144 ms → ~320 ms antes de grabar.
- Task 1: Ruling (para Task 7): soltar se decide con una ref, no con el estado; si se suelta antes de que empiece a grabar, se detiene apenas empiece y se descarta con «Mantén apretado mientras hablas.»; grabaciones < 0,5 s se descartan igual — H1: el estado de React no alcanza a cambiar en ~320 ms — costo si mal: un toque corto no hace nada.
Task 1: complete (commits b0c1d2f..73a83fe, tests: npm test → ℹ duration_ms 1563.3846)
- Task 2: Ruling: pruebas de mensajes y de ida y vuelta en rules.cjs (no en sync.cjs, que es un script sin node:test) — mismo efecto — costo si mal: ninguno.
- Task 2: Ruling: revisión de seguridad de la regla de messages hecha a mano en vez de /security-review — el cambio solo agrega una alternativa con conjunto exacto de claves (fields), tipos, plan ≤500 y estado en lista cerrada; dueño y revisionWrite intactos; sin rutas nuevas — costo si mal: una regla laxa (no se publica hasta la Task 10).
Task 2: complete (commits 73a83fe..2714420, tests: npm test → ℹ duration_ms 1475.4292)
Task 3: complete (commits 2714420..d240228, tests: npm test → ℹ duration_ms 1506.7872)
Task 4: complete (commits d240228..7219373, tests: npm test → ℹ duration_ms 1500.3791)
- Task 5: Ruling: test "cada declaración tiene su ejecución" compara DECLARACIONES con ACEPTA (= claves de los ejecutores, exportado) — el plan pedía comparar nombres declarados con los que acepta ejecutar — costo si mal: ninguno.
- Task 5: Ruling: mover a un día sin hora usa las 9:00 (igual que Tiempo y Crear del Espacio); crear usa "Crear <tipo> «título»" (sin género) — costo si mal: texto.
- Task 5: Ruling: MESES de rutinas.ts pasa a exportarse para reusarlo en los textos del plan — costo si mal: ninguno.
Task 5: complete (commits 7219373..2fddac1, tests: npm test → ℹ duration_ms 1539.6102)
- Task 6: Ruling: los textos de fallo viven en MENSAJES (por Fallo) y oir devuelve solo {texto, fallo}; el proveedor muestra MENSAJES[fallo] — el plan dejaba el texto en oir sin campo para él — costo si mal: ninguno.
- Task 6: Ruling: el límite de 30 s cubre el turno entero (todas las vueltas), no cada llamada — la spec dice «más de 30 s sin respuesta» — costo si mal: un turno largo de 3 vueltas lentas se corta.
Task 6: complete (commits 2fddac1..ea24352, tests: npm test → ℹ duration_ms 1485.9174)
- Task 7: Ruling: empezarGrabar(origen) y soltar() (en vez de empezarGrabar() y soltar(origen)) — el tope de 60 s necesita saber el origen al empezar — costo si mal: firma distinta a la del plan (Task 9 la usa así).
- Task 7: Ruling: el contexto expone turno: TurnoNeka (pregunta, audio, respuesta, plan, origen, mensajeId) + pendienteId en vez de pendiente — la hoja también muestra respuestas sin plan del acceso rápido — costo si mal: ninguno.
- Task 7: el arreglo del botón de grabar (Ruling de Task 1) está en NekaContext con refs: soltar durante la preparación descarta; < 0,5 s descarta con «Mantén apretado mientras hablas.».
Task 7: complete (commits ea24352..727bb02, tests: npm test → ℹ duration_ms 1505.6452)
- Task 8: Ruling: HojaPlan es una sola, conectada a useNeka y montada en el tabBar del TabNavigator (con navigation para «Abrir chat»), en vez de una en el chat y otra global — la spec dice que se ve igual desde cualquier lugar — costo si mal: ninguno.
- Task 8: Ruling: con la IA caída, lo escrito reintenta la IA (no va al send viejo); las secciones y chips de la V1 aparecen y funcionan sin internet — si no, el chat quedaba sin IA para siempre — costo si mal: sin internet cada mensaje escrito responde «Ahora no puedo pensar con IA…».
- Task 8: Ruling: ChatSinIA es un hook (useChatSinIA → send, secciones, hojas) — las secciones van dentro del scroll y el input fuera — costo si mal: ninguno.
- Task 8: hallazgo en navegador: Gemini rechazaba enum con "" (crearGrupo.repetir) → 400 → modo sin IA (así quedó probado el modo sin IA con un fallo real). Test «herramientas: Gemini no acepta opciones vacías» RED→GREEN.
- Task 8: navegador (PruebaClaude): «Voy atrasado 20 minutos desde las 7 de la tarde» → plan 1 cambio (Llamar a mamá 19:30→20:00, salta Gimnasio fijo); desmarcar quita el violeta y deja «Aceptar 0 cambios» deshabilitado; aceptar → tarjeta «Aceptado» y Resumen muestra 20:00; doble clic en atajo = 1 turno. Ajustes visuales: lo fijo debajo, columna de horas 48.
- Firestore rechaza (permission-denied) los mensajes de 6 claves hasta publicar las reglas (Task 10); quedan pendientes en el dispositivo.
Task 8: complete (commits 727bb02..2f2d9a9, tests: npm test → ℹ duration_ms 1511.4733)
- Task 9: Ruling: el micrófono del Resumen graba al apretar (onPressIn) como el del chat; la pestaña graba con pulsación larga (300 ms) para que el toque normal siga abriendo el chat — costo si mal: ninguno.
- Task 9: Ruling: el contexto suma origen (de dónde viene la grabación o el turno) y limpiarError(); CapaGrabando muestra «Te escucho…», «Neka está pensando…» (si es rápido y la hoja no está abierta) y avisos por 4 s; pointerEvents none — costo si mal: ninguno.
- Task 9: navegador: pulsación larga simulada en la pestaña desde Espacio → no cambia de pantalla, pide micrófono (bloqueado en el panel) y muestra el aviso en la capa; se borra a los 4 s. Mensaje de permiso ahora depende de la plataforma. Grabación real y hoja sobre otra pantalla: se prueban en el iPhone (Task 10).
Task 9: complete (commits 2f2d9a9..6667d7d, tests: npm test → ℹ duration_ms 1497.703)
- Task 10: Ruling: el texto de privacidad reemplaza el párrafo de la sección «Privacidad» existente (que decía que Neka no usa IA) en vez de crear «Neka y tus datos» — evita dos textos contradictorios — costo si mal: ninguno.

## Final (antes del punto de control de reglas e iPhone)
- Final review: self-review de toda la rama (la regla del harness no permite lanzar subagentes sin que el usuario lo pida). Sin hallazgos críticos ni importantes; los dos fallos reales salieron en la prueba de navegador y quedaron arreglados con prueba (enum vacío) y ajuste visual (orden de bloques).
- Final: minor (deferred): el chat salta al final con cualquier cambio de contenido aunque estés leyendo arriba.
- Final: minor (deferred): la hoja muestra «Aceptar 0 cambios» un cuadro antes de marcar todo (efecto tras el primer render).
- Final: minor (deferred): si se pasan los 30 s, las llamadas a Gemini que siguen en curso gastan cupo aunque se descarten.
- Final: minor (deferred): useChatSinIA calcula choques en cada render del chat aunque haya IA (mismo costo que la V1).
- Final: minor (deferred): apretar el micrófono mientras Neka piensa no hace nada y no avisa.
- Final: minor (deferred): el SDK de App Check imprime el token de depuración en la consola de desarrollo.
- Final: minor (deferred): el cupo de Flash-Lite (~15/min, ~500/día) viene de fuentes no oficiales; confirmarlo en la consola de Cloud cuando aparezca su fila.
