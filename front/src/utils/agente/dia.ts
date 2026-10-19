import { AppData, Item, localDay, passive } from "../model";
import { timedItems } from "../espacio";
import type { Plan, PasoPlan } from "./plan";

// El día dibujado de la hoja del plan (spec D §5.2): punteado = como estaba,
// violeta = como quedaría, candado = fijo. Solo el primer día con cambios de
// horario; los pasos de otros días quedan solo en la lista.
export type Bloque = {
  id: string;
  titulo: string;
  inicio: number;
  fin: number;
  tipo: "antes" | "despues" | "fijo";
  paso?: number;
};
const HORA = 3600000;
const fecha = (i: Pick<Item, "scheduledAt" | "dueAt">) =>
  i.scheduledAt || i.dueAt;
const diaDe = (iso: string) => localDay(new Date(iso));

// La cosa como estaba y como quedaría con este paso (si toca un horario).
function horario(
  d: AppData,
  p: PasoPlan,
): { antes?: Item; despues: Item } | null {
  if (p.tipo === "crear") return fecha(p.item) ? { despues: p.item } : null;
  if (p.tipo !== "mover") return null;
  const antes = d.items.find((i) => i.id === p.id);
  if (!antes) return null;
  const despues = { ...antes, scheduledAt: p.scheduledAt, dueAt: p.dueAt };
  return fecha(despues) ? { antes, despues } : null;
}
const bloque = (i: Item, tipo: Bloque["tipo"], paso?: number): Bloque => {
  const inicio = Date.parse(fecha(i));
  return {
    id: i.id,
    titulo: i.title,
    inicio,
    fin: inicio + i.duration * 60000,
    tipo,
    paso,
  };
};

export function bloquesDelDia(
  d: AppData,
  plan: Plan,
  marcados: boolean[],
): { dia: string; desde: number; hasta: number; bloques: Bloque[] } | null {
  const horarios = plan.pasos.map((p) => horario(d, p));
  const primero = horarios.find((h) => h);
  if (!primero) return null;
  const dia = diaDe(fecha(primero.despues));
  const bloques: Bloque[] = [];
  horarios.forEach((h, n) => {
    if (!h || diaDe(fecha(h.despues)) !== dia) return;
    if (h.antes && fecha(h.antes) && diaDe(fecha(h.antes)) === dia)
      bloques.push(bloque(h.antes, "antes", n));
    if (marcados[n]) bloques.push(bloque(h.despues, "despues", n));
  });
  if (!bloques.length) return null;
  const redondeo = (t: number, arriba: boolean) => {
    const x = new Date(t);
    const exacta =
      x.getMinutes() === 0 && x.getSeconds() === 0 && x.getMilliseconds() === 0;
    x.setMinutes(0, 0, 0);
    return arriba && !exacta ? x.getTime() + HORA : x.getTime();
  };
  // Lo fijo que cae en el tramo (ya redondeado a la hora) también se dibuja.
  let desde = redondeo(Math.min(...bloques.map((b) => b.inicio)), false),
    hasta = redondeo(Math.max(...bloques.map((b) => b.fin)), true);
  const tocadas = new Set(bloques.map((b) => b.id));
  for (const i of timedItems(d)) {
    if (
      passive(i) ||
      i.flexible ||
      i.status === "completado" ||
      tocadas.has(i.id)
    )
      continue;
    if (!i.scheduledAt || diaDe(i.scheduledAt) !== dia) continue;
    const b = bloque(i, "fijo");
    if (b.inicio < hasta && b.fin > desde) bloques.push(b);
  }
  desde = redondeo(Math.min(desde, ...bloques.map((b) => b.inicio)), false);
  hasta = redondeo(Math.max(hasta, ...bloques.map((b) => b.fin)), true);
  return { dia, desde, hasta, bloques };
}
