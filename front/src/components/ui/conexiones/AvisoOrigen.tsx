import { View } from "react-native";
import { color, radius, space } from "../../../styles/theme";
import type { Origen } from "../../../utils/conexiones/tipos";
import { Txt } from "../base";
import LogoCuenta, { NOMBRE_PROVEEDOR } from "./LogoCuenta";

// Texto corto de origen para filas (Agenda): «Google», «Outlook» o, si son
// copias de algo creado en Nekal, «en Google y Outlook».
export function textoOrigen(lista: Origen[]): string {
  if (!lista.length) return "";
  if (lista[0].creadoEn === "fuera") return NOMBRE_PROVEEDOR[lista[0].proveedor];
  const nombres = [...new Set(lista.map((o) => NOMBRE_PROVEEDOR[o.proveedor]))];
  return `en ${nombres.join(" y ")}`;
}

// Arriba del editor de un ítem del espejo (maqueta H/05 C2): una línea por cuenta.
export default function AvisoOrigen({ enlaces }: { enlaces: Origen[] }) {
  const origen = enlaces[0];
  const nombre = textoOrigen(enlaces).replace(/^en /, "");
  return (
    <View
      style={{
        gap: space.sm,
        padding: space.md,
        borderRadius: radius.sm,
        backgroundColor: color.background,
        borderWidth: 1,
        borderColor: color.line,
      }}
    >
      {enlaces.map((o) => (
        <View
          key={`${o.proveedor}:${o.cuenta}`}
          style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}
        >
          <LogoCuenta proveedor={o.proveedor} chico />
          <Txt
            variant="callout"
            tone="secondary"
            numberOfLines={1}
            style={{ flex: 1 }}
          >
            {`${o.creadoEn === "fuera" ? "De" : "Copiado en"} ${NOMBRE_PROVEEDOR[o.proveedor]} · ${o.cuenta}`}
          </Txt>
        </View>
      ))}
      <Txt variant="callout">
        {origen.soloLectura
          ? `Solo lectura: los cambios vuelven a como está en ${nombre}.`
          : `Si lo cambias aquí, también cambia en ${nombre}.`}
      </Txt>
    </View>
  );
}
