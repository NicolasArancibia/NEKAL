const { test } = require("node:test");
const assert = require("node:assert/strict");
const m = require("../.test-build/model.js");
const r = require("../.test-build/rutinas.js");
const s = require("../.test-build/syncModel.js");
// Viernes 3 de mayo de 2030, 10:00 local.
const now = new Date(2030, 4, 3, 10, 0).getTime();
const item = (fields = {}) => ({
  ...m.newItem(),
  title: "Cosa",
  startDate: "2030-05-01",
  ...fields,
});
const rutina = (fields = {}) => ({
  ...m.newGroup("Mañana", "general"),
  id: "R",
  repeat: "diario",
  repeatStart: "2030-05-01",
  ...fields,
});
const datos = (g, items = [item({ id: "m1", groupId: "R" })]) => ({
  ...m.emptyData(),
  groups: [g],
  items,
});
const generados = (d) =>
  d.groups.filter((g) => g.parentId === "R").map((g) => g.id);

test("rutinas: diaria genera 7 días", () => {
  const d = r.aplicarRutinas(datos(rutina()), now);
  assert.deepEqual(generados(d), [
    "R~2030-05-03",
    "R~2030-05-04",
    "R~2030-05-05",
    "R~2030-05-06",
    "R~2030-05-07",
    "R~2030-05-08",
    "R~2030-05-09",
  ]);
  const g = d.groups.find((x) => x.id === "R~2030-05-03");
  assert.deepEqual(
    [g.name, g.workspaceId, g.repeat, g.repeatStart],
    ["Mañana · 3 may", "general", "", ""],
  );
  assert.equal(r.idOcurrencia("R", "2030-05-03"), "R~2030-05-03");
});
test("rutinas: semanal solo el mismo día", () =>
  // 1 de mayo de 2030 es miércoles.
  assert.deepEqual(
    generados(r.aplicarRutinas(datos(rutina({ repeat: "semanal" })), now)),
    ["R~2030-05-08"],
  ));
test("rutinas: ciertos días", () =>
  assert.deepEqual(
    r.diasQueToca(
      rutina({ repeat: "dias", repeatDays: [1, 3] }),
      "2030-05-03",
      "2030-05-09",
    ),
    ["2030-05-06", "2030-05-08"],
  ));
test("rutinas: nunca antes del inicio", () => {
  assert.deepEqual(
    r.diasQueToca(
      rutina({ repeatStart: "2030-05-06" }),
      "2030-05-03",
      "2030-05-09",
    ),
    ["2030-05-06", "2030-05-07", "2030-05-08", "2030-05-09"],
  );
  assert.deepEqual(
    r.diasQueToca(rutina({ repeat: "" }), "2030-05-03", "2030-05-09"),
    [],
  );
});
test("rutinas: sin modelo no genera", () => {
  const d = datos(rutina(), []);
  assert.equal(r.aplicarRutinas(d, now), d);
});
test("rutinas: conserva hora y reconecta dependencias", () => {
  const d = r.aplicarRutinas(
    datos(rutina(), [
      item({
        id: "m1",
        groupId: "R",
        type: "Meeting",
        scheduledAt: new Date(2030, 4, 1, 7, 30).toISOString(),
        status: "completado",
      }),
      item({
        id: "m2",
        groupId: "R",
        dependencies: ["m1"],
        steps: [{ id: "s1", title: "Paso", done: true }],
        x: 1,
      }),
    ]),
    now,
  );
  const a = d.items.find((i) => i.id === "R~2030-05-03~m1");
  const b = d.items.find((i) => i.id === "R~2030-05-03~m2");
  assert.equal(a.scheduledAt, new Date(2030, 4, 3, 7, 30).toISOString());
  assert.deepEqual(
    [a.groupId, a.status, a.startDate],
    ["R~2030-05-03", "pendiente", "2030-05-03"],
  );
  assert.deepEqual(b.dependencies, ["R~2030-05-03~m1"]);
  assert.deepEqual(b.steps, [
    { id: "R~2030-05-03~m2~s1", title: "Paso", done: false },
  ]);
  assert.deepEqual([b.x, b.y], [1, 0]);
  assert.equal(d.items.length, 2 + 7 * 2);
});
test("rutinas: no duplica si ya existe", () => {
  const a = r.aplicarRutinas(datos(rutina()), now);
  assert.equal(r.aplicarRutinas(a, now), a);
  // Un día después solo agrega el día nuevo.
  const b = r.aplicarRutinas(a, now + 86400000);
  assert.equal(b.groups.length, a.groups.length + 1);
});
test("rutinas: dos copias generan los mismos registros", () => {
  const base = datos(rutina(), [
    item({
      id: "m1",
      groupId: "R",
      steps: [{ id: "s1", title: "Paso", done: false }],
    }),
  ]);
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const a = r.aplicarRutinas(base, now),
    b = r.aplicarRutinas(clone(base), now + 3600000);
  assert.equal(s.operation(a, b), null);
});
test("rutinas: anteriores completas se separan", () => {
  const oc = (dia) => ({
    ...m.newGroup(`Mañana · ${dia}`, "general"),
    id: `R~${dia}`,
    parentId: "R",
  });
  const d = {
    ...datos(rutina(), [
      item({ id: "m1", groupId: "R" }),
      item({ groupId: "R~2030-05-01", status: "completado" }),
      item({ groupId: "R~2030-05-02" }),
    ]),
    groups: [rutina(), oc("2030-05-03"), oc("2030-05-01"), oc("2030-05-02")],
  };
  const o = r.ocurrencias(d, "R", now);
  assert.deepEqual(
    o.anteriores.map((g) => g.id),
    ["R~2030-05-01"],
  );
  assert.deepEqual(
    o.actuales.map((g) => g.id),
    ["R~2030-05-02", "R~2030-05-03"],
  );
});
test("rutinas: sinAnteriores esconde las pasadas completas", () => {
  const oc = (dia) => ({ ...m.newGroup(`Mañana · ${dia}`, "general"), id: `R~${dia}`, parentId: "R" });
  const d = {
    ...datos(rutina(), [
      item({ id: "m1", groupId: "R" }),
      item({ id: "vieja", groupId: "R~2030-05-01", status: "completado" }),
      item({ id: "pendiente", groupId: "R~2030-05-02" }),
    ]),
    groups: [rutina(), oc("2030-05-01"), oc("2030-05-02")],
  };
  const s = r.sinAnteriores(d, now);
  assert.deepEqual(s.groups.map((g) => g.id), ["R", "R~2030-05-02"]);
  assert.deepEqual(s.items.map((i) => i.id), ["m1", "pendiente"]);
  const limpio = datos(rutina());
  assert.equal(r.sinAnteriores(limpio, now), limpio);
});
