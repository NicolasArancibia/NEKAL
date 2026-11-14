import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import { useApp } from "./AppContext";
import type { Cuenta, Proveedor } from "./conexiones/tipos";
import {
  agregarCuenta,
  estadoCuenta,
  quitarCuenta,
  type EstadoCuenta,
} from "./conexiones/estado";
import {
  googleDisponible,
  iniciarGoogle,
  olvidarGoogle,
  paseGoogle,
  recogerVueltaGoogle,
} from "./conexiones/google";
import { permisosGoogle } from "./conexiones/pase";
import {
  actualizarMicrosoft,
  iniciarMicrosoft,
  microsoftDisponible,
  olvidarMicrosoft,
  paseMicrosoft,
  recogerVueltaMicrosoft,
} from "./conexiones/microsoft";

// Une las cuentas guardadas (sin pases) con los pases de este dispositivo (spec H3_CONEXIONES §5).
export type CuentaVista = Cuenta & { estado: EstadoCuenta };
export type Origen = "inicio" | "ajustes";
export type UltimaConexion = {
  proveedor: Proveedor;
  ok: boolean;
  correo?: string;
  error?: string;
  origen: Origen;
};
type Ctx = {
  disponible: boolean;
  cuentas: CuentaVista[];
  ofrecer: boolean;
  ultima: UltimaConexion | null;
  conectar: (p: Proveedor, origen: Origen) => void;
  actualizar: (c: Cuenta) => void;
  desconectar: (c: Cuenta) => Promise<void>;
  marcarOfrecido: () => void;
  limpiarUltima: () => void;
};
const Contexto = createContext<Ctx | null>(null);
const CLAVE_ORIGEN = "nekal:conexion:origen";

function leerOrigen(): Origen {
  try {
    const o = sessionStorage.getItem(CLAVE_ORIGEN);
    sessionStorage.removeItem(CLAVE_ORIGEN);
    return o === "inicio" ? "inicio" : "ajustes";
  } catch {
    return "ajustes";
  }
}

const EJEMPLO: CuentaVista[] = [
  {
    proveedor: "google",
    correo: "sofia.rojas@gmail.com",
    nombre: "Sofía Rojas",
    desde: "2026-11-12T10:00:00.000Z",
    estado: "activa",
  },
  {
    proveedor: "microsoft",
    correo: "sofia.rojas@outlook.com",
    nombre: "Sofía Rojas",
    desde: "2026-11-12T10:00:00.000Z",
    estado: "actualizar",
  },
];

export function ConexionesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data, change, user, guest } = useApp();
  const disponible =
    !!user && !guest && (googleDisponible || microsoftDisponible);
  const [estados, setEstados] = useState<Record<string, EstadoCuenta>>({});
  const [ultima, setUltima] = useState<UltimaConexion | null>(null);
  const [ejemplo, setEjemplo] = useState<CuentaVista[] | null>(null);
  const [forzar, setForzar] = useState(false);
  const recogida = useRef(false);
  const cuentas = data.conexiones.cuentas;

  const recalcular = useCallback(async () => {
    const ahora = Date.now();
    const nuevos: Record<string, EstadoCuenta> = {};
    for (const c of cuentas) {
      const clave = `${c.proveedor}:${c.correo}`;
      if (c.proveedor === "google") {
        const pase = paseGoogle(c.correo);
        nuevos[clave] = estadoCuenta({
          tienePase: !!pase,
          vence: pase?.vence ?? null,
          correoPermitido: pase ? permisosGoogle(pase.scopes).correo : true,
          ahora,
        });
      } else {
        const pase = await paseMicrosoft(c.correo);
        nuevos[clave] = estadoCuenta({
          tienePase: pase !== null,
          vence: null,
          correoPermitido: true,
          ahora,
        });
      }
    }
    setEstados(nuevos);
  }, [cuentas]);

  // La vuelta de Google o Microsoft llega una sola vez, al cargar la página.
  useEffect(() => {
    if (!disponible || recogida.current) return;
    recogida.current = true;
    (async () => {
      const g = await recogerVueltaGoogle();
      const m = g ? null : await recogerVueltaMicrosoft();
      const r = g ?? m;
      if (!r) return;
      const proveedor: Proveedor = g ? "google" : "microsoft";
      const origen = leerOrigen();
      if (r.ok) {
        const { correo, nombre } = r.cuenta;
        change((d) => ({
          ...d,
          conexiones: agregarCuenta(d.conexiones, {
            proveedor,
            correo,
            nombre,
            desde: new Date().toISOString(),
          }),
        }));
        setUltima({ proveedor, ok: true, correo, origen });
      } else setUltima({ proveedor, ok: false, error: r.error, origen });
    })();
  }, [disponible, change]);

  useEffect(() => {
    if (!disponible) return;
    recalcular();
    const t = setInterval(recalcular, 30_000);
    const s = AppState.addEventListener("change", (e) => {
      if (e === "active") recalcular();
    });
    return () => {
      clearInterval(t);
      s.remove();
    };
  }, [disponible, recalcular]);

  // Solo en desarrollo: `nekalConexiones()` muestra dos cuentas de ejemplo, sin guardar nada.
  useEffect(() => {
    if (!__DEV__) return;
    const g = globalThis as {
      nekalConexiones?: (modo?: false | "hoja" | "vuelta" | "error") => string;
    };
    // nekalConexiones() cuentas · ("hoja") A1 · ("vuelta") A2 · ("error") falla · (false) quita.
    g.nekalConexiones = (modo) => {
      setEjemplo(modo === false ? null : EJEMPLO);
      setForzar(modo === "hoja");
      if (modo === "vuelta" || modo === "error")
        setUltima({
          proveedor: "google",
          ok: modo === "vuelta",
          correo: EJEMPLO[0].correo,
          error: "cancelado",
          origen: "inicio",
        });
      return modo === false ? "Ejemplo quitado." : "Ejemplo de conexiones.";
    };
    return () => {
      delete g.nekalConexiones;
    };
  }, []);

  const recordarOrigen = (origen: Origen) => {
    try {
      sessionStorage.setItem(CLAVE_ORIGEN, origen);
    } catch {
      // Sin sessionStorage la vuelta se muestra como desde Ajustes.
    }
  };

  const valor: Ctx = {
    disponible: disponible || !!ejemplo,
    cuentas:
      ejemplo ??
      cuentas.map((c) => ({
        ...c,
        estado: estados[`${c.proveedor}:${c.correo}`] ?? "activar_aqui",
      })),
    ofrecer: forzar || (disponible && !data.conexiones.ofrecido),
    ultima,
    conectar: (p, origen) => {
      recordarOrigen(origen);
      if (p === "google") iniciarGoogle();
      else
        iniciarMicrosoft().catch(() =>
          setUltima({ proveedor: p, ok: false, error: "red", origen }),
        );
    },
    actualizar: (c) => {
      recordarOrigen("ajustes");
      if (c.proveedor === "google")
        iniciarGoogle({ loginHint: c.correo, silencioso: true });
      else actualizarMicrosoft(c.correo).catch(() => undefined);
    },
    desconectar: async (c) => {
      if (c.proveedor === "google") await olvidarGoogle(c.correo);
      else await olvidarMicrosoft(c.correo);
      change((d) => ({
        ...d,
        conexiones: quitarCuenta(d.conexiones, c.proveedor, c.correo),
      }));
    },
    marcarOfrecido: () => {
      setForzar(false);
      change((d) => ({
        ...d,
        conexiones: { ...d.conexiones, ofrecido: true },
      }));
    },
    limpiarUltima: () => setUltima(null),
  };
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useConexiones(): Ctx {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("ConexionesProvider missing");
  return ctx;
}
