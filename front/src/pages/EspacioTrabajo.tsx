import React, { useState } from "react";
import { View, ScrollView, TextInput } from "react-native";
import WorkspaceBar from "../components/ui/EspacioTrabajoUi/WorkspaceBar";
import ZoomControl from "../components/ui/EspacioTrabajoUi/ZoomControl";
import AddFab from "../components/ui/EspacioTrabajoUi/AddFab";
import InfiniteCanvas from "../components/ui/EspacioTrabajoUi/InfiniteCanvas";
import CanvasContent from "../components/ui/EspacioTrabajoUi/CanvasContent";
import ItemEditor from "../components/ui/ItemEditor";
import ItemCard from "../components/ui/ItemCard";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  ScreenHeader,
  Sheet,
  Tag,
  Txt,
} from "../components/ui/base";
import { useApp } from "../utils/AppContext";
import {
  Item,
  activeItems,
  newItem,
  uid,
  duplicateGroup,
  localDay,
  parseDateInput,
} from "../utils/model";
import { color, font, radius, size, space, type } from "../styles/theme";

const row = {
  flexDirection: "row",
  alignItems: "center",
  gap: space.sm,
} as const;

export default function EspacioTrabajo() {
  const { data, change } = useApp();
  const [workspace, setWorkspace] = useState("general"),
    [list, setList] = useState(false),
    [zoom, setZoom] = useState(1),
    [moving, setMoving] = useState(false),
    [reset, setReset] = useState(0),
    [editor, setEditor] = useState<Item | null>(null),
    [modal, setModal] = useState<"spaces" | "groups" | null>(null),
    [name, setName] = useState(""),
    [query, setQuery] = useState(""),
    [error, setError] = useState(""),
    [repeatDay, setRepeatDay] = useState(localDay());
  const selected =
    data.workspaces.find((w) => w.id === workspace) ?? data.workspaces[0];
  const items = activeItems(data).filter(
    (i) =>
      i.workspaceId === selected.id &&
      `${i.title} ${i.description}`.toLowerCase().includes(query.toLowerCase()),
  );
  const act = (fn: () => void) => {
    try {
      fn();
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <View style={{ flex: 1, backgroundColor: color.background }}>
      <View style={{ padding: space.screen, gap: space.md }}>
        <ScreenHeader title="Espacio" />
        <WorkspaceBar
          name={selected.name}
          list={list}
          onToggle={() => setList(!list)}
          onSelect={() => {
            setModal("spaces");
            setName("");
          }}
          onAdd={() => {
            setModal("spaces");
            setName("");
          }}
        />
        <View style={row}>
          <TextInput
            accessibilityLabel="Buscar ítems"
            placeholder="Buscar en este espacio"
            placeholderTextColor={color.inkSecondary}
            value={query}
            onChangeText={setQuery}
            style={{
              flex: 1,
              minHeight: size.minTouch,
              paddingHorizontal: space.lg,
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: color.line,
              backgroundColor: color.surface,
              color: color.ink,
              fontFamily: font[500],
              fontSize: type.callout.size,
            }}
          />
          <Button
            title="Rutinas"
            variant="secondary"
            small
            onPress={() => {
              setModal("groups");
              setName("");
            }}
          />
        </View>
        {!list && (
          <View style={[row, { justifyContent: "space-between" }]}>
            <Chip
              title={moving ? "Moviendo nodos" : "Mover nodos"}
              selected={moving}
              onPress={() => setMoving(!moving)}
            />
            <Button
              title="Centrar"
              variant="plain"
              small
              onPress={() => {
                setReset((v) => v + 1);
                setZoom(1);
              }}
            />
          </View>
        )}
      </View>
      {list ? (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: space.screen,
            paddingBottom: 96,
            gap: space.md,
            width: "100%",
            maxWidth: 960,
            alignSelf: "center",
          }}
        >
          {items.map((i) => (
            <ItemCard key={i.id} item={i} onPress={() => setEditor(i)} />
          ))}
          {!items.length && (
            <EmptyState
              pose={3}
              text={
                query
                  ? "No hay ítems con esa búsqueda."
                  : "Pulsa + para crear tu primer ítem."
              }
            />
          )}
        </ScrollView>
      ) : (
        <>
          <InfiniteCanvas
            key={`${selected.id}-${reset}`}
            zoomLevel={zoom}
            moveNodes={moving}
          >
            <CanvasContent
              items={items}
              groups={data.groups}
              name={data.profile.name.split(" ")[0]}
              onOpen={setEditor}
              moveNodes={moving}
              zoom={zoom}
              onMove={(id, x, y) =>
                change((d) => ({
                  ...d,
                  items: d.items.map((i) =>
                    i.id === id
                      ? { ...i, x, y, updatedAt: new Date().toISOString() }
                      : i,
                  ),
                }))
              }
            />
          </InfiniteCanvas>
          {!items.length && (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: "58%",
                alignSelf: "center",
                paddingHorizontal: space.xxl,
              }}
            >
              <Txt tone="secondary" align="center">
                Pulsa + para crear tu primer ítem.
              </Txt>
            </View>
          )}
        </>
      )}
      <View
        style={{
          position: "absolute",
          bottom: space.lg,
          left: space.screen,
          right: space.screen,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {!list ? (
          <ZoomControl
            zoomLevel={zoom}
            onZoomIn={() => setZoom((v) => Math.min(2, v + 0.1))}
            onZoomOut={() => setZoom((v) => Math.max(0.4, v - 0.1))}
          />
        ) : (
          <Txt variant="caption" tone="secondary">
            {items.length} {items.length === 1 ? "ítem" : "ítems"}
          </Txt>
        )}
        <AddFab onPress={() => setEditor(newItem(selected.id))} />
      </View>
      {editor && (
        <ItemEditor
          key={editor.id}
          item={editor}
          onClose={() => setEditor(null)}
        />
      )}
      <Sheet
        visible={!!modal}
        title={modal === "spaces" ? "Tus espacios" : "Rutinas"}
        onClose={() => {
          setModal(null);
          setError("");
        }}
      >
        {modal === "spaces" ? (
          <>
            {data.workspaces.map((w) => (
              <Card
                key={w.id}
                accessibilityLabel={`Abrir ${w.name}`}
                onPress={() => {
                  setWorkspace(w.id);
                  setModal(null);
                  setQuery("");
                }}
                style={row}
              >
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: radius.pill,
                    backgroundColor: w.color,
                  }}
                />
                <Txt weight={600} numberOfLines={1} style={{ flex: 1 }}>
                  {w.name}
                </Txt>
                {w.id === selected.id && <Tag text="Actual" tone="primary" />}
              </Card>
            ))}
            <Field
              label="Nombre del espacio"
              value={name}
              onChange={setName}
              placeholder="Universidad, trabajo, personal…"
            />
            <Button
              title="Crear espacio"
              onPress={() =>
                act(() => {
                  if (!name.trim()) throw new Error("Escribe un nombre.");
                  const w = {
                    id: uid(),
                    name: name.trim(),
                    color: color.primary,
                  };
                  change((d) => ({ ...d, workspaces: [...d.workspaces, w] }));
                  setWorkspace(w.id);
                  setName("");
                  setModal(null);
                })
              }
            />
            <Button
              title={`Renombrar ${selected.name}`}
              variant="secondary"
              onPress={() =>
                act(() => {
                  if (!name.trim()) throw new Error("Escribe el nuevo nombre.");
                  change((d) => ({
                    ...d,
                    workspaces: d.workspaces.map((w) =>
                      w.id === selected.id ? { ...w, name: name.trim() } : w,
                    ),
                  }));
                  setName("");
                })
              }
            />
            {selected.id !== "general" && (
              <Button
                title="Eliminar espacio vacío"
                variant="plain"
                onPress={() =>
                  act(() => {
                    if (
                      data.items.some((i) => i.workspaceId === selected.id) ||
                      data.groups.some((g) => g.workspaceId === selected.id)
                    )
                      throw new Error(
                        "Mueve sus ítems y rutinas antes de eliminar el espacio.",
                      );
                    change((d) => ({
                      ...d,
                      workspaces: d.workspaces.filter(
                        (w) => w.id !== selected.id,
                      ),
                    }));
                    setWorkspace("general");
                  })
                }
              />
            )}
          </>
        ) : (
          <>
            <Txt tone="secondary">
              Agrupa ítems desde su formulario. Reutilizar crea una copia con
              las fechas movidas y el progreso en cero.
            </Txt>
            <Field
              label="Nombre de la rutina"
              value={name}
              onChange={setName}
            />
            <Button
              title="Crear rutina"
              onPress={() =>
                act(() => {
                  if (!name.trim()) throw new Error("Escribe un nombre.");
                  change((d) => ({
                    ...d,
                    groups: [
                      ...d.groups,
                      {
                        id: uid(),
                        name: name.trim(),
                        workspaceId: selected.id,
                      },
                    ],
                  }));
                  setName("");
                })
              }
            />
            <Field
              label="Fecha para reutilizar"
              value={repeatDay}
              onChange={setRepeatDay}
              placeholder="AAAA-MM-DD"
            />
            {data.groups
              .filter((g) => g.workspaceId === selected.id)
              .map((g) => (
                <Card key={g.id}>
                  <Txt variant="headline">{g.name}</Txt>
                  <Txt variant="caption" tone="secondary">
                    {activeItems(data).filter((i) => i.groupId === g.id).length}{" "}
                    ítems
                  </Txt>
                  <Button
                    title={`Reutilizar ${g.name}`}
                    variant="secondary"
                    onPress={() =>
                      act(() => {
                        parseDateInput(repeatDay);
                        if (!repeatDay) throw new Error("Indica una fecha.");
                        change((d) => duplicateGroup(d, g.id, repeatDay));
                        setModal(null);
                      })
                    }
                  />
                  <Button
                    title={`Desagrupar ${g.name}`}
                    variant="plain"
                    small
                    onPress={() =>
                      act(() =>
                        change((d) => ({
                          ...d,
                          groups: d.groups.filter((x) => x.id !== g.id),
                          items: d.items.map((i) =>
                            i.groupId === g.id ? { ...i, groupId: "" } : i,
                          ),
                        })),
                      )
                    }
                  />
                </Card>
              ))}
          </>
        )}
        {!!error && (
          <Txt tone="danger" accessibilityRole="alert">
            {error}
          </Txt>
        )}
      </Sheet>
    </View>
  );
}
