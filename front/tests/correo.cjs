const { test } = require("node:test");
const assert = require("node:assert/strict");
const co = require("../.test-build/conexiones/correo.js");

// V2/H5: correo con Neka (spec H3_CONEXIONES §6.4–6.5).
const b64u = (buf) =>
  Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
const desB64u = (s) =>
  Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(
    "utf8",
  );
const cab = (o) => Object.entries(o).map(([name, value]) => ({ name, value }));

const GMAIL_META = {
  id: "m1",
  threadId: "t1",
  labelIds: ["UNREAD", "INBOX"],
  internalDate: String(Date.UTC(2026, 10, 17, 11, 47)),
  snippet: "Hola Sofi! ¿Te tinca juntarnos el sábado? Te aviso &amp; vemos",
  payload: {
    headers: cab({
      From: "Ana Pérez <ana@x.cl>",
      Subject: "=?UTF-8?B?wr9Ob3MganVudGFtb3MgZWwgc8OhYmFkbz8=?=",
      Date: "Tue, 17 Nov 2026 08:47:00 -0300",
    }),
  },
};
const GMAIL_FULL = {
  ...GMAIL_META,
  labelIds: ["INBOX"],
  payload: {
    mimeType: "multipart/alternative",
    headers: cab({
      From: "Ana Pérez <ana@x.cl>",
      To: "sofia@gmail.com",
      Subject: "¿Nos juntamos el sábado?",
      "Message-Id": "<m1@x>",
      References: "<m0@x>",
      "Reply-To": "Ana <ana.perez@y.cl>",
    }),
    parts: [
      {
        mimeType: "text/plain",
        headers: cab({ "Content-Type": "text/plain; charset=UTF-8" }),
        body: { data: b64u("¡Hola!\nNos vemos") },
      },
      { mimeType: "text/html", body: { data: b64u("<p>¡Hola!</p>") } },
    ],
  },
};

test("correo: remitente y cabeceras codificadas", () => {
  assert.deepEqual(co.persona('"Pérez, Ana" <ana@x.cl>'), {
    nombre: "Pérez, Ana",
    correo: "ana@x.cl",
  });
  assert.deepEqual(co.persona("ana@x.cl"), {
    nombre: "ana@x.cl",
    correo: "ana@x.cl",
  });
  assert.deepEqual(co.persona("<ana@x.cl>"), {
    nombre: "ana@x.cl",
    correo: "ana@x.cl",
  });
  assert.deepEqual(co.persona("=?UTF-8?B?VG9tw6Fz?= <t@x.cl>"), {
    nombre: "Tomás",
    correo: "t@x.cl",
  });
  assert.equal(
    co.decodificarCabecera("=?UTF-8?B?wr9Ob3MganVudGFtb3M/?="),
    "¿Nos juntamos?",
  );
  assert.equal(
    co.decodificarCabecera("=?ISO-8859-1?Q?Inscripci=F3n_de_ramos?="),
    "Inscripción de ramos",
  );
  assert.equal(
    co.decodificarCabecera("=?UTF-8?Q?Hola?= =?UTF-8?Q?_Ana?="),
    "Hola Ana",
  );
  assert.equal(co.decodificarCabecera("Sin codificar"), "Sin codificar");
});

test("correo: HTML a texto plano", () => {
  assert.equal(
    co.htmlATexto(
      "<style>p{}</style><p>Hola&nbsp;Ana</p><p>Sí &amp; no<br>chao</p><img src='http://x/p.gif'>",
    ),
    "Hola Ana\n\nSí & no\nchao",
  );
  assert.equal(
    co.htmlATexto("<div>Hola<br/>equipo</div><script>alert(1)</script>"),
    "Hola\nequipo",
  );
  assert.equal(
    co.htmlATexto("&lt;b&gt; &#39;x&#39; &quot;y&quot;"),
    "<b> 'x' \"y\"",
  );
});

test("correo: Gmail resumen y completo", () => {
  const r = co.desdeGmail(GMAIL_META, "sofia@gmail.com");
  assert.equal(r.id, "m1");
  assert.equal(r.proveedor, "google");
  assert.equal(r.cuenta, "sofia@gmail.com");
  assert.equal(r.hilo, "t1");
  assert.deepEqual(r.de, { nombre: "Ana Pérez", correo: "ana@x.cl" });
  assert.equal(r.asunto, "¿Nos juntamos el sábado?");
  assert.equal(r.fecha, "2026-11-17T11:47:00.000Z");
  assert.equal(r.leido, false);
  assert.equal(
    r.extracto,
    "Hola Sofi! ¿Te tinca juntarnos el sábado? Te aviso & vemos",
  );
  assert.equal(co.desdeGmail({}, "x"), null);

  const c = co.desdeGmailCompleto(GMAIL_FULL, "sofia@gmail.com");
  assert.equal(c.texto, "¡Hola!\nNos vemos");
  assert.equal(c.leido, true);
  assert.equal(c.para, "sofia@gmail.com");
  assert.deepEqual(c.responderA, { nombre: "Ana", correo: "ana.perez@y.cl" });
  assert.equal(c.idMensaje, "<m1@x>");
  assert.equal(c.referencias, "<m0@x>");

  // Solo HTML y en ISO-8859-1 (la API ya quitó el quoted-printable).
  const latin = {
    ...GMAIL_FULL,
    payload: {
      mimeType: "text/html",
      headers: cab({
        From: "U <u@x.cl>",
        Subject: "Ramos",
        "Content-Type": "text/html; charset=ISO-8859-1",
      }),
      body: { data: b64u(Buffer.from("<p>Inscripción</p>", "latin1")) },
    },
  };
  const l = co.desdeGmailCompleto(latin, "sofia@gmail.com");
  assert.equal(l.texto, "Inscripción");
  assert.deepEqual(l.responderA, { nombre: "U", correo: "u@x.cl" });
  assert.equal(l.idMensaje, "");
});

const GRAPH = {
  id: "g1",
  subject: "Minuta reunión de equipo",
  from: { emailAddress: { name: "Tomás Rivas", address: "tomas@x.cl" } },
  receivedDateTime: "2026-11-16T20:00:00Z",
  bodyPreview: "Adjunto la minuta",
  isRead: false,
  conversationId: "c1",
};

test("correo: Graph resumen y completo", () => {
  const r = co.desdeGraph(GRAPH, "sofia@outlook.com");
  assert.equal(r.proveedor, "microsoft");
  assert.equal(r.hilo, "c1");
  assert.deepEqual(r.de, { nombre: "Tomás Rivas", correo: "tomas@x.cl" });
  assert.equal(r.fecha, "2026-11-16T20:00:00.000Z");
  assert.equal(r.extracto, "Adjunto la minuta");
  assert.equal(r.leido, false);
  assert.equal(co.desdeGraph({ id: "x" }, "y"), null);
  const c = co.desdeGraphCompleto(
    {
      ...GRAPH,
      body: { contentType: "html", content: "<div>Hola<br>equipo</div>" },
      replyTo: [],
      toRecipients: [{ emailAddress: { address: "sofia@outlook.com" } }],
      internetMessageId: "<g1@x>",
    },
    "sofia@outlook.com",
  );
  assert.equal(c.texto, "Hola\nequipo");
  assert.equal(c.para, "sofia@outlook.com");
  assert.deepEqual(c.responderA, c.de);
  assert.equal(c.idMensaje, "<g1@x>");
  const t = co.desdeGraphCompleto(
    { ...GRAPH, body: { contentType: "text", content: "Hola\r\nequipo" } },
    "s",
  );
  assert.equal(t.texto, "Hola\nequipo");
});

test("correo: la respuesta queda en el hilo", () => {
  const original = co.desdeGmailCompleto(GMAIL_FULL, "sofia@gmail.com");
  const raw = co.respuestaGmail(original, "Sí, me sirve");
  assert.match(raw, /^[A-Za-z0-9_-]+$/);
  const msg = desB64u(raw);
  const [cabeceras, cuerpo] = msg.split("\r\n\r\n");
  const h = Object.fromEntries(
    cabeceras
      .split("\r\n")
      .map((l) => [l.slice(0, l.indexOf(":")), l.slice(l.indexOf(":") + 2)]),
  );
  assert.equal(h.To, "ana.perez@y.cl");
  assert.equal(
    co.decodificarCabecera(h.Subject),
    "Re: ¿Nos juntamos el sábado?",
  );
  assert.equal(h["In-Reply-To"], "<m1@x>");
  assert.equal(h.References, "<m0@x> <m1@x>");
  assert.equal(h["Content-Type"], "text/plain; charset=UTF-8");
  assert.equal(h["Content-Transfer-Encoding"], "base64");
  assert.equal(
    Buffer.from(cuerpo.replace(/\r\n/g, ""), "base64").toString("utf8"),
    "Sí, me sirve",
  );
  assert.equal(co.asuntoRespuesta("RE: Hola"), "RE: Hola");
  assert.equal(co.asuntoRespuesta("Re: Hola"), "Re: Hola");
  assert.equal(co.asuntoRespuesta("Hola"), "Re: Hola");
  // Sin Message-ID no hay cabeceras de hilo (Gmail igual lo une por threadId).
  const sinId = co.respuestaGmail(
    { ...original, idMensaje: "", referencias: "" },
    "ok",
  );
  assert.doesNotMatch(desB64u(sinId), /In-Reply-To|References/);
});

test("correo: mezclar dos cuentas por fecha sin repetir", () => {
  const a = co.desdeGmail(GMAIL_META, "sofia@gmail.com");
  const b = co.desdeGraph(GRAPH, "sofia@outlook.com");
  const c = { ...a, id: "m2", fecha: "2026-11-15T10:00:00.000Z" };
  assert.deepEqual(
    co
      .mezclar([
        [c, a],
        [b, b],
      ])
      .map((x) => x.id),
    ["m1", "g1", "m2"],
  );
});

// ── Task 2: Neka elige lo importante y redacta ─────────────────────────────
const cn = require("../.test-build/conexiones/correoNeka.js");
const mod = require("../.test-build/model.js");
const AHORA = new Date(2026, 10, 17, 10, 0).getTime(); // martes 17/11
const resumen = (id, extra = {}) => ({
  id,
  proveedor: "google",
  cuenta: "sofia@gmail.com",
  hilo: "t" + id,
  de: { nombre: "Ana Pérez", correo: "ana@x.cl" },
  asunto: "Asunto " + id,
  fecha: "2026-11-17T11:00:00.000Z",
  extracto: "Extracto " + id,
  leido: false,
  ...extra,
});
function cerebroFalso(respuestas, registro = { enviados: [] }) {
  let n = 0;
  return {
    registro,
    transcribir: async () => "",
    sesion(instrucciones) {
      registro.instrucciones = instrucciones;
      return {
        enviar: async (t) => {
          registro.enviados.push(t);
          const r = respuestas[Math.min(n++, respuestas.length - 1)];
          return typeof r === "function" ? r() : { texto: r, llamadas: [] };
        },
        devolver: async () => ({ texto: "", llamadas: [] }),
      };
    },
  };
}
const datosNekal = () => {
  const d = mod.emptyData();
  const pronto = {
    ...mod.newItem("general", "Meeting"),
    title: "Reunión de equipo",
    scheduledAt: new Date(2026, 10, 17, 15, 0).toISOString(),
  };
  const lejos = {
    ...mod.newItem("general", "Tarea"),
    title: "Viaje lejano",
    dueAt: new Date(2026, 11, 10, 18, 0).toISOString(),
  };
  return {
    ...d,
    workspaces: [...d.workspaces, { id: "u", name: "Universidad", color: "#948BA6" }],
    items: [pronto, lejos],
  };
};

test("correo Neka: el pedido lleva solo remitente, asunto y extracto", () => {
  const largo = "x".repeat(400);
  const pedido = cn.pedidoClasificar([resumen("1", { extracto: largo })], datosNekal(), AHORA);
  assert.match(pedido, /\[c1\]/);
  assert.match(pedido, /Ana Pérez <ana@x\.cl>/);
  assert.match(pedido, /Asunto 1/);
  assert.ok(pedido.includes("x".repeat(300)));
  assert.ok(!pedido.includes("x".repeat(301)));
  assert.match(pedido, /Reunión de equipo/);
  assert.doesNotMatch(pedido, /Viaje lejano/);
  assert.match(pedido, /Universidad/);
  assert.match(pedido, /2026-11-17/);
});

test("correo Neka: leer la clasificación", () => {
  const claves = ["a", "b", "c", "d", "e"];
  const json = JSON.stringify({
    correos: [
      { id: "c1", razon: "pide", fecha: "2026-11-20" },
      { id: "c2", razon: "urgente" },
      { id: "c3", razon: "fecha", fecha: "mañana" },
      { id: "c4", razon: "relacionado", sobre: "tu reunión de hoy " + "z".repeat(80) },
      { id: "c5", razon: "pide", fecha: "2026-02-31" },
      { id: "c9", razon: "pide" },
    ],
  });
  const m = cn.leerClasificacion("Aquí va:\n```json\n" + json + "\n```", claves);
  assert.deepEqual(m.get("a"), { razon: "pide", fecha: "2026-11-20" });
  assert.deepEqual(m.get("b"), { razon: "nada" });
  assert.deepEqual(m.get("c"), { razon: "nada" });
  assert.equal(m.get("d").razon, "relacionado");
  assert.equal(m.get("d").sobre.length, 60);
  assert.deepEqual(m.get("e"), { razon: "pide" });
  assert.equal(m.size, 5);
  assert.equal(cn.leerClasificacion("no sé", claves), null);
  assert.equal(cn.leerClasificacion('{"otra":1}', claves), null);
  assert.deepEqual(
    cn.leerClasificacion('{"correos":[{"id":"c1","razon":"fecha","fecha":"2026-12-01T17:30"}]}', ["a"]).get("a"),
    { razon: "fecha", fecha: "2026-12-01T17:30" },
  );
});

test("correo Neka: clasificar solo lo nuevo y no esconder nada si falla", async () => {
  const correos = [resumen("1"), resumen("2"), resumen("3")];
  const memoria = new Map([[cn.clave(correos[0]), { razon: "pregunta" }]]);
  const cerebro = cerebroFalso([JSON.stringify({ correos: [{ id: "c1", razon: "pide" }] })]);
  const r = await cn.clasificar({ cerebro, correos, data: datosNekal(), ahora: AHORA, memoria });
  assert.deepEqual(r, { fallo: false });
  assert.equal(cerebro.registro.enviados.length, 1);
  assert.doesNotMatch(cerebro.registro.enviados[0], /Asunto 1/);
  assert.match(cerebro.registro.enviados[0], /Asunto 2/);
  assert.deepEqual(memoria.get(cn.clave(correos[1])), { razon: "pide" });
  assert.deepEqual(memoria.get(cn.clave(correos[2])), { razon: "nada" });
  // Nada nuevo: no se llama a Neka.
  const quieto = cerebroFalso(["{}"]);
  assert.deepEqual(
    await cn.clasificar({ cerebro: quieto, correos, data: datosNekal(), ahora: AHORA, memoria }),
    { fallo: false },
  );
  assert.equal(quieto.registro.enviados.length, 0);
  // Falla: la memoria no cambia.
  const otros = [resumen("4"), resumen("5")];
  const roto = cerebroFalso([() => Promise.reject(new Error("sin cupo"))]);
  assert.deepEqual(
    await cn.clasificar({ cerebro: roto, correos: otros, data: datosNekal(), ahora: AHORA, memoria }),
    { fallo: true },
  );
  const ilegible = cerebroFalso(["no entendí"]);
  assert.deepEqual(
    await cn.clasificar({ cerebro: ilegible, correos: otros, data: datosNekal(), ahora: AHORA, memoria }),
    { fallo: true },
  );
  assert.equal(memoria.size, 3);
  // De a 25 por pedido.
  const muchos = Array.from({ length: 30 }, (_, i) => resumen("m" + i));
  const lotes = cerebroFalso(['{"correos":[]}']);
  await cn.clasificar({ cerebro: lotes, correos: muchos, data: datosNekal(), ahora: AHORA, memoria: new Map() });
  assert.equal(lotes.registro.enviados.length, 2);
});

test("correo Neka: textos de la fila y del encabezado", () => {
  assert.equal(cn.textoRazon({ razon: "pide", fecha: "2026-11-20" }, AHORA), "Pide algo · viernes");
  assert.equal(cn.textoRazon({ razon: "pide" }, AHORA), "Pide algo");
  assert.equal(cn.textoRazon({ razon: "pide", fecha: "2026-11-18T10:00" }, AHORA), "Pide algo · mañana");
  assert.equal(cn.textoRazon({ razon: "pregunta" }, AHORA), "Te pregunta algo");
  assert.equal(
    cn.textoRazon({ razon: "relacionado", sobre: "tu reunión de hoy" }, AHORA),
    "Sobre tu reunión de hoy",
  );
  assert.equal(cn.textoRazon({ razon: "fecha", fecha: "2026-12-01" }, AHORA), "Fecha · 1 dic");
  assert.equal(cn.resumenBandeja(27, 4), "De 27 correos de esta semana, 4 son para ti.");
  assert.equal(cn.resumenBandeja(1, 1), "De 1 correo de esta semana, 1 es para ti.");
  assert.equal(cn.accion("pide"), "Crear tarea");
  assert.equal(cn.accion("pregunta"), "Responder");
  assert.equal(cn.accion("fecha"), "Al calendario");
  assert.equal(cn.accion("relacionado"), "Ver");
});

test("correo Neka: tarea y evento desde un correo", () => {
  const c = resumen("1", {
    asunto: "Entrega del informe de redes",
    extracto: "Recuerden entregar el viernes",
  });
  const t = cn.tareaDesdeCorreo(c, { razon: "pide", fecha: "2026-11-20" });
  assert.equal(t.type, "Tarea");
  assert.equal(t.title, "Entrega del informe de redes");
  assert.ok(t.description.startsWith("De: Ana Pérez <ana@x.cl>"));
  assert.match(t.description, /Recuerden entregar el viernes/);
  assert.equal(t.dueAt, new Date(2026, 10, 20, 18, 0).toISOString());
  assert.equal(cn.tareaDesdeCorreo(c, undefined).dueAt, "");
  assert.equal(cn.tareaDesdeCorreo({ ...c, asunto: "" }, undefined).title, "Correo de Ana Pérez");
  assert.equal(cn.tareaDesdeCorreo({ ...c, asunto: "a".repeat(200) }, undefined).title.length, 160);
  const e = cn.eventoDesdeCorreo(c, { razon: "fecha", fecha: "2026-12-01" }, AHORA);
  assert.equal(e.type, "Evento");
  assert.equal(e.scheduledAt, new Date(2026, 11, 1, 9, 0).toISOString());
  assert.equal(e.startDate, "2026-12-01");
  assert.equal(e.duration, 60);
  assert.equal(
    cn.eventoDesdeCorreo(c, { razon: "fecha", fecha: "2026-12-01T17:30" }, AHORA).scheduledAt,
    new Date(2026, 11, 1, 17, 30).toISOString(),
  );
  assert.equal(cn.eventoDesdeCorreo(c, undefined, AHORA).scheduledAt, new Date(2026, 10, 18, 9, 0).toISOString());
  const conExtra = cn.eventoDesdeCorreo(c, { razon: "fecha", fecha: "2026-11-21T17:00" }, AHORA, {
    titulo: "Juntarse con Ana",
    minutos: 90,
  });
  assert.equal(conExtra.title, "Juntarse con Ana");
  assert.equal(conExtra.duration, 90);
});

test("correo Neka: borrador", () => {
  const json = JSON.stringify({
    texto: "¡Hola Ana!\nSí, me sirve.",
    evento: { titulo: "Juntarse con Ana", inicio: "2026-11-21T17:00", minutos: 60 },
  });
  assert.deepEqual(cn.leerBorrador("```json\n" + json + "\n```"), {
    texto: "¡Hola Ana!\nSí, me sirve.",
    evento: { titulo: "Juntarse con Ana", inicio: "2026-11-21T17:00", minutos: 60 },
  });
  assert.deepEqual(cn.leerBorrador('{"texto":"Ok","evento":{"titulo":"X","inicio":"pronto"}}'), { texto: "Ok" });
  assert.deepEqual(cn.leerBorrador('{"texto":"Ok","evento":null}'), { texto: "Ok" });
  assert.equal(cn.leerBorrador('{"texto":"  "}'), null);
  assert.equal(cn.leerBorrador("hola"), null);
  const completo = {
    ...resumen("1"),
    texto: "¿Te tinca el sábado en la biblioteca?",
    para: "s",
    responderA: { nombre: "Ana", correo: "ana@x.cl" },
    idMensaje: "",
    referencias: "",
  };
  const p = cn.pedidoBorrador(completo, "dile que sí, a las 5", "Sofía");
  assert.match(p, /dile que sí, a las 5/);
  assert.match(p, /¿Te tinca el sábado en la biblioteca\?/);
  assert.match(p, /Sofía/);
});
