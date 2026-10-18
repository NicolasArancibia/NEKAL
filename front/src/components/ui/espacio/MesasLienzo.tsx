import React, { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import {
  Canvas,
  PaintStyle,
  Picture,
  Skia,
  TileMode,
  useFont,
  vec,
  type SkCanvas,
  type SkFont,
  type SkPaint,
} from "@shopify/react-native-skia";
import { color, motion } from "../../../styles/theme";
import { useApp } from "../../../utils/AppContext";
import { acomodoMesas, elegir, Foco, Piso } from "../../../utils/acomodo/mesas";
import { PuntoPlano } from "../../../utils/acomodo/plano";
import {
  Camara,
  INCLINACION,
  proyectar,
} from "../../../utils/acomodo/proyeccion";
import { tonosDe } from "../../../utils/colores";
import { rutaDe, Ventana } from "../../../utils/espacio";
import { GENERAL } from "../../../utils/estructura";
import { haptic } from "../../../utils/haptics";
import { Group, Item, Workspace } from "../../../utils/model";
import { sinAnteriores } from "../../../utils/rutinas";
import MesasAccesible from "./MesasAccesible";

// Vista Mesas (spec B §3.2): falso 3D dibujado con Skia a partir del acomodo
// puro (acomodo/mesas.ts). El dibujo sigue la prueba aprobada en el iPhone.

export type MesasProps = {
  foco: Foco;
  ventana: Ventana;
  now: number;
  seleccion: string[];
  marcada: string;
  onFoco: (f: Foco) => void;
  onAbrir: (i: Item) => void;
  onSeleccion: (ids: string[]) => void;
  onMarcar: (id: string) => void;
  onEditarMesa: (w: Workspace) => void;
  onEditarGrupo: (g: Group) => void;
};

type CuboD = {
  x: number;
  y: number;
  lado: number;
  alto: number;
  hoy: boolean;
  hecho: boolean;
  tenue: boolean;
  bloq: boolean;
  sel: boolean;
  titulo: string;
};
type PisoD = {
  z: number;
  zArriba: number | null;
  x: number;
  y: number;
  w: number;
  h: number;
  t: number;
  vidrio: boolean;
  nombre: string;
  claro: string;
  oscuro: string;
  base: string;
  cubos: CuboD[];
  puntos: { x: number; y: number; on: boolean; sel: boolean }[];
  lineas: number[];
};
type Escena = {
  pisos: PisoD[];
  cables: number[][];
  neka: { x: number; y: number; gx: number; gy: number } | null;
};

const ARRIBA: Foco = { workspaceId: GENERAL, ruta: [] };
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

// Pares de índices: cada punto con sus 2 vecinos más cercanos.
function vecinos(ps: PuntoPlano[]): number[] {
  const out = new Set<string>();
  ps.forEach((p, i) =>
    ps
      .map((q, j) => ({ j, d: (q.x - p.x) ** 2 + (q.y - p.y) ** 2 }))
      .filter((x) => x.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2)
      .forEach(({ j }) => out.add(`${Math.min(i, j)}|${Math.max(i, j)}`)),
  );
  return [...out].flatMap((k) => k.split("|").map(Number));
}

const corto = (t: string, lado: number) => {
  const n = Math.max(3, Math.floor(lado / 5.2));
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

function dibujar(
  canvas: SkCanvas,
  e: Escena,
  giro: number,
  zoom: number,
  cx: number,
  cy: number,
  pinta: SkPaint,
  trazo: SkPaint,
  grande: SkFont,
  chica: SkFont,
) {
  "worklet";
  const incl = 0.95;
  const cg = Math.cos(giro),
    sg = Math.sin(giro),
    ci = Math.cos(incl),
    si = Math.sin(incl);
  const a = zoom * cg,
    b = -zoom * sg,
    c = zoom * sg * ci,
    d = zoom * cg * ci;
  const plano = (z: number) => {
    canvas.save();
    canvas.concat([a, b, cx, c, d, cy - zoom * z * si, 0, 0, 1]);
  };
  const pantalla = (x: number, y: number, z: number) => [
    cx + zoom * (x * cg - y * sg),
    cy + zoom * ((x * sg + y * cg) * ci - z * si),
  ];
  const prof = (x: number, y: number) => x * sg + y * cg;
  pinta.setShader(null);
  pinta.setAlphaf(1);
  trazo.setPathEffect(null);
  trazo.setAlphaf(1);

  // Por piso (de abajo hacia arriba) y, en un mismo piso, de atrás hacia adelante.
  const orden = e.pisos
    .map((p) => ({ p, o: prof(p.x + p.w / 2, p.y + p.h / 2) }))
    .sort((u, v) => u.p.z - v.p.z || u.o - v.o);

  for (const { p } of orden) {
    // Línea punteada hacia el piso de arriba, en el eje común.
    if (p.zArriba !== null && !p.vidrio) {
      const u = pantalla(p.x + p.w / 2, p.y + p.h / 2, p.z),
        v = pantalla(p.x + p.w / 2, p.y + p.h / 2, p.zArriba);
      trazo.setColor(Skia.Color(color.cable));
      trazo.setStrokeWidth(1.2);
      trazo.setPathEffect(Skia.PathEffect.MakeDash([4, 4], 0));
      canvas.drawLine(u[0], u[1], v[0], v[1], trazo);
      trazo.setPathEffect(null);
    }
    const rect = Skia.RRectXY(Skia.XYWHRect(p.x, p.y, p.w, p.h), 22, 22);
    if (p.vidrio) {
      plano(p.z);
      pinta.setColor(Skia.Color(color.vidrio));
      canvas.drawRRect(rect, pinta);
      trazo.setColor(Skia.Color(color.vidrioBorde));
      trazo.setStrokeWidth(1.5);
      trazo.setPathEffect(Skia.PathEffect.MakeDash([5, 4], 0));
      canvas.drawRRect(rect, trazo);
      trazo.setPathEffect(null);
      pinta.setColor(Skia.Color(color.vidrioBorde));
      canvas.drawText(p.nombre, p.x + 14, p.y + p.h - 12, pinta, grande);
      canvas.restore();
      continue;
    }
    // Sombra suave sobre lo de abajo.
    plano(p.z - p.t - 12);
    pinta.setColor(Skia.Color(color.sombraPiso));
    pinta.setAlphaf(0.1);
    canvas.drawRRect(
      Skia.RRectXY(Skia.XYWHRect(p.x - 6, p.y - 6, p.w + 12, p.h + 12), 28, 28),
      pinta,
    );
    pinta.setAlphaf(1);
    canvas.restore();
    // Borde con degradé (oscuro → claro → oscuro), repetido hacia abajo.
    pinta.setShader(
      Skia.Shader.MakeLinearGradient(
        vec(p.x, p.y + p.h),
        vec(p.x + p.w, p.y),
        [Skia.Color(p.oscuro), Skia.Color(p.claro), Skia.Color(p.oscuro)],
        [0, 0.5, 1],
        TileMode.Clamp,
      ),
    );
    for (let k = p.t; k > 0; k -= 2) {
      plano(p.z - k);
      canvas.drawRRect(rect, pinta);
      canvas.restore();
    }
    pinta.setShader(null);
    // Cara de arriba con sus puntos.
    plano(p.z);
    pinta.setColor(Skia.Color(color.surface));
    canvas.drawRRect(rect, pinta);
    trazo.setColor(Skia.Color(color.line));
    trazo.setStrokeWidth(1);
    canvas.drawRRect(rect, trazo);
    if (p.puntos.length) {
      pinta.setColor(Skia.Color(p.base));
      pinta.setAlphaf(0.07);
      canvas.drawOval(
        Skia.XYWHRect(p.x + 14, p.y + 14, p.w - 28, p.h - 42),
        pinta,
      );
      trazo.setColor(Skia.Color(p.base));
      trazo.setStrokeWidth(0.8);
      trazo.setAlphaf(0.3);
      for (let i = 0; i < p.lineas.length; i += 2) {
        const u = p.puntos[p.lineas[i]],
          v = p.puntos[p.lineas[i + 1]];
        canvas.drawLine(u.x, u.y, v.x, v.y, trazo);
      }
      trazo.setAlphaf(1);
      for (const q of p.puntos) {
        if (q.on) {
          pinta.setAlphaf(0.16);
          canvas.drawCircle(q.x, q.y, 6, pinta);
        }
        pinta.setAlphaf(q.on ? 1 : 0.3);
        canvas.drawCircle(q.x, q.y, q.sel ? 4.5 : 3.2, pinta);
        if (q.sel) {
          trazo.setColor(Skia.Color(color.primary));
          trazo.setStrokeWidth(1.6);
          canvas.drawCircle(q.x, q.y, 9, trazo);
        }
      }
      pinta.setAlphaf(1);
    }
    pinta.setColor(Skia.Color(p.base));
    canvas.drawText(p.nombre, p.x + 14, p.y + p.h - 12, pinta, grande);
    canvas.restore();
    // Cubitos, de atrás hacia adelante; su altura es la carga.
    const cubos = p.cubos
      .map((q) => ({ q, o: prof(q.x + q.lado / 2, q.y + q.lado / 2) }))
      .sort((u, v) => u.o - v.o);
    for (const { q } of cubos) {
      const r = Skia.RRectXY(Skia.XYWHRect(q.x, q.y, q.lado, q.lado), 11, 11);
      const alfa = q.tenue ? 0.32 : 1;
      pinta.setAlphaf(1);
      pinta.setColor(Skia.Color(q.hoy ? color.ink : color.mapEdge));
      pinta.setAlphaf(alfa);
      for (let k = 0; k < q.alto; k += 1.5) {
        plano(p.z + k);
        canvas.drawRRect(r, pinta);
        canvas.restore();
      }
      plano(p.z + q.alto);
      pinta.setColor(
        Skia.Color(q.hoy ? color.ink : q.hecho ? color.line : color.surface),
      );
      pinta.setAlphaf(alfa);
      canvas.drawRRect(r, pinta);
      trazo.setColor(
        Skia.Color(q.sel ? color.primary : q.hoy ? color.ink : color.line),
      );
      trazo.setStrokeWidth(q.sel ? 2.4 : 1);
      if (q.bloq && !q.sel) {
        trazo.setColor(Skia.Color(color.lineStrong));
        trazo.setPathEffect(Skia.PathEffect.MakeDash([3, 3], 0));
      }
      canvas.drawRRect(r, trazo);
      trazo.setPathEffect(null);
      if (q.hecho) {
        trazo.setColor(Skia.Color(color.inkDone));
        trazo.setStrokeWidth(2);
        const m = q.lado / 2;
        canvas.drawLine(q.x + m - 7, q.y + m, q.x + m - 2, q.y + m + 5, trazo);
        canvas.drawLine(
          q.x + m - 2,
          q.y + m + 5,
          q.x + m + 7,
          q.y + m - 5,
          trazo,
        );
      } else if (q.lado >= 30) {
        pinta.setColor(Skia.Color(q.hoy ? color.surface : color.ink));
        canvas.drawText(q.titulo, q.x + 5, q.y + q.lado / 2 + 4, pinta, chica);
      }
      pinta.setAlphaf(1);
      canvas.restore();
    }
  }
  // Neka: la fuente conectada a General con un cable en ángulo recto.
  if (e.neka) {
    const n = e.neka;
    const r = Skia.RRectXY(Skia.XYWHRect(n.x, n.y, 28, 28), 8, 8);
    pinta.setColor(Skia.Color(color.mapEdge));
    for (let k = 0; k < 8; k += 1.5) {
      plano(k);
      canvas.drawRRect(r, pinta);
      canvas.restore();
    }
    plano(8);
    pinta.setColor(Skia.Color(color.surface));
    canvas.drawRRect(r, pinta);
    trazo.setColor(Skia.Color(color.line));
    trazo.setStrokeWidth(1);
    canvas.drawRRect(r, trazo);
    pinta.setColor(Skia.Color(color.inkSecondary));
    canvas.drawText("NEKA", n.x + 3, n.y + 18, pinta, chica);
    canvas.restore();
    const ruta = [
      [n.x + 28, n.y + 14],
      [n.gx - 14, n.y + 14],
      [n.gx - 14, n.gy],
      [n.gx, n.gy],
    ].map(([x, y]) => pantalla(x, y, 0));
    const path = Skia.PathBuilder.Make().moveTo(ruta[0][0], ruta[0][1]);
    for (const [x, y] of ruta.slice(1)) path.lineTo(x, y);
    trazo.setColor(Skia.Color(color.cable));
    trazo.setStrokeWidth(1.6);
    canvas.drawPath(path.build(), trazo);
  }
  for (const k of e.cables) {
    const p = pantalla(k[0], k[1], k[2]),
      q = pantalla(k[3], k[4], k[5]);
    const path = Skia.PathBuilder.Make()
      .moveTo(p[0], p[1])
      .quadTo((p[0] + q[0]) / 2, Math.max(p[1], q[1]) + 30, q[0], q[1]);
    trazo.setColor(Skia.Color(color.primary));
    trazo.setStrokeWidth(2.2);
    canvas.drawPath(path.build(), trazo);
  }
}

export default function MesasLienzo({
  foco,
  ventana,
  now,
  seleccion,
  marcada,
  onFoco,
  onAbrir,
  onSeleccion,
  onMarcar,
  onEditarMesa,
  onEditarGrupo,
}: MesasProps) {
  const { data } = useApp();
  const reducido = useReducedMotion();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const fuente = require("@expo-google-fonts/plus-jakarta-sans/800ExtraBold/PlusJakartaSans_800ExtraBold.ttf");
  const grande = useFont(fuente, 11);
  const chica = useFont(fuente, 8);
  const recorder = useMemo(() => Skia.PictureRecorder(), []);
  const pinta = useMemo(() => {
    const p = Skia.Paint();
    p.setAntiAlias(true);
    return p;
  }, []);
  const trazo = useMemo(() => {
    const p = Skia.Paint();
    p.setAntiAlias(true);
    p.setStyle(PaintStyle.Stroke);
    return p;
  }, []);

  const vista = useMemo(() => sinAnteriores(data, now), [data, now]);
  const r = useMemo(
    () => acomodoMesas(vista, foco, ventana, now),
    [vista, foco, ventana, now],
  );
  // Solo el piso actual, el de abajo y el vidrio de arriba (spec B §5).
  const focoId = foco.ruta.at(-1) ?? foco.workspaceId;
  const pisoFoco =
    r.pisos.find((p) => p.id === focoId && !p.vidrio) ??
    r.pisos.find((p) => !p.vidrio)!;
  const zs = [...new Set(r.pisos.map((p) => p.z))].sort((a, b) => b - a);
  const kFoco = zs.indexOf(pisoFoco.z);
  const pisos = r.pisos.filter((p) => Math.abs(zs.indexOf(p.z) - kFoco) <= 1);
  const porId = useMemo(
    () => new Map(vista.items.map((i) => [i.id, i])),
    [vista],
  );
  const escena = useMemo<Escena>(() => {
    const zArriba = (z: number) => {
      const k = zs.indexOf(z);
      return k > 0 ? zs[k - 1] : null;
    };
    const general = pisos.find((p) => p.tipo === "general" && !p.vidrio);
    return {
      pisos: pisos.map((p) => {
        const t = tonosDe(
          data.workspaces.find((w) => w.id === p.workspaceId)?.color,
        );
        return {
          z: p.z,
          zArriba: zArriba(p.z),
          x: p.x,
          y: p.y,
          w: p.w,
          h: p.h,
          t: p.grosor,
          vidrio: p.vidrio,
          nombre: `${p.tipo === "rutina" ? "RUTINA · " : ""}${p.nombre.toUpperCase()}`,
          claro: t.bordeClaro,
          oscuro: t.bordeOscuro,
          base: t.base,
          cubos: p.cubitos.map((q) => ({
            x: q.x,
            y: q.y,
            lado: q.lado,
            alto: q.alto,
            hoy: q.estado === "hoy",
            hecho: q.estado === "hecho",
            tenue: q.estado === "tenue",
            bloq: q.estado === "bloqueado",
            sel: seleccion.includes(q.id) || marcada === q.id,
            titulo: corto(porId.get(q.id)?.title ?? "", q.lado),
          })),
          puntos: p.puntos.map((q) => ({
            x: q.x,
            y: q.y,
            on: q.estado !== "tenue" && q.estado !== "hecho",
            sel: seleccion.includes(q.id) || marcada === q.id,
          })),
          lineas: vecinos(p.puntos),
        };
      }),
      cables: r.cables.map((k) => [
        k.desde.x,
        k.desde.y,
        k.desde.z,
        k.hasta.x,
        k.hasta.y,
        k.hasta.z,
      ]),
      neka: general
        ? {
            x: general.x - 64,
            y: general.y + general.h / 2 - 14,
            gx: general.x,
            gy: general.y + general.h * 0.35,
          }
        : null,
    };
  }, [r, seleccion, marcada, data.workspaces, porId]);

  const giro = useSharedValue(-0.66),
    zoom = useSharedValue(0.72),
    px = useSharedValue(0),
    py = useSharedValue(0);
  const zoomFoco = useRef(0.72);
  const [camara, setCamara] = useState<Camara | null>(null);
  const camaraActual = (): Camara => ({
    giro: giro.value,
    inclinacion: INCLINACION.inicial,
    zoom: zoom.value,
    cx: size.w / 2 + px.value,
    cy: size.h * 0.42 + py.value,
  });
  const guardarCamara = () => setCamara(camaraActual());

  // Lleva la cámara a lo que importa del foco: el piso y lo que tiene debajo.
  const centrar = () => {
    if (!size.w) return;
    const activos = pisos.filter((p) => !p.vidrio);
    const x0 = Math.min(...activos.map((p) => p.x)),
      x1 = Math.max(...activos.map((p) => p.x + p.w)),
      y0 = Math.min(...activos.map((p) => p.y)),
      y1 = Math.max(...activos.map((p) => p.y + p.h)),
      z0 = Math.min(...activos.map((p) => p.z)),
      z1 = Math.max(...activos.map((p) => p.z));
    const z = clamp(
      (0.92 * Math.min(size.w, size.h)) / Math.hypot(x1 - x0, y1 - y0),
      0.4,
      1.4,
    );
    const p0 = proyectar(
      { x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: (z0 + z1) / 2 },
      {
        giro: giro.value,
        inclinacion: INCLINACION.inicial,
        zoom: z,
        cx: size.w / 2,
        cy: size.h * 0.42,
      },
    );
    zoomFoco.current = z;
    const ir = (v: number) => (reducido ? v : withSpring(v, motion.gentle));
    zoom.value = ir(z);
    px.value = ir(size.w / 2 - p0.x);
    py.value = ir(size.h * 0.5 - p0.y);
    setCamara({
      giro: giro.value,
      inclinacion: INCLINACION.inicial,
      zoom: z,
      cx: size.w - p0.x,
      cy: size.h * 0.92 - p0.y,
    });
  };
  const clave = `${foco.workspaceId}|${foco.ruta.join("/")}`;
  useEffect(centrar, [clave, size.w, size.h]);

  const focoDe = (p: Piso): Foco =>
    p.tipo === "general"
      ? ARRIBA
      : p.tipo === "mesa"
        ? { workspaceId: p.workspaceId, ruta: [] }
        : {
            workspaceId: p.workspaceId,
            ruta: rutaDe(data, p.groupId).map((g) => g.id),
          };
  const irA = (p: Piso | undefined) => {
    if (!p || p.id === pisoFoco.id) return;
    haptic.selection();
    onFoco(focoDe(p));
  };
  const alTocar = (x: number, y: number) => {
    const t = elegir(pisos, camaraActual(), x, y);
    if (!t) return onMarcar("");
    if (t.tipo === "piso") return irA(pisos.find((p) => p.id === t.id));
    const i = porId.get(t.id);
    if (!i) return;
    haptic.selection();
    if (seleccion.length)
      onSeleccion(
        seleccion.includes(i.id)
          ? seleccion.filter((x) => x !== i.id)
          : [...seleccion, i.id],
      );
    else {
      onMarcar(i.id);
      onAbrir(i);
    }
  };
  const alMantener = (x: number, y: number) => {
    const t = elegir(pisos, camaraActual(), x, y);
    if (!t) return;
    haptic.light();
    if (t.tipo === "cubito") {
      if (!seleccion.includes(t.id)) onSeleccion([...seleccion, t.id]);
      return;
    }
    const p = pisos.find((q) => q.id === t.id);
    if (!p) return;
    if (p.tipo === "general" || p.tipo === "mesa") {
      const w = data.workspaces.find((q) => q.id === p.workspaceId);
      if (w) onEditarMesa(w);
    } else {
      const g = data.groups.find((q) => q.id === p.groupId);
      if (g) onEditarGrupo(g);
    }
  };
  // Acercarse mucho entra al piso del centro; alejarse mucho sube.
  const alSoltarPellizco = () => {
    if (zoom.value > zoomFoco.current * 1.7) {
      const t = elegir(pisos, camaraActual(), size.w / 2, size.h / 2);
      const p =
        t?.tipo === "piso" ? pisos.find((q) => q.id === t.id) : undefined;
      if (p && p.z < pisoFoco.z) return irA(p);
    }
    if (
      zoom.value < zoomFoco.current * 0.55 &&
      (foco.ruta.length || foco.workspaceId !== GENERAL)
    )
      return onFoco(
        foco.ruta.length ? { ...foco, ruta: foco.ruta.slice(0, -1) } : ARRIBA,
      );
    guardarCamara();
  };

  // Los gestos llaman siempre a la versión actual de cada función: si
  // guardaran la de un render viejo, tocarían la escena anterior.
  const actuales = useRef({ alTocar, alMantener, alSoltarPellizco, guardarCamara });
  actuales.current = { alTocar, alMantener, alSoltarPellizco, guardarCamara };
  const gesto = useMemo(() => {
    const tocar = (x: number, y: number) => actuales.current.alTocar(x, y);
    const mantener = (x: number, y: number) => actuales.current.alMantener(x, y);
    const soltarPellizco = () => actuales.current.alSoltarPellizco();
    const guardar = () => actuales.current.guardarCamara();
    return Gesture.Simultaneous(
      Gesture.Pan()
        .maxPointers(1)
        .onChange((e) => {
          px.value += e.changeX;
          py.value += e.changeY;
        })
        .onEnd(() => scheduleOnRN(guardar)),
      Gesture.Pinch()
        .onChange((e) => {
          zoom.value = Math.min(2.5, Math.max(0.4, zoom.value * e.scaleChange));
        })
        .onEnd(() => scheduleOnRN(soltarPellizco)),
      Gesture.Rotation()
        .onChange((e) => {
          giro.value += e.rotationChange;
        })
        .onEnd(() => scheduleOnRN(guardar)),
      Gesture.Exclusive(
        Gesture.LongPress()
          .minDuration(500)
          .onStart((e) => scheduleOnRN(mantener, e.x, e.y)),
        Gesture.Tap().onEnd((e, ok) => {
          if (ok) scheduleOnRN(tocar, e.x, e.y);
        }),
      ),
    );
  }, []);

  const listo = size.w > 0 && grande !== null && chica !== null;
  // En web, el primer cuadro no se pinta si nada cambia después de montar el
  // lienzo: un pulso apenas aparece obliga a redibujar.
  const pulso = useSharedValue(0);
  useEffect(() => {
    if (!listo) return;
    const f = requestAnimationFrame(() => {
      pulso.value += 1;
    });
    return () => cancelAnimationFrame(f);
  }, [listo]);
  const picture = useDerivedValue(() => {
    pulso.value;
    const canvas = recorder.beginRecording(Skia.XYWHRect(0, 0, size.w, size.h));
    if (grande && chica)
      dibujar(
        canvas,
        escena,
        giro.value,
        zoom.value,
        size.w / 2 + px.value,
        size.h * 0.42 + py.value,
        pinta,
        trazo,
        grande,
        chica,
      );
    return recorder.finishRecordingAsPicture();
  }, [size, grande, chica, escena]);

  return (
    <View style={{ flex: 1 }}>
      <GestureDetector gesture={gesto}>
        <View
          style={{ flex: 1 }}
          onLayout={(e) =>
            setSize({
              w: e.nativeEvent.layout.width,
              h: e.nativeEvent.layout.height,
            })
          }
        >
          {/* El lienzo aparece con su tamaño y fuentes listos: en web no se
              repinta si el dibujo cambia de dependencias después de montarse. */}
          {listo && (
            <Canvas style={{ flex: 1 }}>
              <Picture picture={picture} />
            </Canvas>
          )}
        </View>
      </GestureDetector>
      {camara && (
        <MesasAccesible
          pisos={pisos}
          camara={camara}
          items={porId}
          onPiso={(id) => irA(pisos.find((p) => p.id === id))}
          onCubito={(id) => {
            const i = porId.get(id);
            if (i) {
              onMarcar(id);
              onAbrir(i);
            }
          }}
        />
      )}
    </View>
  );
}
