import { StyleProp, View, ViewStyle } from "react-native";
import { color, radius, space } from "../../../styles/theme";
import Txt from "./Txt";

// Número rojo sobre un ícono (solicitudes de amistad, spec F §6.4). Quien lo
// usa lo posiciona; el número lo lee el nombre accesible del botón.
export default function Contador({
  n,
  style,
}: {
  n: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[
        {
          minWidth: 18,
          height: 18,
          paddingHorizontal: space.xs,
          borderRadius: radius.pill,
          backgroundColor: color.danger,
          borderWidth: 2,
          borderColor: color.surface,
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "content-box",
        },
        style,
      ]}
    >
      <Txt variant="caption" weight={700} tone="onPrimary">
        {n > 9 ? "9+" : n}
      </Txt>
    </View>
  );
}
