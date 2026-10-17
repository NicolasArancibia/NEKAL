import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { color, radius, shadow, size } from "../../../styles/theme";
import { haptic } from "../../../utils/haptics";
import { PressableScale } from "../base";
import type { Vista } from "./useEspacioPrefs";

const OPCIONES: [Vista, keyof typeof Ionicons.glyphMap, string][] = [
  ["tiempo", "planet-outline", "Tiempo"],
  ["mesas", "cube-outline", "Mesas"],
  ["plano", "map-outline", "Plano"],
];

// Botón de 3 segmentos (B_SISTEMA_VISUAL §4): cápsula violeta suave; el activo,
// blanco con sombra.
export default function VistaSelector({
  vista,
  onCambio,
}: {
  vista: Vista;
  onCambio: (v: Vista) => void;
}) {
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: "row",
        backgroundColor: color.primarySoft,
        borderRadius: radius.pill,
        padding: 3,
      }}
    >
      {OPCIONES.map(([v, icono, nombre]) => {
        const activa = v === vista;
        return (
          <PressableScale
            key={v}
            onPress={() => {
              if (activa) return;
              haptic.selection();
              onCambio(v);
            }}
            accessibilityRole="tab"
            accessibilityLabel={nombre}
            accessibilityState={{ selected: activa }}
            hitSlop={5}
            style={{
              width: size.minTouch,
              height: 34,
              borderRadius: radius.pill,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: activa ? color.surface : "transparent",
              boxShadow: activa ? shadow.card : undefined,
            }}
          >
            <Ionicons
              name={icono}
              size={18}
              color={activa ? color.primary : color.lineStrong}
            />
          </PressableScale>
        );
      })}
    </View>
  );
}
