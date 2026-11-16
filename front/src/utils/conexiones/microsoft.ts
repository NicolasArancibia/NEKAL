import { Platform } from "react-native";
import type {
  AccountInfo,
  IPublicClientApplication,
} from "@azure/msal-browser";
import type { Item } from "../model";
import type { CalendarioFuera } from "./tipos";
import {
  cambiosGraph,
  cuerpoGraph,
  desdeGraph,
  EventoFuera,
  limitesVentana,
} from "./eventos";

// Único archivo que habla con Microsoft (spec H3_CONEXIONES §4.2). Solo web; MSAL se carga a demanda.
const CLIENT_ID = process.env.EXPO_PUBLIC_MICROSOFT_CLIENT_ID ?? "";
export const microsoftDisponible = Platform.OS === "web" && !!CLIENT_ID;
const SCOPES = [
  "User.Read",
  "Calendars.ReadWrite",
  "Mail.ReadWrite",
  "Mail.Send",
  "offline_access",
];

export type ResultadoMicrosoft =
  | { ok: true; cuenta: { correo: string; nombre: string } }
  | { ok: false; error: "cancelado" | "red" };

let cliente: Promise<IPublicClientApplication> | null = null;
// AccessTokenAndRefreshToken: sin iframe oculto (cargaría toda la app); si el
// refresh token venció, la cuenta pasa a «Toca para actualizar».
const SOLO_CACHE_Y_REFRESH = 2;
function msal(): Promise<IPublicClientApplication> {
  if (!cliente)
    cliente = import("@azure/msal-browser").then(async (m) => {
      const pca = new m.PublicClientApplication({
        auth: {
          clientId: CLIENT_ID,
          authority: "https://login.microsoftonline.com/common",
          redirectUri: window.location.origin,
        },
        cache: { cacheLocation: "localStorage" },
      });
      await pca.initialize();
      return pca;
    });
  return cliente;
}

const cuentaDe = (pca: IPublicClientApplication, correo: string) =>
  pca
    .getAllAccounts()
    .find(
      (a: AccountInfo) => a.username.toLowerCase() === correo.toLowerCase(),
    ) ?? null;

const cancelado = (e: unknown) =>
  ["user_cancelled", "access_denied"].includes(
    (e as { errorCode?: string })?.errorCode ?? "",
  );

export async function iniciarMicrosoft(o: { loginHint?: string } = {}) {
  if (!microsoftDisponible) return;
  const pca = await msal();
  await pca.loginRedirect({
    scopes: SCOPES,
    prompt: "select_account",
    loginHint: o.loginHint,
  });
}

export async function recogerVueltaMicrosoft(): Promise<ResultadoMicrosoft | null> {
  if (!microsoftDisponible) return null;
  try {
    const r = await (await msal()).handleRedirectPromise();
    if (!r?.account) return null;
    return {
      ok: true,
      cuenta: {
        correo: r.account.username,
        nombre: r.account.name ?? r.account.username,
      },
    };
  } catch (e) {
    return { ok: false, error: cancelado(e) ? "cancelado" : "red" };
  }
}

export async function paseMicrosoft(correo: string): Promise<string | null> {
  if (!microsoftDisponible) return null;
  try {
    const pca = await msal();
    const account = cuentaDe(pca, correo);
    if (!account) return null;
    return (
      await pca.acquireTokenSilent({
        scopes: SCOPES,
        account,
        cacheLookupPolicy: SOLO_CACHE_Y_REFRESH,
      })
    ).accessToken;
  } catch {
    // InteractionRequiredAuthError u otro: hace falta un toque.
    return null;
  }
}

export async function actualizarMicrosoft(correo: string): Promise<void> {
  if (!microsoftDisponible) return;
  const pca = await msal();
  const account = cuentaDe(pca, correo) ?? undefined;
  await pca.acquireTokenRedirect({
    scopes: SCOPES,
    account,
    loginHint: correo,
  });
}

export async function olvidarMicrosoft(correo: string): Promise<void> {
  if (!microsoftDisponible) return;
  const pca = await msal();
  const account = cuentaDe(pca, correo);
  // Solo se borra de este dispositivo; no cierra la sesión de Microsoft en el navegador.
  if (account) await pca.clearCache({ account });
}

// ── Calendario (V2/H4) ─────────────────────────────────────────────────────
const GRAPH = "https://graph.microsoft.com/v1.0";
// Horas en UTC y cuerpos en texto (sin HTML ni rastreo).
const PREFER = 'outlook.timezone="UTC", outlook.body-content-type="text"';
const CAMPOS =
  "id,subject,location,bodyPreview,start,end,isAllDay,changeKey,lastModifiedDateTime,isCancelled";

// 401 = pase vencido («pase»); otro error = «red».
async function pedirGraph(token: string, url: string, init: RequestInit = {}) {
  const r = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: PREFER,
    },
  });
  if (r.status === 401) throw new Error("pase");
  // Sin permiso para cambiar ese evento (por ejemplo, no eres quien lo organiza).
  if (r.status === 403) throw new Error("prohibido");
  return r;
}
async function jsonGraph(token: string, url: string, init?: RequestInit) {
  const r = await pedirGraph(token, url, init);
  if (!r.ok) throw new Error("red");
  return r.json();
}

export async function calendariosGraph(
  token: string,
): Promise<CalendarioFuera[]> {
  const r = await jsonGraph(token, `${GRAPH}/me/calendars?$top=100`);
  return (r.value ?? []).map((c: any) => ({
    id: c.id,
    nombre: c.name ?? "",
    soloLectura: c.canEdit === false,
    esNekal: c.name === "Nekal" && c.canEdit !== false,
  }));
}

export async function eventosGraph(
  token: string,
  cals: CalendarioFuera[],
  ahora: number,
): Promise<EventoFuera[]> {
  const { desde, hasta } = limitesVentana(ahora);
  const out: EventoFuera[] = [];
  for (const cal of cals) {
    const q = new URLSearchParams({
      startDateTime: desde,
      endDateTime: hasta,
      $top: "200",
      $select: CAMPOS,
    });
    let url: string = `${GRAPH}/me/calendars/${encodeURIComponent(cal.id)}/calendarView?${q}`;
    while (url) {
      const r = await jsonGraph(token, url);
      for (const e of r.value ?? []) {
        const ev = desdeGraph(e, cal.id, cal.soloLectura);
        if (ev) out.push(ev);
      }
      url = r["@odata.nextLink"] ?? "";
    }
  }
  return out;
}

export async function crearCalendarioNekalGraph(token: string): Promise<string> {
  const r = await jsonGraph(token, `${GRAPH}/me/calendars`, {
    method: "POST",
    body: JSON.stringify({ name: "Nekal" }),
  });
  return r.id;
}

const zonaLocal = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

export async function guardarEventoGraph(
  token: string,
  cal: string,
  i: Item,
  idExterno?: string,
  firmaAnterior?: string,
): Promise<EventoFuera> {
  const cuerpo =
    idExterno && firmaAnterior
      ? cambiosGraph(i, firmaAnterior, zonaLocal())
      : cuerpoGraph(i, zonaLocal());
  const r = await jsonGraph(
    token,
    idExterno
      ? `${GRAPH}/me/events/${encodeURIComponent(idExterno)}`
      : `${GRAPH}/me/calendars/${encodeURIComponent(cal)}/events`,
    {
      method: idExterno ? "PATCH" : "POST",
      body: JSON.stringify(cuerpo),
    },
  );
  const ev = desdeGraph(r, cal, false);
  if (!ev) throw new Error("red");
  return ev;
}

// Ya no existe (404) cuenta como borrado. `cal` no hace falta en Graph; se
// recibe para que las dos cuentas se usen igual.
export async function borrarEventoGraph(
  token: string,
  _cal: string,
  idExterno: string,
): Promise<void> {
  const r = await pedirGraph(
    token,
    `${GRAPH}/me/events/${encodeURIComponent(idExterno)}`,
    { method: "DELETE" },
  );
  if (!r.ok && r.status !== 404 && r.status !== 410) throw new Error("red");
}
