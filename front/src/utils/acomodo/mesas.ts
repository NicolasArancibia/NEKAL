import {
  arbol,
  cargaDe,
  cargaDeContenedor,
  conexiones,
  Estado,
  estadoDe,
  Nodo,
  Ventana,
} from "../espacio";
import { GENERAL } from "../estructura";
import { AppData, Item } from "../model";
import { PuntoPlano, puntosEn, Rect } from "./plano";
import { Camara, proyectar, Punto3 } from "./proyeccion";

// Acomodo de la vista Mesas (spec B §3.2): pisos en un mismo eje, General
// arriba. Puro; el dibujo (Skia) solo lee esto.
export type Foco = { workspaceId: string; ruta: string[] }; // "general" + [] = arriba
export type Cubito = {
  id: string;
  x: number;
  y: number;
  lado: number;
  alto: number;
  estado: Estado;
};
export type Piso = {
  id: string;
  tipo: "general" | "mesa" | "grupo" | "rutina";
  workspaceId: string;
  groupId: string;
  nombre: string;
  total: number;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  grosor: number;
  vidrio: boolean;
  cubitos: Cubito[];
  puntos: PuntoPlano[];
};
export type Cable = { desde: Punto3; hasta: Punto3 };

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const tamanoPiso = (n: number) =>
  clamp(110 + 26 * Math.sqrt(n), 120, 260);
export const altoCubito = (carga: number) =>
  carga === 0 ? 1 : clamp(2 + 2 * carga, 3, 26);
export const grosorPiso = (cargaPendiente: number, tipo: Piso["tipo"]) =>
  tipo === "general" || tipo === "mesa"
    ? Math.min(24, 10 + 0.7 * cargaPendiente)
    : Math.min(10, 5 + 0.25 * cargaPendiente);

// z de cada nivel: General, mesas, grupos y, más abajo, cada 140.
const zDe = (nivel: number) =>
  [0, -150, -290][nivel] ?? -290 - 140 * (nivel - 2);
const CELDA = 56; // cubito de 48 + 8 de separación
const BORDE = 14;
const ETIQUETA = 18;
const HUECO_GRILLA = 24;

type Contenedor = {
  id: string;
  tipo: Piso["tipo"];
  workspaceId: string;
  groupId: string;
  nombre: string;
  propias: Item[];
  hijos: Contenedor[];
  ids: string[];
};
const deNodo = (n: Nodo): Contenedor => {
  const hijos = n.hijos.map(deNodo);
  return {
    id: n.grupo.id,
    tipo: n.grupo.repeat ? "rutina" : "grupo",
    workspaceId: n.grupo.workspaceId,
    groupId: n.grupo.id,
    nombre: n.grupo.name,
    propias: n.items,
    hijos,
    ids: [...n.items.map((i) => i.id), ...hijos.flatMap((h) => h.ids)],
  };
};

// General contiene sus grupos y todas las mesas; su tamaño cuenta solo lo suyo.
function raiz(d: AppData): Contenedor {
  const [general, ...mesas] = arbol(d);
  const suyos = (general?.grupos ?? []).map(deNodo);
  const deMesas = mesas.map((a): Contenedor => {
    const hijos = a.grupos.map(deNodo);
    return {
      id: a.mesa.id,
      tipo: "mesa",
      workspaceId: a.mesa.id,
      groupId: "",
      nombre: a.mesa.name,
      propias: a.sueltas,
      hijos,
      ids: [...a.sueltas.map((i) => i.id), ...hijos.flatMap((h) => h.ids)],
    };
  });
  const sueltas = general?.sueltas ?? [];
  return {
    id: GENERAL,
    tipo: "general",
    workspaceId: GENERAL,
    groupId: "",
    nombre: general?.mesa.name ?? "General",
    propias: sueltas,
    hijos: [...suyos, ...deMesas],
    ids: [...sueltas.map((i) => i.id), ...suyos.flatMap((h) => h.ids)],
  };
}

const medida = (c: Contenedor) => {
  const w = tamanoPiso(c.ids.length);
  return { w, h: 0.8 * w };
};

// Grilla de 2 columnas centrada en (cx, cy); la última fila impar va al centro.
function grilla(
  hijos: Contenedor[],
  cx: number,
  cy: number,
): Map<string, Rect> {
  const out = new Map<string, Rect>();
  if (!hijos.length) return out;
  const tam = hijos.map(medida);
  const cw = Math.max(...tam.map((t) => t.w)) + HUECO_GRILLA,
    ch = Math.max(...tam.map((t) => t.h)) + HUECO_GRILLA;
  const filas = Math.ceil(hijos.length / 2);
  hijos.forEach((c, k) => {
    const fila = Math.floor(k / 2);
    const sola = k === hijos.length - 1 && k % 2 === 0;
    const x = cx + (sola ? 0 : (k % 2) - 0.5) * cw;
    const y = cy + (fila - (filas - 1) / 2) * ch;
    out.set(c.id, { x: x - tam[k].w / 2, y: y - tam[k].h / 2, ...tam[k] });
  });
  return out;
}

// Cubitos en grilla de 56 (48 + 8) ordenados por x; si no caben, la grilla se
// achica pareja hasta caber.
function cubitos(
  items: Item[],
  r: Rect,
  estado: (i: Item) => Estado,
  now: number,
): Cubito[] {
  const ancho = r.w - 2 * BORDE + 8,
    alto = r.h - 2 * BORDE - ETIQUETA + 8;
  let celda = CELDA;
  while (
    celda > 14 &&
    Math.floor(ancho / celda) * Math.floor(alto / celda) < items.length
  )
    celda -= 2;
  const cols = Math.max(1, Math.floor(ancho / celda));
  return items.map((i, k) => ({
    id: i.id,
    x: r.x + BORDE + (k % cols) * celda,
    y: r.y + BORDE + Math.floor(k / cols) * celda,
    lado: celda - 8,
    alto: altoCubito(cargaDe(i, now)),
    estado: estado(i),
  }));
}

export function acomodoMesas(
  d: AppData,
  f: Foco,
  v: Ventana,
  now: number,
): { pisos: Piso[]; cables: Cable[] } {
  const porId = new Map(d.items.map((i) => [i.id, i]));
  const estado = (i: Item) => estadoDe(i, d, v, now);
  const estadoId = (id: string) => estado(porId.get(id)!);
  // Cadena del foco: General → mesa → grupos. Si algo ya no existe (otro
  // dispositivo lo borró), se queda en lo último que sí existe.
  const cadena = [raiz(d)];
  for (const id of [
    ...(f.workspaceId === GENERAL ? [] : [f.workspaceId]),
    ...f.ruta,
  ]) {
    const sig = cadena.at(-1)!.hijos.find((h) => h.id === id);
    if (!sig) break;
    cadena.push(sig);
  }
  const lugares: Rect[] = [];
  const g = medida(cadena[0]);
  lugares.push({ x: -g.w / 2, y: -g.h / 2, ...g });
  for (let k = 1; k < cadena.length; k++) {
    const p = lugares[k - 1];
    lugares.push(
      grilla(cadena[k - 1].hijos, p.x + p.w / 2, p.y + p.h / 2).get(
        cadena[k].id,
      )!,
    );
  }
  const nivel = cadena.length - 1;
  const foco = cadena[nivel];
  const pisoDe = (
    c: Contenedor,
    r: Rect,
    n: number,
    extra: Partial<Piso>,
  ): Piso => ({
    id: c.id,
    tipo: c.tipo,
    workspaceId: c.workspaceId,
    groupId: c.groupId,
    nombre: c.nombre,
    total: c.ids.length,
    ...r,
    z: zDe(n),
    grosor: grosorPiso(
      cargaDeContenedor(
        d,
        { workspaceId: c.workspaceId, groupId: c.groupId },
        now,
      ),
      c.tipo,
    ),
    vidrio: false,
    cubitos: [],
    puntos: [],
    ...extra,
  });
  const conPuntos = (c: Contenedor, r: Rect, n: number) =>
    pisoDe(c, r, n, {
      puntos: puntosEn(
        c.ids,
        {
          x: r.x + BORDE,
          y: r.y + BORDE,
          w: r.w - 2 * BORDE,
          h: r.h - 2 * BORDE - ETIQUETA / 2,
        },
        estadoId,
      ),
    });

  const pisos: Piso[] = [];
  for (let k = 0; k < nivel; k++)
    pisos.push(pisoDe(cadena[k], lugares[k], k, { vidrio: true }));
  pisos.push(
    pisoDe(foco, lugares[nivel], nivel, {
      cubitos: cubitos(foco.propias, lugares[nivel], estado, now),
    }),
  );

  // Hermanas del foco: vidrio, salvo las conectadas con algo del foco.
  const vecinas = new Set(
    foco.ids.flatMap((id) => {
      const c = conexiones(d, id);
      return [...c.requisitos, ...c.dependientes].map((i) => i.id);
    }),
  );
  const pares: [string, string][] = [];
  if (nivel > 0) {
    const p = lugares[nivel - 1];
    const lugar = grilla(cadena[nivel - 1].hijos, p.x + p.w / 2, p.y + p.h / 2);
    for (const h of cadena[nivel - 1].hijos) {
      if (h.id === foco.id) continue;
      const unidas = h.ids.filter((id) => vecinas.has(id));
      pisos.push(
        unidas.length
          ? conPuntos(h, lugar.get(h.id)!, nivel)
          : pisoDe(h, lugar.get(h.id)!, nivel, { vidrio: true }),
      );
      for (const b of unidas)
        for (const a of foco.ids) {
          const c = conexiones(d, a);
          if ([...c.requisitos, ...c.dependientes].some((i) => i.id === b))
            pares.push([a, b]);
        }
    }
  }
  // Hijas del foco, un nivel más abajo, con sus cosas como puntos.
  const r = lugares[nivel];
  const abajo = grilla(foco.hijos, r.x + r.w / 2, r.y + r.h / 2);
  for (const h of foco.hijos)
    pisos.push(conPuntos(h, abajo.get(h.id)!, nivel + 1));

  // Cables: de la cosa del foco (cubito o punto) a la de la mesa conectada.
  const donde = new Map<string, Punto3>();
  for (const p of pisos) {
    for (const c of p.cubitos)
      donde.set(c.id, {
        x: c.x + c.lado / 2,
        y: c.y + c.lado / 2,
        z: p.z + c.alto,
      });
    for (const q of p.puntos)
      if (!donde.has(q.id)) donde.set(q.id, { x: q.x, y: q.y, z: p.z });
  }
  const cables = pares
    .filter(([a, b]) => donde.has(a) && donde.has(b))
    .map(([a, b]) => ({ desde: donde.get(a)!, hasta: donde.get(b)! }));
  return { pisos, cables };
}

// Contorno en pantalla de una caja (8 esquinas proyectadas, envolvente convexa).
function contorno(r: Rect, z0: number, z1: number, c: Camara) {
  const ps = [r.x, r.x + r.w]
    .flatMap((x) =>
      [r.y, r.y + r.h].flatMap((y) =>
        [z0, z1].map((z) => proyectar({ x, y, z }, c)),
      ),
    )
    .sort((a, b) => a.x - b.x || a.y - b.y);
  const cruz = (o: Pt, a: Pt, b: Pt) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  type Pt = { x: number; y: number };
  const mitad = (lista: Pt[]) => {
    const h: Pt[] = [];
    for (const p of lista) {
      while (h.length >= 2 && cruz(h[h.length - 2], h[h.length - 1], p) <= 0)
        h.pop();
      h.push(p);
    }
    return h.slice(0, -1);
  };
  const casco = [...mitad(ps), ...mitad([...ps].reverse())];
  const profundidad = Math.max(...ps.map((p) => p.profundidad));
  const dentro = (x: number, y: number) =>
    casco.length > 2 &&
    casco.every(
      (p, k) => cruz(p, casco[(k + 1) % casco.length], { x, y }) >= 0,
    );
  return { dentro, profundidad };
}

// Qué se tocó: primero los cubitos y después los pisos, del más cercano al
// más lejano.
export function elegir(
  pisos: Piso[],
  c: Camara,
  x: number,
  y: number,
): { tipo: "piso" | "cubito"; id: string } | null {
  const cubos = pisos.flatMap((p) =>
    p.cubitos.map((q) => ({
      id: q.id,
      forma: contorno(
        { x: q.x, y: q.y, w: q.lado, h: q.lado },
        p.z,
        p.z + q.alto,
        c,
      ),
    })),
  );
  const planos = pisos.map((p) => ({
    id: p.id,
    forma: contorno(p, p.z - p.grosor, p.z, c),
  }));
  for (const [tipo, lista] of [
    ["cubito", cubos],
    ["piso", planos],
  ] as const) {
    const tocado = lista
      .filter((e) => e.forma.dentro(x, y))
      .sort((a, b) => b.forma.profundidad - a.forma.profundidad)[0];
    if (tocado) return { tipo, id: tocado.id };
  }
  return null;
}
