import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withTiming,
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
import { color, space } from "../../../styles/theme";
import { tonos } from "../../../utils/colores";
import { INCLINACION, proyectar } from "../../../utils/acomodo/proyeccion";
import { Button } from "../base";

// Prueba de la vista Mesas (plan B, Task 1, segunda versión, según la maqueta 07).
// Escena sintética; se borra en la Task 10.

type Punto = { x: number; y: number; on: boolean; sel: boolean };
type Cubo = {
  x: number;
  y: number;
  alto: number;
  hoy: boolean;
  titulo: string;
};
type Piso = {
  id: string;
  nivel: number;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  t: number;
  claro: string;
  oscuro: string;
  base: string;
  nombre: string;
  vidrio: boolean;
  cubos: Cubo[];
  puntos: Punto[];
  lineas: number[]; // pares de índices de puntos
};
type Linea = { x: number; y: number; z0: number; z1: number };
type Escena = { pisos: Piso[]; lineas: Linea[]; cable: number[] | null };

const Z = [0, -150, -290];

// Puntos deterministas dentro de la elipse del piso, con 2 vecinos unidos.
function cumulo(
  semilla: number,
  n: number,
  x: number,
  y: number,
  w: number,
  h: number,
  sel = -1,
) {
  let s = semilla;
  const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const cx = x + w / 2,
    cy = y + h / 2 - 8,
    rx = w / 2 - 22,
    ry = h / 2 - 26;
  const puntos: Punto[] = [];
  for (let k = 0; puntos.length < n && k < 4000; k++) {
    const a = r() * Math.PI * 2,
      d = Math.sqrt(r());
    const p = { x: cx + rx * d * Math.cos(a), y: cy + ry * d * Math.sin(a) };
    if (puntos.every((q) => (q.x - p.x) ** 2 + (q.y - p.y) ** 2 > 140))
      puntos.push({ ...p, on: r() > 0.35, sel: puntos.length === sel });
  }
  const lineas: number[] = [];
  puntos.forEach((p, i) =>
    puntos
      .map((q, j) => [j, (q.x - p.x) ** 2 + (q.y - p.y) ** 2])
      .filter(([j]) => j !== i)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 2)
      .forEach(([j]) => lineas.push(i, j)),
  );
  return { puntos, lineas };
}

function piso(
  id: string,
  nivel: number,
  x: number,
  y: number,
  w: number,
  h: number,
  base: string,
  nombre: string,
  extra: Partial<Piso> = {},
): Piso {
  const t = tonos(base);
  return {
    id,
    nivel,
    x,
    y,
    w,
    h,
    z: Z[nivel],
    t: nivel === 2 ? 8 : 16,
    claro: t.bordeClaro,
    oscuro: t.bordeOscuro,
    base: t.base,
    nombre,
    vidrio: false,
    cubos: [],
    puntos: [],
    lineas: [],
    ...extra,
  };
}

const cubosGeneral: Cubo[] = [
  { x: -81, y: -63, alto: 12, hoy: true, titulo: "Pagar luz" },
  { x: -25, y: -63, alto: 9, hoy: false, titulo: "Llamar" },
  { x: 31, y: -63, alto: 2, hoy: false, titulo: "Ideas" },
  { x: -81, y: -5, alto: 9, hoy: false, titulo: "Cumple" },
  { x: -25, y: -5, alto: 2, hoy: false, titulo: "Lecturas" },
  { x: 31, y: -5, alto: 4, hoy: false, titulo: "Viaje" },
];

// foco 0 = General, foco 1 = dentro de Trabajo.
function escena(foco: number): Escena {
  const general = piso(
    "general",
    0,
    -95,
    -75,
    190,
    150,
    color.primary,
    "GENERAL",
    { t: 18, vidrio: foco === 1, cubos: foco === 0 ? cubosGeneral : [] },
  );
  const mesa = (
    id: string,
    x: number,
    y: number,
    w: number,
    h: number,
    c: string,
    n: string,
    cantidad: number,
    semilla: number,
  ) => {
    const vidrio = foco === 1 && (id === "personal" || id === "deporte");
    const adentro = foco === 1 && id === "trabajo";
    return piso(id, 1, x, y, w, h, c, n, {
      vidrio,
      ...(adentro
        ? {
            cubos: [
              { x: x + 14, y: y + 14, alto: 12, hoy: true, titulo: "Correo" },
              { x: x + 70, y: y + 14, alto: 9, hoy: false, titulo: "Revisión" },
              { x: x + 126, y: y + 14, alto: 2, hoy: false, titulo: "Notas" },
            ],
          }
        : vidrio
          ? {}
          : cumulo(semilla, cantidad, x, y, w, h)),
    });
  };
  const pisos = [
    general,
    mesa("trabajo", -200, -150, 190, 160, color.primary, "TRABAJO", 22, 11),
    mesa("estudios", 14, -150, 160, 140, color.success, "ESTUDIOS", 14, 12),
    mesa("personal", 14, 4, 140, 120, color.warning, "PERSONAL", 9, 13),
    mesa("deporte", -170, 24, 120, 100, color.lineStrong, "DEPORTE", 6, 14),
  ];
  const lineas: Linea[] = [
    { x: -75, y: 70, z0: Z[1], z1: Z[0] },
    { x: 75, y: 70, z0: Z[1], z1: Z[0] },
    { x: 75, y: -55, z0: Z[1], z1: Z[0] },
  ];
  let cable: number[] | null = null;
  if (foco === 1) {
    const op = cumulo(22, 8, -95, -130, 120, 110, 2);
    pisos.push(
      piso(
        "lanzamiento",
        2,
        -255,
        -140,
        140,
        120,
        color.primary,
        "LANZAMIENTO",
        cumulo(21, 14, -255, -140, 140, 120),
      ),
      piso("operacion", 2, -95, -130, 120, 110, color.primary, "OPERACIÓN", op),
    );
    lineas.push(
      { x: -165, y: -20, z0: Z[2], z1: Z[1] },
      { x: -45, y: -20, z0: Z[2], z1: Z[1] },
    );
    const s = op.puntos[2];
    // Cable: de Estudios al punto elegido de Operación.
    cable = [20, -80, Z[1], s.x, s.y, Z[2]];
  }
  pisos.sort((a, b) => a.z - b.z);
  return { pisos, lineas, cable };
}

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

  const lineasDe = (z: number) => {
    trazo.setColor(Skia.Color(color.cable));
    trazo.setStrokeWidth(1.2);
    trazo.setPathEffect(Skia.PathEffect.MakeDash([4, 4], 0));
    for (const l of e.lineas)
      if (l.z0 === z) {
        const p = pantalla(l.x, l.y, l.z0),
          q = pantalla(l.x, l.y, l.z1);
        canvas.drawLine(p[0], p[1], q[0], q[1], trazo);
      }
    trazo.setPathEffect(null);
  };

  let nivel = -1;
  for (const p of e.pisos) {
    if (p.nivel !== nivel) {
      if (nivel !== -1) lineasDe(Z[nivel]);
      nivel = p.nivel;
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
    // Cara de arriba con su contenido.
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
      .map((q) => ({ q, o: prof(q.x + 24, q.y + 24) }))
      .sort((u, v) => u.o - v.o);
    for (const { q } of cubos) {
      const r = Skia.RRectXY(Skia.XYWHRect(q.x, q.y, 48, 48), 11, 11);
      pinta.setColor(Skia.Color(q.hoy ? color.ink : color.mapEdge));
      for (let k = 0; k < q.alto; k += 1.5) {
        plano(p.z + k);
        canvas.drawRRect(r, pinta);
        canvas.restore();
      }
      plano(p.z + q.alto);
      pinta.setColor(Skia.Color(q.hoy ? color.ink : color.surface));
      canvas.drawRRect(r, pinta);
      trazo.setColor(Skia.Color(q.hoy ? color.ink : color.line));
      trazo.setStrokeWidth(1);
      canvas.drawRRect(r, trazo);
      pinta.setColor(Skia.Color(q.hoy ? color.surface : color.ink));
      canvas.drawText(q.titulo, q.x + 5, q.y + 28, pinta, chica);
      canvas.restore();
    }
  }
  if (nivel !== -1) lineasDe(Z[nivel]);
  if (e.cable) {
    const p = pantalla(e.cable[0], e.cable[1], e.cable[2]),
      q = pantalla(e.cable[3], e.cable[4], e.cable[5]);
    const path = Skia.Path.Make();
    path.moveTo(p[0], p[1]);
    path.quadTo((p[0] + q[0]) / 2, Math.max(p[1], q[1]) + 30, q[0], q[1]);
    trazo.setColor(Skia.Color(color.primary));
    trazo.setStrokeWidth(2.2);
    canvas.drawPath(path, trazo);
  }
}

export default function PruebaMesasLienzo() {
  const reduced = useReducedMotion();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [foco, setFoco] = useState(0);
  const fuente = require("@expo-google-fonts/plus-jakarta-sans/800ExtraBold/PlusJakartaSans_800ExtraBold.ttf");
  const grande = useFont(fuente, 11);
  const chica = useFont(fuente, 8);
  const escenas = useMemo(() => [escena(0), escena(1)], []);
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

  const focoSV = useSharedValue(0),
    giro = useSharedValue(-0.66),
    zoom = useSharedValue(0.72),
    px = useSharedValue(0),
    py = useSharedValue(-40);

  // Lleva la cámara al piso del foco (General arriba, o Trabajo y sus grupos).
  const enfocar = (f: number) => {
    const destino =
      f === 0
        ? { x: -5, y: -20, z: -75, zoom: 0.72 }
        : { x: -105, y: -70, z: -220, zoom: 1.0 };
    const p0 = proyectar(destino, {
      giro: giro.value,
      inclinacion: INCLINACION.inicial,
      zoom: destino.zoom,
      cx: size.w / 2,
      cy: size.h * 0.42,
    });
    focoSV.value = f;
    setFoco(f);
    const t = { duration: reduced ? 0 : 450 };
    zoom.value = withTiming(destino.zoom, t);
    px.value = withTiming(size.w / 2 - p0.x, t);
    py.value = withTiming(size.h * 0.5 - p0.y, t);
  };

  // ¿El toque cae sobre la cara de arriba de Trabajo?
  const alTocar = (x: number, y: number) => {
    if (focoSV.value !== 0) return;
    const cam = {
      giro: giro.value,
      inclinacion: INCLINACION.inicial,
      zoom: zoom.value,
      cx: size.w / 2 + px.value,
      cy: size.h * 0.42 + py.value,
    };
    const t = escenas[0].pisos.find((p) => p.id === "trabajo")!;
    const q = [
      [t.x, t.y],
      [t.x + t.w, t.y],
      [t.x + t.w, t.y + t.h],
      [t.x, t.y + t.h],
    ].map(([a, b]) => proyectar({ x: a, y: b, z: t.z }, cam));
    const lado = q.map((p, i) => {
      const r = q[(i + 1) % 4];
      return Math.sign((r.x - p.x) * (y - p.y) - (r.y - p.y) * (x - p.x));
    });
    if (lado.every((s) => s >= 0) || lado.every((s) => s <= 0)) enfocar(1);
  };
  const alSoltarPellizco = () => {
    if (focoSV.value === 0 && zoom.value > 1.15) enfocar(1);
    else if (focoSV.value === 1 && zoom.value < 0.75) enfocar(0);
  };

  const gesto = Gesture.Simultaneous(
    Gesture.Pan()
      .maxPointers(1)
      .onChange((e) => {
        px.value += e.changeX;
        py.value += e.changeY;
      }),
    Gesture.Pinch()
      .onChange((e) => {
        zoom.value = Math.min(2.2, Math.max(0.5, zoom.value * e.scaleChange));
      })
      .onEnd(() => {
        scheduleOnRN(alSoltarPellizco);
      }),
    Gesture.Rotation().onChange((e) => {
      giro.value += e.rotationChange;
    }),
    Gesture.Tap().onEnd((e) => {
      scheduleOnRN(alTocar, e.x, e.y);
    }),
  );

  const listo = size.w > 0 && grande !== null && chica !== null;
  const picture = useDerivedValue(() => {
    const canvas = recorder.beginRecording(Skia.XYWHRect(0, 0, size.w, size.h));
    if (grande && chica)
      dibujar(
        canvas,
        escenas[focoSV.value],
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
  }, [size, grande, chica]);

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
          {/* El lienzo aparece con su tamaño y fuentes listos: si el dibujo
              cambia de dependencias después de montarse, en web no se repinta. */}
          {listo && (
            <Canvas style={{ flex: 1 }}>
              <Picture picture={picture} />
            </Canvas>
          )}
        </View>
      </GestureDetector>
      {foco === 1 && (
        <View
          style={{ position: "absolute", left: space.screen, top: space.sm }}
        >
          <Button
            title="‹ General"
            variant="secondary"
            small
            onPress={() => enfocar(0)}
          />
        </View>
      )}
    </View>
  );
}
