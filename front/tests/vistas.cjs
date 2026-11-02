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

// Tarea 4: la agenda.
const ag = require("../.test-build/agenda.js");
const ids = (dias) => dias.map((x) => x.filas.map((f) => f.item.id));

test("agenda: días en orden y cosas por hora, sin días vacíos", () => {
  const d = con(
    cosa("tarde", { scheduledAt: dia(0, 17) }),
    cosa("temprano", { scheduledAt: dia(0, 11) }),
    cosa("pasado", { scheduledAt: dia(2, 9) }),
  );
  const r = ag.agenda(d, now);
  assert.deepEqual(r.map((x) => x.dia), ["2026-11-02", "2026-11-04"]);
  assert.deepEqual(ids(r), [["temprano", "tarde"], ["pasado"]]);
});
test("agenda: fin y minutos salen de la duración", () => {
  const d = con(cosa("a", { scheduledAt: dia(0, 11), duration: 45 }));
  const f = ag.agenda(d, now)[0].filas[0];
  assert.equal(f.minutos, 45);
  assert.equal(Date.parse(f.fin) - Date.parse(f.inicio), 45 * 60000);
});
test("agenda: lo superpuesto marca «choca» en las dos", () => {
  const d = con(
    cosa("a", { scheduledAt: dia(0, 11), duration: 60 }),
    cosa("b", { scheduledAt: dia(0, 11, 30), duration: 60 }),
    cosa("c", { scheduledAt: dia(0, 15), duration: 30 }),
  );
  const f = ag.agenda(d, now)[0].filas;
  assert.deepEqual(f.map((x) => x.choca), [true, true, false]);
});
test("agenda: lo atrasado no sale; lo de ayer y anteayer sí, si está pendiente", () => {
  const d = con(
    cosa("vieja", { scheduledAt: dia(-3) }),
    cosa("anteayer", { scheduledAt: dia(-2) }),
    cosa("ayer", { scheduledAt: dia(-1) }),
    cosa("ayerHecha", { scheduledAt: dia(-1), status: "completado" }),
    cosa("hoy", { scheduledAt: dia(0, 12) }),
  );
  assert.deepEqual(ids(ag.agenda(d, now)), [["anteayer"], ["ayer"], ["hoy"]]);
});
test("agenda: las hechas se ven solo hoy", () => {
  const d = con(
    cosa("hechaHoy", { scheduledAt: dia(0, 9), status: "completado" }),
    cosa("hechaManana", { scheduledAt: dia(1, 9), status: "completado" }),
  );
  const r = ag.agenda(d, now);
  assert.deepEqual(ids(r), [["hechaHoy"]]);
  assert.equal(r[0].filas[0].hecha, true);
  assert.equal(r[0].filas[0].choca, false);
});
test("agenda: ventana de 14 días, notas, sin hora y filtro por mesa", () => {
  const d = {
    ...con(
      cosa("d13", { scheduledAt: dia(13) }),
      cosa("d14", { scheduledAt: dia(14) }),
      cosa("nota", { type: "Nota", scheduledAt: dia(1) }),
      cosa("sinHora"),
      cosa("deU", { scheduledAt: dia(1), workspaceId: "u" }),
    ),
    workspaces: [...m.emptyData().workspaces, { id: "u", name: "Uni", color: "#2E9E6B" }],
  };
  assert.deepEqual(ids(ag.agenda(d, now)), [["deU"], ["d13"]]);
  assert.deepEqual(ids(ag.agenda(d, now, 14, "u")), [["deU"]]);
  assert.deepEqual(ids(ag.agenda(d, now, 30)), [["deU"], ["d13"], ["d14"]]);
});
test("agenda: sin cosas es una lista vacía", () => {
  assert.deepEqual(ag.agenda(con(), now), []);
});

// Tarea 7: preferencias del Espacio (solo queda el tiempo elegido).
const pe = require("../.test-build/prefsEspacio.js");

test("leerPrefs: ignora la vista guardada y conserva el tiempo", () => {
  assert.deepEqual(pe.leerPrefs('{"vista":"mesas","ventana":"2semanas"}'), {
    ventana: "2semanas",
  });
  assert.deepEqual(pe.leerPrefs('{"vista":"plano","ventana":"hoy"}'), {
    ventana: "hoy",
  });
});
test("leerPrefs: sin nada, con basura o con un tiempo desconocido es «semana»", () => {
  assert.deepEqual(pe.leerPrefs(null), { ventana: "semana" });
  assert.deepEqual(pe.leerPrefs("{no es json"), { ventana: "semana" });
  assert.deepEqual(pe.leerPrefs('{"ventana":"siempre"}'), { ventana: "semana" });
  assert.deepEqual(pe.leerPrefs("null"), { ventana: "semana" });
});

// Tarea 8: «A hoy» y «A la papelera».
const atr = require("../.test-build/atrasadas.js");
const fija = (id, h1, m1, h2, m2) =>
  cosa(id, {
    type: "Meeting",
    flexible: false,
    scheduledAt: dia(0, h1, m1),
    duration: (h2 - h1) * 60 + (m2 - m1),
  });

test("aHoy: la pasa al primer hueco libre de hoy y deja de ser atrasada", () => {
  const d = con(
    cosa("vieja", { scheduledAt: dia(-9), duration: 30 }),
    fija("reunion", 10, 15, 11, 0),
  );
  const r = atr.aHoy(d, "vieja", now);
  const i = r.items.find((x) => x.id === "vieja");
  assert.equal(esp.estaAtrasada(i, now), false);
  assert.equal(new Date(i.scheduledAt).getDate(), 2);
  assert.ok(Date.parse(i.scheduledAt) >= now);
  assert.ok(Date.parse(i.scheduledAt) >= new Date(2026, 10, 2, 11, 0).getTime());
});
test("aHoy: una con fecha límite vieja también sale de atrasadas", () => {
  const d = con(cosa("entrega", { dueAt: dia(-5), duration: 30 }));
  const i = atr.aHoy(d, "entrega", now).items[0];
  assert.equal(new Date(i.scheduledAt).getDate(), 2);
  assert.equal(esp.estaAtrasada(i, now), false);
});
test("aHoy: si hoy no cabe, lanza «Hoy no cabe.» y no cambia nada", () => {
  const d = con(
    cosa("vieja", { scheduledAt: dia(-9), duration: 60 }),
    fija("todoElDia", 10, 15, 21, 0),
  );
  assert.throws(() => atr.aHoy(d, "vieja", now), { message: "Hoy no cabe." });
  assert.equal(d.items[0].scheduledAt, dia(-9));
});
test("aHoy: una cosa que ya no existe lanza error", () => {
  assert.throws(() => atr.aHoy(con(), "fantasma", now), /ya no existe/);
});
test("aPapelera: manda las cosas a la papelera", () => {
  const d = con(cosa("a", { scheduledAt: dia(-9) }), cosa("b", { scheduledAt: dia(-8) }), cosa("c", { scheduledAt: dia(-7) }));
  const r = atr.aPapelera(d, ["a", "b", "c"]);
  assert.equal(r.omitidas, 0);
  assert.ok(r.data.items.every((i) => i.deletedAt));
});
test("aPapelera: actúa de a 200 y deja el resto", () => {
  assert.equal(atr.MAX_PAPELERA, 200);
  const todas = Array.from({ length: 250 }, (_, k) => cosa("x" + k, { scheduledAt: dia(-9) }));
  const r = atr.aPapelera(con(...todas), todas.map((i) => i.id));
  assert.equal(r.data.items.filter((i) => i.deletedAt).length, 200);
  assert.equal(r.omitidas, 0);
});
test("aPapelera: lo que otra cosa necesita se omite sin fallar", () => {
  const base = cosa("base", { scheduledAt: dia(-9) });
  const dependiente = cosa("dep", { scheduledAt: dia(1), dependencies: ["base"] });
  const r = atr.aPapelera(con(base, dependiente, cosa("suelta", { scheduledAt: dia(-9) })), ["base", "suelta"]);
  assert.equal(r.omitidas, 1);
  assert.ok(!r.data.items.find((i) => i.id === "base").deletedAt);
  assert.ok(r.data.items.find((i) => i.id === "suelta").deletedAt);
});
