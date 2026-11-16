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
  aplicarEnNekal,
  hayCambiosLocales,
  soltarCuenta,
} from "./conexiones/espejo";
import type { EventoFuera } from "./conexiones/eventos";
import { RedCalendario, sincronizarCuenta } from "./conexiones/sincronizar";
import {
  agregarCuenta,
  claveCuenta,
  esperandoNube,
  estadoCuenta,
  ofrecerHoja,
  trasVuelta,
  quitarCuenta,
  type EstadoCuenta,
} from "./conexiones/estado";
import {
  borrarEventoGoogle,
  calendariosGoogle,
  crearCalendarioNekalGoogle,
  eventosGoogle,
  googleDisponible,
  guardarEventoGoogle,
  iniciarGoogle,
  olvidarGoogle,
  paseGoogle,
  recogerVueltaGoogle,
} from "./conexiones/google";
import { permisosGoogle } from "./conexiones/pase";
import {
  actualizarMicrosoft,
  borrarEventoGraph,
  calendariosGraph,
  crearCalendarioNekalGraph,
  eventosGraph,
  guardarEventoGraph,
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
  // Dónde se copia lo creado en Nekal: claves «proveedor:correo» (vacía = no copiar).
  destinos: string[];
  alternarDestino: (clave: string) => void;
  noCopiar: () => void;
  // Por qué falló la última pasada con cada cuenta (clave → motivo); se reintenta sola.
  fallos: Record<string, string>;
};
const Contexto = createContext<Ctx | null>(null);
const CLAVE_ORIGEN = "nekal:conexion:origen";

const CLAVE_SILENCIOSO = "nekal:google:silencioso";
// Correo del «Actualizar» silencioso en curso (vacío si no hubo).
function leerSilencioso(): string {
  try {
    const v = sessionStorage.getItem(CLAVE_SILENCIOSO) ?? "";
    sessionStorage.removeItem(CLAVE_SILENCIOSO);
    return v;
  } catch {
    return "";
  }
}

function leerOrigen(): Origen {
  try {
    const o = sessionStorage.getItem(CLAVE_ORIGEN);
    sessionStorage.removeItem(CLAVE_ORIGEN);
    return o === "inicio" ? "inicio" : "ajustes";
  } catch {
    return "ajustes";
  }
}

// La red real de cada proveedor para el espejo del calendario.
const RED: Record<Proveedor, RedCalendario> = {
  google: {
    token: async (c) => {
      const p = paseGoogle(c.correo);
      return p && p.vence - Date.now() > 60_000 ? p.token : null;
    },
    leerCalendarios: calendariosGoogle,
    leerEventos: eventosGoogle,
    crearCalendarioNekal: crearCalendarioNekalGoogle,
    guardar: guardarEventoGoogle,
    borrar: borrarEventoGoogle,
  },
  microsoft: {
    token: (c) => paseMicrosoft(c.correo),
    leerCalendarios: calendariosGraph,
    leerEventos: eventosGraph,
    crearCalendarioNekal: crearCalendarioNekalGraph,
    guardar: guardarEventoGraph,
    borrar: borrarEventoGraph,
  },
};
const CINCO_MIN = 5 * 60_000;

// Eventos de ejemplo para `nekalConexiones("eventos")` (solo desarrollo).
function eventosEjemplo(ahora: number): {
  google: EventoFuera[];
  microsoft: EventoFuera[];
} {
  const hoy = new Date(ahora);
  const a = (dias: number, h: number, m = 0) =>
    new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate() + dias,
      h,
      m,
    ).toISOString();
  const ev = (
    id: string,
    titulo: string,
    inicio: string,
    minutos: number,
    extra: Partial<EventoFuera> = {},
  ): EventoFuera => ({
    id,
    calendario: "primary",
    titulo,
    inicio,
    minutos,
    diaCompleto: false,
    lugar: "",
    descripcion: "",
    version: "1",
    actualizado: new Date(ahora).toISOString(),
    soloLectura: false,
    cancelado: false,
    ...extra,
  });
  return {
    google: [
      ev("ej-g1", "Clase de Redes", a(1, 9), 90, { lugar: "Sala 3" }),
      ev("ej-g2", "Almuerzo con Ana", a(0, 13), 60),
      ev("ej-g3", "Feriado", a(3, 0), 1440, {
        diaCompleto: true,
        soloLectura: true,
        calendario: "feriados",
      }),
    ],
    microsoft: [
      ev("ej-m1", "Reunión de equipo", a(0, 15), 60, {
        lugar: "Sala 3 · edificio B",
        calendario: "cal",
      }),
    ],
  };
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
  const { data, change, user, guest, cloudStatus } = useApp();
  const disponible =
    !!user && !guest && (googleDisponible || microsoftDisponible);
  const [estados, setEstados] = useState<Record<string, EstadoCuenta>>({});
  const [ultima, setUltima] = useState<UltimaConexion | null>(null);
  const [ejemplo, setEjemplo] = useState<CuentaVista[] | null>(null);
  const [forzar, setForzar] = useState(false);
  const [fallos, setFallos] = useState<Record<string, string>>({});
  const recogida = useRef(false);
  const corriendo = useRef(false);
  const dataRef = useRef(data);
  dataRef.current = data;
  const nubeRef = useRef(cloudStatus);
  nubeRef.current = cloudStatus;
  const cuentas = data.conexiones.cuentas;
  // Clave estable: cada sincronización recrea la lista aunque no cambie.
  const claveCuentas = cuentas
    .map((c) => `${c.proveedor}:${c.correo}`)
    .join("|");

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
  }, [claveCuentas]);

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
      const silencioso = leerSilencioso();
      if (
        !r.ok &&
        proveedor === "google" &&
        trasVuelta(r.error, !!silencioso) === "reintentar"
      )
        return iniciarGoogle({ loginHint: silencioso });
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

  // Una pasada del espejo por cada cuenta con pase (spec H3 §7), de a una.
  const sincronizar = useCallback(async () => {
    if (
      !disponible ||
      corriendo.current ||
      esperandoNube(nubeRef.current)
    )
      return;
    corriendo.current = true;
    try {
      const { cuentas: todas, destinos } = dataRef.current.conexiones;
      for (const c of todas) {
        let fallo = "";
        await sincronizarCuenta(c, {
          leer: () => dataRef.current,
          change,
          red: RED[c.proveedor],
          copiarAqui: destinos.includes(claveCuenta(c)),
          ahora: Date.now(),
          fallo: (d) => (fallo = fallo || d),
        });
        setFallos((f) =>
          (f[claveCuenta(c)] ?? "") === fallo
            ? f
            : { ...f, [claveCuenta(c)]: fallo },
        );
      }
    } finally {
      corriendo.current = false;
      recalcular();
    }
  }, [disponible, change, recalcular]);

  // Al cargar, al cambiar las cuentas, cada 5 min y al volver a la app.
  useEffect(() => {
    if (!disponible) return;
    sincronizar();
    const t = setInterval(sincronizar, CINCO_MIN);
    const s = AppState.addEventListener("change", (e) => {
      if (e === "active") sincronizar();
    });
    return () => {
      clearInterval(t);
      s.remove();
    };
  }, [disponible, sincronizar]);

  // 3 s después de un cambio local que el espejo tenga que enviar.
  useEffect(() => {
    if (!disponible || !hayCambiosLocales(data, data.conexiones, Date.now()))
      return;
    const t = setTimeout(sincronizar, 3000);
    return () => clearTimeout(t);
  }, [disponible, data, sincronizar]);

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
      nekalConexiones?: (
        modo?: false | "hoja" | "vuelta" | "error" | "eventos",
      ) => string;
    };
    // nekalConexiones() cuentas · ("hoja") A1 · ("vuelta") A2 · ("error") falla · (false) quita.
    g.nekalConexiones = (modo) => {
      setEjemplo(modo === false ? null : EJEMPLO);
      setForzar(modo === "hoja");
      if (modo === "eventos") {
        const ej = eventosEjemplo(Date.now());
        const plan = (lista: EventoFuera[]) => ({
          crearEnNekal: lista,
          actualizarEnNekal: [],
          vincular: [],
          aPapelera: [],
          duplicados: [],
          fuera: [],
        });
        change((d) =>
          aplicarEnNekal(
            aplicarEnNekal(d, EJEMPLO[0], plan(ej.google), Date.now()),
            EJEMPLO[1],
            plan(ej.microsoft),
            Date.now(),
          ),
        );
      }
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
  }, [change]);

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
    ofrecer: ofrecerHoja({
      disponible,
      ofrecido: data.conexiones.ofrecido,
      estadoNube: cloudStatus,
      forzar,
    }),
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
      if (c.proveedor === "google") {
        try {
          sessionStorage.setItem(CLAVE_SILENCIOSO, c.correo);
        } catch {
          // Sin sessionStorage, si Google pide un toque se mostrará el aviso.
        }
        iniciarGoogle({ loginHint: c.correo, silencioso: true });
      } else actualizarMicrosoft(c.correo).catch(() => undefined);
    },
    desconectar: async (c) => {
      if (c.proveedor === "google") await olvidarGoogle(c.correo);
      else await olvidarMicrosoft(c.correo);
      change((d) => ({
        ...soltarCuenta(d, c, Date.now()),
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
    destinos: data.conexiones.destinos,
    alternarDestino: (clave) =>
      change((d) => {
        const ya = d.conexiones.destinos;
        return {
          ...d,
          conexiones: {
            ...d.conexiones,
            destinos: ya.includes(clave)
              ? ya.filter((x) => x !== clave)
              : [...ya, clave],
          },
        };
      }),
    noCopiar: () =>
      change((d) => ({ ...d, conexiones: { ...d.conexiones, destinos: [] } })),
    fallos,
  };
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useConexiones(): Ctx {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("ConexionesProvider missing");
  return ctx;
}
