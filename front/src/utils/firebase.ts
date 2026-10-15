import { initializeApp, getApps } from "firebase/app";
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
if (firebaseConfigured) {
  const app = getApps()[0] ?? initializeApp(config);
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
export { auth };
export const database = () => getFirestore();
