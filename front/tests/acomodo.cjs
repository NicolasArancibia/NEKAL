const { test } = require("node:test");
const assert = require("node:assert/strict");
const pr = require("../.test-build/acomodo/proyeccion.js");

const pick = (p) => ({
  x: Math.round(p.x * 1e9) / 1e9,
  y: Math.round(p.y * 1e9) / 1e9,
});
const c = { giro: 0, inclinacion: 0.95, zoom: 1, cx: 150, cy: 200 };

test("proyección: el origen cae en el centro", () =>
  assert.deepEqual(pick(pr.proyectar({ x: 0, y: 0, z: 0 }, c)), {
    x: 150,
    y: 200,
  }));
test("proyección: subir en z sube en pantalla", () =>
  assert.ok(pr.proyectar({ x: 0, y: 0, z: 10 }, c).y < 200));
test("proyección: girar 90° lleva x a y", () => {
  const g = pr.proyectar({ x: 10, y: 0, z: 0 }, { ...c, giro: Math.PI / 2 });
  assert.ok(Math.abs(g.x - 150) < 1e-9);
  assert.ok(g.y > 200);
});
test("proyección: más cerca = mayor profundidad", () => {
  const lejos = pr.proyectar({ x: 0, y: -50, z: 0 }, c);
  const cerca = pr.proyectar({ x: 0, y: 50, z: 0 }, c);
  assert.ok(cerca.profundidad > lejos.profundidad);
  const alto = pr.proyectar({ x: 0, y: 0, z: 20 }, c);
  assert.ok(
    alto.profundidad > pr.proyectar({ x: 0, y: 0, z: 0 }, c).profundidad,
  );
});
test("ordenarPorProfundidad: de lejos a cerca", () =>
  assert.deepEqual(
    pr
      .ordenarPorProfundidad([
        { id: "b", profundidad: 5 },
        { id: "a", profundidad: -3 },
        { id: "c", profundidad: 9 },
      ])
      .map((p) => p.id),
    ["a", "b", "c"],
  ));

const co = require("../.test-build/colores.js");
test("colores: tonos de un violeta", () => {
  const t = co.tonos("#7546EC");
  assert.equal(t.base, "#7546ec");
  // 88 % de blanco: 0x75 + (255 − 0x75) · 0.88 = 238.4 → ee
  assert.equal(t.suave, "#eee9fd");
  assert.equal(t.bordeOscuro, "#5835b1");
  assert.equal(t.bordeClaro, "#9874f1");
  assert.match(t.zona, /^#[0-9a-f]{6}$/);
  assert.match(t.zonaInterna, /^#[0-9a-f]{6}$/);
});
test("colores: acepta #abc y rechaza basura", () => {
  assert.equal(co.tonos("#fff").base, "#ffffff");
  assert.throws(() => co.tonos("violeta"));
});

// ---- Tiempo ----
const m = require("../.test-build/model.js");
const ti = require("../.test-build/acomodo/tiempo.js");
const ahora = new Date(2030, 4, 3, 10, 0).getTime(); // vie 3 may 2030
const en = (dia, h = 10) => new Date(2030, 4, dia, h, 0).toISOString();
const cosa = (fields = {}) => ({
  ...m.newItem(),
  title: "Cosa",
  startDate: "2030-04-01",
  ...fields,
});
const conMesas = (items) => ({
  ...m.emptyData(),
  workspaces: [
    ...m.emptyData().workspaces,
    { id: "t", name: "Trabajo", color: "#3366ff" },
    { id: "a", name: "Arte", color: "#ff6633" },
  ],
  items,
});
const radio = (n, lado) => Math.hypot(n.x - lado / 2, n.y - lado / 2);

test("tiempo: hoy en el anillo de hoy", () => {
  const d = conMesas([
    cosa({ id: "hoy", scheduledAt: en(3, 18) }),
    cosa({ id: "atrasada", dueAt: en(1) }),
    cosa({ id: "manana", dueAt: en(4) }),
    cosa({ id: "lejos", dueAt: en(20) }),
  ]);
  const r = ti.acomodoTiempo(d, "semana", ahora, 300);
  const n = Object.fromEntries(r.nodos.map((x) => [x.id, x]));
  assert.deepEqual(Object.keys(n).sort(), ["atrasada", "hoy", "manana"]);
  assert.equal(n.hoy.anillo, "hoy");
  assert.equal(n.atrasada.anillo, "hoy");
  assert.equal(n.manana.anillo, "manana");
  assert.ok(Math.abs(radio(n.hoy, 300) - r.radios.hoy) < 1e-6);
  assert.ok(Math.abs(radio(n.manana, 300) - r.radios.manana) < 1e-6);
  assert.equal(n.hoy.estado, "hoy");
});
test("tiempo: notas e ideas no aparecen", () => {
  const d = conMesas([
    cosa({ id: "n", type: "Nota" }),
    cosa({ id: "i", type: "Idea" }),
    cosa({ id: "s" }),
  ]);
  const r = ti.acomodoTiempo(d, "semana", ahora, 300);
  assert.deepEqual(r.nodos.map((x) => [x.id, x.anillo]), [["s", "sinFecha"]]);
});
test("tiempo: todo reparte hasta 30 días y lo posterior va al borde", () => {
  const d = conMesas([
    cosa({ id: "d2", dueAt: en(5) }),
    cosa({ id: "d30", dueAt: new Date(2030, 5, 2, 10).toISOString() }),
    cosa({ id: "d90", dueAt: new Date(2030, 7, 1, 10).toISOString() }),
  ]);
  const r = ti.acomodoTiempo(d, "todo", ahora, 300);
  const n = Object.fromEntries(r.nodos.map((x) => [x.id, radio(x, 300)]));
  assert.ok(Math.abs(n.d2 - r.radios.ventanaDesde) < 1e-6);
  assert.ok(Math.abs(n.d30 - r.radios.ventanaHasta) < 1e-6);
  assert.ok(Math.abs(n.d90 - r.radios.ventanaHasta) < 1e-6);
});
test("tiempo: sector de cada mesa con mínimo 30°", () => {
  const d = conMesas([
    ...Array.from({ length: 10 }, () => cosa({ dueAt: en(3) })),
    cosa({ workspaceId: "a", dueAt: en(3) }),
  ]);
  const s = ti.sectores(d);
  assert.deepEqual(s.map((x) => x.workspaceId), ["general", "a", "t"]);
  assert.equal(s[0].desde, 0);
  assert.equal(s.at(-1).hasta, 360);
  for (let k = 1; k < s.length; k++) assert.equal(s[k].desde, s[k - 1].hasta);
  for (const x of s) assert.ok(x.hasta - x.desde >= 30 - 1e-9);
  assert.ok(s[0].hasta - s[0].desde > s[1].hasta - s[1].desde);
});
test("tiempo: sin solapes en un mismo anillo", () => {
  const d = conMesas([
    ...Array.from({ length: 14 }, (_, k) => cosa({ id: `g${k}`, scheduledAt: en(3, 8 + (k % 10)) })),
    ...Array.from({ length: 6 }, (_, k) => cosa({ id: `t${k}`, workspaceId: "t", dueAt: en(3, 12) })),
    ...Array.from({ length: 9 }, (_, k) => cosa({ id: `v${k}`, dueAt: en(5 + (k % 4)) })),
  ]);
  const r = ti.acomodoTiempo(d, "semana", ahora, 375);
  for (const anillo of ["hoy", "ventana"]) {
    const ns = r.nodos.filter((x) => x.anillo === anillo);
    for (let a = 0; a < ns.length; a++)
      for (let b = a + 1; b < ns.length; b++)
        assert.ok(
          Math.hypot(ns[a].x - ns[b].x, ns[a].y - ns[b].y) >= 14 - 1e-6,
          `${ns[a].id} y ${ns[b].id} se tocan`,
        );
  }
  assert.equal(r.nodos.length, 29);
});
test("tiempo: diaDesdeRadio encaja por día", () => {
  const rs = ti.radiosPara(300);
  assert.deepEqual(
    [rs.centro, rs.hoy, rs.manana, rs.ventanaDesde, rs.ventanaHasta, rs.sinFecha].map((x) => Math.round(x * 10) / 10),
    [21, 42, 72, 90, 120, 141],
  );
  const dia = (r, v = "semana") => ti.diaDesdeRadio(r, rs, v, ahora);
  assert.equal(dia(5), "2030-05-03");
  assert.equal(dia(42), "2030-05-03");
  assert.equal(dia(72), "2030-05-04");
  assert.equal(dia(90), "2030-05-05");
  assert.equal(dia(105), "2030-05-07");
  assert.equal(dia(120), "2030-05-09");
  assert.equal(dia(120, "2semanas"), "2030-05-16");
  assert.equal(dia(141), "");
});
test("tiempo: cuenta vacía", () => {
  const r = ti.acomodoTiempo(m.emptyData(), "semana", ahora, 300);
  assert.deepEqual(r.nodos, []);
  assert.deepEqual(r.sectores, [{ workspaceId: "general", desde: 0, hasta: 360 }]);
});
