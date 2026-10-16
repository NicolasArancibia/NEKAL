const { test } = require("node:test");
const assert = require("node:assert/strict");
const { syncBannerFor: f } = require("../.test-build/syncBanner.js");
const ok = {
  error: "",
  hasConflict: false,
  cloudStatus: "Sincronizado automáticamente",
  pendingChanges: 0,
};
test("aviso: sin problemas no se muestra", () => {
  for (const cloudStatus of [
    "Sincronizado automáticamente",
    "Modo local",
    "Guardando cambios…",
    "Sincronizando…",
    "Conectando con Firebase…",
  ])
    assert.equal(f({ ...ok, cloudStatus }), null);
});
test("aviso: error de guardado", () =>
  assert.deepEqual(f({ ...ok, error: "x" }), {
    tone: "danger",
    text: "No se pudo guardar.",
    action: { label: "Reintentar", target: "retry" },
  }));
test("aviso: conflicto", () =>
  assert.deepEqual(f({ ...ok, hasConflict: true }), {
    tone: "danger",
    text: "Hay cambios en conflicto.",
    action: { label: "Revisar", target: "perfil" },
  }));
test("aviso: el error gana al conflicto", () =>
  assert.equal(
    f({ ...ok, error: "x", hasConflict: true }).text,
    "No se pudo guardar.",
  ));
test("aviso: sin conexión con cambios", () => {
  const off =
    "Sin conexión o sincronización pendiente · cambios conservados en este dispositivo";
  assert.deepEqual(f({ ...ok, cloudStatus: off, pendingChanges: 3 }), {
    tone: "neutral",
    text: "Sin conexión · 3 cambios guardados en este dispositivo",
  });
  assert.equal(
    f({ ...ok, cloudStatus: off, pendingChanges: 1 }).text,
    "Sin conexión · 1 cambio guardado en este dispositivo",
  );
  assert.equal(
    f({ ...ok, cloudStatus: off, pendingChanges: 0 }).text,
    "Sin conexión",
  );
});
test("aviso: cambios sin guardar", () =>
  assert.deepEqual(f({ ...ok, cloudStatus: "Cambios sin guardar" }), {
    tone: "danger",
    text: "Cambios sin guardar. Exporta un respaldo.",
    action: { label: "Ajustes", target: "ajustes" },
  }));
