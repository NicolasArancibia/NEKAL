const { test } = require("node:test");
const assert = require("node:assert/strict");
const n = require("../.test-build/neka.js");
const m = require("../.test-build/model.js");
const now = new Date("2030-05-01T13:00:00").getTime();
const at = (day, hm) => new Date(`2030-05-${day}T${hm}:00`).toISOString();
const task = (fields = {}) => ({
  ...m.newItem(),
  type: "Tarea",
  title: "T",
  startDate: "2030-05-01",
  duration: 60,
  flexible: false,
  ...fields,
});
const data = (items, rewards = []) => ({ ...m.emptyData(), items, rewards });

test("neka: sin ítems → nuevo", () =>
  assert.deepEqual(n.nekaState(data([]), now), {
    kind: "nuevo",
    pose: 3,
    message: "Hola, soy Neka. Crea tu primera tarea y te ayudo a ordenarla.",
    action: { label: "Crear tarea", target: "crear" },
  }));
test("neka: choque de hoy → conflicto", () => {
  const s = n.nekaState(
    data([
      task({
        id: "a",
        title: "Revisión de sprint",
        scheduledAt: at("01", "14:00"),
      }),
      task({
        id: "b",
        title: "Clase de estadística",
        scheduledAt: at("01", "14:30"),
      }),
    ]),
    now,
  );
  assert.equal(s.kind, "conflicto");
  assert.equal(s.pose, 14);
  assert.equal(
    s.message,
    "A las 14:00 se te juntan «Revisión de sprint» y «Clase de estadística».",
  );
  assert.deepEqual(s.action, { label: "Resolver", target: "chat" });
});
test("neka: choque de otro día → revisar", () => {
  const s = n.nekaState(
    data([
      task({ id: "a", scheduledAt: at("03", "10:00") }),
      task({ id: "b", scheduledAt: at("03", "10:30") }),
    ]),
    now,
  );
  assert.deepEqual(
    [s.kind, s.pose, s.message],
    ["revisar", 7, "Encontré 1 cosa por ordenar."],
  );
  assert.deepEqual(s.action, { label: "Revisar", target: "chat" });
});
test("neka: una entrega vencida → vencido con ítem", () => {
  const s = n.nekaState(
    data([
      task({
        id: "d",
        type: "Deadline",
        title: "Entrega del informe",
        dueAt: at("01", "09:00"),
      }),
    ]),
    now,
  );
  assert.deepEqual(
    [s.kind, s.pose, s.message],
    ["vencido", 14, "Se te pasó «Entrega del informe»."],
  );
  assert.deepEqual(s.action, { label: "Ver", target: "item", itemId: "d" });
});
test("neka: varias vencidas", () => {
  const s = n.nekaState(
    data(
      ["x", "y", "z"].map((id) =>
        task({ id, type: "Deadline", dueAt: at("01", "08:00") }),
      ),
    ),
    now,
  );
  assert.equal(s.message, "Tienes 3 entregas vencidas.");
  assert.deepEqual(s.action, { label: "Ver", target: "chat" });
});
test("neka: el choque de hoy gana a lo vencido", () => {
  const s = n.nekaState(
    data([
      task({ id: "a", scheduledAt: at("01", "14:00") }),
      task({ id: "b", scheduledAt: at("01", "14:30") }),
      task({ id: "d", type: "Deadline", dueAt: at("01", "09:00") }),
    ]),
    now,
  );
  assert.equal(s.kind, "conflicto");
});
test("neka: día terminado con puntos de hoy", () => {
  const s = n.nekaState(
    data(
      [task({ scheduledAt: at("01", "09:00"), status: "completado" })],
      [
        {
          key: "a",
          itemId: "a",
          points: 25,
          at: at("01", "09:30"),
          reason: "",
        },
        {
          key: "b",
          itemId: "b",
          points: 15,
          at: at("01", "10:00"),
          reason: "",
        },
        {
          key: "c:budget",
          itemId: "c",
          points: 99,
          at: at("01", "10:00"),
          reason: "",
        },
        {
          key: "d",
          itemId: "d",
          points: 50,
          at: "2030-04-30T10:00:00.000Z",
          reason: "",
        },
      ],
    ),
    now,
  );
  assert.deepEqual(
    [s.kind, s.pose, s.message, s.action],
    ["listo", 1, "Listo por hoy. Sumaste 40 puntos.", undefined],
  );
});
test("neka: día terminado sin puntos", () =>
  assert.equal(
    n.nekaState(
      data([task({ scheduledAt: at("01", "09:00"), status: "completado" })]),
      now,
    ).message,
    "Listo por hoy.",
  ));
test("neka: día con cosas", () => {
  const s = n.nekaState(
    data([
      task({ scheduledAt: at("01", "09:00"), status: "completado" }),
      task({ scheduledAt: at("01", "16:00") }),
      task({ scheduledAt: at("01", "17:30") }),
      task({ scheduledAt: at("01", "19:00") }),
      task({ scheduledAt: at("01", "21:00") }),
    ]),
    now,
  );
  assert.deepEqual(
    [s.kind, s.pose, s.message, s.action],
    ["dia", 15, "Hoy tienes 4 cosas. La siguiente es a las 16:00.", undefined],
  );
});
test("neka: una cosa pendiente ya pasada no tiene siguiente", () =>
  assert.equal(
    n.nekaState(data([task({ scheduledAt: at("01", "09:00") })]), now).message,
    "Hoy tienes 1 cosa.",
  ));
test("neka: día libre (solo hay ideas o cosas de otro día)", () => {
  for (const items of [
    [{ ...m.newItem(), type: "Idea", title: "I" }],
    [task({ scheduledAt: at("02", "10:00") })],
  ])
    assert.deepEqual(n.nekaState(data(items), now), {
      kind: "libre",
      pose: 3,
      message: "Hoy no tienes nada agendado.",
      action: { label: "Crear", target: "crear" },
    });
});
test("todayItems: límites del día", () => {
  const items = [
    task({ id: "late", scheduledAt: at("01", "23:59") }),
    task({ id: "tomorrow", scheduledAt: at("02", "00:15") }),
    task({ id: "due", type: "Deadline", dueAt: at("01", "18:00") }),
    task({ id: "early", scheduledAt: at("01", "08:00") }),
  ];
  assert.deepEqual(
    n.todayItems(data(items), now).map((i) => i.id),
    ["early", "due", "late"],
  );
});
test("timeUntil y hhmm", () => {
  const h = (min) => n.timeUntil(now, now + min * 60000);
  assert.deepEqual(
    [h(80), h(60), h(45), h(0), h(-5)],
    ["en 1 h 20 min", "en 1 h", "en 45 min", "ahora", "ahora"],
  );
  assert.equal(n.hhmm(at("01", "07:05")), "07:05");
});
