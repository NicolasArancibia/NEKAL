import { timedItems } from "./espacio";
import { AppData, Item, activeItems, localDay, passive } from "./model";
export type Conflict = {
  id: string;
  itemIds: string[];
  kind: "overlap" | "deadline" | "dependency" | "capacity";
  description: string;
};
const end = (i: Item) => Date.parse(i.scheduledAt) + i.duration * 60000;
export function findConflicts(data: AppData, now = Date.now()): Conflict[] {
  const items = timedItems(data).filter(
    (i) => !passive(i) && i.status !== "completado",
  );
  const result: Conflict[] = [];
  for (let a = 0; a < items.length; a++) {
    const i = items[a];
    if (
      i.dueAt &&
      (Date.parse(i.dueAt) < now ||
        (i.scheduledAt && end(i) > Date.parse(i.dueAt)))
    )
      result.push({
        id: `due:${i.id}`,
        itemIds: [i.id],
        kind: "deadline",
        description: `«${i.title}» ${Date.parse(i.dueAt) < now ? "tiene el plazo vencido" : "termina después de su fecha límite"}.`,
      });
    for (const id of i.dependencies) {
      const dep = items.find((d) => d.id === id);
      if (
        dep &&
        i.scheduledAt &&
        (!dep.scheduledAt || end(dep) > Date.parse(i.scheduledAt))
      )
        result.push({
          id: `dep:${i.id}:${id}`,
          itemIds: [i.id, id],
          kind: "dependency",
          description: `«${i.title}» está planificado antes de terminar «${dep.title}».`,
        });
    }
    if (!i.scheduledAt) continue;
    for (let b = a + 1; b < items.length; b++) {
      const j = items[b];
      if (
        j.scheduledAt &&
        Date.parse(i.scheduledAt) < end(j) &&
        Date.parse(j.scheduledAt) < end(i)
      )
        result.push({
          id: `overlap:${i.id}:${j.id}`,
          itemIds: [i.id, j.id],
          kind: "overlap",
          description: `«${i.title}» se superpone con «${j.title}».`,
        });
    }
  }
  // Reserve unscheduled work by nearest deadline to detect aggregate overload.
  let projected = data;
  for (const i of items
    .filter(
      (i) =>
        !i.scheduledAt && i.dueAt && i.flexible && Date.parse(i.dueAt) >= now,
    )
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))) {
    const proposal = proposeSlot(projected, i.id, now);
    if (proposal)
      projected = {
        ...projected,
        items: projected.items.map((x) =>
          x.id === i.id ? { ...x, scheduledAt: proposal.next } : x,
        ),
      };
    else
      result.push({
        id: `capacity:${i.id}`,
        itemIds: [i.id],
        kind: "capacity",
        description: `«${i.title}» no tiene un hueco disponible antes de su plazo en el horizonte de 30 días, o espera una dependencia sin horario.`,
      });
  }
  return result;
}
export type Proposal = {
  itemId: string;
  previous: string;
  next: string;
  reason: string;
  updatedAt: string;
};
export function proposeSlot(
  data: AppData,
  id: string,
  now = Date.now(),
): Proposal | null {
  const item = activeItems(data).find((i) => i.id === id);
  if (!item || passive(item) || !item.flexible || item.status === "completado")
    return null;
  const others = timedItems(data).filter(
    (i) => i.id !== id && !passive(i) && i.status !== "completado",
  );
  let earliest = Math.max(now, Date.parse(`${item.startDate}T00:00:00`));
  for (const id of item.dependencies) {
    const dep = others.find((i) => i.id === id);
    if (dep && !dep.scheduledAt) return null;
    if (dep) earliest = Math.max(earliest, end(dep));
  }
  // 15 minute grid, at most 30 days. Preserve fixed appointments and deadlines.
  let candidate = Math.ceil(earliest / 900000) * 900000;
  const latest = Math.min(
    now + 30 * 86400000,
    item.dueAt ? Date.parse(item.dueAt) : Infinity,
    ...others
      .filter((i) => i.dependencies.includes(item.id) && i.scheduledAt)
      .map((i) => Date.parse(i.scheduledAt)),
  );
  const next = primerHueco(data, others, candidate, latest, item.duration);
  return next
    ? {
        itemId: id,
        previous: item.scheduledAt,
        next,
        updatedAt: item.updatedAt,
        reason:
          "Primer hueco disponible dentro de tu jornada, respetando duración, dependencias y plazo.",
      }
    : null;
}
// Primer inicio libre en la grilla de 15 minutos desde `candidate` (ya alineado):
// dentro de la jornada, sin cruzar de día y sin chocar con lo agendado.
function primerHueco(
  data: AppData,
  others: Item[],
  candidate: number,
  latest: number,
  duration: number,
): string | null {
  for (; candidate + duration * 60000 <= latest; candidate += 900000) {
    const start = new Date(candidate),
      finish = new Date(candidate + duration * 60000);
    const startHour = start.getHours() + start.getMinutes() / 60,
      finishHour = finish.getHours() + finish.getMinutes() / 60;
    if (
      startHour < data.preferences.dayStart ||
      finishHour > data.preferences.dayEnd ||
      start.toDateString() !== finish.toDateString()
    )
      continue;
    if (
      others.some(
        (i) =>
          i.scheduledAt &&
          candidate < end(i) &&
          Date.parse(i.scheduledAt) < finish.getTime(),
      )
    )
      continue;
    return start.toISOString();
  }
  return null;
}
// Hueco para algo de `duracion` minutos (spec D §4.1), desde `desde` (o ahora)
// hasta `hasta` o 30 días. `ignorar`: la cosa que se está moviendo.
export function buscarHueco(
  data: AppData,
  o: { duracion: number; desde?: number; hasta?: number; ignorar?: string },
  now = Date.now(),
): string | null {
  const others = timedItems(data).filter(
    (i) => i.id !== o.ignorar && !passive(i) && i.status !== "completado",
  );
  const desde = Math.max(o.desde ?? now, now);
  return primerHueco(
    data,
    others,
    Math.ceil(desde / 900000) * 900000,
    Math.min(o.hasta ?? Infinity, now + 30 * 86400000),
    o.duracion,
  );
}
export type Corrimiento = {
  itemId: string;
  antes: string;
  despues: string;
  noCabe: boolean;
  salta: string | null; // id de la cosa fija que lo empujó
  pasaPlazo: boolean; // correrlo lo dejaría después de su plazo
};
// "Voy atrasado" (spec D §4.3): la primera flexible que aún no termina se corre
// `minutos`; las siguientes empiezan cuando termina la anterior, saltando lo
// fijo (que no se mueve). Lo que pasaría de la jornada o a otro día queda
// marcado `noCabe` y en su hora. Solo vuelve lo que cambia.
export function correrDesde(
  data: AppData,
  minutos: number,
  desde: number,
): Corrimiento[] {
  if (!(minutos > 0)) throw new Error("Indica cuántos minutos.");
  const dia = localDay(new Date(desde));
  const lista = timedItems(data)
    .filter(
      (i) =>
        !passive(i) &&
        i.status !== "completado" &&
        !!i.scheduledAt &&
        localDay(new Date(i.scheduledAt)) === dia &&
        end(i) > desde,
    )
    .sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt));
  const fijas = lista.filter((i) => !i.flexible);
  const finJornada = new Date(desde);
  finJornada.setHours(data.preferences.dayEnd, 0, 0, 0);
  const out: Corrimiento[] = [];
  let cursor = -Infinity;
  for (const i of lista) {
    if (!i.flexible) continue;
    const inicio = Date.parse(i.scheduledAt),
      dur = i.duration * 60000;
    const choca = (s: number) =>
      fijas.find((x) => s < end(x) && Date.parse(x.scheduledAt) < s + dur);
    let s =
      cursor === -Infinity
        ? inicio + minutos * 60000
        : Math.max(inicio, cursor);
    let salta: string | null = null;
    for (let f = choca(s); f; f = choca(s)) {
      s = end(f);
      salta = f.id;
    }
    cursor = s + dur;
    if (s === inicio) continue;
    const pasaPlazo = !!i.dueAt && s + dur > Date.parse(i.dueAt);
    const noCabe =
      pasaPlazo ||
      s + dur > finJornada.getTime() ||
      localDay(new Date(s + dur - 1)) !== dia;
    out.push({
      itemId: i.id,
      antes: i.scheduledAt,
      despues: noCabe ? i.scheduledAt : new Date(s).toISOString(),
      noCabe,
      salta,
      pasaPlazo,
    });
  }
  return out;
}
export function applyProposal(data: AppData, proposal: Proposal): AppData {
  const item = activeItems(data).find((i) => i.id === proposal.itemId);
  if (!item || item.updatedAt !== proposal.updatedAt)
    throw new Error("El ítem cambió. Pide una propuesta nueva.");
  const fresh = proposeSlot(data, item.id);
  if (!fresh || fresh.next !== proposal.next)
    throw new Error("La disponibilidad cambió. Pide una propuesta nueva.");
  return {
    ...data,
    items: data.items.map((i) =>
      i.id === item.id
        ? {
            ...i,
            scheduledAt: proposal.next,
            updatedAt: new Date().toISOString(),
          }
        : i,
    ),
  };
}
