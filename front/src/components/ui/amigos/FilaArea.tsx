import { ComponentProps } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { color, size, space } from "../../../styles/theme";
import { Area } from "../../../utils/model";
import { AREAS } from "../../../utils/progreso/mesas";
import { Txt } from "../base";
import Anillo from "../progreso/Anillo";

type Icono = ComponentProps<typeof Ionicons>["name"];

// Un área de un amigo (spec F §4.2): sin nombres de mesas, solo cuántas son.
export default function FilaArea({
  area,
  valor,
  mesas,
}: {
  area: Area;
  valor: number;
  mesas: number;
}) {
  const a = AREAS.find((x) => x.id === area)!;
  const cuantas = mesas === 1 ? "1 mesa" : `${mesas} mesas`;
  return (
    <View
      accessible
      accessibilityLabel={`${a.nombre}, ${valor}, ${cuantas}`}
      style={{
        minHeight: 60,
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
      }}
    >
      <Anillo
        size={size.minTouch}
        grosor={4}
        avance={valor / 100}
        color={color.primary}
        riel={color.line}
      >
        <Ionicons name={a.icono as Icono} size={20} color={color.primary} />
      </Anillo>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="headline">{a.nombre}</Txt>
        <Txt variant="caption" tone="secondary">
          {cuantas}
        </Txt>
      </View>
      <Txt variant="title" tabular>
        {valor}
      </Txt>
    </View>
  );
}
