const { test } = require("node:test");
const assert = require("node:assert/strict");
const m = require("../.test-build/model.js");
const esp = require("../.test-build/espacio.js");

// Fase H2 (vistas): la regla de «atrasada» y lo que depende de ella.
// Lunes 2 de noviembre de 2026, 10:10.
const now = new Date(2026, 10, 2, 10, 10).getTime();
const dia = (n, h = 9, mi = 0) =>
  new Date(2026, 10, 2 + n, h, mi).toISOString();
const viejo = "2026-09-01T00:00:00.000Z";
const cosa = (id, fields = {}) => ({
  ...m.newItem(),
  id,
  title: id,
  startDate: "2026-09-01",
  createdAt: viejo,
  updatedAt: viejo,
  ...fields,
});
const con = (...items) => ({ ...m.emptyData(), items });

test("estaAtrasada: hace 2 días no, hace 3 sí", () => {
  assert.equal(esp.ATRASO_DIAS, 2);
  assert.equal(
    esp.estaAtrasada(cosa("a", { scheduledAt: dia(-2) }), now),
    false,
  );
  assert.equal(
    esp.estaAtrasada(cosa("b", { scheduledAt: dia(-3) }), now),
    true,
  );
  assert.equal(
    esp.estaAtrasada(cosa("c", { scheduledAt: dia(-1) }), now),
    false,
  );
});
test("estaAtrasada: sin fecha, completada o pasiva nunca", () => {
  assert.equal(esp.estaAtrasada(cosa("a"), now), false);
  assert.equal(
    esp.estaAtrasada(
      cosa("b", { scheduledAt: dia(-9), status: "completado" }),
      now,
    ),
    false,
  );
  assert.equal(
    esp.estaAtrasada(cosa("c", { type: "Nota", scheduledAt: dia(-9) }), now),
    false,
  );
  assert.equal(
    esp.estaAtrasada(cosa("d", { type: "Idea", dueAt: dia(-9) }), now),
    false,
  );
});
test("estaAtrasada: fecha futura con inicio viejo no es atrasada", () => {
  const i = cosa("a", { startDate: "2026-09-01", scheduledAt: dia(3) });
  assert.equal(esp.estaAtrasada(i, now), false);
});
test("estaAtrasada: usa scheduledAt antes que dueAt", () => {
  assert.equal(
    esp.estaAtrasada(cosa("a", { scheduledAt: dia(1), dueAt: dia(-9) }), now),
    false,
  );
  assert.equal(esp.estaAtrasada(cosa("b", { dueAt: dia(-5) }), now), true);
});
test("atrasadas: solo las atrasadas, la más reciente primero", () => {
  const d = con(
    cosa("vieja", { scheduledAt: dia(-20) }),
    cosa("reciente", { scheduledAt: dia(-4) }),
    cosa("hoy", { scheduledAt: dia(0) }),
    cosa("hecha", { scheduledAt: dia(-9), status: "completado" }),
    cosa("sinFecha"),
  );
  assert.deepEqual(
    esp.atrasadas(d, now).map((i) => i.id),
    ["reciente", "vieja"],
  );
});
test("atrasadas: lo que está en una rutina (modelo) no cuenta", () => {
  const grupo = {
    ...m.newGroup("Rutina", "general"),
    id: "r",
    repeat: "diario",
  };
  const d = {
    ...con(cosa("modelo", { scheduledAt: dia(-20), groupId: "r" })),
    groups: [grupo],
  };
  assert.deepEqual(esp.atrasadas(d, now), []);
});
test("esImportante: urgente, con fecha límite o Deadline", () => {
  assert.equal(esp.esImportante(cosa("a", { priority: "urgente" })), true);
  assert.equal(esp.esImportante(cosa("b", { dueAt: dia(-5) })), true);
  assert.equal(esp.esImportante(cosa("c", { type: "Deadline" })), true);
  assert.equal(esp.esImportante(cosa("d", { priority: "media" })), false);
  assert.equal(esp.esImportante(cosa("e", { priority: "baja" })), false);
});
