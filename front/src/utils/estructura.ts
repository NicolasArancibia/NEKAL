import { activeItems, AppData, Group, Item, uid, validateGroup } from "./model";

// Mesas, grupos y movimientos (spec B §2). Todas puras; lanzan Error con el
// mensaje para la persona si algo no se puede.
export const GENERAL = "general";
// groupId "" = suelto en la mesa.
export type Destino = { workspaceId: string; groupId: string };

const dentro = (i: Item, a: Destino) =>
  i.workspaceId === a.workspaceId && i.groupId === a.groupId;
const porX = (lista: Item[]) => [...lista].sort((p, q) => p.x - q.x);
const enOrden = (d: AppData, a: Destino) =>
  porX(activeItems(d).filter((i) => dentro(i, a)));

// Deja `orden` como contenido de `a` con x = 0..n e y = 0. Siempre el
// contenedor entero: si quedara una y ≠ 0, ordenarLegado lo reordenaría.
function colocar(items: Item[], a: Destino, orden: string[]): Item[] {
  const x = new Map(orden.map((id, n) => [id, n]));
  return items.map((i) =>
    x.has(i.id) ? { ...i, ...a, x: x.get(i.id)!, y: 0 } : i,
  );
}

function activas(d: AppData, ids: string[]): Item[] {
  return ids.map((id) => {
    const i = d.items.find((o) => o.id === id && !o.deletedAt);
    if (!i) throw new Error("Una de las cosas ya no existe.");
    return i;
  });
}

function grupoDe(d: AppData, id: string): Group {
  const g = d.groups.find((x) => x.id === id);
  if (!g) throw new Error("El grupo ya no existe.");
  return g;
}

// `id` opcional: el plan de Neka lo fija para que otros pasos lo usen.
export function crearMesa(
  d: AppData,
  name: string,
  color: string,
  id = uid(),
): { data: AppData; id: string } {
  if (!name.trim()) throw new Error("La mesa necesita un nombre.");
  return {
    data: {
      ...d,
      workspaces: [...d.workspaces, { id, name: name.trim(), color }],
    },
    id,
  };
}

export function borrarMesa(d: AppData, id: string): AppData {
  if (id === GENERAL) throw new Error("General no se puede borrar.");
  if (
    activeItems(d).some((i) => i.workspaceId === id) ||
    d.groups.some((g) => g.workspaceId === id)
  )
    throw new Error("Vacía la mesa antes de borrarla.");
  // Lo borrado pasa a General: un ítem sin mesa invalida el respaldo.
  return {
    ...d,
    workspaces: d.workspaces.filter((w) => w.id !== id),
    items: d.items.map((i) =>
      i.workspaceId === id ? { ...i, workspaceId: GENERAL, groupId: "" } : i,
    ),
  };
}

export function crearGrupo(
  d: AppData,
  g: Omit<Group, "id">,
  id = uid(),
): { data: AppData; id: string } {
  const grupo = { ...g, id, name: g.name.trim() };
  const error = validateGroup(grupo, d);
  if (error) throw new Error(error);
  return { data: { ...d, groups: [...d.groups, grupo] }, id: grupo.id };
}

// Nombre y repetición. Para cambiarlo de lugar: moverGrupo.
export function editarGrupo(d: AppData, g: Group): AppData {
  const grupo = {
    ...grupoDe(d, g.id),
    name: g.name.trim(),
    repeat: g.repeat,
    repeatDays: g.repeatDays,
    repeatStart: g.repeatStart,
  };
  const error = validateGroup(grupo, d);
  if (error) throw new Error(error);
  return { ...d, groups: d.groups.map((x) => (x.id === g.id ? grupo : x)) };
}

// Un día de una rutina (`<idRutina>~<día>`): lo crea aplicarRutinas.
export const esOcurrencia = (d: AppData, g: Group) =>
  !!g.parentId &&
  g.id.startsWith(`${g.parentId}~`) &&
  d.groups.some((p) => p.id === g.parentId && !!p.repeat);

// Sus grupos hijos y sus cosas (también las borradas) suben a su padre. Un día
// de rutina no: sus cosas quedarían en la rutina como modelo (se copiarían
// todos los días) y la rutina volvería a crear ese día.
export function borrarGrupo(d: AppData, id: string): AppData {
  const g = grupoDe(d, id);
  if (esOcurrencia(d, g))
    throw new Error(
      "Un día de rutina no se borra: borra sus cosas o cambia la rutina.",
    );
  const arriba = { workspaceId: g.workspaceId, groupId: g.parentId };
  const suyas = enOrden(d, { workspaceId: g.workspaceId, groupId: id });
  const items = colocar(
    d.items,
    arriba,
    [...enOrden(d, arriba), ...suyas].map((i) => i.id),
  ).map((i) => (i.groupId === id ? { ...i, groupId: g.parentId, y: 0 } : i));
  return {
    ...d,
    items,
    groups: d.groups
      .filter((x) => x.id !== id)
      .map((x) => (x.parentId === id ? { ...x, parentId: g.parentId } : x)),
  };
}

// Mueve el grupo con todo su subárbol; sus cosas cambian de mesa con él.
export function moverGrupo(
  d: AppData,
  id: string,
  a: { workspaceId: string; parentId: string },
): AppData {
  grupoDe(d, id);
  const sub = new Set([id]);
  for (let creció = true; creció;) {
    creció = false;
    for (const g of d.groups)
      if (sub.has(g.parentId) && !sub.has(g.id)) {
        sub.add(g.id);
        creció = true;
      }
  }
  const groups = d.groups.map((g) =>
    g.id === id
      ? { ...g, ...a }
      : sub.has(g.id)
        ? { ...g, workspaceId: a.workspaceId }
        : g,
  );
  const error = validateGroup(
    groups.find((g) => g.id === id)!,
    {
      ...d,
      groups,
    },
  );
  if (error) throw new Error(error);
  return {
    ...d,
    groups,
    items: d.items.map((i) =>
      sub.has(i.groupId) ? { ...i, workspaceId: a.workspaceId } : i,
    ),
  };
}

// Al final del orden de `a`, en el orden de `ids`.
export function moverItems(d: AppData, ids: string[], a: Destino): AppData {
  if (!d.workspaces.some((w) => w.id === a.workspaceId))
    throw new Error("La mesa ya no existe.");
  if (
    a.groupId &&
    !d.groups.some((g) => g.id === a.groupId && g.workspaceId === a.workspaceId)
  )
    throw new Error("El grupo debe estar en la misma mesa.");
  const cosas = activas(d, ids);
  const quedan = enOrden(d, a).filter((i) => !ids.includes(i.id));
  return {
    ...d,
    items: colocar(
      d.items,
      a,
      [...quedan, ...cosas].map((i) => i.id),
    ),
  };
}

// El grupo nuevo queda dentro del grupo común si todas comparten uno; si no,
// suelto en la mesa.
export function juntarEnGrupo(
  d: AppData,
  ids: string[],
  name: string,
  repeat?: Pick<Group, "repeat" | "repeatDays" | "repeatStart">,
): { data: AppData; id: string } {
  const cosas = activas(d, ids);
  if (new Set(cosas.map((i) => i.workspaceId)).size !== 1)
    throw new Error("Elige cosas de una misma mesa.");
  const { workspaceId, groupId } = cosas[0];
  const comun = cosas.every((i) => i.groupId === groupId);
  const r = crearGrupo(d, {
    name,
    workspaceId,
    parentId: comun ? groupId : "",
    repeat: "",
    repeatDays: [],
    repeatStart: "",
    ...repeat,
  });
  return {
    data: moverItems(r.data, ids, { workspaceId, groupId: r.id }),
    id: r.id,
  };
}

// Cada cosa sube al padre de su grupo; las sueltas quedan igual. Si ese padre
// es una rutina (la cosa estaba en uno de sus días), sube un nivel más: dentro
// de la rutina se volvería modelo y se copiaría todos los días.
export function sacarDeGrupo(d: AppData, ids: string[]): AppData {
  let data = d;
  for (const i of activas(d, ids)) {
    if (!i.groupId) continue;
    let arriba = d.groups.find((g) => g.id === i.groupId)?.parentId ?? "";
    const padre = d.groups.find((g) => g.id === arriba);
    if (padre?.repeat) arriba = padre.parentId;
    data = moverItems(data, [i.id], {
      workspaceId: i.workspaceId,
      groupId: arriba,
    });
  }
  return data;
}

// Lleva la cosa a la posición `indice` de su contenedor y renumera x 0..n.
export function reordenar(d: AppData, id: string, indice: number): AppData {
  const [cosa] = activas(d, [id]);
  const a = { workspaceId: cosa.workspaceId, groupId: cosa.groupId };
  const orden = enOrden(d, a)
    .filter((i) => i.id !== id)
    .map((i) => i.id);
  orden.splice(Math.max(0, Math.min(indice, orden.length)), 0, id);
  return { ...d, items: colocar(d.items, a, orden) };
}

// Grupos por nombre, cosas por x.
export function hijosDe(
  d: AppData,
  a: Destino,
): { grupos: Group[]; items: Item[] } {
  return {
    grupos: d.groups
      .filter(
        (g) => g.workspaceId === a.workspaceId && g.parentId === a.groupId,
      )
      .sort((p, q) => p.name.localeCompare(q.name, "es")),
    items: enOrden(d, a),
  };
}
