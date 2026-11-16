const { test } = require("node:test");
const assert = require("node:assert/strict");
const m = require("../.test-build/model.js");
const p = require("../.test-build/planner.js");
const { readBackup } = require("../.test-build/storage.js");
const now = new Date("2030-05-01T08:00:00").getTime();
const iso = (s) => new Date(`2030-05-01T${s}:00`).toISOString();
const item = (fields = {}) => ({
  ...m.newItem(),
  title: "Test",
  startDate: "2030-05-01",
  ...fields,
});
test("fechas inválidas y año bisiesto", () => {
  assert.throws(() => m.parseDateInput("2030-02-30"));
  assert.throws(() => m.parseDateInput("2030-13-01"));
  assert.throws(() => m.parseDateInput("2030-01-01 25:00"));
  assert.ok(m.parseDateInput("2032-02-29"));
});
test("nota e idea nunca puntúan", () => {
  for (const type of ["Nota", "Idea"])
    assert.equal(m.pointsFor(item({ type }), []), 0);
});
test("visita exige ubicación", () => {
  assert.match(
    m.validateItem(
      item({ type: "Visita", scheduledAt: iso("10:00") }),
      m.emptyData(),
    ),
    /ubicación/,
  );
});
test("deadline exige fecha límite", () =>
  assert.match(
    m.validateItem(item({ type: "Deadline" }), m.emptyData()),
    /límite/,
  ));
test("evento exige horario", () =>
  assert.match(
    m.validateItem(item({ type: "Evento" }), m.emptyData()),
    /hora/,
  ));
test("duración inválida rechazada", () =>
  assert.match(
    m.validateItem(item({ duration: NaN }), m.emptyData()),
    /duración/,
  ));
test("dependencias circulares rechazadas", () => {
  const a = item({ id: "a", dependencies: ["b"] }),
    b = item({ id: "b" });
  const d = { ...m.emptyData(), items: [a, b] };
  assert.match(m.validateItem({ ...b, dependencies: ["a"] }, d), /ciclo/);
});
test("no completar antes de dependencia", () => {
  const a = item({ id: "a" }),
    b = item({ dependencies: ["a"], status: "completado" });
  assert.match(
    m.validateItem(b, { ...m.emptyData(), items: [a] }),
    /dependencias/,
  );
});
test("completar, reabrir y completar no duplica puntos", () => {
  const i = item({ status: "completado" });
  let d = m.saveItem(m.emptyData(), i, now);
  const points = m.totalPoints(d);
  d = m.saveItem(d, { ...i, status: "pendiente" }, now);
  d = m.saveItem(d, i, now);
  assert.equal(m.totalPoints(d), points);
  assert.ok(points > 0);
});
test("goal reparte puntos por hitos y conserva presupuesto", () => {
  const i = item({
    type: "Goal",
    steps: [
      { id: "1", title: "A", done: true },
      { id: "2", title: "B", done: false },
    ],
  });
  let d = m.saveItem(m.emptyData(), i, now);
  const initial = m.totalPoints(d),
    budget = d.rewards.find((r) => r.key.endsWith(":budget")).points;
  assert.ok(initial > 0);
  d = m.saveItem(d, { ...i, status: "completado" }, now);
  assert.equal(m.totalPoints(d), budget);
});
test("no se elimina un prerrequisito usado", () => {
  const a = item({ id: "a" }),
    b = item({ dependencies: ["a"] });
  assert.throws(() => m.deleteItem({ ...m.emptyData(), items: [a, b] }, "a"));
});
test("papelera conserva historial", () => {
  let d = m.saveItem(
    m.emptyData(),
    item({ id: "a", status: "completado" }),
    now,
  );
  const points = m.totalPoints(d);
  d = m.deleteItem(d, "a");
  assert.equal(m.activeItems(d).length, 0);
  assert.equal(m.totalPoints(d), points);
});
test("detecta superposición, permite extremos contiguos", () => {
  const a = item({ scheduledAt: iso("10:00"), duration: 60 }),
    b = item({ scheduledAt: iso("10:30") });
  assert.equal(
    p.findConflicts({ ...m.emptyData(), items: [a, b] }, now).length,
    1,
  );
  b.scheduledAt = iso("11:00");
  assert.equal(
    p.findConflicts({ ...m.emptyData(), items: [a, b] }, now).length,
    0,
  );
});
test("propone hueco respetando compromiso fijo", () => {
  const a = item({ id: "a", scheduledAt: iso("08:00"), duration: 60 }),
    b = item({
      id: "b",
      scheduledAt: iso("08:00"),
      duration: 90,
      flexible: false,
    });
  const d = { ...m.emptyData(), items: [a, b] };
  assert.equal(p.proposeSlot(d, "a", now).next, iso("09:30"));
  assert.equal(p.proposeSlot(d, "b", now), null);
});
test("no propone exceder plazo", () => {
  const a = item({ id: "a", duration: 60, dueAt: iso("08:30") });
  assert.equal(p.proposeSlot({ ...m.emptyData(), items: [a] }, "a", now), null);
});
test("dependencia sin horario impide propuesta", () => {
  const a = item({ id: "a" }),
    b = item({ id: "b", dependencies: ["a"] });
  assert.equal(
    p.proposeSlot({ ...m.emptyData(), items: [a, b] }, "b", now),
    null,
  );
});
test("propuesta obsoleta no se aplica", () => {
  const a = item({ id: "a" }),
    d = { ...m.emptyData(), items: [a] };
  assert.throws(
    () =>
      p.applyProposal(d, {
        itemId: "a",
        updatedAt: "old",
        next: iso("10:00"),
        previous: "",
        reason: "",
      }),
    /cambió/,
  );
});
test("rutinas duplican IDs y dependencias internas", () => {
  const a = item({
      id: "a",
      groupId: "g",
      status: "completado",
      scheduledAt: iso("10:00"),
    }),
    b = item({ id: "b", groupId: "g", dependencies: ["a"] });
  const d = {
    ...m.emptyData(),
    items: [a, b],
    groups: [{ id: "g", name: "Rutina", workspaceId: "general" }],
  };
  const copy = m.duplicateGroup(d, "g", "2030-05-02");
  assert.equal(copy.items.length, 4);
  assert.equal(copy.items[2].status, "pendiente");
  assert.equal(copy.items[3].dependencies[0], copy.items[2].id);
  assert.equal(m.localDay(new Date(copy.items[2].scheduledAt)), "2030-05-02");
});
test("respaldo válido hace roundtrip", () =>
  assert.deepEqual(readBackup(JSON.stringify(m.emptyData())), m.emptyData()));
test("respaldo incompatible no se importa", () =>
  assert.throws(() => readBackup('{"version":2}')));
test("todos los tipos persisten con sus campos", () => {
  let d = m.emptyData();
  for (const type of m.TYPES) {
    const i = item({
      type,
      scheduledAt: ["Evento", "Visita", "Meeting"].includes(type)
        ? iso("10:00")
        : "",
      location: type === "Visita" ? "Biblioteca" : "",
      dueAt: type === "Deadline" ? iso("18:00") : "",
      content: type === "Nota" ? "Texto largo" : "",
      category: type === "Idea" ? "Personal" : "",
      agenda: type === "Meeting" ? "Revisar proyecto" : "",
    });
    d = m.saveItem(d, i, now);
  }
  assert.equal(d.items.length, 8);
  assert.deepEqual(readBackup(JSON.stringify(d)), d);
});
test("reabrir prerrequisito completado con dependiente finalizado se rechaza", () => {
  const a = item({ id: "a", status: "completado" }),
    b = item({ id: "b", status: "completado", dependencies: ["a"] });
  assert.match(
    m.validateItem(
      { ...a, status: "pendiente" },
      { ...m.emptyData(), items: [a, b] },
    ),
    /Reabre primero/,
  );
});
test("restauración exige restaurar primero el prerrequisito", () => {
  const a = item({ id: "a", deletedAt: new Date(now).toISOString() }),
    b = item({
      id: "b",
      deletedAt: new Date(now).toISOString(),
      dependencies: ["a"],
    });
  let d = { ...m.emptyData(), items: [a, b] };
  assert.throws(() => m.restoreItem(d, "b"));
  d = m.restoreItem(d, "a");
  d = m.restoreItem(d, "b");
  assert.equal(m.activeItems(d).length, 2);
});
test("detecta falta de capacidad acumulada antes del plazo", () => {
  const a = item({ id: "a", duration: 60, dueAt: iso("09:30") }),
    b = item({ id: "b", duration: 60, dueAt: iso("09:30") });
  const c = p.findConflicts({ ...m.emptyData(), items: [a, b] }, now);
  assert.ok(c.some((x) => x.kind === "capacity"));
});
test("importar ciclos o fechas corruptas se rechaza", () => {
  const a = item({ id: "a", dependencies: ["b"] }),
    b = item({ id: "b", dependencies: ["a"] });
  assert.throws(() =>
    readBackup(JSON.stringify({ ...m.emptyData(), items: [a, b] })),
  );
  assert.throws(() =>
    readBackup(
      JSON.stringify({ ...m.emptyData(), items: [item({ dueAt: "invalid" })] }),
    ),
  );
});
test("bonus de dependencias tiene límite", () => {
  const a = item({ id: "a" }),
    all = Array.from({ length: 5 }, () => item({ dependencies: ["a"] }));
  assert.equal(m.pointsFor(a, all, now), 30);
});
test("evento opcional conserva dificultad manual", () => {
  const a = item({
    type: "Evento",
    scheduledAt: iso("10:00"),
    countsForScore: true,
    difficulty: 3,
    priority: "urgente",
  });
  assert.equal(m.pointsFor(a, [], now), 60);
});
test("clonar nodos automáticos mantiene el autoencuadre", () => {
  const d = {
    ...m.emptyData(),
    items: [item({ groupId: "g" })],
    groups: [{ id: "g", name: "g", workspaceId: "general" }],
  };
  const next = m.duplicateGroup(d, "g", "2030-05-02");
  assert.equal(next.items[1].x, 0);
  assert.equal(next.items[1].y, 0);
});

// ---- V2/B: datos v2 (grupos anidados y rutinas) ----
const v1 = (fields = {}) => ({ ...m.emptyData(), version: 1, ...fields });
const grupo = (fields = {}) => ({
  id: "g",
  name: "Grupo",
  workspaceId: "general",
  parentId: "",
  repeat: "",
  repeatDays: [],
  repeatStart: "",
  ...fields,
});
test("datos: emptyData es v2", () => assert.equal(m.emptyData().version, 2));
test("migración: v1 queda en v2 con grupos completos", () => {
  const d = readBackup(
    JSON.stringify(v1({ groups: [{ id: "g", name: "G", workspaceId: "general" }] })),
  );
  assert.equal(d.version, 2);
  assert.deepEqual(d.groups, [grupo({ name: "G" })]);
});
test("migración: x pasa a ser el orden", () => {
  const d = readBackup(
    JSON.stringify(
      v1({
        groups: [{ id: "g", name: "G", workspaceId: "general" }],
        items: [
          item({ id: "a", groupId: "g", x: 100, y: 300 }),
          item({ id: "b", groupId: "g", x: 400, y: 100 }),
          item({ id: "c", groupId: "g", x: 50, y: 100 }),
        ],
      }),
    ),
  );
  const x = Object.fromEntries(d.items.map((i) => [i.id, i.x]));
  assert.deepEqual(x, { a: 2, b: 1, c: 0 });
  assert.ok(d.items.every((i) => i.y === 0));
});
test("migración: no se pierde nada", () => {
  const items = [
    item({ id: "a", title: "Uno", x: 10, y: 10 }),
    item({ id: "b", title: "Dos", dependencies: ["a"], x: 20, y: 5 }),
  ];
  const d = readBackup(JSON.stringify(v1({ items })));
  assert.deepEqual(
    d.items.map((i) => [i.id, i.title, i.dependencies]),
    [
      ["a", "Uno", []],
      ["b", "Dos", ["a"]],
    ],
  );
});
test("readBackup acepta v1 y v2", () => {
  assert.equal(readBackup(JSON.stringify(v1())).version, 2);
  assert.equal(readBackup(JSON.stringify(m.emptyData())).version, 2);
});
test("readBackup rechaza repeat desconocido", () =>
  assert.throws(() =>
    readBackup(
      JSON.stringify({ ...m.emptyData(), groups: [grupo({ repeat: "mensual" })] }),
    ),
  ));
test("validateGroup: ciclo", () => {
  const a = grupo({ id: "a", parentId: "b" }),
    b = grupo({ id: "b", parentId: "a" });
  assert.equal(
    m.validateGroup(a, { ...m.emptyData(), groups: [a, b] }),
    "Un grupo no puede quedar dentro de sí mismo.",
  );
});
test("validateGroup: padre en otra mesa", () => {
  const p = grupo({ id: "p", workspaceId: "w2" }),
    g = grupo({ id: "g", parentId: "p" });
  const d = {
    ...m.emptyData(),
    workspaces: [
      ...m.emptyData().workspaces,
      { id: "w2", name: "Trabajo", color: "#7546EC" },
    ],
    groups: [p, g],
  };
  assert.equal(m.validateGroup(g, d), "El grupo de arriba debe estar en la misma mesa.");
});
test("validateGroup: días vacíos", () => {
  const g = grupo({ repeat: "dias", repeatStart: "2030-05-01", repeatDays: [] });
  assert.equal(
    m.validateGroup(g, { ...m.emptyData(), groups: [g] }),
    "Elige al menos un día.",
  );
  assert.equal(
    m.validateGroup(grupo({ repeat: "diario" }), m.emptyData()),
    "Indica desde qué día se repite.",
  );
});
test("migración: contenedor ya ordenado no cambia", () => {
  const items = [
    item({ id: "a", x: 1, y: 0 }),
    item({ id: "b", x: 0, y: 0 }),
  ];
  const d = readBackup(JSON.stringify({ ...m.emptyData(), items }));
  assert.deepEqual(
    d.items.map((i) => [i.id, i.x]),
    [
      ["a", 1],
      ["b", 0],
    ],
  );
});
// V2/D: mensajes con audio y plan (3 claves o las 6, como exigen las reglas).
const sm = require("../.test-build/syncModel.js");
const cr = require("../.test-build/cloudRecords.js");
const conMensajes = (messages) => ({ ...m.emptyData(), messages });
test("mensajes: audio y plan pasan readBackup", () => {
  const d = conMensajes([
    { id: "a", text: "hola", isUser: true },
    { id: "b", text: "voy atrasado", isUser: true, audio: true, plan: "", estado: "" },
    { id: "c", text: "", isUser: false, audio: false, plan: "2 cambios", estado: "pendiente" },
  ]);
  assert.deepEqual(readBackup(JSON.stringify(d)), d);
});
test("mensajes: estado desconocido se rechaza", () => {
  const d = conMensajes([
    { id: "c", text: "", isUser: false, audio: false, plan: "x", estado: "hecho" },
  ]);
  assert.throws(() => readBackup(JSON.stringify(d)), /Conversación inválida/);
});
test("mensajes: mitad de campos se rechaza", () => {
  const d = conMensajes([{ id: "c", text: "hola", isUser: true, audio: true }]);
  assert.throws(() => readBackup(JSON.stringify(d)), /Conversación inválida/);
});
test("sync: mensaje con plan va y vuelve", () => {
  const d = conMensajes([
    { id: "a", text: "hola", isUser: true },
    { id: "c", text: "", isUser: false, audio: false, plan: "2 cambios", estado: "aceptado" },
  ]);
  const vuelta = sm.dataOf(cr.fromCloud(cr.toCloud(sm.recordsOf(d))));
  assert.deepEqual(vuelta.messages, d.messages);
  assert.doesNotThrow(() => sm.validateRecords(sm.recordsOf(d)));
});
// V2/D: correr desde (voy atrasado) y buscar hueco. Lunes 6 de mayo de 2030.
const t = (h, min = 0, dia = 6) => new Date(2030, 4, dia, h, min).getTime();
const ti = (h, min = 0, dia = 6) => new Date(t(h, min, dia)).toISOString();
const cosa = (id, h, min, duration, fields = {}) => ({
  ...m.newItem(),
  id,
  title: id,
  startDate: "2030-05-01",
  scheduledAt: ti(h, min),
  duration,
  ...fields,
});
const manana = () => ({
  ...m.emptyData(),
  items: [
    cosa("gym", 9, 30, 60),
    cosa("est", 10, 30, 90),
    cosa("reu", 12, 30, 60, { type: "Meeting", flexible: false }),
    cosa("alm", 13, 30, 60),
  ],
});
const corridas = (lista) =>
  lista.map((c) => [c.itemId, new Date(c.despues).getHours() * 60 + new Date(c.despues).getMinutes(), c.noCabe]);
test("correrDesde: ejemplo de la spec", () => {
  const r = p.correrDesde(manana(), 20, t(9, 10));
  assert.deepEqual(corridas(r), [
    ["gym", 9 * 60 + 50, false],
    ["est", 10 * 60 + 50, false],
  ]);
  assert.equal(r[0].antes, ti(9, 30));
});
test("correrDesde: salta lo fijo", () => {
  assert.deepEqual(corridas(p.correrDesde(manana(), 80, t(9, 10))), [
    ["gym", 10 * 60 + 50, false],
    ["est", 13 * 60 + 30, false],
    ["alm", 15 * 60, false],
  ]);
});
test("correrDesde: lo que está en curso se corre", () => {
  const d = { ...m.emptyData(), items: [cosa("gym", 9, 0, 60)] };
  assert.deepEqual(corridas(p.correrDesde(d, 20, t(9, 10))), [["gym", 9 * 60 + 20, false]]);
});
test("correrDesde: no cabe hoy", () => {
  const d = { ...m.emptyData(), items: [cosa("tarde", 20, 0, 60)] };
  const [c] = p.correrDesde(d, 30, t(19, 0));
  assert.equal(c.noCabe, true);
  assert.equal(c.despues, c.antes);
});
test("correrDesde: nada cruza la medianoche", () => {
  const d = {
    ...m.emptyData(),
    preferences: { ...m.emptyData().preferences, dayEnd: 23 },
    items: [cosa("noche", 23, 0, 50)],
  };
  const [c] = p.correrDesde(d, 30, t(22, 50));
  assert.equal(c.noCabe, true);
  assert.equal(c.despues, ti(23, 0));
});
test("correrDesde: ignora completadas, pasivas y otros días", () => {
  const d = {
    ...m.emptyData(),
    items: [
      cosa("hecha", 10, 0, 30, { status: "completado" }),
      cosa("nota", 10, 0, 30, { type: "Nota" }),
      { ...cosa("otro", 10, 0, 30), scheduledAt: ti(10, 0, 7) },
    ],
  };
  assert.deepEqual(p.correrDesde(d, 20, t(9, 0)), []);
  assert.throws(() => p.correrDesde(d, 0, t(9, 0)), { message: "Indica cuántos minutos." });
});
test("buscarHueco: salta lo ocupado y respeta la jornada", () => {
  const d = { ...m.emptyData(), items: [cosa("ocupado", 9, 0, 60)] };
  assert.equal(p.buscarHueco(d, { duracion: 90, desde: t(8, 0) }, t(8, 0)), ti(10, 0));
  assert.equal(p.buscarHueco(d, { duracion: 90, desde: t(20, 0) }, t(8, 0)), ti(8, 0, 7));
  assert.equal(
    p.buscarHueco(d, { duracion: 60, desde: t(9, 0), ignorar: "ocupado" }, t(8, 0)),
    ti(9, 0),
  );
  assert.equal(p.buscarHueco(d, { duracion: 90, desde: t(8, 0), hasta: t(9, 0) }, t(8, 0)), null);
});

// ---------- V2/E: área de mesa y logros vistos en los datos ----------
const est = require("../.test-build/estructura.js");
const sync = require("../.test-build/syncModel.js");
const conMesas = (extra = {}) => ({
  ...m.emptyData(),
  workspaces: [
    ...m.emptyData().workspaces,
    // Ids en orden: dataOf rearma las mesas ordenadas por id.
    { id: "m1", name: "Universidad", color: "#2E9E6B" },
    { id: "m2", name: "Casa", color: "#948BA6", area: "hogar" },
  ],
  ...extra,
});
const vistoLogro = (id) => ({ id, at: "2030-05-01T12:00:00.000Z" });

test("datos: mesa con y sin área, ida y vuelta", () => {
  const d = conMesas();
  assert.deepEqual(readBackup(JSON.stringify(d)), d);
  assert.deepEqual(sync.dataOf(sync.recordsOf(d)), d);
});

test("datos: área inválida se rechaza", () => {
  const d = conMesas();
  d.workspaces[1] = { ...d.workspaces[1], area: "deporte" };
  assert.throws(() => readBackup(JSON.stringify(d)), /Espacio inválido/);
});

test("datos: logros vistos, ida y vuelta y respaldo", () => {
  const d = conMesas({ logros: [vistoLogro("primera-mesa")] });
  assert.deepEqual(readBackup(JSON.stringify(d)), d);
  const r = sync.recordsOf(d);
  assert.deepEqual(r["logros/primera-mesa"], vistoLogro("primera-mesa"));
  assert.deepEqual(sync.dataOf(r), d);
  assert.deepEqual(sync.validateRecords(r).logros, d.logros);
});

test("datos: logro desconocido, duplicado o más de 25 se rechaza", () => {
  const con = (logros) => JSON.stringify(conMesas({ logros }));
  assert.throws(() => readBackup(con([vistoLogro("inventado")])), /Logros inválidos/);
  assert.throws(
    () => readBackup(con([vistoLogro("racha-3"), vistoLogro("racha-3")])),
    /Logros inválidos/,
  );
  assert.throws(
    () => readBackup(con(Array.from({ length: 25 }, () => vistoLogro("racha-3")))),
    /Logros inválidos/,
  );
  assert.throws(
    () => readBackup(con([{ ...vistoLogro("racha-3"), extra: 1 }])),
    /Logros inválidos/,
  );
  assert.equal(readBackup(con(m.LOGRO_IDS.map(vistoLogro))).logros.length, 25);
  const largo = sync.recordsOf(conMesas({ logros: [vistoLogro("racha-3")] }));
  largo["logros/racha-3"] = { id: "racha-3", at: "x".repeat(41) };
  assert.throws(() => sync.validateRecords(largo));
});

test("datos: respaldo sin logros carga con []", () => {
  const { logros, ...viejo } = conMesas();
  assert.deepEqual(readBackup(JSON.stringify(viejo)).logros, []);
});

test("datos: crearMesa con área", () => {
  const con = est.crearMesa(m.emptyData(), "Casa", "#948BA6", "C", "hogar");
  assert.deepEqual(con.data.workspaces[1], {
    id: "C",
    name: "Casa",
    color: "#948BA6",
    area: "hogar",
  });
  const sin = est.crearMesa(m.emptyData(), "Casa", "#948BA6", "C");
  assert.deepEqual(Object.keys(sin.data.workspaces[1]), ["id", "name", "color"]);
});
test("respaldo sin conexiones", () => {
  const { conexiones, ...viejo } = m.emptyData();
  assert.deepEqual(readBackup(JSON.stringify(viejo)).conexiones, {
    cuentas: [],
    ofrecido: false,
    destinos: [],
  });
});
