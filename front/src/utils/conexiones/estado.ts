import type { Conexiones, Cuenta, Origen, Proveedor } from "./tipos";
import { CONECTANDO, SINCRONIZANDO } from "../estadosNube";

// Lista de cuentas conectadas (spec H3_CONEXIONES §5.2) y su estado en este dispositivo.
const MAX_CUENTAS = 6;
const MARGEN_MS = 60_000;
// Identifica una cuenta: el mismo correo puede estar en Google y en Outlook.
export const claveCuenta = (c: Pick<Cuenta, "proveedor" | "correo">) =>
  `${c.proveedor}:${c.correo}`;

export const CONEXIONES_VACIAS: Conexiones = {
  cuentas: [],
  ofrecido: false,
  destinos: [],
};

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

function destinosDe(c: any, cuentas: Cuenta[]): string[] {
  if (Array.isArray(c.destinos))
    return [
      ...new Set<string>(c.destinos.filter((d: unknown) => !!texto(d, 320))),
    ].slice(0, MAX_CUENTAS);
  // Antes había un solo destino (`destinoNekal`, "" = «No copiar»); sin
  // ninguno de los dos (datos de H3) va a la primera cuenta.
  if (c.destinoNekal !== undefined) {
    const uno = texto(c.destinoNekal, 320);
    return uno ? [uno] : [];
  }
  return cuentas[0] ? [claveCuenta(cuentas[0])] : [];
}

export function normalizarConexiones(v: unknown): Conexiones {
  const c = v as any;
  if (!c || typeof c !== "object" || !Array.isArray(c.cuentas))
    return { ...CONEXIONES_VACIAS };
  const cuentas = c.cuentas
    .map(cuentaValida)
    .filter((x: Cuenta | null): x is Cuenta => x !== null)
    .slice(0, MAX_CUENTAS);
  return {
    cuentas,
    ofrecido: c.ofrecido === true,
    destinos: destinosDe(c, cuentas),
  };
}

const CLAVES_ORIGEN = [
  "proveedor",
  "cuenta",
  "calendario",
  "idExterno",
  "version",
  "firma",
  "creadoEn",
  "diaCompleto",
  "soloLectura",
];
// Un origen con otras claves, tipos o valores se descarta (el ítem queda como propio).
export function normalizarOrigen(v: unknown): Origen | undefined {
  const o = v as any;
  if (!o || typeof o !== "object") return undefined;
  const claves = Object.keys(o);
  if (
    claves.length !== CLAVES_ORIGEN.length ||
    !CLAVES_ORIGEN.every((k) => claves.includes(k)) ||
    (o.proveedor !== "google" && o.proveedor !== "microsoft") ||
    (o.creadoEn !== "fuera" && o.creadoEn !== "nekal") ||
    typeof o.diaCompleto !== "boolean" ||
    typeof o.soloLectura !== "boolean" ||
    ["cuenta", "calendario", "idExterno", "version", "firma"].some(
      (k) => texto(o[k], 1000) === null,
    )
  )
    return undefined;
  return { ...o };
}

const misma = (a: Cuenta, proveedor: Proveedor, correo: string) =>
  a.proveedor === proveedor && a.correo === correo;


// La primera cuenta recibe lo creado en Nekal; las demás se eligen en Ajustes.
// Volver a conectar (por ejemplo, «Actualizar») no cambia lo elegido.
export function agregarCuenta(c: Conexiones, nueva: Cuenta): Conexiones {
  const vieja = c.cuentas.find((a) => misma(a, nueva.proveedor, nueva.correo));
  if (!vieja)
    return {
      ...c,
      destinos: c.cuentas.length ? c.destinos : [claveCuenta(nueva)],
      cuentas: [...c.cuentas, nueva],
    };
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
  const cuentas = c.cuentas.filter((a) => !misma(a, proveedor, correo));
  const clave = claveCuenta({ proveedor, correo });
  const quedan = c.destinos.filter((d) => d !== clave);
  // Si era el único destino, lo de Nekal pasa a la siguiente cuenta (si queda).
  const destinos =
    c.destinos.includes(clave) && !quedan.length && cuentas[0]
      ? [claveCuenta(cuentas[0])]
      : quedan;
  return { ...c, cuentas, destinos };
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

// La hoja «Conecta tus cuentas» espera la primera sincronización: en un
// dispositivo nuevo los datos locales todavía no saben si ya se ofreció.
// Antes del primer intercambio con Firebase los datos locales pueden estar
// viejos o vacíos (dispositivo nuevo): ni la hoja ni el espejo deben actuar.
export const esperandoNube = (estadoNube: string) =>
  estadoNube === CONECTANDO || estadoNube === SINCRONIZANDO;

export function ofrecerHoja(o: {
  disponible: boolean;
  ofrecido: boolean;
  estadoNube: string;
  forzar: boolean;
}): boolean {
  if (o.forzar) return true;
  const esperando =
    o.estadoNube === CONECTANDO || o.estadoNube === SINCRONIZANDO;
  return o.disponible && !o.ofrecido && !esperando;
}

// Un «Actualizar» silencioso de Google que vuelve pidiendo un toque se reintenta
// con la pantalla de Google, en vez de quedar en «Toca para actualizar» para siempre.
export function trasVuelta(
  error: string | undefined,
  eraSilencioso: boolean,
): "reintentar" | "mostrar" {
  return error === "necesita_toque" && eraSilencioso ? "reintentar" : "mostrar";
}
