import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "./AppContext";
import { useConexiones } from "./ConexionesContext";
import { crearCerebro } from "./agente/cerebro";
import {
  type AvisoCuenta,
  type Bandeja,
  traerBandeja,
  unaALaVez,
} from "./conexiones/bandeja";
import {
  type Borrador,
  type Clase,
  clasificar,
  clave,
  INSTRUCCIONES_CORREO,
  leerBorrador,
  pedidoBorrador,
} from "./conexiones/correoNeka";
import { claveCuenta } from "./conexiones/estado";
import type { CorreoCompleto, CorreoResumen } from "./conexiones/tipos";

// La bandeja vive solo en memoria (spec H3 §5.2: los correos no se guardan).
// Lo que Neka ya clasificó se recuerda mientras la app está abierta (§6.5.3).
const memoria = new Map<string, Clase>();

export type CorreoEnLista = CorreoResumen & { clase?: Clase };

export function useCorreo() {
  const { data } = useApp();
  const conexiones = useConexiones();
  const { cuentas, redCorreo } = conexiones;
  const [bandeja, setBandeja] = useState<Bandeja | null>(null);
  const [actualizando, setActualizando] = useState(false);
  const [nekaFallo, setNekaFallo] = useState(false);
  const [leidos, setLeidos] = useState<Set<string>>(() => new Set());
  const dataRef = useRef(data);
  dataRef.current = data;
  const cuentasRef = useRef(cuentas);
  cuentasRef.current = cuentas;
  const firma = cuentas.map(claveCuenta).join("|");

  const cargar = useCallback(async () => {
    const lista = cuentasRef.current;
    if (!lista.length) return;
    setActualizando(true);
    try {
      const b = await traerBandeja(lista, redCorreo, Date.now());
      let fallo = false;
      if (b.principales.length)
        try {
          fallo = (
            await clasificar({
              cerebro: crearCerebro(),
              correos: b.principales,
              data: dataRef.current,
              ahora: Date.now(),
              memoria,
            })
          ).fallo;
        } catch {
          // Sin Firebase / IA no se esconde nada.
          fallo = true;
        }
      setNekaFallo(fallo);
      setBandeja(b);
    } finally {
      setActualizando(false);
    }
  }, [redCorreo]);
  // Una recarga a la vez: al montar (dos veces en desarrollo) y al tirar.
  const recargar = useMemo(() => unaALaVez(cargar), [cargar]);

  useEffect(() => {
    setBandeja(null);
    recargar();
  }, [firma, recargar]);

  const cuentaDe = (c: CorreoResumen) => {
    const cuenta = cuentasRef.current.find(
      (x) => x.proveedor === c.proveedor && x.correo === c.cuenta,
    );
    if (!cuenta) throw new Error("La cuenta ya no está conectada.");
    return cuenta;
  };
  const tokenDe = async (c: CorreoResumen) => {
    const cuenta = cuentaDe(c);
    const red = redCorreo(cuenta);
    const token = await red.token(cuenta);
    if (!token) throw new Error("pase");
    return { red, token };
  };

  const enLista = (c: CorreoResumen): CorreoEnLista => ({
    ...c,
    leido: c.leido || leidos.has(clave(c)),
    clase: memoria.get(clave(c)),
  });
  const principales = (bandeja?.principales ?? []).map(enLista);
  const esImportante = (c: CorreoEnLista) =>
    nekaFallo || (!!c.clase && c.clase.razon !== "nada");

  return {
    estado: !cuentas.length
      ? ("sin_cuentas" as const)
      : bandeja
        ? ("listo" as const)
        : ("cargando" as const),
    actualizando,
    importantes: principales.filter(esImportante),
    mas: [
      ...principales.filter((c) => !esImportante(c)),
      ...(bandeja?.mas ?? []).map(enLista),
    ],
    total: (bandeja?.principales.length ?? 0) + (bandeja?.mas.length ?? 0),
    nekaFallo,
    avisos: (bandeja?.avisos ?? []) as AvisoCuenta[],
    recargar,

    // Abre el correo completo y lo marca leído (aquí y en el proveedor).
    async abrir(c: CorreoResumen): Promise<CorreoCompleto> {
      const { red, token } = await tokenDe(c);
      const completo = await red.abrir(token, c.cuenta, c.id);
      if (!c.leido && !leidos.has(clave(c))) {
        setLeidos((s) => new Set(s).add(clave(c)));
        red.marcarLeido(token, c.id).catch(() => {
          // Si falla, sigue no leído allá; aquí ya se abrió.
        });
      }
      return { ...completo, leido: true };
    },

    // El texto completo va a Neka solo aquí, cuando la persona lo pide.
    async borrador(
      c: CorreoCompleto,
      indicacion: string,
    ): Promise<Borrador | null> {
      try {
        const nombre = dataRef.current.profile.name || cuentaDe(c).nombre;
        const r = await crearCerebro()
          .sesion(INSTRUCCIONES_CORREO, [], [])
          .enviar(pedidoBorrador(c, indicacion, nombre, Date.now()));
        return leerBorrador(r.texto);
      } catch {
        return null;
      }
    },

    async enviar(c: CorreoCompleto, texto: string): Promise<void> {
      const { red, token } = await tokenDe(c);
      await red.responder(token, c, texto);
    },
  };
}
