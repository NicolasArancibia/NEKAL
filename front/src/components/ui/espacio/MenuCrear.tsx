import React, { useState } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { color, radius, size, space } from "../../../styles/theme";
import { useApp } from "../../../utils/AppContext";
import { moverAFecha } from "../../../utils/espacio";
import { Destino, GENERAL, hijosDe } from "../../../utils/estructura";
import { haptic } from "../../../utils/haptics";
import { Item, ItemType, newItem, passive, TYPES } from "../../../utils/model";
import { PressableScale, Sheet, Txt } from "../base";
import { typeIcons } from "../ItemCard";
import FormGrupo from "./FormGrupo";
import FormMesa from "./FormMesa";
import HojaCosa from "./HojaCosa";

const diaCorto = (dia: string) => {
  const [y, m, n] = dia.split("-").map(Number);
  return new Date(y, m - 1, n).toLocaleDateString("es-CL", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};
const HORA = 9; // hora por defecto al crear desde un día de Tiempo
const CITAS: ItemType[] = ["Evento", "Visita", "Meeting"];

type Abierto =
  | { tipo: "cosa"; item: Item; aviso?: string }
  | { tipo: "grupo"; rutina: boolean }
  | { tipo: "mesa" };

function Celda({
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
        minHeight: 64,
        borderRadius: radius.sm,
        backgroundColor: color.primarySoft,
        alignItems: "center",
        justifyContent: "center",
        gap: space.xs,
      }}
    >
      <Ionicons name={icono} size={size.icon} color={color.primary} />
      <Txt variant="caption" weight={600} tone="primary">
        {texto}
      </Txt>
    </PressableScale>
  );
}

// "Nuevo": los 8 tipos, Grupo, Rutina y, solo en General, Mesa. La vista rellena
// lo suyo: Tiempo el día (`destino.dia`); Mesas y Plano la mesa y el grupo.
export default function MenuCrear({
  visible,
  destino,
  onClose,
}: {
  visible: boolean;
  destino: Destino & { dia?: string };
  onClose: () => void;
}) {
  const { data } = useApp();
  const [abierto, setAbierto] = useState<Abierto | null>(null);
  const mesa = data.workspaces.find((w) => w.id === destino.workspaceId);
  const grupo = data.groups.find((g) => g.id === destino.groupId);
  const desdeTiempo = destino.dia !== undefined;
  const elegir = (type: ItemType) => {
    haptic.selection();
    const orden = hijosDe(data, destino).items.map((i) => i.x);
    let item: Item = {
      ...newItem(destino.workspaceId, type),
      groupId: destino.groupId,
      x: Math.max(-1, ...orden) + 1,
    };
    if (destino.dia && !passive(item)) {
      const [y, m, n] = destino.dia.split("-").map(Number);
      item = CITAS.includes(type)
        ? {
            ...item,
            scheduledAt: new Date(y, m - 1, n, HORA, 0).toISOString(),
            startDate:
              destino.dia < item.startDate ? destino.dia : item.startDate,
          }
        : moverAFecha(item, destino.dia, HORA);
    }
    setAbierto({
      tipo: "cosa",
      item,
      aviso:
        desdeTiempo && passive(item)
          ? `Quedará en ${mesa?.name ?? "General"}: las notas e ideas no aparecen en Tiempo.`
          : undefined,
    });
  };
  const cerrarTodo = () => {
    setAbierto(null);
    onClose();
  };
  const filas = [TYPES.slice(0, 4), TYPES.slice(4, 8)];
  return (
    <Sheet visible={visible} size="auto" title="Nuevo" onClose={onClose}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
        {[mesa?.name, grupo?.name, destino.dia && diaCorto(destino.dia)]
          .filter(Boolean)
          .map((t) => (
          <View
            key={t}
            style={{
              paddingHorizontal: space.md,
              paddingVertical: space.xs,
              borderRadius: radius.pill,
              backgroundColor: color.primarySoft,
            }}
          >
            <Txt variant="caption" weight={600} tone="primary">
              {t}
            </Txt>
          </View>
        ))}
      </View>
      {filas.map((fila, k) => (
        <View key={k} style={{ flexDirection: "row", gap: space.sm }}>
          {fila.map((t) => (
            <Celda
              key={t}
              icono={typeIcons[t]}
              texto={t}
              onPress={() => elegir(t)}
            />
          ))}
        </View>
      ))}
      <View style={{ flexDirection: "row", gap: space.sm }}>
        <Celda
          icono="albums-outline"
          texto="Grupo"
          onPress={() => setAbierto({ tipo: "grupo", rutina: false })}
        />
        <Celda
          icono="repeat-outline"
          texto="Rutina"
          onPress={() => setAbierto({ tipo: "grupo", rutina: true })}
        />
        {destino.workspaceId === GENERAL && !destino.groupId && (
          <Celda
            icono="cube-outline"
            texto="Mesa"
            onPress={() => setAbierto({ tipo: "mesa" })}
          />
        )}
      </View>
      <Txt variant="caption" tone="secondary">
        Lo que viene relleno depende de dónde tocaste.
      </Txt>
      {abierto?.tipo === "cosa" && (
        <HojaCosa
          item={abierto.item}
          aviso={abierto.aviso}
          onClose={cerrarTodo}
          onVerDonde={() => {}}
        />
      )}
      {abierto?.tipo === "grupo" && (
        <FormGrupo
          visible
          destino={destino}
          rutina={abierto.rutina}
          onClose={cerrarTodo}
        />
      )}
      {abierto?.tipo === "mesa" && <FormMesa visible onClose={cerrarTodo} />}
    </Sheet>
  );
}
