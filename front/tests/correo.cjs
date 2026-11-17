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
