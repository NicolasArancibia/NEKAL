const { test } = require("node:test");
const assert = require("node:assert/strict");
const cod = require("../.test-build/amigos/codigo.js");

test("amigos: normalizar código", () => {
  for (const t of ["neka-7kq2px", " 7KQ 2PX ", "NEKA7KQ2PX", "7kq-2px"])
    assert.equal(cod.normalizarCodigo(t), "7KQ2PX", t);
  for (const t of [
    "7KQ2P0",
    "7KQ2PO",
    "7KQ2PI",
    "7KQ2P1",
    "7KQ2PL",
    "7KQ2P",
    "7KQ2PXY",
    "",
  ])
    assert.equal(cod.normalizarCodigo(t), null, t);
});

test("amigos: código que empieza con NEKA", () => {
  assert.equal(cod.normalizarCodigo("NEKA7K"), "NEKA7K");
  assert.equal(cod.normalizarCodigo("neka-neka7k"), "NEKA7K");
});

test("amigos: código nuevo", () => {
  assert.equal(
    cod.nuevoCodigo(() => 0),
    "222222",
  );
  assert.equal(
    cod.nuevoCodigo(() => 0.9999),
    "ZZZZZZ",
  );
  for (let k = 0; k < 200; k++) {
    const c = cod.nuevoCodigo();
    assert.equal(cod.normalizarCodigo(c), c, c);
  }
});

test("amigos: mostrar código", () => {
  assert.equal(cod.mostrarCodigo("7KQ2PX"), "NEKA-7KQ2PX");
});

const m = require("../.test-build/model.js");
const tar = require("../.test-build/amigos/tarjeta.js");
const nube = require("../.test-build/estadosNube.js");
// Domingo 12 de mayo de 2030, 18:00 local (como tests/progreso.cjs).
const now = new Date(2030, 4, 12, 18, 0).getTime();
const conPerfil = (extra = {}) => ({
  ...m.emptyData(),
  profile: { name: "Sofía Rojas", roles: "Estudiante" },
  ...extra,
});

test("amigos: agrupar áreas", () => {
  assert.deepEqual(
    tar.agruparAreas([
      { area: "estudio", valor: 70 },
      { area: "estudio", valor: 61 },
      { area: "salud", valor: 85 },
      { area: "trabajo", valor: null },
    ]),
    { estudio: { valor: 66, mesas: 2 }, salud: { valor: 85, mesas: 1 } },
  );
});

test("amigos: áreas de una cuenta vacía", () => {
  assert.deepEqual(tar.areasDe(m.emptyData(), now), {});
});

test("amigos: áreas ordenadas", () => {
  assert.deepEqual(
    tar
      .areasOrdenadas({
        estudio: { valor: 66, mesas: 2 },
        salud: { valor: 85, mesas: 1 },
        trabajo: { valor: 78, mesas: 1 },
      })
      .map((a) => a.area),
    ["salud", "trabajo", "estudio"],
  );
  assert.deepEqual(
    tar
      .areasOrdenadas({
        social: { valor: 50, mesas: 1 },
        hogar: { valor: 50, mesas: 1 },
      })
      .map((a) => a.area),
    ["hogar", "social"],
  );
});

test("amigos: tarjeta de cuenta vacía", () => {
  assert.deepEqual(tar.tarjetaDe(conPerfil(), now, 0, "7KQ2PX"), {
    nombre: "Sofía Rojas",
    roles: "Estudiante",
    desde: m.localDay(new Date(now)),
    nivel: 1,
    puntos: 0,
    logros: [],
    areas: {},
    codigo: "7KQ2PX",
  });
});

test("amigos: tarjeta con logros recientes primero", () => {
  const at = (dia) => new Date(2030, 4, dia, 12).toISOString();
  const d = conPerfil({
    logros: [
      { id: "primera-mesa", at: at(1) },
      { id: "racha-3", at: at(10) },
    ],
  });
  assert.deepEqual(tar.tarjetaDe(d, now, 0, "7KQ2PX").logros, [
    "racha-3",
    "primera-mesa",
  ]);
});

test("amigos: misma tarjeta", () => {
  const t = tar.tarjetaDe(conPerfil(), now, 0, "7KQ2PX");
  const conAreas = (areas) => ({ ...t, areas });
  assert.equal(tar.mismaTarjeta(t, { ...t }), true);
  assert.equal(tar.mismaTarjeta(t, null), false);
  assert.equal(tar.mismaTarjeta(t, { ...t, logros: ["racha-3"] }), false);
  assert.equal(
    tar.mismaTarjeta(
      conAreas({ salud: { valor: 85, mesas: 1 }, estudio: { valor: 66, mesas: 2 } }),
      conAreas({ estudio: { valor: 66, mesas: 2 }, salud: { valor: 85, mesas: 1 } }),
    ),
    true,
  );
});

test("amigos: listo para publicar", () => {
  const ok = { conCuenta: true, base: true, estadoNube: "Sincronizado", nombre: "Sofía" };
  assert.equal(tar.listoParaPublicar(ok), true);
  assert.equal(tar.listoParaPublicar({ ...ok, base: false }), false);
  assert.equal(tar.listoParaPublicar({ ...ok, estadoNube: nube.CONECTANDO }), false);
  assert.equal(tar.listoParaPublicar({ ...ok, estadoNube: nube.SINCRONIZANDO }), false);
  assert.equal(tar.listoParaPublicar({ ...ok, conCuenta: false }), false);
  assert.equal(tar.listoParaPublicar({ ...ok, nombre: "  " }), false);
});
