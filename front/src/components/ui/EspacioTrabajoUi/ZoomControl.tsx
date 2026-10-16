// front/src/components/ui/ZoomControl.tsx
import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { color, radius, shadow, size, space } from "../../../styles/theme";
import { PressableScale, Txt } from "../base";

const round = {
  width: size.minTouch,
  height: size.minTouch,
  borderRadius: radius.pill,
  backgroundColor: color.primarySoft,
  alignItems: "center",
  justifyContent: "center",
} as const;

export default function ZoomControl({
  zoomLevel,
  onZoomIn,
  onZoomOut,
}: {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.sm,
        padding: space.xs,
        borderRadius: radius.pill,
        backgroundColor: color.surface,
        boxShadow: shadow.card,
      }}
    >
      <PressableScale
        accessibilityLabel="Alejar"
        onPress={onZoomOut}
        style={round}
      >
        <Ionicons
          name="remove-outline"
          size={size.icon}
          color={color.primary}
        />
      </PressableScale>
      <Txt weight={700} tabular align="center" style={{ minWidth: 44 }}>
        {Math.round(zoomLevel * 100)}%
      </Txt>
      <PressableScale
        accessibilityLabel="Acercar"
        onPress={onZoomIn}
        style={round}
      >
        <Ionicons name="add-outline" size={size.icon} color={color.primary} />
      </PressableScale>
    </View>
  );
}
