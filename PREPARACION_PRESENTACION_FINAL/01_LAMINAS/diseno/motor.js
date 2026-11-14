/*
  MOTOR DE LAS LÁMINAS
  Toma los textos de contenido.js y arma cada lámina.
  Normalmente no hace falta tocar este archivo: los textos e imágenes se
  cambian en contenido.js y los colores y tamaños en diseno/laminas.css.

  La lámina se dibuja siempre con 1000 unidades de ancho. El alto sale de la
  proporción ancho_cm : alto_cm. Al exportar, todo se agranda parejo hasta
  el tamaño real en centímetros.
*/
(function () {
  const C = window.NEKAL;
  const E = C.encabezado;

  /* ---------- Ayudas de texto ---------- */
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const fmt = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  const esFalta = (s) => typeof s === "string" && s.trim().startsWith("[FALTA]");

  // Texto normal. Entiende [FALTA] y [REVISAR] al principio.
  function t(s) {
    if (s == null) return "";
    s = String(s).trim();
    if (esFalta(s)) {
      return `<span class="falta-linea"><b>Falta</b><span>${fmt(s.slice(7).trim())}</span></span>`;
    }
    if (s.startsWith("[REVISAR]")) {
      const marca = C.mostrarMarcasRevisar ? `<span class="revisar">revisar</span>` : "";
      return fmt(s.slice(9).trim()) + marca;
    }
    return fmt(s);
  }
  const ancho = (numero) => Math.max(0, Math.min(100, parseFloat(String(numero).replace(",", ".")) || 0));
  const barra = (numero, clase = "") =>
    `<span class="barra ${clase}"><i style="width:${ancho(numero)}%"></i></span>`;
  const pct = (numero) => `${esc(numero)}<small>%</small>`;

  // Bloque de "esto todavía falta".
  const falta = (queVa, extra = "") =>
    `<div class="falta ${extra}"><span class="falta-sello">Falta</span><p>${fmt(queVa)}</p></div>`;

  /* ---------- Piezas comunes ---------- */
  let numeroSeccion = 0;
  const cabecera = (titulo, nota = "") => {
    numeroSeccion += 1;
    const n = String(numeroSeccion).padStart(2, "0");
    return `<header class="sec-cab">
      <span class="sec-num">${n}</span>
      <h2>${t(titulo)}</h2>
      ${nota ? `<p class="sec-nota">${t(nota)}</p>` : `<span class="sec-linea"></span>`}
    </header>`;
  };

  const telefono = (imagen, alt) =>
    `<div class="telefono"><img src="${esc(imagen)}" alt="${esc(alt)}"></div>`;

  function encabezado(n, nombreLamina) {
    const logo = E.logoUDD
      ? `<img class="cab-logo" src="${esc(E.logoUDD)}" alt="Universidad del Desarrollo">`
      : `<div class="cab-logo-falta"><b>Falta</b>Logo UDD<br>(archivo oficial)</div>`;
    return `<header class="cab">
      <div class="cab-anillos" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="cab-marca">
        <img class="cab-neka" src="${esc(E.neka)}" alt="Neka, la asistente de Nekal">
        <div>
          <h1>${t(E.nombre)}</h1>
          <p class="cab-bajada">${t(E.bajada)}</p>
        </div>
      </div>
      <div class="cab-ficha">
        ${logo}
        <div class="cab-datos">
          <p class="cab-instancia">${t(E.instancia)}</p>
          <p class="cab-autor">${t(E.autor)}</p>
          <p class="cab-mencion">${t(E.mencion)}<br>${t(E.facultad)}</p>
          <p class="cab-profes">${t(E.profesores)}</p>
        </div>
      </div>
    </header>
    <div class="cinta">
      <span class="cinta-lamina">Lámina ${n} de 2</span>
      <span class="cinta-nombre">${t(nombreLamina)}</span>
      <span class="cinta-frase">${t(E.frase)}</span>
    </div>`;
  }

  const pie = (n) => `<footer class="pie">
      <span>${t(E.pie_izquierda)}</span>
      <span>Lámina ${n} de 2</span>
      <span>${t(E.pie_derecha)}</span>
    </footer>`;

  /* ====================================================================
     LÁMINA 1
     ==================================================================== */
  const L1 = C.lamina1;

  function problema() {
    const p = L1.problema, b = p.balanza;
    return `<section class="sec">
      ${cabecera(p.titulo)}
      <div class="problema">
        <div class="problema-texto">
          <h3 class="titular">${t(p.titular)}</h3>
          <p class="entrada">${t(p.texto)}</p>
          <p class="contexto">${t(p.contexto)} <cite>${t(p.contexto_fuente)}</cite></p>
        </div>
        <figure class="balanza">
          <svg viewBox="0 0 400 150" preserveAspectRatio="xMinYMin meet" aria-hidden="true">
            <line class="bz-viga" x1="92" y1="104" x2="318" y2="40"/>
            <line class="bz-hilo" x1="92" y1="104" x2="92" y2="150"/>
            <line class="bz-hilo" x1="318" y1="40" x2="318" y2="78"/>
            <path class="bz-apoyo" d="M205 72 L232 150 L178 150 Z"/>
            <circle class="bz-eje" cx="205" cy="72" r="9"/>
          </svg>
          <div class="bz-plato bz-pesado"><b>${t(b.pesado_titulo)}</b><span>${t(b.pesado_texto)}</span></div>
          <div class="bz-plato bz-liviano"><b>${t(b.liviano_titulo)}</b><span>${t(b.liviano_texto)}</span></div>
          <figcaption>${t(b.pie)}</figcaption>
        </figure>
      </div>
      <dl class="glosario">
        ${p.glosario.map((g) => `<div><dt>${t(g.termino)}</dt><dd>${t(g.definicion)}</dd></div>`).join("")}
      </dl>
    </section>`;
  }

  function evidencia() {
    const e = L1.evidencia, x = e.externa;
    const dato = (d) => `<div class="dato">
        <p class="dato-num">${pct(d.numero)}</p>
        ${barra(d.numero)}
        <p class="dato-texto">${t(d.texto)}</p>
        ${d.numero2 ? `<div class="dato-sub">
          <p class="dato-num2">${pct(d.numero2)}</p>
          ${barra(d.numero2, "barra-2")}
          <p class="dato-texto">${t(d.texto2)}</p>
        </div>` : ""}
      </div>`;
    return `<section class="sec">
      ${cabecera(e.titulo, e.fuente_encuesta)}
      <div class="datos">${e.datos.map(dato).join("")}</div>
      <div class="evidencia-abajo">
        <div class="externa">
          <p class="externa-titulo">${t(x.titulo)}</p>
          <div class="externa-fila"><b>${pct(x.numero)}</b>${barra(x.numero, "barra-clara")}<span>${t(x.texto)}</span></div>
          <div class="externa-fila"><b>${pct(x.numero2)}</b>${barra(x.numero2, "barra-clara")}<span>${t(x.texto2)}</span></div>
          <cite>${t(x.fuente)}</cite>
        </div>
        <div class="lectura">
          <p class="lectura-titular">${t(e.lectura_titular)}</p>
          <p class="lectura-texto">${t(e.lectura)}</p>
        </div>
      </div>
    </section>`;
  }

  function marco() {
    const m = L1.marco;
    return `<section class="sec">
      ${cabecera(m.titulo)}
      <div class="conceptos">
        ${m.conceptos.map((c) => `<article class="concepto">
          <h3>${t(c.nombre)}</h3><p>${t(c.texto)}</p><cite>${t(c.fuente)}</cite>
        </article>`).join("")}
      </div>
      <div class="linea">
        <p class="linea-titulo">${t(m.linea_titulo)}</p>
        <ol>
          ${m.linea.map((h) => `<li><i></i><b>${t(h.hito)}</b><span>${t(h.fecha)}</span></li>`).join("")}
        </ol>
      </div>
    </section>`;
  }

  function estadoDelArte() {
    const a = L1.estadoDelArte;
    return `<section class="sec">
      ${cabecera(a.titulo)}
      <div class="arte">
        <div class="arte-fila arte-cab"><span></span><span class="a-favor">${t(a.columna_favor)}</span><span class="en-contra">${t(a.columna_contra)}</span></div>
        ${a.referentes.map((r) => `<div class="arte-fila">
          <b>${t(r.nombre)}</b><span>${t(r.favor)}</span><span>${t(r.contra)}</span>
        </div>`).join("")}
      </div>
      <div class="vacio"><b>${t(a.vacio_titulo)}</b><p>${t(a.vacio)}</p></div>
    </section>`;
  }

  function pregunta() {
    const p = L1.pregunta;
    numeroSeccion += 1;
    return `<section class="banda">
      <div class="banda-anillos" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="banda-texto">
        <header class="sec-cab sec-cab-clara">
          <span class="sec-num">${String(numeroSeccion).padStart(2, "0")}</span>
          <h2>${t(p.titulo)}</h2>
        </header>
        <p class="pregunta">${t(p.texto)}</p>
      </div>
      <img class="banda-neka" src="${esc(p.neka)}" alt="">
    </section>`;
  }

  function usuarios() {
    const u = L1.usuarios;
    return `<section class="sec">
      ${cabecera(u.titulo)}
      <div class="usuarios">
        ${u.lista.map((p, i) => `<article class="usuario ${i === 0 ? "usuario-principal" : ""}">
          <span class="ficha">${t(p.tipo)}</span>
          <h3>${t(p.nombre)}</h3>
          ${p.texto ? `<p>${t(p.texto)}</p>` : ""}
          <blockquote>${t(p.cita)}</blockquote>
        </article>`).join("")}
      </div>
    </section>`;
  }

  function referencias() {
    const r = L1.referencias;
    return `<section class="refs">
      <h2>${t(r.titulo)}</h2>
      <ul>${r.lista.map((x) => `<li>${t(x)}</li>`).join("")}</ul>
    </section>`;
  }

  /* ====================================================================
     LÁMINA 2
     ==================================================================== */
  const L2 = C.lamina2;

  function propuesta() {
    const p = L2.propuesta;
    return `<section class="sec">
      ${cabecera(p.titulo)}
      <div class="propuesta">
        <div>
          <p class="entrada entrada-grande">${t(p.texto)}</p>
          <p class="remate">${t(p.remate)}</p>
        </div>
        <div class="objetivo">
          <h3>${t(p.objetivo_titulo)}</h3>
          <p>${t(p.objetivo)}</p>
          <h4>${t(p.especificos_titulo)}</h4>
          <ol>${p.especificos.map((o) => `<li>${t(o)}</li>`).join("")}</ol>
        </div>
      </div>
    </section>`;
  }

  function experiencia() {
    const x = L2.experiencia;
    return `<section class="sec">
      ${cabecera(x.titulo, x.nota)}
      <div class="pantallas">
        ${x.pantallas.map((p) => `<article class="pantalla">
          ${p.imagen ? telefono(p.imagen, "Pantalla " + p.nombre) : `<div class="telefono telefono-falta">${falta(p.falta || "Falta esta captura.")}</div>`}
          <h3>${t(p.nombre)}</h3>
          <p>${t(p.hace)}</p>
          <span class="aporte">${t(p.aporte)}</span>
        </article>`).join("")}
      </div>
    </section>`;
  }

  function principios() {
    const p = L2.principios;
    return `<section class="sec">
      ${cabecera(p.titulo)}
      <div class="principios">
        <div class="principio-mayor">
          <img src="${esc(p.neka)}" alt="">
          <div>
            <p class="principio-frase">${t(p.principal)}</p>
            <p class="principio-bajada">${t(p.principal_texto)}</p>
          </div>
        </div>
        <ul class="principios-otros">
          ${p.otros.map((o) => `<li><b>${t(o.nombre)}</b><span>${t(o.texto)}</span></li>`).join("")}
        </ul>
      </div>
    </section>`;
  }

  function negociacion() {
    const g = L2.negociacion;
    return `<section class="sec">
      ${cabecera(g.titulo)}
      <div class="negociacion">
        <ol class="pasos">
          ${g.pasos.map((p, i) => `<li class="${i === 4 ? "paso-clave" : ""}">
            <span class="paso-num">${i + 1}</span>
            <b>${t(p.nombre)}</b>
            <span class="paso-texto">${t(p.texto)}</span>
          </li>`).join("")}
        </ol>
      </div>
    </section>`;
  }

  function cambios() {
    const c = L2.cambios;
    return `<section class="sec">
      ${cabecera(c.titulo)}
      <div class="cambios">
        <div class="cambio cambio-cab"><span>${t(c.columna_antes)}</span><span></span><span>${t(c.columna_hoy)}</span><span>${t(c.columna_porque)}</span></div>
        ${c.filas.map((f) => `<div class="cambio">
          <span class="cambio-antes ${f.antes.trim() === "—" ? "cambio-nuevo" : ""}">${f.antes.trim() === "—" ? "Nuevo" : t(f.antes)}</span>
          <span class="cambio-flecha" aria-hidden="true"></span>
          <b>${t(f.hoy)}</b>
          <span class="cambio-porque">${t(f.porque)}</span>
        </div>`).join("")}
      </div>
      <div class="proceso">
        <span class="proceso-titulo">${t(c.proceso_titulo)}</span>
        <ol>${c.proceso.map((v) => `<li><b>${t(v.nombre)}</b><span>${t(v.texto)}</span></li>`).join("")}</ol>
      </div>
      <p class="hecha-con">${t(c.hecha_con)}</p>
    </section>`;
  }

  function pendientes() {
    const p = L2.pendientes;
    const bloque = (b, clase) => `<article class="pendiente ${clase} ${b.falta ? "pendiente-falta" : ""}">
        <h3>${t(b.nombre)}${b.falta ? `<span class="falta-sello">Falta</span>` : ""}</h3>
        ${b.falta ? `<p class="pendiente-que">${t(b.falta)}</p>` : ""}
        ${b.texto ? `<p class="pendiente-texto">${t(b.texto)}</p>` : ""}
        ${b.dato ? `<p class="pendiente-dato"><b>Lo que ya se sabe</b>${t(b.dato)}</p>` : ""}
      </article>`;
    return `<section class="sec">
      ${cabecera(p.titulo)}
      <div class="pendientes">
        ${p.grandes.map((b) => bloque(b, "pendiente-grande")).join("")}
        ${p.chicos.map((b) => bloque(b, "pendiente-chico")).join("")}
      </div>
    </section>`;
  }

  /* ---------- Qué secciones lleva cada lámina, en orden ---------- */
  const LAMINAS = {
    1: { nombre: L1.nombre, secciones: [problema, evidencia, marco, estadoDelArte, pregunta, usuarios, referencias] },
    2: { nombre: L2.nombre, secciones: [propuesta, experiencia, principios, negociacion, cambios, pendientes] },
  };
  // La lámina 2 sigue la numeración de la 1 (01 a 06, luego 07 en adelante).
  const SECCIONES_NUMERADAS_L1 = 6;

  function dibujar(n) {
    const lamina = LAMINAS[n];
    const alto = Math.round((1000 * C.formato.alto_cm) / C.formato.ancho_cm);
    document.documentElement.style.setProperty("--alto", alto + "px");
    numeroSeccion = n === 2 ? SECCIONES_NUMERADAS_L1 : 0;
    document.title = `Nekal — Lámina ${n}`;
    document.body.innerHTML = `<main class="lamina" id="lamina">
      ${encabezado(n, lamina.nombre)}
      <div class="cuerpo">${lamina.secciones.map((s) => s()).join("")}</div>
      ${pie(n)}
    </main>`;
  }

  window.dibujarLamina = dibujar;
})();
