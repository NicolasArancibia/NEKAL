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
