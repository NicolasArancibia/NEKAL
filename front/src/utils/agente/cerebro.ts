import {
  Content,
  GenerateContentResult,
  GoogleAIBackend,
  ObjectSchemaRequest,
  getAI,
  getGenerativeModel,
} from "firebase/ai";
import { firebaseApp } from "../firebase";
import type { Cerebro, Respuesta, Turno } from "./tipos";

// Único archivo que habla con Gemini (Firebase AI Logic, API gratis).
export const MODELO = "gemini-3.5-flash";

const TRANSCRIBIR =
  "Escribe exactamente lo que dice este audio, en español. Si no se entiende, responde vacío.";

function respuesta(r: GenerateContentResult): Respuesta {
  const llamadas = (r.response.functionCalls() ?? []).map((c) => ({
    nombre: c.name,
    args: (c.args ?? {}) as Record<string, unknown>,
  }));
  let texto = "";
  try {
    texto = r.response.text();
  } catch {
    // Una respuesta que solo trae llamadas no tiene texto.
  }
  return { texto: texto.trim(), llamadas };
}

// Gemini pide que el historial empiece por la persona y alterne turnos; el
// último de la persona se quita porque el mensaje nuevo va con `enviar`.
function historia(turnos: Turno[]): Content[] {
  const out: Content[] = [];
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

export function crearCerebro(): Cerebro {
  if (!firebaseApp) throw new Error("Firebase no está configurado.");
  const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });
  return {
    async transcribir(audio) {
      const model = getGenerativeModel(ai, { model: MODELO });
      const r = await model.generateContent([
        TRANSCRIBIR,
        { inlineData: { mimeType: audio.mime, data: audio.base64 } },
      ]);
      return respuesta(r).texto;
    },
    sesion(instrucciones, historial, herramientas) {
      const model = getGenerativeModel(ai, {
        model: MODELO,
        systemInstruction: instrucciones,
        tools: herramientas.length
          ? [
              {
                functionDeclarations: herramientas.map((h) => ({
                  ...h,
                  parameters: h.parameters as ObjectSchemaRequest,
                })),
              },
            ]
          : undefined,
      });
      const chat = model.startChat({ history: historia(historial) });
      return {
        enviar: async (texto) => respuesta(await chat.sendMessage(texto)),
        devolver: async (resultados) =>
          respuesta(
            await chat.sendMessage(
              resultados.map((x) => ({
                functionResponse: { name: x.nombre, response: x.respuesta },
              })),
            ),
          ),
      };
    },
  };
}
