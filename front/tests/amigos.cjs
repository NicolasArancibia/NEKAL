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

const ami = require("../.test-build/amigos/amistades.js");
const ej = require("../.test-build/amigos/ejemplo.js");
const amistad = (otro, nombre, { mia = false, estado = "pendiente" } = {}) => ({
  id: ami.idPar("yo", otro),
  de: mia ? "yo" : otro,
  para: mia ? otro : "yo",
  estado,
  nombreDe: mia ? "Sofía Rojas" : nombre,
  nombrePara: mia ? nombre : "Sofía Rojas",
  codigo: "7KQ2PX",
});

test("amigos: id de pareja", () => {
  assert.equal(ami.idPar("b", "a"), "a_b");
  assert.equal(ami.idPar("a", "b"), "a_b");
});

test("amigos: listas", () => {
  const todas = [
    amistad("u-bruno", "Bruno"),
    amistad("u-angela", "Ángela"),
    amistad("u-diego", "Diego", { mia: true }),
    amistad("u-tomas", "Tomás", { estado: "aceptada" }),
    amistad("u-javiera", "Javiera", { mia: true, estado: "aceptada" }),
  ];
  const l = ami.listas(todas, "yo");
  const nombres = (xs) => xs.map((a) => ami.otroDe(a, "yo").nombre);
  assert.deepEqual(nombres(l.recibidas), ["Ángela", "Bruno"]);
  assert.deepEqual(nombres(l.enviadas), ["Diego"]);
  assert.deepEqual(nombres(l.amigos), ["Javiera", "Tomás"]);
});

test("amigos: revisar envío", () => {
  const todas = [
    amistad("u-tomas", "Tomás", { estado: "aceptada" }),
    amistad("u-diego", "Diego", { mia: true }),
    amistad("u-camila", "Camila"),
  ];
  const revisar = (uid) => ami.revisarEnvio({ uid, nombre: "X" }, "yo", todas);
  assert.deepEqual(revisar("yo"), { tipo: "propio" });
  assert.deepEqual(revisar("u-tomas"), { tipo: "ya-amigos" });
  assert.deepEqual(revisar("u-diego"), { tipo: "ya-enviada" });
  assert.deepEqual(revisar("u-camila"), {
    tipo: "te-envio",
    id: ami.idPar("yo", "u-camila"),
  });
  assert.deepEqual(revisar("u-nueva"), { tipo: "ok" });
  assert.equal(ami.AVISOS["te-envio"], "Esa persona ya te envió una solicitud.");
  assert.equal(ami.AVISOS["sin-conexion"], "Sin conexión. Revisa tu internet y reintenta.");
});

test("amigos: filas de amigos", () => {
  const amigos = [
    amistad("u-tomas", "Tomás Reyes", { estado: "aceptada" }),
    amistad("u-javiera", "Javiera", { mia: true, estado: "aceptada" }),
  ];
  const javiera = {
    ...tar.tarjetaDe(conPerfil(), now, 0, "ABCDEF"),
    nombre: "Javiera Muñoz",
    nivel: 11,
    logros: ["racha-3", "racha-7"],
  };
  const filas = ami.filasAmigos(amigos, "yo", { "u-javiera": javiera, "u-tomas": null });
  assert.deepEqual(
    filas.map((f) => [f.nombre, f.nivel, f.logros]),
    [
      ["Javiera Muñoz", 11, 2],
      ["Tomás Reyes", null, null],
    ],
  );
  assert.equal(filas[1].tarjeta, null);
});

test("amigos: datos de ejemplo", () => {
  const e = ej.amigosDeEjemplo();
  const l = ami.listas(e.amistades, ej.YO_EJEMPLO);
  assert.equal(l.recibidas.length, 1);
  assert.equal(l.enviadas.length, 1);
  assert.equal(l.amigos.length, 3);
  const filas = ami.filasAmigos(l.amigos, ej.YO_EJEMPLO, e.tarjetas);
  assert.deepEqual(
    filas.map((f) => [f.nombre, f.nivel]),
    [
      ["Javiera Muñoz", 11],
      ["Martín Pérez", 6],
      ["Tomás Reyes", null],
    ],
  );
  assert.equal(filas[0].logros, 17);
  assert.equal(e.codigo, "7KQ2PX");
});
