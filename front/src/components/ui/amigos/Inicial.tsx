import { View } from "react-native";
import { color, radius } from "../../../styles/theme";
import { Txt } from "../base";

// Círculo con la inicial de un amigo (lavanda; tu avatar del Perfil es violeta).
// Decorativo: el nombre lo lee la fila o el botón que lo contiene. Sobre una
// tarjeta lavanda va en blanco para que se vea.
export default function Inicial({
  nombre,
  size: lado = 52,
  sobreLavanda = false,
}: {
  nombre: string;
  size?: number;
  sobreLavanda?: boolean;
}) {
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={{
        width: lado,
        height: lado,
        borderRadius: radius.pill,
        backgroundColor: sobreLavanda ? color.surface : color.primarySoft,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Txt variant={lado >= 52 ? "title" : "headline"} tone="primary">
        {(nombre.trim()[0] ?? "?").toUpperCase()}
      </Txt>
    </View>
  );
}
