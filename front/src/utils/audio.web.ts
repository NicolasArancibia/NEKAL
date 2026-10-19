import type { AudioGrabado } from "./agente/tipos";

// Web: expo-audio graba audio/webm y deja una URL blob:.
export async function leerAudio(uri: string): Promise<AudioGrabado> {
  const blob = await (await fetch(uri)).blob();
  const dataUrl = await new Promise<string>((ok, mal) => {
    const lector = new FileReader();
    lector.onload = () => ok(String(lector.result));
    lector.onerror = () => mal(lector.error);
    lector.readAsDataURL(blob);
  });
  return {
    base64: dataUrl.slice(dataUrl.indexOf(",") + 1),
    mime: (blob.type || "audio/webm").split(";")[0],
  };
}
