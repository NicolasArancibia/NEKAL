const { test } = require("node:test");
const assert = require("node:assert/strict");
const m = require("../.test-build/model.js");
const niv = require("../.test-build/progreso/nivel.js");
const des = require("../.test-build/progreso/desde.js");
// Domingo 12 de mayo de 2030, 18:00 local.
const now = new Date(2030, 4, 12, 18, 0).getTime();
const DIA = 86400000;
const iso = (ms) => new Date(ms).toISOString();
const item = (fields = {}) => ({ ...m.newItem(), title: "Cosa", ...fields });
const pasos = (n, done = 0) =>
  Array.from({ length: n }, (_, k) => ({
    id: `p${k}`,
    title: `Paso ${k}`,
    done: k < done,
  }));

test("puntaje: dificultad por pasos y lugar, sin fecha", () => {
  const dif = (fields) => m.difficultyOf(item(fields));
  assert.equal(dif({ steps: pasos(0) }), 1);
  assert.equal(dif({ steps: pasos(1) }), 1);
  assert.equal(dif({ steps: pasos(2) }), 2);
  assert.equal(dif({ steps: pasos(1), location: "Casa" }), 2);
  assert.equal(dif({ steps: pasos(4) }), 2);
  assert.equal(dif({ steps: pasos(4), location: "Casa" }), 3);
  assert.equal(dif({ dueAt: iso(now + DIA) }), 1);
});

const informe = (fields = {}) =>
  item({
    title: "Entregar informe",
    priority: "urgente",
    steps: pasos(3),
    ...fields,
  });

test("puntaje: bonus antes, justo y atrasado", () => {
  assert.equal(m.pointsFor(informe({ dueAt: iso(now + DIA) }), [], now), 48);
  assert.equal(m.pointsFor(informe({ dueAt: iso(now) }), [], now), 48);
  assert.equal(m.pointsFor(informe({ dueAt: iso(now - 60000) }), [], now), 40);
});

test("puntaje: sin fecha límite no hay bonus", () => {
  assert.equal(m.pointsFor(informe(), [], now), 40);
});

test("puntaje: la meta congela el bonus en el primer pago", () => {
  const meta = item({
    type: "Goal",
    priority: "urgente",
    steps: pasos(3, 1),
    dueAt: iso(now + 2 * DIA),
  });
  let d = m.saveItem(m.emptyData(), meta, now);
  assert.equal(d.rewards.find((r) => r.key.endsWith(":budget")).points, 48);
  d = m.saveItem(
    d,
    { ...meta, status: "completado", steps: pasos(3, 3) },
    now + 5 * DIA,
  );
  assert.equal(m.totalPoints(d), 48);
});

test("nivel: bordes", () => {
  assert.deepEqual(niv.nivelDe(0), {
    nivel: 1,
    desde: 0,
    hasta: 100,
    avance: 0,
  });
  assert.equal(niv.nivelDe(99).nivel, 1);
  assert.equal(niv.nivelDe(100).nivel, 2);
  assert.equal(niv.nivelDe(299).nivel, 2);
  assert.equal(niv.nivelDe(300).nivel, 3);
  assert.equal(niv.nivelDe(2800).nivel, 8);
  assert.equal(niv.nivelDe(4500).nivel, 10);
  assert.deepEqual(niv.nivelDe(3140), {
    nivel: 8,
    desde: 2800,
    hasta: 3600,
    avance: 0.425,
  });
  assert.equal(niv.nivelDe(-5).nivel, 1);
  assert.equal(niv.puntosParaNivel(5), 1000);
});

test("desde: cuenta vacía", () => {
  const r = des.desdeElDia1(m.emptyData(), now);
  assert.equal(r.dia1, "2030-05-12");
  assert.equal(r.dias, 1);
  assert.equal(r.listas, 0);
  assert.equal(r.nivelesSubidos, 0);
  assert.deepEqual(r.subidas, []);
});

test("desde: día 1, curva y subidas", () => {
  const premio = (key, points, y, mo, d) => ({
    key,
    itemId: "a",
    points,
    at: iso(new Date(y, mo, d, 12).getTime()),
    reason: m.RAZON_COMPLETADO,
  });
  const d = {
    ...m.emptyData(),
    items: [
      item({ id: "a", createdAt: iso(new Date(2030, 3, 1, 9).getTime()) }),
    ],
    rewards: [
      premio("r1", 100, 2030, 3, 3),
      premio("a:budget", 999, 2030, 3, 3),
      premio("r2", 200, 2030, 3, 20),
      premio("r3", 50, 2030, 4, 10),
    ],
  };
  const r = des.desdeElDia1(d, now);
  assert.equal(r.dia1, "2030-04-01");
  assert.equal(r.dias, 42);
  assert.deepEqual(
    r.curva.map((c) => c.dia),
    [
      "2030-04-01",
      "2030-04-08",
      "2030-04-15",
      "2030-04-22",
      "2030-04-29",
      "2030-05-06",
      "2030-05-12",
    ],
  );
  assert.deepEqual(
    r.curva.map((c) => c.puntos),
    [0, 100, 100, 300, 300, 300, 350],
  );
  assert.deepEqual(r.subidas, [
    { dia: "2030-04-03", nivel: 2 },
    { dia: "2030-04-20", nivel: 3 },
  ]);
  assert.equal(r.nivelesSubidos, 2);
});

test("desde: cosas listas sin notas ni borradas", () => {
  const d = {
    ...m.emptyData(),
    items: [
      item({ status: "completado" }),
      item({ status: "completado", deletedAt: iso(now) }),
      item({ type: "Nota" }),
      item(),
    ],
  };
  assert.equal(des.cosasListas(d), 1);
});

// ---------- Task 2: tus días ----------
const dias = require("../.test-build/progreso/dias.js");
const alas = (y, mo, d, h = 10) => iso(new Date(y, mo, d, h).getTime());
const conHora = (y, mo, d, fields = {}) =>
  item({ scheduledAt: alas(y, mo, d), ...fields });
const premioDe = (itemId, y, mo, d, h = 12, key = `${itemId}:r`) => ({
  key,
  itemId,
  points: 10,
  at: alas(y, mo, d, h),
  reason: m.RAZON_COMPLETADO,
});
const conItems = (items, rewards = []) => ({
  ...m.emptyData(),
  items,
  rewards,
});
const falso = (suma, descanso = false) => ({
  dia: "x",
  tenias: 1,
  hechas: suma ? 1 : 0,
  sinAgenda: 0,
  tono: suma ? 4 : 0,
  suma,
  descanso,
});

test("dias: tonos de 0 a 4 de 4", () => {
  const tonos = [],
    sumas = [];
  for (let k = 0; k <= 4; k++) {
    const items = [0, 1, 2, 3].map((n) =>
      conHora(2030, 4, 9, { status: n < k ? "completado" : "pendiente" }),
    );
    const x = dias.diaDe(conItems(items), "2030-05-09");
    tonos.push(x.tono);
    sumas.push(x.suma);
  }
  assert.deepEqual(tonos, [0, 1, 2, 3, 4]);
  assert.deepEqual(sumas, [false, false, true, true, true]);
});

test("dias: sin agenda con algo hecho es tono 2 y suma", () => {
  const sinFecha = item({ id: "s", status: "completado" });
  const x = dias.diaDe(
    conItems([sinFecha], [premioDe("s", 2030, 4, 9)]),
    "2030-05-09",
  );
  assert.deepEqual(
    [x.tenias, x.sinAgenda, x.tono, x.suma, x.descanso],
    [0, 1, 2, true, false],
  );
});

test("dias: nada agendado ni hecho es descanso", () => {
  const x = dias.diaDe(conItems([]), "2030-05-09");
  assert.deepEqual([x.tono, x.suma, x.descanso], [0, false, true]);
});

test("dias: notas, ideas y borradas no cuentan", () => {
  const items = [
    conHora(2030, 4, 9, { type: "Nota" }),
    conHora(2030, 4, 9, { type: "Idea" }),
    conHora(2030, 4, 9, { deletedAt: alas(2030, 4, 9) }),
    conHora(2030, 4, 9, { status: "completado" }),
  ];
  const x = dias.diaDe(conItems(items), "2030-05-09");
  assert.deepEqual([x.tenias, x.hechas, x.tono], [1, 1, 4]);
});

test("dias: hora y límite en días distintos", () => {
  const d = conItems([
    item({ scheduledAt: alas(2030, 4, 8), dueAt: alas(2030, 4, 10, 18) }),
  ]);
  assert.equal(dias.diaDe(d, "2030-05-08").tenias, 1);
  assert.equal(dias.diaDe(d, "2030-05-10").tenias, 1);
  assert.equal(dias.diaDe(d, "2030-05-09").tenias, 0);
});

test("rachas: descanso al medio no corta", () => {
  assert.equal(
    dias.rachas([falso(true), falso(false, true), falso(true), falso(true)])
      .racha,
    3,
  );
});

test("rachas: hoy bajo el 50% no corta", () => {
  const hoy = { ...falso(false), tenias: 4, hechas: 1, tono: 1 };
  assert.deepEqual(dias.rachas([falso(true), falso(true), hoy]), {
    racha: 2,
    record: 2,
    hoySuma: false,
  });
});

test("rachas: día en 0% con algo sin fecha hecho corta", () => {
  const d = conItems(
    [conHora(2030, 4, 9), item({ id: "s", status: "completado" })],
    [premioDe("s", 2030, 4, 9)],
  );
  const x = dias.diaDe(d, "2030-05-09");
  assert.deepEqual([x.tono, x.suma, x.sinAgenda], [0, false, 1]);
  assert.equal(dias.rachas([falso(true), x, falso(true)]).racha, 1);
});

test("rachas: récord", () => {
  const r = dias.rachas([
    falso(true),
    falso(true),
    falso(true),
    falso(false),
    falso(true),
  ]);
  assert.deepEqual([r.racha, r.record], [1, 3]);
});

test("historial: cruza mes, año y horario", () => {
  const vacio = m.emptyData();
  assert.deepEqual(
    dias.historial(vacio, "2030-12-30", "2031-01-02").map((x) => x.dia),
    ["2030-12-30", "2030-12-31", "2031-01-01", "2031-01-02"],
  );
  const sep = dias
    .historial(vacio, "2030-09-01", "2030-09-10")
    .map((x) => x.dia);
  assert.equal(sep.length, 10);
  assert.equal(new Set(sep).size, 10);
  assert.deepEqual([sep[0], sep[9]], ["2030-09-01", "2030-09-10"]);
});

test("semanas12: cuenta nueva empieza en su primera semana", () => {
  const nueva = conItems([item({ createdAt: alas(2030, 4, 1) })]);
  const s = dias.semanas12(nueva, now);
  assert.deepEqual(
    [s[0].dia, s[s.length - 1].dia],
    ["2030-04-29", "2030-05-12"],
  );
  const vieja = conItems([item({ createdAt: alas(2029, 0, 15) })]);
  const v = dias.semanas12(vieja, now);
  assert.deepEqual([v[0].dia, v.length], ["2030-02-18", 84]);
});

test("puntosSemana", () => {
  const d = conItems(
    [],
    [
      { ...premioDe("a", 2030, 4, 5, 23), points: 7 },
      { ...premioDe("b", 2030, 4, 6, 0), points: 10 },
      { ...premioDe("c", 2030, 4, 10), points: 20 },
      { ...premioDe("c", 2030, 4, 8, 12, "c:budget"), points: 999 },
    ],
  );
  assert.equal(dias.puntosSemana(d, now), 30);
});

test("textoDia", () => {
  const base = { sinAgenda: 0, tono: 4, suma: true, descanso: false };
  assert.equal(
    dias.textoDia(
      { ...base, dia: "2030-05-09", tenias: 5, hechas: 4 },
      "2030-05-12",
    ),
    "jueves 9 de may · 4 de 5 (80%)",
  );
  assert.equal(
    dias.textoDia(
      { ...base, dia: "2030-05-09", tenias: 0, hechas: 0, descanso: true },
      "2030-05-12",
    ),
    "Descanso",
  );
  assert.equal(
    dias.textoDia(
      { ...base, dia: "2030-05-09", tenias: 0, hechas: 0, sinAgenda: 2 },
      "2030-05-12",
    ),
    "Sin nada agendado · completaste 2",
  );
  assert.equal(
    dias.textoDia(
      { ...base, dia: "2030-05-12", tenias: 4, hechas: 3 },
      "2030-05-12",
    ),
    "Hoy · 3 de 4 (75%)",
  );
});

test("dias: cuenta vacía", () => {
  const hoy = "2030-05-12";
  assert.deepEqual(dias.rachas(dias.historial(m.emptyData(), hoy, hoy)), {
    racha: 0,
    record: 0,
    hoySuma: false,
  });
});

// ---------- Task 3: tus mesas ----------
const mes = require("../.test-build/progreso/mesas.js");
const enDia = (offset, fields = {}) =>
  item({
    workspaceId: "U",
    scheduledAt: iso(new Date(2030, 4, 12 + offset, 9).getTime()),
    ...fields,
  });
const grupo = (offset, total, hechas) =>
  Array.from({ length: total }, (_, k) =>
    enDia(offset, { status: k < hechas ? "completado" : "pendiente" }),
  );
const conMesa = (items, rewards = []) => ({
  ...m.emptyData(),
  workspaces: [
    ...m.emptyData().workspaces,
    { id: "U", name: "Universidad", color: "#2E9E6B" },
  ],
  items,
  rewards,
});
const ejemplo = () =>
  conMesa([
    ...grupo(0, 5, 5),
    ...grupo(-7, 6, 4),
    ...grupo(-14, 4, 3),
    ...grupo(-21, 5, 2),
  ]);
const diaX = (n) => m.localDay(new Date(2030, 4, 12 + n));

test("mesas: ejemplo de la spec", () => {
  assert.equal(mes.ratingEn(ejemplo(), "U", diaX(0), now), 78);
  assert.deepEqual(mes.ratingMesa(ejemplo(), "U", now), {
    mesaId: "U",
    valor: 78,
    etiqueta: "Sube",
    completadas: 14,
    vencidas: 6,
  });
});

test("mesas: quieta 3 semanas resta 15", () => {
  assert.equal(mes.ratingEn(ejemplo(), "U", diaX(21), now), 63);
});

test("mesas: nueva con menos de 3 es null", () => {
  assert.equal(mes.ratingEn(conMesa(grupo(-1, 2, 2)), "U", diaX(0), now), null);
  assert.equal(mes.ratingMesa(conMesa([]), "U", now).valor, null);
});

test("mesas: etiqueta en +5 y −5", () => {
  assert.equal(mes.etiquetaDe(70, 65), "Sube");
  assert.equal(mes.etiquetaDe(60, 65), "Baja");
  assert.equal(mes.etiquetaDe(69, 65), "Igual");
  assert.equal(mes.etiquetaDe(null, 65), null);
  assert.equal(mes.etiquetaDe(70, null), null);
});

test("mesas: General no tiene rating", () => {
  assert.deepEqual(
    mes.ratings(ejemplo(), now).map((r) => r.mesaId),
    ["U"],
  );
});

test("mesas: sin fecha completadas suman el día de sus puntos", () => {
  const sinFecha = item({ id: "s", workspaceId: "U", status: "completado" });
  const d = conMesa(
    [...grupo(-2, 2, 0), sinFecha],
    [premioDe("s", 2030, 4, 11)],
  );
  assert.equal(mes.ratingEn(d, "U", diaX(0), now), 33);
});

test("mesas: cuenta una vez", () => {
  const doble = enDia(-3, {
    dueAt: iso(new Date(2030, 4, 11, 18).getTime()),
    status: "completado",
  });
  assert.equal(
    mes.ratingEn(conMesa([doble, ...grupo(-2, 2, 0)]), "U", diaX(0), now),
    33,
  );
});

test("mesas: areaSugerida", () => {
  for (const [nombre, area] of [
    ["Universidad", "estudio"],
    ["Tesis de magíster", "estudio"],
    ["GYM", "salud"],
    ["Mi depto", "hogar"],
    ["Cumpleaños", "social"],
    ["Pega", "trabajo"],
    ["Viajes", "personal"],
    ["Clase de yoga", "estudio"],
  ])
    assert.equal(mes.areaSugerida(nombre), area, nombre);
  assert.deepEqual(
    mes.AREAS.map((a) => a.id),
    ["estudio", "trabajo", "salud", "hogar", "social", "personal"],
  );
});

test("mesas: areaDe usa la guardada", () => {
  assert.equal(
    mes.areaDe({
      id: "U",
      name: "Universidad",
      color: "#000000",
      area: "social",
    }),
    "social",
  );
  assert.equal(
    mes.areaDe({ id: "U", name: "Universidad", color: "#000000" }),
    "estudio",
  );
});

test("mesas: cuenta vacía", () => {
  assert.deepEqual(mes.ratings(m.emptyData(), now), []);
});

// ---------- Task 4: logros ----------
const lg = require("../.test-build/progreso/logros.js");
const hechosBase = (fields = {}) => ({
  record: 0,
  semanaPerfecta: false,
  dia100: false,
  listas: 0,
  puntos: 0,
  nivel: 1,
  mesas: 0,
  rutinas: 0,
  metas: 0,
  audio: false,
  plan: false,
  amigos: 0,
  ...fields,
});
const visto = (id, y = 2030, mo = 4, d = 1) => ({
  id,
  at: iso(new Date(y, mo, d, 12).getTime()),
});

test("logros: catálogo de 25 con ids únicos", () => {
  const ids = lg.CATALOGO.map((l) => l.id);
  assert.equal(ids.length, 25);
  assert.equal(new Set(ids).size, 25);
  assert.deepEqual(ids, [...m.LOGRO_IDS]);
});

test("logros: umbrales", () => {
  assert.equal(lg.cumple("racha-7", hechosBase({ record: 6 })), false);
  assert.equal(lg.cumple("racha-7", hechosBase({ record: 7 })), true);
  assert.equal(lg.cumple("listas-10", hechosBase({ listas: 9 })), false);
  assert.equal(lg.cumple("listas-10", hechosBase({ listas: 10 })), true);
  const conPuntos = (p) =>
    hechosBase({ puntos: p, nivel: niv.nivelDe(p).nivel });
  assert.equal(lg.cumple("nivel-5", conPuntos(999)), false);
  assert.equal(lg.cumple("nivel-5", conPuntos(1000)), true);
});

test("logros: se queda aunque se borre lo que lo dio", () => {
  const d = { ...m.emptyData(), logros: [visto("primera-mesa")] };
  const h = lg.hechosDe(d, now);
  assert.equal(h.mesas, 0);
  assert.ok(lg.desbloqueados(d, h).includes("primera-mesa"));
  assert.ok(!lg.porVer(d, h).includes("primera-mesa"));
});

test("logros: desmarcar no quita lo visto", () => {
  let d = m.emptyData();
  const cosas = Array.from({ length: 10 }, (_, k) =>
    item({ id: `c${k}`, status: "completado" }),
  );
  for (const c of cosas) d = m.saveItem(d, c, now);
  const puntos = m.totalPoints(d);
  d = { ...d, logros: [visto("listas-10")] };
  d = m.saveItem(d, { ...cosas[0], status: "pendiente" }, now);
  const h = lg.hechosDe(d, now);
  assert.equal(h.listas, 9);
  assert.ok(lg.desbloqueados(d, h).includes("listas-10"));
  assert.equal(m.totalPoints(d), puntos);
});

test("logros: semana perfecta con descanso al medio", () => {
  const hecho = (dia, extra = {}) =>
    item({
      createdAt: iso(new Date(2030, 4, 4, 8).getTime()),
      scheduledAt: iso(new Date(2030, 4, dia, 10).getTime()),
      status: "completado",
      ...extra,
    });
  const dias100 = [4, 5, 6, 8, 9, 10, 11].map((dia) => hecho(dia));
  assert.equal(
    lg.hechosDe({ ...m.emptyData(), items: dias100 }, now).semanaPerfecta,
    true,
  );
  const conTropiezo = [
    ...dias100,
    hecho(8, { status: "pendiente" }),
    hecho(8),
    hecho(8),
  ];
  const h = lg.hechosDe({ ...m.emptyData(), items: conTropiezo }, now);
  assert.equal(h.semanaPerfecta, false);
  assert.equal(h.dia100, true);
});

test("logros: cola", () => {
  const mesa = { id: "U", name: "Universidad", color: "#2E9E6B" };
  const rutina = m.newGroup("Mañana", "general", {
    repeat: "diario",
    repeatStart: "2030-05-01",
  });
  let d = {
    ...m.emptyData(),
    workspaces: [...m.emptyData().workspaces, mesa],
    groups: [rutina],
  };
  assert.deepEqual(lg.siguiente(d, lg.hechosDe(d, now)), {
    tipo: "uno",
    id: "primera-mesa",
  });
  d = lg.verLogros(d, ["primera-mesa"], now);
  assert.deepEqual(lg.siguiente(d, lg.hechosDe(d, now)), {
    tipo: "uno",
    id: "primera-rutina",
  });
  const cuatro = {
    ...d,
    logros: [],
    items: [
      item({ status: "completado" }),
      item({ type: "Goal", status: "completado" }),
    ],
  };
  assert.deepEqual(lg.siguiente(cuatro, lg.hechosDe(cuatro, now)), {
    tipo: "resumen",
    ids: ["primera-cosa", "primera-mesa", "primera-rutina", "primera-meta"],
    lanzamiento: true,
  });
  const conVisto = { ...cuatro, logros: [visto("racha-3")] };
  assert.equal(
    lg.siguiente(conVisto, lg.hechosDe(conVisto, now)).lanzamiento,
    false,
  );
  assert.equal(
    lg.siguiente(m.emptyData(), lg.hechosDe(m.emptyData(), now)),
    null,
  );
});

test("logros: avance y textos", () => {
  const h = hechosBase({ record: 12, puntos: 3140, nivel: 8, listas: 187 });
  assert.deepEqual(lg.avance("racha-30", h), { valor: 0.4, texto: "12/30" });
  assert.equal(lg.avance("nivel-10", h).texto, "70%");
  assert.equal(lg.avance("listas-1000", h).texto, "187/1.000");
  assert.deepEqual(lg.avance("primer-audio", h), {
    valor: 0,
    texto: "Pendiente",
  });
  assert.deepEqual(lg.avance("racha-7", h), { valor: 1, texto: "Logrado" });
  assert.equal(
    lg.CATALOGO.find((l) => l.id === "listas-1000").nombre,
    "1.000 cosas listas",
  );
});

test("logros: paraPerfil", () => {
  const h = hechosBase({ record: 12, puntos: 3140, nivel: 8, listas: 9 });
  const d = {
    ...m.emptyData(),
    logros: [
      visto("primera-cosa", 2030, 4, 1),
      visto("primera-mesa", 2030, 4, 5),
      visto("primera-rutina", 2030, 4, 3),
      visto("primera-meta", 2030, 4, 9),
      visto("primer-audio", 2030, 4, 7),
    ],
  };
  // Con récord 12 y nivel 8 también cumplen racha-3/7 y nivel-5: son de hoy.
  const r = lg.paraPerfil(d, h, now);
  assert.equal(r.length, 8);
  assert.deepEqual(
    r.slice(0, 4).map((x) => [x.id, x.logrado]),
    [
      ["racha-3", true],
      ["racha-7", true],
      ["nivel-5", true],
      ["primera-meta", true],
    ],
  );
  assert.deepEqual(
    r.slice(4).map((x) => [x.id, x.logrado]),
    [
      ["listas-10", false],
      ["racha-14", false],
      ["nivel-10", false],
      ["racha-30", false],
    ],
  );
  const uno = lg.paraPerfil(
    { ...m.emptyData(), logros: [visto("primera-mesa")] },
    hechosBase(),
    now,
  );
  assert.equal(uno.length, 8);
  assert.deepEqual(
    uno.filter((x) => x.logrado).map((x) => x.id),
    ["primera-mesa"],
  );
});

test("logros: verLogros no duplica", () => {
  let d = lg.verLogros(m.emptyData(), ["primera-mesa"], now);
  d = lg.verLogros(d, ["primera-mesa", "racha-3"], now);
  assert.deepEqual(
    d.logros.map((v) => v.id),
    ["primera-mesa", "racha-3"],
  );
  assert.equal(d.logros[0].at, iso(now));
});

test("logros: primer amigo", () => {
  const d = m.emptyData();
  assert.equal(lg.cumple("primer-amigo", lg.hechosDe(d, now, 0)), false);
  assert.equal(lg.cumple("primer-amigo", lg.hechosDe(d, now, 1)), true);
  assert.equal(lg.avance("primer-amigo", lg.hechosDe(d, now, 0)).texto, "Pendiente");
  const logro = lg.CATALOGO.find((l) => l.id === "primer-amigo");
  assert.equal(logro.familia, "primeras");
  assert.equal(logro.icono, "people-outline");
  assert.equal(logro.frase, "Te hiciste amigo de alguien en Nekal.");
  assert.equal(logro.pista, "Agrega a alguien con su código.");
});

test("logros: primer amigo visto se queda sin amigos", () => {
  const d = { ...m.emptyData(), logros: [visto("primer-amigo")] };
  const h = lg.hechosDe(d, now, 0);
  assert.ok(lg.desbloqueados(d, h).includes("primer-amigo"));
  assert.ok(!lg.porVer(d, h).includes("primer-amigo"));
});

test("logros: cuenta vacía", () => {
  const vacio = m.emptyData();
  assert.deepEqual(lg.desbloqueados(vacio, lg.hechosDe(vacio, now)), []);
});

test("dias: la historia empieza en la primera cosa con fecha, aunque se creara hoy", () => {
  const creadaHoy = iso(now - 3600000);
  const d = conItems(
    [9, 10, 11].map((dia) =>
      conHora(2030, 4, dia, { createdAt: creadaHoy, status: "completado" }),
    ),
  );
  assert.equal(des.desdeElDia1(d, now).dia1, "2030-05-12");
  assert.equal(dias.inicioHistoria(d, now), "2030-05-09");
  assert.equal(dias.semanas12(d, now)[0].dia, "2030-05-06");
  assert.equal(lg.hechosDe(d, now).record, 3);
});

test("logros: el modal espera la primera sincronización y las hojas", () => {
  const nube = require("../.test-build/estadosNube.js");
  const base = {
    hojas: 0,
    grabando: false,
    planAbierto: false,
    conCuenta: true,
    estadoNube: "Sincronizado automáticamente",
  };
  assert.equal(lg.listoParaLogro(base), true);
  assert.equal(
    lg.listoParaLogro({ ...base, estadoNube: nube.CONECTANDO }),
    false,
  );
  assert.equal(
    lg.listoParaLogro({ ...base, estadoNube: nube.SINCRONIZANDO }),
    false,
  );
  assert.equal(
    lg.listoParaLogro({ ...base, conCuenta: false, estadoNube: "Modo local" }),
    true,
  );
  assert.equal(lg.listoParaLogro({ ...base, hojas: 1 }), false);
  assert.equal(lg.listoParaLogro({ ...base, grabando: true }), false);
  assert.equal(lg.listoParaLogro({ ...base, planAbierto: true }), false);
});

test("progreso: los eventos de Google/Outlook no cuentan para tus días", () => {
  const ahora = new Date(2026, 10, 16, 20, 0).getTime();
  const origen = {
    proveedor: "google",
    cuenta: "a@b.cl",
    calendario: "primary",
    idExterno: "e1",
    version: "v1",
    firma: "[]",
    creadoEn: "fuera",
    diaCompleto: false,
    soloLectura: false,
  };
  const tarea = item({ id: "t", startDate: "2026-11-16", scheduledAt: new Date(2026, 10, 16, 10, 0).toISOString(), status: "completado" });
  const reunion = item({ id: "r", type: "Evento", startDate: "2026-10-01", scheduledAt: new Date(2026, 10, 16, 15, 0).toISOString(), origen });
  const viejo = item({ id: "v", type: "Evento", startDate: "2026-10-01", scheduledAt: new Date(2026, 10, 2, 9, 0).toISOString(), origen: { ...origen, idExterno: "e2" } });
  const d = { ...m.emptyData(), items: [tarea, reunion, viejo] };
  assert.deepEqual(dias.cosasDelDia(d, "2026-11-16").map((i) => i.id), ["t"]);
  assert.equal(dias.inicioHistoria(d, ahora) <= "2026-11-02", false);
});
