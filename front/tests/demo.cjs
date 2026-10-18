const { test } = require("node:test");
const assert = require("node:assert/strict");
const m = require("../.test-build/model.js");
const demo = require("../.test-build/demo.js");
const { readBackup } = require("../.test-build/storage.js");
const {
  recordsOf,
  diff,
  validateRecords,
} = require("../.test-build/syncModel.js");
const { toCloud } = require("../.test-build/cloudRecords.js");
// Domingo 18 de octubre de 2026, 16:00.
const now = new Date(2026, 9, 18, 16, 0).getTime();

test("demo: dos semanas válidas", () => {
  const d = demo.sembrarDemo(m.emptyData(), now);
  assert.doesNotThrow(() => readBackup(JSON.stringify(d)));
  assert.doesNotThrow(() => validateRecords(recordsOf(d)));
  assert.deepEqual(d.workspaces.map((w) => w.name).sort(), [
    "Casa",
    "General",
    "Personal",
    "Trabajo",
    "Universidad",
  ]);
  const vivas = m.activeItems(d);
  assert.ok(vivas.length >= 40, `${vivas.length} cosas`);
  const dias = vivas
    .map((i) => i.scheduledAt || i.dueAt)
    .filter(Boolean)
    .map((f) => (Date.parse(f) - now) / 86400000);
  assert.ok(Math.max(...dias) >= 12 && Math.max(...dias) < 14);
  assert.ok(Math.min(...dias) < 0); // también hay cosas hechas en días pasados
  assert.ok(vivas.some((i) => i.status === "completado"));
  assert.ok(vivas.some((i) => i.dependencies.length));
  assert.ok(
    vivas.some((i) => i.type === "Nota") &&
      vivas.some((i) => i.type === "Idea"),
  );
  assert.ok(d.groups.filter((g) => g.repeat).length >= 3);
  assert.ok(d.groups.some((g) => g.parentId));
});
test("demo: no duplica si se corre otra vez", () => {
  const d = demo.sembrarDemo(m.emptyData(), now);
  assert.equal(demo.sembrarDemo(d, now), d);
});
test("demo: usa la mesa Trabajo que ya existe", () => {
  const base = {
    ...m.emptyData(),
    workspaces: [
      ...m.emptyData().workspaces,
      { id: "w1", name: "Trabajo", color: "#7546EC" },
    ],
  };
  const d = demo.sembrarDemo(base, now);
  assert.equal(d.workspaces.filter((w) => w.name === "Trabajo").length, 1);
  assert.ok(d.items.some((i) => i.workspaceId === "w1"));
});
test("demo: cabe en una sola sincronización", () => {
  const vacia = m.emptyData();
  const d = demo.sembrarDemo(vacia, now);
  assert.ok(
    diff(toCloud(recordsOf(vacia)), toCloud(recordsOf(d))).length < 400,
  );
});
