import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { color, size, space } from "../../../styles/theme";
import { FilaAmigo as Fila } from "../../../utils/amigos/amistades";
import { PressableScale, Txt } from "../base";
import Inicial from "./Inicial";

// Un amigo en la hoja Amigos: inicial, nombre y «Nivel N · M logros».
export default function FilaAmigo({
  fila,
  onPress,
}: {
  fila: Fila;
  onPress: () => void;
}) {
  const detalle =
    fila.nivel === null
      ? ""
      : `Nivel ${fila.nivel} · ${fila.logros} ${fila.logros === 1 ? "logro" : "logros"}`;
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={detalle ? `${fila.nombre}, ${detalle}` : fila.nombre}
      style={{
        minHeight: 60,
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
      }}
    >
      <Inicial nombre={fila.nombre} size={40} />
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="headline" numberOfLines={1}>
          {fila.nombre}
        </Txt>
        {!!detalle && (
          <Txt variant="caption" tone="secondary">
            {detalle}
          </Txt>
        )}
      </View>
      <Ionicons
        name="chevron-forward-outline"
        size={size.icon - 4}
        color={color.lineStrong}
      />
    </PressableScale>
  );
}
