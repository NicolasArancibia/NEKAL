/*
  CONTENIDO DE LAS LÁMINAS DE NEKAL (versión minimal)
  ===================================================
  Aquí están todos los textos e imágenes. Cambia solo lo que está entre comillas.

  - No borres comillas, comas ni llaves { } [ ].
  - **Dos asteriscos** alrededor de unas palabras las dejan en negrita.
  - Las imágenes se escriben como ruta desde esta carpeta: "imagenes/resumen.png".
  - Después de cambiar algo: doble clic en exportar.bat.

  Los textos salen de 00_BASE/RELATO.md, acortados. Las cifras son las de la
  encuesta propia (n = 48). Las pantallas son cuadros de la grabación real de la
  app (03_VIDEO), con datos de ejemplo limpios.
*/
window.NEKAL = {

  /* ---------- TAMAÑO DE IMPRESIÓN ---------- */
  formato: { ancho_cm: 50, alto_cm: 105 },

  /* ---------- ENCABEZADO (igual en las dos láminas) ---------- */
  encabezado: {
    nombre: "Nekal",
    bajada: "Planificador personal que negocia contigo cuando tus planes cambian.",
    instancia: "Proyecto de Título 2026",
    autor: "Nicolás Arancibia de Groote",
    mencion: "Diseño de Interacción Digital, Universidad del Desarrollo",
    profesores: "Profesores guía: Mauricio Reyes y Alex Hurtado",
    /* Cuando tengas el logo, guárdalo en imagenes/ y escribe aquí "imagenes/logo-udd.png" */
    logoUDD: "",
    icono: "../../00_BASE/marca/Neka_Pose1.png",
  },

  /* ====================================================================
     LÁMINA 1: QUÉ ES Y POR QUÉ
     ==================================================================== */
  lamina1: {
    portada: {
      frase: "Organiza tu día. Neka te avisa si algo choca.",
      texto: "Nekal es una app de organización personal con una asistente, Neka. Anotas lo que tienes que hacer, la app lo ordena en el tiempo y, si algo choca, Neka te propone cómo arreglarlo.",
      pantalla: "imagenes/resumen.png",
      neka: "../../00_BASE/marca/Neka_Pose5.png",
    },

    problema: {
      titulo: "Los planes cambian todo el tiempo.",
      texto: "Pero las herramientas no ayudan a reorganizarlos: cuando algo se mueve, **la persona tiene que redistribuir todo lo demás a mano.**",
    },

    cifras: {
      fuente: "Encuesta exploratoria propia, Nekal 2026, n = 48.",
      lista: [
        { numero: "85,4", texto: "cambia su planificación al menos una vez por semana." },
        { numero: "62,5", texto: "reorganiza a mano todo lo demás cuando aparece una obligación que no se puede mover." },
        { numero: "72,9", texto: "aceptaría que una herramienta lo ayude a reorganizar, si la decisión final es suya." },
      ],
    },

    pregunta: {
      titulo: "Pregunta de investigación",
      texto: "¿Qué atributos debe tener un sistema planificador que **medie en la negociación** entre las personas y los contextos temporales a los que pertenecen, para **mitigar las asimetrías de planificación**?",
    },

    usuarios: {
      titulo: "Para quién",
      lista: [
        { nombre: "Estudiantes universitarios", texto: "Su calendario lo fija la institución.", cita: "«No decide, solo reacciona.»" },
        { nombre: "Trabajadores", texto: "Reuniones, turnos y entregas que no eligen.", cita: "«Ajustarse le sale más barato que reclamar.»" },
        { nombre: "Cualquiera con compromisos externos", texto: "", cita: "«Un cambio nunca llega solo.»" },
      ],
    },
  },

  /* ====================================================================
     LÁMINA 2: LA APP
     ==================================================================== */
  lamina2: {
    momento: {
      titulo: "Neka propone. Tú decides.",
      texto: "Cuando algo choca, Neka arma un plan que mueve solo lo flexible. Nada cambia hasta que aceptas.",
      /* Los tres pasos del momento central, en orden. */
      pasos: [
        { nombre: "Algo choca", texto: "La clase recuperativa cae encima de «Llamar a mamá».", imagen: "imagenes/choque-en-la-agenda.png" },
        { nombre: "Neka propone", texto: "Mueve la llamada a las 8:15. Lo fijo no se toca.", imagen: "imagenes/plan-de-neka.png" },
        { nombre: "Tú aceptas", texto: "El día queda sin choques y guardado en tu cuenta.", imagen: "imagenes/agenda-arreglada.png" },
      ],
    },

    app: {
      titulo: "La app",
      pantallas: [
        { nombre: "Resumen", texto: "Qué viene ahora y qué falta hoy.", imagen: "imagenes/resumen.png" },
        { nombre: "Espacio", texto: "Tus cosas en un círculo del tiempo.", imagen: "imagenes/espacio.png" },
        { nombre: "Neka", texto: "Le hablas por texto o voz.", imagen: "imagenes/neka-chat.png" },
        { nombre: "Perfil", texto: "Nivel, logros y amigos.", imagen: "imagenes/perfil.png" },
      ],
    },

    principios: {
      neka: "../../00_BASE/marca/Neka_Pose10.png",
      lista: [
        { nombre: "Nada cambia sin tu sí.", texto: "La propuesta que ves es la que se aplica." },
        { nombre: "Lo fijo no se mueve.", texto: "Una clase o una visita se respetan. Lo flexible, solo con tu aprobación." },
        { nombre: "Nada se borra solo.", texto: "Neka pregunta por lo atrasado, una cosa a la vez." },
      ],
    },
  },
};
