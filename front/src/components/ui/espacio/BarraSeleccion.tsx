import React, { useState } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { color, radius, shadow, size, space } from "../../../styles/theme";
import { useApp } from "../../../utils/AppContext";
import { moverItems, sacarDeGrupo } from "../../../utils/estructura";
import { haptic } from "../../../utils/haptics";
import { saveItem } from "../../../utils/model";
import { Button, Chip, PressableScale, Sheet, Txt } from "../base";
import FormGrupo from "./FormGrupo";

type Hoja = "juntar" | "mover" | "conectar" | null;

function Accion({
  icono,
  texto,
  onPress,
}: {
  icono: keyof typeof Ionicons.glyphMap;
  texto: string;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={texto}
      style={{
        flex: 1,
        minHeight: 56,
        alignItems: "center",
        justifyContent: "center",
        gap: space.xs,
        borderRadius: radius.sm,
      }}
    >
      <Ionicons name={icono} size={size.icon} color={color.primary} />
      <Txt
        variant="caption"
        weight={600}
        tone="primary"
        align="center"
        numberOfLines={2}
      >
        {texto}
      </Txt>
    </PressableScale>
  );
}

// Con varias elegidas: juntar, sacar, mover a otra mesa o (con 2) conectar.
// La pantalla la ubica abajo; `onListo` sale del modo selección.
export default function BarraSeleccion({
  ids,
  onListo,
}: {
  ids: string[];
  onListo: () => void;
}) {
  const { data, change } = useApp();
  const [hoja, setHoja] = useState<Hoja>(null);
  const [orden, setOrden] = useState(ids);
  const [error, setError] = useState("");
  const cosas = ids
    .map((id) => data.items.find((i) => i.id === id))
    .filter((i) => !!i);
  const primera = cosas[0];
  const hacer = (fn: () => void) => {
    try {
      fn();
      haptic.success();
      setHoja(null);
      onListo();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const [espera, requisito] = orden
    .map((id) => data.items.find((i) => i.id === id))
    .filter((i) => !!i);
  return (
    <View
      style={{
        backgroundColor: color.surface,
        borderRadius: radius.md,
        boxShadow: shadow.raised,
        padding: space.sm,
        gap: space.xs,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: space.sm,
        }}
      >
        <Txt variant="callout" weight={700}>
          {ids.length === 1 ? "1 seleccionada" : `${ids.length} seleccionadas`}
        </Txt>
        <Button title="Listo" variant="plain" small onPress={onListo} />
      </View>
      {!!error && !hoja && (
        <Txt
          variant="caption"
          tone="danger"
          style={{ paddingHorizontal: space.sm }}
        >
          {error}
        </Txt>
      )}
      <View style={{ flexDirection: "row", gap: space.xs }}>
        <Accion
          icono="repeat-outline"
          texto="Juntar en rutina"
          onPress={() => setHoja("juntar")}
        />
        <Accion
          icono="exit-outline"
          texto="Sacar del grupo"
          onPress={() => hacer(() => change((d) => sacarDeGrupo(d, ids)))}
        />
        <Accion
          icono="swap-horizontal-outline"
          texto="Mover a otra mesa"
          onPress={() => setHoja("mover")}
        />
        {ids.length === 2 && (
          <Accion
            icono="git-commit-outline"
            texto="Conectar"
            onPress={() => {
              setOrden(ids);
              setHoja("conectar");
            }}
          />
        )}
      </View>

      {hoja === "juntar" && primera && (
        <FormGrupo
          visible
          rutina
          juntar={ids}
          destino={{
            workspaceId: primera.workspaceId,
            groupId: primera.groupId,
          }}
          onClose={() => {
            setHoja(null);
            onListo();
          }}
        />
      )}
      {hoja === "mover" && (
        <Sheet
          visible
          size="auto"
          title="Mover a otra mesa"
          onClose={() => setHoja(null)}
        >
          <View
            style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}
          >
            {data.workspaces.map((w) => (
              <Chip
                key={w.id}
                title={w.name}
                onPress={() =>
                  hacer(() =>
                    change((d) =>
                      moverItems(d, ids, { workspaceId: w.id, groupId: "" }),
                    ),
                  )
                }
              />
            ))}
          </View>
          <Txt variant="caption" tone="secondary">
            Quedan sueltas en esa mesa; sus conexiones se mantienen.
          </Txt>
          {!!error && (
            <Txt variant="callout" tone="danger">
              {error}
            </Txt>
          )}
        </Sheet>
      )}
      {hoja === "conectar" && espera && requisito && (
        <Sheet
          visible
          size="auto"
          title="Conectar"
          onClose={() => setHoja(null)}
        >
          <Txt variant="headline">
            «{espera.title}» espera a «{requisito.title}»
          </Txt>
          <Button
            title="Intercambiar"
            variant="secondary"
            onPress={() => setOrden(([a, b]) => [b, a])}
          />
          {!!error && (
            <Txt variant="callout" tone="danger">
              {error}
            </Txt>
          )}
          <Button
            title="Conectar"
            onPress={() =>
              hacer(() =>
                change((d) => {
                  const i = d.items.find((x) => x.id === espera.id)!;
                  return i.dependencies.includes(requisito.id)
                    ? d
                    : saveItem(d, {
                        ...i,
                        dependencies: [...i.dependencies, requisito.id],
                      });
                }),
              )
            }
          />
        </Sheet>
      )}
    </View>
  );
}
