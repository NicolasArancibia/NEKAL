import { mezclar } from "./correo";
import type { CorreoCompleto, CorreoResumen, Cuenta } from "./tipos";

// La bandeja de todas las cuentas (spec H3 §6.4). La red se inyecta: la real
// vive en google.ts y microsoft.ts; las pruebas y el modo invitado usan una falsa.
export type RedCorreo = {
  token: (c: Cuenta) => Promise<string | null>;
  // Google: el pase trae el permiso de Gmail; Microsoft siempre lo pide.
  permiso: (c: Cuenta) => boolean;
  listar: (
    token: string,
    cuenta: string,
    ahora: number,
  ) => Promise<{ principales: CorreoResumen[]; mas: CorreoResumen[] }>;
  abrir: (token: string, cuenta: string, id: string) => Promise<CorreoCompleto>;
  marcarLeido: (token: string, id: string) => Promise<void>;
  responder: (
    token: string,
    original: CorreoCompleto,
    texto: string,
  ) => Promise<void>;
};
export type AvisoCuenta = {
  cuenta: Cuenta;
  tipo: "pase" | "permiso" | "red";
  detalle: string;
};
export type Bandeja = {
  principales: CorreoResumen[];
  mas: CorreoResumen[];
  avisos: AvisoCuenta[];
};

type Parte =
  | { ok: true; principales: CorreoResumen[]; mas: CorreoResumen[] }
  | { ok: false; aviso: AvisoCuenta };

async function deUnaCuenta(
  cuenta: Cuenta,
  red: RedCorreo,
  ahora: number,
): Promise<Parte> {
  const aviso = (tipo: AvisoCuenta["tipo"], detalle = ""): Parte => ({
    ok: false,
    aviso: { cuenta, tipo, detalle },
  });
  if (!red.permiso(cuenta)) return aviso("permiso");
  try {
    const token = await red.token(cuenta);
    if (!token) return aviso("pase");
    return { ok: true, ...(await red.listar(token, cuenta.correo, ahora)) };
  } catch (e) {
    const motivo = String((e as Error)?.message ?? e).slice(0, 160);
    return motivo === "pase" ? aviso("pase") : aviso("red", motivo);
  }
}

// Una cuenta que falla no esconde el correo de las demás: queda un aviso.
export async function traerBandeja(
  cuentas: Cuenta[],
  red: (c: Cuenta) => RedCorreo,
  ahora: number,
): Promise<Bandeja> {
  const partes = await Promise.all(
    cuentas.map((c) => deUnaCuenta(c, red(c), ahora)),
  );
  const bien = partes.filter((p) => p.ok);
  return {
    principales: mezclar(bien.map((p) => p.principales)),
    mas: mezclar(bien.map((p) => p.mas)),
    avisos: partes.flatMap((p) => (p.ok ? [] : [p.aviso])),
  };
}
