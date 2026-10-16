import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { color, radius, size } from "../../../styles/theme";

// Ícono de línea violeta sobre cuadrado lavanda (regla de íconos del sistema).
export default function IconBadge({
  name,
}: {
  name: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={{
        width: 42,
        height: 42,
        borderRadius: radius.badge,
        backgroundColor: color.primarySoft,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={name} size={size.icon} color={color.primary} />
    </View>
  );
}
