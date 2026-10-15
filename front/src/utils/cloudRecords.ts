import { Records, COLLECTIONS } from "./syncModel";
export const CLOUD_COLLECTIONS = [
  ...COLLECTIONS,
  "steps",
  "dependencies",
  "rewardEntries",
] as const;
// Logical records are used for three-way merges. Physical documents keep nested
// entities individually typed and bounded by Firestore Security Rules.
export function toCloud(records: Records): Records {
  const out: Records = {};
  for (const [path, v] of Object.entries(records)) {
    if (path.startsWith("items/")) {
      const { steps, dependencies, ...rest } = v;
      out[path] = rest;
      steps.forEach((s: any, order: number) => {
        out["steps/" + encodeURIComponent(v.id + "~" + s.id)] = {
          ...s,
          itemId: v.id,
          order,
        };
      });
      dependencies.forEach((targetId: string, order: number) => {
        out["dependencies/" + encodeURIComponent(v.id + "~" + targetId)] = {
          itemId: v.id,
          targetId,
          order,
        };
      });
    } else if (path.startsWith("rewards/")) {
      out[path] = { itemId: v.itemId };
      v.entries.forEach((r: any, order: number) => {
        out["rewardEntries/" + encodeURIComponent(r.key)] = { ...r, order };
      });
    } else out[path] = v;
  }
  return out;
}
export function fromCloud(records: Records): Records {
  const out: Records = {};
  for (const [p, v] of Object.entries(records))
    if (COLLECTIONS.includes(p.split("/")[0] as any))
      out[p] = p.startsWith("items/")
        ? { ...v, steps: [], dependencies: [] }
        : p.startsWith("rewards/")
          ? { ...v, entries: [] }
          : v;
  for (const [p, v] of Object.entries(records).sort(
    ([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0),
  )) {
    const kind = p.split("/")[0];
    if (kind === "steps" || kind === "dependencies") {
      const target = out["items/" + encodeURIComponent(v.itemId)];
      if (!target) throw new Error("Paso o dependencia sin ítem.");
      const { itemId, order, ...step } = v;
      if (kind === "steps") target.steps.push(step);
      else target.dependencies.push(v.targetId);
    } else if (kind === "rewardEntries") {
      const target = out["rewards/" + encodeURIComponent(v.itemId)];
      if (!target) throw new Error("Movimiento de puntos sin historial.");
      const { order, ...entry } = v;
      target.entries.push(entry);
    }
  }
  return out;
}
