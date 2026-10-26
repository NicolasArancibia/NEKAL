import { useState } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { color, heat, radius, size, space } from "../../../styles/theme";
import { Dia, Rachas, textoDia } from "../../../utils/progreso/dias";
import { Card, Txt } from "../base";
import Heatmap from "./Heatmap";

const diasTexto = (n: number) => `${n} ${n === 1 ? "día" : "días"}`;

function Dato({
  icono,
  valor,
  nombre,
}: {
  icono: "flame-outline" | "trophy-outline";
  valor: string;
  nombre: string;
}) {
  return (
    <View style={{ flex: 1, gap: space.xs }}>
      <Ionicons name={icono} size={size.icon - 2} color={color.primary} />
      <Txt variant="headline">{valor}</Txt>
      <Txt variant="caption" tone="secondary">
        {nombre}
      </Txt>
    </View>
  );
}

// Tus días en el Resumen (spec E §4): racha, récord y el heatmap de 12 semanas.
export default function TusDias({
  dias,
  rachas,
  hoy,
}: {
  dias: Dia[];
  rachas: Rachas;
  hoy: string;
}) {
  const [elegido, setElegido] = useState(hoy);
  const dia = dias.find((x) => x.dia === elegido) ?? dias[dias.length - 1];
  return (
    <Card style={{ gap: space.lg - 2 }}>
      <View style={{ flexDirection: "row", gap: space.md }}>
        <Dato
          icono="flame-outline"
          valor={diasTexto(rachas.racha)}
          nombre="Racha"
        />
        <View style={{ width: 1, backgroundColor: color.line }} />
        <Dato
          icono="trophy-outline"
          valor={diasTexto(rachas.record)}
          nombre="Récord"
        />
      </View>
      <View style={{ height: 1, backgroundColor: color.line }} />
      <Heatmap dias={dias} hoy={hoy} elegido={elegido} onElegir={setElegido} />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: space.sm,
          flexWrap: "wrap",
        }}
      >
        <Txt variant="caption" tone="secondary">
          {dia ? textoDia(dia, hoy) : ""}
        </Txt>
        <View
          aria-hidden
          style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
        >
          <Txt variant="caption" tone="secondary">
            0%
          </Txt>
          {heat.map((h) => (
            <View
              key={h}
              style={{
                width: 11,
                height: 11,
                borderRadius: radius.sm / 4,
                backgroundColor: h,
              }}
            />
          ))}
          <Txt variant="caption" tone="secondary">
            100%
          </Txt>
        </View>
      </View>
    </Card>
  );
}
