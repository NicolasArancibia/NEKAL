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
  // Correo de la cuenta donde se copia lo creado en Nekal ("" = no copiar).
  destinoNekal: string;
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
