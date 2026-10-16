import { ReactNode, useState } from "react";
import { View } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { color, motion, size, space } from "../../../styles/theme";
import PressableScale from "./PressableScale";
import Txt from "./Txt";

// Sección desplegable para explicaciones y opciones secundarias.
export default function Disclosure({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const chevron = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: withTiming(open ? "180deg" : "0deg", {
          duration: motion.fadeMs,
        }),
      },
    ],
  }));
  return (
    <View style={{ gap: space.md }}>
      <PressableScale
        onPress={() => setOpen(!open)}
        accessibilityLabel={title}
        accessibilityState={{ expanded: open }}
        style={{
          minHeight: size.minTouch,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: space.md,
        }}
      >
        <Txt weight={600} style={{ flex: 1 }}>
          {title}
        </Txt>
        <Animated.View style={chevron}>
          <Ionicons
            name="chevron-down-outline"
            size={size.icon}
            color={color.inkSecondary}
          />
        </Animated.View>
      </PressableScale>
      {open && (
        <Animated.View
          entering={FadeIn.duration(motion.fadeMs)}
          style={{ gap: space.md }}
        >
          {children}
        </Animated.View>
      )}
    </View>
  );
}
