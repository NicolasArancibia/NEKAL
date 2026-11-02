const { test } = require("node:test");
const assert = require("node:assert/strict");
const g = require("../.test-build/agente/gemini.js");

// Cerebro de Neka con la clave de Google AI Studio (sin el SDK de Firebase):
// una `fetch` falsa guarda lo que se manda y devuelve lo que se le indique.
const CLAVE = "clave-secreta-de-prueba";
function falsa(...respuestas) {
  const llamadas = [];
  const fetcher = async (url, init) => {
    llamadas.push({ url, init, body: JSON.parse(init.body) });
    const r = respuestas[Math.min(llamadas.length - 1, respuestas.length - 1)];
    return {
      ok: r.status === undefined || (r.status >= 200 && r.status < 300),
      status: r.status ?? 200,
      json: async () => r.json,
    };
  };
  return { fetcher, llamadas };
}
const cerebro = (f) =>
  g.crearCerebroStudio({
    clave: CLAVE,
    modelo: "m-prueba",
    fetcher: f.fetcher,
  });
const candidato = (...parts) => ({
  json: { candidates: [{ content: { role: "model", parts } }] },
});
const declaraciones = [
  {
    name: "buscar",
    description: "Busca.",
    parameters: { type: "object", properties: {} },
  },
];

test("gemini: enviar manda instrucciones, herramientas e historial", async () => {
  const f = falsa(candidato({ text: " Hola. " }));
  const s = cerebro(f).sesion(
    "Eres Neka.",
    [
      { deUsuario: true, texto: "buenas" },
      { deUsuario: false, texto: "hola" },
    ],
    declaraciones,
  );
  const r = await s.enviar("¿qué tengo?");
  assert.deepEqual(r, { texto: "Hola.", llamadas: [] });
  const [c] = f.llamadas;
  assert.equal(
    c.url,
    "https://generativelanguage.googleapis.com/v1beta/models/m-prueba:generateContent",
  );
  assert.equal(c.init.method, "POST");
  assert.equal(c.init.headers["x-goog-api-key"], CLAVE);
  assert.equal(c.init.headers["Content-Type"], "application/json");
  assert.deepEqual(c.body.systemInstruction, {
    parts: [{ text: "Eres Neka." }],
  });
  assert.deepEqual(c.body.tools, [{ functionDeclarations: declaraciones }]);
  assert.deepEqual(c.body.contents, [
    { role: "user", parts: [{ text: "buenas" }] },
    { role: "model", parts: [{ text: "hola" }] },
    { role: "user", parts: [{ text: "¿qué tengo?" }] },
  ]);
});

test("gemini: la clave va en el encabezado, nunca en la dirección", async () => {
  const f = falsa(candidato({ text: "ok" }));
  await cerebro(f).sesion("x", [], declaraciones).enviar("hola");
  assert.ok(!f.llamadas[0].url.includes(CLAVE));
});

test("gemini: sin herramientas no manda `tools`", async () => {
  const f = falsa(candidato({ text: "ok" }));
  await cerebro(f).sesion("x", [], []).enviar("hola");
  assert.equal("tools" in f.llamadas[0].body, false);
});

test("gemini: lee las llamadas a herramientas", async () => {
  const f = falsa(
    candidato(
      { functionCall: { name: "buscar", args: { texto: "gym" }, id: "a1" } },
      { functionCall: { name: "completar", id: "a2" } },
    ),
  );
  const r = await cerebro(f).sesion("x", [], declaraciones).enviar("busca");
  assert.deepEqual(r, {
    texto: "",
    llamadas: [
      { nombre: "buscar", args: { texto: "gym" } },
      { nombre: "completar", args: {} },
    ],
  });
});

test("gemini: devolver repite el turno del modelo tal cual y responde con el mismo id", async () => {
  const turnoModelo = {
    role: "model",
    parts: [
      {
        functionCall: { name: "buscar", args: { texto: "gym" }, id: "a1" },
        thoughtSignature: "firma-1",
      },
      { functionCall: { name: "completar", args: {}, id: "a2" } },
    ],
  };
  const f = falsa(
    { json: { candidates: [{ content: turnoModelo }] } },
    candidato({ text: "Listo." }),
  );
  const s = cerebro(f).sesion("x", [], declaraciones);
  await s.enviar("busca");
  const r = await s.devolver([
    { nombre: "buscar", respuesta: { total: 1 } },
    { nombre: "completar", respuesta: { error: "no existe" } },
  ]);
  assert.deepEqual(r, { texto: "Listo.", llamadas: [] });
  assert.deepEqual(f.llamadas[1].body.contents, [
    { role: "user", parts: [{ text: "busca" }] },
    turnoModelo,
    {
      role: "user",
      parts: [
        {
          functionResponse: {
            name: "buscar",
            id: "a1",
            response: { total: 1 },
          },
        },
        {
          functionResponse: {
            name: "completar",
            id: "a2",
            response: { error: "no existe" },
          },
        },
      ],
    },
  ]);
});

test("gemini: el historial empieza en la persona, alterna y quita la última de la persona", () => {
  assert.deepEqual(
    g.historia([
      { deUsuario: false, texto: "hola, soy Neka" },
      { deUsuario: true, texto: "a" },
      { deUsuario: true, texto: "b" },
      { deUsuario: false, texto: "" },
      { deUsuario: false, texto: "c" },
      { deUsuario: true, texto: "d" },
    ]),
    [
      { role: "user", parts: [{ text: "a" }, { text: "b" }] },
      { role: "model", parts: [{ text: "c" }] },
    ],
  );
});

test("gemini: un error de la API dice el código y el motivo, sin la clave", async () => {
  const f = falsa({
    status: 429,
    json: {
      error: {
        code: 429,
        message: "Quota exceeded",
        status: "RESOURCE_EXHAUSTED",
      },
    },
  });
  await assert.rejects(
    cerebro(f).sesion("x", [], declaraciones).enviar("hola"),
    (e) => {
      assert.match(e.message, /429/);
      assert.match(e.message, /Quota exceeded/);
      assert.ok(!e.message.includes(CLAVE));
      return true;
    },
  );
});

test("gemini: una respuesta bloqueada o sin candidatos es vacía, no un error", async () => {
  const f = falsa({ json: { promptFeedback: { blockReason: "SAFETY" } } });
  const r = await cerebro(f).sesion("x", [], declaraciones).enviar("hola");
  assert.deepEqual(r, { texto: "", llamadas: [] });
});

test("gemini: transcribir manda el audio y devuelve el texto", async () => {
  const f = falsa(candidato({ text: " Llego 20 minutos tarde. " }));
  const t = await cerebro(f).transcribir({ base64: "QUJD", mime: "audio/mp4" });
  assert.equal(t, "Llego 20 minutos tarde.");
  assert.deepEqual(f.llamadas[0].body.contents, [
    {
      role: "user",
      parts: [
        { text: g.TRANSCRIBIR },
        { inlineData: { mimeType: "audio/mp4", data: "QUJD" } },
      ],
    },
  ]);
});
