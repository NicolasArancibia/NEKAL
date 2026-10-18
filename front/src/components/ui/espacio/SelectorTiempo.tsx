import { View } from "react-native";
import { space } from "../../../styles/theme";
import type { Ventana } from "../../../utils/espacio";
import { haptic } from "../../../utils/haptics";
import { Chip } from "../base";

const OPCIONES: [Ventana, string][] = [
  ["hoy", "Hoy"],
  ["semana", "Semana"],
  ["2semanas", "2 semanas"],
  ["todo", "Todo"],
];

// 4 píldoras; la activa, violeta llena. Lo sin fecha o en curso se ve siempre.
export default function SelectorTiempo({
  ventana,
  onCambio,
}: {
  ventana: Ventana;
  onCambio: (v: Ventana) => void;
}) {
  return (
    <View style={{ flexDirection: "row", gap: space.sm }}>
      {OPCIONES.map(([v, nombre]) => (
        <Chip
          key={v}
          title={nombre}
          selected={v === ventana}
          onPress={() => {
            if (v === ventana) return;
            haptic.selection();
            onCambio(v);
          }}
        />
      ))}
    </View>
  );
}
