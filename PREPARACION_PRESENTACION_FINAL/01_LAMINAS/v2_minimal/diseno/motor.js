/*
  MOTOR DE LAS LÁMINAS (versión minimal)
  Arma cada lámina con los textos de contenido.js. Normalmente no se toca:
  textos e imágenes van en contenido.js; colores y tamaños en diseno/laminas.css.
  La lámina mide siempre 1000 unidades de ancho; el alto sale de ancho_cm : alto_cm.
*/
(function () {
  const C = window.NEKAL, E = C.encabezado;
  const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const t = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  const tel = (src, alt, clase = "") => `<div class="tel ${clase}"><img src="${esc(src)}" alt="${esc(alt)}"></div>`;

  function encabezado() {
    const logo = E.logoUDD
      ? `<img class="udd" src="${esc(E.logoUDD)}" alt="Universidad del Desarrollo">`
      : `<span class="udd-falta">Logo UDD</span>`;
    return `<header class="cab">
      <div class="cab-marca">
        <img src="${esc(E.icono)}" alt="">
        <div><p class="cab-nombre">${t(E.nombre)}</p><p class="cab-bajada">${t(E.bajada)}</p></div>
      </div>
      <div class="cab-ficha">
        <div>
          <p class="cab-instancia">${t(E.instancia)}</p>
          <p class="cab-autor">${t(E.autor)}</p>
          <p class="cab-mencion">${t(E.mencion)}</p>
          <p class="cab-profes">${t(E.profesores)}</p>
        </div>
        ${logo}
      </div>
    </header>`;
  }

  /* ---------------- LÁMINA 1 ---------------- */
  function lamina1() {
    const L = C.lamina1, p = L.portada;
    return `
    <section class="portada">
      <div class="portada-texto">
        <h1>${t(p.frase)}</h1>
        <p class="portada-bajada">${t(p.texto)}</p>
      </div>
      <div class="portada-visual">
        <div class="aro" aria-hidden="true"></div>
        ${tel(p.pantalla, "Pantalla Resumen de Nekal", "tel-grande")}
        <img class="portada-neka" src="${esc(p.neka)}" alt="Neka, la asistente de Nekal">
      </div>
    </section>

    <section class="problema">
      <h2>${t(L.problema.titulo)}</h2>
      <p>${t(L.problema.texto)}</p>
    </section>

    <section class="cifras">
      <div class="cifras-fila">
        ${L.cifras.lista.map((c) => `<div class="cifra">
          <p class="cifra-num">${esc(c.numero)}<span>%</span></p>
          <p class="cifra-texto">${t(c.texto)}</p>
        </div>`).join("")}
      </div>
      <p class="fuente">${t(L.cifras.fuente)}</p>
    </section>

    <section class="pregunta">
      <p class="rotulo">${t(L.pregunta.titulo)}</p>
      <p class="pregunta-texto">${t(L.pregunta.texto)}</p>
    </section>

    <section class="usuarios">
      <h2 class="titulo-chico">${t(L.usuarios.titulo)}</h2>
      <div class="usuarios-fila">
        ${L.usuarios.lista.map((u) => `<div class="usuario">
          <p class="usuario-cita">${t(u.cita)}</p>
          <p class="usuario-nombre">${t(u.nombre)}</p>
          ${u.texto ? `<p class="usuario-texto">${t(u.texto)}</p>` : ""}
        </div>`).join("")}
      </div>
    </section>`;
  }

  /* ---------------- LÁMINA 2 ---------------- */
  function lamina2() {
    const L = C.lamina2, m = L.momento;
    return `
    <section class="momento">
      <h1>${t(m.titulo)}</h1>
      <p class="momento-texto">${t(m.texto)}</p>
      <ol class="pasos">
        ${m.pasos.map((p, i) => `<li class="paso ${i === 1 ? "paso-central" : ""}">
          ${tel(p.imagen, p.nombre)}
          <p class="paso-nombre"><span>${i + 1}</span>${t(p.nombre)}</p>
          <p class="paso-texto">${t(p.texto)}</p>
        </li>`).join("")}
      </ol>
    </section>

    <section class="app">
      <h2 class="titulo-chico">${t(L.app.titulo)}</h2>
      <div class="app-fila">
        ${L.app.pantallas.map((p) => `<figure class="app-pantalla">
          ${tel(p.imagen, "Pantalla " + p.nombre)}
          <figcaption><b>${t(p.nombre)}</b><span>${t(p.texto)}</span></figcaption>
        </figure>`).join("")}
      </div>
    </section>

    <section class="principios">
      <img class="principios-neka" src="${esc(L.principios.neka)}" alt="">
      <ul>
        ${L.principios.lista.map((p) => `<li><b>${t(p.nombre)}</b><span>${t(p.texto)}</span></li>`).join("")}
      </ul>
    </section>`;
  }

  window.dibujarLamina = function (n) {
    const alto = Math.round((1000 * C.formato.alto_cm) / C.formato.ancho_cm);
    document.documentElement.style.setProperty("--alto", alto + "px");
    document.title = `Nekal, lámina ${n} (minimal)`;
    document.body.innerHTML = `<main class="lamina lamina-${n}" id="lamina">
      ${encabezado()}
      <div class="cuerpo">${n === 1 ? lamina1() : lamina2()}</div>
    </main>`;
  };
})();
