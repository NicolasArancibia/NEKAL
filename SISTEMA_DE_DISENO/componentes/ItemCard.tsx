import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Item, displayDate, passive } from "../../utils/model";
import { color, size, space } from "../../styles/theme";
import { Card, IconBadge, ProgressBar, Tag, Txt } from "./base";

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
  const done = item.status === "completado",
    stepsDone = item.steps.filter((st) => st.done).length;
  return (
    <Card onPress={onPress} accessibilityLabel={`Abrir ${item.title}`}>
      <View
        style={{ flexDirection: "row", alignItems: "center", gap: space.md }}
      >
        <IconBadge name={typeIcons[item.type]} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt
            weight={700}
            numberOfLines={1}
            strike={done}
            tone={done ? "done" : "ink"}
          >
            {item.title}
          </Txt>
          <Txt variant="callout" tone="secondary" numberOfLines={1}>
            {item.type}
            {passive(item) ? "" : ` · ${item.status}`}
            {item.scheduledAt || item.dueAt
              ? ` · ${displayDate(item.scheduledAt || item.dueAt)}${item.scheduledAt ? "" : " (límite)"}`
              : ""}
          </Txt>
        </View>
        <Ionicons
          name="chevron-forward-outline"
          size={size.icon}
          color={color.inkSecondary}
        />
      </View>
      {item.type === "Goal" && item.steps.length > 0 && (
        <View style={{ gap: space.xs }}>
          <Txt variant="caption" tone="secondary">
            {stepsDone}/{item.steps.length} hitos
          </Txt>
          <ProgressBar
            value={stepsDone / item.steps.length}
            accessibilityLabel={`${stepsDone} de ${item.steps.length} hitos`}
          />
        </View>
      )}
      {!passive(item) && item.priority === "urgente" && (
        <Tag text="Urgente" tone="danger" />
      )}
    </Card>
  );
}
