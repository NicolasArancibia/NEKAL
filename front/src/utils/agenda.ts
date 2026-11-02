import { AppData, Item, localDay, passive } from "./model";
import {
  ATRASO_DIAS,
  diasHasta,
  estaAtrasada,
  fechaDe,
  timedItems,
} from "./espacio";
import { findConflicts } from "./planner";

// La Agenda del Calendario (spec H2 §4): los próximos días seguidos, con hora,
// duración y «choca». Puro. Lo atrasado (de hace más de ATRASO_DIAS) no sale:
// tiene su propia lista. Lo pendiente de ayer y anteayer sí, para que nada
// quede sin lista. Las hechas solo se ven hoy.
export type FilaAgenda = {
  item: Item;
  inicio: string;
  fin: string;
  minutos: number;
  choca: boolean;
  hecha: boolean;
};
export type DiaAgenda = { dia: string; filas: FilaAgenda[] };

export function agenda(
  d: AppData,
  now: number,
  dias = 14,
  mesa = "",
): DiaAgenda[] {
  const choques = new Set(
    findConflicts(d, now)
      .filter((c) => c.kind === "overlap")
      .flatMap((c) => c.itemIds),
  );
  const porDia = new Map<string, FilaAgenda[]>();
  for (const i of timedItems(d)) {
    const inicio = fechaDe(i);
    if (!inicio || passive(i) || estaAtrasada(i, now)) continue;
    if (mesa && i.workspaceId !== mesa) continue;
    const n = diasHasta(inicio, now);
    const hecha = i.status === "completado";
    if (n < -ATRASO_DIAS || n >= dias || (hecha && n !== 0)) continue;
    const dia = localDay(new Date(inicio));
    const fila: FilaAgenda = {
      item: i,
      inicio,
      fin: new Date(Date.parse(inicio) + i.duration * 60000).toISOString(),
      minutos: i.duration,
      choca: !hecha && choques.has(i.id),
      hecha,
    };
    porDia.set(dia, [...(porDia.get(dia) ?? []), fila]);
  }
  return [...porDia.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([dia, filas]) => ({
      dia,
      filas: filas.sort((p, q) => p.inicio.localeCompare(q.inicio)),
    }));
}
