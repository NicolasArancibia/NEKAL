import { AppData, Item, newItem } from "../model";
import type { Cerebro } from "../agente/tipos";
import type { CorreoCompleto, CorreoResumen } from "./tipos";

// Neka y el correo (spec H3 §6.5). Puro salvo `clasificar`, que recibe el
// cerebro. Para ordenar, Neka ve solo remitente, asunto y primeras líneas; el
// texto completo, solo cuando se le pide un borrador.

export type Razon = "pide" | "pregunta" | "fecha" | "relacionado" | "nada";
export type Clase = { razon: Razon; fecha?: string; sobre?: string };
export type Borrador = {
  texto: string;
  evento?: { titulo: string; inicio: string; minutos: number };
};

const RAZONES: Razon[] = ["pide", "pregunta", "fecha", "relacionado", "nada"];
const LOTE = 25;
const EXTRACTO = 300;
const DIA_MS = 86_400_000;
const DIAS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];
const MESES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

export const clave = (c: CorreoResumen) => `${c.proveedor}:${c.cuenta}:${c.id}`;

const dos = (n: number) => String(n).padStart(2, "0");
const diaLocal = (t: Date) =>
  `${t.getFullYear()}-${dos(t.getMonth() + 1)}-${dos(t.getDate())}`;
const horaLocal = (t: Date) => `${dos(t.getHours())}:${dos(t.getMinutes())}`;
const acotar = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(n)));

// «AAAA-MM-DD» o «AAAA-MM-DDTHH:mm» en hora local. Sin hora, el día a mediodía.
function validar(s: unknown): { fecha: Date; hora: boolean } | null {
  if (typeof s !== "string") return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/);
  if (!m) return null;
  const [a, me, d] = [+m[1], +m[2] - 1, +m[3]];
  const hora = m[4] !== undefined;
  const [h, mi] = hora ? [+m[4], +m[5]] : [12, 0];
  const f = new Date(a, me, d, h, mi);
  const ok =
    f.getFullYear() === a &&
    f.getMonth() === me &&
    f.getDate() === d &&
    f.getHours() === h &&
    f.getMinutes() === mi;
  return ok ? { fecha: f, hora } : null;
}

const aLas = (f: Date, h: number) =>
  new Date(f.getFullYear(), f.getMonth(), f.getDate(), h, 0);

// El JSON de una respuesta de Neka, aunque venga en un bloque ```json o con texto alrededor.
function jsonDe(texto: string): any {
  const i = texto.indexOf("{");
  const j = texto.lastIndexOf("}");
  if (i < 0 || j <= i) return null;
  try {
    return JSON.parse(texto.slice(i, j + 1));
  } catch {
    return null;
  }
}

function hoyEs(ahora: number): string {
  const t = new Date(ahora);
  return `Hoy es ${DIAS[t.getDay()]} ${diaLocal(t)}.`;
}

export const INSTRUCCIONES_CORREO = `Eres Neka, la asistente de Nekal, una app de organización personal. Ayudas con el correo.
Te pueden pedir dos cosas:
1) Ordenar correos. Para cada correo elige una razón:
- "pide": pide algo concreto o tiene un plazo.
- "pregunta": espera una respuesta de la persona.
- "fecha": trae una fecha, una cita o un evento.
- "relacionado": tiene que ver con algo de Nekal (sus eventos, tareas o mesas); en "sobre" di con qué, en pocas palabras («tu reunión de hoy»).
- "nada": promociones, avisos automáticos, boletines o cosas que no requieren nada.
Si hay una fecha, va en "fecha" como AAAA-MM-DD o AAAA-MM-DDTHH:mm, en hora local.
2) Escribir un borrador de respuesta: breve, cálido, en el idioma del correo, firmado con el nombre de la persona, sin inventar datos que no estén en el correo o en la indicación.
Responde siempre solo con el JSON que se pide, sin texto alrededor.`;

export function pedidoClasificar(
  correos: CorreoResumen[],
  d: AppData,
  ahora: number,
): string {
  const t = new Date(ahora);
  const desde = new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
  const hasta = ahora + 14 * DIA_MS;
  const proximos = d.items
    .filter((i) => !i.deletedAt)
    .map((i) => ({ i, t: Date.parse(i.scheduledAt || i.dueAt) }))
    .filter((x) => x.t >= desde && x.t <= hasta)
    .sort((a, b) => a.t - b.t)
    .slice(0, 40)
    .map(
      ({ i, t }) =>
        `- «${i.title}» · ${diaLocal(new Date(t))} ${horaLocal(new Date(t))}`,
    );
  const lista = correos.map(
    (c, n) =>
      `[c${n + 1}] De: ${c.de.nombre} <${c.de.correo}> · Asunto: ${c.asunto || "(sin asunto)"} · Recibido: ${diaLocal(new Date(c.fecha))}\n${c.extracto.slice(0, EXTRACTO)}`,
  );
  return [
    hoyEs(ahora),
    "Lo próximo en Nekal (14 días):",
    proximos.join("\n") || "(nada)",
    `Mesas: ${d.workspaces.map((w) => w.name).join(", ")}`,
    "",
    "Correos:",
    lista.join("\n\n"),
    "",
    'Responde solo con JSON: {"correos":[{"id":"c1","razon":"pide|pregunta|fecha|relacionado|nada","fecha":"(si hay)","sobre":"(si es relacionado)"}]}',
  ].join("\n");
}

// null = la respuesta no se pudo leer (entonces se muestra todo lo principal).
export function leerClasificacion(
  texto: string,
  claves: string[],
): Map<string, Clase> | null {
  const o = jsonDe(texto);
  if (!o || !Array.isArray(o.correos)) return null;
  const out = new Map<string, Clase>();
  for (const e of o.correos) {
    const n = Number(String(e?.id ?? "").match(/^c(\d+)$/)?.[1]) - 1;
    if (!(n >= 0 && n < claves.length)) continue;
    let razon: Razon = RAZONES.includes(e.razon) ? e.razon : "nada";
    const fecha = validar(e.fecha) ? (e.fecha as string) : undefined;
    if (razon === "fecha" && !fecha) razon = "nada";
    const sobre =
      typeof e.sobre === "string" ? e.sobre.trim().slice(0, 60) : "";
    out.set(claves[n], {
      razon,
      ...(fecha && razon !== "nada" && { fecha }),
      ...(sobre && razon === "relacionado" && { sobre }),
    });
  }
  return out;
}

// Clasifica solo lo que la memoria no tiene. Si Neka falla, la memoria no cambia.
export async function clasificar(o: {
  cerebro: Cerebro;
  correos: CorreoResumen[];
  data: AppData;
  ahora: number;
  memoria: Map<string, Clase>;
}): Promise<{ fallo: boolean }> {
  const nuevos = o.correos.filter((c) => !o.memoria.has(clave(c)));
  try {
    for (let i = 0; i < nuevos.length; i += LOTE) {
      const lote = nuevos.slice(i, i + LOTE);
      const r = await o.cerebro
        .sesion(INSTRUCCIONES_CORREO, [], [])
        .enviar(pedidoClasificar(lote, o.data, o.ahora));
      const m = leerClasificacion(r.texto, lote.map(clave));
      if (!m) return { fallo: true };
      for (const c of lote)
        o.memoria.set(clave(c), m.get(clave(c)) ?? { razon: "nada" });
    }
  } catch {
    return { fallo: true };
  }
  return { fallo: false };
}

function cuando(s: string, ahora: number): string {
  const v = validar(s);
  if (!v) return "";
  const dia = aLas(v.fecha, 12);
  const n = Math.round(
    (dia.getTime() - aLas(new Date(ahora), 12).getTime()) / DIA_MS,
  );
  if (n === 0) return "hoy";
  if (n === 1) return "mañana";
  if (n > 1 && n < 7) return DIAS[dia.getDay()];
  return `${dia.getDate()} ${MESES[dia.getMonth()]}`;
}

// Hora de la fila: hoy «09:12», «ayer», esta semana «vie», si no «2 nov».
export function horaCorreo(fecha: string, ahora: number): string {
  const f = new Date(fecha);
  if (!Number.isFinite(f.getTime())) return "";
  const n = Math.round(
    (aLas(new Date(ahora), 12).getTime() - aLas(f, 12).getTime()) / DIA_MS,
  );
  if (n <= 0) return horaLocal(f);
  if (n === 1) return "ayer";
  if (n < 7) return DIAS[f.getDay()].slice(0, 3);
  return `${f.getDate()} ${MESES[f.getMonth()]}`;
}

// La cita que ofrece el borrador: «sábado 21 a las 17:00».
export function textoInicio(inicio: string): string {
  const v = validar(inicio);
  if (!v) return "";
  const dia = `${DIAS[v.fecha.getDay()]} ${v.fecha.getDate()}`;
  return v.hora ? `${dia} a las ${horaLocal(v.fecha)}` : dia;
}

export function textoRazon(c: Clase, ahora: number): string {
  const f = c.fecha ? cuando(c.fecha, ahora) : "";
  switch (c.razon) {
    case "pide":
      return f ? `Pide algo · ${f}` : "Pide algo";
    case "pregunta":
      return "Te pregunta algo";
    case "fecha":
      return f ? `Fecha · ${f}` : "Trae una fecha";
    case "relacionado":
      return c.sobre ? `Sobre ${c.sobre}` : "Tiene que ver con tus cosas";
    default:
      return "";
  }
}

export function accion(
  r: Razon,
): "Crear tarea" | "Responder" | "Al calendario" | "Ver" {
  if (r === "pide") return "Crear tarea";
  if (r === "pregunta") return "Responder";
  if (r === "fecha") return "Al calendario";
  return "Ver";
}

export function resumenBandeja(total: number, importantes: number): string {
  return `De ${total} ${total === 1 ? "correo" : "correos"} de esta semana, ${importantes} ${importantes === 1 ? "es" : "son"} para ti.`;
}

const tituloDe = (c: CorreoResumen) =>
  (c.asunto.trim() || `Correo de ${c.de.nombre}`).slice(0, 160);

const descripcionDe = (c: CorreoResumen) =>
  `De: ${c.de.nombre === c.de.correo ? c.de.correo : `${c.de.nombre} <${c.de.correo}>`}\n\n${c.extracto}`;

// Sin hora, el plazo de una tarea queda a las 18:00 de ese día.
export function tareaDesdeCorreo(
  c: CorreoResumen,
  clase: Clase | undefined,
): Item {
  const v = clase?.fecha ? validar(clase.fecha) : null;
  const plazo = v ? (v.hora ? v.fecha : aLas(v.fecha, 18)) : null;
  return {
    ...newItem("general", "Tarea"),
    title: tituloDe(c),
    description: descripcionDe(c),
    dueAt: plazo ? plazo.toISOString() : "",
  };
}

// Sin hora, a las 9:00; sin fecha, mañana a las 9:00.
export function eventoDesdeCorreo(
  c: CorreoResumen,
  clase: Clase | undefined,
  ahora: number,
  extra: { titulo?: string; minutos?: number } = {},
): Item {
  const v = clase?.fecha ? validar(clase.fecha) : null;
  const manana = new Date(ahora + DIA_MS);
  const inicio = v ? (v.hora ? v.fecha : aLas(v.fecha, 9)) : aLas(manana, 9);
  return {
    ...newItem("general", "Evento"),
    title: (extra.titulo?.trim() || tituloDe(c)).slice(0, 160),
    description: descripcionDe(c),
    scheduledAt: inicio.toISOString(),
    startDate: diaLocal(inicio),
    duration: acotar(extra.minutos ?? 60, 5, 1440),
  };
}

export function pedidoBorrador(
  c: CorreoCompleto,
  indicacion: string,
  nombre: string,
  ahora = Date.now(),
): string {
  return [
    hoyEs(ahora),
    `Escribe la respuesta de ${nombre || "la persona"} a este correo.`,
    `Indicación: ${indicacion.trim() || "ninguna; propone una respuesta breve y amable"}`,
    `De: ${c.de.nombre} <${c.de.correo}>`,
    `Asunto: ${c.asunto || "(sin asunto)"}`,
    "Correo:",
    c.texto.slice(0, 4000),
    "",
    'Responde solo con JSON: {"texto":"la respuesta","evento":null}. Si la respuesta acuerda una cita con día y hora, en "evento" va {"titulo":"…","inicio":"AAAA-MM-DDTHH:mm","minutos":60}.',
  ].join("\n");
}

export function leerBorrador(texto: string): Borrador | null {
  const o = jsonDe(texto);
  if (!o || typeof o.texto !== "string" || !o.texto.trim()) return null;
  const e = o.evento;
  const conEvento =
    !!e &&
    typeof e.titulo === "string" &&
    !!e.titulo.trim() &&
    !!validar(e.inicio);
  return {
    texto: o.texto.trim(),
    ...(conEvento && {
      evento: {
        titulo: e.titulo.trim().slice(0, 160),
        inicio: e.inicio,
        minutos: acotar(Number(e.minutos) || 60, 5, 1440),
      },
    }),
  };
}
