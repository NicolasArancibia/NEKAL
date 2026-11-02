const { test } = require("node:test");
const assert = require("node:assert/strict");
const m = require("../.test-build/model.js");
const pl = require("../.test-build/agente/plan.js");
const h = require("../.test-build/agente/herramientas.js");

// Fase H1 (estabilizar Neka): lo que un plan puede dejar roto en la agenda.
// Lunes 6 de mayo de 2030.
const now = new Date(2030, 4, 6, 9, 0).getTime();
const ahora19 = new Date(2030, 4, 6, 19, 0).getTime();
const ti = (hh, min = 0, dia = 6) =>
  new Date(2030, 4, dia, hh, min).toISOString();
const viejo = "2030-05-01T00:00:00.000Z";
const cosa = (id, fields = {}) => ({
  ...m.newItem(),
  id,
  title: id,
  startDate: "2030-05-01",
  createdAt: viejo,
  updatedAt: viejo,
  ...fields,
});
const con = (...items) => ({ ...m.emptyData(), items });
const llamar = (d, nombre, args = {}, previos = [], ahora = now) =>
  h.ejecutar(d, previos, { nombre, args }, ahora);
const mover = (id, h2, min = 0) => ({
  tipo: "mover",
  id,
  scheduledAt: ti(h2, min),
  dueAt: "",
  startDate: "2030-05-01",
  texto: `${id} → ${h2}:${min}`,
  toca: { [id]: viejo },
});

test("choquesDelPlan: algo fijo nuevo en el hueco destino bloquea", () => {
  const d = con(
    cosa("mama", { scheduledAt: ti(19, 30), duration: 30 }),
    cosa("gimnasio", {
      type: "Evento",
      flexible: false,
      scheduledAt: ti(19, 50),
      duration: 10,
    }),
  );
  const e = llamar(
    d,
    "correrDesde",
    { minutos: 20, desde: "2030-05-06 19:00" },
    [],
    ahora19,
  );
  assert.equal(e.pasos.length, 1);
  const plan = { id: "p", resumen: "1 cambio", pasos: e.pasos };
  // Mientras el plan espera, entra una reunión fija a las 20:00.
  const d2 = con(
    ...d.items,
    cosa("nuevo", {
      type: "Meeting",
      flexible: false,
      scheduledAt: ti(20, 0),
      duration: 30,
      updatedAt: "2030-05-06T19:01:00.000Z",
    }),
  );
  const choques = pl.choquesDelPlan(d2, plan.pasos, [true], ahora19);
  assert.equal(choques.length, 1);
  assert.equal(choques[0].bloquea, true);
  assert.match(choques[0].descripcion, /se superpone/);
  assert.throws(
    () => pl.aceptar(d2, plan, [true], ahora19),
    /La agenda cambió/,
  );
});

test("choquesDelPlan: no culpa al plan de choques que ya existían", () => {
  const d = con(
    cosa("a", { scheduledAt: ti(10, 0), duration: 60 }),
    cosa("b", { scheduledAt: ti(10, 30), duration: 60 }),
    cosa("c"),
  );
  const completar = {
    tipo: "completar",
    id: "c",
    texto: "Completar «c»",
    toca: { c: viejo },
  };
  assert.deepEqual(pl.choquesDelPlan(d, [completar], [true], now), []);
});

test("choquesDelPlan: dos fijos avisan pero no bloquean", () => {
  const d = con(
    cosa("reunion", {
      type: "Meeting",
      flexible: false,
      scheduledAt: ti(20, 0),
      duration: 60,
    }),
  );
  const e = llamar(d, "crear", {
    tipo: "Evento",
    titulo: "Cena",
    inicio: "2030-05-06 20:30",
    duracion: 30,
    fija: true,
  });
  assert.equal(e.pasos.length, 1);
  const choques = pl.choquesDelPlan(d, e.pasos, [true], now);
  assert.equal(choques.length, 1);
  assert.equal(choques[0].bloquea, false);
});

test("choquesDelPlan: desmarcar un paso puede dejar un choque", () => {
  const d = con(
    cosa("x", { scheduledAt: ti(20, 0), duration: 60 }),
    cosa("y", { scheduledAt: ti(18, 0), duration: 60 }),
  );
  const pasos = [
    { ...mover("x", 22), eraFija: false },
    { ...mover("y", 20), eraFija: false },
  ];
  assert.deepEqual(pl.choquesDelPlan(d, pasos, [true, true], now), []);
  const parcial = pl.choquesDelPlan(d, pasos, [false, true], now);
  assert.equal(parcial.length, 1);
  assert.equal(parcial[0].bloquea, true);
});

test("choquesDelPlan: notas y completadas no cuentan", () => {
  const d = con(
    cosa("reunion", {
      type: "Meeting",
      flexible: false,
      scheduledAt: ti(20, 0),
      duration: 60,
    }),
    cosa("nota", { type: "Nota", scheduledAt: ti(18, 0) }),
    cosa("hecha", { status: "completado", scheduledAt: ti(18, 0) }),
  );
  const pasos = [mover("nota", 20, 15), mover("hecha", 20, 30)];
  assert.deepEqual(pl.choquesDelPlan(d, pasos, [true, true], now), []);
});

// Tarea 2: Neka no propone lo que choca.
const tarde = () =>
  con(
    cosa("tarea", { scheduledAt: ti(18, 0), duration: 30 }),
    cosa("reunion", {
      type: "Meeting",
      flexible: false,
      scheduledAt: ti(20, 0),
      duration: 60,
    }),
  );

test("ejecutar: mover una tarea sobre algo fijo se rechaza", () => {
  const e = llamar(tarde(), "mover", { id: "tarea", inicio: "2030-05-06 20:15" });
  assert.deepEqual(e.pasos, []);
  assert.match(e.resultado.error, /se superpone/);
  assert.match(e.resultado.error, /buscarHueco/);
});
test("ejecutar: crear una tarea sobre algo fijo se rechaza", () => {
  const e = llamar(tarde(), "crear", {
    tipo: "Tarea",
    titulo: "Informe",
    inicio: "2030-05-06 20:30",
    duracion: 30,
  });
  assert.deepEqual(e.pasos, []);
  assert.match(e.resultado.error, /se superpone/);
});
test("ejecutar: crear un evento fijo sobre algo fijo se permite", () => {
  const e = llamar(tarde(), "crear", {
    tipo: "Evento",
    titulo: "Cena",
    inicio: "2030-05-06 20:30",
    duracion: 30,
    fija: true,
  });
  assert.equal(e.resultado.error, undefined);
  assert.equal(e.pasos.length, 1);
});
test("ejecutar: mover a un hueco libre sigue funcionando", () => {
  const e = llamar(tarde(), "mover", { id: "tarea", inicio: "2030-05-06 21:30" });
  assert.equal(e.resultado.error, undefined);
  assert.equal(e.pasos.length, 1);
});
test("ejecutar: lo que ya chocaba antes de la propuesta no la rechaza", () => {
  const d = con(
    cosa("a", { scheduledAt: ti(10, 0), duration: 60 }),
    cosa("b", { scheduledAt: ti(10, 30), duration: 60 }),
    cosa("c", { scheduledAt: ti(15, 0), duration: 30 }),
  );
  const e = llamar(d, "mover", { id: "c", inicio: "2030-05-06 16:00" });
  assert.equal(e.resultado.error, undefined);
  assert.equal(e.pasos.length, 1);
});

// Tarea 3: explicar el salto y «no cabe todo» con alternativa.
const p = require("../.test-build/planner.js");
const t = (hh, min = 0) => new Date(2030, 4, 6, hh, min).getTime();
const mamaYGimnasio = () =>
  con(
    cosa("mama", { scheduledAt: ti(19, 30), duration: 30 }),
    cosa("gimnasio", {
      type: "Evento",
      flexible: false,
      scheduledAt: ti(19, 50),
      duration: 10,
    }),
  );

test("correrDesde: dice qué fijo saltó", () => {
  const [c] = p.correrDesde(mamaYGimnasio(), 20, ahora19);
  assert.equal(c.salta, "gimnasio");
  const libre = con(cosa("gym", { scheduledAt: ti(9, 30), duration: 60 }));
  assert.equal(p.correrDesde(libre, 20, t(9, 10))[0].salta, null);
});
test("herramientas: el paso explica el salto", () => {
  const e = llamar(
    mamaYGimnasio(),
    "correrDesde",
    { minutos: 20, desde: "2030-05-06 19:00" },
    [],
    ahora19,
  );
  assert.match(e.pasos[0].texto, /19:30 → 20:00/);
  assert.match(e.pasos[0].texto, /salta «gimnasio», que es fija/);
});
test("correrDesde: no empuja algo más allá de su plazo", () => {
  const d = con(
    cosa("x", { scheduledAt: ti(10, 0), duration: 30, dueAt: ti(10, 30) }),
  );
  const [c] = p.correrDesde(d, 20, t(9, 10));
  assert.equal(c.noCabe, true);
  assert.equal(c.pasaPlazo, true);
  assert.equal(c.despues, c.antes);
  const holgada = con(
    cosa("x", { scheduledAt: ti(10, 0), duration: 30, dueAt: ti(11, 0) }),
  );
  const [ok] = p.correrDesde(holgada, 20, t(9, 10));
  assert.equal(ok.noCabe, false);
  assert.equal(ok.pasaPlazo, false);
});
test("herramientas: lo que no cabe trae su alternativa del día siguiente", () => {
  const d = con(cosa("tarde", { scheduledAt: ti(20, 30), duration: 30 }));
  const e = llamar(d, "correrDesde", { minutos: 40, desde: "2030-05-06 20:00" });
  assert.deepEqual(e.resultado.noCaben, [
    { id: "tarde", titulo: "tarde", alternativa: "2030-05-07 08:00" },
  ]);
});
test("herramientas: sin hueco antes del plazo no hay alternativa", () => {
  const d = con(
    cosa("tarde", {
      scheduledAt: ti(20, 30),
      duration: 30,
      dueAt: ti(21, 0),
    }),
  );
  const e = llamar(d, "correrDesde", { minutos: 40, desde: "2030-05-06 20:00" });
  assert.deepEqual(e.resultado.noCaben, [
    { id: "tarde", titulo: "tarde", alternativa: null },
  ]);
});

// Tarea 4: plazo, prioridad y respuestas sin ruido.
const ctx = require("../.test-build/agente/contexto.js");
const cv = require("../.test-build/agente/conversar.js");

test("buscarHueco: con id usa el plazo de la cosa", () => {
  const ocupado = cosa("ocupado", {
    type: "Evento",
    flexible: false,
    scheduledAt: ti(8, 0),
    duration: 120,
  });
  const conPlazo = con(
    cosa("x", { duration: 60, dueAt: ti(10, 0) }),
    ocupado,
  );
  const a = llamar(conPlazo, "buscarHueco", {
    id: "x",
    desde: "2030-05-06 09:00",
  });
  assert.equal(a.resultado.inicio, null);
  const sinPlazo = con(cosa("x", { duration: 60 }), ocupado);
  const b = llamar(sinPlazo, "buscarHueco", {
    id: "x",
    desde: "2030-05-06 09:00",
  });
  assert.equal(b.resultado.inicio, "2030-05-06 10:00");
});

test("contexto: la prioridad aparece si no es media", () => {
  const d = con();
  const urgente = cosa("u", { scheduledAt: ti(10, 0), priority: "urgente" });
  const media = cosa("m", { scheduledAt: ti(10, 0) });
  assert.match(ctx.linea(d, urgente), /prioridad urgente/);
  assert.doesNotMatch(ctx.linea(d, media), /prioridad/);
});

test("quitarIds: borra ids reales y respeta corchetes ajenos", () => {
  const d = {
    ...con(cosa("gym", { scheduledAt: ti(10, 0) })),
    groups: [{ ...m.newGroup("Tesis", "general"), id: "g1" }],
  };
  assert.equal(cv.quitarIds("Tienes Estirar [gym].", d), "Tienes Estirar.");
  assert.equal(cv.quitarIds("Dijo [sic] eso", d), "Dijo [sic] eso");
  assert.equal(cv.quitarIds("En Tesis [g1] hay algo", d), "En Tesis hay algo");
  assert.equal(cv.quitarIds("En General [general] también", d), "En General también");
  assert.equal(cv.quitarIds("[gym] primero", d), "primero");
});

test("conversar: la respuesta sale sin ids", async () => {
  const d = con(cosa("gym", { scheduledAt: ti(10, 0) }));
  const dice = (texto) => ({
    transcribir: async () => "",
    sesion: () => ({
      enviar: async () => ({ texto, llamadas: [] }),
      devolver: async () => ({ texto, llamadas: [] }),
    }),
  });
  const r = await cv.conversar(dice("Hoy: Gym [gym]"), d, "¿qué tengo?", now);
  assert.equal(r.respuesta, "Hoy: Gym");
});

test("INSTRUCCIONES: sin ids, todo lo pendiente de hoy, siguiente hueco y lo urgente", () => {
  assert.match(cv.INSTRUCCIONES, /nunca escribas ids/i);
  assert.match(cv.INSTRUCCIONES, /todo lo pendiente de hoy/i);
  assert.match(cv.INSTRUCCIONES, /siguiente hueco libre/i);
  assert.match(cv.INSTRUCCIONES, /conserva lo urgente/i);
});
