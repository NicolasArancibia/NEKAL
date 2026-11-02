const { test } = require("node:test");
const assert = require("node:assert/strict");
const m = require("../.test-build/model.js");
const esp = require("../.test-build/espacio.js");

// Fase H2 (vistas): la regla de «atrasada» y lo que depende de ella.
// Lunes 2 de noviembre de 2026, 10:10.
const now = new Date(2026, 10, 2, 10, 10).getTime();
const dia = (n, h = 9, mi = 0) =>
  new Date(2026, 10, 2 + n, h, mi).toISOString();
const viejo = "2026-09-01T00:00:00.000Z";
const cosa = (id, fields = {}) => ({
  ...m.newItem(),
  id,
  title: id,
  startDate: "2026-09-01",
  createdAt: viejo,
  updatedAt: viejo,
  ...fields,
});
const con = (...items) => ({ ...m.emptyData(), items });

test("estaAtrasada: hace 2 días no, hace 3 sí", () => {
  assert.equal(esp.ATRASO_DIAS, 2);
  assert.equal(
    esp.estaAtrasada(cosa("a", { scheduledAt: dia(-2) }), now),
    false,
  );
  assert.equal(
    esp.estaAtrasada(cosa("b", { scheduledAt: dia(-3) }), now),
    true,
  );
  assert.equal(
    esp.estaAtrasada(cosa("c", { scheduledAt: dia(-1) }), now),
    false,
  );
});
test("estaAtrasada: sin fecha, completada o pasiva nunca", () => {
  assert.equal(esp.estaAtrasada(cosa("a"), now), false);
  assert.equal(
    esp.estaAtrasada(
      cosa("b", { scheduledAt: dia(-9), status: "completado" }),
      now,
    ),
    false,
  );
  assert.equal(
    esp.estaAtrasada(cosa("c", { type: "Nota", scheduledAt: dia(-9) }), now),
    false,
  );
  assert.equal(
    esp.estaAtrasada(cosa("d", { type: "Idea", dueAt: dia(-9) }), now),
    false,
  );
});
test("estaAtrasada: fecha futura con inicio viejo no es atrasada", () => {
  const i = cosa("a", { startDate: "2026-09-01", scheduledAt: dia(3) });
  assert.equal(esp.estaAtrasada(i, now), false);
});
test("estaAtrasada: usa scheduledAt antes que dueAt", () => {
  assert.equal(
    esp.estaAtrasada(cosa("a", { scheduledAt: dia(1), dueAt: dia(-9) }), now),
    false,
  );
  assert.equal(esp.estaAtrasada(cosa("b", { dueAt: dia(-5) }), now), true);
});
test("atrasadas: solo las atrasadas, la más reciente primero", () => {
  const d = con(
    cosa("vieja", { scheduledAt: dia(-20) }),
    cosa("reciente", { scheduledAt: dia(-4) }),
    cosa("hoy", { scheduledAt: dia(0) }),
    cosa("hecha", { scheduledAt: dia(-9), status: "completado" }),
    cosa("sinFecha"),
  );
  assert.deepEqual(
    esp.atrasadas(d, now).map((i) => i.id),
    ["reciente", "vieja"],
  );
});
test("atrasadas: lo que está en una rutina (modelo) no cuenta", () => {
  const grupo = {
    ...m.newGroup("Rutina", "general"),
    id: "r",
    repeat: "diario",
  };
  const d = {
    ...con(cosa("modelo", { scheduledAt: dia(-20), groupId: "r" })),
    groups: [grupo],
  };
  assert.deepEqual(esp.atrasadas(d, now), []);
});
test("esImportante: urgente, con fecha límite o Deadline", () => {
  assert.equal(esp.esImportante(cosa("a", { priority: "urgente" })), true);
  assert.equal(esp.esImportante(cosa("b", { dueAt: dia(-5) })), true);
  assert.equal(esp.esImportante(cosa("c", { type: "Deadline" })), true);
  assert.equal(esp.esImportante(cosa("d", { priority: "media" })), false);
  assert.equal(esp.esImportante(cosa("e", { priority: "baja" })), false);
});

// Tarea 2: la regla en círculo, choques, rutinas y Neka.
const tiempo = require("../.test-build/acomodo/tiempo.js");
const plan = require("../.test-build/planner.js");
const rut = require("../.test-build/rutinas.js");
const neka = require("../.test-build/neka.js");
const ctx = require("../.test-build/agente/contexto.js");

test("acomodoTiempo: no dibuja atrasadas", () => {
  const d = con(
    cosa("h1", { scheduledAt: dia(0, 11) }),
    cosa("h2", { scheduledAt: dia(0, 12) }),
    cosa("h3", { scheduledAt: dia(0, 13) }),
    cosa("ayer", { scheduledAt: dia(-1) }),
    ...[3, 5, 10, 20, 30].map((n) => cosa("v" + n, { scheduledAt: dia(-n) })),
  );
  const ids = tiempo.acomodoTiempo(d, "semana", now, 300).nodos.map((x) => x.id);
  assert.deepEqual(ids.sort(), ["ayer", "h1", "h2", "h3"]);
});
test("findConflicts: ignora lo atrasado y sigue marcando lo de ayer", () => {
  const vieja = con(cosa("a", { dueAt: dia(-5) }));
  assert.deepEqual(plan.findConflicts(vieja, now), []);
  const ayer = con(cosa("b", { dueAt: dia(-1) }));
  assert.equal(plan.findConflicts(ayer, now).length, 1);
});
test("ocurrencias: lo más viejo que 2 días pasa a anteriores aunque tenga pendientes", () => {
  const rutina = {
    ...m.newGroup("Rutina", "general", { repeat: "diario", repeatStart: "2026-10-01" }),
    id: "r",
  };
  const oc = (d) => ({ ...m.newGroup("Día " + d, "general", { parentId: "r" }), id: `r~${d}` });
  const d = {
    ...con(
      cosa("vieja", { groupId: "r~2026-10-28", scheduledAt: dia(-5) }),
      cosa("hace2", { groupId: "r~2026-10-31", scheduledAt: dia(-2) }),
      cosa("ayer", { groupId: "r~2026-11-01", scheduledAt: dia(-1) }),
    ),
    groups: [rutina, oc("2026-10-28"), oc("2026-10-31"), oc("2026-11-01")],
  };
  const o = rut.ocurrencias(d, "r", now);
  assert.deepEqual(o.anteriores.map((g) => g.id), ["r~2026-10-28"]);
  assert.deepEqual(o.actuales.map((g) => g.id), ["r~2026-10-31", "r~2026-11-01"]);
  const v = rut.sinAnteriores(d, now);
  assert.deepEqual(v.groups.map((g) => g.id).sort(), ["r", "r~2026-10-31", "r~2026-11-01"]);
  assert.ok(!v.items.some((i) => i.id === "vieja"));
});
test("nekaState: lo atrasado no cuenta como vencido", () => {
  const viejas = Array.from({ length: 10 }, (_, k) => cosa("v" + k, { dueAt: dia(-20) }));
  assert.notEqual(neka.nekaState(con(...viejas), now).kind, "vencido");
  const conAyer = con(...viejas, cosa("ayer", { dueAt: dia(-1) }));
  assert.equal(neka.nekaState(conAyer, now).kind, "vencido");
});
test("contexto: cuenta las importantes atrasadas y no lista las atrasadas", () => {
  const d = con(
    cosa("urg", { scheduledAt: dia(-6), priority: "urgente" }),
    cosa("ent", { dueAt: dia(-4) }),
    cosa("comun", { scheduledAt: dia(-8) }),
    cosa("hoy", { scheduledAt: dia(0, 12) }),
  );
  const c = ctx.contexto(d, now);
  assert.match(c, /Atrasadas importantes: 2\./);
  assert.ok(!c.includes("[urg]") && !c.includes("[comun]"));
  assert.ok(c.includes("[hoy]"));
  const sin = ctx.contexto(con(cosa("hoy", { scheduledAt: dia(0, 12) })), now);
  assert.doesNotMatch(sin, /Atrasadas importantes/);
});

// Tarea 3: burbujas «+N» del círculo.
const nodo = (id, ws, anillo, x, y) => ({ id, workspaceId: ws, x, y, estado: "on", anillo });
const fila = (ws, anillo, n, desde = 0) =>
  Array.from({ length: n }, (_, k) => nodo(`${ws}${anillo}${desde + k}`, ws, anillo, 10 * (k + 1), 20 * (k + 1)));

test("agruparNodos: hasta 6 por sector y anillo no se agrupan", () => {
  const r = tiempo.agruparNodos(fila("u", "hoy", 6));
  assert.equal(r.puntos.length, 6);
  assert.deepEqual(r.burbujas, []);
});
test("agruparNodos: con 7 quedan 3 puntos y una burbuja con 4", () => {
  const nodos = fila("u", "hoy", 7);
  const r = tiempo.agruparNodos(nodos);
  assert.equal(r.puntos.length, 3);
  assert.equal(r.burbujas.length, 1);
  assert.equal(r.burbujas[0].ids.length, 4);
  assert.equal(r.burbujas[0].workspaceId, "u");
  assert.equal(r.burbujas[0].anillo, "hoy");
});
test("agruparNodos: no se pierde ningún punto", () => {
  const nodos = [...fila("u", "hoy", 9), ...fila("t", "ventana", 3), ...fila("u", "manana", 12)];
  const r = tiempo.agruparNodos(nodos);
  const ids = [...r.puntos.map((n) => n.id), ...r.burbujas.flatMap((b) => b.ids)];
  assert.deepEqual(ids.sort(), nodos.map((n) => n.id).sort());
});
test("agruparNodos: la burbuja queda en el centro de lo que agrupa", () => {
  const nodos = fila("u", "hoy", 7); // x = 10..70, y = 20..140
  const b = tiempo.agruparNodos(nodos).burbujas[0]; // agrupa los últimos 4: x 40..70, y 80..140
  assert.equal(b.x, 55);
  assert.equal(b.y, 110);
});
test("agruparNodos: sectores y anillos distintos no se mezclan", () => {
  const nodos = [...fila("u", "hoy", 4), ...fila("t", "hoy", 4), ...fila("u", "ventana", 4)];
  assert.deepEqual(tiempo.agruparNodos(nodos).burbujas, []);
});
test("agruparNodos: el máximo se puede cambiar", () => {
  assert.equal(tiempo.agruparNodos(fila("u", "hoy", 7), 10).burbujas.length, 0);
  assert.equal(tiempo.agruparNodos(fila("u", "hoy", 7), 4).burbujas.length, 1);
});
