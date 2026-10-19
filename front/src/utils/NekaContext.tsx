import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
import * as Speech from "expo-speech";
import { useApp } from "./AppContext";
import { crearCerebro } from "./agente/cerebro";
import { Contestacion, MENSAJES, conversar, oir } from "./agente/conversar";
import { Plan, aceptar as aceptarPlan } from "./agente/plan";
import { agregar, marcarPlan, nuevoMensaje } from "./agente/mensajes";
import { leerAudio } from "./audio";

// Neka para toda la app (spec D §5): conversación, plan pendiente (solo en
// memoria), grabación y voz. Lo usan el chat, la pestaña y el Resumen.
export type Origen = "chat" | "rapido";
export type TurnoNeka = {
  mensajeId: string;
  pregunta: string;
  audio: boolean;
  respuesta: string;
  plan: Plan | null;
  origen: Origen;
};
export type Neka = {
  pensando: boolean;
  grabando: boolean;
  sinIA: boolean;
  voz: boolean;
  setVoz(v: boolean): void;
  turno: TurnoNeka | null;
  pendienteId: string | null;
  hoja: boolean;
  abrirPlan(mensajeId: string): void;
  cerrarHoja(): void;
  error: string;
  enviar(texto: string, origen: Origen): Promise<void>;
  empezarGrabar(origen: Origen): Promise<void>;
  soltar(): Promise<void>;
  aceptar(marcados: boolean[]): void;
  descartar(): void;
  leer(texto: string): void;
};

const VOZ = "neka:voz";
const MAX_AUDIO_MS = 60000;
const MIN_AUDIO_MS = 500;
const CORTO = "Mantén apretado mientras hablas.";
const leerEnVoz = (texto: string) => {
  Speech.stop();
  Speech.speak(texto, { language: "es-CL" });
};

const NekaContext = createContext<Neka | null>(null);

export function NekaProvider({ children }: { children: ReactNode }) {
  const { data, change } = useApp();
  const grabadora = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [pensando, setPensando] = useState(false);
  const [grabando, setGrabando] = useState(false);
  const [sinIA, setSinIA] = useState(false);
  const [voz, setVozState] = useState(true);
  const [turno, setTurno] = useState<TurnoNeka | null>(null);
  const [pendienteId, setPendienteId] = useState<string | null>(null);
  const [hoja, setHoja] = useState(false);
  const [error, setError] = useState("");
  const datos = useRef(data);
  datos.current = data;
  const vozRef = useRef(voz);
  vozRef.current = voz;
  // Refs y no estado: preparar el micrófono tarda ~320 ms y el estado de React
  // no alcanza a cambiar si se suelta antes (prueba en el iPhone, Task 1).
  const ocupado = useRef(false);
  const enGrabacion = useRef(false);
  const soltado = useRef(false);
  const inicio = useRef(0);
  const origenGrabacion = useRef<Origen>("chat");
  const tope = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    AsyncStorage.getItem(VOZ)
      .then((v) => v !== null && setVozState(v === "1"))
      .catch(() => {});
  }, []);
  const setVoz = (v: boolean) => {
    setVozState(v);
    if (!v) Speech.stop();
    AsyncStorage.setItem(VOZ, v ? "1" : "0").catch(() => {});
  };

  const guardar = (fn: Parameters<typeof change>[0]) => {
    try {
      change(fn);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  };

  // Un turno completo; quien llama ya marcó `ocupado`.
  const turnoCon = async (texto: string, origen: Origen, audio: boolean) => {
    const antes = datos.current;
    const pregunta = nuevoMensaje(
      texto,
      true,
      audio ? { audio: true } : undefined,
    );
    if (!guardar((d) => agregar(d, pregunta))) return;
    let c: Contestacion;
    try {
      c = await conversar(crearCerebro(), antes, texto, Date.now());
    } catch (e) {
      c = {
        respuesta: MENSAJES["sin-ia"],
        plan: null,
        fallo: "sin-ia",
        motivo: (e as Error).message,
      };
    }
    setSinIA(c.fallo === "sin-ia");
    if (__DEV__ && c.motivo) console.warn("Neka sin IA:", c.motivo);
    const respuesta = nuevoMensaje(c.respuesta, false);
    const planMsg = c.plan
      ? nuevoMensaje("", false, { plan: c.plan.resumen, estado: "pendiente" })
      : null;
    guardar((d) => agregar(d, respuesta, ...(planMsg ? [planMsg] : [])));
    setTurno({
      mensajeId: planMsg?.id ?? respuesta.id,
      pregunta: texto,
      audio,
      respuesta: c.respuesta,
      plan: c.plan,
      origen,
    });
    setPendienteId(planMsg?.id ?? null);
    if (c.plan || origen === "rapido") setHoja(true);
    if (vozRef.current && c.respuesta) leerEnVoz(c.respuesta);
  };

  const conGuardia = async (fn: () => Promise<void>) => {
    if (ocupado.current) return;
    ocupado.current = true;
    setPensando(true);
    setError("");
    try {
      await fn();
    } finally {
      ocupado.current = false;
      setPensando(false);
    }
  };

  const enviar = (texto: string, origen: Origen) =>
    texto.trim()
      ? conGuardia(() => turnoCon(texto.trim(), origen, false))
      : Promise.resolve();

  const detener = async () => {
    clearTimeout(tope.current);
    enGrabacion.current = false;
    setGrabando(false);
    await grabadora.stop();
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
    });
  };

  const soltar = async () => {
    soltado.current = true;
    // Todavía preparando: empezarGrabar lo descarta apenas empiece.
    if (!enGrabacion.current) return;
    const corta = Date.now() - inicio.current < MIN_AUDIO_MS;
    await detener();
    const uri = grabadora.uri;
    if (corta || !uri) {
      setError(CORTO);
      return;
    }
    const origen = origenGrabacion.current;
    await conGuardia(async () => {
      const r = await oir(crearCerebro(), await leerAudio(uri));
      if (!r.fallo) return turnoCon(r.texto, origen, true);
      if (r.fallo === "sin-ia") setSinIA(true);
      const aviso = nuevoMensaje(MENSAJES[r.fallo], false);
      guardar((d) => agregar(d, aviso));
      setTurno({
        mensajeId: aviso.id,
        pregunta: "",
        audio: true,
        respuesta: aviso.text,
        plan: null,
        origen,
      });
      if (origen === "rapido") setHoja(true);
      if (vozRef.current) leerEnVoz(aviso.text);
    });
  };

  const empezarGrabar = async (origen: Origen) => {
    if (ocupado.current || enGrabacion.current) return;
    soltado.current = false;
    origenGrabacion.current = origen;
    setError("");
    try {
      const permiso = await requestRecordingPermissionsAsync();
      if (!permiso.granted) {
        setError("Activa el micrófono para Nekal en Ajustes del iPhone.");
        return;
      }
      Speech.stop();
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await grabadora.prepareToRecordAsync();
      grabadora.record();
      enGrabacion.current = true;
      inicio.current = Date.now();
      setGrabando(true);
      if (soltado.current) {
        await detener();
        setError(CORTO);
        return;
      }
      tope.current = setTimeout(() => void soltar(), MAX_AUDIO_MS);
    } catch (e) {
      enGrabacion.current = false;
      setGrabando(false);
      setError((e as Error).message);
    }
  };

  const aceptar = (marcados: boolean[]) => {
    if (!turno?.plan || !pendienteId) return;
    const plan = turno.plan,
      id = pendienteId;
    const ok = guardar((d) =>
      marcarPlan(aceptarPlan(d, plan, marcados, Date.now()), id, "aceptado"),
    );
    if (!ok) return;
    setPendienteId(null);
    setHoja(false);
    setError("");
  };
  const descartar = () => {
    if (pendienteId) guardar((d) => marcarPlan(d, pendienteId, "descartado"));
    setPendienteId(null);
    setHoja(false);
    setError("");
  };
  const abrirPlan = (mensajeId: string) => {
    if (turno && mensajeId === pendienteId) {
      setTurno({ ...turno, origen: "chat" });
      setHoja(true);
    }
  };

  return (
    <NekaContext.Provider
      value={{
        pensando,
        grabando,
        sinIA,
        voz,
        setVoz,
        turno,
        pendienteId,
        hoja,
        abrirPlan,
        cerrarHoja: () => setHoja(false),
        error,
        enviar,
        empezarGrabar,
        soltar,
        aceptar,
        descartar,
        leer: leerEnVoz,
      }}
    >
      {children}
    </NekaContext.Provider>
  );
}

export function useNeka(): Neka {
  const n = useContext(NekaContext);
  if (!n) throw new Error("useNeka necesita NekaProvider.");
  return n;
}
