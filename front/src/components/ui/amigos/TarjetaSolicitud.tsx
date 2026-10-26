import { useState } from "react";
import { View } from "react-native";
import { space } from "../../../styles/theme";
import { haptic } from "../../../utils/haptics";
import { Button, Card, Txt } from "../base";
import Inicial from "./Inicial";

// Una solicitud que te llegó, con Aceptar y Rechazar (spec F §6.1 y §6.2).
// En el Perfil va destacada (lavanda); ahí Rechazar es solo texto.
export default function TarjetaSolicitud({
  nombre,
  destacada = false,
  onAceptar,
  onRechazar,
}: {
  nombre: string;
  destacada?: boolean;
  onAceptar: () => Promise<void>;
  onRechazar: () => Promise<void>;
}) {
  const [ocupado, setOcupado] = useState(false),
    [error, setError] = useState("");
  const hacer = async (fn: () => Promise<void>, exito = false) => {
    setOcupado(true);
    setError("");
    try {
      await fn();
      if (exito) haptic.success();
    } catch (e) {
      setError((e as Error).message);
      setOcupado(false);
    }
  };
  return (
    <Card variant={destacada ? "featured" : "plain"} style={{ gap: space.md }}>
      <View
        style={{ flexDirection: "row", alignItems: "center", gap: space.md }}
      >
        <Inicial nombre={nombre} size={40} sobreLavanda={destacada} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="headline" numberOfLines={1}>
            {nombre}
          </Txt>
          <Txt variant="callout" tone="secondary">
            quiere agregarte
          </Txt>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: space.sm }}>
        <View style={{ flex: 1 }}>
          <Button
            title="Aceptar"
            small
            disabled={ocupado}
            onPress={() => void hacer(onAceptar, true)}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            title="Rechazar"
            variant={destacada ? "plain" : "secondary"}
            small
            disabled={ocupado}
            onPress={() => void hacer(onRechazar)}
          />
        </View>
      </View>
      {!!error && (
        <Txt variant="callout" tone="danger" accessibilityRole="alert">
          {error}
        </Txt>
      )}
    </Card>
  );
}
