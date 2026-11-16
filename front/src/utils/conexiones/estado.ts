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
  destinoNekal: "",
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
    // Sin el campo (datos de H3) queda la primera cuenta; "" es «No copiar».
    destinoNekal:
      c.destinoNekal === undefined
        ? cuentas[0]
          ? claveCuenta(cuentas[0])
          : ""
        : (texto(c.destinoNekal, 320) ?? ""),
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


export function agregarCuenta(c: Conexiones, nueva: Cuenta): Conexiones {
  const destinoNekal = c.destinoNekal || claveCuenta(nueva);
  const vieja = c.cuentas.find((a) => misma(a, nueva.proveedor, nueva.correo));
  if (!vieja) return { ...c, destinoNekal, cuentas: [...c.cuentas, nueva] };
  return {
    ...c,
    destinoNekal,
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
  // Si se fue la cuenta destino, lo de Nekal pasa a la siguiente (si queda).
  const destinoNekal = cuentas.some((a) => claveCuenta(a) === c.destinoNekal)
    ? c.destinoNekal
    : cuentas[0]
      ? claveCuenta(cuentas[0])
      : "";
  return { ...c, cuentas, destinoNekal };
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
