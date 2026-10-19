import { useEffect, useState } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Txt } from "../base";
import { color, radius, shadow, size, space } from "../../../styles/theme";
import { useNeka } from "../../../utils/NekaContext";

// Sobre cualquier pantalla, mientras hablas con la pestaña o el Resumen
// (spec D §5.3): «Te escucho…», después «Neka está pensando…» y los avisos
// (p. ej., grabación muy corta). No toma toques: el dedo sigue en la pestaña.
export default function CapaGrabando() {
  const neka = useNeka();
  const insets = useSafeAreaInsets();
  const [segundos, setSegundos] = useState(0);
  useEffect(() => {
    if (!neka.grabando) return;
    setSegundos(0);
    const reloj = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(reloj);
  }, [neka.grabando]);
  const aviso =
    neka.origen === "rapido" && !neka.grabando && !neka.pensando
      ? neka.error
      : "";
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(neka.limpiarError, 4000);
    return () => clearTimeout(t);
  }, [aviso]);
  const texto = neka.grabando
    ? "Te escucho… suelta para enviar"
    : neka.pensando && neka.origen === "rapido" && !neka.hoja
      ? "Neka está pensando…"
      : aviso;
  if (!texto) return null;
  return (
    <View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={{
        position: "absolute",
        left: space.screen,
        right: space.screen,
        bottom: size.tabBar + insets.bottom + space.md,
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        padding: space.md,
        borderRadius: radius.md,
        backgroundColor: color.ink,
        boxShadow: shadow.raised,
      }}
    >
      <Ionicons
        name={
          neka.grabando
            ? "mic-outline"
            : aviso
              ? "alert-circle-outline"
              : "ellipsis-horizontal"
        }
        size={size.icon}
        color={neka.grabando ? color.danger : color.onPrimary}
      />
      <Txt weight={700} tone="onPrimary" style={{ flex: 1 }}>
        {texto}
      </Txt>
      {neka.grabando && (
        <Txt variant="callout" tone="onPrimary">
          0:{String(segundos).padStart(2, "0")}
        </Txt>
      )}
    </View>
  );
}
