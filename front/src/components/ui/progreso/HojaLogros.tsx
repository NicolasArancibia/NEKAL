import { View } from "react-native";
import { space } from "../../../styles/theme";
import { LogroId } from "../../../utils/model";
import {
  CATALOGO,
  Familia,
  Hechos,
  avance,
} from "../../../utils/progreso/logros";
import { Sheet, Txt } from "../base";
import Medalla from "./Medalla";

const FAMILIAS: { id: Familia; nombre: string }[] = [
  { id: "constancia", nombre: "Constancia" },
  { id: "volumen", nombre: "Volumen y niveles" },
  { id: "primeras", nombre: "Primeras veces" },
];

// Los 24 logros por familia (spec E §6.2). Los bloqueados de primeras veces
// dicen cómo conseguirlos.
export default function HojaLogros({
  visible,
  onClose,
  desbloqueados,
  hechos,
}: {
  visible: boolean;
  onClose: () => void;
  desbloqueados: LogroId[];
  hechos: Hechos;
}) {
  return (
    <Sheet visible={visible} title="Logros" onClose={onClose}>
      {FAMILIAS.map((f) => (
        <View key={f.id} style={{ gap: space.md }}>
          <Txt variant="headline">{f.nombre}</Txt>
          {CATALOGO.filter((l) => l.familia === f.id).map((l) => {
            const logrado = desbloqueados.includes(l.id);
            const a = avance(l.id, hechos);
            return (
              <View
                key={l.id}
                accessible
                accessibilityLabel={`${l.nombre}, ${logrado ? "logrado" : a.texto}`}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: space.md,
                }}
              >
                <Medalla id={l.id} logrado={logrado} avance={a.valor} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt weight={600}>{l.nombre}</Txt>
                  <Txt variant="callout" tone="secondary">
                    {logrado ? l.frase : (l.pista ?? a.texto)}
                  </Txt>
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </Sheet>
  );
}
