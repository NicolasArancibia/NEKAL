import {
  AppData,
  Group,
  Item,
  Workspace,
  deleteItem,
  saveItem,
} from "../model";
import { Destino, crearGrupo, crearMesa, moverItems } from "../estructura";
import { Conflict, findConflicts } from "../planner";

// El plan de Neka (spec D §4.4): pasos que se prueban sobre una copia con las
// mismas funciones que la edición a mano y se aplican solo al aceptar.
export type Paso =
  | { tipo: "crear"; item: Item }
  | {
      tipo: "editar";
      id: string;
      cambios: Partial<
        Pick<
          Item,
          | "title"
          | "description"
          | "priority"
          | "difficulty"
          | "duration"
          | "steps"
          | "flexible"
        >
      >;
    }
  | {
      tipo: "mover";
      id: string;
      scheduledAt: string;
      dueAt: string;
      startDate: string;
    }
  | { tipo: "completar"; id: string }
  | { tipo: "borrar"; id: string }
  | { tipo: "moverA"; ids: string[]; destino: Destino }
  | { tipo: "crearGrupo"; grupo: Group }
  | { tipo: "crearMesa"; mesa: Workspace };
// toca: id de cada cosa que el paso cambia → `updatedAt` que tenía al armarlo.
export type PasoPlan = Paso & {
  texto: string;
  toca: Record<string, string>;
  eraFija?: boolean;
};
export type Plan = { id: string; resumen: string; pasos: PasoPlan[] };

function viva(d: AppData, id: string): Item {
  const i = d.items.find((x) => x.id === id && !x.deletedAt);
  if (!i) throw new Error("Esa cosa ya no existe.");
  return i;
}

export function aplicarPaso(d: AppData, p: Paso, now: number): AppData {
  switch (p.tipo) {
    case "crear":
      return saveItem(d, p.item, now);
    case "editar":
      return saveItem(d, { ...viva(d, p.id), ...p.cambios }, now);
    case "mover": {
      const { scheduledAt, dueAt, startDate } = p;
      return saveItem(
        d,
        { ...viva(d, p.id), scheduledAt, dueAt, startDate },
        now,
      );
    }
    case "completar":
      return saveItem(d, { ...viva(d, p.id), status: "completado" }, now);
    case "borrar":
      viva(d, p.id);
      return deleteItem(d, p.id);
    case "moverA":
      p.ids.forEach((id) => viva(d, id));
      return moverItems(d, p.ids, p.destino);
    case "crearGrupo":
      return crearGrupo(d, p.grupo, p.grupo.id).data;
    case "crearMesa":
      return crearMesa(d, p.mesa.name, p.mesa.color, p.mesa.id).data;
  }
}

// Ids que el paso crea y los que necesita que existan.
const crea = (p: Paso): string[] =>
  p.tipo === "crear"
    ? [p.item.id]
    : p.tipo === "crearGrupo"
      ? [p.grupo.id]
      : p.tipo === "crearMesa"
        ? [p.mesa.id]
        : [];
const usa = (p: Paso): string[] =>
  p.tipo === "crear"
    ? [p.item.workspaceId, p.item.groupId, ...p.item.dependencies]
    : p.tipo === "moverA"
      ? [...p.ids, p.destino.workspaceId, p.destino.groupId]
      : p.tipo === "crearGrupo"
        ? [p.grupo.workspaceId, p.grupo.parentId]
        : p.tipo === "crearMesa"
          ? []
          : [p.id];

export function probar(
  d: AppData,
  pasos: PasoPlan[],
  marcados: boolean[],
  now: number,
): { data: AppData; errores: (string | null)[] } {
  const desmarcado = new Map<string, string>();
  pasos.forEach((p, n) => {
    if (!marcados[n]) for (const id of crea(p)) desmarcado.set(id, p.texto);
  });
  let data = d;
  const errores = pasos.map((p, n): string | null => {
    if (!marcados[n]) return null;
    const falta = usa(p).find((id) => desmarcado.has(id));
    if (falta) return `Depende de «${desmarcado.get(falta)}», que desmarcaste.`;
    try {
      data = aplicarPaso(data, p, now);
      return null;
    } catch (e) {
      return (e as Error).message;
    }
  });
  return { data, errores };
}

// Un choque que el plan crea (spec H1): los que ya había antes no cuentan.
// `bloquea` = lo que el plan mueve o crea, y es flexible, queda encima de otra
// cosa o fuera de su plazo o antes de lo que espera; dos cosas fijas entre sí
// (o la falta de hueco de otra) solo avisan.
export type Choque = { clave: string; descripcion: string; bloquea: boolean };
const claveDe = (c: Conflict) => `${c.kind}|${[...c.itemIds].sort().join(",")}`;

export function choquesDelPlan(
  d: AppData,
  pasos: PasoPlan[],
  marcados: boolean[],
  now: number,
): Choque[] {
  const { data } = probar(d, pasos, marcados, now);
  const habia = new Set(findConflicts(d, now).map(claveDe));
  const tocados = new Set<string>();
  pasos.forEach((p, n) => {
    if (!marcados[n]) return;
    for (const id of [...Object.keys(p.toca), ...crea(p)]) tocados.add(id);
  });
  const flexible = (id: string) =>
    data.items.find((i) => i.id === id)?.flexible === true;
  return findConflicts(data, now)
    .filter((c) => !habia.has(claveDe(c)))
    .map((c) => ({
      clave: claveDe(c),
      descripcion: c.description,
      bloquea:
        c.kind !== "capacity" &&
        c.itemIds.some((id) => tocados.has(id) && flexible(id)),
    }));
}

export function aceptar(
  d: AppData,
  plan: Plan,
  marcados: boolean[],
  now: number,
): AppData {
  plan.pasos.forEach((p, n) => {
    if (!marcados[n]) return;
    for (const [id, visto] of Object.entries(p.toca))
      if (d.items.find((i) => i.id === id && !i.deletedAt)?.updatedAt !== visto)
        throw new Error("Algo cambió, pídeselo de nuevo.");
  });
  const { data, errores } = probar(d, plan.pasos, marcados, now);
  const error = errores.find((e) => e);
  if (error) throw new Error(error);
  const bloqueo = choquesDelPlan(d, plan.pasos, marcados, now).find(
    (c) => c.bloquea,
  );
  if (bloqueo)
    throw new Error(
      `La agenda cambió: ${bloqueo.descripcion} Pídeselo de nuevo.`,
    );
  return data;
}
