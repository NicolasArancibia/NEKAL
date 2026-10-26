import type { ReactNode } from "react";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";

// Anillo de avance con algo al centro (mesas y medallas bloqueadas). Es el mismo
// lenguaje que el anillo de nivel del Resumen.
export default function Anillo({
  size,
  grosor,
  avance,
  color,
  riel,
  children,
}: {
  size: number;
  grosor: number;
  avance: number;
  color: string;
  riel: string;
  children?: ReactNode;
}) {
  const r = (size - grosor) / 2,
    c = 2 * Math.PI * r,
    a = Math.min(1, Math.max(0, avance));
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={riel}
          strokeWidth={grosor}
          fill="none"
        />
        {a > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={grosor}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${c} ${c}`}
            strokeDashoffset={c * (1 - a)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </Svg>
      {children}
    </View>
  );
}
