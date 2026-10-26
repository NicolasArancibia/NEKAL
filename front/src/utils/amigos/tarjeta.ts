import { AppData, Area, LogroId, totalPoints } from "../model";
import { CONECTANDO, SINCRONIZANDO } from "../estadosNube";
import { dia1De } from "../progreso/desde";
import { desbloqueados, hechosDe } from "../progreso/logros";
import { AREAS, areaDe, ratings } from "../progreso/mesas";
import { nivelDe } from "../progreso/nivel";

// Lo que muestras a tus amigos (spec F §4). Nunca lleva nombres de mesas.
export type AreaTarjeta = { valor: number; mesas: number };
export type Tarjeta = {
  nombre: string;
  roles: string;
  desde: string;
  nivel: number;
  puntos: number;
  logros: LogroId[];
  areas: Partial<Record<Area, AreaTarjeta>>;
  codigo: string;
};

// Promedio redondeado por área; las mesas sin rating no suman ni cuentan.
export function agruparAreas(
  filas: { area: Area; valor: number | null }[],
): Tarjeta["areas"] {
  const suma: Partial<Record<Area, number[]>> = {};
  for (const f of filas)
    if (f.valor !== null) (suma[f.area] ??= []).push(f.valor);
  const areas: Tarjeta["areas"] = {};
  for (const [area, v] of Object.entries(suma) as [Area, number[]][])
    areas[area] = {
      valor: Math.round(v.reduce((a, b) => a + b, 0) / v.length),
      mesas: v.length,
    };
  return areas;
}

export const areasDe = (d: AppData, now: number) =>
  agruparAreas(
    ratings(d, now).map((r) => ({
      area: areaDe(d.workspaces.find((w) => w.id === r.mesaId)!),
      valor: r.valor,
    })),
  );

// De mayor a menor; si empatan, en el orden de AREAS.
export const areasOrdenadas = (areas: Tarjeta["areas"]) =>
  AREAS.flatMap((a) =>
    areas[a.id] ? [{ area: a.id, ...areas[a.id]! }] : [],
  ).sort((a, b) => b.valor - a.valor);

export function tarjetaDe(
  d: AppData,
  now: number,
  amigos: number,
  codigo: string,
): Tarjeta {
  const puntos = Math.round(totalPoints(d));
  const ahora = new Date(now).toISOString();
  const vistoEn = (id: LogroId) =>
    d.logros.find((v) => v.id === id)?.at ?? ahora;
  const logros = desbloqueados(d, hechosDe(d, now, amigos))
    .map((id, k) => ({ id, k, at: vistoEn(id) }))
    .sort((a, b) => b.at.localeCompare(a.at) || a.k - b.k)
    .map((x) => x.id);
  return {
    nombre: d.profile.name.trim(),
    roles: d.profile.roles.trim(),
    desde: dia1De(d, now),
    nivel: nivelDe(puntos).nivel,
    puntos,
    logros,
    areas: areasDe(d, now),
    codigo,
  };
}

export function mismaTarjeta(a: Tarjeta, b: Tarjeta | null): boolean {
  if (!b) return false;
  const clave = (t: Tarjeta) =>
    JSON.stringify({ ...t, areas: areasOrdenadas(t.areas) });
  return clave(a) === clave(b);
}

// Se publica solo con la nube ya leída: un teléfono recién abierto no sube
// «Nivel 1» encima de la tarjeta real (spec F §4.3).
export const listoParaPublicar = (e: {
  conCuenta: boolean;
  base: boolean;
  estadoNube: string;
  nombre: string;
}) =>
  e.conCuenta &&
  e.base &&
  e.estadoNube !== CONECTANDO &&
  e.estadoNube !== SINCRONIZANDO &&
  e.nombre.trim() !== "";
