import { FirebaseApp, initializeApp, getApps } from "firebase/app";
import {
  CustomProvider,
  ReCaptchaEnterpriseProvider,
  initializeAppCheck,
} from "firebase/app-check";
import { getAuth, initializeAuth, Auth, Persistence } from "firebase/auth";
import * as FirebaseAuth from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};
export const firebaseConfigured = !!(
  config.apiKey &&
  config.authDomain &&
  config.projectId &&
  config.appId
);
let auth: Auth | null = null;
let firebaseApp: FirebaseApp | null = null;

// App Check (spec D §7): Gemini solo responde a la app de verdad. En desarrollo
// (web local y Expo Go) se usa el token de depuración de
// `.env.development.local`, que no entra en la build de producción; la web
// publicada usa reCAPTCHA Enterprise (Fraud Defense; reCAPTCHA Classic quedó
// obsoleto y Firebase ya no deja registrarlo). La clave del sitio debe ser la
// de Enterprise registrada en App Check. Sin ninguno, Gemini falla y Neka queda
// sin IA.
function protegerConAppCheck(app: FirebaseApp) {
  const depuracion = process.env.EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN;
  const sitio = process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY;
  if (depuracion)
    (globalThis as { FIREBASE_APPCHECK_DEBUG_TOKEN?: string })
      .FIREBASE_APPCHECK_DEBUG_TOKEN = depuracion;
  const sinProveedor = new CustomProvider({
    getToken: () => Promise.reject(new Error("App Check sin proveedor.")),
  });
  try {
    initializeAppCheck(app, {
      provider:
        !depuracion && Platform.OS === "web" && sitio
          ? new ReCaptchaEnterpriseProvider(sitio)
          : sinProveedor,
      isTokenAutoRefreshEnabled: true,
    });
  } catch (e) {
    // Una recarga en caliente lo inicializa dos veces: el primero sigue vigente.
    if (__DEV__) console.warn("App Check:", (e as Error).message);
  }
}

if (firebaseConfigured) {
  const app = getApps()[0] ?? initializeApp(config);
  firebaseApp = app;
  protegerConAppCheck(app);
  // Metro resolves Firebase's react-native export; TypeScript resolves the web declarations.
  const nativeAuth = FirebaseAuth as typeof FirebaseAuth & {
    getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
  };
  try {
    auth =
      Platform.OS === "web"
        ? getAuth(app)
        : initializeAuth(app, {
            persistence: nativeAuth.getReactNativePersistence(AsyncStorage),
          });
  } catch {
    auth = getAuth(app);
  }
}
export { auth, firebaseApp };
export const database = () => getFirestore();
