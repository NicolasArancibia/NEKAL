import { AppData, TYPES, validateItem, passive } from "./model";
export function readBackup(text: string): AppData {
  const d = JSON.parse(text);
  if (text.length > 10000000) throw new Error("El respaldo supera 10 MB.");
  if (
    !d ||
    d.version !== 1 ||
    !Array.isArray(d.items) ||
    !Array.isArray(d.workspaces) ||
    !d.workspaces.length ||
    !Array.isArray(d.groups) ||
    !Array.isArray(d.rewards) ||
    !Array.isArray(d.messages) ||
    typeof d.profile?.name !== "string" ||
    typeof d.profile?.roles !== "string" ||
    !d.preferences
  )
    throw new Error("El archivo no es un respaldo Nekal V1 válido.");
  for (const list of [d.items, d.workspaces, d.groups, d.messages])
    if (new Set(list.map((x: any) => x.id)).size !== list.length)
      throw new Error("El respaldo contiene identificadores duplicados.");
  if (d.items.length > 5000) throw new Error("Máximo 5000 ítems por respaldo.");
  for (const i of d.items) {
    if (
      typeof i.id !== "string" ||
      !TYPES.includes(i.type) ||
      !Array.isArray(i.steps) ||
      !Array.isArray(i.dependencies) ||
      !Array.isArray(i.attachments) ||
      !Number.isFinite(i.duration) ||
      !Number.isFinite(i.x) ||
      !Number.isFinite(i.y)
    )
      throw new Error("Hay ítems inválidos en el respaldo.");
    if (
      typeof i.flexible !== "boolean" ||
      typeof i.countsForScore !== "boolean"
    )
      throw new Error("Opciones del ítem inválidas.");
    for (const k of [
      "title",
      "description",
      "workspaceId",
      "createdAt",
      "startDate",
      "updatedAt",
      "dueAt",
      "scheduledAt",
      "status",
      "priority",
      "location",
      "content",
      "category",
      "visitReason",
      "participants",
      "agenda",
      "groupId",
      "deletedAt",
    ])
      if (typeof i[k] !== "string") throw new Error(`Campo inválido: ${k}.`);
    if (
      !["pendiente", "en curso", "completado"].includes(i.status) ||
      !["baja", "media", "urgente"].includes(i.priority) ||
      ![1, 2, 3].includes(i.difficulty)
    )
      throw new Error("Estado, prioridad o dificultad inválidos.");
    if (!d.workspaces.some((w: any) => w.id === i.workspaceId))
      throw new Error("Hay ítems sin espacio.");
    if (
      i.steps.some(
        (x: any) =>
          typeof x.id !== "string" ||
          typeof x.title !== "string" ||
          typeof x.done !== "boolean",
      ) ||
      i.attachments.some(
        (a: any) =>
          typeof a.id !== "string" ||
          typeof a.mime !== "string" ||
          typeof a.name !== "string" ||
          typeof a.data !== "string" ||
          !a.data.startsWith("data:"),
      )
    )
      throw new Error("Subtareas o adjuntos inválidos.");
    if (
      new Set(i.steps.map((x: any) => x.id)).size !== i.steps.length ||
      new Set(i.dependencies).size !== i.dependencies.length
    )
      throw new Error("Subtareas o dependencias duplicadas.");
    if (i.dependencies.some((id: unknown) => typeof id !== "string"))
      throw new Error("Dependencia inválida.");
    for (const date of [
      i.createdAt,
      i.updatedAt,
      i.scheduledAt,
      i.dueAt,
      i.deletedAt,
    ].filter(Boolean))
      if (!Number.isFinite(Date.parse(date)))
        throw new Error("Fecha inválida en el respaldo.");
    if (!i.deletedAt) {
      const error = validateItem(i, d);
      if (error) throw new Error(`Ítem inválido: ${error}`);
    }
    if (
      passive(i) &&
      (i.dependencies.length ||
        i.steps.length ||
        i.scheduledAt ||
        i.dueAt ||
        i.status !== "pendiente")
    )
      throw new Error(
        "Una nota o idea no puede tener planificación ni estado.",
      );
  }
  for (const w of d.workspaces)
    if (
      typeof w.id !== "string" ||
      typeof w.name !== "string" ||
      typeof w.color !== "string"
    )
      throw new Error("Espacio inválido.");
  for (const g of d.groups)
    if (
      typeof g.id !== "string" ||
      typeof g.name !== "string" ||
      !d.workspaces.some((w: any) => w.id === g.workspaceId)
    )
      throw new Error("Rutina inválida.");
  for (const r of d.rewards)
    if (
      typeof r.key !== "string" ||
      typeof r.itemId !== "string" ||
      !Number.isFinite(r.points) ||
      r.points < 0 ||
      typeof r.at !== "string"
    )
      throw new Error("Historial inválido.");
  if (new Set(d.rewards.map((r: any) => r.key)).size !== d.rewards.length)
    throw new Error("Historial duplicado.");
  for (const m of d.messages)
    if (
      typeof m.id !== "string" ||
      typeof m.text !== "string" ||
      typeof m.isUser !== "boolean"
    )
      throw new Error("Conversación inválida.");
  for (const k of ["dayStart", "dayEnd", "quietStart", "quietEnd"])
    if (
      !Number.isInteger(d.preferences[k]) ||
      d.preferences[k] < 0 ||
      d.preferences[k] > 23
    )
      throw new Error("Horario inválido.");
  if (d.preferences.dayStart >= d.preferences.dayEnd)
    throw new Error("Jornada inválida.");
  for (const k of ["notifications", "quiet", "softAlerts"])
    if (typeof d.preferences[k] !== "boolean")
      throw new Error("Preferencias inválidas.");
  return d;
}
