import { useState } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { color, space } from "../../../styles/theme";
import { useConexiones } from "../../../utils/ConexionesContext";
import { googleDisponible } from "../../../utils/conexiones/google";
import { microsoftDisponible } from "../../../utils/conexiones/microsoft";
import { useApp } from "../../../utils/AppContext";
import { Button, Txt } from "../base";
import FilaCuenta from "./FilaCuenta";
import { NOMBRE_PROVEEDOR } from "./LogoCuenta";

// Ajustes → Cuentas conectadas (maqueta H/05 B1/B2). Ajustes ya es un panel: el
// detalle de una cuenta se despliega en la misma fila en vez de abrir otra hoja.
export default function SeccionCuentas() {
  const { user } = useApp();
  const c = useConexiones();
  const [abierta, setAbierta] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const [error, setError] = useState("");

  if (!c.disponible)
    return (
      <Txt variant="callout" tone="secondary">
        {user
          ? "Conectar funciona en la versión web de Nekal."
          : "Necesitas una cuenta para conectar Google u Outlook."}
      </Txt>
    );

  return (
    <View style={{ gap: space.sm }}>
      {c.cuentas.length === 0 && (
        <Txt variant="callout" tone="secondary">
          Trae tu calendario y tu correo. Neka ve tu día completo y te ayuda a
          responder.
        </Txt>
      )}
      {c.cuentas.map((cuenta) => {
        const clave = `${cuenta.proveedor}:${cuenta.correo}`;
        const nombre = NOMBRE_PROVEEDOR[cuenta.proveedor];
        return (
          <View key={clave} style={{ gap: space.sm }}>
            <FilaCuenta
              cuenta={cuenta}
              onPress={() => {
                setAbierta(abierta === clave ? null : clave);
                setConfirmar(false);
                setError("");
              }}
              onActualizar={() => c.actualizar(cuenta)}
            />
            {abierta === clave &&
              (confirmar ? (
                <View style={{ gap: space.sm }}>
                  <Txt variant="callout" tone="secondary">
                    Sus eventos se quitan de Nekal y siguen intactos en {nombre}
                    . Lo que creaste en Nekal se queda.
                  </Txt>
                  <Button
                    title={`Desconectar ${nombre}`}
                    variant="danger"
                    onPress={() => {
                      c.desconectar(cuenta).then(
                        () => setAbierta(null),
                        () => setError("No se pudo desconectar. Reintenta."),
                      );
                    }}
                  />
                  <Button
                    title="Cancelar"
                    variant="plain"
                    onPress={() => setConfirmar(false)}
                  />
                </View>
              ) : (
                <View style={{ gap: space.sm }}>
                  <Button
                    title={`Actualizar ${nombre}`}
                    variant="secondary"
                    onPress={() => c.actualizar(cuenta)}
                  />
                  <Button
                    title="Desconectar"
                    variant="plain"
                    onPress={() => setConfirmar(true)}
                  />
                </View>
              ))}
          </View>
        );
      })}
      {!!error && (
        <Txt tone="danger" accessibilityRole="alert">
          {error}
        </Txt>
      )}
      <Txt variant="callout" weight={700} tone="secondary">
        {c.cuentas.length ? "Agregar otra" : "Conectar"}
      </Txt>
      <View style={{ flexDirection: "row", gap: space.sm }}>
        {googleDisponible && (
          <View style={{ flex: 1 }}>
            <Button
              title="Google"
              variant="secondary"
              onPress={() => c.conectar("google", "ajustes")}
            />
          </View>
        )}
        {microsoftDisponible && (
          <View style={{ flex: 1 }}>
            <Button
              title="Outlook"
              variant="secondary"
              onPress={() => c.conectar("microsoft", "ajustes")}
            />
          </View>
        )}
      </View>
      <View style={{ flexDirection: "row", gap: space.sm }}>
        <Ionicons
          name="lock-closed-outline"
          size={16}
          color={color.inkSecondary}
        />
        <Txt variant="caption" tone="secondary" style={{ flex: 1 }}>
          Nekal nunca ve tu contraseña. El permiso queda solo en este
          dispositivo y lo puedes quitar cuando quieras.
        </Txt>
      </View>
    </View>
  );
}
