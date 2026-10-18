import React, { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../utils/AppContext";
import {
  Item,
  ItemType,
  TYPES,
  localDay,
  newItem,
  passive,
} from "../utils/model";
import { timedItems } from "../utils/espacio";
import { hhmm, timeOn } from "../utils/neka";
import { useToggleDone } from "../utils/useToggleDone";
import { color, radius, size, space as spacing } from "../styles/theme";
import {
  Button,
  Card,
  Chip,
  Disclosure,
  EmptyState,
  ListRow,
  PressableScale,
  ScreenHeader,
  Toggle,
  Txt,
} from "../components/ui/base";
import ItemEditor from "../components/ui/ItemEditor";

const capital = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
export default function Calendario() {
  const { data } = useApp();
  const { toggle, error } = useToggleDone();
  const [month, setMonth] = useState(
      () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    ),
    [selected, setSelected] = useState(localDay()),
    [space, setSpace] = useState("all"),
    [type, setType] = useState<ItemType | null>(null),
    [completed, setCompleted] = useState(false),
    [editor, setEditor] = useState<Item | null>(null),
    // Lo completado en esta visita sigue visible (tachado) aunque el filtro oculte completados.
    [justDone, setJustDone] = useState<string[]>([]);
  useEffect(() => setJustDone([]), [selected]);
  const items = timedItems(data).filter(
    (i) =>
      (space === "all" || i.workspaceId === space) &&
      (!type || i.type === type) &&
      (completed || i.status !== "completado" || justDone.includes(i.id)),
  );
  const onDay = (i: Item, day: string) =>
    [i.scheduledAt, i.dueAt]
      .filter(Boolean)
      .some((date) => localDay(new Date(date)) === day) ||
    (!i.scheduledAt && !i.dueAt && i.startDate === day);
  const dayItems = items
    .filter((i) => onDay(i, selected))
    .sort((a, b) => timeOn(a, selected).localeCompare(timeOn(b, selected)));
  const offset = (month.getDay() + 6) % 7,
    days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from(
    { length: Math.ceil((offset + days) / 7) * 7 },
    (_, n) => n - offset + 1,
  );
  const move = (delta: number) =>
    setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));
  const add = () => {
    const i = newItem(space === "all" ? "general" : space);
    setEditor({
      ...i,
      startDate: selected,
      scheduledAt: new Date(selected + "T09:00:00").toISOString(),
    });
  };
  const today = localDay();
  const arrow = {
    width: size.minTouch,
    height: size.minTouch,
    alignItems: "center",
    justifyContent: "center",
  } as const;
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: color.background }}
      contentContainerStyle={{
        padding: spacing.screen,
        paddingBottom: spacing.xxxl,
        gap: spacing.lg,
        width: "100%",
        maxWidth: 960,
        alignSelf: "center",
      }}
    >
      <ScreenHeader
        title="Calendario"
        right={
          <Button
            title="Hoy"
            small
            variant="secondary"
            onPress={() => {
              setMonth(
                new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              );
              setSelected(today);
            }}
          />
        }
      />
      <Card>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <PressableScale
            accessibilityLabel="Mes anterior"
            onPress={() => move(-1)}
            style={arrow}
          >
            <Ionicons
              name="chevron-back-outline"
              size={size.icon}
              color={color.primary}
            />
          </PressableScale>
          <Txt variant="headline">
            {capital(
              month.toLocaleDateString("es-CL", {
                month: "long",
                year: "numeric",
              }),
            )}
          </Txt>
          <PressableScale
            accessibilityLabel="Mes siguiente"
            onPress={() => move(1)}
            style={arrow}
          >
            <Ionicons
              name="chevron-forward-outline"
              size={size.icon}
              color={color.primary}
            />
          </PressableScale>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            gap: spacing.sm,
            paddingVertical: spacing.xs,
          }}
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
            <Txt
              key={i}
              variant="caption"
              tone="secondary"
              align="center"
              style={{ width: "14.2857%" }}
            >
              {d}
            </Txt>
          ))}
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {cells.map((day, index) => {
            if (day < 1 || day > days)
              return (
                <View
                  key={`empty-${index}`}
                  style={{ width: "14.2857%", height: 52 }}
                />
              );
            const date = localDay(
                new Date(month.getFullYear(), month.getMonth(), day),
              ),
              count = items.filter((i) => onDay(i, date)).length,
              isSelected = selected === date,
              isToday = date === today;
            return (
              <PressableScale
                key={day}
                accessibilityLabel={`${day}, ${count} ${count === 1 ? "ítem" : "ítems"}${isToday ? ", hoy" : ""}`}
                accessibilityState={{ selected: isSelected }}
                onPress={() => setSelected(date)}
                style={{
                  width: "14.2857%",
                  height: 52,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                }}
              >
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: radius.pill,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isSelected ? color.primary : undefined,
                  }}
                >
                  <Txt
                    weight={isSelected || isToday ? 700 : 500}
                    tone={
                      isSelected ? "onPrimary" : isToday ? "primary" : "ink"
                    }
                    tabular
                  >
                    {day}
                  </Txt>
                </View>
                <View style={{ flexDirection: "row", gap: 2, height: 4 }}>
                  {Array.from({ length: Math.min(count, 3) }, (_, i) => (
                    <View
                      key={i}
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: radius.pill,
                        backgroundColor: color.primary,
                      }}
                    />
                  ))}
                </View>
              </PressableScale>
            );
          })}
        </View>
      </Card>
      <Disclosure title="Filtros">
        <View
          style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}
        >
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
      </Disclosure>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.md,
        }}
      >
        <View style={{ flex: 1 }}>
          <Txt variant="headline">
            {capital(
              new Date(selected + "T12:00:00").toLocaleDateString("es-CL", {
                weekday: "long",
                day: "numeric",
                month: "long",
              }),
            ).replace(",", "")}
          </Txt>
          <Txt variant="caption" tone="secondary">
            {dayItems.length} {dayItems.length === 1 ? "ítem" : "ítems"}
          </Txt>
        </View>
        <Button title="Añadir" small variant="plain" onPress={add} />
      </View>
      {!!error && (
        <Txt variant="caption" tone="danger" accessibilityRole="alert">
          {error}
        </Txt>
      )}
      {dayItems.length > 0 ? (
        <View>
          {dayItems.map((i) => {
            const time = timeOn(i, selected);
            return (
              <ListRow
                key={i.id}
                title={i.title}
                time={time ? hhmm(time) : undefined}
                dotColor={
                  data.workspaces.find((w) => w.id === i.workspaceId)?.color ??
                  color.primary
                }
                done={i.status === "completado"}
                onPress={() => setEditor(i)}
                onToggle={
                  passive(i)
                    ? undefined
                    : () => {
                        if (i.status !== "completado")
                          setJustDone((ids) => [...ids, i.id]);
                        toggle(i);
                      }
                }
              />
            );
          })}
        </View>
      ) : (
        <EmptyState
          pose={3}
          text="Nada para este día."
          action={{ label: "Añadir", onPress: add }}
        />
      )}
      <Txt variant="caption" tone="secondary">
        Lo que no tiene hora aparece en su fecha de inicio.
      </Txt>
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
