import {
  AppData,
  Area,
  RAZON_COMPLETADO,
  Workspace,
  localDay,
  passive,
} from "../model";
import { timedItems } from "../espacio";
import { GENERAL } from "../estructura";
import { diasEntre, sumarDias } from "./desde";

// Tus mesas (spec E §5): rating «cómo vas ahora» por mesa y su área de vida.
export const AREAS: { id: Area; nombre: string; icono: string }[] = [
  { id: "estudio", nombre: "Estudio", icono: "school-outline" },
  { id: "trabajo", nombre: "Trabajo", icono: "briefcase-outline" },
  { id: "salud", nombre: "Salud", icono: "barbell-outline" },
  { id: "hogar", nombre: "Hogar", icono: "home-outline" },
  { id: "social", nombre: "Social", icono: "people-outline" },
  { id: "personal", nombre: "Personal", icono: "heart-outline" },
];

// En el orden de la tabla: gana la primera área que coincida.
const PALABRAS: [Area, string[]][] = [
  [
    "estudio",
    [
      "universidad",
      "uni",
      "u",
      "clase",
      "curso",
      "ramo",
      "tesis",
      "estudio",
      "colegio",
      "examen",
      "prueba",
    ],
  ],
  [
    "trabajo",
    [
      "trabajo",
      "pega",
      "oficina",
      "cliente",
      "proyecto",
      "empresa",
      "negocio",
      "freelance",
    ],
  ],
  [
    "salud",
    [
      "gym",
      "gimnasio",
      "salud",
      "deporte",
      "entreno",
      "medico",
      "doctor",
      "correr",
      "yoga",
    ],
  ],
  [
    "hogar",
    [
      "casa",
      "hogar",
      "depto",
      "departamento",
      "limpieza",
      "compras",
      "mascota",
    ],
  ],
  ["social", ["amigos", "familia", "social", "pareja", "cumpleanos"]],
];

export function areaSugerida(nombre: string): Area {
  const palabras = nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/);
  return (
    PALABRAS.find(([, claves]) =>
      palabras.some((p) => claves.includes(p)),
    )?.[0] ?? "personal"
  );
}

export const areaDe = (w: Workspace): Area => w.area ?? areaSugerida(w.name);

export type RatingMesa = {
  mesaId: string;
  valor: number | null;
  etiqueta: "Sube" | "Baja" | "Igual" | null;
  completadas: number;
  vencidas: number;
};

type Entrada = { dia: string; done: boolean };

// Una entrada por cosa: el día de su hora o, si no tiene, de su fecha límite.
// Sin fecha, cuenta el día en que se pagaron sus puntos.
function entradas(d: AppData, mesaId: string, now: number): Entrada[] {
  const out: Entrada[] = [];
  for (const i of timedItems(d)) {
    if (passive(i) || i.workspaceId !== mesaId) continue;
    const done = i.status === "completado";
    const fecha = i.scheduledAt || i.dueAt;
    if (fecha) {
      if (done || Date.parse(fecha) <= now)
        out.push({ dia: localDay(new Date(fecha)), done });
    } else if (done) {
      const premio = d.rewards.find(
        (r) => r.itemId === i.id && r.reason === RAZON_COMPLETADO,
      );
      if (premio) out.push({ dia: localDay(new Date(premio.at)), done });
    }
  }
  return out;
}

function ratingDe(todas: Entrada[], dia: string): number | null {
  const hasta = todas.filter((e) => e.dia <= dia);
  if (!hasta.length) return null;
  const A = hasta.reduce((max, e) => (e.dia > max ? e.dia : max), hasta[0].dia);
  const ventana = hasta.filter((e) => e.dia >= sumarDias(A, -27));
  if (ventana.length < 3) return null;
  let hechas = 0,
    total = 0;
  for (const e of ventana) {
    const peso = 4 - Math.floor(diasEntre(e.dia, A) / 7);
    total += peso;
    if (e.done) hechas += peso;
  }
  const base = Math.round((100 * hechas) / total);
  return Math.max(0, base - 5 * Math.floor(diasEntre(A, dia) / 7));
}

export const ratingEn = (
  d: AppData,
  mesaId: string,
  dia: string,
  now: number,
): number | null => ratingDe(entradas(d, mesaId, now), dia);

export function etiquetaDe(
  ahora: number | null,
  antes: number | null,
): RatingMesa["etiqueta"] {
  if (ahora === null || antes === null) return null;
  return ahora - antes >= 5 ? "Sube" : ahora - antes <= -5 ? "Baja" : "Igual";
}

export function ratingMesa(
  d: AppData,
  mesaId: string,
  now: number,
): RatingMesa {
  const todas = entradas(d, mesaId, now);
  const hoy = localDay(new Date(now));
  const valor = ratingDe(todas, hoy);
  const recientes = todas.filter(
    (e) => e.dia >= sumarDias(hoy, -27) && e.dia <= hoy,
  );
  return {
    mesaId,
    valor,
    etiqueta: etiquetaDe(valor, ratingDe(todas, sumarDias(hoy, -7))),
    completadas: recientes.filter((e) => e.done).length,
    vencidas: recientes.filter((e) => !e.done).length,
  };
}

export const ratings = (d: AppData, now: number): RatingMesa[] =>
  d.workspaces
    .filter((w) => w.id !== GENERAL)
    .map((w) => ratingMesa(d, w.id, now));
