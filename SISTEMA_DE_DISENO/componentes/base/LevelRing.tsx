import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { color } from "../../../styles/theme";
import Txt from "./Txt";

const SIZE = 44,
  STROKE = 4,
  R = (SIZE - STROKE) / 2,
  C = 2 * Math.PI * R;

// Nivel de la cuenta con su avance al siguiente.
export default function LevelRing({
  level,
  progress,
}: {
  level: number;
  progress: number;
}) {
  const ratio = Math.min(1, Math.max(0, progress));
  return (
    <View
      accessible
      accessibilityLabel={`Nivel ${level}`}
      style={{
        width: SIZE,
        height: SIZE,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={SIZE} height={SIZE} style={{ position: "absolute" }}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke={color.primarySoft}
          strokeWidth={STROKE}
          fill="none"
        />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke={color.primary}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${C} ${C}`}
          strokeDashoffset={C * (1 - ratio)}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </Svg>
      <Txt variant="caption" weight={800} tone="primary">
        {level}
      </Txt>
    </View>
  );
}
