const { test } = require("node:test");
const assert = require("node:assert/strict");
const m = require("../.test-build/model.js");
const p = require("../.test-build/planner.js");
const { readBackup } = require("../.test-build/storage.js");
const now = new Date("2030-05-01T08:00:00").getTime();
const iso = (s) => new Date(`2030-05-01T${s}:00`).toISOString();
const item = (fields = {}) => ({
  ...m.newItem(),
  title: "Test",
  startDate: "2030-05-01",
  ...fields,
});
test("fechas inválidas y año bisiesto", () => {
  assert.throws(() => m.parseDateInput("2030-02-30"));
  assert.throws(() => m.parseDateInput("2030-13-01"));
  assert.throws(() => m.parseDateInput("2030-01-01 25:00"));
  assert.ok(m.parseDateInput("2032-02-29"));
});
test("nota e idea nunca puntúan", () => {
  for (const type of ["Nota", "Idea"])
    assert.equal(m.pointsFor(item({ type }), []), 0);
});
test("visita exige ubicación", () => {
  assert.match(
    m.validateItem(
      item({ type: "Visita", scheduledAt: iso("10:00") }),
      m.emptyData(),
    ),
    /ubicación/,
  );
});
test("deadline exige fecha límite", () =>
  assert.match(
    m.validateItem(item({ type: "Deadline" }), m.emptyData()),
    /límite/,
  ));
test("evento exige horario", () =>
  assert.match(
    m.validateItem(item({ type: "Evento" }), m.emptyData()),
    /hora/,
  ));
test("duración inválida rechazada", () =>
  assert.match(
    m.validateItem(item({ duration: NaN }), m.emptyData()),
    /duración/,
  ));
test("dependencias circulares rechazadas", () => {
  const a = item({ id: "a", dependencies: ["b"] }),
    b = item({ id: "b" });
  const d = { ...m.emptyData(), items: [a, b] };
  assert.match(m.validateItem({ ...b, dependencies: ["a"] }, d), /ciclo/);
});
test("no completar antes de dependencia", () => {
  const a = item({ id: "a" }),
    b = item({ dependencies: ["a"], status: "completado" });
  assert.match(
    m.validateItem(b, { ...m.emptyData(), items: [a] }),
    /dependencias/,
  );
});
test("completar, reabrir y completar no duplica puntos", () => {
  const i = item({ status: "completado" });
  let d = m.saveItem(m.emptyData(), i, now);
  const points = m.totalPoints(d);
  d = m.saveItem(d, { ...i, status: "pendiente" }, now);
  d = m.saveItem(d, i, now);
  assert.equal(m.totalPoints(d), points);
  assert.ok(points > 0);
});
test("goal reparte puntos por hitos y conserva presupuesto", () => {
  const i = item({
    type: "Goal",
    steps: [
      { id: "1", title: "A", done: true },
      { id: "2", title: "B", done: false },
    ],
  });
  let d = m.saveItem(m.emptyData(), i, now);
  const initial = m.totalPoints(d),
    budget = d.rewards.find((r) => r.key.endsWith(":budget")).points;
  assert.ok(initial > 0);
  d = m.saveItem(d, { ...i, status: "completado" }, now);
  assert.equal(m.totalPoints(d), budget);
});
test("no se elimina un prerrequisito usado", () => {
  const a = item({ id: "a" }),
    b = item({ dependencies: ["a"] });
  assert.throws(() => m.deleteItem({ ...m.emptyData(), items: [a, b] }, "a"));
});
test("papelera conserva historial", () => {
  let d = m.saveItem(
    m.emptyData(),
    item({ id: "a", status: "completado" }),
    now,
  );
  const points = m.totalPoints(d);
  d = m.deleteItem(d, "a");
  assert.equal(m.activeItems(d).length, 0);
  assert.equal(m.totalPoints(d), points);
});
test("detecta superposición, permite extremos contiguos", () => {
  const a = item({ scheduledAt: iso("10:00"), duration: 60 }),
    b = item({ scheduledAt: iso("10:30") });
  assert.equal(
    p.findConflicts({ ...m.emptyData(), items: [a, b] }, now).length,
    1,
  );
  b.scheduledAt = iso("11:00");
  assert.equal(
    p.findConflicts({ ...m.emptyData(), items: [a, b] }, now).length,
    0,
  );
});
test("propone hueco respetando compromiso fijo", () => {
  const a = item({ id: "a", scheduledAt: iso("08:00"), duration: 60 }),
    b = item({
      id: "b",
      scheduledAt: iso("08:00"),
      duration: 90,
      flexible: false,
    });
  const d = { ...m.emptyData(), items: [a, b] };
  assert.equal(p.proposeSlot(d, "a", now).next, iso("09:30"));
  assert.equal(p.proposeSlot(d, "b", now), null);
});
test("no propone exceder plazo", () => {
  const a = item({ id: "a", duration: 60, dueAt: iso("08:30") });
  assert.equal(p.proposeSlot({ ...m.emptyData(), items: [a] }, "a", now), null);
});
test("dependencia sin horario impide propuesta", () => {
  const a = item({ id: "a" }),
    b = item({ id: "b", dependencies: ["a"] });
  assert.equal(
    p.proposeSlot({ ...m.emptyData(), items: [a, b] }, "b", now),
    null,
  );
});
test("propuesta obsoleta no se aplica", () => {
  const a = item({ id: "a" }),
    d = { ...m.emptyData(), items: [a] };
  assert.throws(
    () =>
      p.applyProposal(d, {
        itemId: "a",
        updatedAt: "old",
        next: iso("10:00"),
        previous: "",
        reason: "",
      }),
    /cambió/,
  );
});
test("rutinas duplican IDs y dependencias internas", () => {
  const a = item({
      id: "a",
      groupId: "g",
      status: "completado",
      scheduledAt: iso("10:00"),
    }),
    b = item({ id: "b", groupId: "g", dependencies: ["a"] });
  const d = {
    ...m.emptyData(),
    items: [a, b],
    groups: [{ id: "g", name: "Rutina", workspaceId: "general" }],
  };
  const copy = m.duplicateGroup(d, "g", "2030-05-02");
  assert.equal(copy.items.length, 4);
  assert.equal(copy.items[2].status, "pendiente");
  assert.equal(copy.items[3].dependencies[0], copy.items[2].id);
  assert.equal(m.localDay(new Date(copy.items[2].scheduledAt)), "2030-05-02");
});
test("respaldo válido hace roundtrip", () =>
  assert.deepEqual(readBackup(JSON.stringify(m.emptyData())), m.emptyData()));
test("respaldo incompatible no se importa", () =>
  assert.throws(() => readBackup('{"version":2}')));
test("todos los tipos persisten con sus campos", () => {
  let d = m.emptyData();
  for (const type of m.TYPES) {
    const i = item({
      type,
      scheduledAt: ["Evento", "Visita", "Meeting"].includes(type)
        ? iso("10:00")
        : "",
      location: type === "Visita" ? "Biblioteca" : "",
      dueAt: type === "Deadline" ? iso("18:00") : "",
      content: type === "Nota" ? "Texto largo" : "",
      category: type === "Idea" ? "Personal" : "",
      agenda: type === "Meeting" ? "Revisar proyecto" : "",
    });
    d = m.saveItem(d, i, now);
  }
  assert.equal(d.items.length, 8);
  assert.deepEqual(readBackup(JSON.stringify(d)), d);
});
test("reabrir prerrequisito completado con dependiente finalizado se rechaza", () => {
  const a = item({ id: "a", status: "completado" }),
    b = item({ id: "b", status: "completado", dependencies: ["a"] });
  assert.match(
    m.validateItem(
      { ...a, status: "pendiente" },
      { ...m.emptyData(), items: [a, b] },
    ),
    /Reabre primero/,
  );
});
test("restauración exige restaurar primero el prerrequisito", () => {
  const a = item({ id: "a", deletedAt: new Date(now).toISOString() }),
    b = item({
      id: "b",
      deletedAt: new Date(now).toISOString(),
      dependencies: ["a"],
    });
  let d = { ...m.emptyData(), items: [a, b] };
  assert.throws(() => m.restoreItem(d, "b"));
  d = m.restoreItem(d, "a");
  d = m.restoreItem(d, "b");
  assert.equal(m.activeItems(d).length, 2);
});
test("detecta falta de capacidad acumulada antes del plazo", () => {
  const a = item({ id: "a", duration: 60, dueAt: iso("09:30") }),
    b = item({ id: "b", duration: 60, dueAt: iso("09:30") });
  const c = p.findConflicts({ ...m.emptyData(), items: [a, b] }, now);
  assert.ok(c.some((x) => x.kind === "capacity"));
});
test("importar ciclos o fechas corruptas se rechaza", () => {
  const a = item({ id: "a", dependencies: ["b"] }),
    b = item({ id: "b", dependencies: ["a"] });
  assert.throws(() =>
    readBackup(JSON.stringify({ ...m.emptyData(), items: [a, b] })),
  );
  assert.throws(() =>
    readBackup(
      JSON.stringify({ ...m.emptyData(), items: [item({ dueAt: "invalid" })] }),
    ),
  );
});
test("bonus de dependencias tiene límite", () => {
  const a = item({ id: "a" }),
    all = Array.from({ length: 5 }, () => item({ dependencies: ["a"] }));
  assert.equal(m.pointsFor(a, all, now), 30);
});
test("evento opcional conserva dificultad manual", () => {
  const a = item({
    type: "Evento",
    scheduledAt: iso("10:00"),
    countsForScore: true,
    difficulty: 3,
    priority: "urgente",
  });
  assert.equal(m.pointsFor(a, [], now), 60);
});
test("clonar nodos automáticos mantiene el autoencuadre", () => {
  const d = {
    ...m.emptyData(),
    items: [item({ groupId: "g" })],
    groups: [{ id: "g", name: "g", workspaceId: "general" }],
  };
  const next = m.duplicateGroup(d, "g", "2030-05-02");
  assert.equal(next.items[1].x, 0);
  assert.equal(next.items[1].y, 0);
});
