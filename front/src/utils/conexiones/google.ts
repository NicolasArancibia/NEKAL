import { Platform } from "react-native";
import { leerVuelta, permisosGoogle, urlGoogle } from "./pase";
import type { PaseGoogle, Permisos } from "./tipos";

// Único archivo que habla con Google (spec H3_CONEXIONES §4.1). Solo web: Expo Go no puede volver de Google.
const CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? "";
export const googleDisponible = Platform.OS === "web" && !!CLIENT_ID;
const CLAVE_STATE = "nekal:google:state";
const clavePase = (correo: string) => `nekal:pase:google:${correo}`;

export type ResultadoGoogle =
  | { ok: true; cuenta: { correo: string; nombre: string }; permisos: Permisos }
  | {
      ok: false;
      error: "state" | "cancelado" | "necesita_toque" | "sin_pase" | "red";
    };

function aleatorio(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

export function iniciarGoogle(
  o: { loginHint?: string; silencioso?: boolean } = {},
): void {
  if (!googleDisponible) return;
  const state = `g.${aleatorio()}`;
  sessionStorage.setItem(CLAVE_STATE, state);
  window.location.assign(
    urlGoogle({
      clientId: CLIENT_ID,
      redirectUri: window.location.origin,
      state,
      ...o,
    }),
  );
}

export async function recogerVueltaGoogle(): Promise<ResultadoGoogle | null> {
  if (!googleDisponible) return null;
  const esperado = sessionStorage.getItem(CLAVE_STATE) ?? "";
  const vuelta = leerVuelta(window.location.hash, esperado, Date.now());
  if (!vuelta) return null;
  // El pase nunca queda en la barra de direcciones ni en el historial.
  history.replaceState(
    null,
    "",
    window.location.pathname + window.location.search,
  );
  sessionStorage.removeItem(CLAVE_STATE);
  if (!vuelta.ok) return vuelta;
  try {
    const r = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${vuelta.pase.token}` },
    });
    if (!r.ok) return { ok: false, error: "red" };
    const perfil = (await r.json()) as { email?: string; name?: string };
    if (!perfil.email) return { ok: false, error: "sin_pase" };
    sessionStorage.setItem(
      clavePase(perfil.email),
      JSON.stringify(vuelta.pase),
    );
    return {
      ok: true,
      cuenta: { correo: perfil.email, nombre: perfil.name ?? perfil.email },
      permisos: permisosGoogle(vuelta.pase.scopes),
    };
  } catch {
    return { ok: false, error: "red" };
  }
}

export function paseGoogle(correo: string): PaseGoogle | null {
  if (!googleDisponible) return null;
  try {
    const v = JSON.parse(sessionStorage.getItem(clavePase(correo)) ?? "null");
    return v && typeof v.token === "string" && typeof v.vence === "number"
      ? v
      : null;
  } catch {
    return null;
  }
}

export async function olvidarGoogle(correo: string): Promise<void> {
  const pase = paseGoogle(correo);
  if (googleDisponible) sessionStorage.removeItem(clavePase(correo));
  if (!pase) return;
  try {
    await fetch("https://oauth2.googleapis.com/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `token=${encodeURIComponent(pase.token)}`,
    });
  } catch {
    // Si no se pudo revocar, el pase igual vence solo en una hora.
  }
}
