// Adaptador temporal hacia components/ui/base (plan A, Task 3). Se elimina al
// terminar la migración de pantallas (Task 12).
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { color, space } from "../../styles/theme";
import * as base from "./base";
export function Button({
  title,
  onPress,
  secondary = false,
  danger = false,
  disabled = false,
  small = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  small?: boolean;
}) {
  return (
    <base.Button
      title={title}
      onPress={onPress}
      variant={danger ? "danger" : secondary ? "secondary" : "primary"}
      disabled={disabled}
      small={small}
    />
  );
}
export const Chip = base.Chip;
export const Field = base.Field;
export const Toggle = base.Toggle;
export const Sheet = base.Sheet;
export function Empty({ title, detail }: { title: string; detail: string }) {
  return (
    <base.Card>
      <base.Txt variant="headline">{title}</base.Txt>
      <base.Txt tone="secondary">{detail}</base.Txt>
    </base.Card>
  );
}
export function Loading() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: color.background,
        justifyContent: "center",
        alignItems: "center",
        gap: space.lg,
      }}
    >
      <ActivityIndicator color={color.primary} />
      <base.Txt tone="secondary">Cargando…</base.Txt>
    </View>
  );
}
