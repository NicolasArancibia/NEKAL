const { test } = require("node:test");
const assert = require("node:assert/strict");
const m = require("../.test-build/model.js");
const e = require("../.test-build/estructura.js");
const { readBackup } = require("../.test-build/storage.js");
const cosa = (id, fields = {}) => ({
  ...m.newItem(),
  id,
  title: id,
  ...fields,
});
const grupo = (id, fields = {}) => ({
  ...m.newGroup(id, "general"),
  id,
  ...fields,
});
// General + mesa Trabajo ("t").
const datos = (fields = {}) => ({
  ...m.emptyData(),
  workspaces: [
    ...m.emptyData().workspaces,
    { id: "t", name: "Trabajo", color: "#3366ff" },
  ],
  ...fields,
});
const de = (d, id) => d.items.find((i) => i.id === id);
const ids = (lista) => lista.map((x) => x.id);

test("estructura: crear mesa", () => {
  const { data, id } = e.crearMesa(m.emptyData(), "  Trabajo ", "#3366ff");
  assert.deepEqual(
    data.workspaces.find((w) => w.id === id),
    { id, name: "Trabajo", color: "#3366ff" },
  );
  assert.equal(data.workspaces.length, 2);
  assert.throws(() => e.crearMesa(m.emptyData(), "  ", "#3366ff"), {
    message: "La mesa necesita un nombre.",
  });
});
test("estructura: no se borra General", () =>
  assert.throws(() => e.borrarMesa(datos(), e.GENERAL), {
    message: "General no se puede borrar.",
  }));
test("estructura: mesa con contenido no se borra", () => {
  const vaciala = { message: "Vacía la mesa antes de borrarla." };
  assert.throws(
    () =>
      e.borrarMesa(datos({ items: [cosa("a", { workspaceId: "t" })] }), "t"),
    vaciala,
  );
  assert.throws(
    () =>
      e.borrarMesa(datos({ groups: [grupo("g", { workspaceId: "t" })] }), "t"),
    vaciala,
  );
  assert.deepEqual(ids(e.borrarMesa(datos(), "t").workspaces), ["general"]);
});
test("estructura: borrar mesa lleva lo borrado a General", () => {
  const d = datos({
    items: [
      cosa("a", { workspaceId: "t", deletedAt: "2030-05-01T08:00:00.000Z" }),
    ],
  });
  const r = e.borrarMesa(d, "t");
  assert.equal(de(r, "a").workspaceId, "general");
  assert.doesNotThrow(() => readBackup(JSON.stringify(r)));
});
test("estructura: grupo dentro de grupo", () => {
  const sinId = (fields) => {
    const { id, ...g } = grupo("x", fields);
    return g;
  };
  const a = e.crearGrupo(
    datos(),
    sinId({ name: " Lanzamiento ", workspaceId: "t" }),
  );
  assert.equal(a.data.groups[0].name, "Lanzamiento");
  const b = e.crearGrupo(
    a.data,
    sinId({ name: "Diseño", workspaceId: "t", parentId: a.id }),
  );
  assert.deepEqual(
    ids(e.hijosDe(b.data, { workspaceId: "t", groupId: a.id }).grupos),
    [b.id],
  );
  assert.throws(
    () => e.crearGrupo(a.data, sinId({ name: "Fuera", parentId: a.id })),
    { message: "El grupo de arriba debe estar en la misma mesa." },
  );
});
test("estructura: editar grupo cambia nombre y repetición, no el lugar", () => {
  const d = datos({ groups: [grupo("a"), grupo("b", { parentId: "a" })] });
  const r = e.editarGrupo(d, {
    ...grupo("b", { name: " Mañanas ", workspaceId: "t", parentId: "" }),
    repeat: "diario",
    repeatStart: "2030-05-01",
  });
  const b = r.groups.find((g) => g.id === "b");
  assert.equal(b.name, "Mañanas");
  assert.equal(b.repeat, "diario");
  assert.equal(b.workspaceId, "general");
  assert.equal(b.parentId, "a");
  assert.throws(() => e.editarGrupo(d, grupo("b", { repeat: "diario" })), {
    message: "Indica desde qué día se repite.",
  });
});
test("estructura: borrar grupo sube hijos y cosas", () => {
  const d = datos({
    groups: [
      grupo("A"),
      grupo("B", { parentId: "A" }),
      grupo("C", { parentId: "B" }),
    ],
    items: [
      cosa("i1", { groupId: "A", x: 0 }),
      cosa("i2", { groupId: "B", x: 0 }),
      cosa("i3", { groupId: "B", x: 1, deletedAt: "2030-05-01T08:00:00.000Z" }),
      cosa("i4", { groupId: "C", x: 0 }),
    ],
  });
  const r = e.borrarGrupo(d, "B");
  assert.deepEqual(ids(r.groups), ["A", "C"]);
  assert.equal(r.groups.find((g) => g.id === "C").parentId, "A");
  assert.equal(r.items.length, 4);
  assert.deepEqual(
    e
      .hijosDe(r, { workspaceId: "general", groupId: "A" })
      .items.map((i) => [i.id, i.x, i.y]),
    [
      ["i1", 0, 0],
      ["i2", 1, 0],
    ],
  );
  assert.equal(de(r, "i3").groupId, "A");
  assert.equal(de(r, "i4").groupId, "C");
  assert.doesNotThrow(() => readBackup(JSON.stringify(r)));
});
test("estructura: mover grupo cambia la mesa de su subárbol", () => {
  const d = datos({
    groups: [grupo("A"), grupo("B", { parentId: "A" })],
    items: [cosa("i1", { groupId: "A" }), cosa("i2", { groupId: "B" })],
  });
  const r = e.moverGrupo(d, "A", { workspaceId: "t", parentId: "" });
  assert.deepEqual(
    r.groups.map((g) => [g.id, g.workspaceId, g.parentId]),
    [
      ["A", "t", ""],
      ["B", "t", "A"],
    ],
  );
  assert.deepEqual(
    r.items.map((i) => i.workspaceId),
    ["t", "t"],
  );
  assert.doesNotThrow(() => readBackup(JSON.stringify(r)));
  assert.throws(
    () => e.moverGrupo(d, "A", { workspaceId: "general", parentId: "B" }),
    {
      message: "Un grupo no puede quedar dentro de sí mismo.",
    },
  );
});
test("estructura: moverItems conserva dependencias entre mesas", () => {
  const d = datos({
    groups: [grupo("A")],
    items: [
      cosa("i1"),
      cosa("i2", { dependencies: ["i1"], x: 1 }),
      cosa("t1", { workspaceId: "t", x: 0 }),
    ],
  });
  const r = e.moverItems(d, ["i2"], { workspaceId: "t", groupId: "" });
  assert.deepEqual(
    [
      de(r, "i2").workspaceId,
      de(r, "i2").groupId,
      de(r, "i2").x,
      de(r, "i2").y,
    ],
    ["t", "", 1, 0],
  );
  assert.deepEqual(de(r, "i2").dependencies, ["i1"]);
  assert.throws(
    () => e.moverItems(d, ["i2"], { workspaceId: "t", groupId: "A" }),
    {
      message: "El grupo debe estar en la misma mesa.",
    },
  );
});
test("estructura: juntar exige una misma mesa", () => {
  const d = datos({
    groups: [grupo("A")],
    items: [
      cosa("a1", { groupId: "A", x: 0 }),
      cosa("a2", { groupId: "A", x: 1 }),
      cosa("s1"),
      cosa("t1", { workspaceId: "t" }),
    ],
  });
  assert.throws(() => e.juntarEnGrupo(d, ["s1", "t1"], "Mezcla"), {
    message: "Elige cosas de una misma mesa.",
  });
  const dentro = e.juntarEnGrupo(d, ["a2", "a1"], "Sub");
  assert.equal(
    dentro.data.groups.find((g) => g.id === dentro.id).parentId,
    "A",
  );
  assert.deepEqual(
    e
      .hijosDe(dentro.data, { workspaceId: "general", groupId: dentro.id })
      .items.map((i) => [i.id, i.x]),
    [
      ["a2", 0],
      ["a1", 1],
    ],
  );
  const suelto = e.juntarEnGrupo(d, ["a1", "s1"], "Rutina", {
    repeat: "diario",
    repeatDays: [],
    repeatStart: "2030-05-01",
  });
  const g = suelto.data.groups.find((x) => x.id === suelto.id);
  assert.deepEqual([g.parentId, g.repeat], ["", "diario"]);
});
test("estructura: sacar sube al padre", () => {
  const d = datos({
    groups: [grupo("A"), grupo("B", { parentId: "A" })],
    items: [
      cosa("b1", { groupId: "B" }),
      cosa("a1", { groupId: "A" }),
      cosa("s1"),
    ],
  });
  const r = e.sacarDeGrupo(d, ["b1", "a1", "s1"]);
  assert.deepEqual(
    ["b1", "a1", "s1"].map((id) => de(r, id).groupId),
    ["A", "", ""],
  );
});
test("estructura: reordenar renumera x", () => {
  const d = datos({
    items: [
      cosa("a", { x: 5 }),
      cosa("b", { x: 9 }),
      cosa("c", { x: 12 }),
      cosa("t1", { workspaceId: "t", x: 7 }),
    ],
  });
  const orden = (r) =>
    e
      .hijosDe(r, { workspaceId: "general", groupId: "" })
      .items.map((i) => [i.id, i.x, i.y]);
  assert.deepEqual(orden(e.reordenar(d, "c", 0)), [
    ["c", 0, 0],
    ["a", 1, 0],
    ["b", 2, 0],
  ]);
  assert.deepEqual(orden(e.reordenar(d, "a", 99)), [
    ["b", 0, 0],
    ["c", 1, 0],
    ["a", 2, 0],
  ]);
  assert.equal(de(e.reordenar(d, "c", 0), "t1").x, 7);
});
test("estructura: hijosDe ordena grupos por nombre", () => {
  const d = datos({
    groups: [grupo("z", { name: "Zeta" }), grupo("b", { name: "Álgebra" })],
  });
  assert.deepEqual(
    ids(e.hijosDe(d, { workspaceId: "general", groupId: "" }).grupos),
    ["b", "z"],
  );
});
