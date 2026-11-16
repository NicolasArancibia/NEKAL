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
  fuera: AccionFuera[];
};
export type ResultadoFuera =
  | { itemId: string; ok: true; origen: Origen | null }
  | { itemId: string; ok: false; error: "pase" | "red" | "otro" };

export const firmaDeItem = (i: Item) =>
  firmaDe({ ...i, diaCompleto: !!i.origen?.diaCompleto });

const deLaCuenta = (i: Item, c: Cuenta) =>
  !!i.origen &&
  i.origen.proveedor === c.proveedor &&
  i.origen.cuenta === c.correo;

function enVentanaDe(ahora: number) {
  const { desde, hasta } = limitesVentana(ahora);
  return (fecha: string) =>
    !!fecha &&
    Date.parse(fecha) >= Date.parse(desde) &&
    Date.parse(fecha) < Date.parse(hasta);
}

// Lo propio que se copia al calendario «Nekal»: con hora, no rutina, no Nota/Idea, en ventana.
function copiables(d: AppData, ahora: number): Item[] {
  const rutinas = new Set(d.groups.filter((g) => g.repeat).map((g) => g.id));
  const enVentana = enVentanaDe(ahora);
  return d.items.filter(
    (i) =>
      !i.origen &&
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
  const propios = data.items.filter((i) => deLaCuenta(i, cuenta));
  const conocidos = new Set(propios.map((i) => i.origen!.idExterno));
  const p: PlanEspejo = {
    crearEnNekal: [],
    actualizarEnNekal: [],
    vincular: [],
    aPapelera: [],
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
              !i.origen &&
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

  for (const i of propios) {
    const origen = i.origen!;
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
    for (const i of copiables(data, o.ahora))
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
  const cambios = new Map<string, (i: Item) => Item>();
  for (const { itemId, evento } of p.actualizarEnNekal)
    cambios.set(itemId, (i) => {
      const nuevo = { ...i, ...camposDeEvento(evento) };
      const origen = origenDe(cuenta, evento, i.origen!.creadoEn, "");
      return {
        ...nuevo,
        origen: { ...origen, firma: firmaDeItem({ ...nuevo, origen }) },
      };
    });
  for (const { itemId, evento } of p.vincular)
    cambios.set(itemId, (i) => {
      const origen = origenDe(cuenta, evento, "nekal", "");
      return {
        ...i,
        origen: { ...origen, firma: firmaDeItem({ ...i, origen }) },
      };
    });
  for (const id of p.aPapelera)
    cambios.set(id, (i) => ({ ...i, deletedAt: cuando }));

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

export function aplicarResultados(d: AppData, r: ResultadoFuera[]): AppData {
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
      const origen = listos.get(i.id);
      if (origen) return { ...i, origen };
      const { origen: _, ...sinOrigen } = i;
      return sinOrigen;
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
  const conOrigen = d.items.some((i) => {
    if (!i.origen) return false;
    if (!claves.has(`${i.origen.proveedor}:${i.origen.cuenta}`)) return false;
    if (i.deletedAt) return !i.origen.soloLectura;
    return firmaDeItem(i) !== i.origen.firma;
  });
  return (
    conOrigen ||
    (!!conexiones.destinoNekal &&
      claves.has(conexiones.destinoNekal) &&
      copiables(d, ahora).length > 0)
  );
}
