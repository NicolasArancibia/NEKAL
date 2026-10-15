import { AppData, emptyData, uid, Reward } from "./model";
import { readBackup } from "./storage";

export type Value = Record<string, any>;
export type Records = Record<string, Value>;
export type Edit = { path: string; before: Value | null; after: Value | null };
export type Operation = { id: string; at: string; edits: Edit[] };
export type Conflict = { operationId: string; paths: string[]; reason: string };
export type Envelope = {
  version: 2;
  data: AppData;
  base: AppData | null;
  pending: Operation[];
  conflict: Conflict | null;
};
export const COLLECTIONS = [
  "items",
  "attachments",
  "workspaces",
  "groups",
  "rewards",
  "messages",
  "settings",
] as const;
export const equal = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ak = Object.keys(a),
    bk = Object.keys(b);
  return (
    ak.length === bk.length &&
    ak.every(
      (k) =>
        Object.prototype.hasOwnProperty.call(b, k) &&
        equal((a as any)[k], (b as any)[k]),
    )
  );
};
const key = (id: string) => encodeURIComponent(id);
export function recordsOf(data: AppData): Records {
  const out: Records = {};
  for (const item of data.items) {
    out[`items/${key(item.id)}`] = {
      ...item,
      attachments: item.attachments.map((a) => a.id),
    };
    for (const attachment of item.attachments)
      out[`attachments/${key(item.id + "~" + attachment.id)}`] = {
        ...attachment,
        itemId: item.id,
      };
  }
  for (const collection of ["workspaces", "groups", "messages"] as const)
    for (const value of data[collection])
      out[`${collection}/${key(value.id)}`] = value;
  // A reward ledger per item provides a high-water mark across devices.
  for (const r of data.rewards) {
    const path = `rewards/${key(r.itemId)}`;
    if (!out[path]) out[path] = { itemId: r.itemId, entries: [] };
    out[path].entries.push(r);
  }
  out["settings/profile"] = data.profile;
  const { notifications, ...preferences } = data.preferences;
  out["settings/preferences"] = preferences;
  return out;
}
export function dataOf(records: Records, notifications = false): AppData {
  const data = emptyData();
  data.items = [];
  data.workspaces = [];
  for (const [path, value] of Object.entries(records).sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    const collection = path.split("/")[0];
    if (collection === "items")
      data.items.push({
        ...value,
        attachments: value.attachments.map((id: string) => {
          const attachment = records[`attachments/${key(value.id + "~" + id)}`];
          if (!attachment)
            throw new Error(
              "Falta un adjunto: espera a completar la sincronización.",
            );
          const { itemId, ...rest } = attachment;
          return rest;
        }),
      } as any);
    else if (collection === "workspaces") data.workspaces.push(value as any);
    else if (collection === "groups") data.groups.push(value as any);
    else if (collection === "messages") data.messages.push(value as any);
    else if (collection === "rewards") data.rewards.push(...value.entries);
    else if (path === "settings/profile") data.profile = value as any;
    else if (path === "settings/preferences")
      data.preferences = { ...value, notifications } as any;
  }
  return data;
}
export function diff(before: Records, after: Records): Edit[] {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .sort()
    .flatMap((path) =>
      equal(before[path], after[path])
        ? []
        : [{ path, before: before[path] ?? null, after: after[path] ?? null }],
    );
}
export function operation(before: AppData, after: AppData): Operation | null {
  const edits = diff(recordsOf(before), recordsOf(after));
  if (!edits.length) return null;
  if (edits.length > 400)
    throw new Error(
      "Esta operación cambia más de 400 documentos. Divide la importación o rutina en bloques menores. Tus datos actuales no se han cambiado.",
    );
  return { id: uid(), at: new Date().toISOString(), edits };
}
export function mergeValue(
  base: any,
  local: any,
  remote: any,
): { value: any; conflict: boolean } {
  if (equal(local, remote) || equal(local, base))
    return { value: remote, conflict: false };
  if (equal(remote, base)) return { value: local, conflict: false };
  if (
    base &&
    local &&
    remote &&
    ![base, local, remote].some(Array.isArray) &&
    [base, local, remote].every((x) => typeof x === "object")
  ) {
    const value: Value = {};
    let conflict = false;
    for (const field of new Set([
      ...Object.keys(base),
      ...Object.keys(local),
      ...Object.keys(remote),
    ])) {
      // Modification timestamps are metadata, not competing user content.
      const merged =
        field === "updatedAt"
          ? {
              value: [local[field], remote[field]].sort().at(-1),
              conflict: false,
            }
          : mergeValue(base[field], local[field], remote[field]);
      if (merged.value !== undefined) value[field] = merged.value;
      conflict ||= merged.conflict;
    }
    return { value, conflict };
  }
  return { value: remote, conflict: true };
}
function overlay(base: any, local: any, remote: any): any {
  if (equal(base, local)) return remote;
  if (
    base &&
    local &&
    remote &&
    ![base, local, remote].some(Array.isArray) &&
    [base, local, remote].every((v) => typeof v === "object")
  ) {
    const result = { ...remote };
    for (const field of new Set([
      ...Object.keys(base),
      ...Object.keys(local),
    ])) {
      const value = overlay(base[field], local[field], remote[field]);
      if (value === undefined) delete result[field];
      else result[field] = value;
    }
    return result;
  }
  return local;
}
const earned = (v: Value | null) =>
  (v?.entries ?? [])
    .filter((r: Reward) => !r.key.endsWith(":budget"))
    .reduce((n: number, r: Reward) => n + r.points, 0);
export function mergeOperation(
  remote: Records,
  op: Operation,
): { records: Records; conflicts: string[] } {
  const records = { ...remote },
    conflicts: string[] = [];
  for (const edit of op.edits) {
    const current = remote[edit.path] ?? null;
    let result = mergeValue(edit.before, edit.after, current);
    if (
      edit.path.startsWith("items/") &&
      edit.before &&
      edit.after &&
      current &&
      !equal(edit.after, current) &&
      !equal(edit.before, current) &&
      ["type", "deletedAt"].some(
        (k) =>
          !equal(edit.before![k], current[k]) ||
          !equal(edit.before![k], edit.after![k]),
      )
    )
      result = { value: current, conflict: true };
    if (edit.path.startsWith("rewards/") && edit.after && current) {
      // Concurrent completions/hitos must never pay twice. Keep the higher earned ledger.
      const budget = (v: Value) =>
        v.entries.find((r: Reward) => r.key.endsWith(":budget"))?.points;
      result =
        budget(edit.after) !== budget(current)
          ? { value: current, conflict: true }
          : {
              value:
                earned(edit.after) > earned(current) ? edit.after : current,
              conflict: false,
            };
    }
    if (result.conflict) conflicts.push(edit.path);
    else if (result.value === null) delete records[edit.path];
    else records[edit.path] = result.value;
  }
  return { records, conflicts };
}
export function optimistic(
  base: AppData,
  pending: Operation[],
  notifications: boolean,
): AppData {
  let records = recordsOf(base);
  for (const op of pending)
    for (const edit of op.edits) {
      // Only locally changed fields are overlaid, preserving unrelated remote edits.
      const current = records[edit.path] ?? null;
      const merged = mergeValue(edit.before, edit.after, current);
      if (!merged.conflict) {
        if (merged.value === null) delete records[edit.path];
        else records[edit.path] = merged.value;
      } else if (edit.after === null) delete records[edit.path];
      else records[edit.path] = overlay(edit.before, edit.after, current);
    }
  return dataOf(records, notifications);
}
export function validateRecords(records: Records): AppData {
  for (const [path, value] of Object.entries(records)) {
    if (
      !COLLECTIONS.includes(path.split("/")[0] as any) ||
      path.split("/").length !== 2
    )
      throw new Error("Ruta de sincronización inválida.");
    // One attachment per document avoids the previous whole-account size ceiling.
    const size = Array.from(JSON.stringify(value)).reduce(
      (n, c) =>
        n +
        (c.codePointAt(0)! < 128
          ? 1
          : c.codePointAt(0)! < 2048
            ? 2
            : c.codePointAt(0)! < 65536
              ? 3
              : 4),
      0,
    );
    if (size > 700000)
      throw new Error(
        "Un documento supera 700 KB. Reduce el contenido o sus adjuntos.",
      );
    const collection = path.split("/")[0];
    const bound = (v: any, n: number) => {
      if (typeof v !== "string" || v.length > n)
        throw new Error(
          `Un campo de ${collection} supera el límite de ${n} caracteres.`,
        );
    };
    if (value.id !== undefined) bound(value.id, 200);
    if (collection === "items") {
      if (
        value.steps.length > 5000 ||
        value.dependencies.length > 5000 ||
        value.attachments.length > 3
      )
        throw new Error(
          "Máximo 5000 pasos o dependencias y 3 adjuntos por ítem.",
        );
      for (const k of [
        "description",
        "content",
        "location",
        "category",
        "visitReason",
        "participants",
        "agenda",
      ])
        bound(value[k], 100000);
      for (const s of value.steps) {
        bound(s.id, 200);
        bound(s.title, 1000);
      }
      value.dependencies.forEach((v: string) => bound(v, 200));
    }
    if (collection === "attachments") {
      bound(value.name, 1000);
      bound(value.mime, 200);
      bound(value.data, 500000);
    }
    if (collection === "workspaces" || collection === "groups")
      bound(value.name, 500);
    if (collection === "messages") bound(value.text, 100000);
    if (path === "settings/profile") {
      bound(value.name, 500);
      bound(value.roles, 2000);
    }
  }
  return readBackup(JSON.stringify(dataOf(records)));
}
export function newEnvelope(data: AppData): Envelope {
  return { version: 2, data, base: null, pending: [], conflict: null };
}
export function readEnvelope(raw: string): Envelope {
  const e = JSON.parse(raw);
  if (e.version !== 2 || !Array.isArray(e.pending))
    throw new Error("Copia de sincronización inválida.");
  readBackup(JSON.stringify(e.data));
  if (e.base) readBackup(JSON.stringify(e.base));
  for (const op of e.pending)
    if (
      typeof op.id !== "string" ||
      !Array.isArray(op.edits) ||
      op.edits.some(
        (d: Edit) =>
          typeof d.path !== "string" ||
          !COLLECTIONS.includes(d.path.split("/")[0] as any) ||
          d.path.split("/").length !== 2,
      )
    )
      throw new Error("Cola de cambios inválida.");
  return e;
}
