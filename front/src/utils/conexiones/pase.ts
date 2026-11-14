import type { PaseGoogle, Permisos, Vuelta } from "./tipos";

// Flujo implícito de Google por redirección de página completa (spec §4.1).
const CALENDARIO = "https://www.googleapis.com/auth/calendar";
const CORREO = "https://www.googleapis.com/auth/gmail.modify";
export const SCOPES_GOOGLE = ["openid", "email", "profile", CALENDARIO, CORREO];

export function urlGoogle(o: {
  clientId: string;
  redirectUri: string;
  state: string;
  loginHint?: string;
  silencioso?: boolean;
}): string {
  const q = new URLSearchParams({
    response_type: "token",
    client_id: o.clientId,
    redirect_uri: o.redirectUri,
    state: o.state,
    include_granted_scopes: "true",
    scope: SCOPES_GOOGLE.join(" "),
    prompt: o.silencioso ? "none" : "select_account consent",
  });
  if (o.loginHint) q.set("login_hint", o.loginHint);
  return `https://accounts.google.com/o/oauth2/v2/auth?${q.toString()}`;
}

// null: el hash no es una vuelta de Google (los `state` de Nekal empiezan con «g.»).
export function leerVuelta(
  hash: string,
  stateEsperado: string,
  ahora: number,
): Vuelta | null {
  const q = new URLSearchParams(hash.replace(/^#/, ""));
  const state = q.get("state");
  if (!state || !state.startsWith("g.")) return null;
  if (!stateEsperado || state !== stateEsperado)
    return { ok: false, error: "state" };
  const error = q.get("error");
  if (error)
    return {
      ok: false,
      error: [
        "interaction_required",
        "login_required",
        "consent_required",
      ].includes(error)
        ? "necesita_toque"
        : "cancelado",
    };
  const token = q.get("access_token");
  if (!token) return { ok: false, error: "sin_pase" };
  const segundos = Number(q.get("expires_in")) || 3600;
  return {
    ok: true,
    pase: {
      token,
      vence: ahora + segundos * 1000,
      scopes: (q.get("scope") ?? "").split(" ").filter(Boolean),
    },
  };
}

export function permisosGoogle(scopes: string[]): Permisos {
  return {
    calendario: scopes.includes(CALENDARIO),
    correo: scopes.includes(CORREO),
  };
}
