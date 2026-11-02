import { estaAtrasada, timedItems } from "./espacio";
import { AppData, Item, localDay, passive } from "./model";
import { findConflicts } from "./planner";

// Neka según el contexto: qué pose y qué mensaje mostrar (spec A, sección 7).
export type NekaPose = 1 | 3 | 5 | 7 | 14 | 15;
export type NekaAction = {
  label: string;
  target: "chat" | "crear" | "item";
  itemId?: string;
};
export type NekaState = {
  kind:
    "conflicto" | "vencido" | "revisar" | "nuevo" | "listo" | "dia" | "libre";
  pose: NekaPose;
  message: string;
  action?: NekaAction;
};

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

export const hhmm = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export function timeUntil(fromMs: number, toMs: number): string {
  const minutes = Math.round((toMs - fromMs) / 60000);
  if (minutes <= 0) return "ahora";
  if (minutes < 60) return `en ${minutes} min`;
  const h = Math.floor(minutes / 60),
    m = minutes % 60;
  return m ? `en ${h} h ${m} min` : `en ${h} h`;
}

// La hora (scheduledAt o dueAt) que cae en el día local pedido, o "".
export function timeOn(item: Item, day: string): string {
  for (const iso of [item.scheduledAt, item.dueAt])
    if (iso && localDay(new Date(iso)) === day) return iso;
  return "";
}

export const todayTime = (item: Item, now = Date.now()) =>
  timeOn(item, localDay(new Date(now)));

export const todayItems = (data: AppData, now = Date.now()): Item[] =>
  timedItems(data)
    .filter((i) => !passive(i) && todayTime(i, now))
    .sort(
      (a, b) => Date.parse(todayTime(a, now)) - Date.parse(todayTime(b, now)),
    );

// Si hay más ítems que el límite, prioriza los que aún no pasan y completa con
// los anteriores más recientes; siempre en orden de hora.
export function visibleToday(
  today: Item[],
  now: number,
  limit: number,
): Item[] {
  if (today.length <= limit) return today;
  const upcoming = today.filter((i) => Date.parse(todayTime(i, now)) >= now),
    past = today.filter((i) => Date.parse(todayTime(i, now)) < now),
    shown = upcoming.slice(0, limit);
  return [...past.slice(past.length - (limit - shown.length)), ...shown];
}

export const nextItem = (data: AppData, now = Date.now()) =>
  todayItems(data, now).find(
    (i) => i.status !== "completado" && Date.parse(todayTime(i, now)) >= now,
  );

export const pointsToday = (data: AppData, now = Date.now()) => {
  const today = localDay(new Date(now));
  return data.rewards
    .filter(
      (r) => !r.key.endsWith(":budget") && localDay(new Date(r.at)) === today,
    )
    .reduce((sum, r) => sum + r.points, 0);
};

export function nekaState(data: AppData, now = Date.now()): NekaState {
  const items = timedItems(data),
    conflicts = findConflicts(data, now),
    byId = (id: string) => items.find((i) => i.id === id);

  const clash = conflicts.find(
    (c) =>
      c.kind === "overlap" &&
      c.itemIds.some((id) => {
        const i = byId(id);
        // Un choque es de horarios: solo cuenta si uno está agendado hoy.
        return (
          !!i?.scheduledAt &&
          localDay(new Date(i.scheduledAt)) === localDay(new Date(now))
        );
      }),
  );
  if (clash) {
    const [first, second] = clash.itemIds
      .map(byId)
      .filter((i): i is Item => !!i)
      .sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt));
    return {
      kind: "conflicto",
      pose: 14,
      message: `A las ${hhmm(first.scheduledAt)} se te juntan «${first.title}» y «${second.title}».`,
      action: { label: "Resolver", target: "chat" },
    };
  }

  const overdue = items.filter(
    (i) =>
      !passive(i) &&
      i.status !== "completado" &&
      i.dueAt &&
      Date.parse(i.dueAt) < now &&
      !estaAtrasada(i, now),
  );
  if (overdue.length === 1)
    return {
      kind: "vencido",
      pose: 14,
      message: `Se te pasó «${overdue[0].title}».`,
      action: { label: "Ver", target: "item", itemId: overdue[0].id },
    };
  if (overdue.length > 1)
    return {
      kind: "vencido",
      pose: 14,
      message: `Tienes ${overdue.length} entregas vencidas.`,
      action: { label: "Ver", target: "chat" },
    };

  if (conflicts.length)
    return {
      kind: "revisar",
      pose: 7,
      message: `Encontré ${plural(conflicts.length, "cosa", "cosas")} por ordenar.`,
      action: { label: "Revisar", target: "chat" },
    };

  if (!items.length)
    return {
      kind: "nuevo",
      pose: 3,
      message: "Hola, soy Neka. Crea tu primera tarea y te ayudo a ordenarla.",
      action: { label: "Crear tarea", target: "crear" },
    };

  const today = todayItems(data, now),
    pending = today.filter((i) => i.status !== "completado");
  if (today.length && !pending.length) {
    const points = pointsToday(data, now);
    return {
      kind: "listo",
      pose: 1,
      message: points
        ? `Listo por hoy. Sumaste ${plural(points, "punto", "puntos")}.`
        : "Listo por hoy.",
    };
  }
  if (pending.length) {
    const next = nextItem(data, now);
    return {
      kind: "dia",
      pose: 15,
      message:
        `Hoy tienes ${plural(pending.length, "cosa", "cosas")}.` +
        (next ? ` La siguiente es a las ${hhmm(todayTime(next, now))}.` : ""),
    };
  }
  return {
    kind: "libre",
    pose: 3,
    message: "Hoy no tienes nada agendado.",
    action: { label: "Crear", target: "crear" },
  };
}
