import {
  arbol,
  diasHasta,
  enVentana,
  estaAtrasada,
  Estado,
  estadoDe,
  fechaDe,
  timedItems,
  Ventana,
} from "../espacio";
import { AppData, Item, localDay, passive } from "../model";

// Acomodo de la vista Tiempo (spec B §3.1): hoy al centro, un anillo por
// tramo de tiempo y una porción del círculo por mesa. Puro, sin React.
export type Radios = {
  centro: number;
  hoy: number;
  manana: number;
  ventanaDesde: number;
  ventanaHasta: number;
  sinFecha: number;
};
// Grados, 0 = arriba, sentido horario.
export type Sector = { workspaceId: string; desde: number; hasta: number };
export type NodoTiempo = {
  id: string;
  workspaceId: string;
  x: number;
  y: number;
  estado: Estado;
  anillo: "hoy" | "manana" | "ventana" | "sinFecha";
};

const SEPARACION = 14; // px entre centros de dos cosas
const SECTOR_MINIMO = 30;

export const radiosPara = (lado: number): Radios => ({
  centro: 0.07 * lado,
  hoy: 0.14 * lado,
  manana: 0.24 * lado,
  ventanaDesde: 0.3 * lado,
  ventanaHasta: 0.4 * lado,
  sinFecha: 0.47 * lado,
});

// Último día que cabe en la banda de la ventana (desde el día 2).
const ultimoDia = (v: Ventana) =>
  ({ hoy: 6, semana: 6, "2semanas": 13, todo: 30 })[v];

const pendientes = (d: AppData) =>
  timedItems(d).filter((i) => !passive(i) && i.status !== "completado");

// Proporcional a lo pendiente de cada mesa, con un mínimo de 30°.
export function sectores(d: AppData): Sector[] {
  const mesas = arbol(d).map((a) => a.mesa);
  const cuenta = (id: string) =>
    pendientes(d).filter((i) => i.workspaceId === id).length;
  const total = mesas.reduce((s, w) => s + cuenta(w.id), 0);
  const sobra = 360 - SECTOR_MINIMO * mesas.length;
  let desde = 0;
  return mesas.map((w, k) => {
    const ancho =
      !total || sobra < 0
        ? 360 / mesas.length
        : SECTOR_MINIMO + (sobra * cuenta(w.id)) / total;
    const s = {
      workspaceId: w.id,
      desde,
      hasta: k === mesas.length - 1 ? 360 : desde + ancho,
    };
    desde = s.hasta;
    return s;
  });
}

type Puesto = { item: Item; anillo: NodoTiempo["anillo"]; r: number };

function puesto(i: Item, v: Ventana, now: number, rs: Radios): Puesto | null {
  if (passive(i) || !enVentana(i, v, now)) return null;
  if (!fechaDe(i)) return { item: i, anillo: "sinFecha", r: rs.sinFecha };
  const dias = diasHasta(fechaDe(i), now);
  if (dias <= 0) return { item: i, anillo: "hoy", r: rs.hoy };
  if (dias === 1) return { item: i, anillo: "manana", r: rs.manana };
  const ultimo = ultimoDia(v);
  // Lo que está en curso más allá del tiempo elegido va afuera.
  if (dias > ultimo && v !== "todo")
    return { item: i, anillo: "sinFecha", r: rs.sinFecha };
  const t = (Math.min(dias, ultimo) - 2) / (ultimo - 2);
  return {
    item: i,
    anillo: "ventana",
    r: rs.ventanaDesde + t * (rs.ventanaHasta - rs.ventanaDesde),
  };
}

export function acomodoTiempo(
  d: AppData,
  v: Ventana,
  now: number,
  lado: number,
): { nodos: NodoTiempo[]; sectores: Sector[]; radios: Radios } {
  const radios = radiosPara(lado);
  const lista = sectores(d);
  const c = lado / 2;
  const nodos: NodoTiempo[] = [];
  const grupos = new Map<string, Puesto[]>();
  for (const i of timedItems(d)) {
    const p = estaAtrasada(i, now) ? null : puesto(i, v, now, radios);
    if (!p || !lista.some((s) => s.workspaceId === i.workspaceId)) continue;
    const k = `${i.workspaceId}|${p.anillo}`;
    grupos.set(k, [...(grupos.get(k) ?? []), p]);
  }
  for (const s of lista)
    for (const anillo of ["hoy", "manana", "ventana", "sinFecha"] as const) {
      const ps = (grupos.get(`${s.workspaceId}|${anillo}`) ?? []).sort(
        (p, q) =>
          fechaDe(p.item).localeCompare(fechaDe(q.item)) ||
          p.item.id.localeCompare(q.item.id),
      );
      if (!ps.length) continue;
      // Cuántas caben en el arco a la distancia mínima; lo que sobra pasa a
      // otra fila, 14 px más afuera.
      const r0 = Math.min(...ps.map((p) => p.r));
      const paso = 2 * Math.asin(Math.min(1, SEPARACION / 2 / r0));
      const ancho = ((s.hasta - s.desde) * Math.PI) / 180;
      const caben = Math.max(1, Math.floor(ancho / paso));
      ps.forEach((p, n) => {
        const fila = Math.floor(n / caben);
        const enFila = Math.min(caben, ps.length - fila * caben);
        const angulo =
          (s.desde * Math.PI) / 180 + ((n % caben) + 0.5) * (ancho / enFila);
        const r = p.r + fila * SEPARACION;
        nodos.push({
          id: p.item.id,
          workspaceId: p.item.workspaceId,
          x: c + r * Math.sin(angulo),
          y: c - r * Math.cos(angulo),
          estado: estadoDe(p.item, d, v, now),
          anillo,
        });
      });
    }
  return { nodos, sectores: lista, radios };
}

// Burbujas «+N» (spec H2 §4): si un sector y anillo juntan más de `max` puntos,
// se dibujan los 3 primeros y el resto va en una burbuja en su centro; tocarla
// abre la lista. No se pierde ninguno.
export type Burbuja = {
  workspaceId: string;
  anillo: NodoTiempo["anillo"];
  x: number;
  y: number;
  ids: string[];
};
const PUNTOS_A_LA_VISTA = 3;
export function agruparNodos(
  nodos: NodoTiempo[],
  max = 6,
): { puntos: NodoTiempo[]; burbujas: Burbuja[] } {
  const grupos = new Map<string, NodoTiempo[]>();
  for (const n of nodos) {
    const k = `${n.workspaceId}|${n.anillo}`;
    grupos.set(k, [...(grupos.get(k) ?? []), n]);
  }
  const puntos: NodoTiempo[] = [];
  const burbujas: Burbuja[] = [];
  for (const g of grupos.values()) {
    if (g.length <= max) {
      puntos.push(...g);
      continue;
    }
    const resto = g.slice(PUNTOS_A_LA_VISTA);
    puntos.push(...g.slice(0, PUNTOS_A_LA_VISTA));
    burbujas.push({
      workspaceId: g[0].workspaceId,
      anillo: g[0].anillo,
      x: resto.reduce((s, n) => s + n.x, 0) / resto.length,
      y: resto.reduce((s, n) => s + n.y, 0) / resto.length,
      ids: resto.map((n) => n.id),
    });
  }
  return { puntos, burbujas };
}

// Al soltar: a qué día corresponde la distancia al centro. "" = sin fecha.
export function diaDesdeRadio(
  r: number,
  radios: Radios,
  v: Ventana,
  now: number,
): string {
  const ultimo = ultimoDia(v);
  let dias: number;
  if (r < (radios.hoy + radios.manana) / 2) dias = 0;
  else if (r < (radios.manana + radios.ventanaDesde) / 2) dias = 1;
  else if (r <= (radios.ventanaHasta + radios.sinFecha) / 2)
    dias = Math.min(
      ultimo,
      Math.max(
        2,
        2 +
          Math.round(
            ((r - radios.ventanaDesde) /
              (radios.ventanaHasta - radios.ventanaDesde)) *
              (ultimo - 2),
          ),
      ),
    );
  else return "";
  const hoy = new Date(now);
  return localDay(
    new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + dias),
  );
}
