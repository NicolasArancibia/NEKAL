// Conexiones con Google y Outlook (spec H3_CONEXIONES §5). Sin pases: esos viven solo en el dispositivo.
export type Proveedor = "google" | "microsoft";
export type Cuenta = {
  proveedor: Proveedor;
  correo: string;
  nombre: string;
  desde: string;
};
export type Conexiones = {
  cuentas: Cuenta[];
  ofrecido: boolean;
  // Cuentas («proveedor:correo») donde se copia lo creado en Nekal; vacía = no copiar.
  destinos: string[];
};
// De dónde viene un ítem del espejo (spec H3 §5.2). `firma`: los campos
// espejados la última vez que ambos lados quedaron iguales.
export type Origen = {
  proveedor: Proveedor;
  cuenta: string;
  calendario: string;
  idExterno: string;
  version: string;
  firma: string;
  creadoEn: "fuera" | "nekal";
  diaCompleto: boolean;
  soloLectura: boolean;
};
// Un calendario de la cuenta. `esNekal`: el calendario «Nekal» propio, donde va lo creado en Nekal.
export type CalendarioFuera = {
  id: string;
  nombre: string;
  soloLectura: boolean;
  esNekal: boolean;
};
export type PaseGoogle = { token: string; vence: number; scopes: string[] };
export type Permisos = { calendario: boolean; correo: boolean };
export type Vuelta =
  | { ok: true; pase: PaseGoogle }
  | { ok: false; error: "state" | "cancelado" | "necesita_toque" | "sin_pase" };

// Correo (V2/H5): se lee en vivo y nunca se guarda.
export type Persona = { nombre: string; correo: string };
export type CorreoResumen = {
  id: string;
  proveedor: Proveedor;
  cuenta: string;
  hilo: string;
  de: Persona;
  asunto: string;
  fecha: string;
  extracto: string;
  leido: boolean;
};
export type CorreoCompleto = CorreoResumen & {
  texto: string;
  para: string;
  responderA: Persona;
  idMensaje: string;
  referencias: string;
};
