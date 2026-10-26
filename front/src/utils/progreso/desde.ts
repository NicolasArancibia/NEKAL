import { AppData, localDay, passive } from "../model";
import { nivelDe, puntosParaNivel } from "./nivel";

// «Desde el día 1» (spec E §7.2): cuándo empezaste, tu curva de puntos y cada
// subida de nivel. Todo sale de las cosas y del historial de puntos.
export type Desde = {
  dia1: string;
  dias: number;
  listas: number;
  nivelesSubidos: number;
  curva: { dia: string; puntos: number }[];
  subidas: { dia: string; nivel: number }[];
};

export const cosasListas = (d: AppData) =>
  d.items.filter(
    (i) => !passive(i) && !i.deletedAt && i.status === "completado",
  ).length;

const MESES_LARGOS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];
export const mesLargo = (dia: string) =>
  MESES_LARGOS[Number(dia.slice(5, 7)) - 1];
// «3 de agosto» y «agosto de 2026».
export const fechaLarga = (dia: string) =>
  `${Number(dia.slice(8, 10))} de ${mesLargo(dia)}`;
export const mesYAnio = (dia: string) =>
  `${mesLargo(dia)} de ${dia.slice(0, 4)}`;

// Días de calendario, no milisegundos: el cambio de horario no corre la cuenta.
export const sumarDias = (dia: string, n: number) => {
  const [y, m, d] = dia.split("-").map(Number);
  return localDay(new Date(y, m - 1, d + n));
};
export const diasEntre = (a: string, b: string) => {
  const [y1, m1, d1] = a.split("-").map(Number),
    [y2, m2, d2] = b.split("-").map(Number);
  return Math.round(
    (Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000,
  );
};

// El día más antiguo entre la creación de tus cosas y tus puntos (o hoy).
export function dia1De(d: AppData, now: number): string {
  const hoy = localDay(new Date(now));
  const fechas = [
    ...d.items.map((i) => localDay(new Date(i.createdAt))),
    ...d.rewards.map((r) => localDay(new Date(r.at))),
  ].sort();
  return fechas[0] && fechas[0] < hoy ? fechas[0] : hoy;
}

export function desdeElDia1(d: AppData, now: number): Desde {
  const hoy = localDay(new Date(now));
  const premios = d.rewards
    .filter((r) => !r.key.endsWith(":budget"))
    .map((r) => ({ dia: localDay(new Date(r.at)), puntos: r.points }))
    .sort((a, b) => a.dia.localeCompare(b.dia));
  const dia1 = dia1De(d, now);
  const hasta = (dia: string) =>
    premios.filter((p) => p.dia <= dia).reduce((n, p) => n + p.puntos, 0);
  const curva: Desde["curva"] = [];
  for (let k = 0; sumarDias(dia1, 7 * k) <= hoy; k++) {
    const dia = sumarDias(dia1, 7 * k);
    curva.push({ dia, puntos: hasta(dia) });
  }
  if (curva[curva.length - 1].dia !== hoy)
    curva.push({ dia: hoy, puntos: hasta(hoy) });
  const subidas: Desde["subidas"] = [];
  let total = 0;
  for (const p of premios) {
    total += p.puntos;
    while (total >= puntosParaNivel(subidas.length + 2))
      subidas.push({ dia: p.dia, nivel: subidas.length + 2 });
  }
  return {
    dia1,
    dias: diasEntre(dia1, hoy) + 1,
    listas: cosasListas(d),
    nivelesSubidos: nivelDe(total).nivel - 1,
    curva,
    subidas,
  };
}
