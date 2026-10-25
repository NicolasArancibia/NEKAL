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
// Mesa ⊃ grupos (anidables) ⊃ cosas. Un grupo con `repeat` es una rutina (spec B §2).
export type Repeat = "" | "diario" | "semanal" | "dias";
export const REPEATS: Repeat[] = ["", "diario", "semanal", "dias"];
export type Group = {
  id: string;
  name: string;
  workspaceId: string;
  parentId: string;
  repeat: Repeat;
  repeatDays: number[];
  repeatStart: string;
};
export type Reward = {
  key: string;
  itemId: string;
  points: number;
  at: string;
  reason: string;
};
export const newGroup = (
  name: string,
  workspaceId: string,
  extra: Partial<Group> = {},
): Group => ({
  id: uid(),
  name,
  workspaceId,
  parentId: "",
  repeat: "",
  repeatDays: [],
  repeatStart: "",
  ...extra,
});
// Un mensaje tiene sus 3 claves o, si es audio o plan de Neka (spec D §8), las 6.
export type EstadoPlan = "" | "pendiente" | "aceptado" | "descartado";
export const ESTADOS_PLAN: EstadoPlan[] = ["", "pendiente", "aceptado", "descartado"];
export type Message = {
  id: string;
  text: string;
  isUser: boolean;
  audio?: boolean;
  plan?: string;
  estado?: EstadoPlan;
};
export type AppData = {
  version: 2;
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
  version: 2,
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
    return "La mesa ya no existe.";
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
    return "El grupo debe estar en la misma mesa.";
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
export function validateGroup(group: Group, data: AppData): string | null {
  if (!group.name.trim()) return "El grupo necesita un nombre.";
  if (!data.workspaces.some((w) => w.id === group.workspaceId))
    return "La mesa ya no existe.";
  const byId = new Map(
    data.groups.filter((g) => g.id !== group.id).concat(group).map((g) => [g.id, g]),
  );
  if (group.parentId) {
    const parent = byId.get(group.parentId);
    if (!parent || parent.workspaceId !== group.workspaceId)
      return "El grupo de arriba debe estar en la misma mesa.";
    const seen = new Set<string>([group.id]);
    for (let p: Group | undefined = parent; p; p = byId.get(p.parentId)) {
      if (seen.has(p.id)) return "Un grupo no puede quedar dentro de sí mismo.";
      seen.add(p.id);
      if (!p.parentId) break;
    }
  }
  if (group.repeat && !group.repeatStart)
    return "Indica desde qué día se repite.";
  if (group.repeat === "dias" && !group.repeatDays.length)
    return "Elige al menos un día.";
  return null;
}
// Spec E §3: la dificultad sale de pasos y lugar; la fecha ya no cuenta.
export function difficultyOf(item: Item): 1 | 2 | 3 {
  if (["Evento", "Visita", "Meeting"].includes(item.type))
    return item.difficulty;
  const load = item.steps.length + (item.location ? 1 : 0);
  return load >= 5 ? 3 : load >= 2 ? 2 : 1;
}
// Terminar antes de la fecha límite paga un 20% más (spec E §3).
export const BONUS_A_TIEMPO = 1.2;
export const RAZON_COMPLETADO = "Ítem completado";
export function pointsFor(item: Item, all: Item[], now = Date.now()) {
  if (
    passive(item) ||
    (["Evento", "Visita", "Meeting"].includes(item.type) &&
      !item.countsForScore)
  )
    return 0;
  const aTiempo = item.dueAt && now <= Date.parse(item.dueAt);
  return (
    Math.round(
      10 *
        difficultyOf(item) *
        { baja: 1, media: 1.5, urgente: 2 }[item.priority] *
        (aTiempo ? BONUS_A_TIEMPO : 1),
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
        item.status === "completado" ? RAZON_COMPLETADO : "Hitos alcanzados",
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
// Copia las cosas de un grupo a `nuevo`, corridas `dias` días (o lo que diga
// la función para cada cosa) con la hora
// local intacta, pendientes y con sus dependencias internas reconectadas.
// `x` (el orden) se conserva.
export function copiarGrupo(
  d: AppData,
  origenId: string,
  dias: number | ((i: Item) => number),
  nuevo: Group,
  idItem: (viejo: string) => string,
  idPaso: (item: string, viejo: string) => string,
  ahora = new Date().toISOString(),
): AppData {
  const source = activeItems(d).filter((i) => i.groupId === origenId);
  const map = new Map(source.map((i) => [i.id, idItem(i.id)]));
  const copies = source.map((i) => {
    const corrida = typeof dias === "number" ? dias : dias(i);
    const shift = (s: string) => {
      if (!s) return "";
      const date = new Date(s);
      date.setDate(date.getDate() + corrida);
      return date.toISOString();
    };
    const id = map.get(i.id)!;
    return {
      ...i,
      id,
      groupId: nuevo.id,
      startDate: localDay(new Date(shift(parseDateInput(i.startDate)))),
      scheduledAt: shift(i.scheduledAt),
      dueAt: shift(i.dueAt),
      status: "pendiente" as Status,
      steps: i.steps.map((s) => ({ ...s, id: idPaso(id, s.id), done: false })),
      dependencies: i.dependencies.map((x) => map.get(x) ?? x),
      createdAt: ahora,
      updatedAt: ahora,
      y: 0,
    };
  });
  return {
    ...d,
    groups: [...d.groups, nuevo],
    items: [...d.items, ...copies],
  };
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
  const origin = source.map((i) => i.startDate).sort()[0];
  parseDateInput(day);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day))
    throw new Error("Indica una fecha AAAA-MM-DD.");
  const offset =
    (Date.parse(day + "T12:00:00Z") - Date.parse(origin + "T12:00:00Z")) /
    86400000;
  return copiarGrupo(
    data,
    groupId,
    offset,
    {
      ...group,
      id: uid(),
      name: `${group.name} · ${day}`,
      parentId: group.parentId ?? "",
      repeat: "",
      repeatDays: [],
      repeatStart: "",
    },
    () => uid(),
    () => uid(),
  );
}
