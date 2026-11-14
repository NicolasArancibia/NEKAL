/*
  CONTENIDO DE LAS LÁMINAS DE NEKAL
  =================================
  Aquí están TODOS los textos e imágenes de las dos láminas.
  Para cambiar algo, edita solo lo que está entre comillas "así".

  Reglas simples:
  - No borres las comillas, las comas ni las llaves { } [ ].
  - **Dos asteriscos** alrededor de unas palabras las dejan en negrita.
  - Si un texto empieza con [FALTA], la lámina muestra un espacio marcado.
    Cuando tengas el dato, borra [FALTA] y escribe el texto real.
  - Si un texto empieza con [REVISAR], la lámina le pone una marca naranja
    para que lo confirmes. Cuando lo apruebes, borra [REVISAR].
  - Las imágenes se escriben como ruta desde esta carpeta, por ejemplo
    "../00_BASE/pantallas/03-resumen.png" o "imagenes/mi-captura.png".
  - Después de cambiar algo: doble clic en exportar.bat (ver LEEME.md).

  Todo sale de 00_BASE/RELATO.md. No hay cifras ni citas inventadas.
*/
window.NEKAL = {

  /* ---------- TAMAÑO DE IMPRESIÓN ---------- */
  formato: {
    ancho_cm: 50,
    alto_cm: 105,
  },

  /* true = muestra las marcas naranjas de [REVISAR]. Ponlo en false para la versión final. */
  mostrarMarcasRevisar: true,

  /* ---------- ENCABEZADO (igual en las dos láminas) ---------- */
  encabezado: {
    nombre: "Nekal",
    bajada: "[REVISAR] Planificador personal que negocia contigo cuando tus planes cambian.",
    frase: "«Organiza tu día. Neka te avisa si algo choca.»",
    instancia: "Proyecto de Título 2026",
    autor: "Nicolás Arancibia de Groote",
    mencion: "Diseño de Interacción Digital",
    facultad: "Facultad de Diseño, Universidad del Desarrollo",
    profesores: "Profesores guía: Mauricio Reyes y Alex Hurtado",
    /* Cuando tengas el logo, guárdalo en la carpeta imagenes/ y escribe aquí "imagenes/logo-udd.png" */
    logoUDD: "",
    neka: "../00_BASE/marca/Neka_Pose1.png",
    pie_izquierda: "Nekal — Proyecto de Título 2026",
    pie_derecha: "UDD · Diseño de Interacción Digital",
  },

  /* ====================================================================
     LÁMINA 1 — LA INVESTIGACIÓN
     ==================================================================== */
  lamina1: {
    nombre: "La investigación",

    problema: {
      titulo: "Contexto y problema",
      titular: "Asimetría de planificación",
      texto: "Las personas reorganizan constantemente su planificación por cambios que vienen de distintos ámbitos de su vida, pero las herramientas actuales no apoyan ese proceso de manera integrada: **obligan a redistribuir a mano tareas, prioridades y tiempos.**",
      contexto: "Cada interrupción que obliga a reorientar la atención tiene un costo medible: consume tiempo y sube el estrés, porque hay que reconstruir el contexto de lo que se estaba haciendo.",
      contexto_fuente: "Gloria Mark, Attention Span, 2023",
      /* El dibujo de la balanza */
      balanza: {
        pesado_titulo: "Estructuras externas",
        pesado_texto: "Clases, reuniones, turnos y entregas. No dependen de uno y no se mueven.",
        liviano_titulo: "La persona",
        liviano_texto: "Reorganiza a mano todo lo demás.",
        pie: "Hoy nadie media esta negociación.",
      },
      glosario: [
        { termino: "Reorganización de la planificación", definicion: "Ajustar tareas, prioridades y tiempos cuando aparecen cambios." },
        { termino: "Estructuras temporales externas", definicion: "Bloques de tiempo de actividades que no dependen de uno." },
        { termino: "Negociación", definicion: "Conciliar compromisos, prioridades y necesidades personales cuando distintos ámbitos compiten por el mismo tiempo." },
        { termino: "Carga cognitiva de reorganización", definicion: "El esfuerzo mental de recordar pendientes, detectar conflictos, comparar prioridades y redistribuir actividades." },
      ],
    },

    evidencia: {
      titulo: "Evidencia",
      fuente_encuesta: "Encuesta exploratoria propia · Nekal 2026 · n = 48",
      /* numero: el porcentaje tal como se lee. La barra se dibuja sola con ese número. */
      datos: [
        {
          numero: "81,3", texto: "ha usado alguna herramienta digital de organización…",
          numero2: "39,6", texto2: "…y solo este porcentaje la sigue usando.",
        },
        {
          numero: "85,4", texto: "modifica su planificación al menos una vez por semana.",
          numero2: "54,2", texto2: "lo hace a diario o varias veces por semana.",
        },
        {
          numero: "62,5", texto: "cuando aparece una obligación académica o laboral que no se puede mover, es la persona quien reorganiza a mano todo lo demás.",
        },
        {
          numero: "72,9", texto: "aceptaría que una herramienta digital intervenga para ayudar a reorganizar, manteniendo la decisión final.",
        },
      ],
      externa: {
        titulo: "Abandono de las apps de productividad",
        numero: "82", texto: "las abandona en la primera semana",
        numero2: "93", texto2: "en el primer mes",
        fuente: "De Luna et al., KTH Royal Institute of Technology, 2025",
      },
      lectura_titular: "Cambiar los planes no es la excepción, es lo normal.",
      lectura: "El desafío no es registrar, es mantener vigente la planificación cuando las condiciones cambian.",
    },

    marco: {
      titulo: "Marco teórico",
      conceptos: [
        { nombre: "Carga cognitiva", texto: "La memoria de trabajo es limitada; demasiada información dificulta decidir.", fuente: "Sweller, 2019" },
        { nombre: "Autorregulación", texto: "Pensamientos y conductas que genera la propia persona para lograr objetivos.", fuente: "Zimmerman, 2002" },
        { nombre: "Gestión personal de información", texto: "Crear, guardar, organizar y mantener información para cumplir objetivos.", fuente: "Jones, 2008" },
        { nombre: "Mente extendida", texto: "La mente funciona en colaboración con recursos externos.", fuente: "Clark, 1997" },
        { nombre: "Gamificación", texto: "Elementos de juego en contextos que no son juego.", fuente: "Deterding et al., 2011" },
      ],
      linea_titulo: "Evolución de referentes",
      linea: [
        { fecha: "3500 a. C.", hito: "Escritura cuneiforme" },
        { fecha: "700 d. C.", hito: "El cero" },
        { fecha: "1450", hito: "Quipu inca" },
        { fecha: "1800–1995", hito: "Archivos físicos" },
        { fecha: "1995", hito: "Agendas electrónicas" },
        { fecha: "Hoy", hito: "Apps actuales" },
      ],
    },

    estadoDelArte: {
      titulo: "Estado del arte",
      columna_favor: "A favor",
      columna_contra: "En contra",
      referentes: [
        { nombre: "Notion", favor: "Flexible, centraliza todo.", contra: "Mucho mantenimiento manual; no detecta ni negocia choques." },
        { nombre: "Todoist", favor: "Simple y rápida, buenos recordatorios.", contra: "Binaria (hecho / no hecho); lo atrasado se acumula." },
        { nombre: "Google Calendar", favor: "Muestra bien el tiempo comprometido; es el estándar.", contra: "No ayuda a gestionar; no detecta ni negocia choques." },
        { nombre: "Motion, Reclaim AI, Sunsama", favor: "Automatizan y sugieren bloques.", contra: "Optimizan y ejecutan; no negocian con la persona." },
      ],
      vacio_titulo: "El vacío",
      vacio: "Nadie media la negociación entre la persona y las estructuras externas **dejando la decisión final en la persona.**",
    },

    pregunta: {
      titulo: "Pregunta de investigación",
      texto: "¿Qué atributos debe tener un **sistema planificador que medie en la negociación** entre las personas y los contextos temporales a los que pertenecen, para **mitigar las asimetrías de planificación**?",
      neka: "../00_BASE/marca/Neka_Pose7.png",
    },

    usuarios: {
      titulo: "Para quién se diseña",
      lista: [
        { tipo: "Principal", nombre: "Estudiante universitario", texto: "Su calendario lo fija la institución; reorganiza la semana cada vez que choca con un plazo no negociable.", cita: "«No decide, solo reacciona.»" },
        { tipo: "Secundario", nombre: "Trabajador", texto: "Reuniones, turnos y entregas predefinidos.", cita: "«Ajustarse le sale más barato que reclamar.»" },
        { tipo: "Transversal", nombre: "Cualquier persona con compromisos externos", texto: "", cita: "«Un cambio nunca llega solo.»" },
      ],
    },

    referencias: {
      titulo: "Referencias",
      lista: [
        "Clark, A. (1997). Being there: Putting brain, body, and world together again. MIT Press.",
        "Cooper, A., Reimann, R., & Cronin, D. (2007). About face 3: The essentials of interaction design. Wiley.",
        "de Luna, S., Fredriksson, V., Påhlman, M., & Källsner, P. O. (2025). Boosting user retention through effective app onboarding. KTH Royal Institute of Technology.",
        "Deterding, S., Dixon, D., Khaled, R., & Nacke, L. E. (2011). From game design elements to gamefulness: Defining «gamification». ACM.",
        "Jones, W. (2008). Keeping found things found. Morgan Kaufmann.",
        "Mark, G. (2023). Attention span. Hanover Square Press.",
        "Norman, D. A. (2013). The design of everyday things. Basic Books.",
        "Sweller, J., van Merriënboer, J. J. G., & Paas, F. (2019). Cognitive architecture and instructional design: 20 years later. Educational Psychology Review, 31, 261–292.",
        "Zimmerman, B. J. (2002). Becoming a self-regulated learner: An overview. Theory Into Practice, 41(2), 64–70.",
        "Referentes digitales: Google Calendar, Notion, Todoist, Motion, Reclaim, Sunsama (s. f.).",
      ],
    },
  },

  /* ====================================================================
     LÁMINA 2 — EL PROYECTO
     ==================================================================== */
  lamina2: {
    nombre: "El proyecto",

    propuesta: {
      titulo: "Propuesta",
      texto: "Nekal es una app de organización personal con una asistente, Neka. Anotas lo que tienes que hacer, la app lo ordena en el tiempo, y Neka te avisa si algo choca y te propone cómo arreglarlo.",
      remate: "Tú siempre confirmas antes de que algo cambie.",
      objetivo_titulo: "Objetivo general",
      objetivo: "Diseñar un sistema planificador negociador con recursos mnemotécnicos, dirigido a personas con dificultades de organización, mediante IA y mecánicas de gamificación, para conciliar de forma más simétrica sus objetivos personales con los de las estructuras organizacionales.",
      especificos_titulo: "Objetivos específicos",
      especificos: [
        "Identificar patrones de conducta y quiebres en la planificación.",
        "Definir las funciones del sistema mnemotécnico y gamificado.",
        "Diseñar la información y el prototipo navegable.",
        "Evaluar la propuesta con usuarios reales.",
      ],
    },

    experiencia: {
      titulo: "Experiencia de la aplicación",
      nota: "Pantallas reales de la app, con datos de ejemplo.",
      /* Para cambiar una pantalla: cambia la ruta de "imagen". */
      pantallas: [
        { nombre: "Resumen", imagen: "../00_BASE/pantallas/03-resumen.png", hace: "Qué viene ahora, qué falta hoy, racha y mapa de tus días.", aporte: "Menos búsqueda manual" },
        { nombre: "Calendario", imagen: "../00_BASE/pantallas/06-calendario-agenda.png", hace: "Todo lo que tiene fecha, por mes o como agenda. Marca choques y ofrece «Arreglar con Neka».", aporte: "Ver el conflicto antes del atraso" },
        { nombre: "Espacio", imagen: "../00_BASE/pantallas/07-espacio-circulo.png", hace: "Tus cosas en mesas (Casa, Trabajo, Universidad…) alrededor de «hoy», en un círculo del tiempo.", aporte: "Externaliza la planificación" },
        { nombre: "Neka", imagen: "../00_BASE/pantallas/08-neka-chat.png", hace: "Chat por texto o voz. «Voy atrasado 20 minutos» y Neka propone un plan dibujado en el día.", aporte: "Menos esfuerzo en cada reajuste" },
        /* Falta esta captura. Cuando exista, escribe su ruta en "imagen" y el espacio marcado desaparece. */
        { nombre: "El plan de Neka", imagen: "", falta: "Captura de la hoja «Plan de Neka»: el día dibujado con Aceptar / Descartar. Es la pantalla central del proyecto.", hace: "Neka muestra el día como quedaría. Nada cambia hasta que aceptas.", aporte: "Tú decides" },
        { nombre: "Perfil", imagen: "../00_BASE/pantallas/09-perfil.png", hace: "Nivel, 25 logros, rating por mesa y amigos con perfil en corto.", aporte: "Motivación para mantener el hábito" },
      ],
    },

    principios: {
      titulo: "Principios",
      principal: "[REVISAR] Neka propone, tú decides.",
      principal_texto: "Nada cambia sin tu sí.",
      neka: "../00_BASE/marca/Neka_Pose10.png",
      otros: [
        { nombre: "Lo fijo no se mueve", texto: "Una clase, una visita. Lo flexible, solo con tu aprobación." },
        { nombre: "Nada se borra solo", texto: "Lo atrasado no desaparece ni se acumula en silencio: Neka pregunta por una cosa importante a la vez (Reprogramar / Ya la hice / Soltarla)." },
        { nombre: "Lo que ves es lo que se aplica", texto: "La propuesta que ves es exactamente la que se aplica." },
      ],
    },

    negociacion: {
      titulo: "Cómo negocia Neka",
      pasos: [
        { nombre: "Pides o cambia algo", texto: "Por texto, voz o desde un choque en el Calendario." },
        { nombre: "Neka lee tu agenda", texto: "Qué es fijo, qué es flexible, duración, jornada." },
        { nombre: "Arma un plan", texto: "Mueve solo lo flexible y salta lo fijo." },
        { nombre: "El plan se revisa solo", texto: "No puede crear choques nuevos. Si la agenda cambió, se avisa y se pide de nuevo." },
        { nombre: "Tú decides", texto: "Aceptar o Descartar, viendo el día dibujado." },
        { nombre: "Se aplica y queda guardado", texto: "Sincronizado en tu cuenta." },
      ],
    },

    cambios: {
      titulo: "[REVISAR] Qué cambió desde el anteproyecto",
      columna_antes: "Anteproyecto",
      columna_hoy: "Hoy",
      columna_porque: "Por qué",
      filas: [
        { antes: "Sistema multiagente (planificador, revisor, monitor)", hoy: "Una sola asistente, Neka, con revisión por código", porque: "Más simple de entender y más confiable: el revisor ya no es otra IA, son reglas que no fallan." },
        { antes: "Interfaz espacial con bloques para arrastrar; se probó una vista 3D de mesas", hoy: "Círculo del tiempo", porque: "La vista 3D y el plano no se leían bien en el iPhone; el círculo responde «qué tengo y cuándo» de un vistazo." },
        { antes: "Perfil: reglas personales de equilibrio", hoy: "Perfil = progreso (nivel, logros, rating, amigos); la jornada se define en Ajustes", porque: "[FALTA] La razón, dicha por Nicolás." },
        { antes: "Prototipo navegable de 6 pantallas", hoy: "App real y funcionando: cuentas, datos en la nube, web publicada e iPhone", porque: "Se decidió que todo fuera real y no pantallas de muestra." },
        { antes: "—", hoy: "Amigos (código de 6 caracteres, perfil en corto)", porque: "Parte de la gamificación." },
        { antes: "—", hoy: "Lo «atrasado» como regla propia y Neka que pregunta", porque: "Responde a la crítica a Todoist: lo atrasado no se acumula." },
      ],
      proceso_titulo: "Proceso",
      proceso: [
        { nombre: "V0", texto: "Exploración" },
        { nombre: "V1", texto: "Primera app publicada en la web" },
        { nombre: "V2", texto: "Diseño, Espacio, Neka con IA, gamificación, amigos y estabilización (oct.–nov. 2026)" },
      ],
      hecha_con: "Hecha con Expo y React Native (una sola base para web e iPhone), Firebase y Gemini Flash-Lite. Más de 330 pruebas automáticas. Web: nekal-973b2.web.app",
    },

    pendientes: {
      titulo: "Validación, costos y proyección",
      /* "falta" dice qué va en cada espacio. Cuando lo tengas, borra "falta" (déjalo en "")
         y escribe el contenido real en "texto". "dato" es lo que ya se sabe hoy. */
      grandes: [
        {
          nombre: "Validación con usuarios",
          falta: "Pruebas de usabilidad de la V2: quiénes, cuántos, qué tareas, resultados y qué se cambió.",
          dato: "Es el objetivo específico 4 y la pauta lo evalúa directo.",
          texto: "",
        },
        {
          nombre: "Costos y financiamiento",
          falta: "Honorarios, gastos operacionales, producción (programación, servicios) y posibles fuentes de financiamiento.",
          dato: "Hoy corre en planes gratuitos de Firebase y Gemini.",
          texto: "",
        },
        {
          nombre: "Proyección",
          falta: "Redactar la continuidad del proyecto y elegir qué ideas del roadmap se muestran.",
          dato: "Ideas anotadas: Google Calendar y Outlook, espacios compartidos con amigos, Neka por WhatsApp, widget del iPhone, resumen diario, app nativa.",
          texto: "",
        },
      ],
      chicos: [
        { nombre: "Impacto y variables éticas", falta: "Qué pasa con los datos personales y la IA; impacto social esperado.", texto: "" },
        { nombre: "Planificación del trabajo", falta: "Carta Gantt real de lo hecho (las fases de la V2 con sus fechas sirven de base).", texto: "" },
        { nombre: "Conclusiones", falta: "Respuesta a la pregunta de investigación.", texto: "" },
      ],
    },
  },
};
