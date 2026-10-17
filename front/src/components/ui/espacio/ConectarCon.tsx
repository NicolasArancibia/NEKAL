import React, { useState } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { color, radius, size, space } from "../../../styles/theme";
import { useApp } from "../../../utils/AppContext";
import { timedItems } from "../../../utils/espacio";
import { haptic } from "../../../utils/haptics";
import { Item, passive, saveItem } from "../../../utils/model";
import { Field, PressableScale, Sheet, Txt } from "../base";

const TOPE = 40;
const normal = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Lista buscable de cosas accionables de todas las mesas. Elegir una hace que
// `item` espere a ella (queda en sus dependencias); tocarla de nuevo la quita.
export default function ConectarCon({
  item,
  visible,
  onClose,
}: {
  item: Item;
  visible: boolean;
  onClose: () => void;
}) {
  const { data, change } = useApp();
  const [buscar, setBuscar] = useState("");
  const [error, setError] = useState("");
  const actual = data.items.find((i) => i.id === item.id) ?? item;
  const mesa = new Map(data.workspaces.map((w) => [w.id, w.name]));
  const candidatas = timedItems(data).filter(
    (i) =>
      i.id !== item.id &&
      !passive(i) &&
      normal(i.title).includes(normal(buscar.trim())),
  );
  const alternar = (otra: Item) => {
    try {
      const ya = actual.dependencies.includes(otra.id);
      change((d) => {
        const i = d.items.find((x) => x.id === item.id)!;
        return saveItem(d, {
          ...i,
          dependencies: ya
            ? i.dependencies.filter((id) => id !== otra.id)
            : [...i.dependencies, otra.id],
        });
      });
      haptic.selection();
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <Sheet visible={visible} title="Conectar con…" onClose={onClose}>
      <Txt variant="callout" tone="secondary">
        «{actual.title}» espera a lo que elijas.
      </Txt>
      <Field
        label="Buscar"
        value={buscar}
        onChange={setBuscar}
        placeholder="Nombre de la cosa"
      />
      {!!error && (
        <Txt variant="callout" tone="danger">
          {error}
        </Txt>
      )}
      <View style={{ gap: space.sm }}>
        {candidatas.slice(0, TOPE).map((i) => {
          const elegida = actual.dependencies.includes(i.id);
          return (
            <PressableScale
              key={i.id}
              onPress={() => alternar(i)}
              accessibilityRole="checkbox"
              accessibilityLabel={`${i.title}, en ${mesa.get(i.workspaceId) ?? ""}`}
              accessibilityState={{ checked: elegida }}
              style={{
                minHeight: size.minTouch,
                flexDirection: "row",
                alignItems: "center",
                gap: space.md,
                paddingHorizontal: space.md,
                borderRadius: radius.sm,
                backgroundColor: elegida ? color.primarySoft : color.surface,
                borderWidth: 1,
                borderColor: elegida ? color.primary : color.line,
              }}
            >
              <View style={{ flex: 1 }}>
                <Txt weight={600} numberOfLines={1}>
                  {i.title}
                </Txt>
                <Txt variant="caption" tone="secondary" numberOfLines={1}>
                  {mesa.get(i.workspaceId)}
                </Txt>
              </View>
              {elegida && (
                <Ionicons
                  name="checkmark-circle"
                  size={size.icon}
                  color={color.primary}
                />
              )}
            </PressableScale>
          );
        })}
        {candidatas.length > TOPE && (
          <Txt variant="caption" tone="secondary">
            {candidatas.length - TOPE} más. Escribe para encontrarlas.
          </Txt>
        )}
        {!candidatas.length && (
          <Txt variant="caption" tone="secondary">
            {buscar.trim()
              ? "Nada con ese nombre."
              : "Crea otra cosa accionable para conectarla."}
          </Txt>
        )}
      </View>
    </Sheet>
  );
}
