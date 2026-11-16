const { test } = require("node:test");
const assert = require("node:assert/strict");
const pase = require("../.test-build/conexiones/pase.js");

const CAL = "https://www.googleapis.com/auth/calendar";
const MAIL = "https://www.googleapis.com/auth/gmail.modify";

test("conexiones: url de Google", () => {
  assert.deepEqual(pase.SCOPES_GOOGLE, [
    "openid",
    "email",
    "profile",
    CAL,
    MAIL,
  ]);
  const url = pase.urlGoogle({
    clientId: "abc",
    redirectUri: "http://localhost:8081",
    state: "g.x1",
  });
  assert.ok(url.startsWith("https://accounts.google.com/o/oauth2/v2/auth?"));
  const q = new URL(url).searchParams;
  assert.equal(q.get("response_type"), "token");
  assert.equal(q.get("client_id"), "abc");
  assert.equal(q.get("redirect_uri"), "http://localhost:8081");
  assert.equal(q.get("state"), "g.x1");
  assert.equal(q.get("include_granted_scopes"), "true");
  assert.equal(q.get("scope"), pase.SCOPES_GOOGLE.join(" "));
  assert.equal(q.get("prompt"), "select_account consent");
  assert.equal(q.get("login_hint"), null);
  const s = new URL(
    pase.urlGoogle({
      clientId: "abc",
      redirectUri: "http://localhost:8081",
      state: "g.x1",
      silencioso: true,
      loginHint: "a@b.cl",
    }),
  ).searchParams;
  assert.equal(s.get("prompt"), "none");
  assert.equal(s.get("login_hint"), "a@b.cl");
});

test("conexiones: vuelta válida", () => {
  const v = pase.leerVuelta(
    `#access_token=T&expires_in=3599&scope=openid%20${encodeURIComponent(CAL)}&state=g.x1`,
    "g.x1",
    1000,
  );
  assert.deepEqual(v, {
    ok: true,
    pase: { token: "T", vence: 1000 + 3599000, scopes: ["openid", CAL] },
  });
});

test("conexiones: vuelta rechazada", () => {
  assert.deepEqual(
    pase.leerVuelta("#access_token=T&expires_in=10&state=g.otro", "g.x1", 0),
    { ok: false, error: "state" },
  );
  assert.deepEqual(pase.leerVuelta("#access_token=T&state=g.x1", "", 0), {
    ok: false,
    error: "state",
  });
  assert.deepEqual(
    pase.leerVuelta("#error=access_denied&state=g.x1", "g.x1", 0),
    {
      ok: false,
      error: "cancelado",
    },
  );
  for (const e of ["interaction_required", "login_required"])
    assert.deepEqual(pase.leerVuelta(`#error=${e}&state=g.x1`, "g.x1", 0), {
      ok: false,
      error: "necesita_toque",
    });
  assert.deepEqual(pase.leerVuelta("#state=g.x1", "g.x1", 0), {
    ok: false,
    error: "sin_pase",
  });
  assert.equal(pase.leerVuelta("", "g.x1", 0), null);
  assert.equal(pase.leerVuelta("#code=abc&state=zz", "g.x1", 0), null);
});

test("conexiones: permisos", () => {
  assert.deepEqual(pase.permisosGoogle(pase.SCOPES_GOOGLE), {
    calendario: true,
    correo: true,
  });
  assert.deepEqual(pase.permisosGoogle(["openid", CAL]), {
    calendario: true,
    correo: false,
  });
});

const est = require("../.test-build/conexiones/estado.js");
const cuenta = (proveedor, correo, extra = {}) => ({
  proveedor,
  correo,
  nombre: "Sofía",
  desde: "2026-11-14T10:00:00.000Z",
  ...extra,
});

test("conexiones: agregar sin duplicar", () => {
  let c = est.agregarCuenta(est.CONEXIONES_VACIAS, cuenta("google", "a@b.cl"));
  c = est.agregarCuenta(
    c,
    cuenta("google", "a@b.cl", { nombre: "Sofi", desde: "2030-01-01" }),
  );
  assert.equal(c.cuentas.length, 1);
  assert.equal(c.cuentas[0].nombre, "Sofi");
  assert.equal(c.cuentas[0].desde, "2026-11-14T10:00:00.000Z");
  c = est.agregarCuenta(c, cuenta("microsoft", "a@b.cl"));
  assert.equal(c.cuentas.length, 2);
  assert.deepEqual(est.CONEXIONES_VACIAS, {
    cuentas: [],
    ofrecido: false,
    destinos: [],
  });
});

test("conexiones: quitar", () => {
  const c = {
    cuentas: [cuenta("google", "a@b.cl"), cuenta("microsoft", "a@b.cl")],
    ofrecido: true,
    destinos: ["google:a@b.cl"],
  };
  assert.deepEqual(est.quitarCuenta(c, "google", "a@b.cl"), {
    cuentas: [cuenta("microsoft", "a@b.cl")],
    ofrecido: true,
    destinos: ["microsoft:a@b.cl"],
  });
});

test("conexiones: normalizar", () => {
  for (const v of [undefined, null, "x", { cuentas: "no" }])
    assert.deepEqual(est.normalizarConexiones(v), est.CONEXIONES_VACIAS);
  const r = est.normalizarConexiones({
    cuentas: [
      cuenta("google", "a@b.cl"),
      cuenta("yahoo", "c@d.cl"),
      { proveedor: "google", nombre: "x", desde: "" },
    ],
    ofrecido: true,
  });
  assert.deepEqual(r, {
    cuentas: [cuenta("google", "a@b.cl")],
    ofrecido: true,
    destinos: ["google:a@b.cl"],
  });
  const muchas = Array.from({ length: 8 }, (_, i) => cuenta("google", `${i}@b.cl`));
  assert.equal(est.normalizarConexiones({ cuentas: muchas, ofrecido: false }).cuentas.length, 6);
});

test("conexiones: estado", () => {
  const ahora = 1_000_000;
  const e = (o) => est.estadoCuenta({ correoPermitido: true, ahora, ...o });
  assert.equal(e({ tienePase: false, vence: null }), "activar_aqui");
  assert.equal(e({ tienePase: true, vence: ahora + 30_000 }), "actualizar");
  assert.equal(e({ tienePase: true, vence: ahora + 3_600_000 }), "activa");
  assert.equal(
    e({ tienePase: true, vence: ahora + 3_600_000, correoPermitido: false }),
    "falta_correo",
  );
  assert.equal(e({ tienePase: true, vence: null }), "activa");
  assert.equal(est.TEXTO_ESTADO.actualizar, "Toca para actualizar");
  assert.equal(est.TEXTO_ESTADO.activar_aqui, "Toca para activar aquí");
  assert.equal(est.TEXTO_ESTADO.falta_correo, "Falta permiso de correo");
  assert.equal(est.TEXTO_ESTADO.activa, "Activa");
});

test("conexiones: ofrecer la hoja solo tras la primera sincronización", () => {
  const nube = require("../.test-build/estadosNube.js");
  const o = (extra) =>
    est.ofrecerHoja({
      disponible: true,
      ofrecido: false,
      estadoNube: "Sincronizado",
      forzar: false,
      ...extra,
    });
  assert.equal(o({}), true);
  assert.equal(o({ estadoNube: nube.CONECTANDO }), false);
  assert.equal(o({ estadoNube: nube.SINCRONIZANDO }), false);
  assert.equal(o({ ofrecido: true }), false);
  assert.equal(o({ disponible: false }), false);
  assert.equal(o({ disponible: false, ofrecido: true, forzar: true }), true);
});

test("conexiones: tras un intento silencioso que pide un toque, se reintenta con la pantalla de Google", () => {
  assert.equal(est.trasVuelta("necesita_toque", true), "reintentar");
  assert.equal(est.trasVuelta("necesita_toque", false), "mostrar");
  assert.equal(est.trasVuelta("cancelado", true), "mostrar");
  assert.equal(est.trasVuelta(undefined, true), "mostrar");
});

// V2/H4: espejo del calendario.
const ORIGEN = {
  proveedor: "google",
  cuenta: "a@b.cl",
  calendario: "primary",
  idExterno: "ev1",
  version: '"1"',
  firma: "[]",
  creadoEn: "fuera",
  diaCompleto: false,
  soloLectura: false,
};

test("espejo: destino al conectar y desconectar", () => {
  // El mismo correo puede ser de Google y de Outlook: el destino es «proveedor:correo».
  let c = est.agregarCuenta(est.CONEXIONES_VACIAS, cuenta("google", "a"));
  assert.deepEqual(c.destinos, ["google:a"]);
  c = est.agregarCuenta(c, cuenta("microsoft", "a"));
  assert.deepEqual(c.destinos, ["google:a"]);
  assert.equal(est.claveCuenta(c.cuentas[1]), "microsoft:a");
  c = est.quitarCuenta(c, "google", "a");
  assert.deepEqual(c.destinos, ["microsoft:a"]);
  c = est.quitarCuenta(c, "microsoft", "a");
  assert.deepEqual(c.destinos, []);
  assert.deepEqual(est.normalizarConexiones({ cuentas: [], ofrecido: true }).destinos, []);
});

test("espejo: origen mal formado", () => {
  assert.deepEqual(est.normalizarOrigen(ORIGEN), ORIGEN);
  assert.equal(est.normalizarOrigen({ ...ORIGEN, proveedor: "yahoo" }), undefined);
  assert.equal(est.normalizarOrigen({ ...ORIGEN, creadoEn: "x" }), undefined);
  assert.equal(est.normalizarOrigen({ ...ORIGEN, diaCompleto: "si" }), undefined);
  const { firma, ...sinFirma } = ORIGEN;
  assert.equal(est.normalizarOrigen(sinFirma), undefined);
  assert.equal(est.normalizarOrigen(undefined), undefined);
});

const ev = require("../.test-build/conexiones/eventos.js");
const medianoche = (a, m, d) => new Date(a, m - 1, d).toISOString();

test("espejo: eventos de Google", () => {
  const e = ev.desdeGoogle(
    {
      id: "g1",
      summary: "Clase de Redes",
      location: "Sala 3",
      description: "Traer notebook",
      start: { dateTime: "2026-11-20T10:00:00-03:00" },
      end: { dateTime: "2026-11-20T11:30:00-03:00" },
      etag: '"e1"',
      updated: "2026-11-15T12:00:00.000Z",
      status: "confirmed",
    },
    "primary",
    false,
  );
  assert.deepEqual(e, {
    id: "g1",
    calendario: "primary",
    titulo: "Clase de Redes",
    inicio: "2026-11-20T13:00:00.000Z",
    minutos: 90,
    diaCompleto: false,
    lugar: "Sala 3",
    descripcion: "Traer notebook",
    version: '"e1"',
    actualizado: "2026-11-15T12:00:00.000Z",
    soloLectura: false,
    cancelado: false,
  });
  const dia = ev.desdeGoogle(
    { id: "g2", start: { date: "2026-11-21" }, end: { date: "2026-11-22" }, etag: "x", updated: "2026-11-15T12:00:00.000Z" },
    "feriados",
    true,
  );
  assert.equal(dia.inicio, medianoche(2026, 11, 21));
  assert.equal(dia.diaCompleto, true);
  assert.equal(dia.minutos, 1440);
  assert.equal(dia.titulo, "");
  assert.equal(dia.soloLectura, true);
  assert.equal(ev.desdeGoogle({ id: "g3", status: "cancelled" }, "primary", false), null);
  assert.equal(
    ev.desdeGoogle({ id: "g4", start: { dateTime: "2026-11-20T10:00:00Z" }, end: { dateTime: "2026-11-20T11:00:00Z" }, status: "cancelled" }, "primary", false).cancelado,
    true,
  );
});

test("espejo: eventos de Graph", () => {
  const e = ev.desdeGraph(
    {
      id: "m1",
      subject: "Reunión de equipo",
      location: { displayName: "Sala 3" },
      bodyPreview: "Minuta",
      start: { dateTime: "2026-11-20T13:00:00.0000000", timeZone: "UTC" },
      end: { dateTime: "2026-11-20T14:00:00.0000000", timeZone: "UTC" },
      isAllDay: false,
      changeKey: "ck1",
      lastModifiedDateTime: "2026-11-15T12:00:00Z",
      isCancelled: false,
    },
    "cal1",
    false,
  );
  assert.equal(e.inicio, "2026-11-20T13:00:00.000Z");
  assert.equal(e.minutos, 60);
  assert.equal(e.lugar, "Sala 3");
  assert.equal(e.descripcion, "Minuta");
  assert.equal(e.version, "ck1");
  assert.equal(e.actualizado, "2026-11-15T12:00:00.000Z");
  const dia = ev.desdeGraph(
    { id: "m2", subject: "Viaje", start: { dateTime: "2026-11-21T00:00:00.0000000" }, end: { dateTime: "2026-11-23T00:00:00.0000000" }, isAllDay: true, changeKey: "c", lastModifiedDateTime: "2026-11-15T12:00:00Z" },
    "cal1",
    false,
  );
  assert.equal(dia.inicio, medianoche(2026, 11, 21));
  assert.equal(dia.diaCompleto, true);
  assert.equal(dia.minutos, 2880);
});

test("espejo: campos y cuerpos", () => {
  const base = ev.desdeGoogle(
    { id: "g1", summary: "x".repeat(300), start: { dateTime: "2026-11-20T10:00:00-03:00" }, end: { dateTime: "2026-11-21T12:00:00-03:00" }, etag: "e", updated: "2026-11-15T12:00:00.000Z" },
    "primary",
    false,
  );
  const c = ev.camposDeEvento(base);
  assert.equal(c.title.length, 160);
  assert.equal(c.duration, 1440);
  assert.equal(c.scheduledAt, "2026-11-20T13:00:00.000Z");
  assert.equal(c.startDate, "2026-11-20");
  assert.equal(ev.camposDeEvento({ ...base, titulo: "  " }).title, "(Sin título)");
  assert.equal(ev.camposDeEvento({ ...base, minutos: 0 }).duration, 5);
  const item = { title: "Clase", scheduledAt: "2026-11-20T13:00:00.000Z", duration: 90, location: "Sala", origen: undefined };
  assert.deepEqual(ev.cuerpoGoogle(item), {
    summary: "Clase",
    location: "Sala",
    start: { dateTime: "2026-11-20T13:00:00.000Z" },
    end: { dateTime: "2026-11-20T14:30:00.000Z" },
  });
  const diaItem = { ...item, scheduledAt: medianoche(2026, 11, 21), duration: 1440, origen: { diaCompleto: true } };
  assert.deepEqual(ev.cuerpoGoogle(diaItem).start, { date: "2026-11-21" });
  assert.deepEqual(ev.cuerpoGoogle(diaItem).end, { date: "2026-11-22" });
  assert.deepEqual(ev.cuerpoGraph(item, "America/Santiago"), {
    subject: "Clase",
    location: { displayName: "Sala" },
    start: { dateTime: "2026-11-20T13:00:00.000", timeZone: "UTC" },
    end: { dateTime: "2026-11-20T14:30:00.000", timeZone: "UTC" },
    isAllDay: false,
  });
  assert.deepEqual(ev.cuerpoGraph(diaItem, "America/Santiago").start, {
    dateTime: "2026-11-21T00:00:00",
    timeZone: "America/Santiago",
  });
  const f = (o) => ev.firmaDe({ title: "A", scheduledAt: "2026-11-20T13:00:00.000Z", duration: 60, location: "", diaCompleto: false, ...o });
  assert.notEqual(f({}), f({ scheduledAt: "2026-11-20T14:00:00.000Z" }));
  assert.equal(f({}), f({ status: "completado" }));
  const { desde, hasta } = ev.limitesVentana(new Date(2026, 10, 16, 15, 0).getTime());
  assert.equal(desde, medianoche(2026, 11, 2));
  assert.equal(hasta, medianoche(2027, 1, 15));
});

test("espejo: datos de H3 sin destino eligen la primera cuenta; vacío es «No copiar»", () => {
  const h3 = { cuentas: [cuenta("google", "a"), cuenta("microsoft", "a")], ofrecido: true };
  assert.deepEqual(est.normalizarConexiones(h3).destinos, ["google:a"]);
  assert.deepEqual(est.normalizarConexiones({ ...h3, destinoNekal: "" }).destinos, []);
  assert.deepEqual(est.normalizarConexiones({ cuentas: [], ofrecido: true }).destinos, []);
});

const esp = require("../.test-build/conexiones/espejo.js");
const mod = require("../.test-build/model.js");
const AHORA = new Date(2026, 10, 16, 10, 0).getTime();
const CUENTA = cuenta("google", "a@b.cl");
const evento = (id, extra = {}) => ({
  id,
  calendario: "primary",
  titulo: "Evento " + id,
  inicio: new Date(2026, 10, 20, 10, 0).toISOString(),
  minutos: 60,
  diaCompleto: false,
  lugar: "",
  descripcion: "",
  version: "v1",
  actualizado: "2026-11-15T12:00:00.000Z",
  soloLectura: false,
  cancelado: false,
  ...extra,
});
const plan = (data, eventos, extra = {}) =>
  esp.planDeSincronizacion({
    data,
    eventos,
    cuenta: CUENTA,
    calendarioNekal: null,
    copiarAqui: false,
    ahora: AHORA,
    ...extra,
  });
const vacio = (p) =>
  p.crearEnNekal.length +
  p.actualizarEnNekal.length +
  p.vincular.length +
  p.aPapelera.length +
  p.fuera.length;
const importar = (eventos, data = mod.emptyData()) =>
  esp.aplicarEnNekal(data, CUENTA, plan(data, eventos), AHORA);
const propio = (extra = {}) => ({
  ...mod.newItem("general", "Tarea"),
  title: "Estudiar",
  scheduledAt: new Date(2026, 10, 18, 17, 0).toISOString(),
  startDate: "2026-11-16",
  duration: 60,
  ...extra,
});
const sinDestino = { cuentas: [CUENTA], ofrecido: true, destinos: [] };

test("espejo: importar y reconectar dos veces sin duplicar", () => {
  const eventos = [
    evento("e1"),
    evento("e2", { diaCompleto: true, minutos: 1440 }),
  ];
  const d1 = importar(eventos);
  assert.equal(d1.items.length, 2);
  const i = d1.items.find((x) => x.origen.idExterno === "e1");
  assert.equal(i.type, "Evento");
  assert.equal(i.flexible, false);
  assert.equal(i.countsForScore, false);
  assert.equal(i.workspaceId, "general");
  assert.deepEqual(i.origen, {
    proveedor: "google",
    cuenta: "a@b.cl",
    calendario: "primary",
    idExterno: "e1",
    version: "v1",
    firma: ev.firmaDe({ ...i, diaCompleto: false }),
    creadoEn: "fuera",
    diaCompleto: false,
    soloLectura: false,
  });
  assert.equal(
    d1.items.find((x) => x.origen.idExterno === "e2").origen.diaCompleto,
    true,
  );
  assert.equal(vacio(plan(d1, eventos)), 0);
  const d2 = importar(eventos, importar(eventos, d1));
  assert.equal(d2.items.length, 2);
});

test("espejo: cambio afuera llega a Nekal sin tocar updatedAt", () => {
  const d1 = importar([evento("e1")]);
  const antes = d1.items[0];
  const nuevo = evento("e1", {
    version: "v2",
    inicio: new Date(2026, 10, 20, 15, 0).toISOString(),
  });
  const p = plan(d1, [nuevo]);
  assert.equal(p.actualizarEnNekal.length, 1);
  const d2 = esp.aplicarEnNekal(d1, CUENTA, p, AHORA);
  const i = d2.items[0];
  assert.equal(i.scheduledAt, nuevo.inicio);
  assert.equal(i.origen.version, "v2");
  assert.equal(i.origen.firma, ev.firmaDe({ ...i, diaCompleto: false }));
  assert.equal(i.updatedAt, antes.updatedAt);
  assert.equal(vacio(plan(d2, [nuevo])), 0);
});

test("espejo: lo que mueve Neka (sin updatedAt) se envía afuera", () => {
  const d1 = importar([evento("e1")]);
  const movido = {
    ...d1,
    items: d1.items.map((i) => ({
      ...i,
      scheduledAt: new Date(2026, 10, 20, 16, 0).toISOString(),
    })),
  };
  const p = plan(movido, [evento("e1")]);
  assert.equal(p.fuera.length, 1);
  assert.equal(p.fuera[0].tipo, "actualizar");
  assert.equal(p.fuera[0].cuerpo.scheduledAt, movido.items[0].scheduledAt);
  assert.equal(esp.hayCambiosLocales(movido, sinDestino, AHORA), true);
  assert.equal(esp.hayCambiosLocales(d1, sinDestino, AHORA), false);
});

test("espejo: cambio en ambos lados gana el más reciente", () => {
  const d1 = importar([evento("e1")]);
  const local = (updatedAt) => ({
    ...d1,
    items: d1.items.map((i) => ({ ...i, title: "Local", updatedAt })),
  });
  const afuera = (actualizado) =>
    evento("e1", { version: "v2", titulo: "Afuera", actualizado });
  const p1 = plan(local("2026-11-16T12:00:00.000Z"), [
    afuera("2026-11-16T11:00:00.000Z"),
  ]);
  assert.equal(p1.fuera[0]?.tipo, "actualizar");
  assert.equal(p1.actualizarEnNekal.length, 0);
  const p2 = plan(local("2026-11-16T10:00:00.000Z"), [
    afuera("2026-11-16T11:00:00.000Z"),
  ]);
  assert.equal(p2.actualizarEnNekal.length, 1);
  assert.equal(p2.fuera.length, 0);
});

test("espejo: solo lectura vuelve a como está afuera", () => {
  const d1 = importar([evento("e1", { soloLectura: true })]);
  const editado = {
    ...d1,
    items: d1.items.map((i) => ({ ...i, title: "Cambiado" })),
  };
  const p = plan(editado, [evento("e1", { soloLectura: true })]);
  assert.equal(p.fuera.length, 0);
  assert.equal(p.actualizarEnNekal.length, 1);
  assert.equal(
    esp.aplicarEnNekal(editado, CUENTA, p, AHORA).items[0].title,
    "Evento e1",
  );
});

test("espejo: borrado afuera va a la papelera; fuera de la ventana no se toca", () => {
  const lejos = evento("e9", {
    inicio: new Date(2027, 2, 1, 10, 0).toISOString(),
  });
  const d1 = importar([evento("e1"), lejos]);
  const id1 = d1.items.find((i) => i.origen.idExterno === "e1").id;
  const id9 = d1.items.find((i) => i.origen.idExterno === "e9").id;
  const p = plan(d1, [evento("e1", { cancelado: true })]);
  assert.equal(p.aPapelera.length, 1);
  const d2 = esp.aplicarEnNekal(d1, CUENTA, p, AHORA);
  assert.ok(d2.items.find((i) => i.id === id1).deletedAt);
  assert.equal(d2.items.find((i) => i.id === id9).deletedAt, "");
});

test("espejo: borrado en Nekal se borra afuera y después se suelta el origen", () => {
  const d1 = importar([evento("e1")]);
  const id = d1.items[0].id;
  const borrado = mod.deleteItem(d1, id);
  const p = plan(borrado, [evento("e1")]);
  assert.equal(p.fuera.length, 1);
  assert.equal(p.fuera[0].tipo, "borrar");
  assert.equal(esp.hayCambiosLocales(borrado, sinDestino, AHORA), true);
  const d3 = esp.aplicarResultados(borrado, CUENTA, [
    { itemId: id, ok: true, origen: null },
  ]);
  assert.equal(d3.items[0].origen, undefined);
  assert.equal(vacio(plan(d3, [])), 0);
  const conError = esp.aplicarResultados(borrado, CUENTA, [
    { itemId: id, ok: false, error: "red" },
  ]);
  assert.deepEqual(conError, borrado);
  const ro = importar([evento("e2", { soloLectura: true })]);
  const roBorrado = mod.deleteItem(ro, ro.items[0].id);
  assert.equal(
    plan(roBorrado, [evento("e2", { soloLectura: true })]).fuera.length,
    0,
  );
  assert.equal(esp.hayCambiosLocales(roBorrado, sinDestino, AHORA), false);
});

test("espejo: lo creado en Nekal se copia solo si corresponde", () => {
  const rutina = mod.newGroup("Gimnasio", "general", {
    repeat: "diario",
    repeatStart: "2026-11-16",
  });
  const data = {
    ...mod.emptyData(),
    groups: [rutina],
    items: [
      propio({ id: "t1" }),
      propio({ id: "t2", groupId: rutina.id }),
      propio({ id: "t3", type: "Nota", scheduledAt: "" }),
      propio({ id: "t4", scheduledAt: new Date(2027, 3, 1, 10, 0).toISOString() }),
      propio({ id: "t5", scheduledAt: "" }),
      propio({ id: "t6", deletedAt: "2026-11-16T09:00:00.000Z" }),
    ],
  };
  assert.equal(plan(data, []).fuera.length, 0);
  const p = plan(data, [], { copiarAqui: true });
  assert.deepEqual(
    p.fuera.map((a) => [a.tipo, a.itemId]),
    [["crear", "t1"]],
  );
  const conDestino = { ...sinDestino, destinos: ["google:a@b.cl"] };
  assert.equal(esp.hayCambiosLocales(data, conDestino, AHORA), true);
  assert.equal(esp.hayCambiosLocales(data, sinDestino, AHORA), false);
  const origen = { ...ORIGEN, idExterno: "n1", creadoEn: "nekal" };
  const d2 = esp.aplicarResultados(data, CUENTA, [{ itemId: "t1", ok: true, origen }]);
  assert.deepEqual(d2.items[0].origen, origen);
  assert.equal(plan(d2, [], { copiarAqui: true }).fuera.length, 0);
});

test("espejo: un evento del calendario Nekal se vincula con su tarea en vez de importarse", () => {
  const t = propio({ id: "t1", title: "Estudiar" });
  const data = { ...mod.emptyData(), items: [t] };
  const copia = evento("n1", {
    calendario: "calN",
    titulo: "Estudiar",
    inicio: t.scheduledAt,
  });
  const extra = { calendarioNekal: "calN", copiarAqui: true };
  const p = plan(data, [copia], extra);
  assert.equal(p.crearEnNekal.length, 0);
  assert.equal(p.vincular.length, 1);
  assert.equal(p.fuera.length, 0);
  const d2 = esp.aplicarEnNekal(data, CUENTA, p, AHORA);
  assert.equal(d2.items.length, 1);
  assert.equal(d2.items[0].origen.creadoEn, "nekal");
  assert.equal(d2.items[0].origen.idExterno, "n1");
  assert.equal(vacio(plan(d2, [copia], extra)), 0);
});

const sinc = require("../.test-build/conexiones/sincronizar.js");
// Red falsa: un calendario «primary» con eventos en memoria y lo que se pide afuera.
function redFalsa(o = {}) {
  const r = {
    llamadas: [],
    calendarios: [{ id: "primary", nombre: "Yo", soloLectura: false, esNekal: false }],
    eventos: o.eventos ?? [],
    token: async () => (o.sinPase ? null : "T"),
    leerCalendarios: async () => r.calendarios,
    leerEventos: async () => r.eventos,
    crearCalendarioNekal: async () => {
      r.llamadas.push("crearCalendario");
      r.calendarios.push({ id: "calN", nombre: "Nekal", soloLectura: false, esNekal: true });
      return "calN";
    },
    guardar: async (_t, cal, i, id) => {
      if (o.falla === "guardar") throw new Error(o.error ?? "red");
      r.llamadas.push(["guardar", cal, i.id, id ?? null]);
      return evento(id ?? "nuevo-" + i.id, { calendario: cal, version: "v9", titulo: i.title, inicio: i.scheduledAt });
    },
    borrar: async (_t, cal, id) => {
      r.llamadas.push(["borrar", cal, id]);
    },
  };
  return r;
}
function memoria(data) {
  let d = data;
  return { leer: () => d, change: (f) => { d = f(d); } };
}

test("sincronizar: importa y copia lo de Nekal al calendario «Nekal» (lo crea si falta)", async () => {
  const m = memoria({ ...mod.emptyData(), items: [propio({ id: "t1" })] });
  const red = redFalsa({ eventos: [evento("e1")] });
  const r = await sinc.sincronizarCuenta(CUENTA, { ...m, red, copiarAqui: true, ahora: AHORA });
  assert.equal(r, "ok");
  assert.deepEqual(red.llamadas, ["crearCalendario", ["guardar", "calN", "t1", null]]);
  const d = m.leer();
  assert.equal(d.items.length, 2);
  const t1 = d.items.find((i) => i.id === "t1");
  assert.equal(t1.origen.creadoEn, "nekal");
  assert.equal(t1.origen.calendario, "calN");
  assert.equal(t1.origen.idExterno, "nuevo-t1");
  assert.equal(t1.origen.firma, esp.firmaDeItem(t1));
  // Segunda pasada: el calendario ya existe y la copia vuelve como evento → nada nuevo.
  red.eventos = [evento("e1"), evento("nuevo-t1", { calendario: "calN", version: "v9", titulo: t1.title, inicio: t1.scheduledAt })];
  red.llamadas = [];
  assert.equal(await sinc.sincronizarCuenta(CUENTA, { ...m, red, copiarAqui: true, ahora: AHORA }), "ok");
  assert.deepEqual(red.llamadas, []);
  assert.equal(m.leer().items.length, 2);
});

test("sincronizar: sin pase no toca nada", async () => {
  const m = memoria(mod.emptyData());
  const red = redFalsa({ sinPase: true, eventos: [evento("e1")] });
  assert.equal(await sinc.sincronizarCuenta(CUENTA, { ...m, red, copiarAqui: true, ahora: AHORA }), "pase");
  assert.equal(m.leer().items.length, 0);
});

test("sincronizar: si el pase vence a mitad, lo importado queda y avisa «pase»", async () => {
  const m = memoria({ ...mod.emptyData(), items: [propio({ id: "t1" })] });
  const red = redFalsa({ eventos: [evento("e1")], falla: "guardar", error: "pase" });
  red.calendarios.push({ id: "calN", nombre: "Nekal", soloLectura: false, esNekal: true });
  assert.equal(await sinc.sincronizarCuenta(CUENTA, { ...m, red, copiarAqui: true, ahora: AHORA }), "pase");
  assert.equal(m.leer().items.length, 2);
  assert.equal(m.leer().items.find((i) => i.id === "t1").origen, undefined);
});

test("sincronizar: un error de red en una acción no frena las demás", async () => {
  const d1 = importar([evento("e1")]);
  const borrado = mod.deleteItem(d1, d1.items[0].id);
  const m = memoria({ ...borrado, items: [...borrado.items, propio({ id: "t1" })] });
  const red = redFalsa({ eventos: [evento("e1")], falla: "guardar" });
  red.calendarios.push({ id: "calN", nombre: "Nekal", soloLectura: false, esNekal: true });
  assert.equal(await sinc.sincronizarCuenta(CUENTA, { ...m, red, copiarAqui: true, ahora: AHORA }), "ok");
  assert.deepEqual(red.llamadas, [["borrar", "primary", "e1"]]);
  assert.equal(m.leer().items.find((i) => i.id === d1.items[0].id).origen, undefined);
  assert.equal(m.leer().items.find((i) => i.id === "t1").origen, undefined);
});

test("espejo: desconectar manda lo importado a la papelera y suelta lo copiado", () => {
  const d1 = importar([evento("e1")]);
  const copiado = propio({ id: "t1", origen: { ...ORIGEN, idExterno: "n1", creadoEn: "nekal" } });
  const otraCuenta = propio({ id: "t2", origen: { ...ORIGEN, cuenta: "otra@b.cl" } });
  const d = esp.soltarCuenta({ ...d1, items: [...d1.items, copiado, otraCuenta] }, CUENTA, AHORA);
  assert.ok(d.items[0].deletedAt);
  assert.equal(d.items.find((i) => i.id === "t1").origen, undefined);
  assert.equal(d.items.find((i) => i.id === "t1").deletedAt, "");
  assert.deepEqual(d.items.find((i) => i.id === "t2").origen, otraCuenta.origen);
});

// ── Arreglos de la revisión de H4 ──────────────────────────────────────────
test("revisión H4: desconectar y reconectar nunca borra eventos de afuera", () => {
  const d1 = importar([evento("e1"), evento("e2")]);
  const suelto = esp.soltarCuenta(d1, CUENTA, AHORA);
  assert.ok(suelto.items.every((i) => i.deletedAt && i.origen === undefined));
  const p = plan(suelto, [evento("e1"), evento("e2")]);
  assert.equal(p.fuera.filter((a) => a.tipo === "borrar").length, 0);
  assert.equal(p.crearEnNekal.length, 2);
});

test("revisión H4: un evento que deja de llegar va a la papelera sin borrarse afuera", () => {
  const d1 = importar([evento("e1")]);
  const id = d1.items[0].id;
  const d2 = esp.aplicarEnNekal(d1, CUENTA, plan(d1, []), AHORA);
  const i = d2.items.find((x) => x.id === id);
  assert.ok(i.deletedAt);
  assert.equal(i.origen, undefined);
  assert.equal(plan(d2, [evento("e1")]).fuera.length, 0);
});

test("revisión H4: el espejo espera la primera sincronización con la nube", () => {
  const nube = require("../.test-build/estadosNube.js");
  assert.equal(est.esperandoNube(nube.CONECTANDO), true);
  assert.equal(est.esperandoNube(nube.SINCRONIZANDO), true);
  assert.equal(est.esperandoNube("Sincronizado"), false);
});

test("revisión H4: un cambio solo de título no toca el inicio ni el fin afuera", () => {
  const viaje = {
    title: "Viaje a Chiloé",
    scheduledAt: new Date(2026, 10, 21).toISOString(),
    duration: 1440,
    location: "",
    origen: { diaCompleto: true },
  };
  const firma = ev.firmaDe({ ...viaje, title: "Viaje", diaCompleto: true });
  assert.deepEqual(ev.cambiosGoogle(viaje, firma), { summary: "Viaje a Chiloé" });
  assert.deepEqual(ev.cambiosGraph(viaje, firma, "America/Santiago"), {
    subject: "Viaje a Chiloé",
  });
  const movido = { ...viaje, scheduledAt: new Date(2026, 10, 22).toISOString() };
  const firmaMovido = ev.firmaDe({ ...viaje, diaCompleto: true });
  assert.deepEqual(ev.cambiosGoogle(movido, firmaMovido).start, { date: "2026-11-22" });
  assert.deepEqual(ev.cambiosGoogle(viaje, "basura"), ev.cuerpoGoogle(viaje));
});

test("revisión H4: dos ítems con el mismo evento quedan en uno", () => {
  const d1 = importar([evento("e1")]);
  const copia = { ...d1.items[0], id: "copia", createdAt: "2030-01-01T00:00:00.000Z" };
  const doble = { ...d1, items: [...d1.items, copia] };
  const p = plan(doble, [evento("e1")]);
  assert.deepEqual(p.duplicados, ["copia"]);
  const d2 = esp.aplicarEnNekal(doble, CUENTA, p, AHORA);
  const c = d2.items.find((i) => i.id === "copia");
  assert.ok(c.deletedAt);
  assert.equal(c.origen, undefined);
  assert.equal(vacio(plan(d2, [evento("e1")])), 0);
});

test("revisión H4: si afuera no dejan editar (403), vuelve a como está allá", async () => {
  const d1 = importar([evento("e1")]);
  const m = memoria({ ...d1, items: d1.items.map((i) => ({ ...i, title: "Cambiado", updatedAt: "2030-01-01T00:00:00.000Z" })) });
  const red = redFalsa({ eventos: [evento("e1")], falla: "guardar", error: "prohibido" });
  assert.equal(await sinc.sincronizarCuenta(CUENTA, { ...m, red, copiarAqui: false, ahora: AHORA }), "ok");
  assert.equal(m.leer().items[0].origen.soloLectura, true);
  const p = plan(m.leer(), [evento("e1")]);
  assert.equal(p.actualizarEnNekal.length, 1);
  assert.equal(p.fuera.length, 0);
});

// ── Varios destinos (prueba real 16/11: Google, Outlook, ambos o ninguno) ──
const OUTLOOK = cuenta("microsoft", "c@d.cl");
const copiaComo = (o, item, extra = {}) =>
  evento(o.idExterno, {
    calendario: o.calendario,
    version: o.version,
    titulo: item.title,
    inicio: item.scheduledAt,
    ...extra,
  });
const pasada = (cta, m, red, copiarAqui = true, extra = {}) =>
  sinc.sincronizarCuenta(cta, { ...m, red, copiarAqui, ahora: AHORA, ...extra });

test("destinos: normalizar la lista, datos viejos y «No copiar»", () => {
  const dos = { cuentas: [cuenta("google", "a"), cuenta("microsoft", "a")], ofrecido: true };
  assert.deepEqual(
    est.normalizarConexiones({ ...dos, destinos: ["google:a", "microsoft:a", 3, "google:a"] }).destinos,
    ["google:a", "microsoft:a"],
  );
  assert.deepEqual(est.normalizarConexiones({ ...dos, destinos: [] }).destinos, []);
  assert.deepEqual(est.normalizarConexiones({ ...dos, destinoNekal: "microsoft:a" }).destinos, ["microsoft:a"]);
  assert.deepEqual(est.normalizarConexiones({ ...dos, destinoNekal: "" }).destinos, []);
  assert.deepEqual(est.normalizarConexiones(dos).destinos, ["google:a"]);
  assert.equal("destinoNekal" in est.normalizarConexiones({ ...dos, destinoNekal: "" }), false);
});

test("destinos: reconectar no cambia la elección; desconectar la saca de la lista", () => {
  let c = est.agregarCuenta(est.CONEXIONES_VACIAS, cuenta("google", "a"));
  c = est.agregarCuenta(c, cuenta("microsoft", "a"));
  assert.deepEqual(c.destinos, ["google:a"]);
  // «No copiar» sobrevive a la vuelta de «Actualizar Google».
  c = est.agregarCuenta({ ...c, destinos: [] }, cuenta("google", "a"));
  assert.deepEqual(c.destinos, []);
  const ambos = { ...c, destinos: ["google:a", "microsoft:a"] };
  assert.deepEqual(est.quitarCuenta(ambos, "google", "a").destinos, ["microsoft:a"]);
  assert.deepEqual(est.quitarCuenta(c, "google", "a").destinos, []);
});

test("destinos: lo creado en Nekal va a Google y a Outlook, y cada copia sigue al ítem", async () => {
  const m = memoria({ ...mod.emptyData(), items: [propio({ id: "t1" })] });
  const g = redFalsa();
  const o = redFalsa();
  assert.equal(await pasada(CUENTA, m, g), "ok");
  assert.equal(await pasada(OUTLOOK, m, o), "ok");
  let t1 = m.leer().items[0];
  assert.equal(t1.origen.proveedor, "google");
  assert.equal(t1.copias.length, 1);
  assert.equal(t1.copias[0].proveedor, "microsoft");
  assert.equal(t1.copias[0].cuenta, "c@d.cl");
  assert.equal(t1.copias[0].creadoEn, "nekal");

  // Las copias vuelven como eventos: nada que hacer en ninguno.
  g.eventos = [copiaComo(t1.origen, t1)];
  o.eventos = [copiaComo(t1.copias[0], t1)];
  g.llamadas = [];
  o.llamadas = [];
  await pasada(CUENTA, m, g);
  await pasada(OUTLOOK, m, o);
  assert.deepEqual([g.llamadas, o.llamadas], [[], []]);
  assert.equal(m.leer().items.length, 1);

  // Mover en Nekal (o que Neka lo mueva): cambia en los dos.
  m.change((d) => ({
    ...d,
    items: d.items.map((i) => ({ ...i, scheduledAt: new Date(2026, 10, 18, 19, 0).toISOString() })),
  }));
  await pasada(CUENTA, m, g);
  await pasada(OUTLOOK, m, o);
  assert.deepEqual(g.llamadas, [["guardar", "calN", "t1", "nuevo-t1"]]);
  assert.deepEqual(o.llamadas, [["guardar", "calN", "t1", "nuevo-t1"]]);

  // Borrar en Nekal: se borra en los dos y el ítem queda sin enlaces.
  t1 = m.leer().items[0];
  g.eventos = [copiaComo(t1.origen, t1)];
  o.eventos = [copiaComo(t1.copias[0], t1)];
  g.llamadas = [];
  o.llamadas = [];
  m.change((d) => mod.deleteItem(d, "t1"));
  await pasada(CUENTA, m, g);
  await pasada(OUTLOOK, m, o);
  assert.deepEqual(g.llamadas, [["borrar", "calN", "nuevo-t1"]]);
  assert.deepEqual(o.llamadas, [["borrar", "calN", "nuevo-t1"]]);
  t1 = m.leer().items[0];
  assert.equal(t1.origen, undefined);
  assert.equal(t1.copias, undefined);
});

test("destinos: un cambio hecho en Google llega también a la copia de Outlook", async () => {
  const m = memoria({ ...mod.emptyData(), items: [propio({ id: "t1" })] });
  const g = redFalsa();
  const o = redFalsa();
  await pasada(CUENTA, m, g);
  await pasada(OUTLOOK, m, o);
  const t1 = m.leer().items[0];
  g.eventos = [copiaComo(t1.origen, t1, { titulo: "Estudiar cálculo", version: "v10", actualizado: "2030-01-01T00:00:00.000Z" })];
  o.eventos = [copiaComo(t1.copias[0], t1)];
  g.llamadas = [];
  o.llamadas = [];
  await pasada(CUENTA, m, g);
  assert.equal(m.leer().items[0].title, "Estudiar cálculo");
  await pasada(OUTLOOK, m, o);
  assert.deepEqual(g.llamadas, []);
  assert.deepEqual(o.llamadas, [["guardar", "calN", "t1", "nuevo-t1"]]);
});

test("destinos: lo que ya está en Google se copia a Outlook; lo importado de Google no", () => {
  const importado = importar([evento("e1")]);
  const t = propio({ id: "t1" });
  const enGoogle = { ...ORIGEN, idExterno: "n1", creadoEn: "nekal", firma: esp.firmaDeItem(t) };
  const conCopia = { ...importado, items: [...importado.items, { ...t, origen: enGoogle }] };
  const p = esp.planDeSincronizacion({
    data: conCopia, eventos: [], cuenta: OUTLOOK, calendarioNekal: null, copiarAqui: true, ahora: AHORA,
  });
  assert.deepEqual(p.fuera.map((a) => [a.tipo, a.itemId]), [["crear", "t1"]]);
  const conexiones = { cuentas: [CUENTA, OUTLOOK], ofrecido: true, destinos: ["microsoft:c@d.cl"] };
  assert.equal(esp.hayCambiosLocales(conCopia, conexiones, AHORA), true);
  assert.equal(esp.hayCambiosLocales(conCopia, { ...conexiones, destinos: ["google:a@b.cl"] }, AHORA), false);
});

test("destinos: la copia de Outlook que ya existe se vincula aunque el ítem ya esté en Google", () => {
  const t = propio({ id: "t1", origen: { ...ORIGEN, idExterno: "n1", creadoEn: "nekal" } });
  const data = { ...mod.emptyData(), items: [t] };
  const enOutlook = evento("o1", { calendario: "calO", titulo: t.title, inicio: t.scheduledAt });
  const p = esp.planDeSincronizacion({
    data, eventos: [enOutlook], cuenta: OUTLOOK, calendarioNekal: "calO", copiarAqui: true, ahora: AHORA,
  });
  assert.equal(p.vincular.length, 1);
  assert.equal(p.crearEnNekal.length, 0);
  assert.equal(p.fuera.length, 0);
  const d2 = esp.aplicarEnNekal(data, OUTLOOK, p, AHORA);
  assert.equal(d2.items[0].origen.idExterno, "n1");
  assert.equal(d2.items[0].copias[0].idExterno, "o1");
});

test("destinos: desconectar una cuenta suelta solo su copia", () => {
  const og = { ...ORIGEN, idExterno: "n1", creadoEn: "nekal" };
  const oo = { ...ORIGEN, proveedor: "microsoft", cuenta: "c@d.cl", idExterno: "o1", creadoEn: "nekal" };
  const data = { ...mod.emptyData(), items: [propio({ id: "t1", origen: og, copias: [oo] })] };
  const sinOutlook = esp.soltarCuenta(data, OUTLOOK, AHORA).items[0];
  assert.deepEqual(sinOutlook.origen, og);
  assert.equal(sinOutlook.copias, undefined);
  assert.equal(sinOutlook.deletedAt, "");
  const sinGoogle = esp.soltarCuenta(data, CUENTA, AHORA).items[0];
  assert.deepEqual(sinGoogle.origen, oo);
  assert.equal(sinGoogle.copias, undefined);
  assert.equal(sinGoogle.deletedAt, "");
});

test("destinos: si Outlook falla se avisa el motivo (sin pases)", async () => {
  const m = memoria({ ...mod.emptyData(), items: [propio({ id: "t1" })] });
  const o = redFalsa({ falla: "guardar", error: "red 400 · ErrorInvalidRequest: Bad body" });
  const fallos = [];
  assert.equal(await pasada(OUTLOOK, m, o, true, { fallo: (d) => fallos.push(d) }), "ok");
  assert.deepEqual(fallos, ["red 400 · ErrorInvalidRequest: Bad body"]);
  const sinLeer = redFalsa();
  sinLeer.leerCalendarios = async () => {
    throw new Error("red 403 · ErrorAccessDenied: x");
  };
  const f2 = [];
  assert.equal(await pasada(OUTLOOK, m, sinLeer, true, { fallo: (d) => f2.push(d) }), "red");
  assert.deepEqual(f2, ["red 403 · ErrorAccessDenied: x"]);
});

test("destinos: el detalle de un error de Google o Graph", () => {
  assert.equal(
    ev.detalleDeError(400, JSON.stringify({ error: { code: "ErrorInvalidRequest", message: "Bad" } })),
    "red 400 · ErrorInvalidRequest: Bad",
  );
  assert.equal(
    ev.detalleDeError(400, JSON.stringify({ error: { code: 400, status: "INVALID_ARGUMENT", message: "x" } })),
    "red 400 · INVALID_ARGUMENT: x",
  );
  assert.equal(ev.detalleDeError(500, "<html>"), "red 500");
  assert.ok(ev.detalleDeError(400, JSON.stringify({ error: { code: "A", message: "m".repeat(500) } })).length <= 160);
});
