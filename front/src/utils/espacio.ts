import { Destino, GENERAL, hijosDe } from "./estructura";
import {
  activeItems,
  AppData,
  difficultyOf,
  Group,
  Item,
  passive,
  Workspace,
} from "./model";

// Cerebro común de las tres vistas del Espacio (spec B §3–4). Puro.
export type Ventana = "hoy" | "semana" | "2semanas" | "todo";
export const DIAS_VENTANA: Record<Ventana, number> = {
  hoy: 1,
  semana: 7,
  "2semanas": 14,
  todo: Infinity,
};
export type Estado = "on" | "hoy" | "tenue" | "hueco" | "hecho" | "bloqueado";

export const fechaDe = (i: Item) => i.scheduledAt || i.dueAt || "";
export const siempreVisible = (i: Item) =>
  !fechaDe(i) || i.status === "en curso";

// Días locales entre hoy y la fecha (negativo = atrasada). Contar en días
// de calendario evita que un cambio de horario corra un día.
export function diasHasta(fecha: string, now: number) {
  const dia = (t: Date) =>
    Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()) / 86400000;
  return dia(new Date(fecha)) - dia(new Date(now));
}

// Atrasada (spec H2 §3): pendiente, con fecha, de hace más de ATRASO_DIAS días
// de calendario. Lo sin fecha no vence; Nota e Idea no son de tiempo. Derivada:
// no se guarda nada, y reprogramar o completar la devuelve a la vista normal.
export const ATRASO_DIAS = 2;
// Espejo (V2/H4): lo importado de Google/Outlook es un evento ajeno, no una tarea
// tuya: nunca queda «atrasado». Un día completo (feriado, viaje) no ocupa horas.
export const esExterno = (i: Item) => i.origen?.creadoEn === "fuera";
export const ocupaTiempo = (i: Item) => !i.origen?.diaCompleto;
export function estaAtrasada(i: Item, now: number): boolean {
  const f = fechaDe(i);
  return (
    !!f &&
    !i.deletedAt &&
    !esExterno(i) &&
    !passive(i) &&
    i.status !== "completado" &&
    diasHasta(f, now) < -ATRASO_DIAS
  );
}
// Más recientes primero.
export function atrasadas(d: AppData, now: number): Item[] {
  return timedItems(d)
    .filter((i) => estaAtrasada(i, now))
    .sort((a, b) => fechaDe(b).localeCompare(fechaDe(a)));
}
// Lo que Neka pregunta si se pasó: urgente, con fecha límite o Deadline.
export const esImportante = (i: Item) =>
  i.priority === "urgente" || !!i.dueAt || i.type === "Deadline";

// Lo atrasado sin completar cuenta como dentro; lo que se ve siempre, también.
export function enVentana(i: Item, v: Ventana, now: number): boolean {
  if (siempreVisible(i)) return true;
  const dias = diasHasta(fechaDe(i), now);
  return dias < 0 ? i.status !== "completado" : dias < DIAS_VENTANA[v];
}

export function estadoDe(i: Item, d: AppData, v: Ventana, now: number): Estado {
  if (i.status === "completado") return "hecho";
  if (
    activeItems(d).some(
      (r) => i.dependencies.includes(r.id) && r.status !== "completado",
    )
  )
    return "bloqueado";
  if (!fechaDe(i)) return "hueco";
  if (diasHasta(fechaDe(i), now) <= 0) return "hoy";
  return enVentana(i, v, now) ? "on" : "tenue";
}

// Spec §4.2: dificultad × horas (entre 0,25 y 4); 0 si no es trabajo pendiente.
export function cargaDe(i: Item, now: number): number {
  if (passive(i) || i.status === "completado" || i.deletedAt) return 0;
  return difficultyOf(i) * Math.min(4, Math.max(0.25, i.duration / 60));
}

// El grupo y todos los que tiene adentro; groupId "" = la mesa entera.
export function gruposBajo(d: AppData, a: Destino): Set<string> {
  const grupos = new Set([a.groupId]);
  for (let creció = true; creció; ) {
    creció = false;
    for (const g of d.groups)
      if (
        g.workspaceId === a.workspaceId &&
        grupos.has(g.parentId) &&
        !grupos.has(g.id)
      ) {
        grupos.add(g.id);
        creció = true;
      }
  }
  return grupos;
}

// Incluye subgrupos. Sin modelos de rutina.
export function cargaDeContenedor(
  d: AppData,
  a: Destino,
  now: number,
): number {
  const grupos = gruposBajo(d, a);
  return timedItems(d)
    .filter((i) => i.workspaceId === a.workspaceId && grupos.has(i.groupId))
    .reduce((suma, i) => suma + cargaDe(i, now), 0);
}

// Requisitos y dependientes, en cualquier mesa.
export function conexiones(
  d: AppData,
  id: string,
): { requisitos: Item[]; dependientes: Item[] } {
  const vivas = activeItems(d);
  const propia = d.items.find((i) => i.id === id);
  return {
    requisitos: vivas.filter((i) => propia?.dependencies.includes(i.id)),
    dependientes: vivas.filter((i) => i.dependencies.includes(id)),
  };
}

export const esRutina = (g: Group) => !!g.repeat;
// Lo que está directo en una rutina es su modelo (spec §2.1).
export const esModelo = (i: Item, d: AppData) =>
  d.groups.some((g) => g.id === i.groupId && esRutina(g));

export function timedItems(d: AppData): Item[] {
  const rutinas = new Set(d.groups.filter(esRutina).map((g) => g.id));
  return activeItems(d).filter((i) => !rutinas.has(i.groupId));
}

export type Nodo = { grupo: Group; hijos: Nodo[]; items: Item[] };
export type MesaArbol = { mesa: Workspace; grupos: Nodo[]; sueltas: Item[] };

export function arbol(d: AppData): MesaArbol[] {
  const nodo = (g: Group): Nodo => {
    const h = hijosDe(d, { workspaceId: g.workspaceId, groupId: g.id });
    return { grupo: g, hijos: h.grupos.map(nodo), items: h.items };
  };
  return [...d.workspaces]
    .sort((p, q) =>
      p.id === GENERAL
        ? -1
        : q.id === GENERAL
          ? 1
          : p.name.localeCompare(q.name, "es"),
    )
    .map((mesa) => {
      const h = hijosDe(d, { workspaceId: mesa.id, groupId: "" });
      return { mesa, grupos: h.grupos.map(nodo), sueltas: h.items };
    });
}

export function rutaDe(d: AppData, groupId: string): Group[] {
  const ruta: Group[] = [];
  for (
    let g = d.groups.find((x) => x.id === groupId);
    g && !ruta.includes(g);
    g = d.groups.find((x) => x.id === g!.parentId)
  )
    ruta.unshift(g);
  return ruta;
}

// Cambia el día conservando la hora local; dia "" deja la cosa sin fecha.
export function moverAFecha(
  i: Item,
  dia: string,
  horaPorDefecto: number,
): Item {
  if (!dia) {
    if (["Evento", "Visita", "Meeting"].includes(i.type))
      throw new Error("Un evento necesita fecha.");
    return { ...i, scheduledAt: "", dueAt: "" };
  }
  const [y, m, n] = dia.split("-").map(Number);
  const en = (s: string) => {
    const t = new Date(s);
    return new Date(y, m - 1, n, t.getHours(), t.getMinutes()).toISOString();
  };
  const cambio = i.scheduledAt
    ? { scheduledAt: en(i.scheduledAt) }
    : i.dueAt
      ? { dueAt: en(i.dueAt) }
      : { dueAt: new Date(y, m - 1, n, horaPorDefecto, 0).toISOString() };
  return {
    ...i,
    ...cambio,
    startDate: dia < i.startDate ? dia : i.startDate,
  };
}

