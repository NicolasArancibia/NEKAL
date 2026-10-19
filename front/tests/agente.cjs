const { test } = require("node:test");
const assert = require("node:assert/strict");
const m = require("../.test-build/model.js");
const pl = require("../.test-build/agente/plan.js");

// Lunes 6 de mayo de 2030, 9:00.
const now = new Date(2030, 4, 6, 9, 0).getTime();
const ti = (h, min = 0, dia = 6) =>
  new Date(2030, 4, dia, h, min).toISOString();
const viejo = "2030-05-01T00:00:00.000Z";
const cosa = (id, fields = {}) => ({
  ...m.newItem(),
  id,
  title: id,
  startDate: "2030-05-01",
  createdAt: viejo,
  updatedAt: viejo,
  ...fields,
});
const datos = () => ({
  ...m.emptyData(),
  items: [
    cosa("gym", { scheduledAt: ti(9, 30), duration: 60 }),
    cosa("compra"),
  ],
});
const paso = (p, texto = "paso", toca = {}) => ({ ...p, texto, toca });
const mover = (id, h, min) =>
  paso(
    {
      tipo: "mover",
      id,
      scheduledAt: ti(h, min),
      dueAt: "",
      startDate: "2030-05-01",
    },
    `${id} → ${h}:${min}`,
    { [id]: viejo },
  );
const plan = (...pasos) => ({
  id: "p1",
  resumen: `${pasos.length} cambios`,
  pasos,
});
const de = (d, id) => d.items.find((i) => i.id === id);
const editada = (d, id) => ({
  ...d,
  items: d.items.map((i) =>
    i.id === id ? { ...i, title: "otra", updatedAt: ti(8) } : i,
  ),
});
const grupoNuevo = paso(
  {
    tipo: "crearGrupo",
    grupo: { ...m.newGroup("Tesis", "general"), id: "g1" },
  },
  "Nuevo grupo «Tesis»",
);
const meterCompra = paso(
  {
    tipo: "moverA",
    ids: ["compra"],
    destino: { workspaceId: "general", groupId: "g1" },
  },
  "Mover «compra» a «Tesis»",
  { compra: viejo },
);

test("plan: se prueba sobre una copia", () => {
  const d = datos(),
    antes = JSON.stringify(d);
  const r = pl.probar(d, [mover("gym", 9, 50)], [true], now);
  assert.deepEqual(r.errores, [null]);
  assert.equal(de(r.data, "gym").scheduledAt, ti(9, 50));
  assert.equal(JSON.stringify(d), antes);
});
test("plan: un paso inválido devuelve su error", () => {
  const p = plan(
    paso({
      tipo: "crear",
      item: cosa("ev", { type: "Evento", flexible: false }),
    }),
  );
  const r = pl.probar(datos(), p.pasos, [true], now);
  assert.equal(typeof r.errores[0], "string");
  assert.throws(() => pl.aceptar(datos(), p, [true], now), {
    message: r.errores[0],
  });
});
test("plan: cosa inexistente", () => {
  const r = pl.probar(
    datos(),
    [paso({ tipo: "completar", id: "fantasma" })],
    [true],
    now,
  );
  assert.deepEqual(r.errores, ["Esa cosa ya no existe."]);
});
test("plan: desmarcar deja esa cosa igual", () => {
  const r = pl.probar(datos(), [mover("gym", 9, 50)], [false], now);
  assert.equal(de(r.data, "gym").scheduledAt, ti(9, 30));
});
test("plan: depende de un paso desmarcado", () => {
  const r = pl.probar(datos(), [grupoNuevo, meterCompra], [false, true], now);
  assert.deepEqual(r.errores, [
    null,
    "Depende de «Nuevo grupo «Tesis»», que desmarcaste.",
  ]);
  assert.equal(de(r.data, "compra").groupId, "");
});
test("plan: algo cambió", () => {
  assert.throws(
    () =>
      pl.aceptar(
        editada(datos(), "gym"),
        plan(mover("gym", 9, 50)),
        [true],
        now,
      ),
    {
      message: "Algo cambió, pídeselo de nuevo.",
    },
  );
});
test("plan: cambios en otras cosas no bloquean", () => {
  const d = pl.aceptar(
    editada(datos(), "compra"),
    plan(mover("gym", 9, 50)),
    [true],
    now,
  );
  assert.equal(de(d, "gym").scheduledAt, ti(9, 50));
});
test("plan: completar da los mismos puntos que a mano", () => {
  const d = datos();
  const aMano = m.saveItem(
    d,
    { ...de(d, "compra"), status: "completado" },
    now,
  );
  const conNeka = pl.aceptar(
    d,
    plan(
      paso({ tipo: "completar", id: "compra" }, "Completar", { compra: viejo }),
    ),
    [true],
    now,
  );
  assert.ok(m.totalPoints(aMano) > 0);
  assert.equal(m.totalPoints(conNeka), m.totalPoints(aMano));
  assert.equal(de(conNeka, "compra").status, "completado");
});
test("plan: borrar va a la papelera", () => {
  const d = pl.aceptar(
    datos(),
    plan(paso({ tipo: "borrar", id: "compra" }, "Borrar", { compra: viejo })),
    [true],
    now,
  );
  assert.ok(de(d, "compra").deletedAt);
});
test("plan: grupo nuevo y mover adentro", () => {
  const d = pl.aceptar(
    datos(),
    plan(grupoNuevo, meterCompra),
    [true, true],
    now,
  );
  assert.equal(de(d, "compra").groupId, "g1");
  assert.ok(d.groups.some((g) => g.id === "g1" && g.name === "Tesis"));
});

// Contexto y herramientas (Task 5).
const cx = require("../.test-build/agente/contexto.js");
const h = require("../.test-build/agente/herramientas.js");
const llamar = (d, nombre, args = {}, previos = []) =>
  h.ejecutar(d, previos, { nombre, args }, now);
const dia = (n, hh = 10) => ti(hh, 0, 6 + n);

test("contexto: ventana de ayer a hoy+14", () => {
  const d = {
    ...m.emptyData(),
    items: [
      cosa("ayer", { scheduledAt: dia(-1) }),
      cosa("anteayer", { scheduledAt: dia(-2) }),
      cosa("hoy14", { dueAt: ti(20, 0, 20) }),
      cosa("hoy15", { scheduledAt: dia(15) }),
      cosa("sinfecha"),
      cosa("hechasinfecha", { status: "completado" }),
    ],
  };
  const c = cx.contexto(d, now);
  for (const id of ["ayer", "hoy14", "sinfecha"])
    assert.ok(c.includes(`[${id}]`), id);
  for (const id of ["anteayer", "hoy15", "hechasinfecha"])
    assert.ok(!c.includes(`[${id}]`), id);
  assert.ok(c.includes("Ahora:") && c.includes("2030-05-06 09:00"));
});
test("contexto: sin adjuntos ni contenido de notas", () => {
  const d = {
    ...m.emptyData(),
    items: [
      cosa("n1", {
        type: "Nota",
        title: "Ideas tesis",
        content: "SECRETO",
        description: "PRIVADO",
        attachments: [
          {
            id: "a1",
            name: "foto.png",
            mime: "image/png",
            data: "data:image/png;base64,AAA",
          },
        ],
      }),
    ],
  };
  const c = cx.contexto(d, now);
  assert.ok(c.includes("«Ideas tesis»"));
  for (const x of ["SECRETO", "PRIVADO", "foto.png", "base64"])
    assert.ok(!c.includes(x), x);
});
test("contexto: sin modelos de rutina", () => {
  const r = {
    ...m.newGroup("Mañanas", "general"),
    id: "R",
    repeat: "diario",
    repeatStart: "2030-05-01",
  };
  const o = {
    ...m.newGroup("Mañanas · 6 may", "general"),
    id: "R~2030-05-06",
    parentId: "R",
  };
  const d = {
    ...m.emptyData(),
    groups: [r, o],
    items: [
      cosa("modelo", { groupId: "R" }),
      cosa("copia", { groupId: "R~2030-05-06", scheduledAt: dia(0) }),
    ],
  };
  const c = cx.contexto(d, now);
  assert.ok(c.includes("[copia]") && !c.includes("[modelo]"));
  assert.ok(c.includes("rutina"));
});
test("historial: últimos 20", () => {
  const messages = Array.from({ length: 25 }, (_, n) => ({
    id: `m${n}`,
    text: `t${n}`,
    isUser: n % 2 === 0,
  }));
  messages.push({
    id: "p",
    text: "",
    isUser: false,
    audio: false,
    plan: "2 cambios",
    estado: "aceptado",
  });
  const hs = cx.historial({ ...m.emptyData(), messages });
  assert.equal(hs.length, 20);
  assert.deepEqual(hs[hs.length - 1], {
    deUsuario: false,
    texto: "[Plan · 2 cambios: aceptado]",
  });
  assert.equal(hs[0].texto, "t6");
});

test("herramientas: crear arma la cosa en General", () => {
  const e = llamar(datos(), "crear", {
    tipo: "Evento",
    titulo: "Dentista",
    inicio: "2030-05-07 10:00",
    duracion: 45,
  });
  assert.equal(e.pasos.length, 1);
  const { item } = e.pasos[0];
  assert.deepEqual(
    [
      item.type,
      item.title,
      item.workspaceId,
      item.scheduledAt,
      item.duration,
      item.flexible,
    ],
    ["Evento", "Dentista", "general", ti(10, 0, 7), 45, false],
  );
  assert.match(e.pasos[0].texto, /Dentista/);
});
test("herramientas: crear evento sin fecha devuelve error", () => {
  const e = llamar(datos(), "crear", { tipo: "Evento", titulo: "Dentista" });
  assert.deepEqual(e.pasos, []);
  assert.equal(e.resultado.error, "Indica la fecha y hora del compromiso.");
});
test("herramientas: correrDesde agrega lo que cambia y avisa lo que no cabe", () => {
  const d = {
    ...m.emptyData(),
    items: [
      cosa("gym", { scheduledAt: ti(9, 30), duration: 60 }),
      cosa("tarde", { scheduledAt: ti(20, 30), duration: 30 }),
    ],
  };
  const e = llamar(d, "correrDesde", {
    minutos: 20,
    desde: "2030-05-06 09:10",
  });
  assert.deepEqual(
    e.pasos.map((p) => [p.id, p.scheduledAt]),
    [["gym", ti(9, 50)]],
  );
  assert.equal(e.pasos[0].toca.gym, viejo);
  assert.match(e.pasos[0].texto, /9:30 → 9:50/);
  assert.deepEqual(e.resultado.noCaben, []);
  const tarde = llamar(d, "correrDesde", {
    minutos: 40,
    desde: "2030-05-06 20:00",
  });
  assert.deepEqual(tarde.resultado.noCaben, [{ id: "tarde", titulo: "tarde" }]);
});
test("herramientas: mover algo fijo queda marcado", () => {
  const d = {
    ...m.emptyData(),
    items: [
      cosa("reu", {
        type: "Meeting",
        flexible: false,
        scheduledAt: ti(12, 30),
      }),
    ],
  };
  const e = llamar(d, "mover", { id: "reu", inicio: "2030-05-06 15:00" });
  assert.equal(e.pasos[0].eraFija, true);
  assert.equal(e.pasos[0].scheduledAt, ti(15, 0));
  assert.equal(
    llamar(datos(), "mover", { id: "gym", inicio: "2030-05-06 10:00" }).pasos[0]
      .eraFija,
    false,
  );
});
test("herramientas: buscar fuera de la ventana", () => {
  const d = {
    ...m.emptyData(),
    items: [cosa("lejos", { title: "Matrícula", dueAt: ti(10, 0, 30) })],
  };
  assert.ok(!cx.contexto(d, now).includes("[lejos]"));
  const e = llamar(d, "buscar", { texto: "matricula" });
  assert.equal(e.pasos.length, 0);
  assert.ok(JSON.stringify(e.resultado).includes("[lejos]"));
});
test("herramientas: juntarEnGrupo arma dos pasos", () => {
  const e = llamar(datos(), "juntarEnGrupo", {
    ids: ["gym", "compra"],
    nombre: "Hoy",
  });
  assert.deepEqual(
    e.pasos.map((p) => p.tipo),
    ["crearGrupo", "moverA"],
  );
  assert.equal(e.pasos[1].destino.groupId, e.pasos[0].grupo.id);
});
test("herramientas: id inventado o borrado", () => {
  assert.equal(
    llamar(datos(), "completar", { id: "fantasma" }).resultado.error,
    "Esa cosa ya no existe.",
  );
  const d = {
    ...datos(),
    items: datos().items.map((i) =>
      i.id === "compra" ? { ...i, deletedAt: viejo } : i,
    ),
  };
  const e = llamar(d, "borrar", { id: "compra" });
  assert.deepEqual(
    [e.resultado.error, e.pasos.length],
    ["Esa cosa ya no existe.", 0],
  );
});
test("herramientas: pedido desconocido", () => {
  assert.equal(
    llamar(datos(), "volar").resultado.error,
    "No entendí ese pedido.",
  );
  assert.equal(
    llamar(datos(), "mover", {}).resultado.error,
    "No entendí ese pedido.",
  );
});
test("herramientas: los pasos previos cuentan", () => {
  const g = llamar(datos(), "crearGrupo", { nombre: "Tesis", mesa: "General" });
  const e = llamar(
    datos(),
    "moverA",
    { ids: ["compra"], mesa: "general", grupo: "Tesis" },
    g.pasos,
  );
  assert.equal(e.resultado.error, undefined);
  assert.equal(e.pasos[0].destino.groupId, g.pasos[0].grupo.id);
});
test("herramientas: cada declaración tiene su ejecución", () => {
  const nombres = h.DECLARACIONES.map((x) => x.name).sort();
  assert.deepEqual(nombres, [
    "borrar",
    "buscar",
    "buscarHueco",
    "completar",
    "correrDesde",
    "crear",
    "crearGrupo",
    "crearMesa",
    "editar",
    "juntarEnGrupo",
    "mover",
    "moverA",
  ]);
  assert.deepEqual([...h.ACEPTA].sort(), nombres);
});
