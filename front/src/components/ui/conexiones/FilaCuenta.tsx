import { View } from "react-native";
import { color, space } from "../../../styles/theme";
import { TEXTO_ESTADO } from "../../../utils/conexiones/estado";
import type { CuentaVista } from "../../../utils/ConexionesContext";
import { Button, PressableScale, Txt } from "../base";
import LogoCuenta, { NOMBRE_PROVEEDOR } from "./LogoCuenta";

// Una cuenta conectada: logo, proveedor, correo y estado (maqueta H/05 B1).
export default function FilaCuenta({
  cuenta,
  onPress,
  onActualizar,
}: {
  cuenta: CuentaVista;
  onPress: () => void;
  onActualizar: () => void;
}) {
  const activa = cuenta.estado === "activa";
  const pideToque =
    cuenta.estado === "actualizar" || cuenta.estado === "activar_aqui";
  const nombre = NOMBRE_PROVEEDOR[cuenta.proveedor];
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
      <PressableScale
        accessibilityLabel={`${nombre}, ${cuenta.correo}, ${TEXTO_ESTADO[cuenta.estado]}`}
        onPress={onPress}
        style={{
          flex: 1,
          minWidth: 0,
          flexDirection: "row",
          alignItems: "center",
          gap: space.md,
          minHeight: 64,
          paddingVertical: space.sm,
        }}
      >
        <LogoCuenta proveedor={cuenta.proveedor} />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Txt variant="headline">{nombre}</Txt>
          <Txt variant="caption" tone="secondary" numberOfLines={1}>
            {cuenta.correo}
          </Txt>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: space.xs,
            }}
          >
            <View
              aria-hidden
              style={{
                width: 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: activa ? color.success : color.warning,
              }}
            />
            <Txt variant="caption" weight={700} tone="secondary">
              {TEXTO_ESTADO[cuenta.estado]}
            </Txt>
          </View>
        </View>
      </PressableScale>
      {pideToque && (
        <Button
          title="Actualizar"
          variant="secondary"
          small
          onPress={onActualizar}
        />
      )}
    </View>
  );
}
