import { View } from "react-native";
import { color, radius, space } from "../../../styles/theme";
import type { Origen } from "../../../utils/conexiones/tipos";
import { Txt } from "../base";
import LogoCuenta, { NOMBRE_PROVEEDOR } from "./LogoCuenta";

// Texto corto de origen para filas (Agenda): «Google», «Outlook» o «en Google» si es una copia.
export function textoOrigen(o: Origen | undefined): string {
  if (!o) return "";
  const nombre = NOMBRE_PROVEEDOR[o.proveedor];
  return o.creadoEn === "fuera" ? nombre : `en ${nombre}`;
}

// Arriba del editor de un ítem del espejo (maqueta H/05 C2).
export default function AvisoOrigen({ origen }: { origen: Origen }) {
  const nombre = NOMBRE_PROVEEDOR[origen.proveedor];
  const de = origen.creadoEn === "fuera" ? "De" : "Copiado en";
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
      <View
        style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}
      >
        <LogoCuenta proveedor={origen.proveedor} chico />
        <Txt
          variant="callout"
          tone="secondary"
          numberOfLines={1}
          style={{ flex: 1 }}
        >
          {`${de} ${nombre} · ${origen.cuenta}`}
        </Txt>
      </View>
      <Txt variant="callout">
        {origen.soloLectura
          ? `Solo lectura: los cambios vuelven a como está en ${nombre}.`
          : `Si lo cambias aquí, también cambia en ${nombre}.`}
      </Txt>
    </View>
  );
}
