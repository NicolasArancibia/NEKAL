import { AppData, Item, RAZON_COMPLETADO, localDay, passive } from "../model";
import { timedItems } from "../espacio";
import { timeOn } from "../neka";
import { dia1De, sumarDias } from "./desde";

// Tus días (spec E §4): cuánto cumpliste de lo que tenías cada día y la racha.
export type Tono = 0 | 1 | 2 | 3 | 4;
export type Dia = {
  dia: string;
  tenias: number;
  hechas: number;
  sinAgenda: number;
  tono: Tono;
  suma: boolean;
  descanso: boolean;
};
export type Rachas = { racha: number; record: number; hoySuma: boolean };

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

const fecha = (dia: string) => {
  const [y, m, d] = dia.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const lunesDe = (dia: string) =>
  sumarDias(dia, -((fecha(dia).getDay() + 6) % 7));

// La misma regla que «Hoy»: sin notas, ideas, borradas ni modelos de rutina.
export const cosasDelDia = (d: AppData, dia: string, mesaId?: string): Item[] =>
  timedItems(d).filter(
    (i) =>
      !passive(i) && !!timeOn(i, dia) && (!mesaId || i.workspaceId === mesaId),
  );

function armarDia(dia: string, cosas: Item[], sinAgenda: number): Dia {
  const tenias = cosas.length,
    hechas = cosas.filter((i) => i.status === "completado").length;
  if (!tenias)
    return sinAgenda
      ? { dia, tenias, hechas, sinAgenda, tono: 2, suma: true, descanso: false }
      : {
          dia,
          tenias,
          hechas,
          sinAgenda,
          tono: 0,
          suma: false,
          descanso: true,
        };
  const p = hechas / tenias;
  const tono: Tono = p === 0 ? 0 : p < 0.5 ? 1 : p < 0.75 ? 2 : p < 1 ? 3 : 4;
  return {
    dia,
    tenias,
    hechas,
    sinAgenda,
    tono,
    suma: p >= 0.5,
    descanso: false,
  };
}

export const diaDe = (d: AppData, dia: string, mesaId?: string): Dia =>
  historial(d, dia, dia, mesaId)[0];

// Por fecha de calendario: el cambio de horario no salta ni repite días.
// Agrupa una sola vez las cosas y los puntos por día.
export function historial(
  d: AppData,
  desde: string,
  hasta: string,
  mesaId?: string,
): Dia[] {
  const cosas = new Map<string, Item[]>();
  const enMesa = new Set<string>();
  for (const i of timedItems(d)) {
    if (passive(i) || (mesaId && i.workspaceId !== mesaId)) continue;
    const dias = new Set(
      [i.scheduledAt, i.dueAt]
        .filter(Boolean)
        .map((f) => localDay(new Date(f))),
    );
    for (const dia of dias)
      if (dia >= desde && dia <= hasta)
        cosas.set(dia, [...(cosas.get(dia) ?? []), i]);
  }
  if (mesaId)
    for (const i of d.items) if (i.workspaceId === mesaId) enMesa.add(i.id);
  const hechasSinAgenda = new Map<string, Set<string>>();
  for (const r of d.rewards) {
    if (r.reason !== RAZON_COMPLETADO || (mesaId && !enMesa.has(r.itemId)))
      continue;
    const dia = localDay(new Date(r.at));
    if (dia < desde || dia > hasta) continue;
    hechasSinAgenda.set(
      dia,
      (hechasSinAgenda.get(dia) ?? new Set()).add(r.itemId),
    );
  }
  const out: Dia[] = [];
  for (let dia = desde; dia <= hasta; dia = sumarDias(dia, 1))
    out.push(
      armarDia(dia, cosas.get(dia) ?? [], hechasSinAgenda.get(dia)?.size ?? 0),
    );
  return out;
}

// La historia (heatmap, racha y logros) parte en el día 1 o en la primera cosa
// con fecha ya pasada, lo que sea antes: cosas creadas hoy con fechas pasadas
// (datos de ejemplo, importaciones) también cuentan.
export function inicioHistoria(d: AppData, now: number): string {
  const hoy = localDay(new Date(now));
  let inicio = dia1De(d, now);
  for (const i of timedItems(d)) {
    if (passive(i)) continue;
    for (const f of [i.scheduledAt, i.dueAt]) {
      if (!f) continue;
      const dia = localDay(new Date(f));
      if (dia < inicio && dia <= hoy) inicio = dia;
    }
  }
  return inicio;
}

// El último elemento es hoy: suma apenas llega al 50% y, si no, no corta.
export function rachas(dias: Dia[]): Rachas {
  let record = 0,
    corrida = 0;
  dias.forEach((x, k) => {
    if (x.descanso) return;
    if (x.suma) record = Math.max(record, ++corrida);
    else if (k < dias.length - 1) corrida = 0;
  });
  let racha = 0;
  for (let k = dias.length - 1; k >= 0; k--) {
    const x = dias[k];
    if (x.descanso || (k === dias.length - 1 && !x.suma)) continue;
    if (!x.suma) break;
    racha++;
  }
  return { racha, record, hoySuma: !!dias[dias.length - 1]?.suma };
}

// 12 semanas de lunes a hoy, o desde la primera semana de la historia.
export function semanas12(d: AppData, now: number, mesaId?: string): Dia[] {
  const hoy = localDay(new Date(now));
  const inicio = sumarDias(lunesDe(hoy), -77),
    primera = lunesDe(inicioHistoria(d, now));
  return historial(d, primera > inicio ? primera : inicio, hoy, mesaId);
}

export function puntosSemana(d: AppData, now: number): number {
  const lunes = fecha(lunesDe(localDay(new Date(now)))).getTime();
  return d.rewards
    .filter((r) => !r.key.endsWith(":budget") && Date.parse(r.at) >= lunes)
    .reduce((n, r) => n + r.points, 0);
}

export function textoDia(x: Dia, hoy: string): string {
  const esHoy = x.dia === hoy;
  if (x.tenias) {
    const cuenta = `${x.hechas} de ${x.tenias} (${Math.round((100 * x.hechas) / x.tenias)}%)`;
    if (esHoy) return `Hoy · ${cuenta}`;
    const f = fecha(x.dia);
    return `${DIAS[f.getDay()]} ${f.getDate()} de ${MESES[f.getMonth()]} · ${cuenta}`;
  }
  if (x.descanso) return esHoy ? "Hoy · descanso" : "Descanso";
  return `${esHoy ? "Hoy · sin" : "Sin"} nada agendado · completaste ${x.sinAgenda}`;
}
