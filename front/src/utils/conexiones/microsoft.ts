import { Platform } from "react-native";
import type {
  AccountInfo,
  IPublicClientApplication,
} from "@azure/msal-browser";

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
