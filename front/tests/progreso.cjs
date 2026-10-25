const { test } = require("node:test");
const assert = require("node:assert/strict");
const m = require("../.test-build/model.js");
const niv = require("../.test-build/progreso/nivel.js");
const des = require("../.test-build/progreso/desde.js");
// Domingo 12 de mayo de 2030, 18:00 local.
const now = new Date(2030, 4, 12, 18, 0).getTime();
const DIA = 86400000;
const iso = (ms) => new Date(ms).toISOString();
const item = (fields = {}) => ({ ...m.newItem(), title: "Cosa", ...fields });
const pasos = (n, done = 0) =>
  Array.from({ length: n }, (_, k) => ({
    id: `p${k}`,
    title: `Paso ${k}`,
    done: k < done,
  }));

test("puntaje: dificultad por pasos y lugar, sin fecha", () => {
  const dif = (fields) => m.difficultyOf(item(fields));
  assert.equal(dif({ steps: pasos(0) }), 1);
  assert.equal(dif({ steps: pasos(1) }), 1);
  assert.equal(dif({ steps: pasos(2) }), 2);
  assert.equal(dif({ steps: pasos(1), location: "Casa" }), 2);
  assert.equal(dif({ steps: pasos(4) }), 2);
  assert.equal(dif({ steps: pasos(4), location: "Casa" }), 3);
  assert.equal(dif({ dueAt: iso(now + DIA) }), 1);
});

const informe = (fields = {}) =>
  item({
    title: "Entregar informe",
    priority: "urgente",
    steps: pasos(3),
    ...fields,
  });

test("puntaje: bonus antes, justo y atrasado", () => {
  assert.equal(m.pointsFor(informe({ dueAt: iso(now + DIA) }), [], now), 48);
  assert.equal(m.pointsFor(informe({ dueAt: iso(now) }), [], now), 48);
  assert.equal(m.pointsFor(informe({ dueAt: iso(now - 60000) }), [], now), 40);
});

test("puntaje: sin fecha límite no hay bonus", () => {
  assert.equal(m.pointsFor(informe(), [], now), 40);
});

test("puntaje: la meta congela el bonus en el primer pago", () => {
  const meta = item({
    type: "Goal",
    priority: "urgente",
    steps: pasos(3, 1),
    dueAt: iso(now + 2 * DIA),
  });
  let d = m.saveItem(m.emptyData(), meta, now);
  assert.equal(d.rewards.find((r) => r.key.endsWith(":budget")).points, 48);
  d = m.saveItem(
    d,
    { ...meta, status: "completado", steps: pasos(3, 3) },
    now + 5 * DIA,
  );
  assert.equal(m.totalPoints(d), 48);
});

test("nivel: bordes", () => {
  assert.deepEqual(niv.nivelDe(0), {
    nivel: 1,
    desde: 0,
    hasta: 100,
    avance: 0,
  });
  assert.equal(niv.nivelDe(99).nivel, 1);
  assert.equal(niv.nivelDe(100).nivel, 2);
  assert.equal(niv.nivelDe(299).nivel, 2);
  assert.equal(niv.nivelDe(300).nivel, 3);
  assert.equal(niv.nivelDe(2800).nivel, 8);
  assert.equal(niv.nivelDe(4500).nivel, 10);
  assert.deepEqual(niv.nivelDe(3140), {
    nivel: 8,
    desde: 2800,
    hasta: 3600,
    avance: 0.425,
  });
  assert.equal(niv.nivelDe(-5).nivel, 1);
  assert.equal(niv.puntosParaNivel(5), 1000);
});

test("desde: cuenta vacía", () => {
  const r = des.desdeElDia1(m.emptyData(), now);
  assert.equal(r.dia1, "2030-05-12");
  assert.equal(r.dias, 1);
  assert.equal(r.listas, 0);
  assert.equal(r.nivelesSubidos, 0);
  assert.deepEqual(r.subidas, []);
});

test("desde: día 1, curva y subidas", () => {
  const premio = (key, points, y, mo, d) => ({
    key,
    itemId: "a",
    points,
    at: iso(new Date(y, mo, d, 12).getTime()),
    reason: m.RAZON_COMPLETADO,
  });
  const d = {
    ...m.emptyData(),
    items: [
      item({ id: "a", createdAt: iso(new Date(2030, 3, 1, 9).getTime()) }),
    ],
    rewards: [
      premio("r1", 100, 2030, 3, 3),
      premio("a:budget", 999, 2030, 3, 3),
      premio("r2", 200, 2030, 3, 20),
      premio("r3", 50, 2030, 4, 10),
    ],
  };
  const r = des.desdeElDia1(d, now);
  assert.equal(r.dia1, "2030-04-01");
  assert.equal(r.dias, 42);
  assert.deepEqual(
    r.curva.map((c) => c.dia),
    [
      "2030-04-01",
      "2030-04-08",
      "2030-04-15",
      "2030-04-22",
      "2030-04-29",
      "2030-05-06",
      "2030-05-12",
    ],
  );
  assert.deepEqual(
    r.curva.map((c) => c.puntos),
    [0, 100, 100, 300, 300, 300, 350],
  );
  assert.deepEqual(r.subidas, [
    { dia: "2030-04-03", nivel: 2 },
    { dia: "2030-04-20", nivel: 3 },
  ]);
  assert.equal(r.nivelesSubidos, 2);
});

test("desde: cosas listas sin notas ni borradas", () => {
  const d = {
    ...m.emptyData(),
    items: [
      item({ status: "completado" }),
      item({ status: "completado", deletedAt: iso(now) }),
      item({ type: "Nota" }),
      item(),
    ],
  };
  assert.equal(des.cosasListas(d), 1);
});
