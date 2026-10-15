export const TYPES = [
  "Nota",
  "Idea",
  "Evento",
  "Visita",
  "Meeting",
  "Deadline",
  "Goal",
  "Tarea",
] as const;
export type ItemType = (typeof TYPES)[number];
export type Status = "pendiente" | "en curso" | "completado";
export type Priority = "baja" | "media" | "urgente";
export type Step = { id: string; title: string; done: boolean };
export type Attachment = {
  id: string;
  name: string;
  mime: string;
  data: string;
};
export type Item = {
  id: string;
  type: ItemType;
  title: string;
  description: string;
  workspaceId: string;
  createdAt: string;
  startDate: string;
  updatedAt: string;
  dueAt: string;
  scheduledAt: string;
  duration: number;
  flexible: boolean;
  status: Status;
  priority: Priority;
  location: string;
  content: string;
  category: string;
  visitReason: string;
  participants: string;
  agenda: string;
  countsForScore: boolean;
  difficulty: 1 | 2 | 3;
  steps: Step[];
  dependencies: string[];
  attachments: Attachment[];
  groupId: string;
  x: number;
  y: number;
  deletedAt: string;
};
export type Workspace = { id: string; name: string; color: string };
export type Group = { id: string; name: string; workspaceId: string };
export type Reward = {
  key: string;
  itemId: string;
  points: number;
  at: string;
  reason: string;
};
export type Message = { id: string; text: string; isUser: boolean };
export type AppData = {
  version: 1;
  items: Item[];
  workspaces: Workspace[];
  groups: Group[];
  rewards: Reward[];
  messages: Message[];
  profile: { name: string; roles: string };
  preferences: {
    softAlerts: boolean;
    quiet: boolean;
    quietStart: number;
    quietEnd: number;
    dayStart: number;
    dayEnd: number;
    notifications: boolean;
  };
};
export const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
export const passive = (i: Pick<Item, "type">) =>
  i.type === "Nota" || i.type === "Idea";
export const activeItems = (d: AppData) => d.items.filter((i) => !i.deletedAt);
export const localDay = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export const emptyData = (): AppData => ({
  version: 1,
  items: [],
  groups: [],
  rewards: [],
  messages: [],
  workspaces: [{ id: "general", name: "General", color: "#7847EB" }],
  profile: { name: "", roles: "" },
  preferences: {
    softAlerts: true,
    quiet: true,
    quietStart: 21,
    quietEnd: 8,
    dayStart: 8,
    dayEnd: 21,
    notifications: false,
  },
});
export function newItem(
  workspaceId = "general",
  type: ItemType = "Tarea",
): Item {
  const now = new Date().toISOString();
  return {
    id: uid(),
    type,
    title: "",
    description: "",
    workspaceId,
    createdAt: now,
    updatedAt: now,
    startDate: localDay(),
    dueAt: "",
    scheduledAt: "",
    duration: 30,
    flexible: !["Evento", "Visita", "Meeting"].includes(type),
    status: "pendiente",
    priority: "media",
    location: "",
    content: "",
    category: "",
    visitReason: "",
    participants: "",
    agenda: "",
    countsForScore: false,
    difficulty: 1,
    steps: [],
    dependencies: [],
    attachments: [],
    groupId: "",
    x: 0,
    y: 0,
    deletedAt: "",
  };
}
export function parseDateInput(value: string): string {
  if (!value.trim()) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?$/.exec(
    value.trim(),
  );
  if (!m) throw new Error("Usa AAAA-MM-DD HH:mm para las fechas.");
  const [, ys, ms, ds, hs = "09", mins = "00"] = m;
  const date = new Date(+ys, +ms - 1, +ds, +hs, +mins);
  if (
    date.getFullYear() !== +ys ||
    date.getMonth() !== +ms - 1 ||
    date.getDate() !== +ds ||
    date.getHours() !== +hs ||
    date.getMinutes() !== +mins
  )
    throw new Error("La fecha u hora no es válida.");
  return date.toISOString();
}
export function dateInput(value: string) {
  if (!value) return "";
  const d = new Date(value);
  return `${localDay(d)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
export const displayDate = (value: string) =>
  value
    ? new Date(value).toLocaleString("es-CL", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Sin fecha";
export function validateItem(item: Item, data: AppData): string | null {
  if (!item.title.trim()) return "Escribe un título.";
  if (item.title.length > 160) return "El título admite hasta 160 caracteres.";
  if (!data.workspaces.some((w) => w.id === item.workspaceId))
    return "El espacio ya no existe.";
  try {
    parseDateInput(item.startDate);
  } catch {
    return "La fecha de inicio no es válida.";
  }
  if (!item.startDate) return "La fecha de inicio es obligatoria.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(item.startDate))
    return "La fecha de inicio debe usar AAAA-MM-DD.";
  if (
    !passive(item) &&
    (!Number.isFinite(item.duration) ||
      item.duration < 5 ||
      item.duration > 1440)
  )
    return "La duración debe estar entre 5 y 1440 minutos.";
  if (item.type === "Visita" && !item.location.trim())
    return "Una visita necesita ubicación.";
  if (["Evento", "Visita", "Meeting"].includes(item.type) && !item.scheduledAt)
    return "Indica la fecha y hora del compromiso.";
  if (item.type === "Deadline" && !item.dueAt)
    return "Un deadline necesita una fecha límite.";
  for (const date of [item.dueAt, item.scheduledAt].filter(Boolean))
    if (!Number.isFinite(Date.parse(date))) return "Hay una fecha inválida.";
  if (
    (item.dueAt && localDay(new Date(item.dueAt)) < item.startDate) ||
    (item.scheduledAt && localDay(new Date(item.scheduledAt)) < item.startDate)
  )
    return "Las fechas no pueden ser anteriores al inicio.";
  if (
    item.groupId &&
    !data.groups.some(
      (g) => g.id === item.groupId && g.workspaceId === item.workspaceId,
    )
  )
    return "La rutina debe pertenecer al mismo espacio.";
  const all = activeItems(data)
    .filter((i) => i.id !== item.id)
    .concat(item);
  const byId = new Map(all.map((i) => [i.id, i]));
  for (const dep of item.dependencies) {
    const target = byId.get(dep);
    if (!target || passive(target))
      return "Las dependencias deben ser ítems accionables existentes.";
    const seen = new Set<string>();
    function reaches(id: string): boolean {
      if (id === item.id) return true;
      if (seen.has(id)) return false;
      seen.add(id);
      return (byId.get(id)?.dependencies ?? []).some(reaches);
    }
    if (reaches(dep)) return "Esta dependencia crea un ciclo. Elige otro ítem.";
    if (item.status === "completado" && target.status !== "completado")
      return "Completa las dependencias antes de finalizar este ítem.";
  }
  const old = data.items.find((i) => i.id === item.id);
  if (
    old?.status === "completado" &&
    item.status !== "completado" &&
    all.some(
      (i) => i.status === "completado" && i.dependencies.includes(item.id),
    )
  )
    return "Reabre primero los ítems completados que dependen de este.";
  return null;
}
export function difficultyOf(item: Item, now = Date.now()): 1 | 2 | 3 {
  if (["Evento", "Visita", "Meeting"].includes(item.type))
    return item.difficulty;
  const days = item.dueAt
    ? (Date.parse(item.dueAt) - now) / 86400000
    : Infinity;
  const load =
    item.steps.length +
    (item.location ? 1 : 0) +
    (days <= 2 ? 3 : days <= 7 ? 1 : 0);
  return load >= 6 ? 3 : load >= 3 ? 2 : 1;
}
export function pointsFor(item: Item, all: Item[], now = Date.now()) {
  if (
    passive(item) ||
    (["Evento", "Visita", "Meeting"].includes(item.type) &&
      !item.countsForScore)
  )
    return 0;
  return (
    Math.round(
      10 *
        difficultyOf(item, now) *
        { baja: 1, media: 1.5, urgente: 2 }[item.priority],
    ) +
    Math.min(
      15,
      all.filter((i) => !i.deletedAt && i.dependencies.includes(item.id))
        .length * 5,
    )
  );
}
export function saveItem(
  data: AppData,
  draft: Item,
  now = Date.now(),
): AppData {
  let item = {
    ...draft,
    title: draft.title.trim(),
    updatedAt: new Date(now).toISOString(),
  };
  if (passive(item))
    item = {
      ...item,
      status: "pendiente",
      priority: "media",
      dueAt: "",
      scheduledAt: "",
      steps: [],
      dependencies: [],
      countsForScore: false,
    };
  if (["Evento", "Visita", "Meeting"].includes(item.type))
    item = { ...item, steps: [], dueAt: "" };
  if (item.status === "completado")
    item = { ...item, steps: item.steps.map((s) => ({ ...s, done: true })) };
  const error = validateItem(item, data);
  if (error) throw new Error(error);
  const items = data.items.some((i) => i.id === item.id)
    ? data.items.map((i) => (i.id === item.id ? item : i))
    : [...data.items, item];
  const rewards = [...data.rewards];
  const already = rewards.filter((r) => r.itemId === item.id);
  // One frozen budget per item. Reopening and edits cannot create additional rewards.
  const total =
    already.find((r) => r.key === `${item.id}:budget`)?.points ??
    pointsFor(item, items, now);
  const completedSteps = item.steps.filter((s) => s.done).length;
  const target =
    item.status === "completado"
      ? total
      : item.type === "Goal" && item.steps.length
        ? Math.floor((total * 0.8 * completedSteps) / item.steps.length)
        : 0;
  if (target > 0 && !already.some((r) => r.key === `${item.id}:budget`))
    rewards.push({
      key: `${item.id}:budget`,
      itemId: item.id,
      points: total,
      at: item.updatedAt,
      reason: "Presupuesto (no suma)",
    });
  const paid = already
    .filter((r) => !r.key.endsWith(":budget"))
    .reduce((sum, r) => sum + r.points, 0);
  if (target > paid)
    rewards.push({
      key: uid(),
      itemId: item.id,
      points: target - paid,
      at: item.updatedAt,
      reason:
        item.status === "completado" ? "Ítem completado" : "Hitos alcanzados",
    });
  return { ...data, items, rewards };
}
export const totalPoints = (d: AppData) =>
  d.rewards
    .filter((r) => !r.key.endsWith(":budget"))
    .reduce((sum, r) => sum + r.points, 0);
export function deleteItem(data: AppData, id: string): AppData {
  if (activeItems(data).some((i) => i.dependencies.includes(id)))
    throw new Error("Quita primero las dependencias hacia este ítem.");
  return {
    ...data,
    items: data.items.map((i) =>
      i.id === id ? { ...i, deletedAt: new Date().toISOString() } : i,
    ),
  };
}
export function restoreItem(data: AppData, id: string): AppData {
  const old = data.items.find((i) => i.id === id);
  if (!old) throw new Error("Ítem no encontrado.");
  const item = { ...old, deletedAt: "", updatedAt: new Date().toISOString() };
  const error = validateItem(item, data);
  if (error) throw new Error(`No se puede restaurar todavía: ${error}`);
  return { ...data, items: data.items.map((i) => (i.id === id ? item : i)) };
}
export function duplicateGroup(
  data: AppData,
  groupId: string,
  day: string,
): AppData {
  const group = data.groups.find((g) => g.id === groupId);
  if (!group) throw new Error("Rutina no encontrada.");
  const source = activeItems(data).filter((i) => i.groupId === groupId);
  if (!source.length) throw new Error("La rutina no tiene ítems.");
  const newGroup = { ...group, id: uid(), name: `${group.name} · ${day}` };
  const map = new Map(source.map((i) => [i.id, uid()]));
  const origin = source.map((i) => i.startDate).sort()[0];
  parseDateInput(day);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day))
    throw new Error("Indica una fecha AAAA-MM-DD.");
  const offset =
    (Date.parse(day + "T12:00:00Z") - Date.parse(origin + "T12:00:00Z")) /
    86400000;
  const shift = (s: string) => {
    if (!s) return "";
    const date = new Date(s);
    date.setDate(date.getDate() + offset);
    return date.toISOString();
  };
  const copies = source.map((i) => ({
    ...i,
    id: map.get(i.id)!,
    groupId: newGroup.id,
    startDate: localDay(new Date(shift(parseDateInput(i.startDate)))),
    scheduledAt: shift(i.scheduledAt),
    dueAt: shift(i.dueAt),
    status: "pendiente" as Status,
    steps: i.steps.map((s) => ({ ...s, id: uid(), done: false })),
    dependencies: i.dependencies.map((id) => map.get(id) ?? id),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    x: i.x ? Math.min(950, i.x + 30) : 0,
    y: i.y ? Math.min(950, i.y + 30) : 0,
  }));
  return {
    ...data,
    groups: [...data.groups, newGroup],
    items: [...data.items, ...copies],
  };
}
