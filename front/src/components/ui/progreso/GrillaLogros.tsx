import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { color, size, space } from "../../../styles/theme";
import { LogroId } from "../../../utils/model";
import { CATALOGO, Hechos, avance } from "../../../utils/progreso/logros";
import { Card, PressableScale, Txt } from "../base";
import Medalla from "./Medalla";

// Los 8 logros del Perfil en 4 columnas (spec E §6.2) y «Ver los 24 logros».
export default function GrillaLogros({
  logros,
  hechos,
  onVerTodos,
}: {
  logros: { id: LogroId; logrado: boolean }[];
  hechos: Hechos;
  onVerTodos: () => void;
}) {
  return (
    <Card>
      <View
        style={{ flexDirection: "row", flexWrap: "wrap", rowGap: space.lg }}
      >
        {logros.map(({ id, logrado }) => {
          const logro = CATALOGO.find((l) => l.id === id)!;
          const a = avance(id, hechos);
          return (
            <View
              key={id}
              accessible
              accessibilityLabel={`${logro.nombre}, ${logrado ? "logrado" : a.texto}`}
              style={{ width: "25%", alignItems: "center", gap: space.xs }}
            >
              <Medalla id={id} logrado={logrado} avance={a.valor} />
              <Txt
                variant="caption"
                weight={600}
                align="center"
                numberOfLines={2}
              >
                {logro.corto}
              </Txt>
              <Txt variant="caption" tone="secondary" align="center">
                {logrado ? "Logrado" : a.texto}
              </Txt>
            </View>
          );
        })}
      </View>
      <View style={{ height: 1, backgroundColor: color.line }} />
      <PressableScale
        onPress={onVerTodos}
        accessibilityRole="button"
        accessibilityLabel="Ver los 24 logros"
        style={{
          minHeight: size.minTouch,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: space.xs,
          marginVertical: -space.sm,
        }}
      >
        <Txt variant="callout" weight={700} tone="primary">
          Ver los 24 logros
        </Txt>
        <Ionicons
          name="chevron-forward-outline"
          size={size.icon - 6}
          color={color.primary}
        />
      </PressableScale>
    </Card>
  );
}
