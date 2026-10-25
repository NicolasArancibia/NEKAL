import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Txt } from "../base";
import { color, radius, space } from "../../../styles/theme";
import type { Bloque } from "../../../utils/agente/dia";

// Tu día dibujado (maqueta D 02): punteado = como estaba, violeta = como
// quedaría, candado = fijo, línea roja = ahora.
const POR_HORA = 52; // px por hora
const MARGEN = 48; // columna de las horas
const MIN_ALTO = 22;
const HORA = 3600000;

export default function DiaPlan({
  desde,
  hasta,
  bloques,
}: {
  desde: number;
  hasta: number;
  bloques: Bloque[];
}) {
  const y = (t: number) => ((t - desde) / HORA) * POR_HORA;
  const horas = Array.from(
    { length: Math.round((hasta - desde) / HORA) + 1 },
    (_, n) => desde + n * HORA,
  );
  const ahora = Date.now();
  return (
    <View
      accessibilityLabel="Tu día con los cambios dibujados"
      style={{ height: y(hasta) + space.sm, marginVertical: space.sm }}
    >
      {horas.map((t) => (
        <View
          key={t}
          style={{
            position: "absolute",
            top: y(t),
            left: 0,
            right: 0,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Txt
            variant="caption"
            tone="secondary"
            style={{ width: MARGEN - space.xs }}
          >
            {new Date(t).getHours()}:00
          </Txt>
          <View style={{ flex: 1, height: 1, backgroundColor: color.line }} />
        </View>
      ))}
      {ahora >= desde && ahora <= hasta && (
        <View
          style={{
            position: "absolute",
            top: y(ahora),
            left: MARGEN,
            right: 0,
            height: 2,
            backgroundColor: color.danger,
          }}
        />
      )}
      <View
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: MARGEN,
          right: 0,
        }}
      >
        {/* Lo fijo va debajo: el punteado de una cosa que choca con algo fijo se ve encima. */}
        {[
          ...bloques.filter((b) => b.tipo === "fijo"),
          ...bloques.filter((b) => b.tipo !== "fijo"),
        ].map((b) => (
          <View
            key={`${b.id}-${b.tipo}`}
            style={{
              position: "absolute",
              top: y(b.inicio),
              height: Math.max(MIN_ALTO, y(b.fin) - y(b.inicio) - 2),
              left: b.tipo === "despues" ? "51%" : space.xs,
              right: b.tipo === "antes" ? "51%" : space.xs,
              flexDirection: "row",
              alignItems: "flex-start",
              gap: space.xs,
              paddingHorizontal: space.sm,
              paddingVertical: 2,
              borderRadius: radius.sm - 4,
              borderWidth: 1.5,
              borderStyle: b.tipo === "antes" ? "dashed" : "solid",
              borderColor:
                b.tipo === "despues"
                  ? color.primary
                  : b.tipo === "antes"
                    ? color.lineStrong
                    : color.line,
              backgroundColor:
                b.tipo === "despues"
                  ? color.primarySoft
                  : b.tipo === "fijo"
                    ? color.background
                    : "transparent",
            }}
          >
            {b.tipo === "fijo" && (
              <Ionicons
                name="lock-closed-outline"
                size={12}
                color={color.inkSecondary}
              />
            )}
            <Txt
              variant="caption"
              weight={700}
              numberOfLines={1}
              tone={b.tipo === "despues" ? "primary" : "secondary"}
              style={{ flex: 1 }}
            >
              {b.titulo}
            </Txt>
          </View>
        ))}
      </View>
    </View>
  );
}
