import type { Conexiones, Cuenta, Proveedor } from "./tipos";

// Lista de cuentas conectadas (spec H3_CONEXIONES §5.2) y su estado en este dispositivo.
const MAX_CUENTAS = 6;
const MARGEN_MS = 60_000;
export const CONEXIONES_VACIAS: Conexiones = { cuentas: [], ofrecido: false };

const texto = (v: unknown, n: number) =>
  typeof v === "string" && v.length <= n ? v : null;

function cuentaValida(v: any): Cuenta | null {
  if (!v || (v.proveedor !== "google" && v.proveedor !== "microsoft"))
    return null;
  const correo = texto(v.correo, 320),
    nombre = texto(v.nombre, 320),
    desde = texto(v.desde, 40);
  if (!correo || nombre === null || desde === null) return null;
  return { proveedor: v.proveedor, correo, nombre, desde };
}

export function normalizarConexiones(v: unknown): Conexiones {
  const c = v as any;
  if (!c || typeof c !== "object" || !Array.isArray(c.cuentas))
    return { cuentas: [], ofrecido: false };
  const cuentas = c.cuentas
    .map(cuentaValida)
    .filter((x: Cuenta | null): x is Cuenta => x !== null)
    .slice(0, MAX_CUENTAS);
  return { cuentas, ofrecido: c.ofrecido === true };
}

const misma = (a: Cuenta, proveedor: Proveedor, correo: string) =>
  a.proveedor === proveedor && a.correo === correo;

export function agregarCuenta(c: Conexiones, nueva: Cuenta): Conexiones {
  const vieja = c.cuentas.find((a) => misma(a, nueva.proveedor, nueva.correo));
  if (!vieja) return { ...c, cuentas: [...c.cuentas, nueva] };
  return {
    ...c,
    cuentas: c.cuentas.map((a) =>
      a === vieja ? { ...nueva, desde: vieja.desde } : a,
    ),
  };
}

export function quitarCuenta(
  c: Conexiones,
  proveedor: Proveedor,
  correo: string,
): Conexiones {
  return {
    ...c,
    cuentas: c.cuentas.filter((a) => !misma(a, proveedor, correo)),
  };
}

export type EstadoCuenta =
  "activa" | "actualizar" | "activar_aqui" | "falta_correo";
export const TEXTO_ESTADO: Record<EstadoCuenta, string> = {
  activa: "Activa",
  actualizar: "Toca para actualizar",
  activar_aqui: "Toca para activar aquí",
  falta_correo: "Falta permiso de correo",
};

// `vence: null` = el pase se renueva solo (Microsoft).
export function estadoCuenta(o: {
  tienePase: boolean;
  vence: number | null;
  correoPermitido: boolean;
  ahora: number;
}): EstadoCuenta {
  if (!o.tienePase) return "activar_aqui";
  if (o.vence !== null && o.vence - o.ahora <= MARGEN_MS) return "actualizar";
  return o.correoPermitido ? "activa" : "falta_correo";
}
