import { esRutina, fechaDe } from "./espacio";
import {
  activeItems,
  AppData,
  copiarGrupo,
  Group,
  Item,
  localDay,
} from "./model";

// Rutinas que se repiten (spec B §2.1). Puro. Los ids y los nombres son
// deterministas para que dos dispositivos generen los mismos registros: por
// eso el mes va fijo y no con toLocaleString.
export const MESES = [
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
  const [y, m, n] = dia.split("-").map(Number);
  return new Date(y, m - 1, n);
};

export function diasQueToca(g: Group, desde: string, hasta: string): string[] {
  if (!g.repeat || !g.repeatStart) return [];
  const semana = fecha(g.repeatStart).getDay();
  const out: string[] = [];
  for (
    const t = fecha(desde < g.repeatStart ? g.repeatStart : desde);
    localDay(t) <= hasta;
    t.setDate(t.getDate() + 1)
  ) {
    const dia = t.getDay();
    if (
      g.repeat === "diario" ||
      (g.repeat === "semanal" && dia === semana) ||
      (g.repeat === "dias" && g.repeatDays.includes(dia))
    )
      out.push(localDay(t));
  }
  return out;
}

export const idOcurrencia = (rutinaId: string, dia: string) =>
  `${rutinaId}~${dia}`;

const entreDias = (desde: string, hasta: string) =>
  (Date.parse(hasta + "T12:00:00Z") - Date.parse(desde + "T12:00:00Z")) /
  86400000;
// El día de una cosa del modelo: su fecha o, si no tiene, su inicio. Cada copia
// cae en el día de la ocurrencia aunque el modelo se haya hecho otro día.
const diaDelModelo = (i: Item) =>
  fechaDe(i) ? localDay(new Date(fechaDe(i))) : i.startDate;

// Crea las ocurrencias que faltan de hoy a hoy+6, hasta `tope` por vez (para
// sincronizar de a poco). Misma referencia si no hay nada nuevo.
export function aplicarRutinas(d: AppData, now: number, tope = Infinity): AppData {
  let creadas = 0;
  const hoy = new Date(now);
  const desde = localDay(hoy);
  const hasta = localDay(
    new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 6),
  );
  let data = d;
  for (const g of d.groups.filter(esRutina)) {
    if (!activeItems(d).some((i) => i.groupId === g.id)) continue;
    for (const dia of diasQueToca(g, desde, hasta)) {
      const id = idOcurrencia(g.id, dia);
      if (data.groups.some((x) => x.id === id)) continue;
      if (creadas++ >= tope) return data;
      const t = fecha(dia);
      data = copiarGrupo(
        data,
        g.id,
        (i) => entreDias(diaDelModelo(i), dia),
        {
          id,
          name: `${g.name} · ${t.getDate()} ${MESES[t.getMonth()]}`,
          workspaceId: g.workspaceId,
          parentId: g.id,
          repeat: "",
          repeatDays: [],
          repeatStart: "",
        },
        (viejo) => `${id}~${viejo}`,
        (item, viejo) => `${item}~${viejo}`,
        t.toISOString(),
      );
    }
  }
  return data;
}

// "Anteriores": días pasados con todo completado. El resto, actuales.
export function ocurrencias(
  d: AppData,
  rutinaId: string,
  now: number,
): { actuales: Group[]; anteriores: Group[] } {
  const hoy = localDay(new Date(now));
  const prefijo = `${rutinaId}~`;
  const vivas = activeItems(d);
  const todas = d.groups
    .filter((g) => g.parentId === rutinaId && g.id.startsWith(prefijo))
    .sort((p, q) => (p.id < q.id ? -1 : 1));
  const anteriores = todas.filter(
    (g) =>
      g.id.slice(prefijo.length) < hoy &&
      vivas
        .filter((i) => i.groupId === g.id)
        .every((i) => i.status === "completado"),
  );
  return { actuales: todas.filter((g) => !anteriores.includes(g)), anteriores };
}

// Los datos sin las ocurrencias "Anteriores" de cada rutina (ni sus cosas),
// para que Mesas y Plano no se llenen. Misma referencia si no hay nada que
// esconder.
export function sinAnteriores(d: AppData, now: number): AppData {
  const fuera = new Set(
    d.groups
      .filter(esRutina)
      .flatMap((g) => ocurrencias(d, g.id, now).anteriores.map((o) => o.id)),
  );
  if (!fuera.size) return d;
  return {
    ...d,
    groups: d.groups.filter((g) => !fuera.has(g.id)),
    items: d.items.filter((i) => !fuera.has(i.groupId)),
  };
}
