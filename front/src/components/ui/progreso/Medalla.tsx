import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { color, radius, shadow } from "../../../styles/theme";
import { LogroId } from "../../../utils/model";
import { CATALOGO } from "../../../utils/progreso/logros";
import Anillo from "./Anillo";

type Icono = keyof typeof Ionicons.glyphMap;

// Medalla de un logro (spec E §6.2): violeta si está lograda; gris con candado y
// anillo de avance si no.
export default function Medalla({
  id,
  logrado,
  avance = 0,
  size = 56,
}: {
  id: LogroId;
  logrado: boolean;
  avance?: number;
  size?: 56 | 120;
}) {
  const icono = CATALOGO.find((l) => l.id === id)!.icono as Icono;
  const grande = size === 120;
  if (logrado)
    return (
      <View
        aria-hidden
        style={{
          width: size,
          height: size,
          borderRadius: radius.pill,
          backgroundColor: color.primary,
          borderWidth: grande ? 8 : 4,
          borderColor: color.primarySoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name={icono}
          size={grande ? 44 : 24}
          color={color.onPrimary}
        />
      </View>
    );
  const interior = size - (grande ? 28 : 12);
  return (
    <View aria-hidden>
      <Anillo
        size={size}
        grosor={grande ? 6 : 3}
        avance={avance}
        color={color.primary}
        riel={color.line}
      >
        <View
          style={{
            width: interior,
            height: interior,
            borderRadius: radius.pill,
            backgroundColor: color.medallaApagada,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name={icono}
            size={grande ? 40 : 22}
            color={color.lineStrong}
          />
        </View>
      </Anillo>
      <View
        style={{
          position: "absolute",
          right: grande ? 6 : -2,
          bottom: grande ? 6 : -2,
          width: grande ? 26 : 20,
          height: grande ? 26 : 20,
          borderRadius: radius.pill,
          backgroundColor: color.surface,
          boxShadow: shadow.card,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name="lock-closed-outline"
          size={grande ? 14 : 11}
          color={color.inkSecondary}
        />
      </View>
    </View>
  );
}
