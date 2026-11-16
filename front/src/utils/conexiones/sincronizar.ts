import type { AppData, Item } from "../model";
import {
  aplicarEnNekal,
  aplicarResultados,
  firmaDeItem,
  planDeSincronizacion,
  ResultadoFuera,
} from "./espejo";
import type { EventoFuera } from "./eventos";
import type { CalendarioFuera, Cuenta, Origen } from "./tipos";

// Una pasada del espejo para una cuenta (spec H3 §7). La red se recibe de afuera
// (google.ts / microsoft.ts, o una falsa en las pruebas): este archivo no llama a nadie.
export type RedCalendario = {
  token: (c: Cuenta) => Promise<string | null>;
  leerCalendarios: (token: string) => Promise<CalendarioFuera[]>;
  leerEventos: (
    token: string,
    cals: CalendarioFuera[],
    ahora: number,
  ) => Promise<EventoFuera[]>;
  crearCalendarioNekal: (token: string) => Promise<string>;
  guardar: (
    token: string,
    cal: string,
    i: Item,
    idExterno?: string,
    firmaAnterior?: string,
  ) => Promise<EventoFuera>;
  borrar: (token: string, cal: string, idExterno: string) => Promise<void>;
};
export type ResultadoPasada = "ok" | "pase" | "red";

const esPase = (e: unknown) => (e as Error)?.message === "pase";

export async function sincronizarCuenta(
  cuenta: Cuenta,
  o: {
    leer: () => AppData;
    change: (f: (d: AppData) => AppData) => void;
    red: RedCalendario;
    copiarAqui: boolean;
    ahora: number;
  },
): Promise<ResultadoPasada> {
  const { red, ahora } = o;
  const token = await red.token(cuenta);
  if (!token) return "pase";
  let cals: CalendarioFuera[], eventos: EventoFuera[];
  try {
    cals = await red.leerCalendarios(token);
    eventos = await red.leerEventos(token, cals, ahora);
  } catch (e) {
    return esPase(e) ? "pase" : "red";
  }
  let calNekal = cals.find((c) => c.esNekal)?.id ?? null;
  const plan = planDeSincronizacion({
    data: o.leer(),
    eventos,
    cuenta,
    calendarioNekal: calNekal,
    copiarAqui: o.copiarAqui,
    ahora,
  });
  if (
    plan.crearEnNekal.length ||
    plan.actualizarEnNekal.length ||
    plan.vincular.length ||
    plan.aPapelera.length
  )
    o.change((d) => aplicarEnNekal(d, cuenta, plan, ahora));

  const resultados: ResultadoFuera[] = [];
  let estado: ResultadoPasada = "ok";
  for (const a of plan.fuera) {
    try {
      if (a.tipo === "borrar") {
        await red.borrar(token, a.origen.calendario, a.origen.idExterno);
        resultados.push({ itemId: a.itemId, ok: true, origen: null });
      } else if (a.tipo === "actualizar") {
        const e = await red.guardar(
          token,
          a.origen.calendario,
          a.cuerpo,
          a.origen.idExterno,
          a.origen.firma,
        );
        resultados.push({
          itemId: a.itemId,
          ok: true,
          origen: {
            ...a.origen,
            version: e.version,
            firma: firmaDeItem(a.cuerpo),
          },
        });
      } else {
        if (!calNekal) calNekal = await red.crearCalendarioNekal(token);
        const e = await red.guardar(token, calNekal, a.cuerpo);
        const origen: Origen = {
          proveedor: cuenta.proveedor,
          cuenta: cuenta.correo,
          calendario: calNekal,
          idExterno: e.id,
          version: e.version,
          firma: firmaDeItem(a.cuerpo),
          creadoEn: "nekal",
          diaCompleto: false,
          soloLectura: false,
        };
        resultados.push({ itemId: a.itemId, ok: true, origen });
      }
    } catch (e) {
      // Sin pase no sirve seguir; lo demás se reintenta en la próxima pasada.
      if (esPase(e)) {
        estado = "pase";
        break;
      }
      // Afuera no dejan cambiarlo: pasa a solo lectura y vuelve a como está allá.
      if ((e as Error)?.message === "prohibido" && a.tipo !== "crear") {
        resultados.push({
          itemId: a.itemId,
          ok: true,
          origen: { ...a.origen, soloLectura: true, version: "" },
        });
        continue;
      }
      resultados.push({ itemId: a.itemId, ok: false, error: "red" });
    }
  }
  if (resultados.some((r) => r.ok))
    o.change((d) => aplicarResultados(d, resultados));
  return estado;
}
