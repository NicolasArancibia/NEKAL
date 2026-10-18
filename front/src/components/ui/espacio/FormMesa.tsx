import React, { useState } from "react";
import { View } from "react-native";
import { color, radius, size, space } from "../../../styles/theme";
import { useApp } from "../../../utils/AppContext";
import { COLORES_MESA } from "../../../utils/colores";
import { borrarMesa, crearMesa, GENERAL } from "../../../utils/estructura";
import { haptic } from "../../../utils/haptics";
import { Workspace } from "../../../utils/model";
import { Button, Field, PressableScale, Sheet, Txt } from "../base";

const NOMBRES_COLOR = ["Violeta", "Verde", "Naranjo", "Tranquila"];

// Crear o editar una mesa: nombre y color. Las mesas viven en General.
export default function FormMesa({
  visible,
  inicial,
  onClose,
}: {
  visible: boolean;
  inicial?: Workspace;
  onClose: () => void;
}) {
  const { change } = useApp();
  const [nombre, setNombre] = useState(inicial?.name ?? "");
  const [tono, setTono] = useState(inicial?.color ?? COLORES_MESA[0]);
  const [error, setError] = useState("");
  const hacer = (fn: () => void) => {
    try {
      fn();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const guardar = () =>
    hacer(() => {
      if (!inicial) return change((d) => crearMesa(d, nombre, tono).data);
      if (!nombre.trim()) throw new Error("La mesa necesita un nombre.");
      change((d) => ({
        ...d,
        workspaces: d.workspaces.map((w) =>
          w.id === inicial.id ? { ...w, name: nombre.trim(), color: tono } : w,
        ),
      }));
    });
  return (
    <Sheet
      visible={visible}
      size="auto"
      title={inicial ? `Editar ${inicial.name}` : "Mesa nueva"}
      onClose={onClose}
    >
      <Field
        label="Nombre"
        value={nombre}
        onChange={setNombre}
        placeholder="Trabajo, Universidad, Proyecto…"
      />
      <Txt variant="callout" weight={600}>
        Color
      </Txt>
      <View style={{ flexDirection: "row", gap: space.md }}>
        {COLORES_MESA.map((c, k) => {
          const elegido = c.toLowerCase() === tono.toLowerCase();
          return (
            <PressableScale
              key={c}
              onPress={() => {
                haptic.selection();
                setTono(c);
              }}
              accessibilityRole="radio"
              accessibilityLabel={NOMBRES_COLOR[k]}
              accessibilityState={{ selected: elegido }}
              style={{
                width: size.minTouch,
                height: size.minTouch,
                borderRadius: radius.pill,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: elegido ? color.ink : "transparent",
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: radius.pill,
                  backgroundColor: c,
                }}
              />
            </PressableScale>
          );
        })}
      </View>
      {!!error && (
        <Txt variant="callout" tone="danger">
          {error}
        </Txt>
      )}
      <Button title={inicial ? "Guardar" : "Crear mesa"} onPress={guardar} />
      {inicial && inicial.id !== GENERAL && (
        <Button
          title="Borrar mesa"
          variant="plain"
          onPress={() => hacer(() => change((d) => borrarMesa(d, inicial.id)))}
        />
      )}
    </Sheet>
  );
}
