import React, { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Svg, { Circle, Line } from "react-native-svg";
import { color, radius, space } from "../../../styles/theme";
import { useApp } from "../../../utils/AppContext";
import {
  acomodoPlanoLejos,
  PuntoPlano,
  ZonaLejos,
} from "../../../utils/acomodo/plano";
import { Tonos, tonosDe } from "../../../utils/colores";
import { Ventana } from "../../../utils/espacio";
import { Destino, GENERAL } from "../../../utils/estructura";
import { haptic } from "../../../utils/haptics";
import { sinAnteriores } from "../../../utils/rutinas";
import { PressableScale, Txt } from "../base";
import FichaPlano, { fichaProps } from "./FichaPlano";

const plana = (zs: ZonaLejos[], nivel = 0): [ZonaLejos, number][] =>
  zs.flatMap((z) => [
    [z, nivel] as [ZonaLejos, number],
    ...plana(z.hijos, nivel + 1),
  ]);

// Cada punto se une a sus 2 vecinos más cercanos de la misma zona (maqueta 02).
function lineas(ps: PuntoPlano[]) {
  const pares = new Map<string, [PuntoPlano, PuntoPlano]>();
  ps.forEach((p, i) =>
    ps
      .map((q, j) => ({ j, d: (q.x - p.x) ** 2 + (q.y - p.y) ** 2 }))
      .filter((x) => x.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2)
      .forEach(({ j }) => pares.set(`${Math.min(i, j)}|${Math.max(i, j)}`, [p, ps[j]])),
  );
  return [...pares.values()];
}

function Punto({ p, tono }: { p: PuntoPlano; tono: Tonos }) {
  const hueco = p.estado === "hueco";
  return (
    <Circle
      cx={p.x}
      cy={p.y}
      r={p.estado === "hoy" ? 5 : 4}
      fill={
        p.estado === "hecho"
          ? color.lineStrong
          : hueco
            ? color.surface
            : p.estado === "hoy"
              ? color.ink
              : tono.base
      }
      stroke={hueco || p.estado === "bloqueado" ? tono.base : "none"}
      strokeWidth={1.4}
      strokeDasharray={p.estado === "bloqueado" ? "2 2" : undefined}
      opacity={p.estado === "tenue" ? 0.3 : 1}
    />
  );
}

function Zona({
  z,
  nivel,
  tono,
  onEntrar,
  onEditar,
}: {
  z: ZonaLejos;
  nivel: number;
  tono: Tonos;
  onEntrar: (d: Destino) => void;
  onEditar: (z: ZonaLejos) => void;
}) {
  const entrar = () => {
    haptic.selection();
    onEntrar({ workspaceId: z.workspaceId, groupId: z.groupId });
  };
  const gesto = Gesture.Simultaneous(
    Gesture.Exclusive(
      Gesture.LongPress()
        .minDuration(500)
        .runOnJS(true)
        .onStart(() => {
          haptic.selection();
          onEditar(z);
        }),
      Gesture.Tap()
        .runOnJS(true)
        .onEnd((_e, ok) => ok && entrar()),
    ),
    // Acercar con dos dedos sobre una zona también entra.
    Gesture.Pinch()
      .runOnJS(true)
      .onEnd((e) => e.scale > 1.15 && entrar()),
  );
  return (
    <GestureDetector gesture={gesto}>
      <View
        accessible
        accessibilityRole="button"
        accessibilityLabel={`${z.nombre}, ${z.total} ${z.total === 1 ? "cosa" : "cosas"}`}
        accessibilityHint="Toca para entrar; mantén para editar"
        onAccessibilityTap={entrar}
        style={{
          position: "absolute",
          left: z.rect.x,
          top: z.rect.y,
          width: z.rect.w,
          height: z.rect.h,
          backgroundColor: nivel ? tono.zonaInterna : tono.zona,
          borderTopLeftRadius: nivel ? 18 : 30,
          borderTopRightRadius: nivel ? 26 : 44,
          borderBottomRightRadius: nivel ? 20 : 34,
          borderBottomLeftRadius: nivel ? 28 : 48,
          borderWidth: 1.5,
          borderColor: color.surface,
          paddingHorizontal: nivel ? space.sm : space.md,
          paddingTop: nivel ? space.xs : space.sm,
        }}
      >
        <Txt variant="caption" weight={800} numberOfLines={1}>
          {z.tipo === "rutina" ? "↻ " : ""}
          {z.nombre}
          <Txt variant="caption" weight={700} tone="secondary">
            {"  "}
            {z.total}
          </Txt>
        </Txt>
      </View>
    </GestureDetector>
  );
}

// Plano de lejos (spec B §3.3): sueltas de General arriba, cada mesa como un
// bloque de color con sus grupos adentro y las cosas como puntos conectados.
export default function PlanoLejos({
  ventana,
  now,
  onEntrar,
  onEditar,
}: {
  ventana: Ventana;
  now: number;
  onEntrar: (d: Destino) => void;
  onEditar: (z: ZonaLejos) => void;
}) {
  const { data } = useApp();
  const [ancho, setAncho] = useState(0);
  const vista = useMemo(() => sinAnteriores(data, now), [data, now]);
  const r = useMemo(
    () => (ancho ? acomodoPlanoLejos(vista, ventana, now, ancho) : null),
    [vista, ventana, now, ancho],
  );
  const tono = (wid: string) =>
    tonosDe(data.workspaces.find((w) => w.id === wid)?.color);
  const zonas = r ? plana(r.zonas) : [];
  const anchoSuelta = (ancho - 2 * 12 - 2 * 8 - 48) / 2;
  return (
    <ScrollView
      style={{ flex: 1 }}
      onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
      contentContainerStyle={{ height: (r?.alto ?? 0) + 96 }}
    >
      {r && (
        <>
          {!!r.sueltas.length && (
            <View
              style={{
                position: "absolute",
                left: 12,
                top: 8,
                right: 12,
                height: 44,
                flexDirection: "row",
                alignItems: "center",
                gap: space.sm,
              }}
            >
              {r.sueltas.map((i) => (
                <PressableScale
                  key={i.id}
                  onPress={() =>
                    onEntrar({ workspaceId: GENERAL, groupId: "" })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={i.title}
                  style={{ width: anchoSuelta, height: 44 }}
                >
                  <FichaPlano
                    item={i}
                    {...fichaProps(vista, i, ventana, now)}
                  />
                </PressableScale>
              ))}
              {r.masSueltas > 0 && (
                <PressableScale
                  onPress={() =>
                    onEntrar({ workspaceId: GENERAL, groupId: "" })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`${r.masSueltas} cosas más sueltas en General`}
                  style={{
                    minWidth: 44,
                    height: 32,
                    paddingHorizontal: space.sm,
                    borderRadius: radius.pill,
                    backgroundColor: color.surface,
                    borderWidth: 1,
                    borderColor: color.line,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Txt variant="caption" weight={700} tone="primary">
                    +{r.masSueltas}
                  </Txt>
                </PressableScale>
              )}
            </View>
          )}
          {zonas.map(([z, nivel]) => (
            <Zona
              key={z.id}
              z={z}
              nivel={nivel}
              tono={tono(z.workspaceId)}
              onEntrar={onEntrar}
              onEditar={onEditar}
            />
          ))}
          <View
            pointerEvents="none"
            style={{ position: "absolute", left: 0, top: 0, width: ancho, height: r.alto }}
          >
          <Svg width={ancho} height={r.alto}>
            {zonas.map(([z]) => {
              const t = tono(z.workspaceId);
              return (
                <React.Fragment key={z.id}>
                  {lineas(z.puntos).map(([a, b], k) => (
                    <Line
                      key={k}
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke={t.base}
                      strokeOpacity={0.28}
                      strokeWidth={1}
                    />
                  ))}
                  {z.puntos.map((p) => (
                    <Punto key={p.id} p={p} tono={t} />
                  ))}
                </React.Fragment>
              );
            })}
          </Svg>
          </View>
        </>
      )}
    </ScrollView>
  );
}
