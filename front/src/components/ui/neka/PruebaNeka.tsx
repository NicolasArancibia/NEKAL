// TEMPORAL (Task 1 del plan D): prueba de Gemini, App Check, audio y voz.
// Se borra en la Task 8.
import { useState } from "react";
import { Pressable, View } from "react-native";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
import * as Speech from "expo-speech";
import { Button, Field, Sheet, Txt } from "../base";
import { color, radius, size, space } from "../../../styles/theme";
import { crearCerebro } from "../../../utils/agente/cerebro";
import type { Declaracion } from "../../../utils/agente/tipos";
import { leerAudio } from "../../../utils/audio";

const HORA: Declaracion = {
  name: "hora",
  description: "Devuelve la hora local actual del teléfono.",
  parameters: { type: "object", properties: {} },
};

export default function PruebaNeka({ onClose }: { onClose: () => void }) {
  const grabadora = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [texto, setTexto] = useState("¿Qué hora es?");
  const [oido, setOido] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [estado, setEstado] = useState("");
  const [grabando, setGrabando] = useState(false);

  const preguntar = async (pregunta: string) => {
    const t0 = Date.now();
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
      setEstado(`Listo en ${((Date.now() - t0) / 1000).toFixed(1)} s`);
      Speech.speak(r.texto, { language: "es-CL" });
    } catch (e) {
      setEstado(`Error: ${(e as Error).message}`);
    }
  };

  const empezar = async () => {
    const permiso = await requestRecordingPermissionsAsync();
    if (!permiso.granted) {
      setEstado("Sin permiso de micrófono.");
      return;
    }
    Speech.stop();
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await grabadora.prepareToRecordAsync();
    grabadora.record();
    setGrabando(true);
    setEstado("Grabando…");
  };

  const soltar = async () => {
    if (!grabando) return;
    setGrabando(false);
    const t0 = Date.now();
    try {
      await grabadora.stop();
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });
      if (!grabadora.uri) throw new Error("La grabación no dejó archivo.");
      setEstado("Escuchando…");
      const audio = await leerAudio(grabadora.uri);
      const oyo = await crearCerebro().transcribir(audio);
      setOido(
        `${oyo || "(vacío)"} · ${audio.mime} · ${((Date.now() - t0) / 1000).toFixed(1)} s`,
      );
      if (oyo) await preguntar(oyo);
    } catch (e) {
      setEstado(`Error: ${(e as Error).message}`);
    }
  };

  return (
    <Sheet visible title="Prueba IA" onClose={onClose}>
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
      <View style={{ gap: space.sm }}>
        {!!oido && <Txt tone="secondary">Oí: {oido}</Txt>}
        {!!respuesta && <Txt weight={600}>{respuesta}</Txt>}
        {!!estado && <Txt variant="callout">{estado}</Txt>}
      </View>
    </Sheet>
  );
}
