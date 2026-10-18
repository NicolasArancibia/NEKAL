import { arbol, Estado, estadoDe, MesaArbol, Nodo, Ventana } from "../espacio";
import { Destino, hijosDe } from "../estructura";
import { AppData, Group, Item } from "../model";

// Acomodo de la vista Plano (spec B §3.3). Puro, sin React.
export type Rect = { x: number; y: number; w: number; h: number };
export type PuntoPlano = { id: string; x: number; y: number; estado: Estado };
export type ZonaLejos = {
  id: string;
  tipo: "mesa" | "grupo" | "rutina";
  workspaceId: string;
  groupId: string;
  nombre: string;
  total: number;
  rect: Rect;
  puntos: PuntoPlano[];
  hijos: ZonaLejos[];
};
export type FichaPos = { id: string; rect: Rect };
export type ZonaCerca = {
  id: string;
  nombre: string;
  tipo: "grupo" | "rutina";
  rect: Rect;
  fichas: FichaPos[];
  mas: number;
  hijos: ZonaCerca[];
};

export const TOPE_FICHAS = 8;
const MARGEN = 12;
const HUECO = 8;
const TITULO = 26;
const FICHA_ALTO = 50;
const SUELTAS_ALTO = 44;
const SEPARACION_PUNTOS = 8;

// FNV-1a: el mismo id da siempre el mismo lugar, en web y en el iPhone.
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++)
    h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return (h >>> 0) / 4294967296;
}

// Lugares deterministas dentro de la elipse de `r`, a 8 o más entre sí cuando
// hay espacio; si no cabe, el intento más alejado del resto.
export function puntosEn(
  ids: string[],
  r: Rect,
  estado: (id: string) => Estado,
): PuntoPlano[] {
  const cx = r.x + r.w / 2,
    cy = r.y + r.h / 2;
  const rx = Math.max(0, r.w / 2 - 4),
    ry = Math.max(0, r.h / 2 - 4);
  const out: PuntoPlano[] = [];
  for (const id of ids) {
    let mejor = { x: cx, y: cy, libre: -1 };
    for (let k = 0; k < 24 && mejor.libre < SEPARACION_PUNTOS; k++) {
      const a = 2 * Math.PI * hash(`${id}#${k}`),
        t = Math.sqrt(hash(`${id}*${k}`));
      const x = cx + rx * t * Math.cos(a),
        y = cy + ry * t * Math.sin(a);
      const libre = Math.min(
        Infinity,
        ...out.map((p) => Math.hypot(p.x - x, p.y - y)),
      );
      if (libre > mejor.libre) mejor = { x, y, libre };
    }
    out.push({ id, x: mejor.x, y: mejor.y, estado: estado(id) });
  }
  return out;
}

const tipoDe = (g: Group) => (g.repeat ? "rutina" : "grupo");
const idsDe = (n: Nodo): string[] => [
  ...n.items.map((i) => i.id),
  ...n.hijos.flatMap(idsDe),
];
const dentro = (
  r: Rect,
  izq: number,
  arriba: number,
  der: number,
  abajo: number,
) => ({
  x: r.x + izq,
  y: r.y + arriba,
  w: Math.max(0, r.w - izq - der),
  h: Math.max(0, r.h - arriba - abajo),
});

type Bloque = {
  id: string;
  tipo: ZonaLejos["tipo"];
  workspaceId: string;
  groupId: string;
  nombre: string;
  propias: string[];
  hijos: Nodo[];
};
const bloqueDeMesa = (a: MesaArbol): Bloque => ({
  id: a.mesa.id,
  tipo: "mesa",
  workspaceId: a.mesa.id,
  groupId: "",
  nombre: a.mesa.name,
  propias: a.sueltas.map((i) => i.id),
  hijos: a.grupos,
});
const bloqueDeGrupo = (n: Nodo): Bloque => ({
  id: n.grupo.id,
  tipo: tipoDe(n.grupo),
  workspaceId: n.grupo.workspaceId,
  groupId: n.grupo.id,
  nombre: n.grupo.name,
  propias: n.items.map((i) => i.id),
  hijos: n.hijos,
});

const totalDe = (b: Bloque) =>
  b.propias.length + b.hijos.flatMap(idsDe).length;
const datosDe = ({ id, tipo, workspaceId, groupId, nombre }: Bloque) => ({
  id,
  tipo,
  workspaceId,
  groupId,
  nombre,
});

// Las zonas de adentro van en una grilla (2 columnas si hay ancho). Lo que no
// cabe se suma a los puntos propios de la zona, para que no se pierda nada.
function zonaLejos(
  b: Bloque,
  rect: Rect,
  estado: (id: string) => Estado,
): ZonaLejos {
  const area = dentro(rect, HUECO, TITULO, HUECO, HUECO);
  const base = { ...datosDe(b), total: totalDe(b), rect, hijos: [] };
  if (!b.hijos.length)
    return { ...base, puntos: puntosEn(b.propias, area, estado) };
  const cols = area.w >= 140 ? 2 : 1;
  const filasMax = Math.max(1, Math.floor((area.h + 6) / 36));
  const lugares = filasMax * cols;
  const conPropias = (n: number) => b.propias.length > 0 || n < b.hijos.length;
  let vistos = Math.min(b.hijos.length, lugares);
  while (vistos > 0 && vistos + (conPropias(vistos) ? 1 : 0) > lugares)
    vistos--;
  const propias = [...b.propias, ...b.hijos.slice(vistos).flatMap(idsDe)];
  const celdas = vistos + (propias.length ? 1 : 0);
  const filas = Math.ceil(celdas / cols);
  const w = (area.w - 6 * (cols - 1)) / cols,
    h = (area.h - 6 * (filas - 1)) / filas;
  const celda = (k: number): Rect => ({
    x: area.x + (k % cols) * (w + 6),
    y: area.y + Math.floor(k / cols) * (h + 6),
    w,
    h,
  });
  const desde = propias.length ? 1 : 0;
  return {
    ...base,
    puntos: propias.length ? puntosEn(propias, celda(0), estado) : [],
    hijos: b.hijos.slice(0, vistos).map((n, k) => {
      const r = celda(desde + k);
      const adentro = dentro(r, 6, 18, 6, 6);
      return {
        ...datosDe(bloqueDeGrupo(n)),
        total: idsDe(n).length,
        rect: r,
        puntos: puntosEn(idsDe(n), adentro.h >= 10 ? adentro : r, estado),
        hijos: [],
      };
    }),
  };
}

export function acomodoPlanoLejos(
  d: AppData,
  v: Ventana,
  now: number,
  ancho: number,
): { sueltas: Item[]; masSueltas: number; zonas: ZonaLejos[]; alto: number } {
  const [general, ...mesas] = arbol(d);
  const porId = new Map(d.items.map((i) => [i.id, i]));
  const estado = (id: string) => estadoDe(porId.get(id)!, d, v, now);
  const sueltas = general?.sueltas ?? [];
  const bloques = [
    ...(general?.grupos ?? []).map(bloqueDeGrupo),
    ...mesas.map(bloqueDeMesa),
  ];
  const inicio = HUECO + (sueltas.length ? SUELTAS_ALTO + HUECO : 0);
  const colAncho = (ancho - 2 * MARGEN - HUECO) / 2;
  const columnas = [inicio, inicio];
  const zonas = bloques.map((b) => {
    const alto = Math.min(240, Math.max(76, 38 * Math.sqrt(totalDe(b))));
    const col = columnas[0] <= columnas[1] ? 0 : 1;
    const rect = {
      x: MARGEN + col * (colAncho + HUECO),
      y: columnas[col],
      w: colAncho,
      h: alto,
    };
    columnas[col] += alto + HUECO;
    return zonaLejos(b, rect, estado);
  });
  return {
    sueltas: sueltas.slice(0, 2),
    masSueltas: Math.max(0, sueltas.length - 2),
    zonas,
    alto: Math.max(...columnas) + MARGEN,
  };
}

// Grilla de 2 columnas desde (x, y) en un ancho dado. Devuelve dónde termina.
function grilla(
  items: Item[],
  x: number,
  y: number,
  ancho: number,
  celdas: number,
) {
  const w = (ancho - HUECO) / 2;
  const fichas = items.map((i, k) => ({
    id: i.id,
    rect: {
      x: x + (k % 2) * (w + HUECO),
      y: y + Math.floor(k / 2) * (FICHA_ALTO + HUECO),
      w,
      h: FICHA_ALTO,
    },
  }));
  const filas = Math.ceil(celdas / 2);
  return {
    fichas,
    fin: y + filas * (FICHA_ALTO + HUECO) - (filas ? HUECO : 0),
  };
}

// Una zona de grupo: título, sus fichas (hasta el tope, más "+N más") y sus
// subgrupos debajo, cada uno un poco más adentro.
function zonaCerca(
  n: Nodo,
  x: number,
  y: number,
  w: number,
): ZonaCerca {
  const visibles = n.items.slice(0, TOPE_FICHAS);
  const mas = n.items.length - visibles.length;
  const g = grilla(
    visibles,
    x + HUECO,
    y + 30,
    w - 2 * HUECO,
    visibles.length + (mas ? 1 : 0),
  );
  let cursor = (visibles.length || mas ? g.fin : y + 30) + 12;
  const hijos = n.hijos.map((h) => {
    const z = zonaCerca(h, x + HUECO, cursor, w - 2 * HUECO);
    cursor = z.rect.y + z.rect.h + HUECO;
    return z;
  });
  return {
    id: n.grupo.id,
    nombre: n.grupo.name,
    tipo: tipoDe(n.grupo),
    rect: { x, y, w, h: Math.max(44, cursor - y) },
    fichas: g.fichas,
    mas,
    hijos,
  };
}

export function acomodoPlanoCerca(
  d: AppData,
  a: Destino,
  ancho: number,
): { sueltas: FichaPos[]; zonas: ZonaCerca[]; alto: number } {
  const h = hijosDe(d, a);
  const nodo = (g: Group): Nodo => {
    const x = hijosDe(d, { workspaceId: g.workspaceId, groupId: g.id });
    return { grupo: g, hijos: x.grupos.map(nodo), items: x.items };
  };
  const s = grilla(h.items, MARGEN, HUECO, ancho - 2 * MARGEN, h.items.length);
  let cursor = h.items.length ? s.fin + HUECO + 4 : HUECO;
  const zonas = h.grupos.map((g) => {
    const z = zonaCerca(nodo(g), 4, cursor, ancho - 8);
    cursor = z.rect.y + z.rect.h + HUECO;
    return z;
  });
  return { sueltas: s.fichas, zonas, alto: cursor + MARGEN };
}

// Posición de inserción al soltar en (x, y), en orden de lectura.
export function indiceEn(
  z: { fichas: FichaPos[] },
  x: number,
  y: number,
): number {
  const k = z.fichas.findIndex(
    ({ rect: f }) => y < f.y || (y < f.y + f.h && x < f.x + f.w / 2),
  );
  return k < 0 ? z.fichas.length : k;
}
