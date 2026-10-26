import { Pressable, View } from "react-native";
import { color, heat, radius, space } from "../../../styles/theme";
import { Dia, textoDia } from "../../../utils/progreso/dias";
import { Txt } from "../base";

const CELDA = 15,
  SEP = 3,
  PASO = CELDA + SEP,
  ETIQUETAS = 26;
const MESES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];
const FILAS = ["lun", "", "mié", "", "vie", "", ""];

// Grilla tipo GitHub (spec E §4): columnas = semanas, filas = lunes a domingo.
// `dias` empieza un lunes. Las celdas son chicas: su texto se lee abajo y en VoiceOver.
export default function Heatmap({
  dias,
  hoy,
  elegido,
  onElegir,
}: {
  dias: Dia[];
  hoy: string;
  elegido?: string;
  onElegir: (dia: string) => void;
}) {
  const semanas = Array.from({ length: Math.ceil(dias.length / 7) }, (_, k) =>
    dias.slice(7 * k, 7 * k + 7),
  );
  const mes = (dia: string) => Number(dia.slice(5, 7)) - 1;
  return (
    <View
      role="group"
      aria-label="Tus días, últimas 12 semanas"
      style={{ flexDirection: "row", gap: space.sm - 2 }}
    >
      <View style={{ width: ETIQUETAS, paddingTop: 16 + SEP, gap: SEP }}>
        {FILAS.map((f, k) => (
          <View key={k} style={{ height: CELDA, justifyContent: "center" }}>
            <Txt variant="caption" tone="secondary" aria-hidden>
              {f}
            </Txt>
          </View>
        ))}
      </View>
      <View style={{ gap: SEP }}>
        <View style={{ height: 16, width: semanas.length * PASO - SEP }}>
          {semanas.map((s, k) =>
            k === 0 || mes(s[0].dia) !== mes(semanas[k - 1][0].dia) ? (
              <Txt
                key={s[0].dia}
                variant="caption"
                tone="secondary"
                aria-hidden
                style={{ position: "absolute", left: k * PASO }}
              >
                {MESES[mes(s[0].dia)]}
              </Txt>
            ) : null,
          )}
        </View>
        <View style={{ flexDirection: "row", gap: SEP }}>
          {semanas.map((s) => (
            <View key={s[0].dia} style={{ gap: SEP }}>
              {s.map((x) => {
                const esHoy = x.dia === hoy,
                  marcado = x.dia === elegido && !esHoy;
                return (
                  <Pressable
                    key={x.dia}
                    onPress={() => onElegir(x.dia)}
                    accessibilityRole="button"
                    accessibilityLabel={textoDia(x, hoy)}
                    accessibilityState={{ selected: x.dia === elegido }}
                    hitSlop={SEP / 2}
                    style={{
                      width: CELDA,
                      height: CELDA,
                      borderRadius: radius.sm / 3,
                      backgroundColor: heat[x.tono],
                      outlineWidth: esHoy || marcado ? 2 : 0,
                      outlineColor: esHoy ? color.ink : color.primary,
                      outlineOffset: 1,
                      outlineStyle: "solid",
                    }}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
