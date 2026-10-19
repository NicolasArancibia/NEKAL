import { AppData, uid } from "../model";
import { contexto, historial } from "./contexto";
import { DECLARACIONES, ejecutar } from "./herramientas";
import type { Plan, PasoPlan } from "./plan";
import type { AudioGrabado, Cerebro, Resultado } from "./tipos";

// Un turno con Neka (spec D §4 y §6): Gemini pide herramientas, la app las
// ejecuta sobre una copia y le devuelve el resultado, hasta 5 vueltas. Los
// pasos que juntan las herramientas son el plan.
export const INSTRUCCIONES = `Eres Neka, la asistente de Nekal, una app de organización personal. Hablas en español neutro, con tuteo, cálida y breve: máximo 2 oraciones, porque tu respuesta se lee en voz alta.
Reglas:
- Para cualquier cambio usa las herramientas. Nunca digas que ya lo hiciste: di «te propongo…», porque la persona lo acepta en pantalla.
- «Voy atrasado N minutos» → correrDesde con esos minutos. Si no dice cuántos, pregunta. Si correrDesde devuelve cosas que no caben hoy, propón otro día con buscarHueco y mover.
- No muevas lo que está marcado «fija» salvo que la persona lo nombre.
- Usa los ids entre corchetes del contexto. Para lo que no aparece, usa buscar.
- Las fechas van como AAAA-MM-DD HH:mm, en la hora local de «Ahora».
- Si algo es ambiguo, pregunta antes de proponer.
- «Arregla los choques»: lleva lo flexible que choca a un hueco con buscarHueco y mover.
- Si te preguntan qué tienen, responde con lo del contexto, sin proponer cambios.`;
export const TOPE_VUELTAS = 5;
export const ESPERA_MS = 30000;
export type Fallo = "sin-ia" | "tarde" | "no-oi";
export const MENSAJES: Record<Fallo, string> = {
  "sin-ia": "Ahora no puedo pensar con IA; te dejo lo de siempre.",
  tarde: "No alcancé, inténtalo de nuevo.",
  "no-oi": "No te escuché bien, ¿me lo repites?",
};
export type Contestacion = {
  respuesta: string;
  plan: Plan | null;
  fallo?: Fallo;
  motivo?: string; // mensaje técnico del error, para la consola en desarrollo
};

class Tarde extends Error {}
function aTiempo<T>(p: Promise<T>, ms: number): Promise<T> {
  let reloj: ReturnType<typeof setTimeout> | undefined;
  const vence = new Promise<never>((_, mal) => {
    reloj = setTimeout(() => mal(new Tarde()), ms);
  });
  return Promise.race([p, vence]).finally(() => clearTimeout(reloj));
}
const fallo = (e: unknown): { fallo: Fallo; motivo?: string } =>
  e instanceof Tarde
    ? { fallo: "tarde" }
    : { fallo: "sin-ia", motivo: (e as Error)?.message ?? String(e) };

async function vueltas(
  c: Cerebro,
  d: AppData,
  texto: string,
  now: number,
): Promise<Contestacion> {
  const sesion = c.sesion(
    `${INSTRUCCIONES}\n\n${contexto(d, now)}`,
    historial(d),
    DECLARACIONES,
  );
  let r = await sesion.enviar(texto);
  const pasos: PasoPlan[] = [];
  for (let n = 0; r.llamadas.length && n < TOPE_VUELTAS; n++) {
    const resultados: Resultado[] = r.llamadas.map((l) => {
      const e = ejecutar(d, pasos, l, now);
      pasos.push(...e.pasos);
      return { nombre: l.nombre, respuesta: e.resultado };
    });
    r = await sesion.devolver(resultados);
  }
  const plan = pasos.length
    ? {
        id: uid(),
        resumen: `${pasos.length} cambio${pasos.length === 1 ? "" : "s"}`,
        pasos,
      }
    : null;
  const respuesta = r.llamadas.length
    ? r.texto || "No logré armarlo del todo."
    : r.texto || (plan ? "Te propongo estos cambios." : "");
  return { respuesta, plan };
}

export async function conversar(
  c: Cerebro,
  d: AppData,
  texto: string,
  now: number,
  esperaMs = ESPERA_MS,
): Promise<Contestacion> {
  try {
    return await aTiempo(vueltas(c, d, texto, now), esperaMs);
  } catch (e) {
    const f = fallo(e);
    return { respuesta: MENSAJES[f.fallo], plan: null, ...f };
  }
}

export async function oir(
  c: Cerebro,
  audio: AudioGrabado,
  esperaMs = ESPERA_MS,
): Promise<{ texto: string; fallo?: Fallo }> {
  try {
    const texto = (await aTiempo(c.transcribir(audio), esperaMs)).trim();
    return texto ? { texto } : { texto: "", fallo: "no-oi" };
  } catch (e) {
    return { texto: "", fallo: fallo(e).fallo };
  }
}
