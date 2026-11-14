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
