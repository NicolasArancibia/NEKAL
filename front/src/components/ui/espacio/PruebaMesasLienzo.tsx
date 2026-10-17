import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useDerivedValue, useSharedValue } from "react-native-reanimated";
import {
  Canvas,
  PaintStyle,
  Picture,
  Skia,
  useFont,
  type SkCanvas,
  type SkFont,
  type SkPaint,
} from "@shopify/react-native-skia";
import { color } from "../../../styles/theme";
import { INCLINACION } from "../../../utils/acomodo/proyeccion";

// Prueba de rendimiento de la vista Mesas (plan B, Task 1). Escena sintética:
// 3 pisos en el mismo eje y 60 cubitos. Se borra en la Task 10.
type Obj = {
  x: number;
  y: number;
  w: number;
  h: number;
  z: number; // altura de la cara superior
  t: number; // grosor
  r: number;
  lado: string;
  label: string;
  chico: boolean;
};

const TONOS = [color.primary, color.success, color.warning, color.lineStrong];

function escena(): Obj[] {
  const out: Obj[] = [];
  const losa = (
    x: number,
    y: number,
    w: number,
    h: number,
    z: number,
    t: number,
    lado: string,
    label: string,
  ) => out.push({ x, y, w, h, z, t, r: 20, lado, label, chico: false });
  const cubitos = (
    x0: number,
    y0: number,
    cols: number,
    n: number,
    z: number,
    lado: string,
    nombre: string,
  ) => {
    for (let i = 0; i < n; i++) {
      const alto = 2 + ((i * 7) % 5) * 4;
      out.push({
        x: x0 + (i % cols) * 40,
        y: y0 + Math.floor(i / cols) * 40,
        w: 32,
        h: 32,
        z: z + alto,
        t: alto,
        r: 8,
        lado,
        label: `${nombre} ${i + 1}`,
        chico: true,
      });
    }
  };
  // General, arriba al centro.
  losa(-100, -80, 200, 160, 0, 18, color.primary, "GENERAL");
  cubitos(-88, -68, 4, 8, 0, color.lineStrong, "Cosa");
  // Mesas, debajo en el mismo eje.
  const mesas: [number, number, number, number, string][] = [
    [-230, -200, 210, 180, "TRABAJO"],
    [20, -200, 190, 160, "ESTUDIOS"],
    [20, 0, 170, 150, "PERSONAL"],
    [-210, 20, 160, 130, "DEPORTE"],
  ];
  mesas.forEach(([x, y, w, h, n], k) => {
    losa(x, y, w, h, -150, 14, TONOS[k], n);
    cubitos(
      x + 12,
      y + 12,
      4,
      10 + k * 2,
      -150,
      color.lineStrong,
      n.slice(0, 3),
    );
  });
  // Grupos de Trabajo, un piso más abajo (más delgados).
  losa(-250, -230, 120, 110, -290, 7, color.primary, "LANZAMIENTO");
  losa(-110, -200, 110, 100, -290, 7, color.primary, "OPERACIÓN");
  cubitos(-238, -218, 2, 4, -290, color.lineStrong, "Lan");
  return out;
}

function dibujar(
  canvas: SkCanvas,
  objetos: Obj[],
  giro: number,
  incl: number,
  zoom: number,
  cx: number,
  cy: number,
  pinta: SkPaint,
  borde: SkPaint,
  texto: SkPaint,
  grande: SkFont | null,
  chica: SkFont | null,
) {
  "worklet";
  const cg = Math.cos(giro),
    sg = Math.sin(giro),
    ci = Math.cos(incl),
    si = Math.sin(incl);
  const a = zoom * cg,
    b = -zoom * sg,
    c = zoom * sg * ci,
    d = zoom * cg * ci;
  const prof = (o: Obj) =>
    ((o.x + o.w / 2) * sg + (o.y + o.h / 2) * cg) * si + o.z * ci;
  const orden = objetos
    .map((o) => ({ o, p: prof(o) }))
    .sort((u, v) => u.p - v.p);
  for (const { o } of orden) {
    const rect = Skia.RRectXY(Skia.XYWHRect(o.x, o.y, o.w, o.h), o.r, o.r);
    // Lados: la misma cara repetida hacia abajo da el grosor.
    pinta.setColor(Skia.Color(o.lado));
    for (let k = o.t; k > 0; k -= 2) {
      canvas.save();
      canvas.concat([a, b, cx, c, d, cy - zoom * (o.z - k) * si, 0, 0, 1]);
      canvas.drawRRect(rect, pinta);
      canvas.restore();
    }
    canvas.save();
    canvas.concat([a, b, cx, c, d, cy - zoom * o.z * si, 0, 0, 1]);
    pinta.setColor(Skia.Color(color.surface));
    canvas.drawRRect(rect, pinta);
    canvas.drawRRect(rect, borde);
    const f = o.chico ? chica : grande;
    if (f) {
      texto.setColor(Skia.Color(o.chico ? color.ink : o.lado));
      canvas.drawText(
        o.label,
        o.x + (o.chico ? 3 : 14),
        o.y + o.h - (o.chico ? 5 : 12),
        texto,
        f,
      );
    }
    canvas.restore();
  }
}

export default function PruebaMesasLienzo() {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const grande = useFont(
    require("@expo-google-fonts/plus-jakarta-sans/800ExtraBold/PlusJakartaSans_800ExtraBold.ttf"),
    11,
  );
  const chica = useFont(
    require("@expo-google-fonts/plus-jakarta-sans/800ExtraBold/PlusJakartaSans_800ExtraBold.ttf"),
    7,
  );
  const objetos = useMemo(escena, []);
  const recorder = useMemo(() => Skia.PictureRecorder(), []);
  const pinta = useMemo(() => {
    const p = Skia.Paint();
    p.setAntiAlias(true);
    return p;
  }, []);
  const borde = useMemo(() => {
    const p = Skia.Paint();
    p.setAntiAlias(true);
    p.setStyle(PaintStyle.Stroke);
    p.setStrokeWidth(1);
    p.setColor(Skia.Color(color.line));
    return p;
  }, []);
  const texto = useMemo(() => {
    const p = Skia.Paint();
    p.setAntiAlias(true);
    return p;
  }, []);

  const giro = useSharedValue(-0.66),
    incl = useSharedValue(INCLINACION.inicial),
    zoom = useSharedValue(0.8),
    px = useSharedValue(0),
    py = useSharedValue(0);
  const gesto = Gesture.Simultaneous(
    Gesture.Pan()
      .maxPointers(1)
      .onChange((e) => {
        px.value += e.changeX;
        py.value += e.changeY;
      }),
    Gesture.Pinch().onChange((e) => {
      zoom.value = Math.min(2.5, Math.max(0.5, zoom.value * e.scaleChange));
    }),
    Gesture.Rotation().onChange((e) => {
      giro.value += e.rotationChange;
    }),
    Gesture.Pan()
      .minPointers(2)
      .onChange((e) => {
        incl.value = Math.min(
          INCLINACION.max,
          Math.max(INCLINACION.min, incl.value - e.changeY / 300),
        );
      }),
  );

  const picture = useDerivedValue(() => {
    const canvas = recorder.beginRecording(Skia.XYWHRect(0, 0, size.w, size.h));
    dibujar(
      canvas,
      objetos,
      giro.value,
      incl.value,
      zoom.value,
      size.w / 2 + px.value,
      size.h * 0.4 + py.value,
      pinta,
      borde,
      texto,
      grande,
      chica,
    );
    return recorder.finishRecordingAsPicture();
  }, [size, grande, chica]);

  return (
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
        {size.w > 0 && grande && chica && (
          <Canvas style={{ flex: 1 }}>
            <Picture picture={picture} />
          </Canvas>
        )}
      </View>
    </GestureDetector>
  );
}
