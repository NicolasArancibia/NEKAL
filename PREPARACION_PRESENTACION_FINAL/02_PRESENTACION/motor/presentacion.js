/*
  Motor de la presentación de Nekal. No hace falta tocarlo para editar diapositivas.
  Hace: ajustar el lienzo de 1920 × 1080 a la ventana, navegar, escribir el pie de cada
  diapositiva, el modo notas, la ventana del orador, la vista general y el reloj.
  Sin internet y sin librerías.
*/
(function () {
  "use strict";
  var MINUTOS_MAXIMOS = 30;

  var escenario = document.getElementById("escenario");
  var dps = Array.prototype.slice.call(escenario.querySelectorAll(".dp"));
  var principales = dps.filter(function (d) { return !d.classList.contains("respaldo"); });
  var parametros = new URLSearchParams(location.search);
  var esImpresion = parametros.has("imprimir");
  var actual = 0;
  var otraVentana = null;

  /* ── Pie de cada diapositiva: marca, bloque y número ── */
  var bloque = "";
  var acumulado = 0;
  var nRespaldo = 0;
  dps.forEach(function (dp, i) {
    if (dp.dataset.bloque) bloque = dp.dataset.bloque; else dp.dataset.bloque = bloque;
    var esRespaldo = dp.classList.contains("respaldo");
    acumulado += esRespaldo ? 0 : parseFloat(dp.dataset.min || "0");
    dp.dataset.hasta = acumulado.toFixed(2); // minuto en que debería terminar esta diapositiva
    var num = esRespaldo
      ? "Respaldo <b>" + (++nRespaldo) + "</b>"
      : "<b>" + (principales.indexOf(dp) + 1) + "</b> / " + principales.length;
    var pie = document.createElement("footer");
    pie.className = "pie";
    pie.innerHTML = '<span class="pie-marca">Nekal</span><span class="pie-bloque"></span><span class="pie-num">' + num + "</span>";
    pie.querySelector(".pie-bloque").textContent = bloque;
    dp.appendChild(pie);
    dp.dataset.indice = i;
  });

  /* ── Video: si el archivo no existe todavía, se muestra el aviso ── */
  dps.forEach(function (dp) {
    var video = dp.querySelector("video");
    if (!video) return;
    var marcarVacio = function () { dp.classList.add("vacio"); };
    video.addEventListener("error", marcarVacio);
    if (video.error || video.networkState === 3) marcarVacio();
  });

  if (esImpresion) {
    document.documentElement.classList.add("imprimir");
    return; // para el PDF no hace falta nada más
  }

  /* ── Piezas de la interfaz ── */
  var avance = document.createElement("div");
  avance.id = "avance";
  escenario.appendChild(avance);

  var botones = document.createElement("div");
  botones.id = "botones";
  botones.innerHTML =
    '<button data-accion="completa">Pantalla completa <kbd>F</kbd></button>' +
    '<button data-accion="notas">Notas <kbd>N</kbd></button>' +
    '<button data-accion="orador">Ventana del orador <kbd>O</kbd></button>' +
    '<button data-accion="grilla">Ver todas <kbd>G</kbd></button>';
  document.body.appendChild(botones);

  var orador = document.createElement("div");
  orador.id = "orador";
  orador.innerHTML =
    '<div class="lado"><p class="rotulo">Sigue</p><div class="mini"></div>' +
    '<div class="reloj">00:00</div><div class="plan"></div>' +
    '<div class="ayuda">T reinicia el reloj · N cierra las notas · flechas o clic para avanzar</div></div>' +
    '<div class="texto"></div>';
  document.body.appendChild(orador);
  var mini = orador.querySelector(".mini");
  var textoNotas = orador.querySelector(".texto");
  var reloj = orador.querySelector(".reloj");
  var plan = orador.querySelector(".plan");

  /* ── Ajuste del lienzo a la ventana ── */
  function ajustar() {
    if (document.body.classList.contains("modo-grilla")) return;
    var w = window.innerWidth, h = window.innerHeight, s, x, y;
    if (document.body.classList.contains("modo-notas")) {
      s = Math.min((w * 0.66 - 96) / 1920, (h * 0.6) / 1080);
      x = 24; y = 24;
      textoNotas.style.top = (24 + 1080 * s + 24) + "px";
      var sMini = mini.clientWidth / 1920;
      var clon = mini.firstElementChild;
      if (clon) clon.style.transform = "scale(" + sMini + ")";
    } else {
      s = Math.min(w / 1920, h / 1080);
      x = (w - 1920 * s) / 2; y = (h - 1080 * s) / 2;
    }
    escenario.style.transform = "translate(" + x + "px," + y + "px) scale(" + s + ")";
  }

  /* ── Navegación ── */
  function ir(n, sinAvisar) {
    actual = Math.max(0, Math.min(dps.length - 1, n));
    dps.forEach(function (dp, i) { dp.classList.toggle("activa", i === actual); });
    var dp = dps[actual];
    var enPrincipales = principales.indexOf(dp);
    avance.style.width = (enPrincipales < 0 ? 100 : ((enPrincipales + 1) / principales.length) * 100) + "%";
    try { history.replaceState(null, "", "#" + (actual + 1)); } catch (e) { /* algunos navegadores no dejan en file:// */ }
    dps.forEach(function (d, i) { var v = d.querySelector("video"); if (v && i !== actual) v.pause(); });
    pintarNotas();
    if (actual > 0 && !inicio) inicio = Date.now(); // el reloj parte al salir de la portada
    if (!sinAvisar) {
      var destino = otraVentana && !otraVentana.closed ? otraVentana : window.opener;
      if (destino) destino.postMessage({ nekalDiapositiva: actual }, "*");
    }
  }
  window.addEventListener("message", function (e) {
    if (e.data && typeof e.data.nekalDiapositiva === "number") ir(e.data.nekalDiapositiva, true);
  });

  /* ── Notas del orador ── */
  function pintarNotas() {
    var dp = dps[actual];
    var notas = dp.querySelector(".notas");
    textoNotas.innerHTML = notas && notas.innerHTML.trim() ? notas.innerHTML : '<p class="vacia">Esta diapositiva no tiene notas.</p>';
    mini.innerHTML = "";
    var sig = dps[actual + 1];
    if (sig) {
      var clon = sig.cloneNode(true);
      clon.classList.remove("activa");
      clon.removeAttribute("data-indice");
      mini.appendChild(clon);
    }
    var hasta = parseFloat(dp.dataset.hasta);
    plan.innerHTML = dp.classList.contains("respaldo")
      ? "Diapositiva de respaldo (para las preguntas)."
      : "Bloque: <b>" + dp.dataset.bloque + "</b><br>Al terminar esta diapositiva deberías ir en <b>" + mmss(hasta * 60) + "</b> de " + MINUTOS_MAXIMOS + ":00.";
    ajustar();
  }

  /* ── Reloj ── */
  var inicio = 0;
  function mmss(seg) {
    seg = Math.max(0, Math.round(seg));
    return String(Math.floor(seg / 60)).padStart(2, "0") + ":" + String(seg % 60).padStart(2, "0");
  }
  setInterval(function () {
    var seg = inicio ? (Date.now() - inicio) / 1000 : 0;
    reloj.textContent = mmss(seg);
    reloj.classList.toggle("pasado", seg > parseFloat(dps[actual].dataset.hasta) * 60 + 30 || seg > MINUTOS_MAXIMOS * 60);
  }, 500);

  /* ── Modos ── */
  function alternar(modo) {
    var otro = modo === "modo-notas" ? "modo-grilla" : "modo-notas";
    document.body.classList.remove(otro);
    document.body.classList.toggle(modo);
    ajustar();
    if (document.body.classList.contains("modo-grilla")) dps[actual].scrollIntoView({ block: "center" });
    else window.scrollTo(0, 0);
  }
  function pantallaCompleta() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  }
  function abrirOrador() {
    otraVentana = window.open(location.href.split("#")[0].split("?")[0] + "?orador#" + (actual + 1), "nekal-orador", "width=1200,height=760");
  }
  var acciones = {
    completa: pantallaCompleta,
    notas: function () { alternar("modo-notas"); },
    grilla: function () { alternar("modo-grilla"); },
    orador: abrirOrador
  };

  /* ── Teclado, clic y mouse ── */
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.key;
    if (t === "ArrowRight" || t === "ArrowDown" || t === "PageDown" || t === " " || t === "Enter") ir(actual + 1);
    else if (t === "ArrowLeft" || t === "ArrowUp" || t === "PageUp" || t === "Backspace") ir(actual - 1);
    else if (t === "Home") ir(0);
    else if (t === "End") ir(principales.length - 1);
    else if (t === "f" || t === "F") pantallaCompleta();
    else if (t === "n" || t === "N") acciones.notas();
    else if (t === "g" || t === "G") acciones.grilla();
    else if (t === "o" || t === "O") abrirOrador();
    else if (t === "t" || t === "T") inicio = Date.now();
    else if (t === "Escape") document.body.classList.remove("modo-grilla", "modo-notas"), ajustar();
    else return;
    e.preventDefault();
  });

  botones.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (b) { acciones[b.dataset.accion](); b.blur(); }
    e.stopPropagation();
  });

  escenario.addEventListener("click", function (e) {
    if (document.body.classList.contains("modo-grilla")) {
      var dp = e.target.closest(".dp");
      if (dp) { document.body.classList.remove("modo-grilla"); ir(parseInt(dp.dataset.indice, 10)); ajustar(); window.scrollTo(0, 0); }
      return;
    }
    if (e.target.closest("a, button, video")) return;
    var caja = escenario.getBoundingClientRect();
    if (e.clientX - caja.left < caja.width * 0.12) ir(actual - 1); else ir(actual + 1);
  });

  var temporizador;
  document.addEventListener("mousemove", function () {
    document.body.classList.add("mouse");
    clearTimeout(temporizador);
    temporizador = setTimeout(function () { document.body.classList.remove("mouse"); }, 2000);
  });

  window.addEventListener("resize", ajustar);
  window.addEventListener("beforeprint", function () { document.documentElement.classList.add("imprimir"); });
  window.addEventListener("afterprint", function () { document.documentElement.classList.remove("imprimir"); ajustar(); });

  /* ── Arranque ── */
  if (parametros.has("orador")) document.body.classList.add("modo-notas");
  var pedida = parseInt(location.hash.slice(1), 10);
  ir(isNaN(pedida) ? 0 : pedida - 1, true);
  ajustar();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(ajustar);
})();
