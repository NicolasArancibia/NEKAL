import type { ReactNode } from "react";
import {
  AccessibilityRole,
  AccessibilityState,
  Pressable,
  StyleProp,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { motion } from "../../../styles/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Respuesta al toque: se achica levemente con un resorte (o baja la opacidad si
// el sistema pide reducir movimiento).
export default function PressableScale({
  onPress,
  disabled,
  style,
  hitSlop,
  children,
  accessibilityRole = "button",
  accessibilityLabel,
  accessibilityState,
  accessibilityHint,
  onLongPress,
  onPressOut,
}: {
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  hitSlop?: number;
  children: ReactNode;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityState?: AccessibilityState;
  accessibilityHint?: string;
  // Mantener apretado (p. ej., la pestaña Neka graba) y soltar.
  onLongPress?: () => void;
  onPressOut?: () => void;
}) {
  const reduced = useReducedMotion();
  const pressed = useSharedValue(0);
  const animated = useAnimatedStyle(() =>
    reduced
      ? { opacity: pressed.value ? 0.85 : 1 }
      : {
          transform: [
            {
              scale: withSpring(
                pressed.value ? motion.pressScale : 1,
                motion.snappy,
              ),
            },
          ],
        },
  );
  return (
    <AnimatedPressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, ...accessibilityState }}
      // aria-* además de accessibilityState: react-native-web solo expone estas.
      aria-checked={
        typeof accessibilityState?.checked === "boolean"
          ? accessibilityState.checked
          : undefined
      }
      aria-selected={accessibilityState?.selected}
      aria-expanded={accessibilityState?.expanded}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={onLongPress ? 300 : undefined}
      onPressIn={() => {
        pressed.value = 1;
      }}
      onPressOut={() => {
        pressed.value = 0;
        onPressOut?.();
      }}
      style={[style, animated]}
    >
      {children}
    </AnimatedPressable>
  );
}
