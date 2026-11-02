import { atrasadas, esImportante } from "./espacio";
import { AppData, Item, deleteItem, localDay, saveItem } from "./model";
import { buscarHueco } from "./planner";

// Acciones sobre lo atrasado (spec H2 §4). Puras: la interfaz las llama dentro
// de `change`.
export const MAX_PAPELERA = 200;

// La próxima cosa importante atrasada por la que Neka pregunta (spec H2 §4): la
// más importante primero (urgente, luego con entrega) y, entre iguales, la más
// reciente. Salta lo que ya se preguntó hoy (`preguntadas`: id → día).
export function siguientePregunta(
  d: AppData,
  now: number,
  preguntadas: Record<string, string>,
): Item | null {
  const hoy = localDay(new Date(now));
  const rango = (i: Item) => (i.priority === "urgente" ? 0 : 1);
  return (
    atrasadas(d, now)
      .filter((i) => esImportante(i) && preguntadas[i.id] !== hoy)
      .sort((a, b) => rango(a) - rango(b))[0] ?? null
  );
}

// «A hoy»: el primer hueco libre de hoy desde ahora, dentro de la jornada y sin
// pisar lo fijo. Si hoy no cabe, no cambia nada.
export function aHoy(d: AppData, id: string, now: number): AppData {
  const i = d.items.find((x) => x.id === id && !x.deletedAt);
  if (!i) throw new Error("Esa cosa ya no existe.");
  const fin = new Date(now);
  fin.setHours(d.preferences.dayEnd, 0, 0, 0);
  const hueco = buscarHueco(
    d,
    { duracion: i.duration, desde: now, hasta: fin.getTime(), ignorar: id },
    now,
  );
  if (!hueco) throw new Error("Hoy no cabe.");
  return saveItem(d, { ...i, scheduledAt: hueco }, now);
}

// «A la papelera»: de a MAX_PAPELERA por vez (la sincronización acepta hasta
// 400 documentos por cambio). Las que otra cosa necesita se omiten y se cuentan.
export function aPapelera(
  d: AppData,
  ids: string[],
): { data: AppData; omitidas: number } {
  let data = d;
  let omitidas = 0;
  for (const id of ids.slice(0, MAX_PAPELERA)) {
    try {
      data = deleteItem(data, id);
    } catch {
      omitidas++;
    }
  }
  return { data, omitidas };
}
