import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { color, motion, radius } from "../../../styles/theme";

// Barra gruesa y redondeada; el relleno se anima en píxeles para conservar las
// puntas redondas.
export default function ProgressBar({
  value,
  accessibilityLabel,
}: {
  value: number;
  accessibilityLabel: string;
}) {
  const reduced = useReducedMotion();
  const [track, setTrack] = useState(0);
  const width = useSharedValue(0);
  const ratio = Math.min(1, Math.max(0, value));
  useEffect(() => {
    width.value = reduced
      ? ratio * track
      : withSpring(ratio * track, motion.gentle);
  }, [ratio, track]);
  const fill = useAnimatedStyle(() => ({ width: width.value }));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(ratio * 100) }}
      onLayout={(e) => setTrack(e.nativeEvent.layout.width)}
      style={{
        height: 10,
        borderRadius: radius.pill,
        backgroundColor: color.primarySoft,
        overflow: "hidden",
      }}
    >
      <Animated.View
        style={[
          {
            height: 10,
            borderRadius: radius.pill,
            backgroundColor: color.primary,
          },
          fill,
        ]}
      />
    </View>
  );
}
