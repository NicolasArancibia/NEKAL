import React, { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { TabParamList } from "../navigation/TabNavigator";
import { useApp } from "../utils/AppContext";
import { Item, newItem } from "../utils/model";
import { miles } from "../utils/progreso/logros";
import { useProgreso } from "../utils/useProgreso";
import { findConflicts } from "../utils/planner";
import { aPapelera, siguientePregunta } from "../utils/atrasadas";
import { esImportante, estaAtrasada } from "../utils/espacio";
import { usePreguntadas } from "../utils/usePreguntadas";
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
import { useNow } from "../utils/useNow";
import { useNeka } from "../utils/NekaContext";
import { color, size, space } from "../styles/theme";
import {
  Button,
  Card,
  IconBadge,
  LevelRing,
  ListRow,
  NekaCard,
  PressableScale,
  ScreenHeader,
  SectionTitle,
  Txt,
} from "../components/ui/base";
import { typeIcons } from "../components/ui/ItemCard";
import ItemEditor from "../components/ui/ItemEditor";
import HojaAtrasadas from "../components/ui/espacio/HojaAtrasadas";
import TusDias from "../components/ui/progreso/TusDias";
import CurvaDesde from "../components/ui/progreso/CurvaDesde";

export default function Resumen() {
  const { data, change } = useApp();
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const [editor, setEditor] = useState<Item | null>(null);
  const { toggle, error } = useToggleDone();
  const now = useNow();
  const asistente = useNeka();
  const progreso = useProgreso(),
    level = progreso.nivel.nivel;
  // Neka pregunta por una cosa importante que se pasó: una a la vez, y no
  // vuelve a preguntar por ella el mismo día (spec H2 §4). Se queda en pantalla
  // mientras no la resuelvas.
  const { preguntadas, marcar, listo } = usePreguntadas();
  const [enPantalla, setEnPantalla] = useState<string | null>(null);
  const [verAtrasadas, setVerAtrasadas] = useState(false);
  const actual =
    data.items.find(
      (i) => i.id === enPantalla && estaAtrasada(i, now) && esImportante(i),
    ) ?? null;
  useEffect(() => {
    if (!listo || actual) return;
    const s = siguientePregunta(data, now, preguntadas);
    if (s) {
      setEnPantalla(s.id);
      marcar(s.id);
    } else if (enPantalla) setEnPantalla(null);
  }, [listo, actual?.id, data, now, preguntadas]);
  const neka = nekaState(data, now, actual),
    next = nextItem(data, now),
    today = todayItems(data, now),
    done = today.filter((i) => i.status === "completado").length;
  const clashing = new Set(
    findConflicts(data, now)
      .filter((c) => c.kind === "overlap")
      .flatMap((c) => c.itemIds),
  );
  const space_ = (id: string) => data.workspaces.find((w) => w.id === id);
  const name = data.profile.name.trim().split(" ")[0];

  const onNeka = (a: NekaAction) => {
    if (a.target === "chat") navigation.navigate("Chat");
    else if (a.target === "crear") setEditor(newItem());
    else if (a.target === "atrasadas") setVerAtrasadas(true);
    else {
      const item = data.items.find((i) => i.id === a.itemId);
      if (!item) return;
      if (a.target === "reprogramar")
        void asistente.enviar(
          `Reprograma «${item.title}» en el primer hueco libre`,
          "rapido",
        );
      else if (a.target === "hecha") toggle(item);
      else if (a.target === "soltar")
        change((d) => aPapelera(d, [item.id]).data);
      else setEditor(item);
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
        right={
          <PressableScale
            onPress={() => navigation.navigate("Perfil")}
            accessibilityRole="button"
            accessibilityLabel={`Nivel ${level}. Ver tu perfil`}
          >
            <LevelRing level={level} progress={progreso.nivel.avance} />
          </PressableScale>
        }
      />
      <NekaCard
        state={neka}
        onAction={onNeka}
        onMicIn={() => void asistente.empezarGrabar("rapido")}
        onMicOut={() => void asistente.soltar()}
        grabando={asistente.grabando}
      />

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

      <SectionTitle
        title="Tus días"
        detail={`+${miles(progreso.puntosSemana)} pts esta semana`}
      />
      <TusDias
        dias={progreso.semanas12}
        rachas={progreso.rachas}
        hoy={progreso.hoy}
      />

      <SectionTitle title="Desde el día 1" />
      <CurvaDesde desde={progreso.desde} hoy={progreso.hoy} />

      {verAtrasadas && (
        <HojaAtrasadas onCerrar={() => setVerAtrasadas(false)} />
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
