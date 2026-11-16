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
    destinoNekal: "",
  });
});

test("conexiones: quitar", () => {
  const c = {
    cuentas: [cuenta("google", "a@b.cl"), cuenta("microsoft", "a@b.cl")],
    ofrecido: true,
    destinoNekal: "a@b.cl",
  };
  assert.deepEqual(est.quitarCuenta(c, "google", "a@b.cl"), {
    cuentas: [cuenta("microsoft", "a@b.cl")],
    ofrecido: true,
    destinoNekal: "a@b.cl",
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
    destinoNekal: "",
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
  let c = est.agregarCuenta(est.CONEXIONES_VACIAS, cuenta("google", "a"));
  assert.equal(c.destinoNekal, "a");
  c = est.agregarCuenta(c, cuenta("microsoft", "b"));
  assert.equal(c.destinoNekal, "a");
  c = est.quitarCuenta(c, "google", "a");
  assert.equal(c.destinoNekal, "b");
  c = est.quitarCuenta(c, "microsoft", "b");
  assert.equal(c.destinoNekal, "");
  assert.equal(est.normalizarConexiones({ cuentas: [], ofrecido: true }).destinoNekal, "");
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
