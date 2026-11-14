// Conexiones con Google y Outlook (spec H3_CONEXIONES §5). Sin pases: esos viven solo en el dispositivo.
export type Proveedor = "google" | "microsoft";
export type Cuenta = {
  proveedor: Proveedor;
  correo: string;
  nombre: string;
  desde: string;
};
export type Conexiones = { cuentas: Cuenta[]; ofrecido: boolean };
export type PaseGoogle = { token: string; vence: number; scopes: string[] };
export type Permisos = { calendario: boolean; correo: boolean };
export type Vuelta =
  | { ok: true; pase: PaseGoogle }
  | { ok: false; error: "state" | "cancelado" | "necesita_toque" | "sin_pase" };
