import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, Platform } from "react-native";
import { onAuthStateChanged, User } from "firebase/auth";
import { AppData, emptyData } from "./model";
import { auth, database } from "./firebase";
import { readBackup } from "./storage";
import { scheduleReminders } from "./notifications";
import { SyncEngine } from "./SyncEngine";
import { firestoreRemote } from "./cloudSync";
import { accountStorage } from "./syncStorage";
import { Conflict } from "./syncModel";

type Context = {
  data: AppData;
  ready: boolean;
  user: User | null;
  guest: boolean;
  enterGuest: () => void;
  exitGuest: () => void;
  error: string;
  storageStatus: string;
  change: (fn: (d: AppData) => AppData) => void;
  retry: () => void;
  clearError: () => void;
  cloud: () => Promise<void>;
  cloudBusy: boolean;
  cloudStatus: string;
  pendingChanges: number;
  conflict: Conflict | null;
  remoteData: AppData | null;
  resolveConflict: (choice: "local" | "remote") => Promise<void>;
  hasRecovery: boolean;
  replaceData: (next: AppData) => Promise<void>;
  restorePrevious: () => Promise<void>;
};
const Ctx = createContext<Context | null>(null);
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState(emptyData),
    [ready, setReady] = useState(false),
    [user, setUser] = useState<User | null>(null),
    [guest, setGuest] = useState(false),
    [error, setError] = useState(""),
    [storageStatus, setStorageStatus] = useState(""),
    [cloudStatus, setCloudStatus] = useState("Modo local"),
    [hasRecovery, setHasRecovery] = useState(false),
    [pendingChanges, setPending] = useState(0),
    [conflict, setConflict] = useState<Conflict | null>(null),
    [remoteData, setRemote] = useState<AppData | null>(null);
  const ref = useRef(data),
    key = useRef(""),
    queue = useRef(Promise.resolve()),
    session = useRef(0),
    engine = useRef<SyncEngine | null>(null),
    reminders = useRef(Promise.resolve()),
    busy = useRef(false);
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      reminders.current = reminders.current
        .then(() => scheduleReminders(data))
        .catch(() =>
          setError(
            "No se pudieron actualizar los recordatorios del teléfono. Revisa los permisos.",
          ),
        );
    }, 600);
    return () => clearTimeout(timer);
  }, [data.items, data.preferences, ready]);
  useEffect(() => {
    let disposed = false;
    const load = async (u: User | null) => {
      const generation = ++session.current,
        oldEngine = engine.current;
      oldEngine?.stop();
      engine.current = null;
      setReady(false);
      setGuest(false);
      setUser(u);
      setError("");
      setPending(0);
      setConflict(null);
      setRemote(null);
      key.current = `nekal:v1:${u?.uid ?? "guest"}`;
      try {
        await queue.current;
        await oldEngine?.flushLocal();
        const recovery = await AsyncStorage.getItem(key.current + ":recovery");
        if (disposed || generation !== session.current) return;
        setHasRecovery(!!recovery);
        if (u) {
          const storage = accountStorage(u.uid),
            state = await storage.load();
          if (disposed || generation !== session.current) return;
          const sync = new SyncEngine(
            state,
            firestoreRemote(database(), u.uid),
            storage.save,
            (view) => {
              if (disposed || generation !== session.current) return;
              ref.current = view.data;
              setData(view.data);
              setPending(view.pending);
              setConflict(view.conflict);
              setCloudStatus(view.status);
              setError(view.error);
              setRemote(sync.state.base);
              setStorageStatus(
                view.status === "Cambios sin guardar"
                  ? "Cambios sin guardar"
                  : "Guardado en este dispositivo",
              );
            },
            storage.backup,
          );
          engine.current = sync;
          ref.current = state.data;
          setData(state.data);
          setReady(true);
          sync.start();
        } else {
          const raw = await AsyncStorage.getItem(key.current);
          if (disposed || generation !== session.current) return;
          const next = raw ? readBackup(raw) : emptyData();
          ref.current = next;
          setData(next);
          setReady(true);
          setStorageStatus("Guardado en este dispositivo");
          setCloudStatus("Modo local");
        }
      } catch {
        if (!disposed && generation === session.current) {
          setError(
            "No se pudieron leer o guardar tus datos locales. No se sobrescribirá la copia existente.",
          );
          setReady(false);
        }
      }
    };
    const unsubscribe = auth
      ? onAuthStateChanged(auth, (u) => {
          void load(u);
        })
      : undefined;
    if (!auth) void load(null);
    const wake = () => engine.current?.kick();
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") wake();
    });
    if (Platform.OS === "web") {
      window.addEventListener("online", wake);
      window.addEventListener("focus", wake);
    }
    return () => {
      disposed = true;
      ++session.current;
      unsubscribe?.();
      engine.current?.stop();
      appState.remove();
      if (Platform.OS === "web") {
        window.removeEventListener("online", wake);
        window.removeEventListener("focus", wake);
      }
    };
  }, []);
  const persistLocal = (next: AppData) => {
    const storageKey = key.current,
      generation = session.current;
    setStorageStatus("Guardando…");
    queue.current = queue.current
      .then(() => AsyncStorage.setItem(storageKey, JSON.stringify(next)))
      .then(() => {
        if (generation === session.current)
          setStorageStatus("Guardado en este dispositivo");
      })
      .catch(() => {
        if (generation === session.current) {
          setError("No se pudo guardar. Exporta un respaldo y reintenta.");
          setStorageStatus("Cambios sin guardar");
        }
      });
  };
  const change = (fn: (d: AppData) => AppData) => {
    if (!ready || busy.current)
      throw new Error(
        "Espera a que carguen tus datos o termine la importación.",
      );
    const next = fn(ref.current);
    if (engine.current) engine.current.change(next);
    else {
      ref.current = next;
      setData(next);
      persistLocal(next);
    }
  };
  const replaceData = async (next: AppData) => {
    if (!ready || busy.current)
      throw new Error("Espera a que termine la operación actual.");
    const validated = readBackup(JSON.stringify(next)),
      generation = session.current,
      storageKey = key.current;
    busy.current = true;
    try {
      await queue.current;
      await engine.current?.flushLocal();
      await AsyncStorage.setItem(
        storageKey + ":recovery",
        JSON.stringify(ref.current),
      );
      if (generation !== session.current) return;
      setHasRecovery(true);
      if (engine.current) {
        engine.current.change(validated);
        await engine.current.flushLocal();
      } else {
        await AsyncStorage.setItem(storageKey, JSON.stringify(validated));
        if (generation === session.current) {
          ref.current = validated;
          setData(validated);
        }
      }
    } finally {
      busy.current = false;
    }
  };
  const restorePrevious = async () => {
    const raw = await AsyncStorage.getItem(key.current + ":recovery");
    if (!raw) throw new Error("No hay una copia anterior.");
    const previous = readBackup(raw);
    await replaceData({
      ...previous,
      preferences: { ...previous.preferences, notifications: false },
    });
  };
  return (
    <Ctx.Provider
      value={{
        data,
        ready,
        user,
        guest,
        enterGuest: () => setGuest(true),
        exitGuest: () => setGuest(false),
        error,
        storageStatus,
        change,
        retry: () =>
          engine.current ? engine.current.retry() : persistLocal(ref.current),
        clearError: () => setError(""),
        cloud: async () => {
          engine.current?.retry();
        },
        cloudBusy: false,
        cloudStatus,
        pendingChanges,
        conflict,
        remoteData,
        resolveConflict: async (choice) => {
          await engine.current?.resolve(choice);
          setHasRecovery(true);
        },
        hasRecovery,
        replaceData,
        restorePrevious,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("AppProvider missing");
  return ctx;
}
