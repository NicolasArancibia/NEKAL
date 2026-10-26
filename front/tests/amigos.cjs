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
