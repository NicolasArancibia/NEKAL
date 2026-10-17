import { esRutina } from "./espacio";
import { activeItems, AppData, copiarGrupo, Group, localDay } from "./model";

// Rutinas que se repiten (spec B §2.1). Puro. Los ids y los nombres son
// deterministas para que dos dispositivos generen los mismos registros: por
// eso el mes va fijo y no con toLocaleString.
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

// Crea las ocurrencias que faltan de hoy a hoy+6. Misma referencia si no hay
// nada nuevo.
export function aplicarRutinas(d: AppData, now: number): AppData {
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
      const t = fecha(dia);
      data = copiarGrupo(
        data,
        g.id,
        (Date.parse(dia + "T12:00:00Z") -
          Date.parse(g.repeatStart + "T12:00:00Z")) /
          86400000,
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
