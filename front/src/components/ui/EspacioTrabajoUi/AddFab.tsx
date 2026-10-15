import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../styles/globalStyles";
export default function AddFab({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Crear ítem"
      onPress={onPress}
      style={{
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 6px 16px #C7B5EA",
      }}
    >
      <Ionicons name="add" size={28} color="white" />
    </Pressable>
  );
}
