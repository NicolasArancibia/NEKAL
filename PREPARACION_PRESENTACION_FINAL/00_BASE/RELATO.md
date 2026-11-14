# Relato del proyecto Nekal (noviembre 2026)

Fuente única de contenido para láminas, presentación y video. Armado por Claude desde el anteproyecto (mitad de año) y `DOCUMENTOS/V2`. **Nicolás debe revisarlo**: lo que cambió desde el anteproyecto está interpretado desde la app, no dictado por él.

- **[FALTA]** = no existe todavía o no lo tengo. No inventar: dejar el espacio marcado.
- **[REVISAR]** = redacción mía que Nicolás tiene que confirmar.

## Ficha

- **Proyecto:** Nekal
- **Autor:** Nicolás Arancibia de Groote
- **Mención:** Diseño de Interacción Digital — Facultad de Diseño, Universidad del Desarrollo
- **Instancia:** Proyecto de Título 2026 (Taller de Título)
- **Profesores guía:** Mauricio Reyes y Alex Hurtado
- **Frase de la app:** «Organiza tu día. Neka te avisa si algo choca.»
- **Bajada [REVISAR]:** Planificador personal que negocia contigo cuando tus planes cambian.

## 1. Contexto

Cada interrupción que obliga a reorientar la atención tiene un costo medible: consume tiempo y sube el estrés, porque hay que reconstruir el contexto de lo que se estaba haciendo (Gloria Mark, *Attention Span*, 2023).

## 2. Problema: asimetría de planificación

Las personas reorganizan constantemente su planificación por cambios que vienen de distintos ámbitos de su vida, pero las herramientas actuales no apoyan ese proceso de manera integrada: obligan a redistribuir a mano tareas, prioridades y tiempos.

Glosario:

- **Reorganización de la planificación:** ajustar tareas, prioridades y tiempos cuando aparecen cambios.
- **Estructuras temporales externas:** bloques de tiempo de actividades que no dependen de uno.
- **Negociación:** conciliar compromisos, prioridades y necesidades personales cuando distintos ámbitos compiten por el mismo tiempo.
- **Carga cognitiva de reorganización:** el esfuerzo mental de recordar pendientes, detectar conflictos, comparar prioridades y redistribuir actividades.

## 3. Evidencia

Encuesta exploratoria propia, Nekal 2026, n = 48:

- 81,3 % ha usado alguna herramienta digital de organización; solo 39,6 % la sigue usando.
- 85,4 % modifica su planificación al menos una vez por semana; 54,2 % a diario o varias veces por semana.
- 62,5 %: cuando aparece una obligación académica o laboral que no se puede mover, es la persona quien reorganiza a mano todo lo demás.
- 72,9 % aceptaría que una herramienta digital intervenga para ayudar a reorganizar, manteniendo la decisión final.

Externa: 82 % abandona las apps de productividad en la primera semana y 93 % en el primer mes (De Luna et al., KTH Royal Institute of Technology, 2025).

Lectura: cambiar los planes no es la excepción, es lo normal. El desafío no es registrar, es mantener vigente la planificación cuando las condiciones cambian.

## 4. Marco teórico

- **Carga cognitiva** — la memoria de trabajo es limitada; demasiada información dificulta decidir (Sweller, 2019).
- **Autorregulación** — pensamientos y conductas que genera la propia persona para lograr objetivos (Zimmerman, 2002).
- **Gestión personal de información (PIM)** — crear, guardar, organizar y mantener información para cumplir objetivos (Jones, 2008).
- **Mente extendida** — la mente funciona en colaboración con recursos externos (Clark, 1997).
- **Gamificación** — elementos de juego en contextos que no son juego (Deterding et al., 2011).

Evolución de referentes (línea de tiempo del anteproyecto): escritura cuneiforme (3500 a. C.) → el cero (700 d. C.) → quipu inca (1450) → archivos físicos (1800–1995) → agendas electrónicas (1995) → apps actuales.

## 5. Estado del arte

| Referente | A favor | En contra |
|---|---|---|
| Notion | Flexible, centraliza todo | Mucho mantenimiento manual; no detecta ni negocia choques |
| Todoist | Simple y rápida, buenos recordatorios | Binaria (hecho / no hecho); lo atrasado se acumula |
| Google Calendar | Muestra bien el tiempo comprometido; estándar | No ayuda a gestionar; no detecta ni negocia choques |
| Motion, Reclaim AI, Sunsama | Automatizan y sugieren bloques | Optimizan y ejecutan; no negocian con la persona |

Vacío: nadie media la negociación entre la persona y las estructuras externas dejando la decisión final en la persona.

## 6. Pregunta de investigación

¿Qué atributos debe tener un sistema planificador que medie en la negociación entre las personas y los contextos temporales a los que pertenecen, para mitigar las asimetrías de planificación?

## 7. Objetivos

**General:** diseñar un sistema planificador negociador con recursos mnemotécnicos, dirigido a personas con dificultades de organización, mediante IA y mecánicas de gamificación, para conciliar de forma más simétrica sus objetivos personales con los de las estructuras organizacionales.

**Específicos:**

1. Identificar patrones de conducta y quiebres en la planificación (encuesta y entrevistas).
2. Definir las funciones del sistema mnemotécnico y gamificado (análisis de referentes y marco teórico).
3. Diseñar la información y el prototipo navegable (metodología centrada en el usuario).
4. Evaluar la propuesta con usuarios reales (pruebas de usabilidad e iteración).

## 8. Usuarios

- **Principal — estudiante universitario:** su calendario lo fija la institución; reorganiza la semana cada vez que choca con un plazo no negociable. «No decide, solo reacciona.»
- **Secundario — trabajador:** reuniones, turnos y entregas predefinidos. «Ajustarse le sale más barato que reclamar.»
- **Transversal — cualquier persona con compromisos externos.** «Un cambio nunca llega solo.»

## 9. La propuesta hoy

Nekal es una app de organización personal con una asistente, Neka. Anotas lo que tienes que hacer, la app lo ordena en el tiempo, y Neka te avisa si algo choca y te propone cómo arreglarlo. **Tú siempre confirmas antes de que algo cambie.**

Principios [REVISAR]:

1. **Neka propone, tú decides.** Nada cambia sin tu sí.
2. **Lo fijo no se mueve** (una clase, una visita); lo flexible solo con tu aprobación.
3. **Nada se borra solo.** Lo atrasado no desaparece ni se acumula en silencio: Neka pregunta por una cosa importante a la vez (Reprogramar / Ya la hice / Soltarla).
4. **La propuesta que ves es exactamente la que se aplica.**

Las cinco partes de la app:

| Pestaña | Qué hace | Aporte |
|---|---|---|
| **Resumen** | Qué viene ahora, qué falta hoy, racha y mapa de tus días | Menos búsqueda manual |
| **Calendario** | Todo lo que tiene fecha, por mes o como agenda; marca choques y ofrece «Arreglar con Neka» | Ver el conflicto antes del atraso |
| **Espacio** | Tus cosas en mesas (Casa, Trabajo, Universidad…) alrededor de «hoy», en un círculo del tiempo: hoy, mañana, la semana, sin fecha | Externaliza la planificación (recurso mnemotécnico) |
| **Neka** | Chat por texto o voz. «Voy atrasado 20 minutos» → propone un plan dibujado en el día → Aceptar o Descartar | Menos esfuerzo de calcular cada reajuste |
| **Perfil** | Nivel, 25 logros, rating por mesa, amigos con perfil en corto | Motivación para mantener el hábito |

Cómo negocia Neka (para el esquema de «cómo funciona»):

1. **Pides o cambia algo** — por texto, voz o desde un choque en el Calendario.
2. **Neka lee tu agenda** — qué es fijo, qué es flexible, duración, jornada.
3. **Arma un plan** — mueve solo lo flexible y salta lo fijo.
4. **El plan se revisa solo** — no puede crear choques nuevos; si la agenda cambió mientras esperabas, se avisa y se pide de nuevo.
5. **Tú decides** — Aceptar o Descartar, viendo el día dibujado.
6. **Se aplica y queda guardado** — sincronizado en tu cuenta.

## 10. Qué cambió desde el anteproyecto [REVISAR]

| Anteproyecto | Hoy | Por qué |
|---|---|---|
| Sistema multiagente (planificador, revisor, monitor) | Una sola asistente, Neka, con revisión por código | Más simple de entender y más confiable: el revisor ya no es otra IA, son reglas que no fallan |
| Interfaz espacial con bloques para arrastrar; se probó una vista 3D de mesas | Círculo del tiempo | La vista 3D y el plano no se leían bien en el iPhone; el círculo responde «qué tengo y cuándo» de un vistazo |
| «Perfil: reglas personales de equilibrio» | Perfil = progreso (nivel, logros, rating, amigos); la jornada se define en Ajustes | [FALTA] razón dicha por Nicolás |
| Prototipo navegable de 6 pantallas | App real y funcionando: cuentas, datos en la nube, web publicada e iPhone | Se decidió que todo fuera real y no pantallas de muestra |
| — | Amigos (código de 6 caracteres, perfil en corto) | Parte de la gamificación |
| — | Lo «atrasado» como regla propia y Neka que pregunta | Responde a la crítica a Todoist: lo atrasado no se acumula |

## 11. Proceso y decisiones

Versiones: **V0** (exploración) → **V1** (primera app publicada en la web) → **V2** (octubre–noviembre 2026), por fases:

- **A** Sistema de diseño · **B** Espacio (tres vistas probadas: Tiempo, Mesas 3D y Plano) · **D** Neka con IA · **E** Gamificación · **F** Amigos · **H** Estabilización (Neka sin choques, vistas simples) y conexiones con Google Calendar (en curso).

Material de proceso disponible: maquetas de cada fase en `DOCUMENTOS/V2/*_MAQUETA/`, la mega maqueta (`DOCUMENTOS/V2/MEGA_MAQUETA/mega-maqueta.html`, incluye una sección «Evolución» con las versiones viejas y el porqué de cada cambio) y referencias en `IDEAS_ESPACIODETRABAJO/`.

## 12. Con qué está hecha

Expo y React Native con TypeScript (una sola base para web e iPhone), Firebase (cuentas, base de datos, alojamiento) y Gemini Flash-Lite por Firebase AI Logic. Más de 330 pruebas automáticas cuidan la lógica. Web publicada: `nekal-973b2.web.app`.

## 13. Lo que la pauta pide y todavía no existe

- **[FALTA] Validación con usuarios:** pruebas de usabilidad de la V2 (quiénes, cuántos, qué tareas, resultados, qué se cambió). Es el objetivo específico 4 y la pauta lo evalúa directo.
- **[FALTA] Costos y financiamiento:** honorarios, gastos operacionales, producción (programación, servicios) y posibles fuentes de financiamiento. Dato disponible: hoy corre en planes gratuitos de Firebase y Gemini.
- **[FALTA] Impacto y variables éticas:** qué pasa con los datos personales y la IA, impacto social esperado.
- **[FALTA] Proyección:** ideas ya anotadas en el roadmap — Google Calendar y Outlook, espacios compartidos con amigos, Neka por WhatsApp, widget del iPhone, resumen diario, app nativa.
- **[FALTA] Planificación del trabajo:** carta Gantt real de lo hecho (las fases de arriba con sus fechas sirven de base).
- **[FALTA] Conclusiones:** respuesta a la pregunta de investigación.

## 14. Referencias

- Clark, A. (1997). *Being there: Putting brain, body, and world together again.* MIT Press.
- Cooper, A., Reimann, R., & Cronin, D. (2007). *About face 3: The essentials of interaction design.* Wiley.
- de Luna, S., Fredriksson, V., Påhlman, M., & Källsner, P. O. (2025). *Boosting user retention through effective app onboarding.* KTH Royal Institute of Technology.
- Deterding, S., Dixon, D., Khaled, R., & Nacke, L. E. (2011). From game design elements to gamefulness: Defining «gamification». ACM.
- Jones, W. (2008). *Keeping found things found.* Morgan Kaufmann.
- Mark, G. (2023). *Attention span.* Hanover Square Press.
- Norman, D. A. (2013). *The design of everyday things.* Basic Books.
- Sweller, J., van Merriënboer, J. J. G., & Paas, F. (2019). Cognitive architecture and instructional design: 20 years later. *Educational Psychology Review, 31*, 261–292.
- Zimmerman, B. J. (2002). Becoming a self-regulated learner: An overview. *Theory Into Practice, 41*(2), 64–70.
- Referentes digitales: Google Calendar, Notion, Todoist, Motion, Reclaim, Sunsama (s. f.).
