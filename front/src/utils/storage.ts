import {
  AppData,
  AREA_IDS,
  ESTADOS_PLAN,
  LOGRO_IDS,
  Group,
  REPEATS,
  TYPES,
  validateGroup,
  validateItem,
  passive,
} from "./model";
import { normalizarConexiones, normalizarOrigen } from "./conexiones/estado";

// Grupos guardados antes de la V2/B (3 campos) reciben los campos nuevos vacíos.
export function normalizeGroup(g: any): Group {
  return {
    id: g.id,
    name: g.name,
    workspaceId: g.workspaceId,
    parentId: g.parentId ?? "",
    repeat: g.repeat ?? "",
    repeatDays: g.repeatDays ?? [],
    repeatStart: g.repeatStart ?? "",
  };
}

// x/y del mapa de la V1 pasan a ser el orden dentro de cada contenedor
// (mesa + grupo): de arriba hacia abajo y de izquierda a derecha. Un contenedor
// con alguna cosa en y ≠ 0 aún tiene coordenadas viejas; los que ya ordenó la
// V2 tienen y = 0 en todas (las funciones de estructura renumeran completo).
// Es idempotente, así que sirve igual para datos locales, respaldos y la nube.
export function ordenarLegado<T extends { id: string; workspaceId: string; groupId: string; x: number; y: number }>(
  items: T[],
): T[] {
  const porContenedor = new Map<string, T[]>();
  for (const i of items) {
    const k = `${i.workspaceId}|${i.groupId}`;
    porContenedor.set(k, [...(porContenedor.get(k) ?? []), i]);
  }
  const orden = new Map<string, number>();
  for (const lista of porContenedor.values())
    if (lista.some((i) => i.y !== 0))
      [...lista]
        .sort((a, b) => a.y - b.y || a.x - b.x)
        .forEach((i, n) => orden.set(i.id, n));
  return orden.size
    ? items.map((i) => (orden.has(i.id) ? { ...i, x: orden.get(i.id)!, y: 0 } : i))
    : items;
}

export function migrateV1(d: any): any {
  return {
    ...d,
    version: 2,
    items: ordenarLegado(d.items),
    groups: d.groups.map(normalizeGroup),
  };
}

export function readBackup(text: string): AppData {
  const raw = JSON.parse(text);
  if (text.length > 10000000) throw new Error("El respaldo supera 10 MB.");
  if (
    !raw ||
    (raw.version !== 1 && raw.version !== 2) ||
    !Array.isArray(raw.items) ||
    !Array.isArray(raw.groups)
  )
    throw new Error("El archivo no es un respaldo Nekal válido.");
  const d = migrateV1(raw);
  if (
    !d ||
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
    throw new Error("El archivo no es un respaldo Nekal válido.");
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
      typeof w.color !== "string" ||
      (w.area !== undefined && !AREA_IDS.includes(w.area))
    )
      throw new Error("Espacio inválido.");
  for (const g of d.groups) {
    if (
      typeof g.id !== "string" ||
      typeof g.name !== "string" ||
      !d.workspaces.some((w: any) => w.id === g.workspaceId) ||
      typeof g.parentId !== "string" ||
      !REPEATS.includes(g.repeat) ||
      !Array.isArray(g.repeatDays) ||
      g.repeatDays.some((n: unknown) => !Number.isInteger(n) || (n as number) < 0 || (n as number) > 6) ||
      new Set(g.repeatDays).size !== g.repeatDays.length ||
      typeof g.repeatStart !== "string" ||
      (g.repeatStart && !/^\d{4}-\d{2}-\d{2}$/.test(g.repeatStart))
    )
      throw new Error("Grupo inválido.");
    const error = validateGroup(g, d);
    if (error) throw new Error(`Grupo inválido: ${error}`);
  }
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
  for (const m of d.messages) {
    const claves = Object.keys(m).length;
    if (
      typeof m.id !== "string" ||
      typeof m.text !== "string" ||
      typeof m.isUser !== "boolean" ||
      (claves !== 3 &&
        (claves !== 6 ||
          typeof m.audio !== "boolean" ||
          typeof m.plan !== "string" ||
          m.plan.length > 500 ||
          !ESTADOS_PLAN.includes(m.estado)))
    )
      throw new Error("Conversación inválida.");
  }
  // Logros vistos (spec E §8): respaldos viejos no los traen.
  if (d.logros === undefined) d.logros = [];
  if (
    !Array.isArray(d.logros) ||
    d.logros.length > LOGRO_IDS.length ||
    new Set(d.logros.map((v: any) => v?.id)).size !== d.logros.length ||
    d.logros.some(
      (v: any) =>
        !v ||
        Object.keys(v).length !== 2 ||
        !LOGRO_IDS.includes(v.id) ||
        typeof v.at !== "string" ||
        v.at.length > 40,
    )
  )
    throw new Error("Logros inválidos.");
  // Cuentas conectadas (spec H3 §5.2): respaldos viejos no las traen.
  d.conexiones = normalizarConexiones(d.conexiones);
  // Espejo (V2/H4): un origen mal formado se quita; el ítem queda como propio.
  d.items = d.items.map((i: any) => {
    if (i.origen === undefined) return i;
    const { origen, ...resto } = i;
    const o = normalizarOrigen(origen);
    return o ? { ...resto, origen: o } : resto;
  });
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
