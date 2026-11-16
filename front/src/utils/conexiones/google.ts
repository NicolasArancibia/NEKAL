import { Platform } from "react-native";
import { leerVuelta, permisosGoogle, urlGoogle } from "./pase";
import type { PaseGoogle, Permisos } from "./tipos";
import type { Item } from "../model";
import {
  cuerpoGoogle,
  desdeGoogle,
  EventoFuera,
  limitesVentana,
} from "./eventos";

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

// ── Calendario (V2/H4) ─────────────────────────────────────────────────────
export type CalendarioFuera = {
  id: string;
  nombre: string;
  soloLectura: boolean;
  esNekal: boolean;
};
const CAL = "https://www.googleapis.com/calendar/v3";

// 401 = pase vencido («pase»); otro error = «red».
async function pedir(token: string, url: string, init: RequestInit = {}) {
  const r = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (r.status === 401) throw new Error("pase");
  return r;
}
async function json(token: string, url: string, init?: RequestInit) {
  const r = await pedir(token, url, init);
  if (!r.ok) throw new Error("red");
  return r.json();
}

export async function calendariosGoogle(token: string): Promise<CalendarioFuera[]> {
  const out: CalendarioFuera[] = [];
  let pagina = "";
  do {
    const q = new URLSearchParams({ maxResults: "250" });
    if (pagina) q.set("pageToken", pagina);
    const r = await json(token, `${CAL}/users/me/calendarList?${q}`);
    for (const c of r.items ?? [])
      if (c.selected || c.primary)
        out.push({
          id: c.id,
          nombre: c.summary ?? "",
          soloLectura: c.accessRole !== "owner" && c.accessRole !== "writer",
          esNekal: c.summary === "Nekal" && c.accessRole === "owner",
        });
    pagina = r.nextPageToken ?? "";
  } while (pagina);
  return out;
}

export async function eventosGoogle(
  token: string,
  cals: CalendarioFuera[],
  ahora: number,
): Promise<EventoFuera[]> {
  const { desde, hasta } = limitesVentana(ahora);
  const out: EventoFuera[] = [];
  for (const cal of cals) {
    let pagina = "";
    do {
      const q = new URLSearchParams({
        singleEvents: "true",
        timeMin: desde,
        timeMax: hasta,
        maxResults: "2500",
      });
      if (pagina) q.set("pageToken", pagina);
      const r = await json(
        token,
        `${CAL}/calendars/${encodeURIComponent(cal.id)}/events?${q}`,
      );
      for (const e of r.items ?? []) {
        const ev = desdeGoogle(e, cal.id, cal.soloLectura);
        if (ev) out.push(ev);
      }
      pagina = r.nextPageToken ?? "";
    } while (pagina);
  }
  return out;
}

export async function crearCalendarioNekalGoogle(token: string): Promise<string> {
  const r = await json(token, `${CAL}/calendars`, {
    method: "POST",
    body: JSON.stringify({ summary: "Nekal" }),
  });
  return r.id;
}

export async function guardarEventoGoogle(
  token: string,
  cal: string,
  i: Item,
  idExterno?: string,
): Promise<EventoFuera> {
  const base = `${CAL}/calendars/${encodeURIComponent(cal)}/events`;
  const r = await json(
    token,
    idExterno ? `${base}/${encodeURIComponent(idExterno)}` : base,
    { method: idExterno ? "PATCH" : "POST", body: JSON.stringify(cuerpoGoogle(i)) },
  );
  const ev = desdeGoogle(r, cal, false);
  if (!ev) throw new Error("red");
  return ev;
}

// Ya no existe (404/410) cuenta como borrado.
export async function borrarEventoGoogle(
  token: string,
  cal: string,
  idExterno: string,
): Promise<void> {
  const r = await pedir(
    token,
    `${CAL}/calendars/${encodeURIComponent(cal)}/events/${encodeURIComponent(idExterno)}`,
    { method: "DELETE" },
  );
  if (!r.ok && r.status !== 404 && r.status !== 410) throw new Error("red");
}
