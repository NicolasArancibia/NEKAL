// TEMPORAL (Task 1 del plan D): prueba de Gemini, App Check, audio y voz.
// Ahora con diagnóstico de la grabación. Se borra en la Task 8.
import { useRef, useState } from "react";
import { Pressable, View } from "react-native";
import {
  RecordingPresets,
  createAudioPlayer,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
import * as Speech from "expo-speech";
import { Button, Field, Sheet, Txt } from "../base";
import { color, radius, size, space } from "../../../styles/theme";
import { MODELO, crearCerebro } from "../../../utils/agente/cerebro";
import type { AudioGrabado, Declaracion } from "../../../utils/agente/tipos";
import { leerAudio } from "../../../utils/audio";

const HORA: Declaracion = {
  name: "hora",
  description: "Devuelve la hora local actual del teléfono.",
  parameters: { type: "object", properties: {} },
};

export default function PruebaNeka({ onClose }: { onClose: () => void }) {
  const grabadora = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [texto, setTexto] = useState("¿Qué hora es?");
  const [respuesta, setRespuesta] = useState("");
  const [estado, setEstado] = useState("");
  const [grabando, setGrabando] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [audio, setAudio] = useState<AudioGrabado | null>(null);
  const [uri, setUri] = useState("");
  const t0 = useRef(0);
  const anotar = (m: string) =>
    setLog((l) => [...l, `+${Date.now() - t0.current} ms · ${m}`]);

  const preguntar = async (pregunta: string) => {
    const inicio = Date.now();
    setEstado("Pensando…");
    try {
      const sesion = crearCerebro().sesion(
        "Eres Neka, una asistente en español. Responde en una oración. Para saber la hora usa la herramienta hora.",
        [],
        [HORA],
      );
      let r = await sesion.enviar(pregunta);
      if (r.llamadas.length)
        r = await sesion.devolver(
          r.llamadas.map((l) => ({
            nombre: l.nombre,
            respuesta: { hora: new Date().toLocaleTimeString("es-CL") },
          })),
        );
      setRespuesta(r.texto);
      setEstado(`Listo en ${((Date.now() - inicio) / 1000).toFixed(1)} s`);
      Speech.speak(r.texto, { language: "es-CL" });
    } catch (e) {
      setEstado(`Error: ${(e as Error).message.slice(0, 300)}`);
    }
  };

  const empezar = async () => {
    t0.current = Date.now();
    setLog([]);
    anotar("apretado");
    try {
      const permiso = await requestRecordingPermissionsAsync();
      anotar(`permiso: ${permiso.granted ? "sí" : "no"}`);
      if (!permiso.granted) return;
      Speech.stop();
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      anotar("modo de audio listo");
      await grabadora.prepareToRecordAsync();
      anotar("grabadora preparada");
      grabadora.record();
      setGrabando(true);
      anotar(`grabando (isRecording=${grabadora.isRecording})`);
    } catch (e) {
      anotar(`error al empezar: ${(e as Error).message}`);
    }
  };

  const soltar = async () => {
    anotar(
      `soltado (estado=${grabando}, isRecording=${grabadora.isRecording})`,
    );
    if (!grabando) return;
    setGrabando(false);
    try {
      await grabadora.stop();
      anotar(`detenida · ${grabadora.uri ? "con archivo" : "SIN archivo"}`);
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });
      if (!grabadora.uri) return;
      setUri(grabadora.uri);
      const a = await leerAudio(grabadora.uri);
      setAudio(a);
      anotar(
        `audio: ${Math.round((a.base64.length * 3) / 4 / 1024)} KB · ${a.mime}`,
      );
    } catch (e) {
      anotar(`error al soltar: ${(e as Error).message}`);
    }
  };

  const escuchar = () => {
    if (!uri) return;
    const reproductor = createAudioPlayer(uri);
    reproductor.play();
    anotar("reproduciendo la grabación");
  };

  const transcribir = async () => {
    if (!audio) return;
    const inicio = Date.now();
    setEstado("Escuchando…");
    try {
      const oyo = await crearCerebro().transcribir(audio);
      anotar(
        `Gemini oyó: «${oyo || "(vacío)"}» en ${((Date.now() - inicio) / 1000).toFixed(1)} s`,
      );
      setEstado("");
      if (oyo) await preguntar(oyo);
    } catch (e) {
      setEstado(`Error: ${(e as Error).message.slice(0, 300)}`);
    }
  };

  return (
    <Sheet visible title="Prueba IA" onClose={onClose}>
      <Txt variant="caption" tone="secondary">
        Modelo: {MODELO}
      </Txt>
      <Field label="Pregunta" value={texto} onChange={setTexto} />
      <Button title="Enviar" onPress={() => preguntar(texto)} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Mantén para grabar"
        onPressIn={empezar}
        onPressOut={soltar}
        style={{
          minHeight: size.minTouch,
          borderRadius: radius.pill,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: grabando ? color.danger : color.primarySoft,
        }}
      >
        <Txt weight={700} tone={grabando ? "onPrimary" : "primary"}>
          {grabando ? "Suelta para enviar" : "Mantén para grabar"}
        </Txt>
      </Pressable>
      <View style={{ flexDirection: "row", gap: space.sm }}>
        <View style={{ flex: 1 }}>
          <Button
            title="Escuchar grabación"
            variant="secondary"
            small
            disabled={!uri}
            onPress={escuchar}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            title="Transcribir"
            variant="secondary"
            small
            disabled={!audio}
            onPress={transcribir}
          />
        </View>
      </View>
      <View style={{ gap: space.xs }}>
        {log.map((l, n) => (
          <Txt key={n} variant="caption">
            {l}
          </Txt>
        ))}
        {!!respuesta && <Txt weight={600}>{respuesta}</Txt>}
        {!!estado && <Txt variant="callout">{estado}</Txt>}
      </View>
    </Sheet>
  );
}
