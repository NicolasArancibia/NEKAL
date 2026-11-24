import type { ReactNode } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import { color, radius, shadow, space } from "../../../styles/theme";
import PressableScale from "./PressableScale";

// Superficie base. "featured" usa lavanda sólido (sin degradado, ver plan A).
export default function Card({
  children,
  variant = "plain",
  onPress,
  style,
  accessibilityLabel,
}: {
  children: ReactNode;
  variant?: "plain" | "featured";
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const base: ViewStyle =
    variant === "featured"
      ? {
          backgroundColor: color.primarySoft,
          borderRadius: radius.lg,
          padding: space.lg,
          gap: space.md,
        }
      : {
          backgroundColor: color.surface,
          borderRadius: radius.md,
          padding: space.lg,
          gap: space.md,
          boxShadow: shadow.card,
        };
  if (onPress)
    return (
      <PressableScale
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        style={[base, style]}
      >
        {children}
      </PressableScale>
    );
  return <View style={[base, style]}>{children}</View>;
}
