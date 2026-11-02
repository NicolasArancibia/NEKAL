import React, { useEffect, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { TabParamList } from "../navigation/TabNavigator";
import { useApp } from "../utils/AppContext";
import {
  Item,
  ItemType,
  TYPES,
  localDay,
  newItem,
  passive,
} from "../utils/model";
import { atrasadas, timedItems } from "../utils/espacio";
import { agenda } from "../utils/agenda";
import { hhmm, timeOn } from "../utils/neka";
import { useNeka } from "../utils/NekaContext";
import { useNow } from "../utils/useNow";
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
  SectionTitle,
  Segmentos,
  Toggle,
  Txt,
} from "../components/ui/base";
import ItemEditor from "../components/ui/ItemEditor";
import HojaAtrasadas from "../components/ui/espacio/HojaAtrasadas";
import PlanoVista from "../components/ui/espacio/PlanoVista";
import type { Destino } from "../utils/estructura";

type Modo = "mes" | "agenda" | "plano";
const MODOS: [Modo, string][] = [
  ["mes", "Mes"],
  ["agenda", "Agenda"],
  ["plano", "Plano"],
];
const CLAVE = "nekal:calendario";
const DIAS_AGENDA = 14;

const capital = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const diaLargo = (dia: string) =>
  capital(
    new Date(dia + "T12:00:00").toLocaleDateString("es-CL", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
  ).replace(",", "");
// «Hoy · Lunes 2 de noviembre»: hoy, mañana y ayer llevan su nombre.
function tituloDia(dia: string, now: number) {
  const t = new Date(now);
  const rel = (n: number) =>
    localDay(new Date(t.getFullYear(), t.getMonth(), t.getDate() + n));
  const nombre =
    dia === rel(0)
      ? "Hoy"
      : dia === rel(1)
        ? "Mañana"
        : dia === rel(-1)
          ? "Ayer"
          : "";
  return nombre ? `${nombre} · ${diaLargo(dia)}` : diaLargo(dia);
}

export default function Calendario({
  route,
  navigation,
}: BottomTabScreenProps<TabParamList, "Calendario">) {
  const { data } = useApp();
  const { toggle, error } = useToggleDone();
  const neka = useNeka();
  const now = useNow();
  const scroll = useRef<ScrollView>(null);
  const [verAtrasadas, setVerAtrasadas] = useState(false);
  const [modo, setModo] = useState<Modo>("mes"),
    [dias, setDias] = useState(DIAS_AGENDA),
    [month, setMonth] = useState(
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
  // El último modo se recuerda en este dispositivo (por defecto, Mes).
  useEffect(() => {
    AsyncStorage.getItem(CLAVE)
      .then((raw) => {
        const guardado = raw ? JSON.parse(raw).modo : "";
        if (MODOS.some(([m]) => m === guardado) && !route.params?.modo)
          setModo(guardado);
      })
      .catch(() => {});
  }, []);
  // «Ver dónde está» y los avisos del borde abren el Calendario en un modo (y,
  // en Plano, en su lugar). Los parámetros se consumen para no repetirse.
  const [planoDe, setPlanoDe] = useState<{
    destino: Destino | null;
    marcada: string;
  } | null>(null);
  useEffect(() => {
    const p = route.params;
    if (!p?.modo) return;
    setModo(p.modo);
    if (p.modo === "plano")
      setPlanoDe({ destino: p.destino ?? null, marcada: p.marcada ?? "" });
    navigation.setParams({
      modo: undefined,
      destino: undefined,
      marcada: undefined,
    } as never);
  }, [route.params?.modo, route.params?.destino, route.params?.marcada]);
  const cambiarModo = (m: Modo) => {
    setModo(m);
    if (m !== "plano") setPlanoDe(null);
    AsyncStorage.setItem(CLAVE, JSON.stringify({ modo: m })).catch(() => {});
  };

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
  const mesaDe = (id: string) => data.workspaces.find((w) => w.id === id);
  const atrasadasN = atrasadas(data, now).length;

  const irHoy = () => {
    if (modo === "agenda") scroll.current?.scrollTo({ y: 0, animated: true });
    else {
      setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
      setSelected(today);
    }
  };
  const encabezado = (
    <>
      <ScreenHeader
        title="Calendario"
        right={
          modo === "plano" ? undefined : (
            <Button title="Hoy" small variant="secondary" onPress={irHoy} />
          )
        }
      />
      <Segmentos opciones={MODOS} valor={modo} onCambio={cambiarModo} />
    </>
  );
  const chipsMesa = (
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
  );

  if (modo === "plano")
    return (
      <View style={{ flex: 1, backgroundColor: color.background }}>
        <View style={{ padding: spacing.screen, gap: spacing.lg }}>
          {encabezado}
        </View>
        <PlanoVista
          key={`${planoDe?.destino?.workspaceId}|${planoDe?.destino?.groupId}|${planoDe?.marcada}`}
          destino={planoDe?.destino}
          marcadaInicial={planoDe?.marcada}
        />
      </View>
    );

  const secciones = agenda(data, now, dias, space === "all" ? "" : space);
  const hayMas =
    agenda(data, now, dias + DIAS_AGENDA, space === "all" ? "" : space).length >
    secciones.length;

  return (
    <ScrollView
      ref={scroll}
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
      {encabezado}
      {modo === "agenda" ? (
        <>
          {chipsMesa}
          {atrasadasN > 0 && (
            <Card
              onPress={() => setVerAtrasadas(true)}
              accessibilityLabel={`${atrasadasN} atrasadas hace más de 2 días. Ver la lista`}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.md,
              }}
            >
              <Ionicons
                name="time-outline"
                size={size.icon - 4}
                color={color.inkSecondary}
              />
              <Txt variant="callout" style={{ flex: 1 }}>
                <Txt variant="callout" weight={700}>
                  {atrasadasN} atrasadas
                </Txt>{" "}
                hace más de 2 días
              </Txt>
              <Ionicons
                name="chevron-forward-outline"
                size={size.icon - 6}
                color={color.inkSecondary}
              />
            </Card>
          )}
          {!!error && (
            <Txt variant="caption" tone="danger" accessibilityRole="alert">
              {error}
            </Txt>
          )}
          {secciones.length ? (
            secciones.map((s) => {
              const pendientes = s.filas.filter((f) => !f.hecha).length;
              const hechas = s.filas.length - pendientes;
              return (
                <View key={s.dia} style={{ gap: spacing.xs }}>
                  <SectionTitle
                    title={tituloDia(s.dia, now)}
                    detail={
                      hechas
                        ? `${pendientes} pendientes · ${hechas} hechas`
                        : `${pendientes} ${pendientes === 1 ? "cosa" : "cosas"}`
                    }
                  />
                  {s.filas.map((f) => (
                    <ListRow
                      key={f.item.id}
                      title={f.item.title}
                      time={hhmm(f.inicio)}
                      detail={`hasta ${hhmm(f.fin)} · ${f.minutos} min · ${mesaDe(f.item.workspaceId)?.name ?? ""}`}
                      dotColor={
                        mesaDe(f.item.workspaceId)?.color ?? color.primary
                      }
                      done={f.hecha}
                      tag={
                        f.choca ? { text: "Choca", tone: "danger" } : undefined
                      }
                      onPress={() => setEditor(f.item)}
                      onToggle={
                        passive(f.item) ? undefined : () => toggle(f.item)
                      }
                    />
                  ))}
                  {s.filas.some((f) => f.choca) && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: spacing.sm,
                        padding: spacing.md,
                        borderRadius: radius.sm,
                        backgroundColor: color.primarySoft,
                      }}
                    >
                      <Ionicons
                        name="sparkles-outline"
                        size={size.icon - 4}
                        color={color.primary}
                      />
                      <Txt variant="callout" style={{ flex: 1 }}>
                        Hay cosas que se juntan este día.
                      </Txt>
                      <Button
                        title="Arreglar con Neka"
                        small
                        onPress={() =>
                          void neka.enviar(
                            `Arregla los choques del ${diaLargo(s.dia).toLowerCase()}`,
                            "rapido",
                          )
                        }
                      />
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            <EmptyState
              pose={3}
              text="No tienes nada agendado en los próximos días."
              action={{ label: "Añadir", onPress: add }}
            />
          )}
          {hayMas && (
            <View style={{ alignSelf: "flex-start" }}>
              <Button
                title={`Ver ${DIAS_AGENDA} días más`}
                variant="plain"
                small
                onPress={() => setDias(dias + DIAS_AGENDA)}
              />
            </View>
          )}
        </>
      ) : (
        <>
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
            {chipsMesa}
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
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: spacing.sm,
              }}
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
              <Txt variant="headline">{diaLargo(selected)}</Txt>
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
                    dotColor={mesaDe(i.workspaceId)?.color ?? color.primary}
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
        </>
      )}
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
