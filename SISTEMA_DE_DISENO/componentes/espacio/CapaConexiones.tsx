import { StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import { color } from "../../../styles/theme";

type P = { x: number; y: number };
const PUNTA = 7;

// Curva de `desde` a `hasta` con punta de flecha. La punta se dibuja a mano
// (sin <Marker>) para que se vea igual en web y en el iPhone.
function flecha(desde: P, hasta: P) {
  const medio = (desde.y + hasta.y) / 2;
  const c1 = { x: desde.x, y: medio },
    c2 = { x: hasta.x, y: medio };
  let dx = hasta.x - c2.x,
    dy = hasta.y - c2.y;
  if (Math.hypot(dx, dy) < 1e-6) {
    dx = hasta.x - desde.x;
    dy = hasta.y - desde.y;
  }
  const largo = Math.hypot(dx, dy) || 1;
  const ux = dx / largo,
    uy = dy / largo;
  const izq = {
    x: hasta.x - PUNTA * ux + (PUNTA / 2) * uy,
    y: hasta.y - PUNTA * uy - (PUNTA / 2) * ux,
  };
  const der = {
    x: hasta.x - PUNTA * ux - (PUNTA / 2) * uy,
    y: hasta.y - PUNTA * uy + (PUNTA / 2) * ux,
  };
  return {
    curva: `M ${desde.x} ${desde.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${hasta.x} ${hasta.y}`,
    punta: `M ${hasta.x} ${hasta.y} L ${izq.x} ${izq.y} L ${der.x} ${der.y} Z`,
  };
}

// Conexiones de la cosa tocada, sobre la vista (no recibe toques).
export default function CapaConexiones({
  flechas,
}: {
  flechas: { desde: P; hasta: P }[];
}) {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      {flechas.map((f, k) => {
        const { curva, punta } = flecha(f.desde, f.hasta);
        return [
          <Path
            key={`c${k}`}
            d={curva}
            fill="none"
            stroke={color.primary}
            strokeWidth={1.8}
          />,
          <Path key={`p${k}`} d={punta} fill={color.primary} />,
        ];
      })}
    </Svg>
  );
}
