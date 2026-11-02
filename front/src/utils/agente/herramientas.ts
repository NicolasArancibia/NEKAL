import {
  AppData,
  Group,
  Item,
  ItemType,
  Priority,
  REPEATS,
  Repeat,
  TYPES,
  localDay,
  newGroup,
  newItem,
  parseDateInput,
  uid,
} from "../model";
import { GENERAL } from "../estructura";
import { moverAFecha, timedItems } from "../espacio";
import { buscarHueco, correrDesde } from "../planner";
import { COLORES_MESA } from "../colores";
import { PasoPlan, choquesDelPlan, probar } from "./plan";
import { corto, fechaHora, hora, linea } from "./contexto";
import type { Declaracion, Llamada } from "./tipos";

// Las herramientas de Neka (spec D §4). Las de mirar devuelven un resultado;
// las que cambian devuelven pasos que se prueban sobre una copia y no se
// aplican hasta que la persona acepta.
export type Efecto = { resultado: Record<string, unknown>; pasos: PasoPlan[] };
type Args = Record<string, unknown>;
type Ctx = { d: AppData; actual: AppData; now: number };

const HORA = 9; // hora por defecto al llevar algo sin hora a un día (como el Espacio)
const FECHA_HORA = "Fecha y hora local con formato AAAA-MM-DD HH:mm.";
const cadena = (description: string, extra: object = {}) => ({
  type: "string",
  description,
  ...extra,
});
const entero = (description: string) => ({ type: "integer", description });
const ids = (description: string) => ({
  type: "array",
  items: { type: "string" },
  description,
});
const objeto = (
  properties: Record<string, unknown>,
  required: string[] = [],
): Declaracion["parameters"] => ({ type: "object", properties, required });

export const DECLARACIONES: Declaracion[] = [
  {
    name: "buscar",
    description:
      "Busca cosas por título y/o rango de días, también fuera de los 14 días del contexto. No cambia nada.",
    parameters: objeto({
      texto: cadena("Parte del título."),
      desde: cadena("Día AAAA-MM-DD."),
      hasta: cadena("Día AAAA-MM-DD."),
    }),
  },
  {
    name: "buscarHueco",
    description:
      "Primer hueco libre dentro de la jornada para una cosa (por id) o para una duración. No cambia nada.",
    parameters: objeto({
      id: cadena("Id de la cosa a acomodar."),
      duracion: entero("Minutos, si no hay id."),
      desde: cadena(FECHA_HORA),
      hasta: cadena(FECHA_HORA),
    }),
  },
  {
    name: "crear",
    description: "Propone crear una cosa nueva.",
    parameters: objeto(
      {
        tipo: cadena("Tipo de cosa.", { enum: [...TYPES] }),
        titulo: cadena("Título corto."),
        inicio: cadena(`Cuándo se hace. ${FECHA_HORA}`),
        plazo: cadena(`Fecha límite. ${FECHA_HORA}`),
        duracion: entero("Minutos (30 si no se sabe)."),
        mesa: cadena("Id o nombre de la mesa (General si no se dice)."),
        grupo: cadena("Id o nombre del grupo, dentro de esa mesa."),
        fija: { type: "boolean", description: "true si no se puede mover." },
      },
      ["tipo", "titulo"],
    ),
  },
  {
    name: "editar",
    description: "Propone cambiar datos de una cosa (no su fecha ni su lugar).",
    parameters: objeto(
      {
        id: cadena("Id de la cosa."),
        titulo: cadena("Título nuevo."),
        descripcion: cadena("Descripción nueva."),
        prioridad: cadena("Prioridad.", { enum: ["baja", "media", "urgente"] }),
        dificultad: entero("1, 2 o 3."),
        duracion: entero("Minutos."),
        pasos: ids("Lista nueva de pasos (reemplaza la anterior)."),
      },
      ["id"],
    ),
  },
  {
    name: "mover",
    description:
      "Propone otra hora (inicio), otro día conservando la hora (dia) o dejarla sin fecha (sinFecha).",
    parameters: objeto(
      {
        id: cadena("Id de la cosa."),
        inicio: cadena(FECHA_HORA),
        dia: cadena("Día AAAA-MM-DD."),
        sinFecha: {
          type: "boolean",
          description: "true para quitarle la fecha.",
        },
      },
      ["id"],
    ),
  },
  {
    name: "correrDesde",
    description:
      "Para «voy atrasado»: corre lo flexible de hoy que viene después, sin mover lo fijo. Devuelve lo que no cabe hoy.",
    parameters: objeto(
      {
        minutos: entero("Cuántos minutos de atraso."),
        desde: cadena(`Desde cuándo (ahora si no se dice). ${FECHA_HORA}`),
      },
      ["minutos"],
    ),
  },
  {
    name: "completar",
    description: "Propone marcar una cosa como hecha.",
    parameters: objeto({ id: cadena("Id de la cosa.") }, ["id"]),
  },
  {
    name: "borrar",
    description: "Propone mandar una cosa a la papelera.",
    parameters: objeto({ id: cadena("Id de la cosa.") }, ["id"]),
  },
  {
    name: "moverA",
    description: "Propone llevar cosas a otra mesa o grupo.",
    parameters: objeto(
      {
        ids: ids("Ids de las cosas."),
        mesa: cadena("Id o nombre de la mesa."),
        grupo: cadena("Id o nombre del grupo (opcional)."),
      },
      ["ids", "mesa"],
    ),
  },
  {
    name: "juntarEnGrupo",
    description: "Propone un grupo nuevo con esas cosas (de una misma mesa).",
    parameters: objeto(
      { ids: ids("Ids de las cosas."), nombre: cadena("Nombre del grupo.") },
      ["ids", "nombre"],
    ),
  },
  {
    name: "crearGrupo",
    description: "Propone un grupo o una rutina (un grupo que se repite).",
    parameters: objeto(
      {
        nombre: cadena("Nombre."),
        mesa: cadena("Id o nombre de la mesa."),
        padre: cadena("Id o nombre del grupo que lo contiene (opcional)."),
        repetir: cadena("Repetición; se omite si no se repite.", {
          enum: REPEATS.filter((r) => r),
        }),
        dias: {
          type: "array",
          items: { type: "integer" },
          description: "Con repetir «dias»: 0 domingo … 6 sábado.",
        },
      },
      ["nombre", "mesa"],
    ),
  },
  {
    name: "crearMesa",
    description: "Propone una mesa nueva dentro de General.",
    parameters: objeto({ nombre: cadena("Nombre.") }, ["nombre"]),
  },
];

const noEntendi = () => new Error("No entendí ese pedido.");
function texto(a: Args, k: string): string {
  const v = a[k];
  if (typeof v !== "string" || !v.trim()) throw noEntendi();
  return v.trim();
}
function opcional(a: Args, k: string): string | undefined {
  const v = a[k];
  if (v === undefined || v === null || v === "") return undefined;
  if (typeof v !== "string") throw noEntendi();
  return v.trim();
}
function numero(a: Args, k: string): number | undefined {
  const v = a[k];
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) throw noEntendi();
  return n;
}
function lista(a: Args, k: string): string[] {
  const v = a[k];
  if (!Array.isArray(v) || !v.length || v.some((x) => typeof x !== "string"))
    throw noEntendi();
  return v as string[];
}
const msDe = (s: string) => Date.parse(parseDateInput(s));
const sinTildes = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const igual = (a: string, b: string) =>
  sinTildes(a.trim()) === sinTildes(b.trim());

function viva(d: AppData, id: string): Item {
  const i = d.items.find((x) => x.id === id && !x.deletedAt);
  if (!i) throw new Error("Esa cosa ya no existe.");
  return i;
}
function mesaDe(d: AppData, ref = GENERAL) {
  const w = d.workspaces.find((x) => x.id === ref || igual(x.name, ref));
  if (!w) throw new Error(`No encontré la mesa «${ref}».`);
  return w;
}
function grupoDe(d: AppData, ref: string, mesa?: string): Group {
  const g = d.groups.find(
    (x) =>
      (x.id === ref || igual(x.name, ref)) && (!mesa || x.workspaceId === mesa),
  );
  if (!g) throw new Error(`No encontré el grupo «${ref}».`);
  return g;
}
// Las cosas que ya existían antes del plan, con el `updatedAt` que tenían.
const toca = (c: Ctx, ...lista: string[]) =>
  Object.fromEntries(
    lista.flatMap((id) => {
      const i = c.d.items.find((x) => x.id === id);
      return i ? [[id, i.updatedAt]] : [];
    }),
  );
const ahora = (c: Ctx) => new Date(c.now).toISOString();

function pasoMover(
  c: Ctx,
  i: Item,
  nuevo: Pick<Item, "scheduledAt" | "dueAt" | "startDate">,
): PasoPlan {
  const antes = i.scheduledAt || i.dueAt,
    despues = nuevo.scheduledAt || nuevo.dueAt;
  const textoPaso = !despues
    ? `«${i.title}» sin fecha`
    : antes && localDay(new Date(antes)) === localDay(new Date(despues))
      ? `${i.title} ${hora(antes)} → ${hora(despues)}`
      : `${i.title} ${antes ? corto(antes) : "sin fecha"} → ${corto(despues)}`;
  return {
    tipo: "mover",
    id: i.id,
    ...nuevo,
    texto: textoPaso,
    toca: toca(c, i.id),
    eraFija: !i.flexible,
  };
}
const resumen = (pasos: PasoPlan[]): Efecto => ({
  resultado: { ok: true, pasos: pasos.map((p) => p.texto) },
  pasos,
});

const EJECUTORES: Record<string, (c: Ctx, a: Args) => Efecto> = {
  buscar(c, a) {
    const t = opcional(a, "texto"),
      desde = opcional(a, "desde"),
      hasta = opcional(a, "hasta");
    const d0 = desde ? msDe(desde) : -Infinity,
      d1 = hasta ? msDe(hasta) + 86400000 : Infinity;
    const cosas = timedItems(c.actual).filter((i) => {
      const f = i.scheduledAt || i.dueAt;
      if (t && !sinTildes(i.title).includes(sinTildes(t))) return false;
      if ((desde || hasta) && (!f || Date.parse(f) < d0 || Date.parse(f) >= d1))
        return false;
      return true;
    });
    return {
      resultado: {
        total: cosas.length,
        cosas: cosas.slice(0, 20).map((i) => linea(c.actual, i)),
      },
      pasos: [],
    };
  },
  buscarHueco(c, a) {
    const id = opcional(a, "id");
    const cosa = id ? viva(c.actual, id) : undefined;
    const duracion = cosa ? cosa.duration : numero(a, "duracion");
    if (!duracion) throw noEntendi();
    const desde = opcional(a, "desde"),
      hasta = opcional(a, "hasta");
    const r = buscarHueco(
      c.actual,
      {
        duracion,
        desde: desde ? msDe(desde) : undefined,
        // Sin tope, el hueco de una cosa con plazo llega hasta su plazo.
        hasta: hasta
          ? msDe(hasta)
          : cosa?.dueAt
            ? Date.parse(cosa.dueAt)
            : undefined,
        ignorar: id,
      },
      c.now,
    );
    return {
      resultado: r
        ? { inicio: fechaHora(Date.parse(r)) }
        : { inicio: null, nota: "No hay hueco en los próximos 30 días." },
      pasos: [],
    };
  },
  crear(c, a) {
    const tipo = TYPES.find((x) => igual(x, texto(a, "tipo"))) as
      ItemType | undefined;
    if (!tipo) throw noEntendi();
    const w = mesaDe(c.actual, opcional(a, "mesa"));
    const grupo = opcional(a, "grupo");
    const g = grupo ? grupoDe(c.actual, grupo, w.id) : undefined;
    const inicio = opcional(a, "inicio"),
      plazo = opcional(a, "plazo"),
      fija = a.fija;
    const base = newItem(w.id, tipo);
    const scheduledAt = inicio ? parseDateInput(inicio) : "",
      dueAt = plazo ? parseDateInput(plazo) : "";
    const hoy = localDay(new Date(c.now)),
      fecha = scheduledAt || dueAt,
      dia = fecha ? localDay(new Date(fecha)) : hoy;
    const item: Item = {
      ...base,
      id: uid(),
      title: texto(a, "titulo"),
      scheduledAt,
      dueAt,
      duration: numero(a, "duracion") ?? 30,
      groupId: g?.id ?? "",
      startDate: dia < hoy ? dia : hoy,
      createdAt: ahora(c),
      updatedAt: ahora(c),
      flexible: typeof fija === "boolean" ? !fija : base.flexible,
    };
    return resumen([
      {
        tipo: "crear",
        item,
        texto: `Crear ${tipo.toLowerCase()} «${item.title}»${fecha ? ` · ${corto(fecha)}` : ""}`,
        toca: {},
      },
    ]);
  },
  editar(c, a) {
    const i = viva(c.actual, texto(a, "id"));
    const cambios: Partial<Item> = {};
    const titulo = opcional(a, "titulo"),
      descripcion = opcional(a, "descripcion"),
      prioridad = opcional(a, "prioridad"),
      dificultad = numero(a, "dificultad"),
      duracion = numero(a, "duracion");
    if (titulo) cambios.title = titulo;
    if (descripcion !== undefined) cambios.description = descripcion;
    if (prioridad) {
      if (!["baja", "media", "urgente"].includes(prioridad)) throw noEntendi();
      cambios.priority = prioridad as Priority;
    }
    if (dificultad !== undefined) {
      if (![1, 2, 3].includes(dificultad)) throw noEntendi();
      cambios.difficulty = dificultad as 1 | 2 | 3;
    }
    if (duracion !== undefined) cambios.duration = duracion;
    if (a.pasos !== undefined)
      cambios.steps = lista(a, "pasos").map((title) => ({
        id: uid(),
        title,
        done: false,
      }));
    if (!Object.keys(cambios).length) throw noEntendi();
    return resumen([
      {
        tipo: "editar",
        id: i.id,
        cambios,
        texto: `Editar «${i.title}»`,
        toca: toca(c, i.id),
      },
    ]);
  },
  mover(c, a) {
    const i = viva(c.actual, texto(a, "id"));
    const inicio = opcional(a, "inicio"),
      dia = opcional(a, "dia");
    let nuevo: Item;
    if (a.sinFecha === true) nuevo = moverAFecha(i, "", HORA);
    else if (inicio) {
      const s = parseDateInput(inicio),
        d = localDay(new Date(s));
      nuevo = {
        ...i,
        scheduledAt: s,
        startDate: d < i.startDate ? d : i.startDate,
      };
    } else if (dia && /^\d{4}-\d{2}-\d{2}$/.test(dia))
      nuevo = moverAFecha(i, dia, HORA);
    else throw noEntendi();
    return resumen([pasoMover(c, i, nuevo)]);
  },
  correrDesde(c, a) {
    const minutos = numero(a, "minutos");
    if (minutos === undefined) throw noEntendi();
    const desde = opcional(a, "desde");
    const r = correrDesde(c.actual, minutos, desde ? msDe(desde) : c.now);
    const pasos = r
      .filter((x) => !x.noCabe)
      .map((x) => {
        const i = viva(c.actual, x.itemId);
        const paso = pasoMover(c, i, {
          scheduledAt: x.despues,
          dueAt: i.dueAt,
          startDate: i.startDate,
        });
        return x.salta
          ? {
              ...paso,
              texto: `${paso.texto} (salta «${viva(c.actual, x.salta).title}», que es fija)`,
            }
          : paso;
      });
    // Lo que no cabe hoy trae su primer hueco desde mañana (antes de su plazo).
    const manana = new Date(desde ? msDe(desde) : c.now);
    manana.setHours(24, 0, 0, 0);
    const alternativa = (i: Item) => {
      const hueco = buscarHueco(
        c.actual,
        {
          duracion: i.duration,
          desde: manana.getTime(),
          hasta: i.dueAt ? Date.parse(i.dueAt) : undefined,
          ignorar: i.id,
        },
        c.now,
      );
      return hueco ? fechaHora(Date.parse(hueco)) : null;
    };
    return {
      resultado: {
        corridas: pasos.map((p) => p.texto),
        noCaben: r
          .filter((x) => x.noCabe)
          .map((x) => {
            const i = viva(c.actual, x.itemId);
            return { id: i.id, titulo: i.title, alternativa: alternativa(i) };
          }),
      },
      pasos,
    };
  },
  completar(c, a) {
    const i = viva(c.actual, texto(a, "id"));
    return resumen([
      {
        tipo: "completar",
        id: i.id,
        texto: `Completar «${i.title}»`,
        toca: toca(c, i.id),
      },
    ]);
  },
  borrar(c, a) {
    const i = viva(c.actual, texto(a, "id"));
    return resumen([
      {
        tipo: "borrar",
        id: i.id,
        texto: `Borrar «${i.title}» (a la papelera)`,
        toca: toca(c, i.id),
      },
    ]);
  },
  moverA(c, a) {
    const cosas = lista(a, "ids").map((id) => viva(c.actual, id));
    const w = mesaDe(c.actual, texto(a, "mesa"));
    const grupo = opcional(a, "grupo");
    const g = grupo ? grupoDe(c.actual, grupo, w.id) : undefined;
    const destino = g ? `${w.name} / ${g.name}` : w.name;
    return resumen([
      {
        tipo: "moverA",
        ids: cosas.map((i) => i.id),
        destino: { workspaceId: w.id, groupId: g?.id ?? "" },
        texto:
          cosas.length === 1
            ? `Mover «${cosas[0].title}» a ${destino}`
            : `Mover ${cosas.length} cosas a ${destino}`,
        toca: toca(c, ...cosas.map((i) => i.id)),
      },
    ]);
  },
  juntarEnGrupo(c, a) {
    const cosas = lista(a, "ids").map((id) => viva(c.actual, id));
    const mesa = cosas[0].workspaceId;
    if (cosas.some((i) => i.workspaceId !== mesa))
      throw new Error("Elige cosas de una misma mesa.");
    const padre = cosas.every((i) => i.groupId === cosas[0].groupId)
      ? cosas[0].groupId
      : "";
    const grupo = {
      ...newGroup(texto(a, "nombre"), mesa, { parentId: padre }),
      id: uid(),
    };
    return resumen([
      {
        tipo: "crearGrupo",
        grupo,
        texto: `Nuevo grupo «${grupo.name}»`,
        toca: {},
      },
      {
        tipo: "moverA",
        ids: cosas.map((i) => i.id),
        destino: { workspaceId: mesa, groupId: grupo.id },
        texto: `Mover ${cosas.length === 1 ? `«${cosas[0].title}»` : `${cosas.length} cosas`} a «${grupo.name}»`,
        toca: toca(c, ...cosas.map((i) => i.id)),
      },
    ]);
  },
  crearGrupo(c, a) {
    const w = mesaDe(c.actual, texto(a, "mesa"));
    const padre = opcional(a, "padre");
    const repeat = (opcional(a, "repetir") ?? "") as Repeat;
    if (!REPEATS.includes(repeat)) throw noEntendi();
    if (a.dias !== undefined && !Array.isArray(a.dias)) throw noEntendi();
    const dias = ((a.dias ?? []) as unknown[]).map(Number);
    if (dias.some((n) => !Number.isInteger(n) || n < 0 || n > 6))
      throw noEntendi();
    const grupo = {
      ...newGroup(texto(a, "nombre"), w.id, {
        parentId: padre ? grupoDe(c.actual, padre, w.id).id : "",
        repeat,
        repeatDays: repeat === "dias" ? dias : [],
        repeatStart: repeat ? localDay(new Date(c.now)) : "",
      }),
      id: uid(),
    };
    return resumen([
      {
        tipo: "crearGrupo",
        grupo,
        texto: repeat
          ? `Nueva rutina «${grupo.name}» (${repeat})`
          : `Nuevo grupo «${grupo.name}»`,
        toca: {},
      },
    ]);
  },
  crearMesa(c, a) {
    const mesa = {
      id: uid(),
      name: texto(a, "nombre"),
      color: COLORES_MESA[c.actual.workspaces.length % COLORES_MESA.length],
    };
    return resumen([
      { tipo: "crearMesa", mesa, texto: `Nueva mesa «${mesa.name}»`, toca: {} },
    ]);
  },
};
export const ACEPTA = Object.keys(EJECUTORES);

export function ejecutar(
  d: AppData,
  previos: PasoPlan[],
  l: Llamada,
  now: number,
): Efecto {
  const f = EJECUTORES[l.nombre];
  if (!f) return { resultado: { error: noEntendi().message }, pasos: [] };
  try {
    const todos = (n: number) => Array.from({ length: n }, () => true);
    const actual = probar(d, previos, todos(previos.length), now).data;
    const e = f({ d, actual, now }, l.args ?? {});
    if (!e.pasos.length) return e;
    const juntos = [...previos, ...e.pasos];
    const error = probar(d, juntos, todos(juntos.length), now)
      .errores.slice(previos.length)
      .find((x) => x);
    if (error) return { resultado: { error }, pasos: [] };
    // Lo que choca se le devuelve a Neka para que busque otro hueco (spec H1).
    const bloquean = (ps: PasoPlan[]) =>
      choquesDelPlan(d, ps, todos(ps.length), now).filter((c) => c.bloquea);
    const habia = new Set(bloquean(previos).map((c) => c.clave));
    const choque = bloquean(juntos).find((c) => !habia.has(c.clave));
    return choque
      ? {
          resultado: {
            error: `Choca: ${choque.descripcion} Busca otro hueco con buscarHueco; si es por lo que no cabe hoy, llévalo antes a otro día.`,
          },
          pasos: [],
        }
      : e;
  } catch (err) {
    return { resultado: { error: (err as Error).message }, pasos: [] };
  }
}
