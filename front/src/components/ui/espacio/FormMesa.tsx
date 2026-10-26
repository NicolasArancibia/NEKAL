import React, { useState } from "react";
import { View } from "react-native";
import { color, radius, size, space } from "../../../styles/theme";
import { useApp } from "../../../utils/AppContext";
import { COLORES_MESA } from "../../../utils/colores";
import { borrarMesa, crearMesa, GENERAL } from "../../../utils/estructura";
import { haptic } from "../../../utils/haptics";
import { Area, Workspace } from "../../../utils/model";
import { AREAS, areaSugerida } from "../../../utils/progreso/mesas";
import { Button, Chip, Field, PressableScale, Sheet, Txt } from "../base";

const NOMBRES_COLOR = ["Violeta", "Verde", "Naranjo", "Tranquila"];

// Crear o editar una mesa: nombre, color y área. Las mesas viven en General.
// El área se guarda solo si la eliges; si no, se sugiere por el nombre (spec E §5).
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
  const [area, setArea] = useState<Area | undefined>(inicial?.area);
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
      if (!inicial)
        return change((d) => crearMesa(d, nombre, tono, undefined, area).data);
      if (!nombre.trim()) throw new Error("La mesa necesita un nombre.");
      change((d) => ({
        ...d,
        workspaces: d.workspaces.map((w) =>
          w.id === inicial.id
            ? {
                ...w,
                name: nombre.trim(),
                color: tono,
                ...(area ? { area } : {}),
              }
            : w,
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
      {inicial?.id !== GENERAL && (
        <>
          <Txt variant="callout" weight={600}>
            Área
          </Txt>
          <View
            style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}
          >
            {AREAS.map((a) => (
              <Chip
                key={a.id}
                title={a.nombre}
                selected={(area ?? areaSugerida(nombre)) === a.id}
                onPress={() => {
                  haptic.selection();
                  setArea(a.id);
                }}
              />
            ))}
          </View>
        </>
      )}
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
