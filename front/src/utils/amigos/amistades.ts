import { Tarjeta } from "./tarjeta";

// Un papel por pareja (spec F §5.1): pendiente hasta que `para` acepta.
export type Amistad = {
  id: string;
  de: string;
  para: string;
  estado: "pendiente" | "aceptada";
  nombreDe: string;
  nombrePara: string;
  codigo: string;
};
export type Persona = { uid: string; nombre: string };

export const idPar = (a: string, b: string) =>
  a < b ? `${a}_${b}` : `${b}_${a}`;

export const otroDe = (a: Amistad, yo: string): Persona =>
  a.de === yo
    ? { uid: a.para, nombre: a.nombrePara }
    : { uid: a.de, nombre: a.nombreDe };

export function listas(amistades: Amistad[], yo: string) {
  const porNombre = (xs: Amistad[]) =>
    [...xs].sort((a, b) =>
      otroDe(a, yo).nombre.localeCompare(otroDe(b, yo).nombre, "es"),
    );
  const pendientes = amistades.filter((a) => a.estado === "pendiente");
  return {
    recibidas: porNombre(pendientes.filter((a) => a.para === yo)),
    enviadas: porNombre(pendientes.filter((a) => a.de === yo)),
    amigos: porNombre(amistades.filter((a) => a.estado === "aceptada")),
  };
}

export const AVISOS = {
  "no-existe": "No encontramos ese código. Revisa que esté bien escrito.",
  propio: "Ese es tu código.",
  "ya-amigos": "Ya son amigos.",
  "ya-enviada": "Ya le enviaste una solicitud.",
  "te-envio": "Esa persona ya te envió una solicitud.",
  "sin-conexion": "Sin conexión. Revisa tu internet y reintenta.",
  error: "No se pudo completar. Revisa tu conexión y reintenta.",
};

export type Revision =
  | { tipo: "ok" }
  | { tipo: "propio" | "ya-amigos" | "ya-enviada" }
  | { tipo: "te-envio"; id: string };

export function revisarEnvio(
  persona: Persona,
  yo: string,
  amistades: Amistad[],
): Revision {
  if (persona.uid === yo) return { tipo: "propio" };
  const a = amistades.find((x) => otroDe(x, yo).uid === persona.uid);
  if (!a) return { tipo: "ok" };
  if (a.estado === "aceptada") return { tipo: "ya-amigos" };
  return a.de === yo ? { tipo: "ya-enviada" } : { tipo: "te-envio", id: a.id };
}

export type FilaAmigo = {
  uid: string;
  id: string;
  nombre: string;
  nivel: number | null;
  logros: number | null;
  tarjeta: Tarjeta | null;
};

// Si la tarjeta del amigo no cargó (o no existe), va el nombre de la solicitud.
export function filasAmigos(
  amigos: Amistad[],
  yo: string,
  tarjetas: Record<string, Tarjeta | null | undefined>,
): FilaAmigo[] {
  return amigos
    .map((a) => {
      const otro = otroDe(a, yo);
      const t = tarjetas[otro.uid] ?? null;
      return {
        uid: otro.uid,
        id: a.id,
        nombre: t?.nombre ?? otro.nombre,
        nivel: t?.nivel ?? null,
        logros: t?.logros.length ?? null,
        tarjeta: t,
      };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
