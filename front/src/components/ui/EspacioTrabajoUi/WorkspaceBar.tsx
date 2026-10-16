import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { color, radius, shadow, size, space } from "../../../styles/theme";
import { PressableScale, Txt } from "../base";

const round = {
  width: size.minTouch,
  height: size.minTouch,
  borderRadius: radius.pill,
  alignItems: "center",
  justifyContent: "center",
} as const;

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
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.sm,
        padding: space.sm,
        borderRadius: radius.pill,
        backgroundColor: color.surface,
        boxShadow: shadow.card,
      }}
    >
      <PressableScale
        accessibilityLabel={list ? "Ver mapa" : "Ver lista"}
        onPress={onToggle}
        style={[round, { backgroundColor: color.primarySoft }]}
      >
        <Ionicons
          name={list ? "git-network-outline" : "list-outline"}
          size={size.icon}
          color={color.primary}
        />
      </PressableScale>
      <PressableScale
        accessibilityLabel={`Espacio ${name}. Cambiar de espacio`}
        onPress={onSelect}
        style={{
          flex: 1,
          minHeight: size.minTouch,
          flexDirection: "row",
          alignItems: "center",
          gap: space.sm,
          paddingHorizontal: space.lg,
          borderRadius: radius.pill,
          backgroundColor: color.primarySoft,
        }}
      >
        <Txt weight={700} tone="primary" numberOfLines={1} style={{ flex: 1 }}>
          {name}
        </Txt>
        <Ionicons
          name="chevron-down-outline"
          size={size.icon}
          color={color.primary}
        />
      </PressableScale>
      <PressableScale
        accessibilityLabel="Gestionar espacios"
        onPress={onAdd}
        style={[round, { backgroundColor: color.primary }]}
      >
        <Ionicons name="add-outline" size={size.icon} color={color.onPrimary} />
      </PressableScale>
    </View>
  );
}
