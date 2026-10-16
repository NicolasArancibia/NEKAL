import type { ReactNode } from "react";
import { AccessibilityRole, StyleProp, Text, TextStyle } from "react-native";
import { color, font, type, TypeVariant, Weight } from "../../../styles/theme";

export type TxtTone =
  "ink" | "secondary" | "primary" | "danger" | "done" | "onPrimary";

const tones: Record<TxtTone, string> = {
  ink: color.ink,
  secondary: color.inkSecondary,
  primary: color.primary,
  danger: color.danger,
  done: color.inkDone,
  onPrimary: color.onPrimary,
};

// Único componente que dibuja texto: aplica la escala tipográfica del tema.
export default function Txt({
  variant = "body",
  tone = "ink",
  weight,
  align,
  numberOfLines,
  strike = false,
  tabular = false,
  style,
  children,
  accessibilityRole,
  accessibilityLabel,
}: {
  variant?: TypeVariant;
  tone?: TxtTone;
  weight?: Weight;
  align?: "left" | "center" | "right";
  numberOfLines?: number;
  strike?: boolean;
  tabular?: boolean;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
}) {
  const t = type[variant];
  return (
    <Text
      numberOfLines={numberOfLines}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          fontFamily: font[weight ?? t.weight],
          fontSize: t.size,
          lineHeight: t.lineHeight,
          letterSpacing: t.letterSpacing,
          color: tones[tone],
          textAlign: align,
          textDecorationLine: strike ? "line-through" : "none",
          fontVariant: tabular ? ["tabular-nums"] : undefined,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
