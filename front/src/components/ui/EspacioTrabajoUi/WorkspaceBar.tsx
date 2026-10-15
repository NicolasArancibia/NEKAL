import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, s } from "../../../styles/globalStyles";
export default function WorkspaceBar({
  name,
  list,
  onToggle,
  onSelect,
  onAdd,
}: {
  name: string;
  list: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onAdd: () => void;
}) {
  return (
    <View style={[s.card, s.row, { padding: 8, borderRadius: 28 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={list ? "Ver mapa" : "Ver lista"}
        onPress={onToggle}
        style={{
          padding: 12,
          backgroundColor: colors.lavender,
          borderRadius: 22,
        }}
      >
        <Ionicons
          name={list ? "git-network-outline" : "list-outline"}
          size={20}
          color={colors.primary}
        />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Seleccionar espacio"
        onPress={onSelect}
        style={[
          s.between,
          {
            flex: 1,
            backgroundColor: "#EEE4FF",
            borderRadius: 22,
            padding: 12,
          },
        ]}
      >
        <Text
          numberOfLines={1}
          style={{ color: colors.primary, fontWeight: "700", flex: 1 }}
        >
          {name}
        </Text>
        <Ionicons name="chevron-down" color={colors.primary} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Gestionar espacios"
        onPress={onAdd}
        style={{
          padding: 12,
          backgroundColor: colors.primary,
          borderRadius: 24,
        }}
      >
        <Ionicons name="add" size={20} color="white" />
      </Pressable>
    </View>
  );
}
