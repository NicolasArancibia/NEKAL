import { AppData, Item, newItem, passive } from "../model";
import { claveCuenta } from "./estado";
import {
  camposDeEvento,
  EventoFuera,
  firmaDe,
  limitesVentana,
} from "./eventos";
import type { Conexiones, Cuenta, Origen } from "./tipos";

// El espejo del calendario (spec H3 §7): qué cambiar a cada lado. Puro.
// Cambio local = la firma de los campos espejados ≠ `origen.firma` (sirve también
// para lo que Neka mueve sin tocar `updatedAt`); cambio afuera = otra `version`.
export type AccionFuera =
  | { tipo: "crear"; itemId: string; cuerpo: Item }
  | { tipo: "actualizar"; itemId: string; origen: Origen; cuerpo: Item }
  | { tipo: "borrar"; itemId: string; origen: Origen };
export type PlanEspejo = {
  crearEnNekal: EventoFuera[];
  actualizarEnNekal: { itemId: string; evento: EventoFuera }[];
  vincular: { itemId: string; evento: EventoFuera }[];
  aPapelera: string[];
  // Ítems repetidos del mismo evento (dos dispositivos lo importaron a la vez).
  duplicados: string[];
  fuera: AccionFuera[];
};
export type ResultadoFuera =
  | { itemId: string; ok: true; origen: Origen | null }
  | { itemId: string; ok: false; error: "pase" | "red" | "otro" };

export const firmaDeItem = (i: Item) =>
  firmaDe({ ...i, diaCompleto: !!i.origen?.diaCompleto });

// Un ítem se enlaza con a lo más un evento por cuenta: `origen` (lo importado,
// o la primera copia) y `copias` (lo creado en Nekal copiado a más cuentas).
export const enlaces = (i: Item): Origen[] => [
  ...(i.origen ? [i.origen] : []),
  ...(i.copias ?? []),
];
const claveEnlace = (o: Origen) => `${o.proveedor}:${o.cuenta}`;
const enlaceDe = (i: Item, clave: string) =>
  enlaces(i).find((o) => claveEnlace(o) === clave);
const importado = (i: Item) => i.origen?.creadoEn === "fuera";

// Pone, cambia o quita (`null`) el enlace de una cuenta sin tocar los demás.
function ponerEnlace(i: Item, clave: string, nuevo: Origen | null): Item {
  const { origen: _o, copias: _c, ...resto } = i;
  const lista = enlaces(i);
  const pos = lista.findIndex((o) => claveEnlace(o) === clave);
  if (pos >= 0) lista.splice(pos, 1, ...(nuevo ? [nuevo] : []));
  else if (nuevo) lista.push(nuevo);
  const [primero, ...demas] = lista;
  return {
    ...resto,
    ...(primero && { origen: primero }),
    ...(demas.length > 0 && { copias: demas }),
  };
}

function enVentanaDe(ahora: number) {
  const { desde, hasta } = limitesVentana(ahora);
  return (fecha: string) =>
    !!fecha &&
    Date.parse(fecha) >= Date.parse(desde) &&
    Date.parse(fecha) < Date.parse(hasta);
}

// Lo propio que se copia al calendario «Nekal» de una cuenta: con hora, no
// rutina, no Nota/Idea, en ventana y sin copia en esa cuenta todavía.
function copiables(d: AppData, ahora: number, clave: string): Item[] {
  const rutinas = new Set(d.groups.filter((g) => g.repeat).map((g) => g.id));
  const enVentana = enVentanaDe(ahora);
  return d.items.filter(
    (i) =>
      !importado(i) &&
      !enlaceDe(i, clave) &&
      !i.deletedAt &&
      !!i.scheduledAt &&
      !passive(i) &&
      !rutinas.has(i.groupId) &&
      enVentana(i.scheduledAt),
  );
}

export function planDeSincronizacion(o: {
  data: AppData;
  eventos: EventoFuera[];
  cuenta: Cuenta;
  calendarioNekal: string | null;
  copiarAqui: boolean;
  ahora: number;
}): PlanEspejo {
  const { data, cuenta } = o;
  const enVentana = enVentanaDe(o.ahora);
  const vivos = new Map(
    o.eventos.filter((e) => !e.cancelado).map((e) => [e.id, e]),
  );
  const clave = claveCuenta(cuenta);
  const propios = data.items.filter((i) => enlaceDe(i, clave));
  const conocidos = new Set(propios.map((i) => enlaceDe(i, clave)!.idExterno));
  const p: PlanEspejo = {
    crearEnNekal: [],
    actualizarEnNekal: [],
    vincular: [],
    aPapelera: [],
    duplicados: [],
    fuera: [],
  };

  // Eventos nuevos: o son la copia de algo de Nekal (calendario «Nekal»), o se importan.
  const usados = new Set<string>();
  for (const e of vivos.values()) {
    if (conocidos.has(e.id)) continue;
    const titulo = camposDeEvento(e).title;
    const gemelo =
      e.calendario === o.calendarioNekal
        ? data.items.find(
            (i) =>
              !importado(i) &&
              !enlaceDe(i, clave) &&
              !i.deletedAt &&
              !usados.has(i.id) &&
              i.title === titulo &&
              i.scheduledAt === e.inicio,
          )
        : undefined;
    if (gemelo) {
      usados.add(gemelo.id);
      p.vincular.push({ itemId: gemelo.id, evento: e });
    } else p.crearEnNekal.push(e);
  }

  // Si dos ítems vivos apuntan al mismo evento, queda el más antiguo.
  const primero = new Map<string, Item>();
  for (const i of [...propios].sort((a, b) =>
    a.createdAt === b.createdAt ? (a.id < b.id ? -1 : 1) : a.createdAt < b.createdAt ? -1 : 1,
  )) {
    if (i.deletedAt) continue;
    const id = enlaceDe(i, clave)!.idExterno;
    if (primero.has(id)) p.duplicados.push(i.id);
    else primero.set(id, i);
  }
  const repetidos = new Set(p.duplicados);

  for (const i of propios) {
    if (repetidos.has(i.id)) continue;
    const origen = enlaceDe(i, clave)!;
    if (i.deletedAt) {
      if (!origen.soloLectura)
        p.fuera.push({ tipo: "borrar", itemId: i.id, origen });
      continue;
    }
    const e = vivos.get(origen.idExterno);
    if (!e) {
      if (enVentana(i.scheduledAt)) p.aPapelera.push(i.id);
      continue;
    }
    const cambioLocal = firmaDeItem(i) !== origen.firma;
    const cambioFuera = e.version !== origen.version;
    if (!cambioLocal && !cambioFuera) continue;
    const ganaFuera =
      origen.soloLectura ||
      !cambioLocal ||
      (cambioFuera && Date.parse(e.actualizado) > Date.parse(i.updatedAt));
    if (ganaFuera) p.actualizarEnNekal.push({ itemId: i.id, evento: e });
    else p.fuera.push({ tipo: "actualizar", itemId: i.id, origen, cuerpo: i });
  }

  if (o.copiarAqui)
    for (const i of copiables(data, o.ahora, clave))
      if (!usados.has(i.id))
        p.fuera.push({ tipo: "crear", itemId: i.id, cuerpo: i });
  return p;
}

function origenDe(
  cuenta: Cuenta,
  e: EventoFuera,
  creadoEn: Origen["creadoEn"],
  firma: string,
): Origen {
  return {
    proveedor: cuenta.proveedor,
    cuenta: cuenta.correo,
    calendario: e.calendario,
    idExterno: e.id,
    version: e.version,
    firma,
    creadoEn,
    diaCompleto: e.diaCompleto,
    soloLectura: e.soloLectura,
  };
}

// Lo de afuera no es un cambio local: no se toca `updatedAt`.
export function aplicarEnNekal(
  d: AppData,
  cuenta: Cuenta,
  p: PlanEspejo,
  ahora: number,
): AppData {
  const cuando = new Date(ahora).toISOString();
  const clave = claveCuenta(cuenta);
  // El enlace nuevo guarda la firma del ítem ya con ese enlace puesto.
  const enlazar = (i: Item, o: Origen) =>
    ponerEnlace(i, clave, {
      ...o,
      firma: firmaDeItem(ponerEnlace(i, clave, o)),
    });
  const cambios = new Map<string, (i: Item) => Item>();
  for (const { itemId, evento } of p.actualizarEnNekal)
    cambios.set(itemId, (i) =>
      enlazar(
        { ...i, ...camposDeEvento(evento) },
        origenDe(cuenta, evento, enlaceDe(i, clave)!.creadoEn, ""),
      ),
    );
  for (const { itemId, evento } of p.vincular)
    cambios.set(itemId, (i) =>
      enlazar(i, origenDe(cuenta, evento, "nekal", "")),
    );
  // Lo que ya no está afuera (o está repetido) va a la papelera sin origen:
  // así nunca se pide borrarlo afuera (un calendario oculto no se pierde).
  // Las copias en otras cuentas sí se borran en la próxima pasada (espejo).
  for (const id of [...p.aPapelera, ...p.duplicados])
    cambios.set(id, (i) => ({
      ...ponerEnlace(i, clave, null),
      deletedAt: i.deletedAt || cuando,
    }));

  const nuevos = p.crearEnNekal.map((e) => {
    const base: Item = {
      ...newItem("general", "Evento"),
      ...camposDeEvento(e),
      flexible: false,
      countsForScore: false,
      createdAt: cuando,
      updatedAt: cuando,
    };
    const origen = origenDe(cuenta, e, "fuera", "");
    return {
      ...base,
      origen: { ...origen, firma: firmaDeItem({ ...base, origen }) },
    };
  });
  return {
    ...d,
    items: [...d.items.map((i) => cambios.get(i.id)?.(i) ?? i), ...nuevos],
  };
}

export function aplicarResultados(
  d: AppData,
  cuenta: Cuenta,
  r: ResultadoFuera[],
): AppData {
  const clave = claveCuenta(cuenta);
  const listos = new Map(
    r
      .filter((x) => x.ok)
      .map((x) => [x.itemId, (x as { origen: Origen | null }).origen]),
  );
  if (!listos.size) return d;
  return {
    ...d,
    items: d.items.map((i) => {
      if (!listos.has(i.id)) return i;
      return ponerEnlace(i, clave, listos.get(i.id) ?? null);
    }),
  };
}

// ¿Hay algo de Nekal que enviar afuera? (para sincronizar poco después de un cambio).
export function hayCambiosLocales(
  d: AppData,
  conexiones: Conexiones,
  ahora: number,
): boolean {
  const claves = new Set(conexiones.cuentas.map(claveCuenta));
  const conEnlace = d.items.some((i) =>
    enlaces(i).some((o) => {
      if (!claves.has(claveEnlace(o))) return false;
      if (i.deletedAt) return !o.soloLectura;
      return firmaDeItem(i) !== o.firma;
    }),
  );
  return (
    conEnlace ||
    conexiones.destinos.some(
      (c) => claves.has(c) && copiables(d, ahora, c).length > 0,
    )
  );
}

// Desconectar (spec §8): lo importado de esa cuenta va a la papelera (sigue
// intacto afuera) y lo creado en Nekal pierde el origen y se queda.
export function soltarCuenta(d: AppData, cuenta: Cuenta, ahora: number): AppData {
  const cuando = new Date(ahora).toISOString();
  return {
    ...d,
    items: d.items.map((i) => {
      const o = enlaceDe(i, claveCuenta(cuenta));
      if (!o) return i;
      // Sin ese enlace: al reconectar, nada de esto se borra afuera.
      const propio = ponerEnlace(i, claveCuenta(cuenta), null);
      return o.creadoEn === "fuera"
        ? { ...propio, deletedAt: i.deletedAt || cuando }
        : propio;
    }),
  };
}
