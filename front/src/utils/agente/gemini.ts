import type { Cerebro, Respuesta, Turno } from "./tipos";

// Lo común de hablar con Gemini y un cerebro que lo hace directo por REST con una
// clave de Google AI Studio (sin el SDK de Firebase). Puro: la red se inyecta.
export const MODELO = "gemini-3.5-flash-lite";
export const TRANSCRIBIR =
  "Escribe exactamente lo que dice este audio, en español. Si no se entiende, responde vacío.";
const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// Gemini pide que el historial empiece por la persona y alterne turnos; el
// último de la persona se quita porque el mensaje nuevo va con `enviar`.
type Hablado = { role: "user" | "model"; parts: { text: string }[] };
export function historia(turnos: Turno[]): Hablado[] {
  const out: Hablado[] = [];
  for (const t of turnos) {
    if (!t.texto.trim()) continue;
    const role = t.deUsuario ? "user" : "model";
    if (!out.length && role === "model") continue;
    const ultimo = out[out.length - 1];
    if (ultimo?.role === role) ultimo.parts.push({ text: t.texto });
    else out.push({ role, parts: [{ text: t.texto }] });
  }
  if (out[out.length - 1]?.role === "user") out.pop();
  return out;
}

type Parte = Record<string, unknown>;
type Contenido = { role: "user" | "model"; parts: Parte[] };
export type Fetcher = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string },
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;
type Cuerpo = { error?: { message?: string } } & {
  candidates?: { content?: Partial<Contenido> }[];
};

export function crearCerebroStudio(o: {
  clave: string;
  modelo: string;
  fetcher?: Fetcher;
}): Cerebro {
  const fetcher: Fetcher = o.fetcher ?? ((url, init) => fetch(url, init));

  async function pedir(cuerpo: object): Promise<Cuerpo> {
    const r = await fetcher(`${BASE}/${o.modelo}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": o.clave,
      },
      body: JSON.stringify(cuerpo),
    });
    const json = (await r.json().catch(() => ({}))) as Cuerpo;
    if (!r.ok)
      throw new Error(
        `Gemini ${r.status}: ${json?.error?.message ?? "sin detalle"}`,
      );
    return json;
  }
  // Una respuesta bloqueada o sin candidatos queda vacía, igual que con el SDK.
  function leer(json: Cuerpo): { contenido?: Contenido; respuesta: Respuesta } {
    const parte = json.candidates?.[0]?.content;
    const partes = parte?.parts ?? [];
    const texto = partes
      .filter((p) => typeof p.text === "string" && !p.thought)
      .map((p) => p.text as string)
      .join("")
      .trim();
    const llamadas = partes.flatMap((p) => {
      const f = p.functionCall as
        { name: string; args?: Record<string, unknown> } | undefined;
      return f ? [{ nombre: f.name, args: f.args ?? {} }] : [];
    });
    return {
      contenido: parte ? ({ role: "model", ...parte } as Contenido) : undefined,
      respuesta: { texto, llamadas },
    };
  }

  return {
    async transcribir(audio) {
      const { respuesta } = leer(
        await pedir({
          contents: [
            {
              role: "user",
              parts: [
                { text: TRANSCRIBIR },
                { inlineData: { mimeType: audio.mime, data: audio.base64 } },
              ],
            },
          ],
        }),
      );
      return respuesta.texto;
    },
    sesion(instrucciones, historial, herramientas) {
      const contents: Contenido[] = historia(historial);
      // Gemini 3 exige devolver el turno del modelo tal cual (con sus firmas) y
      // responder cada llamada con su mismo `id`.
      const turno = async (nuevo: Contenido): Promise<Respuesta> => {
        contents.push(nuevo);
        const { contenido, respuesta } = leer(
          await pedir({
            systemInstruction: { parts: [{ text: instrucciones }] },
            ...(herramientas.length
              ? { tools: [{ functionDeclarations: herramientas }] }
              : {}),
            contents,
          }),
        );
        if (contenido) contents.push(contenido);
        return respuesta;
      };
      return {
        enviar: (texto) => turno({ role: "user", parts: [{ text: texto }] }),
        devolver: (resultados) => {
          const ultimo = contents[contents.length - 1];
          const pedidas = (ultimo?.role === "model" ? ultimo.parts : []).filter(
            (p) => p.functionCall,
          );
          return turno({
            role: "user",
            parts: resultados.map((x, n) => {
              const id = (
                pedidas[n]?.functionCall as { id?: string } | undefined
              )?.id;
              return {
                functionResponse: {
                  name: x.nombre,
                  ...(id ? { id } : {}),
                  response: x.respuesta,
                },
              };
            }),
          });
        },
      };
    },
  };
}
