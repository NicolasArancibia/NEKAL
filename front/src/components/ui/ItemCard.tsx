import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Item, displayDate, passive } from "../../utils/model";
import { colors, s } from "../../styles/globalStyles";
export const typeIcons: Record<Item["type"], keyof typeof Ionicons.glyphMap> = {
  Nota: "document-text-outline",
  Idea: "bulb-outline",
  Evento: "calendar-outline",
  Visita: "location-outline",
  Meeting: "people-outline",
  Deadline: "flag-outline",
  Goal: "trophy-outline",
  Tarea: "checkmark-circle-outline",
};
export default function ItemCard({
  item,
  onPress,
}: {
  item: Item;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${item.title}`}
      onPress={onPress}
      style={[s.card, { padding: 14 }]}
    >
      <View style={s.row}>
        <View
          style={{
            padding: 12,
            borderRadius: 14,
            backgroundColor: colors.lavender,
          }}
        >
          <Ionicons
            name={typeIcons[item.type]}
            size={20}
            color={colors.primary}
          />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text
            numberOfLines={2}
            style={[
              s.text,
              {
                fontWeight: "700",
                textDecorationLine:
                  item.status === "completado" ? "line-through" : "none",
              },
            ]}
          >
            {item.title}
          </Text>
          <Text style={s.small}>
            {item.type} · {passive(item) ? "Contenido" : item.status}
          </Text>
          {!!(item.scheduledAt || item.dueAt) && (
            <Text style={s.small}>
              {displayDate(item.scheduledAt || item.dueAt)}
              {item.scheduledAt ? ` · ${item.duration} min` : " · límite"}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.muted} />
      </View>
      {item.type === "Goal" && item.steps.length > 0 && (
        <View style={{ gap: 6 }}>
          <Text style={[s.small, { color: colors.primary }]}>
            {Math.round(
              (item.steps.filter((st) => st.done).length / item.steps.length) *
                100,
            )}
            % · {item.steps.filter((st) => st.done).length}/{item.steps.length}{" "}
            hitos
          </Text>
          <View
            style={{
              height: 5,
              borderRadius: 5,
              backgroundColor: colors.lavender,
            }}
          >
            <View
              style={{
                height: 5,
                borderRadius: 5,
                backgroundColor: colors.primary,
                width: `${(item.steps.filter((st) => st.done).length / item.steps.length) * 100}%`,
              }}
            />
          </View>
        </View>
      )}
      {!passive(item) && item.priority === "urgente" && (
        <Text style={[s.small, { color: colors.red }]}>Prioridad urgente</Text>
      )}
    </Pressable>
  );
}
