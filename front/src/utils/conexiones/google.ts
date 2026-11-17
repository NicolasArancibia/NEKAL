import { Platform } from "react-native";
import { leerVuelta, permisosGoogle, urlGoogle } from "./pase";
import type {
  CalendarioFuera,
  CorreoCompleto,
  CorreoResumen,
  PaseGoogle,
  Permisos,
} from "./tipos";
import { desdeGmail, desdeGmailCompleto, respuestaGmail } from "./correo";
import type { Item } from "../model";
import {
  cambiosGoogle,
  cuerpoGoogle,
  desdeGoogle,
  detalleDeError,
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
export type { CalendarioFuera } from "./tipos";
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
  // Sin permiso para cambiar ese evento (por ejemplo, no eres quien lo organiza).
  if (r.status === 403) throw new Error("prohibido");
  return r;
}
async function json(token: string, url: string, init?: RequestInit) {
  const r = await pedir(token, url, init);
  if (!r.ok) throw new Error(detalleDeError(r.status, await r.text()));
  return r.json();
}

export async function calendariosGoogle(
  token: string,
): Promise<CalendarioFuera[]> {
  const out: CalendarioFuera[] = [];
  let pagina = "";
  do {
    const q = new URLSearchParams({ maxResults: "250" });
    if (pagina) q.set("pageToken", pagina);
    const r = await json(token, `${CAL}/users/me/calendarList?${q}`);
    for (const c of r.items ?? [])
      // El calendario «Nekal» siempre: si se oculta en Google, lo de Nekal no se pierde.
      if (c.selected || c.primary || (c.summary === "Nekal" && c.accessRole === "owner"))
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

export async function crearCalendarioNekalGoogle(
  token: string,
): Promise<string> {
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
  firmaAnterior?: string,
): Promise<EventoFuera> {
  const base = `${CAL}/calendars/${encodeURIComponent(cal)}/events`;
  const cuerpo =
    idExterno && firmaAnterior
      ? cambiosGoogle(i, firmaAnterior)
      : cuerpoGoogle(i);
  const r = await json(
    token,
    idExterno ? `${base}/${encodeURIComponent(idExterno)}` : base,
    { method: idExterno ? "PATCH" : "POST", body: JSON.stringify(cuerpo) },
  );
  const ev = desdeGoogle(r, cal, false);
  if (!ev) throw new Error("red: Google respondió sin fecha");
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
  if (!r.ok && r.status !== 404 && r.status !== 410)
    throw new Error(detalleDeError(r.status, await r.text()));
}

// ── Correo (V2/H5) ─────────────────────────────────────────────────────────
const GMAIL = "https://gmail.googleapis.com/gmail/v1/users/me";
const PRINCIPALES = "in:inbox category:primary newer_than:7d";
const MAS = "in:inbox newer_than:7d -category:primary";

async function idsGmail(token: string, q: string): Promise<string[]> {
  const r = await json(
    token,
    `${GMAIL}/messages?${new URLSearchParams({ q, maxResults: "50" })}`,
  );
  return (r.messages ?? []).map((m: { id: string }) => m.id);
}

// Solo remitente, asunto y fecha (más el extracto que da Gmail), de a 10 a la vez.
async function resumenesGmail(
  token: string,
  cuenta: string,
  ids: string[],
): Promise<CorreoResumen[]> {
  const q =
    "format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date";
  const out: CorreoResumen[] = [];
  for (let i = 0; i < ids.length; i += 10) {
    const lote = await Promise.all(
      ids
        .slice(i, i + 10)
        .map((id) =>
          json(token, `${GMAIL}/messages/${encodeURIComponent(id)}?${q}`),
        ),
    );
    for (const m of lote) {
      const c = desdeGmail(m, cuenta);
      if (c) out.push(c);
    }
  }
  return out;
}

export async function correosGoogle(
  token: string,
  cuenta: string,
  _ahora: number,
): Promise<{ principales: CorreoResumen[]; mas: CorreoResumen[] }> {
  const [p, m] = await Promise.all([
    idsGmail(token, PRINCIPALES),
    idsGmail(token, MAS),
  ]);
  const [principales, mas] = await Promise.all([
    resumenesGmail(token, cuenta, p),
    resumenesGmail(token, cuenta, m),
  ]);
  return { principales, mas };
}

export async function correoGoogle(
  token: string,
  cuenta: string,
  id: string,
): Promise<CorreoCompleto> {
  const m = await json(
    token,
    `${GMAIL}/messages/${encodeURIComponent(id)}?format=full`,
  );
  const c = desdeGmailCompleto(m, cuenta);
  if (!c) throw new Error("red: Gmail respondió un correo ilegible");
  return c;
}

export async function marcarLeidoGoogle(token: string, id: string) {
  await json(token, `${GMAIL}/messages/${encodeURIComponent(id)}/modify`, {
    method: "POST",
    body: JSON.stringify({ removeLabelIds: ["UNREAD"] }),
  });
}

// En el mismo hilo: threadId + In-Reply-To/References (correo.ts).
export async function responderGoogle(
  token: string,
  original: CorreoCompleto,
  texto: string,
) {
  await json(token, `${GMAIL}/messages/send`, {
    method: "POST",
    body: JSON.stringify({
      raw: respuestaGmail(original, texto),
      threadId: original.hilo,
    }),
  });
}
