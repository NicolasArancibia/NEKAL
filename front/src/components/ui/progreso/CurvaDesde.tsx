import { useState } from "react";
import { View } from "react-native";
import Svg, { Circle, G, Line, Path, Text as SvgText } from "react-native-svg";
import { color, font, type } from "../../../styles/theme";
import {
  Desde,
  diasEntre,
  fechaLarga,
  mesLargo,
} from "../../../utils/progreso/desde";
import { puntosParaNivel } from "../../../utils/progreso/nivel";
import { miles } from "../../../utils/progreso/logros";
import { Card, Txt } from "../base";

const ALTO = 112,
  ARRIBA = 24,
  BASE = 86;

const plural = (n: number, uno: string, varios: string) =>
  `${miles(n)} ${n === 1 ? uno : varios}`;

// Desde el día 1 (spec E §7.2): texto y curva de puntos con cada subida de nivel.
// Sin Neka: en el Resumen ya está arriba (una vez por pantalla).
export default function CurvaDesde({
  desde,
  hoy,
}: {
  desde: Desde;
  hoy: string;
}) {
  const [ancho, setAncho] = useState(0);
  const total = desde.curva[desde.curva.length - 1]?.puntos ?? 0;
  const inicio =
    desde.dia1 === hoy
      ? "Empezaste hoy."
      : `Empezaste el ${fechaLarga(desde.dia1)}.`;
  const despues = desde.nivelesSubidos
    ? `Desde ahí subiste ${plural(desde.nivelesSubidos, "nivel", "niveles")} y completaste ${plural(desde.listas, "cosa", "cosas")}.`
    : `Desde ahí completaste ${plural(desde.listas, "cosa", "cosas")}.`;
  const X = (dia: string) =>
    4 +
    (diasEntre(desde.dia1, dia) / Math.max(1, desde.dias - 1)) * (ancho - 8);
  const Y = (p: number) => BASE - (p / Math.max(1, total)) * (BASE - ARRIBA);
  const linea = desde.curva.map((c) => `${X(c.dia)},${Y(c.puntos)}`).join(" L");
  const primeroDeMes = desde.curva.length
    ? [desde.dia1, ...mesesEntre(desde.dia1, hoy)]
    : [];
  const subidas = desde.subidas;
  return (
    <Card>
      <View style={{ gap: 2 }}>
        <Txt variant="headline">{inicio}</Txt>
        <Txt variant="callout" tone="secondary">
          {despues}
        </Txt>
      </View>
      {desde.dias >= 14 && (
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={`Puntos acumulados desde el ${fechaLarga(desde.dia1)}: de 0 a ${miles(total)}; subiste ${plural(desde.nivelesSubidos, "nivel", "niveles")}`}
          onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
          style={{ height: ALTO }}
        >
          {ancho > 0 && (
            <Svg width={ancho} height={ALTO}>
              <Line x1={0} x2={ancho} y1={BASE} y2={BASE} stroke={color.line} />
              <Path
                d={`M${X(desde.dia1)},${BASE} L${linea} L${X(hoy)},${BASE} Z`}
                fill={color.primarySoft}
              />
              <Path
                d={`M${linea}`}
                fill="none"
                stroke={color.primary}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {subidas.map((s, k) => {
                const x = X(s.dia),
                  y = Y(puntosParaNivel(s.nivel));
                const etiqueta = k === 0 || k === subidas.length - 1;
                return (
                  <G key={s.dia + s.nivel}>
                    <Circle
                      cx={x}
                      cy={y}
                      r={4}
                      fill={color.primary}
                      stroke={color.surface}
                      strokeWidth={2}
                    />
                    {etiqueta && (
                      <SvgText
                        x={Math.min(Math.max(x, 24), ancho - 24)}
                        y={y - 10}
                        textAnchor="middle"
                        fontSize={type.caption.size}
                        fontFamily={font[600]}
                        fill={color.inkSecondary}
                      >
                        {`Nivel ${s.nivel}`}
                      </SvgText>
                    )}
                  </G>
                );
              })}
              {primeroDeMes.map((dia) => (
                <SvgText
                  key={dia}
                  x={Math.max(X(dia), 12)}
                  y={ALTO - 4}
                  textAnchor="middle"
                  fontSize={type.caption.size}
                  fontFamily={font[500]}
                  fill={color.inkSecondary}
                >
                  {mesLargo(dia).slice(0, 3)}
                </SvgText>
              ))}
            </Svg>
          )}
        </View>
      )}
    </Card>
  );
}

// El 1 de cada mes después del día 1 y hasta hoy.
function mesesEntre(dia1: string, hoy: string): string[] {
  const out: string[] = [];
  let [y, m] = dia1.split("-").map(Number);
  for (;;) {
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
    const dia = `${y}-${String(m).padStart(2, "0")}-01`;
    if (dia > hoy) return out;
    out.push(dia);
  }
}
