import { Ionicons } from "@expo/vector-icons";
import { color, radius, shadow } from "../../../styles/theme";
import { PressableScale } from "../base";

export default function AddFab({ onPress }: { onPress: () => void }) {
  return (
    <PressableScale
      accessibilityLabel="Crear ítem"
      onPress={onPress}
      style={{
        width: 56,
        height: 56,
        borderRadius: radius.pill,
        backgroundColor: color.primary,
        alignItems: "center",
        justifyContent: "center",
        boxShadow: shadow.raised,
      }}
    >
      <Ionicons name="add-outline" size={28} color={color.onPrimary} />
    </PressableScale>
  );
}
