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
