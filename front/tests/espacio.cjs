const { test } = require("node:test");
const assert = require("node:assert/strict");
const m = require("../.test-build/model.js");
const e = require("../.test-build/espacio.js");
const now = new Date("2030-05-01T13:00:00").getTime();
const at = (day, hm = "10:00") => new Date(`${day}T${hm}:00`).toISOString();
const item = (fields = {}) => ({
  ...m.newItem(),
  title: "Cosa",
  startDate: "2030-04-01",
  ...fields,
});
const grupo = (id, fields = {}) => ({
  ...m.newGroup(id, "general"),
  id,
  ...fields,
});
const rutina = grupo("R", { repeat: "diario", repeatStart: "2030-04-01" });
const datos = (fields = {}) => ({
  ...m.emptyData(),
  workspaces: [
    ...m.emptyData().workspaces,
    { id: "t", name: "Trabajo", color: "#3366ff" },
    { id: "a", name: "Arte", color: "#ff6633" },
  ],
  ...fields,
});
const ids = (lista) => lista.map((x) => x.id);

test("ventana: semana incluye hoy+6 y excluye hoy+7", () => {
  assert.equal(e.DIAS_VENTANA.semana, 7);
  assert.ok(
    e.enVentana(
      item({ scheduledAt: at("2030-05-07", "23:30") }),
      "semana",
      now,
    ),
  );
  assert.ok(
    !e.enVentana(
      item({ scheduledAt: at("2030-05-08", "00:30") }),
      "semana",
      now,
    ),
  );
  assert.ok(e.enVentana(item({ dueAt: at("2031-01-01") }), "todo", now));
});
test("ventana: atrasada sin completar cuenta", () => {
  const atrasada = item({ scheduledAt: at("2030-04-28") });
  assert.ok(e.enVentana(atrasada, "hoy", now));
  assert.ok(!e.enVentana({ ...atrasada, status: "completado" }, "hoy", now));
});
test("ventana: sin fecha o en curso se ve siempre", () => {
  assert.ok(e.siempreVisible(item()));
  assert.ok(e.enVentana(item(), "hoy", now));
  const lejos = item({ dueAt: at("2030-06-01"), status: "en curso" });
  assert.ok(e.siempreVisible(lejos));
  assert.ok(e.enVentana(lejos, "hoy", now));
  assert.equal(e.fechaDe(item({ dueAt: "d", scheduledAt: "s" })), "s");
});
test("estado: prioridades", () => {
  const req = item({ id: "req" });
  const d = datos({ items: [req] });
  const estado = (fields, v = "semana") => e.estadoDe(item(fields), d, v, now);
  assert.equal(
    estado({ status: "completado", dependencies: ["req"] }),
    "hecho",
  );
  assert.equal(estado({ dependencies: ["req"] }), "bloqueado");
  assert.equal(estado({}), "hueco");
  assert.equal(estado({ scheduledAt: at("2030-05-01", "20:00") }), "hoy");
  assert.equal(estado({ dueAt: at("2030-04-20") }), "hoy");
  assert.equal(estado({ scheduledAt: at("2030-05-04") }), "on");
  assert.equal(estado({ scheduledAt: at("2030-05-11") }), "tenue");
  assert.equal(
    estado({ scheduledAt: at("2030-05-11"), status: "en curso" }),
    "on",
  );
});
test("carga: nota 0, completada 0, difícil de 3 h = 9", () => {
  assert.equal(e.cargaDe(item({ type: "Nota" }), now), 0);
  assert.equal(
    e.cargaDe(
      item({
        type: "Meeting",
        difficulty: 3,
        duration: 180,
        status: "completado",
      }),
      now,
    ),
    0,
  );
  assert.equal(
    e.cargaDe(
      item({
        type: "Meeting",
        difficulty: 3,
        duration: 180,
        deletedAt: at("2030-04-30"),
      }),
      now,
    ),
    0,
  );
  assert.equal(
    e.cargaDe(item({ type: "Meeting", difficulty: 3, duration: 180 }), now),
    9,
  );
  assert.equal(
    e.cargaDe(item({ type: "Meeting", difficulty: 2, duration: 600 }), now),
    8,
  );
  assert.equal(e.cargaDe(item({ type: "Tarea", duration: 5 }), now), 0.25);
});
test("carga: contenedor suma subgrupos pendientes", () => {
  const reunion = (dificultad, minutos, fields) =>
    item({
      type: "Meeting",
      difficulty: dificultad,
      duration: minutos,
      ...fields,
    });
  const d = datos({
    groups: [grupo("A"), grupo("B", { parentId: "A" }), rutina],
    items: [
      reunion(3, 60, { groupId: "A" }),
      reunion(2, 120, { groupId: "B" }),
      reunion(3, 120, { groupId: "B", status: "completado" }),
      reunion(1, 60, {}),
      reunion(3, 60, { groupId: "R" }), // modelo de rutina: no es pendiente real
      reunion(3, 60, { workspaceId: "t" }),
    ],
  });
  assert.equal(
    e.cargaDeContenedor(d, { workspaceId: "general", groupId: "A" }, now),
    7,
  );
  assert.equal(
    e.cargaDeContenedor(d, { workspaceId: "general", groupId: "" }, now),
    8,
  );
  assert.equal(
    e.cargaDeContenedor(d, { workspaceId: "t", groupId: "" }, now),
    3,
  );
});
test("conexiones: entre mesas", () => {
  const d = datos({
    items: [
      item({ id: "a" }),
      item({ id: "b", workspaceId: "t", dependencies: ["a"] }),
      item({ id: "c", workspaceId: "t", dependencies: ["b"] }),
      item({ id: "x", dependencies: ["b"], deletedAt: at("2030-04-30") }),
    ],
  });
  const c = e.conexiones(d, "b");
  assert.deepEqual([ids(c.requisitos), ids(c.dependientes)], [["a"], ["c"]]);
});
test("modelo: la cosa en una rutina es modelo", () => {
  const ocurrencia = grupo("R~2030-05-01", {
    parentId: "R",
    name: "R · 1 may",
  });
  const d = datos({ groups: [rutina, ocurrencia, grupo("A")] });
  assert.ok(e.esRutina(rutina));
  assert.ok(!e.esRutina(ocurrencia));
  assert.ok(e.esModelo(item({ groupId: "R" }), d));
  assert.ok(!e.esModelo(item({ groupId: "R~2030-05-01" }), d));
  assert.ok(!e.esModelo(item({ groupId: "A" }), d));
  assert.ok(!e.esModelo(item(), d));
});
test("timedItems: excluye modelos", () => {
  const d = datos({
    groups: [rutina, grupo("R~2030-05-01", { parentId: "R" })],
    items: [
      item({ id: "modelo", groupId: "R" }),
      item({ id: "copia", groupId: "R~2030-05-01" }),
      item({ id: "suelta" }),
      item({ id: "borrada", deletedAt: at("2030-04-30") }),
    ],
  });
  assert.deepEqual(ids(e.timedItems(d)), ["copia", "suelta"]);
});
test("arbol: General primero, mesas por nombre y grupos anidados", () => {
  const d = datos({
    groups: [
      grupo("B", { parentId: "A", name: "B" }),
      grupo("A", { name: "A" }),
      grupo("T1", { workspaceId: "t" }),
    ],
    items: [
      item({ id: "s2", x: 1 }),
      item({ id: "s1", x: 0 }),
      item({ id: "b1", groupId: "B" }),
    ],
  });
  const r = e.arbol(d);
  assert.deepEqual(
    r.map((x) => x.mesa.id),
    ["general", "a", "t"],
  );
  assert.deepEqual(ids(r[0].sueltas), ["s1", "s2"]);
  assert.deepEqual(ids(r[0].grupos.map((n) => n.grupo)), ["A"]);
  assert.deepEqual(ids(r[0].grupos[0].hijos[0].items), ["b1"]);
  assert.deepEqual(ids(r[2].grupos.map((n) => n.grupo)), ["T1"]);
});
test("rutaDe: de la raíz al grupo", () => {
  const d = datos({
    groups: [
      grupo("C", { parentId: "B" }),
      grupo("A"),
      grupo("B", { parentId: "A" }),
    ],
  });
  assert.deepEqual(ids(e.rutaDe(d, "C")), ["A", "B", "C"]);
  assert.deepEqual(e.rutaDe(d, ""), []);
  // Un ciclo (posible al juntar dos dispositivos) no cuelga la app.
  const ciclo = datos({
    groups: [grupo("X", { parentId: "Y" }), grupo("Y", { parentId: "X" })],
  });
  assert.deepEqual(ids(e.rutaDe(ciclo, "X")), ["Y", "X"]);
});
test("moverAFecha: conserva la hora local", () => {
  const i = {
    ...item(),
    scheduledAt: new Date(2030, 2, 30, 9, 15).toISOString(),
  };
  const j = e.moverAFecha(i, "2030-04-02", 18);
  assert.equal(new Date(j.scheduledAt).getHours(), 9);
  assert.equal(new Date(j.scheduledAt).getMinutes(), 15);
  assert.equal(new Date(j.scheduledAt).getDate(), 2);
  const k = e.moverAFecha(
    item({ dueAt: new Date(2030, 3, 5, 17, 0).toISOString() }),
    "2030-04-09",
    9,
  );
  assert.equal(new Date(k.dueAt).getHours(), 17);
  assert.equal(k.scheduledAt, "");
});
test("moverAFecha: evento no queda sin fecha", () => {
  assert.throws(
    () =>
      e.moverAFecha(
        item({ type: "Evento", scheduledAt: at("2030-05-02") }),
        "",
        18,
      ),
    { message: "Un evento necesita fecha." },
  );
  const t = e.moverAFecha(
    item({ dueAt: at("2030-05-02"), scheduledAt: at("2030-05-02") }),
    "",
    18,
  );
  assert.deepEqual([t.dueAt, t.scheduledAt], ["", ""]);
});
test("moverAFecha: sin fecha usa la hora por defecto", () => {
  const j = e.moverAFecha(item({ startDate: "2030-05-01" }), "2030-04-28", 18);
  assert.equal(j.dueAt, new Date(2030, 3, 28, 18, 0).toISOString());
  assert.equal(j.startDate, "2030-04-28");
  assert.equal(
    e.moverAFecha(item({ startDate: "2030-05-01" }), "2030-05-09", 18)
      .startDate,
    "2030-05-01",
  );
});
