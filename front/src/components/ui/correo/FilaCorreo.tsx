import { View } from "react-native";
import { color, radius, space } from "../../../styles/theme";
import type { CorreoEnLista } from "../../../utils/useCorreo";
import {
  accion,
  horaCorreo,
  textoRazon,
} from "../../../utils/conexiones/correoNeka";
import { Button, PressableScale, Txt } from "../base";
import LogoCuenta from "../conexiones/LogoCuenta";

// Un correo en la bandeja (maqueta H/05 D1): cuenta, remitente, asunto, por qué
// está ahí y una acción. Tocar la fila lo abre; el botón hace la acción.
export default function FilaCorreo({
  correo,
  ahora,
  conAccion,
  onAbrir,
  onAccion,
}: {
  correo: CorreoEnLista;
  ahora: number;
  conAccion: boolean;
  onAbrir: () => void;
  onAccion: () => void;
}) {
  const razon = correo.clase ? textoRazon(correo.clase, ahora) : "";
  const boton = accion(correo.clase?.razon ?? "nada");
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        paddingVertical: space.sm,
      }}
    >
      <PressableScale
        onPress={onAbrir}
        accessibilityRole="button"
        accessibilityLabel={`${correo.leido ? "" : "No leído. "}${correo.de.nombre}: ${correo.asunto}${razon ? `. ${razon}` : ""}`}
        style={{ flex: 1, flexDirection: "row", gap: space.md }}
      >
        <LogoCuenta proveedor={correo.proveedor} chico />
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: "row", gap: space.sm }}>
            <Txt
              variant="headline"
              weight={correo.leido ? 600 : 800}
              numberOfLines={1}
              style={{ flex: 1 }}
            >
              {correo.de.nombre}
            </Txt>
            <Txt variant="caption" tone="secondary" tabular>
              {horaCorreo(correo.fecha, ahora)}
            </Txt>
          </View>
          <Txt variant="callout" numberOfLines={1}>
            {correo.asunto || "(sin asunto)"}
          </Txt>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: space.xs,
            }}
          >
            {!correo.leido && (
              <View
                aria-hidden
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: radius.pill,
                  backgroundColor: color.primary,
                }}
              />
            )}
            <Txt
              variant="caption"
              tone={razon ? "primary" : "secondary"}
              weight={razon ? 700 : 500}
              numberOfLines={1}
              style={{ flex: 1 }}
            >
              {razon || correo.extracto}
            </Txt>
          </View>
        </View>
      </PressableScale>
      {conAccion && (
        <Button title={boton} variant="secondary" small onPress={onAccion} />
      )}
    </View>
  );
}
