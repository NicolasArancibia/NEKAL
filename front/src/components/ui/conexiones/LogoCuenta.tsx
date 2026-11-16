import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { color, radius, size } from "../../../styles/theme";
import type { Proveedor } from "../../../utils/conexiones/tipos";

export const NOMBRE_PROVEEDOR: Record<Proveedor, string> = {
  google: "Google",
  microsoft: "Outlook",
};

// Logo de la cuenta en una ficha blanca (maqueta H/05). Decorativo: el nombre va al lado.
export default function LogoCuenta({
  proveedor,
  chico = false,
}: {
  proveedor: Proveedor;
  chico?: boolean;
}) {
  const lado = chico ? 26 : 42;
  return (
    <View
      aria-hidden
      style={{
        width: lado,
        height: lado,
        borderRadius: chico ? radius.sm / 1.5 : radius.badge,
        backgroundColor: color.surface,
        borderWidth: 1,
        borderColor: color.line,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons
        name={proveedor === "google" ? "logo-google" : "logo-microsoft"}
        size={chico ? 15 : size.icon}
        color={color.ink}
      />
    </View>
  );
}
