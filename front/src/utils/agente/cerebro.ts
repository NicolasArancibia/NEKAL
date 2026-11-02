import {
  GenerateContentResult,
  GoogleAIBackend,
  ObjectSchemaRequest,
  getAI,
  getGenerativeModel,
} from "firebase/ai";
import { firebaseApp } from "../firebase";
import { MODELO, TRANSCRIBIR, crearCerebroStudio, historia } from "./gemini";
import type { Cerebro, Respuesta } from "./tipos";

// Único archivo que importa el SDK de Gemini (Firebase AI Logic, API gratis).
// Flash-Lite: en el plan gratis Flash (3.5 → 3.6) da solo 20 consultas al día
// al proyecto.

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

export function crearCerebro(): Cerebro {
  // Con una clave de Google AI Studio en `.env.development.local` se habla
  // directo con Gemini, con la cuota de ese otro proyecto. Esa variable no
  // entra en la build publicada (la clave quedaría a la vista de todos).
  const clave = process.env.EXPO_PUBLIC_GEMINI_STUDIO_KEY;
  if (clave) return crearCerebroStudio({ clave, modelo: MODELO });
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
