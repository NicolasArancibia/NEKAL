const { test } = require("node:test");
const assert = require("node:assert/strict");
const pr = require("../.test-build/acomodo/proyeccion.js");

const pick = (p) => ({
  x: Math.round(p.x * 1e9) / 1e9,
  y: Math.round(p.y * 1e9) / 1e9,
});
const c = { giro: 0, inclinacion: 0.95, zoom: 1, cx: 150, cy: 200 };

test("proyección: el origen cae en el centro", () =>
  assert.deepEqual(pick(pr.proyectar({ x: 0, y: 0, z: 0 }, c)), {
    x: 150,
    y: 200,
  }));
test("proyección: subir en z sube en pantalla", () =>
  assert.ok(pr.proyectar({ x: 0, y: 0, z: 10 }, c).y < 200));
test("proyección: girar 90° lleva x a y", () => {
  const g = pr.proyectar({ x: 10, y: 0, z: 0 }, { ...c, giro: Math.PI / 2 });
  assert.ok(Math.abs(g.x - 150) < 1e-9);
  assert.ok(g.y > 200);
});
test("proyección: más cerca = mayor profundidad", () => {
  const lejos = pr.proyectar({ x: 0, y: -50, z: 0 }, c);
  const cerca = pr.proyectar({ x: 0, y: 50, z: 0 }, c);
  assert.ok(cerca.profundidad > lejos.profundidad);
  const alto = pr.proyectar({ x: 0, y: 0, z: 20 }, c);
  assert.ok(
    alto.profundidad > pr.proyectar({ x: 0, y: 0, z: 0 }, c).profundidad,
  );
});
test("ordenarPorProfundidad: de lejos a cerca", () =>
  assert.deepEqual(
    pr
      .ordenarPorProfundidad([
        { id: "b", profundidad: 5 },
        { id: "a", profundidad: -3 },
        { id: "c", profundidad: 9 },
      ])
      .map((p) => p.id),
    ["a", "b", "c"],
  ));

const co = require("../.test-build/colores.js");
test("colores: tonos de un violeta", () => {
  const t = co.tonos("#7546EC");
  assert.equal(t.base, "#7546ec");
  // 88 % de blanco: 0x75 + (255 − 0x75) · 0.88 = 238.4 → ee
  assert.equal(t.suave, "#eee9fd");
  assert.equal(t.bordeOscuro, "#5835b1");
  assert.equal(t.bordeClaro, "#9874f1");
  assert.match(t.zona, /^#[0-9a-f]{6}$/);
  assert.match(t.zonaInterna, /^#[0-9a-f]{6}$/);
});
test("colores: acepta #abc y rechaza basura", () => {
  assert.equal(co.tonos("#fff").base, "#ffffff");
  assert.throws(() => co.tonos("violeta"));
});

// ---- Tiempo ----
const m = require("../.test-build/model.js");
const ti = require("../.test-build/acomodo/tiempo.js");
const ahora = new Date(2030, 4, 3, 10, 0).getTime(); // vie 3 may 2030
const en = (dia, h = 10) => new Date(2030, 4, dia, h, 0).toISOString();
const cosa = (fields = {}) => ({
  ...m.newItem(),
  title: "Cosa",
  startDate: "2030-04-01",
  ...fields,
});
const conMesas = (items) => ({
  ...m.emptyData(),
  workspaces: [
    ...m.emptyData().workspaces,
    { id: "t", name: "Trabajo", color: "#3366ff" },
    { id: "a", name: "Arte", color: "#ff6633" },
  ],
  items,
});
const radio = (n, lado) => Math.hypot(n.x - lado / 2, n.y - lado / 2);

test("tiempo: hoy en el anillo de hoy", () => {
  const d = conMesas([
    cosa({ id: "hoy", scheduledAt: en(3, 18) }),
    cosa({ id: "atrasada", dueAt: en(1) }),
    cosa({ id: "manana", dueAt: en(4) }),
    cosa({ id: "lejos", dueAt: en(20) }),
  ]);
  const r = ti.acomodoTiempo(d, "semana", ahora, 300);
  const n = Object.fromEntries(r.nodos.map((x) => [x.id, x]));
  assert.deepEqual(Object.keys(n).sort(), ["atrasada", "hoy", "manana"]);
  assert.equal(n.hoy.anillo, "hoy");
  assert.equal(n.atrasada.anillo, "hoy");
  assert.equal(n.manana.anillo, "manana");
  assert.ok(Math.abs(radio(n.hoy, 300) - r.radios.hoy) < 1e-6);
  assert.ok(Math.abs(radio(n.manana, 300) - r.radios.manana) < 1e-6);
  assert.equal(n.hoy.estado, "hoy");
});
test("tiempo: notas e ideas no aparecen", () => {
  const d = conMesas([
    cosa({ id: "n", type: "Nota" }),
    cosa({ id: "i", type: "Idea" }),
    cosa({ id: "s" }),
  ]);
  const r = ti.acomodoTiempo(d, "semana", ahora, 300);
  assert.deepEqual(r.nodos.map((x) => [x.id, x.anillo]), [["s", "sinFecha"]]);
});
test("tiempo: todo reparte hasta 30 días y lo posterior va al borde", () => {
  const d = conMesas([
    cosa({ id: "d2", dueAt: en(5) }),
    cosa({ id: "d30", dueAt: new Date(2030, 5, 2, 10).toISOString() }),
    cosa({ id: "d90", dueAt: new Date(2030, 7, 1, 10).toISOString() }),
  ]);
  const r = ti.acomodoTiempo(d, "todo", ahora, 300);
  const n = Object.fromEntries(r.nodos.map((x) => [x.id, radio(x, 300)]));
  assert.ok(Math.abs(n.d2 - r.radios.ventanaDesde) < 1e-6);
  assert.ok(Math.abs(n.d30 - r.radios.ventanaHasta) < 1e-6);
  assert.ok(Math.abs(n.d90 - r.radios.ventanaHasta) < 1e-6);
});
test("tiempo: sector de cada mesa con mínimo 30°", () => {
  const d = conMesas([
    ...Array.from({ length: 10 }, () => cosa({ dueAt: en(3) })),
    cosa({ workspaceId: "a", dueAt: en(3) }),
  ]);
  const s = ti.sectores(d);
  assert.deepEqual(s.map((x) => x.workspaceId), ["general", "a", "t"]);
  assert.equal(s[0].desde, 0);
  assert.equal(s.at(-1).hasta, 360);
  for (let k = 1; k < s.length; k++) assert.equal(s[k].desde, s[k - 1].hasta);
  for (const x of s) assert.ok(x.hasta - x.desde >= 30 - 1e-9);
  assert.ok(s[0].hasta - s[0].desde > s[1].hasta - s[1].desde);
});
test("tiempo: sin solapes en un mismo anillo", () => {
  const d = conMesas([
    ...Array.from({ length: 14 }, (_, k) => cosa({ id: `g${k}`, scheduledAt: en(3, 8 + (k % 10)) })),
    ...Array.from({ length: 6 }, (_, k) => cosa({ id: `t${k}`, workspaceId: "t", dueAt: en(3, 12) })),
    ...Array.from({ length: 9 }, (_, k) => cosa({ id: `v${k}`, dueAt: en(5 + (k % 4)) })),
  ]);
  const r = ti.acomodoTiempo(d, "semana", ahora, 375);
  for (const anillo of ["hoy", "ventana"]) {
    const ns = r.nodos.filter((x) => x.anillo === anillo);
    for (let a = 0; a < ns.length; a++)
      for (let b = a + 1; b < ns.length; b++)
        assert.ok(
          Math.hypot(ns[a].x - ns[b].x, ns[a].y - ns[b].y) >= 14 - 1e-6,
          `${ns[a].id} y ${ns[b].id} se tocan`,
        );
  }
  assert.equal(r.nodos.length, 29);
});
test("tiempo: diaDesdeRadio encaja por día", () => {
  const rs = ti.radiosPara(300);
  assert.deepEqual(
    [rs.centro, rs.hoy, rs.manana, rs.ventanaDesde, rs.ventanaHasta, rs.sinFecha].map((x) => Math.round(x * 10) / 10),
    [21, 42, 72, 90, 120, 141],
  );
  const dia = (r, v = "semana") => ti.diaDesdeRadio(r, rs, v, ahora);
  assert.equal(dia(5), "2030-05-03");
  assert.equal(dia(42), "2030-05-03");
  assert.equal(dia(72), "2030-05-04");
  assert.equal(dia(90), "2030-05-05");
  assert.equal(dia(105), "2030-05-07");
  assert.equal(dia(120), "2030-05-09");
  assert.equal(dia(120, "2semanas"), "2030-05-16");
  assert.equal(dia(141), "");
});
test("tiempo: cuenta vacía", () => {
  const r = ti.acomodoTiempo(m.emptyData(), "semana", ahora, 300);
  assert.deepEqual(r.nodos, []);
  assert.deepEqual(r.sectores, [{ workspaceId: "general", desde: 0, hasta: 360 }]);
});

// ---- Plano ----
const pl = require("../.test-build/acomodo/plano.js");
const g = (id, fields = {}) => ({ ...m.newGroup(id, "general"), id, ...fields });
const muchas = (n, fields) =>
  Array.from({ length: n }, (_, k) => cosa({ id: `${fields.groupId || fields.workspaceId}-${k}`, x: k, ...fields }));
const dentroDe = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

test("plano: General primero y mesas en 2 columnas", () => {
  const d = {
    ...conMesas([
      cosa({ id: "s3", x: 2 }),
      cosa({ id: "s1", x: 0 }),
      cosa({ id: "s2", x: 1 }),
      ...muchas(2, { groupId: "casa" }),
      ...muchas(14, { workspaceId: "t", groupId: "lan" }),
      ...muchas(8, { workspaceId: "t", groupId: "ope" }),
      ...muchas(9, { workspaceId: "a" }),
    ]),
    groups: [
      g("casa", { name: "Casa" }),
      g("ope", { name: "Operación", workspaceId: "t" }),
      g("lan", { name: "Lanzamiento", workspaceId: "t" }),
    ],
  };
  const r = pl.acomodoPlanoLejos(d, "semana", ahora, 300);
  assert.deepEqual(r.sueltas.map((i) => i.id), ["s1", "s2"]);
  assert.equal(r.masSueltas, 1);
  assert.deepEqual(r.zonas.map((z) => [z.id, z.tipo, z.total]), [
    ["casa", "grupo", 2],
    ["a", "mesa", 9],
    ["t", "mesa", 22],
  ]);
  const ancho = (300 - 2 * 12 - 8) / 2;
  const [casa, arte, trabajo] = r.zonas;
  assert.deepEqual([casa.rect.x, arte.rect.x, casa.rect.w], [12, 12 + ancho + 8, ancho]);
  assert.equal(casa.rect.y, arte.rect.y);
  assert.equal(casa.rect.h, 76);
  assert.ok(Math.abs(trabajo.rect.h - 38 * Math.sqrt(22)) < 1e-6);
  assert.equal(trabajo.rect.x, 12); // va a la columna más corta
  assert.deepEqual(trabajo.hijos.map((z) => [z.nombre, z.total]), [["Lanzamiento", 14], ["Operación", 8]]);
  for (const z of r.zonas) assert.ok(r.alto >= z.rect.y + z.rect.h);
});
test("plano: puntos deterministas y dentro de su zona", () => {
  const ids = Array.from({ length: 12 }, (_, k) => `p${k}`);
  const rect = { x: 10, y: 20, w: 150, h: 100 };
  const a = pl.puntosEn(ids, rect, () => "on");
  assert.deepEqual(pl.puntosEn(ids, rect, () => "on"), a);
  for (const p of a)
    assert.ok(((p.x - 85) / 75) ** 2 + ((p.y - 70) / 50) ** 2 <= 1 + 1e-9);
  for (let i = 0; i < a.length; i++)
    for (let j = i + 1; j < a.length; j++)
      assert.ok(Math.hypot(a[i].x - a[j].x, a[i].y - a[j].y) >= 8);
  const d = conMesas([...muchas(30, { workspaceId: "t" }), ...muchas(3, { workspaceId: "a" })]);
  for (const z of pl.acomodoPlanoLejos(d, "semana", ahora, 375).zonas)
    for (const p of z.puntos) assert.ok(dentroDe(p, z.rect));
});
test("plano: grilla ordenada por x", () => {
  const d = conMesas([cosa({ id: "a", x: 1 }), cosa({ id: "b", x: 2 }), cosa({ id: "c", x: 0 })]);
  const r = pl.acomodoPlanoCerca(d, { workspaceId: "general", groupId: "" }, 300);
  const w = (300 - 2 * 12 - 8) / 2;
  assert.deepEqual(r.sueltas, [
    { id: "c", rect: { x: 12, y: 8, w, h: 50 } },
    { id: "a", rect: { x: 12 + w + 8, y: 8, w, h: 50 } },
    { id: "b", rect: { x: 12, y: 66, w, h: 50 } },
  ]);
});
test("plano: tope de fichas", () => {
  const d = { ...conMesas(muchas(60, { workspaceId: "t", groupId: "G" })), groups: [g("G", { workspaceId: "t" })] };
  const [z] = pl.acomodoPlanoCerca(d, { workspaceId: "t", groupId: "" }, 375).zonas;
  assert.equal(pl.TOPE_FICHAS, 8);
  assert.deepEqual([z.fichas.length, z.mas], [8, 52]);
  assert.deepEqual(z.fichas.map((f) => f.id), muchas(8, { groupId: "G" }).map((i) => i.id));
});
test("plano: subgrupo debajo de su padre", () => {
  const d = {
    ...conMesas([...muchas(3, { groupId: "A" }), ...muchas(1, { groupId: "B" })]),
    groups: [g("A", { name: "A" }), g("B", { name: "B", parentId: "A" })],
  };
  const r = pl.acomodoPlanoCerca(d, { workspaceId: "general", groupId: "" }, 300);
  const [a] = r.zonas;
  const [b] = a.hijos;
  const ultima = a.fichas.at(-1).rect;
  assert.ok(b.rect.y >= ultima.y + ultima.h);
  assert.ok(b.rect.x > a.rect.x && b.rect.x + b.rect.w < a.rect.x + a.rect.w);
  assert.ok(b.rect.y + b.rect.h <= a.rect.y + a.rect.h);
  assert.deepEqual(b.fichas.map((f) => f.id), ["B-0"]);
  assert.ok(r.alto >= a.rect.y + a.rect.h);
});
test("plano: indiceEn al soltar entre dos fichas", () => {
  const d = conMesas(muchas(3, { workspaceId: "general" }));
  const r = pl.acomodoPlanoCerca(d, { workspaceId: "general", groupId: "" }, 300);
  const z = { fichas: r.sueltas };
  assert.equal(pl.indiceEn(z, 5, 2), 0);
  assert.equal(pl.indiceEn(z, 150, 30), 1);
  assert.equal(pl.indiceEn(z, 40, 100), 2);
  assert.equal(pl.indiceEn(z, 290, 200), 3);
});
test("plano: cuenta vacía", () => {
  const lejos = pl.acomodoPlanoLejos(m.emptyData(), "semana", ahora, 375);
  assert.deepEqual([lejos.sueltas, lejos.masSueltas, lejos.zonas], [[], 0, []]);
  const cerca = pl.acomodoPlanoCerca(m.emptyData(), { workspaceId: "general", groupId: "" }, 375);
  assert.deepEqual([cerca.sueltas, cerca.zonas], [[], []]);
  assert.ok(lejos.alto >= 0 && cerca.alto >= 0);
});

// ---- Mesas ----
const me = require("../.test-build/acomodo/mesas.js");
const arriba = { workspaceId: "general", ruta: [] };
const centro = (p) => ({ x: p.x + p.w / 2, y: p.y + p.h / 2 });
const tres = () => ({
  ...conMesas([
    cosa({ id: "s1" }),
    ...muchas(4, { workspaceId: "t" }),
    ...muchas(2, { workspaceId: "a" }),
    ...muchas(3, { workspaceId: "e" }),
  ]),
  workspaces: [
    ...conMesas([]).workspaces,
    { id: "e", name: "Estudios", color: "#2e9e6b" },
  ],
});

test("mesas: General arriba y mesas debajo en el mismo eje", () => {
  const { pisos } = me.acomodoMesas(tres(), arriba, "semana", ahora);
  const general = pisos.find((p) => p.id === "general");
  assert.deepEqual([general.tipo, general.z, general.vidrio], ["general", 0, false]);
  assert.deepEqual(centro(general), { x: 0, y: 0 });
  assert.deepEqual(general.cubitos.map((c) => c.id), ["s1"]);
  const mesas = pisos.filter((p) => p.tipo === "mesa");
  assert.deepEqual(mesas.map((p) => p.id).sort(), ["a", "e", "t"]);
  for (const p of mesas) assert.equal(p.z, -150);
  const xs = mesas.map((p) => centro(p).x),
    ys = mesas.map((p) => centro(p).y);
  assert.ok(Math.abs(Math.min(...xs) + Math.max(...xs)) < 1e-9);
  assert.ok(Math.abs(Math.min(...ys) + Math.max(...ys)) < 1e-9);
  assert.equal(mesas.find((p) => p.id === "t").puntos.length, 4);
  assert.deepEqual(mesas.find((p) => p.id === "t").cubitos, []);
});
test("mesas: tamaño acotado", () => {
  assert.equal(me.tamanoPiso(0), 120);
  assert.equal(me.tamanoPiso(9), 188);
  assert.equal(me.tamanoPiso(500), 260);
  const d = {
    ...m.emptyData(),
    workspaces: [
      ...m.emptyData().workspaces,
      ...Array.from({ length: 25 }, (_, k) => ({ id: `w${k}`, name: `Mesa ${k}`, color: "#3366ff" })),
    ],
    items: muchas(60, { workspaceId: "w0" }),
  };
  const { pisos } = me.acomodoMesas(d, arriba, "semana", ahora);
  assert.equal(pisos.length, 26);
  for (const p of pisos) assert.ok(p.w <= 260 && p.h <= 260);
  const nivel = pisos.filter((p) => p.z === -150);
  for (let i = 0; i < nivel.length; i++)
    for (let j = i + 1; j < nivel.length; j++) {
      const a = nivel[i], b = nivel[j];
      assert.ok(
        a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y,
        `${a.id} y ${b.id} se tapan`,
      );
    }
});
test("mesas: altura = carga y nota plana", () => {
  assert.equal(me.altoCubito(0), 1);
  assert.equal(me.altoCubito(0.25), 3);
  assert.equal(me.altoCubito(9), 20);
  assert.equal(me.altoCubito(100), 26);
  assert.deepEqual(
    [me.grosorPiso(0, "mesa"), me.grosorPiso(1000, "general"), me.grosorPiso(0, "grupo"), me.grosorPiso(1000, "rutina")],
    [10, 24, 5, 10],
  );
  assert.ok(me.grosorPiso(8, "mesa") > me.grosorPiso(2, "mesa"));
  const d = conMesas([
    cosa({ id: "nota", type: "Nota", x: 0 }),
    cosa({ id: "dura", type: "Meeting", difficulty: 3, duration: 180, x: 1 }),
  ]);
  const [general] = me.acomodoMesas(d, arriba, "semana", ahora).pisos;
  assert.deepEqual(general.cubitos.map((c) => [c.id, c.alto]), [["nota", 1], ["dura", 20]]);
  const [a, b] = general.cubitos;
  assert.equal(b.x - a.x, 56);
  assert.equal(a.lado, 48);
});
test("mesas: en una mesa, General es vidrio y aparecen sus grupos", () => {
  const d = {
    ...tres(),
    groups: [g("lan", { workspaceId: "t", name: "Lanzamiento" })],
  };
  d.items.push(cosa({ id: "l1", workspaceId: "t", groupId: "lan" }));
  const { pisos, cables } = me.acomodoMesas(d, { workspaceId: "t", ruta: [] }, "semana", ahora);
  const p = Object.fromEntries(pisos.map((x) => [x.id, x]));
  assert.deepEqual([p.general.vidrio, p.general.cubitos, p.general.puntos], [true, [], []]);
  assert.deepEqual([p.t.vidrio, p.t.z], [false, -150]);
  assert.deepEqual(p.t.cubitos.map((c) => c.id), ["t-0", "t-1", "t-2", "t-3"]);
  assert.deepEqual([p.lan.tipo, p.lan.z, p.lan.puntos.map((x) => x.id)], ["grupo", -290, ["l1"]]);
  assert.deepEqual([p.a.vidrio, p.e.vidrio], [true, true]);
  assert.deepEqual(cables, []);
  // Las mesas siguen en el mismo lugar que vistas desde arriba.
  const desdeArriba = me.acomodoMesas(d, arriba, "semana", ahora).pisos.find((x) => x.id === "t");
  assert.deepEqual([p.t.x, p.t.y], [desdeArriba.x, desdeArriba.y]);
  const sub = centro(p.lan), padre = centro(p.t);
  assert.ok(Math.hypot(sub.x - padre.x, sub.y - padre.y) < 1e-9);
});
test("mesas: mesa conectada sólida y con cable", () => {
  const d = tres();
  d.items.find((i) => i.id === "t-1").dependencies = ["a-0"];
  const { pisos, cables } = me.acomodoMesas(d, { workspaceId: "t", ruta: [] }, "semana", ahora);
  const p = Object.fromEntries(pisos.map((x) => [x.id, x]));
  assert.deepEqual([p.a.vidrio, p.e.vidrio], [false, true]);
  assert.equal(p.a.puntos.length, 2);
  assert.equal(cables.length, 1);
  const cubo = p.t.cubitos.find((c) => c.id === "t-1");
  const punto = p.a.puntos.find((x) => x.id === "a-0");
  assert.deepEqual(cables[0].hasta, { x: punto.x, y: punto.y, z: -150 });
  assert.deepEqual(cables[0].desde, { x: cubo.x + cubo.lado / 2, y: cubo.y + cubo.lado / 2, z: -150 + cubo.alto });
});
test("mesas: elegir cubito antes que piso", () => {
  const d = conMesas([cosa({ id: "c1", type: "Meeting", difficulty: 2, duration: 60 })]);
  const { pisos } = me.acomodoMesas(d, arriba, "semana", ahora);
  const cam = { giro: 0.4, inclinacion: 0.95, zoom: 1, cx: 200, cy: 300 };
  const [general] = pisos;
  const c = general.cubitos[0];
  const arribaDelCubo = pr.proyectar({ x: c.x + c.lado / 2, y: c.y + c.lado / 2, z: c.alto }, cam);
  assert.deepEqual(me.elegir(pisos, cam, arribaDelCubo.x, arribaDelCubo.y), { tipo: "cubito", id: "c1" });
  const esquina = pr.proyectar({ x: general.x + general.w - 6, y: general.y + general.h - 6, z: 0 }, cam);
  assert.deepEqual(me.elegir(pisos, cam, esquina.x, esquina.y), { tipo: "piso", id: "general" });
  assert.equal(me.elegir(pisos, cam, -5000, -5000), null);
});
test("mesas: cuenta vacía", () => {
  const { pisos, cables } = me.acomodoMesas(m.emptyData(), arriba, "semana", ahora);
  assert.deepEqual(pisos.map((p) => [p.id, p.cubitos.length, p.puntos.length]), [["general", 0, 0]]);
  assert.deepEqual(cables, []);
});
