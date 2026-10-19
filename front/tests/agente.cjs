const { test } = require("node:test");
const assert = require("node:assert/strict");
const m = require("../.test-build/model.js");
const pl = require("../.test-build/agente/plan.js");

// Lunes 6 de mayo de 2030, 9:00.
const now = new Date(2030, 4, 6, 9, 0).getTime();
const ti = (h, min = 0, dia = 6) =>
  new Date(2030, 4, dia, h, min).toISOString();
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
const datos = () => ({
  ...m.emptyData(),
  items: [
    cosa("gym", { scheduledAt: ti(9, 30), duration: 60 }),
    cosa("compra"),
  ],
});
const paso = (p, texto = "paso", toca = {}) => ({ ...p, texto, toca });
const mover = (id, h, min) =>
  paso(
    {
      tipo: "mover",
      id,
      scheduledAt: ti(h, min),
      dueAt: "",
      startDate: "2030-05-01",
    },
    `${id} → ${h}:${min}`,
    { [id]: viejo },
  );
const plan = (...pasos) => ({
  id: "p1",
  resumen: `${pasos.length} cambios`,
  pasos,
});
const de = (d, id) => d.items.find((i) => i.id === id);
const editada = (d, id) => ({
  ...d,
  items: d.items.map((i) =>
    i.id === id ? { ...i, title: "otra", updatedAt: ti(8) } : i,
  ),
});
const grupoNuevo = paso(
  {
    tipo: "crearGrupo",
    grupo: { ...m.newGroup("Tesis", "general"), id: "g1" },
  },
  "Nuevo grupo «Tesis»",
);
const meterCompra = paso(
  {
    tipo: "moverA",
    ids: ["compra"],
    destino: { workspaceId: "general", groupId: "g1" },
  },
  "Mover «compra» a «Tesis»",
  { compra: viejo },
);

test("plan: se prueba sobre una copia", () => {
  const d = datos(),
    antes = JSON.stringify(d);
  const r = pl.probar(d, [mover("gym", 9, 50)], [true], now);
  assert.deepEqual(r.errores, [null]);
  assert.equal(de(r.data, "gym").scheduledAt, ti(9, 50));
  assert.equal(JSON.stringify(d), antes);
});
test("plan: un paso inválido devuelve su error", () => {
  const p = plan(
    paso({
      tipo: "crear",
      item: cosa("ev", { type: "Evento", flexible: false }),
    }),
  );
  const r = pl.probar(datos(), p.pasos, [true], now);
  assert.equal(typeof r.errores[0], "string");
  assert.throws(() => pl.aceptar(datos(), p, [true], now), {
    message: r.errores[0],
  });
});
test("plan: cosa inexistente", () => {
  const r = pl.probar(
    datos(),
    [paso({ tipo: "completar", id: "fantasma" })],
    [true],
    now,
  );
  assert.deepEqual(r.errores, ["Esa cosa ya no existe."]);
});
test("plan: desmarcar deja esa cosa igual", () => {
  const r = pl.probar(datos(), [mover("gym", 9, 50)], [false], now);
  assert.equal(de(r.data, "gym").scheduledAt, ti(9, 30));
});
test("plan: depende de un paso desmarcado", () => {
  const r = pl.probar(datos(), [grupoNuevo, meterCompra], [false, true], now);
  assert.deepEqual(r.errores, [
    null,
    "Depende de «Nuevo grupo «Tesis»», que desmarcaste.",
  ]);
  assert.equal(de(r.data, "compra").groupId, "");
});
test("plan: algo cambió", () => {
  assert.throws(
    () =>
      pl.aceptar(
        editada(datos(), "gym"),
        plan(mover("gym", 9, 50)),
        [true],
        now,
      ),
    {
      message: "Algo cambió, pídeselo de nuevo.",
    },
  );
});
test("plan: cambios en otras cosas no bloquean", () => {
  const d = pl.aceptar(
    editada(datos(), "compra"),
    plan(mover("gym", 9, 50)),
    [true],
    now,
  );
  assert.equal(de(d, "gym").scheduledAt, ti(9, 50));
});
test("plan: completar da los mismos puntos que a mano", () => {
  const d = datos();
  const aMano = m.saveItem(
    d,
    { ...de(d, "compra"), status: "completado" },
    now,
  );
  const conNeka = pl.aceptar(
    d,
    plan(
      paso({ tipo: "completar", id: "compra" }, "Completar", { compra: viejo }),
    ),
    [true],
    now,
  );
  assert.ok(m.totalPoints(aMano) > 0);
  assert.equal(m.totalPoints(conNeka), m.totalPoints(aMano));
  assert.equal(de(conNeka, "compra").status, "completado");
});
test("plan: borrar va a la papelera", () => {
  const d = pl.aceptar(
    datos(),
    plan(paso({ tipo: "borrar", id: "compra" }, "Borrar", { compra: viejo })),
    [true],
    now,
  );
  assert.ok(de(d, "compra").deletedAt);
});
test("plan: grupo nuevo y mover adentro", () => {
  const d = pl.aceptar(
    datos(),
    plan(grupoNuevo, meterCompra),
    [true, true],
    now,
  );
  assert.equal(de(d, "compra").groupId, "g1");
  assert.ok(d.groups.some((g) => g.id === "g1" && g.name === "Tesis"));
});
