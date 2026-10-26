import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useApp } from "./AppContext";
import { database } from "./firebase";
import { nuevoCodigo, normalizarCodigo } from "./amigos/codigo";
import {
  AVISOS,
  Amistad,
  FilaAmigo,
  Persona,
  filasAmigos,
  idPar,
  listas,
  otroDe,
  revisarEnvio,
} from "./amigos/amistades";
import { PERSONA_EJEMPLO, YO_EJEMPLO, amigosDeEjemplo } from "./amigos/ejemplo";
import {
  Tarjeta,
  listoParaPublicar,
  mismaTarjeta,
  tarjetaDe,
} from "./amigos/tarjeta";
import {
  aceptarSolicitud,
  borrarAmistad,
  buscarCodigo,
  conPlazo,
  crearCodigo,
  enviarSolicitud,
  escucharAmistades,
  escucharTarjeta,
  publicarTarjeta,
} from "./amigos/nube";

// Amigos para toda la app (spec F §7.2): escucha amistades y tarjetas,
// publica la tuya y expone las acciones. Con invitado no se conecta a nada.
type Aviso = keyof typeof AVISOS;
export type Busqueda =
  | { tipo: "encontrado"; persona: Persona; codigo: string }
  | { tipo: "aviso"; aviso: Aviso; id?: string };
export type Amigos = {
  activo: boolean; // con cuenta o con el ejemplo de desarrollo
  yo: string | null; // tu uid (o el del ejemplo)
  estado: "invitado" | "cargando" | "listo" | "sin-conexion";
  miCodigo: string | null;
  recibidas: Amistad[];
  enviadas: Amistad[];
  amigos: FilaAmigo[];
  solicitudes: number;
  cuantos: number;
  buscar(texto: string): Promise<Busqueda>;
  enviar(persona: Persona, codigo: string): Promise<void>;
  aceptar(id: string): Promise<void>;
  borrar(id: string): Promise<void>; // Rechazar, Cancelar y Eliminar
  cambiarCodigo(): Promise<void>;
};
type Ejemplo = ReturnType<typeof amigosDeEjemplo>;

const ESPERA_PUBLICAR = 2000;
const INTENTOS_CODIGO = 5;

const motivo = (e: unknown): Aviso =>
  (e as Error).message === "sin-conexion" ||
  (e as { code?: string }).code === "unavailable"
    ? "sin-conexion"
    : "error";
const fallo = (e: unknown) => new Error(AVISOS[motivo(e)]);

const AmigosContext = createContext<Amigos | null>(null);

export function AmigosProvider({ children }: { children: ReactNode }) {
  const { user, data, cloudStatus, remoteData } = useApp();
  const uid = user?.uid ?? null;
  const [amistades, setAmistades] = useState<Amistad[]>([]);
  const [tarjetas, setTarjetas] = useState<Record<string, Tarjeta | null>>({});
  // undefined: tu tarjeta todavía no se leyó en esta sesión.
  const [mia, setMia] = useState<
    { t: Tarjeta | null; servidor: boolean } | undefined
  >(undefined);
  const [sinConexion, setSinConexion] = useState(false);
  const [ejemplo, setEjemplo] = useState<Ejemplo | null>(null);
  const publicada = useRef<Tarjeta | null>(null);
  const creando = useRef(false);

  // Solo en desarrollo: `nekalAmigos()` carga amigos de ejemplo sin Firebase.
  useEffect(() => {
    if (!__DEV__) return;
    const g = globalThis as {
      nekalAmigos?: (modo?: "vacio" | false) => string;
    };
    g.nekalAmigos = (modo) => {
      if (modo === false) {
        setEjemplo(null);
        return "Listo: amigos de ejemplo apagados.";
      }
      const e = amigosDeEjemplo();
      setEjemplo(modo === "vacio" ? { ...e, amistades: [], tarjetas: {} } : e);
      return modo === "vacio"
        ? "Listo: sin amigos."
        : "Listo: amigos de ejemplo cargados.";
    };
    return () => {
      delete g.nekalAmigos;
    };
  }, []);

  // Tus amistades y tu tarjeta. Al cambiar de cuenta se limpia todo.
  useEffect(() => {
    setAmistades([]);
    setTarjetas({});
    setMia(undefined);
    setSinConexion(false);
    publicada.current = null;
    if (!uid) return;
    const db = database();
    const error = (e: { code: string }) => {
      if (e.code === "unavailable") setSinConexion(true);
    };
    const fuera1 = escucharAmistades(
      db,
      uid,
      (a) => {
        setSinConexion(false);
        setAmistades(a);
      },
      error,
    );
    const fuera2 = escucharTarjeta(
      db,
      uid,
      (t, servidor) => {
        setMia({ t, servidor });
        if (t) publicada.current = t;
      },
      error,
    );
    return () => {
      fuera1();
      fuera2();
    };
  }, [uid]);

  const reales = useMemo(
    () => (uid ? listas(amistades, uid) : null),
    [amistades, uid],
  );
  const cuantosReales = reales?.amigos.length ?? 0;
  const uidsAmigos = useMemo(
    () =>
      reales && uid
        ? reales.amigos
            .map((a) => otroDe(a, uid).uid)
            .sort()
            .join(",")
        : "",
    [reales, uid],
  );

  // La tarjeta de cada amigo aceptado, en vivo.
  useEffect(() => {
    if (!uidsAmigos) return;
    const db = database();
    const fuera = uidsAmigos.split(",").map((otro) =>
      escucharTarjeta(
        db,
        otro,
        (t) => setTarjetas((antes) => ({ ...antes, [otro]: t })),
        (e) => {
          if (e.code === "unavailable") setSinConexion(true);
        },
      ),
    );
    return () => fuera.forEach((f) => f());
  }, [uidsAmigos]);

  // Publica tu tarjeta (spec F §4.3); la primera vez crea tu código.
  const listo = listoParaPublicar({
    conCuenta: !!uid,
    base: remoteData !== null,
    estadoNube: cloudStatus,
    nombre: data.profile.name,
  });
  useEffect(() => {
    if (!uid || !listo || !mia?.servidor) return;
    const db = database();
    if (!mia.t) {
      if (creando.current) return;
      creando.current = true;
      (async () => {
        for (let k = 0; k < INTENTOS_CODIGO; k++) {
          try {
            const t = tarjetaDe(data, Date.now(), cuantosReales, nuevoCodigo());
            await crearCodigo(db, uid, t, null);
            return;
          } catch (e) {
            if ((e as Error).message !== "ocupado") return;
          }
        }
      })().finally(() => {
        creando.current = false;
      });
      return;
    }
    const t = tarjetaDe(data, Date.now(), cuantosReales, mia.t.codigo);
    if (mismaTarjeta(t, publicada.current)) return;
    const espera = setTimeout(() => {
      const antes = publicada.current;
      publicarTarjeta(db, uid, t, antes)
        .then(() => {
          publicada.current = t;
        })
        .catch(() => {});
    }, ESPERA_PUBLICAR);
    return () => clearTimeout(espera);
  }, [uid, listo, mia, data, cuantosReales]);

  const yo = ejemplo ? YO_EJEMPLO : uid;
  const fuente = ejemplo ?? {
    codigo: mia?.t?.codigo ?? null,
    amistades,
    tarjetas,
  };
  const l = useMemo(
    () =>
      yo
        ? listas(fuente.amistades, yo)
        : { recibidas: [], enviadas: [], amigos: [] },
    [fuente.amistades, yo],
  );
  const filas = useMemo(
    () => (yo ? filasAmigos(l.amigos, yo, fuente.tarjetas) : []),
    [l, yo, fuente.tarjetas],
  );
  const activo = !!ejemplo || !!uid;

  const cambiarEjemplo = (fn: (e: Ejemplo) => Ejemplo) =>
    setEjemplo((e) => (e ? fn(e) : e));

  const valor: Amigos = {
    activo,
    yo,
    estado: !activo
      ? "invitado"
      : ejemplo
        ? "listo"
        : sinConexion
          ? "sin-conexion"
          : mia === undefined
            ? "cargando"
            : "listo",
    miCodigo: fuente.codigo,
    recibidas: l.recibidas,
    enviadas: l.enviadas,
    amigos: filas,
    solicitudes: l.recibidas.length,
    cuantos: l.amigos.length,
    async buscar(texto) {
      const codigo = normalizarCodigo(texto);
      if (!codigo || !yo) return { tipo: "aviso", aviso: "no-existe" };
      if (codigo === fuente.codigo) return { tipo: "aviso", aviso: "propio" };
      let persona: Persona | null = PERSONA_EJEMPLO;
      if (!ejemplo)
        try {
          persona = await conPlazo(buscarCodigo(database(), codigo));
        } catch (e) {
          return { tipo: "aviso", aviso: motivo(e) };
        }
      if (!persona) return { tipo: "aviso", aviso: "no-existe" };
      const r = revisarEnvio(persona, yo, fuente.amistades);
      if (r.tipo === "ok") return { tipo: "encontrado", persona, codigo };
      return r.tipo === "te-envio"
        ? { tipo: "aviso", aviso: "te-envio", id: r.id }
        : { tipo: "aviso", aviso: r.tipo };
    },
    async enviar(persona, codigo) {
      if (ejemplo)
        return cambiarEjemplo((e) => ({
          ...e,
          amistades: [
            ...e.amistades,
            {
              id: idPar(YO_EJEMPLO, persona.uid),
              de: YO_EJEMPLO,
              para: persona.uid,
              estado: "pendiente",
              nombreDe: "Tú",
              nombrePara: persona.nombre,
              codigo,
            },
          ],
        }));
      if (!uid) return;
      try {
        await conPlazo(enviarSolicitud(database(), uid, persona, codigo));
      } catch (e) {
        throw fallo(e);
      }
    },
    async aceptar(id) {
      if (ejemplo)
        return cambiarEjemplo((e) => ({
          ...e,
          amistades: e.amistades.map((a) =>
            a.id === id ? { ...a, estado: "aceptada" } : a,
          ),
        }));
      try {
        await conPlazo(aceptarSolicitud(database(), id));
      } catch (e) {
        throw fallo(e);
      }
    },
    async borrar(id) {
      if (ejemplo)
        return cambiarEjemplo((e) => ({
          ...e,
          amistades: e.amistades.filter((a) => a.id !== id),
        }));
      try {
        await conPlazo(borrarAmistad(database(), id));
      } catch (e) {
        throw fallo(e);
      }
    },
    async cambiarCodigo() {
      if (ejemplo)
        return cambiarEjemplo((e) => ({ ...e, codigo: nuevoCodigo() }));
      if (!uid || !mia?.t) throw fallo(new Error("error"));
      for (let k = 0; k < INTENTOS_CODIGO; k++) {
        const t = tarjetaDe(data, Date.now(), cuantosReales, nuevoCodigo());
        try {
          await conPlazo(crearCodigo(database(), uid, t, mia.t.codigo));
          return;
        } catch (e) {
          if ((e as Error).message !== "ocupado") throw fallo(e);
        }
      }
      throw fallo(new Error("error"));
    },
  };
  return (
    <AmigosContext.Provider value={valor}>{children}</AmigosContext.Provider>
  );
}

export function useAmigos(): Amigos {
  const a = useContext(AmigosContext);
  if (!a) throw new Error("useAmigos necesita AmigosProvider.");
  return a;
}
