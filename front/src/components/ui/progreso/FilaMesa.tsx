import { useMemo, useState } from "react";
import { View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { color, motion, size, space } from "../../../styles/theme";
import { useApp } from "../../../utils/AppContext";
import { tonosDe } from "../../../utils/colores";
import { Workspace } from "../../../utils/model";
import { semanas12 } from "../../../utils/progreso/dias";
import { AREAS, RatingMesa, areaDe } from "../../../utils/progreso/mesas";
import { PressableScale, Tag, Txt } from "../base";
import Anillo from "./Anillo";
import Heatmap from "./Heatmap";

type Icono = keyof typeof Ionicons.glyphMap;
const TONO = { Sube: "primary", Baja: "danger", Igual: "neutral" } as const;
const cuenta = (n: number, uno: string, varios: string) =>
  `${n} ${n === 1 ? uno : varios}`;

// Una mesa en el Perfil (spec E §5): anillo con su rating y el ícono de su área.
// Al tocarla se abre ahí mismo con su heatmap.
export default function FilaMesa({
  mesa,
  rating,
  hoy,
}: {
  mesa: Workspace;
  rating: RatingMesa;
  hoy: string;
}) {
  const { data } = useApp();
  const [abierta, setAbierta] = useState(false);
  const [elegido, setElegido] = useState(hoy);
  const area = AREAS.find((a) => a.id === areaDe(mesa))!;
  const tono = tonosDe(mesa.color).base;
  const dias = useMemo(
    () => (abierta ? semanas12(data, Date.now(), mesa.id) : []),
    [abierta, data, mesa.id],
  );
  return (
    <View style={{ gap: space.md }}>
      <PressableScale
        onPress={() => setAbierta(!abierta)}
        accessibilityRole="button"
        accessibilityState={{ expanded: abierta }}
        accessibilityLabel={`${mesa.name}, ${area.nombre}, ${rating.valor ?? "aún sin datos"}${rating.etiqueta ? `, ${rating.etiqueta}` : ""}`}
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
          avance={(rating.valor ?? 0) / 100}
          color={tono}
          riel={color.line}
        >
          <Ionicons name={area.icono as Icono} size={20} color={tono} />
        </Anillo>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="headline" numberOfLines={1}>
            {mesa.name}
          </Txt>
          <Txt variant="caption" tone="secondary">
            {area.nombre}
          </Txt>
        </View>
        <View style={{ alignItems: "flex-end", gap: 2 }}>
          {rating.valor === null ? (
            <Txt variant="caption" tone="secondary">
              Aún sin datos
            </Txt>
          ) : (
            <Txt variant="title" tabular>
              {rating.valor}
            </Txt>
          )}
          {rating.etiqueta && (
            <Tag text={rating.etiqueta} tone={TONO[rating.etiqueta]} />
          )}
        </View>
        <Ionicons
          name={abierta ? "chevron-up-outline" : "chevron-down-outline"}
          size={size.icon - 4}
          color={color.lineStrong}
        />
      </PressableScale>
      {abierta && (
        <Animated.View
          entering={FadeIn.duration(motion.fadeMs)}
          style={{ gap: space.sm, paddingBottom: space.sm }}
        >
          <Heatmap
            dias={dias}
            hoy={hoy}
            elegido={elegido}
            onElegir={setElegido}
          />
          <Txt variant="caption" tone="secondary">
            {cuenta(rating.completadas, "completada", "completadas")} ·{" "}
            {cuenta(rating.vencidas, "vencida", "vencidas")} en 4 semanas
          </Txt>
        </Animated.View>
      )}
    </View>
  );
}
