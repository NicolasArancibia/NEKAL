import { View } from "react-native";
import { Nivel } from "../../../utils/progreso/nivel";
import { miles } from "../../../utils/progreso/logros";
import { Card, ProgressBar, Txt } from "../base";

// Tu nivel en el Perfil (spec E §7.1): tarjeta lavanda con la barra al siguiente.
export default function TarjetaNivel({
  nivel,
  puntos,
}: {
  nivel: Nivel;
  puntos: number;
}) {
  return (
    <Card variant="featured">
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          justifyContent: "space-between",
        }}
      >
        <Txt variant="title">Nivel {nivel.nivel}</Txt>
        <Txt variant="callout" tone="secondary">
          {miles(puntos)} pts
        </Txt>
      </View>
      <ProgressBar
        value={nivel.avance}
        riel="blanco"
        accessibilityLabel={`Avance al nivel ${nivel.nivel + 1}`}
      />
      <Txt variant="caption" tone="secondary">
        {miles(nivel.hasta - puntos)} pts para el nivel {nivel.nivel + 1}
      </Txt>
    </Card>
  );
}
