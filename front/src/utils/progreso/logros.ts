import { AppData, LOGRO_IDS, LogroId, localDay, totalPoints } from "../model";
import { GENERAL } from "../estructura";
import { CONECTANDO, SINCRONIZANDO } from "../estadosNube";
import { cosasListas } from "./desde";
import { historial, inicioHistoria, rachas } from "./dias";
import { nivelDe, puntosParaNivel } from "./nivel";

// Logros (spec E §6): 24 iguales para todas las cuentas. Nunca se pierden.
export type Familia = "constancia" | "volumen" | "primeras";
export type Logro = {
  id: LogroId;
  familia: Familia;
  nombre: string;
  corto: string;
  icono: string;
  frase: string;
  pista?: string;
};
export type Hechos = {
  record: number;
  semanaPerfecta: boolean;
  dia100: boolean;
  listas: number;
  puntos: number;
  nivel: number;
  mesas: number;
  rutinas: number;
  metas: number;
  audio: boolean;
  plan: boolean;
};
export type Cola =
  | { tipo: "uno"; id: LogroId }
  | { tipo: "resumen"; ids: LogroId[]; lanzamiento: boolean }
  | null;

// Separador de miles a mano: no depende del idioma del dispositivo.
export const miles = (n: number) =>
  String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

const umbral = (id: LogroId) => Number(id.split("-").pop());

const racha = (n: number): Logro => ({
  id: `racha-${n}` as LogroId,
  familia: "constancia",
  nombre: `Racha de ${n} días`,
  corto: `Racha de ${n} días`,
  icono: "flame-outline",
  frase: `Cumpliste tu día ${n} días seguidos.`,
});
const listas = (n: number): Logro => ({
  id: `listas-${n}` as LogroId,
  familia: "volumen",
  nombre: `${miles(n)} cosas listas`,
  corto: `${miles(n)} cosas listas`,
  icono: "checkmark-done-outline",
  frase: `Ya completaste ${miles(n)} cosas.`,
});
const nivel = (n: number): Logro => ({
  id: `nivel-${n}` as LogroId,
  familia: "volumen",
  nombre: `Nivel ${n}`,
  corto: `Nivel ${n}`,
  icono: "star-outline",
  frase: `Llegaste al nivel ${n}.`,
});
const primera = (
  id: LogroId,
  nombre: string,
  corto: string,
  icono: string,
  frase: string,
  pista: string,
): Logro => ({ id, familia: "primeras", nombre, corto, icono, frase, pista });

export const CATALOGO: Logro[] = [
  ...[3, 7, 14, 30, 60, 100].map(racha),
  {
    id: "semana-perfecta",
    familia: "constancia",
    nombre: "Semana perfecta",
    corto: "Semana perfecta",
    icono: "sparkles-outline",
    frase: "Siete días seguidos con todo listo.",
  },
  ...[10, 50, 100, 250, 500, 1000].map(listas),
  ...[5, 10, 15, 20].map(nivel),
  primera(
    "primera-cosa",
    "Primera cosa completada",
    "Primera cosa",
    "checkmark-circle-outline",
    "Completaste tu primera cosa.",
    "Completa cualquier cosa.",
  ),
  primera(
    "primera-mesa",
    "Primera mesa",
    "Primera mesa",
    "layers-outline",
    "Creaste tu primera mesa.",
    "Crea una mesa en el Espacio.",
  ),
  primera(
    "primera-rutina",
    "Primera rutina",
    "Primera rutina",
    "repeat-outline",
    "Creaste tu primera rutina.",
    "Crea un grupo que se repita.",
  ),
  primera(
    "primera-meta",
    "Primera meta cumplida",
    "Primera meta",
    "trophy-outline",
    "Cumpliste tu primera meta.",
    "Completa una meta.",
  ),
  primera(
    "primer-dia-100",
    "Primer día al 100%",
    "Día al 100%",
    "ribbon-outline",
    "Completaste todo lo de un día.",
    "Completa todo lo de un día.",
  ),
  primera(
    "primer-audio",
    "Primer audio a Neka",
    "Primer audio",
    "mic-outline",
    "Le hablaste a Neka por primera vez.",
    "Mantén el micrófono y háblale a Neka.",
  ),
  primera(
    "primer-plan",
    "Primer plan de Neka aceptado",
    "Primer plan",
    "chatbubble-ellipses-outline",
    "Aceptaste tu primer plan de Neka.",
    "Acepta un plan que te proponga Neka.",
  ),
];

export function hechosDe(d: AppData, now: number): Hechos {
  const hoy = localDay(new Date(now));
  const dias = historial(d, inicioHistoria(d, now), hoy);
  let corrida = 0,
    semanaPerfecta = false;
  for (const x of dias) {
    if (!x.tenias) continue;
    corrida = x.hechas === x.tenias ? corrida + 1 : 0;
    if (corrida >= 7) semanaPerfecta = true;
  }
  const puntos = totalPoints(d);
  return {
    record: rachas(dias).record,
    semanaPerfecta,
    dia100: dias.some((x) => x.tenias > 0 && x.hechas === x.tenias),
    listas: cosasListas(d),
    puntos,
    nivel: nivelDe(puntos).nivel,
    mesas: d.workspaces.filter((w) => w.id !== GENERAL).length,
    rutinas: d.groups.filter((g) => g.repeat !== "").length,
    metas: d.items.filter(
      (i) => i.type === "Goal" && !i.deletedAt && i.status === "completado",
    ).length,
    audio: d.messages.some((x) => x.isUser && !!x.audio),
    plan: d.messages.some((x) => x.estado === "aceptado"),
  };
}

export function cumple(id: LogroId, h: Hechos): boolean {
  if (id.startsWith("racha-")) return h.record >= umbral(id);
  if (id.startsWith("listas-")) return h.listas >= umbral(id);
  if (id.startsWith("nivel-")) return h.nivel >= umbral(id);
  return {
    "semana-perfecta": h.semanaPerfecta,
    "primera-cosa": h.listas >= 1,
    "primera-mesa": h.mesas >= 1,
    "primera-rutina": h.rutinas >= 1,
    "primera-meta": h.metas >= 1,
    "primer-dia-100": h.dia100,
    "primer-audio": h.audio,
    "primer-plan": h.plan,
  }[id as string]!;
}

export function avance(
  id: LogroId,
  h: Hechos,
): { valor: number; texto: string } {
  if (cumple(id, h)) return { valor: 1, texto: "Logrado" };
  const n = umbral(id);
  if (id.startsWith("racha-"))
    return { valor: Math.min(1, h.record / n), texto: `${h.record}/${n}` };
  if (id.startsWith("listas-"))
    return {
      valor: Math.min(1, h.listas / n),
      texto: `${miles(h.listas)}/${miles(n)}`,
    };
  if (id.startsWith("nivel-")) {
    const valor = Math.min(1, h.puntos / puntosParaNivel(n));
    return { valor, texto: `${Math.round(valor * 100)}%` };
  }
  return { valor: 0, texto: "Pendiente" };
}

const vistoEn = (d: AppData, id: LogroId) =>
  d.logros.find((v) => v.id === id)?.at;

export const desbloqueados = (d: AppData, h: Hechos): LogroId[] =>
  LOGRO_IDS.filter((id) => cumple(id, h) || !!vistoEn(d, id));

export const porVer = (d: AppData, h: Hechos): LogroId[] =>
  LOGRO_IDS.filter((id) => cumple(id, h) && !vistoEn(d, id));

export function siguiente(d: AppData, h: Hechos): Cola {
  const ids = porVer(d, h);
  if (!ids.length) return null;
  if (ids.length < 4) return { tipo: "uno", id: ids[0] };
  return { tipo: "resumen", ids, lanzamiento: d.logros.length === 0 };
}

export function verLogros(d: AppData, ids: LogroId[], now: number): AppData {
  const at = new Date(now).toISOString();
  const nuevos = ids.filter(
    (id, k) => !vistoEn(d, id) && ids.indexOf(id) === k,
  );
  return nuevos.length
    ? { ...d, logros: [...d.logros, ...nuevos.map((id) => ({ id, at }))] }
    : d;
}

// 4 logrados más recientes y 4 bloqueados más cerca; se completa hasta 8.
export function paraPerfil(
  d: AppData,
  h: Hechos,
  now: number,
): { id: LogroId; logrado: boolean }[] {
  const ahora = new Date(now).toISOString();
  const logrados = desbloqueados(d, h).sort((a, b) =>
    (vistoEn(d, b) ?? ahora).localeCompare(vistoEn(d, a) ?? ahora),
  );
  const bloqueados = LOGRO_IDS.filter((id) => !logrados.includes(id)).sort(
    (a, b) => avance(b, h).valor - avance(a, h).valor,
  );
  const nL = Math.min(logrados.length, Math.max(4, 8 - bloqueados.length));
  const nB = Math.min(bloqueados.length, 8 - nL);
  return [
    ...logrados.slice(0, nL).map((id) => ({ id, logrado: true })),
    ...bloqueados.slice(0, nB).map((id) => ({ id, logrado: false })),
  ];
}

// El modal de logro sale solo si no hay hojas abiertas, grabación ni plan de
// Neka, y (con cuenta) después de la primera sincronización (spec E §6.3).
export function listoParaLogro(e: {
  hojas: number;
  grabando: boolean;
  planAbierto: boolean;
  conCuenta: boolean;
  estadoNube: string;
}): boolean {
  const sincronizando =
    e.conCuenta &&
    (e.estadoNube === CONECTANDO || e.estadoNube === SINCRONIZANDO);
  return !e.hojas && !e.grabando && !e.planAbierto && !sincronizando;
}
