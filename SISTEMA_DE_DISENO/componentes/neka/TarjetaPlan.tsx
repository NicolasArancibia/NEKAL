import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PressableScale, Tag, Txt } from "../base";
import type { TagTone } from "../base";
import { color, radius, size, space } from "../../../styles/theme";
import type { EstadoVisible } from "../../../utils/agente/mensajes";

const ETIQUETA: Record<EstadoVisible, [string, TagTone]> = {
  pendiente: ["Pendiente", "primary"],
  aceptado: ["Aceptado", "neutral"],
  descartado: ["Descartado", "neutral"],
  vencido: ["Ya no está disponible", "neutral"],
};

// Cada plan queda en el chat como una tarjetita; la pendiente reabre la hoja.
export default function TarjetaPlan({
  resumen,
  estado,
  onAbrir,
}: {
  resumen: string;
  estado: EstadoVisible;
  onAbrir: () => void;
}) {
  const [texto, tono] = ETIQUETA[estado];
  const contenido = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.sm,
        minHeight: size.minTouch,
        paddingHorizontal: space.md,
        paddingVertical: space.sm,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: color.line,
        backgroundColor: color.surface,
      }}
    >
      <Ionicons
        name="list-outline"
        size={size.icon - 4}
        color={color.primary}
      />
      <Txt weight={700}>Plan · {resumen}</Txt>
      <Tag text={texto} tone={tono} />
    </View>
  );
  return (
    <View
      style={{
        alignSelf: "flex-start",
        marginHorizontal: space.screen,
        marginVertical: space.xs,
      }}
    >
      {estado === "pendiente" ? (
        <PressableScale
          accessibilityLabel={`Plan de ${resumen}, pendiente. Abrir`}
          onPress={onAbrir}
        >
          {contenido}
        </PressableScale>
      ) : (
        contenido
      )}
    </View>
  );
}
