import { View } from "react-native";
import { color, radius, shadow, space } from "../../../styles/theme";
import { haptic } from "../../../utils/haptics";
import PressableScale from "./PressableScale";
import Txt from "./Txt";

// Control de segmentos con texto (maqueta H/02 y H/03): cápsula violeta suave y
// el segmento activo en blanco con sombra, como el selector de vistas del
// Espacio pero con nombres. Mes · Agenda · Plano en el Calendario.
export default function Segmentos<T extends string>({
  opciones,
  valor,
  onCambio,
}: {
  opciones: [T, string][];
  valor: T;
  onCambio: (v: T) => void;
}) {
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: "row",
        alignSelf: "flex-start",
        backgroundColor: color.primarySoft,
        borderRadius: radius.pill,
        padding: 3,
      }}
    >
      {opciones.map(([v, nombre]) => {
        const activa = v === valor;
        return (
          <PressableScale
            key={v}
            onPress={() => {
              if (activa) return;
              haptic.selection();
              onCambio(v);
            }}
            accessibilityRole="tab"
            accessibilityLabel={nombre}
            accessibilityState={{ selected: activa }}
            hitSlop={5}
            style={{
              minWidth: 64,
              height: 34,
              paddingHorizontal: space.lg,
              borderRadius: radius.pill,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: activa ? color.surface : "transparent",
              boxShadow: activa ? shadow.card : undefined,
            }}
          >
            <Txt
              variant="callout"
              weight={700}
              tone={activa ? "primary" : "secondary"}
            >
              {nombre}
            </Txt>
          </PressableScale>
        );
      })}
    </View>
  );
}
