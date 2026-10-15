import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useApp } from "../utils/AppContext";
import {
  Item,
  ItemType,
  TYPES,
  activeItems,
  localDay,
  newItem,
} from "../utils/model";
import { colors, s } from "../styles/globalStyles";
import { Button, Chip, Empty, Toggle } from "../components/ui/Common";
import ItemCard from "../components/ui/ItemCard";
import ItemEditor from "../components/ui/ItemEditor";
export default function Calendario() {
  const { data } = useApp();
  const [month, setMonth] = useState(
      () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    ),
    [selected, setSelected] = useState(localDay()),
    [space, setSpace] = useState("all"),
    [type, setType] = useState<ItemType | null>(null),
    [completed, setCompleted] = useState(false),
    [filters, setFilters] = useState(false),
    [editor, setEditor] = useState<Item | null>(null);
  const items = activeItems(data).filter(
    (i) =>
      (space === "all" || i.workspaceId === space) &&
      (!type || i.type === type) &&
      (completed || i.status !== "completado"),
  );
  const onDay = (i: Item, day: string) =>
    [i.scheduledAt, i.dueAt]
      .filter(Boolean)
      .some((date) => localDay(new Date(date)) === day) ||
    (!i.scheduledAt && !i.dueAt && i.startDate === day);
  const dayItems = items
    .filter((i) => onDay(i, selected))
    .sort((a, b) =>
      (a.scheduledAt || a.dueAt).localeCompare(b.scheduledAt || b.dueAt),
    );
  const offset = (month.getDay() + 6) % 7,
    days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from(
    { length: Math.ceil((offset + days) / 7) * 7 },
    (_, n) => n - offset + 1,
  );
  const move = (delta: number) =>
    setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));
  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <View style={s.between}>
        <Text style={s.title}>Tu calendario</Text>
        <Button
          title="Hoy"
          small
          secondary
          onPress={() => {
            setMonth(
              new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            );
            setSelected(localDay());
          }}
        />
      </View>
      <Text style={s.subtitle}>Una mirada tranquila a lo que viene.</Text>
      <View style={[s.card, { padding: 14 }]}>
        <View style={s.between}>
          <Button title="‹" small secondary onPress={() => move(-1)} />
          <Text style={s.heading}>
            {month.toLocaleDateString("es-CL", {
              month: "long",
              year: "numeric",
            })}
          </Text>
          <Button title="›" small secondary onPress={() => move(1)} />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 7 }}
        >
          <Chip
            title="Todos"
            selected={space === "all"}
            onPress={() => setSpace("all")}
          />
          {data.workspaces.map((w) => (
            <Chip
              key={w.id}
              title={w.name}
              selected={space === w.id}
              onPress={() => setSpace(w.id)}
            />
          ))}
        </ScrollView>
        <View style={{ flexDirection: "row" }}>
          {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
            <Text
              key={i}
              style={[s.small, { width: "14.2857%", textAlign: "center" }]}
            >
              {d}
            </Text>
          ))}
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {cells.map((day, index) => {
            if (day < 1 || day > days)
              return (
                <View
                  key={`empty-${index}`}
                  style={{ width: "14.2857%", height: 64 }}
                />
              );
            const date = localDay(
                new Date(month.getFullYear(), month.getMonth(), day),
              ),
              count = items.filter((i) => onDay(i, date)).length,
              isSelected = selected === date;
            return (
              <Pressable
                key={day}
                accessibilityRole="button"
                accessibilityLabel={`${date}, ${count} ítems`}
                accessibilityState={{ selected: isSelected }}
                onPress={() => setSelected(date)}
                style={{ width: "14.2857%", height: 64, padding: 3 }}
              >
                <View
                  style={{
                    flex: 1,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                    backgroundColor: isSelected
                      ? colors.primary
                      : date === localDay()
                        ? colors.lavender
                        : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: isSelected ? "white" : colors.ink,
                    }}
                  >
                    {day}
                  </Text>
                  {count > 0 && (
                    <View style={{ flexDirection: "row", gap: 2 }}>
                      {Array.from({ length: Math.min(count, 3) }, (_, i) => (
                        <View
                          key={i}
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: isSelected
                              ? "white"
                              : colors.primary,
                          }}
                        />
                      ))}
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
      <Button
        title={filters ? "Ocultar filtros" : "Filtrar tipos y completados"}
        secondary
        small
        onPress={() => setFilters(!filters)}
      />
      {filters && (
        <View style={s.card}>
          <View style={s.wrap}>
            <Chip
              title="Todos los tipos"
              selected={!type}
              onPress={() => setType(null)}
            />
            {TYPES.map((t) => (
              <Chip
                key={t}
                title={t}
                selected={type === t}
                onPress={() => setType(t)}
              />
            ))}
          </View>
          <Toggle
            label="Mostrar completados"
            value={completed}
            onChange={setCompleted}
          />
        </View>
      )}
      <View style={s.between}>
        <View>
          <Text style={s.heading}>
            {new Date(selected + "T12:00:00").toLocaleDateString("es-CL", {
              weekday: "long",
              day: "numeric",
              month: "short",
            })}
          </Text>
          <Text style={s.small}>{dayItems.length} ítems · hora local</Text>
        </View>
        <Button
          title="Añadir"
          small
          onPress={() => {
            const i = newItem(space === "all" ? "general" : space);
            setEditor({
              ...i,
              startDate: selected,
              scheduledAt: new Date(selected + "T09:00:00").toISOString(),
            });
          }}
        />
      </View>
      {dayItems.map((i) => (
        <ItemCard key={i.id} item={i} onPress={() => setEditor(i)} />
      ))}
      {!dayItems.length && (
        <Empty
          title="Espacio para respirar"
          detail="No hay ítems para este día con los filtros actuales."
        />
      )}
      <Text style={s.small}>
        Los ítems sin horario ni límite aparecen en su fecha de inicio y no
        reservan tiempo.
      </Text>
      {editor && (
        <ItemEditor
          key={editor.id}
          item={editor}
          onClose={() => setEditor(null)}
        />
      )}
    </ScrollView>
  );
}
