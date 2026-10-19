import { File } from "expo-file-system";
import type { AudioGrabado } from "./agente/tipos";

// iPhone: expo-audio graba .m4a (AAC en MPEG-4).
export async function leerAudio(uri: string): Promise<AudioGrabado> {
  return { base64: await new File(uri).base64(), mime: "audio/mp4" };
}
