import React, { useState } from "react";
import { View, Text, ScrollView, TextInput } from "react-native";
import WorkspaceBar from "../components/ui/EspacioTrabajoUi/WorkspaceBar";
import ZoomControl from "../components/ui/EspacioTrabajoUi/ZoomControl";
import AddFab from "../components/ui/EspacioTrabajoUi/AddFab";
import InfiniteCanvas from "../components/ui/EspacioTrabajoUi/InfiniteCanvas";
import CanvasContent from "../components/ui/EspacioTrabajoUi/CanvasContent";
import ItemEditor from "../components/ui/ItemEditor";
import ItemCard from "../components/ui/ItemCard";
import { Button, Chip, Empty, Field, Sheet } from "../components/ui/Common";
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
import { colors, s } from "../styles/globalStyles";
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
    <View style={s.page}>
      <View style={{ padding: 16, gap: 10 }}>
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
        <View style={s.row}>
          <TextInput
            accessibilityLabel="Buscar ítems"
            placeholder="Buscar en este espacio"
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            style={[
              s.input,
              { flex: 1, minHeight: 38, paddingVertical: 8, fontSize: 13 },
            ]}
          />
          <Button
            title="Rutinas"
            secondary
            small
            onPress={() => {
              setModal("groups");
              setName("");
            }}
          />
        </View>
        {!list && (
          <View style={s.between}>
            <Chip
              title={moving ? "Mover nodos: activo" : "Mover nodos"}
              selected={moving}
              onPress={() => setMoving(!moving)}
            />
            <Button
              title="Centrar"
              secondary
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
          contentContainerStyle={[
            s.content,
            { paddingTop: 0, paddingBottom: 90 },
          ]}
        >
          {items.map((i) => (
            <ItemCard key={i.id} item={i} onPress={() => setEditor(i)} />
          ))}
          {!items.length && (
            <Empty
              title="Tu espacio empieza aquí"
              detail="Crea una tarea, guarda una idea o planifica tu próximo objetivo."
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
                paddingHorizontal: 24,
              }}
            >
              <Text style={[s.subtitle, { textAlign: "center" }]}>
                Un espacio para tus ideas.{"\n"}Pulsa + para crear tu primer
                ítem.
              </Text>
            </View>
          )}
        </>
      )}
      <View
        style={{
          position: "absolute",
          bottom: 16,
          left: 20,
          right: 20,
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
          <Text style={s.small}>{items.length} ítems</Text>
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
        title={modal === "spaces" ? "Tus espacios" : "Rutinas reutilizables"}
        onClose={() => {
          setModal(null);
          setError("");
        }}
      >
        {modal === "spaces" ? (
          <>
            {data.workspaces.map((w) => (
              <View key={w.id} style={s.card}>
                <Button
                  title={`Abrir ${w.name}`}
                  secondary
                  onPress={() => {
                    setWorkspace(w.id);
                    setModal(null);
                    setQuery("");
                  }}
                />
                {w.id === selected.id && (
                  <Text style={s.small}>Espacio actual</Text>
                )}
              </View>
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
                    color: colors.primary,
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
              secondary
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
                secondary
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
            <Text style={s.subtitle}>
              Agrupa ítems desde su formulario. Reutilizar crea una copia
              independiente con fechas desplazadas y progreso en cero.
            </Text>
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
                <View key={g.id} style={s.card}>
                  <Text style={s.heading}>{g.name}</Text>
                  <Text style={s.small}>
                    {activeItems(data).filter((i) => i.groupId === g.id).length}{" "}
                    ítems
                  </Text>
                  <Button
                    title={`Reutilizar ${g.name}`}
                    secondary
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
                    secondary
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
                </View>
              ))}
          </>
        )}
        {!!error && <Text style={s.error}>{error}</Text>}
      </Sheet>
    </View>
  );
}
