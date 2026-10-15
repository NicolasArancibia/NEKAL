import React, { useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { TabParamList } from "../navigation/TabNavigator";
import { useApp } from "../utils/AppContext";
import {
  Item,
  activeItems,
  localDay,
  newItem,
  passive,
  totalPoints,
} from "../utils/model";
import { findConflicts } from "../utils/planner";
import { colors, s } from "../styles/globalStyles";
import { Button, Empty } from "../components/ui/Common";
import ItemCard from "../components/ui/ItemCard";
import ItemEditor from "../components/ui/ItemEditor";
export default function Resumen() {
  const { data } = useApp();
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const [editor, setEditor] = useState<Item | null>(null);
  const items = activeItems(data),
    actionable = items.filter((i) => !passive(i)),
    conflicts = findConflicts(data),
    points = totalPoints(data),
    level = Math.floor(points / 100) + 1;
  const today = localDay(),
    hour = new Date().getHours(),
    greeting =
      hour < 12 ? "Buenos días" : hour < 20 ? "Buenas tardes" : "Buenas noches";
  const priorities = actionable
    .filter((i) => i.status !== "completado")
    .sort((a, b) => {
      const rank = { urgente: 0, media: 1, baja: 2 };
      return (
        rank[a.priority] - rank[b.priority] ||
        (a.scheduledAt || a.dueAt || "z").localeCompare(
          b.scheduledAt || b.dueAt || "z",
        )
      );
    })
    .slice(0, 4);
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekPoints = data.rewards
    .filter(
      (r) =>
        !r.key.endsWith(":budget") && Date.parse(r.at) >= weekStart.getTime(),
    )
    .reduce((n, r) => n + r.points, 0);
  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <View style={s.between}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={s.small}>
            {new Date().toLocaleDateString("es-CL", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </Text>
          <Text style={s.title}>
            {greeting}
            {data.profile.name ? `, ${data.profile.name.split(" ")[0]}` : ""}
          </Text>
          <Text style={s.subtitle}>
            {conflicts.length
              ? `${conflicts.length} conflictos necesitan tu atención.`
              : "Un paso a la vez. Haz espacio para lo importante."}
          </Text>
        </View>
        <Image
          source={require("../../assets/Img/Neka_Pose2.png")}
          style={{ width: 80, height: 95 }}
          resizeMode="contain"
        />
      </View>
      <View
        style={[s.card, { backgroundColor: "#F0E8FF", borderColor: "#E4D6FF" }]}
      >
        <View style={s.between}>
          <View>
            <Text
              style={[s.small, { color: colors.primary, fontWeight: "700" }]}
            >
              TU CAMINO CON NEKA
            </Text>
            <Text style={[s.title, { color: colors.primary, marginTop: 6 }]}>
              {points} puntos
            </Text>
          </View>
          <View
            style={{ backgroundColor: "white", padding: 14, borderRadius: 18 }}
          >
            <Text style={[s.heading, { color: colors.primary }]}>
              Nivel {level}
            </Text>
          </View>
        </View>
        <View
          style={{
            height: 7,
            borderRadius: 8,
            backgroundColor: "#DDD0F7",
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${points % 100}%`,
              height: 7,
              backgroundColor: colors.primary,
              borderRadius: 8,
            }}
          />
        </View>
        <Text style={s.small}>
          {100 - (points % 100)} puntos para el siguiente nivel · {weekPoints}{" "}
          esta semana
        </Text>
      </View>
      <View style={s.between}>
        <Text style={s.heading}>Progreso por espacio</Text>
        <Text style={s.small}>
          {actionable.filter((i) => i.status === "completado").length}/
          {actionable.length} completados
        </Text>
      </View>
      <View style={s.card}>
        {data.workspaces.map((w) => {
          const group = actionable.filter((i) => i.workspaceId === w.id),
            done = group.reduce(
              (n, i) =>
                n +
                (i.status === "completado"
                  ? 1
                  : i.type === "Goal" && i.steps.length
                    ? i.steps.filter((st) => st.done).length / i.steps.length
                    : 0),
              0,
            ),
            pct = group.length ? Math.round((done / group.length) * 100) : 0;
          return (
            <View key={w.id} style={{ gap: 8 }}>
              <View style={s.between}>
                <Text style={s.text}>{w.name}</Text>
                <Text style={[s.small, { color: colors.primary }]}>{pct}%</Text>
              </View>
              <View
                style={{
                  height: 6,
                  backgroundColor: colors.lavender,
                  borderRadius: 5,
                }}
              >
                <View
                  style={{
                    width: `${pct}%`,
                    height: 6,
                    backgroundColor: w.color,
                    borderRadius: 5,
                  }}
                />
              </View>
            </View>
          );
        })}
      </View>
      <View style={s.between}>
        <Text style={s.heading}>Prioridades</Text>
        <Button
          title="Ver calendario"
          secondary
          small
          onPress={() => navigation.navigate("Calendario")}
        />
      </View>
      {priorities.map((i) => (
        <ItemCard key={i.id} item={i} onPress={() => setEditor(i)} />
      ))}
      {!priorities.length && (
        <Empty
          title={items.length ? "Todo al día" : "Comienza con algo pequeño"}
          detail={
            items.length
              ? "No tienes compromisos pendientes. Puedes guardar una nueva idea."
              : "Crea tu primer ítem y Neka te ayudará a darle espacio."
          }
        />
      )}
      <Button
        title="Crear mi próximo ítem"
        onPress={() => setEditor(newItem())}
      />
      <View style={s.between}>
        <Text style={s.heading}>Tu planificación</Text>
        <Text style={s.small}>
          {
            actionable.filter(
              (i) =>
                i.scheduledAt && localDay(new Date(i.scheduledAt)) === today,
            ).length
          }{" "}
          para hoy
        </Text>
      </View>
      {conflicts.length ? (
        <View style={[s.card, { borderColor: "#F6CBDA" }]}>
          <Text style={[s.heading, { color: colors.red }]}>
            Hay algo que podemos reorganizar
          </Text>
          {conflicts.slice(0, 2).map((c) => (
            <Text key={c.id} style={s.text}>
              {c.description}
            </Text>
          ))}
          <Button
            title="Resolver con Neka"
            secondary
            onPress={() => navigation.navigate("Chat")}
          />
        </View>
      ) : (
        <View style={s.card}>
          <Text style={s.text}>Sin conflictos detectados</Text>
          <Text style={s.small}>
            Revisamos superposiciones, plazos y dependencias cada vez que
            cambias tus ítems.
          </Text>
        </View>
      )}
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
