import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { TabParamList } from "../navigation/TabNavigator";
import { useApp } from "../utils/AppContext";
import { Item, newItem, totalPoints } from "../utils/model";
import { findConflicts } from "../utils/planner";
import {
  NekaAction,
  hhmm,
  nekaState,
  nextItem,
  timeUntil,
  todayItems,
  todayTime,
  visibleToday,
} from "../utils/neka";
import { useToggleDone } from "../utils/useToggleDone";
import { color, size, space } from "../styles/theme";
import {
  Button,
  Card,
  IconBadge,
  LevelRing,
  ListRow,
  NekaCard,
  ProgressBar,
  ScreenHeader,
  Txt,
} from "../components/ui/base";
import { typeIcons } from "../components/ui/ItemCard";
import ItemEditor from "../components/ui/ItemEditor";

function SectionTitle({ title, detail }: { title: string; detail?: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: space.md,
        marginTop: space.sm,
      }}
    >
      <Txt variant="headline">{title}</Txt>
      {!!detail && (
        <Txt variant="callout" tone="secondary">
          {detail}
        </Txt>
      )}
    </View>
  );
}

export default function Resumen() {
  const { data } = useApp();
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const [editor, setEditor] = useState<Item | null>(null);
  const { toggle, error } = useToggleDone();
  const now = Date.now();
  const points = totalPoints(data),
    level = Math.floor(points / 100) + 1;
  const neka = nekaState(data, now),
    next = nextItem(data, now),
    today = todayItems(data, now),
    done = today.filter((i) => i.status === "completado").length;
  const clashing = new Set(
    findConflicts(data, now)
      .filter((c) => c.kind === "overlap")
      .flatMap((c) => c.itemIds),
  );
  const space_ = (id: string) => data.workspaces.find((w) => w.id === id);
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekPoints = data.rewards
    .filter(
      (r) =>
        !r.key.endsWith(":budget") && Date.parse(r.at) >= weekStart.getTime(),
    )
    .reduce((n, r) => n + r.points, 0);
  const name = data.profile.name.trim().split(" ")[0];

  const onNeka = (a: NekaAction) => {
    if (a.target === "chat") navigation.navigate("Chat");
    else if (a.target === "crear") setEditor(newItem());
    else {
      const item = data.items.find((i) => i.id === a.itemId);
      if (item) setEditor(item);
    }
  };

  const nextLine = (item: Item) => {
    const start = todayTime(item, now);
    const range =
      start === item.scheduledAt && item.duration > 0
        ? ` – ${hhmm(new Date(Date.parse(start) + item.duration * 60000).toISOString())}`
        : "";
    return `${hhmm(start)}${range} · ${space_(item.workspaceId)?.name ?? ""}`;
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: color.background }}
      contentContainerStyle={{
        padding: space.screen,
        paddingBottom: space.xxxl,
        gap: space.md,
        width: "100%",
        maxWidth: 960,
        alignSelf: "center",
      }}
    >
      <ScreenHeader
        showDate
        title={name ? `Hola, ${name}` : "Hola"}
        right={<LevelRing level={level} progress={(points % 100) / 100} />}
      />
      <NekaCard state={neka} onAction={onNeka} />

      {next && (
        <>
          <SectionTitle
            title="Lo siguiente"
            detail={timeUntil(now, Date.parse(todayTime(next, now)))}
          />
          <Card
            onPress={() => setEditor(next)}
            accessibilityLabel={`Abrir ${next.title}`}
            style={{ flexDirection: "row", alignItems: "center" }}
          >
            <IconBadge name={typeIcons[next.type]} />
            <View style={{ flex: 1, gap: 2 }}>
              <Txt variant="headline" numberOfLines={1}>
                {next.title}
              </Txt>
              <Txt variant="callout" tone="secondary" numberOfLines={1}>
                {nextLine(next)}
              </Txt>
            </View>
          </Card>
        </>
      )}

      {today.length > 0 && (
        <>
          <SectionTitle
            title="Hoy"
            detail={`${done} de ${today.length} listo`}
          />
          {!!error && (
            <Txt variant="caption" tone="danger" accessibilityRole="alert">
              {error}
            </Txt>
          )}
          <View>
            {visibleToday(today, now, size.todayLimit).map((item) => (
              <ListRow
                key={item.id}
                title={item.title}
                time={hhmm(todayTime(item, now))}
                dotColor={space_(item.workspaceId)?.color ?? color.primary}
                done={item.status === "completado"}
                tag={
                  clashing.has(item.id)
                    ? { text: "Choca", tone: "danger" }
                    : undefined
                }
                onPress={() => setEditor(item)}
                onToggle={() => toggle(item)}
              />
            ))}
          </View>
          {today.length > size.todayLimit && (
            <View style={{ alignSelf: "flex-start" }}>
              <Button
                title={`Ver ${today.length - size.todayLimit} más`}
                variant="plain"
                small
                onPress={() => navigation.navigate("Calendario")}
              />
            </View>
          )}
        </>
      )}

      <SectionTitle title="Progreso" />
      <Card>
        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            justifyContent: "space-between",
          }}
        >
          <Txt variant="headline">Nivel {level}</Txt>
          <Txt variant="callout" tone="secondary">
            {points} pts
          </Txt>
        </View>
        <ProgressBar
          value={(points % 100) / 100}
          accessibilityLabel={`Avance al nivel ${level + 1}`}
        />
        <Txt variant="caption" tone="secondary">
          {100 - (points % 100)} pts para el nivel {level + 1} · {weekPoints}{" "}
          esta semana
        </Txt>
      </Card>

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
