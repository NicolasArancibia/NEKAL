import React, { useMemo, useState } from "react";
import { View } from "react-native";
import {
  Gesture,
  GestureDetector,
  ScrollView,
} from "react-native-gesture-handler";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { color, motion, radius, space } from "../../../styles/theme";
import { useApp } from "../../../utils/AppContext";
import {
  acomodoPlanoCerca,
  FichaPos,
  indiceEn,
  Rect,
  ZonaCerca,
} from "../../../utils/acomodo/plano";
import { Tonos, tonosDe } from "../../../utils/colores";
import { conexiones, esRutina, Ventana } from "../../../utils/espacio";
import { Destino, moverItems, reordenar } from "../../../utils/estructura";
import { haptic } from "../../../utils/haptics";
import { Group, Item, passive, saveItem } from "../../../utils/model";
import { ocurrencias, sinAnteriores } from "../../../utils/rutinas";
import { Chip, PressableScale, Txt } from "../base";
import AvisoBorde from "./AvisoBorde";
import CapaConexiones from "./CapaConexiones";
import FichaPlano, { fichaProps } from "./FichaPlano";

const plana = (zs: ZonaCerca[], nivel = 0): [ZonaCerca, number][] =>
  zs.flatMap((z) => [
    [z, nivel] as [ZonaCerca, number],
    ...plana(z.hijos, nivel + 1),
  ]);
const dentro = (r: Rect, x: number, y: number) =>
  x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
const centro = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
// Punto del borde de `r` en dirección a `hacia` (las flechas no se tapan con
// las fichas).
function borde(r: Rect, hacia: { x: number; y: number }) {
  const c = centro(r);
  const dx = hacia.x - c.x,
    dy = hacia.y - c.y;
  const t = Math.min(
    dx ? (r.w / 2 + 3) / Math.abs(dx) : Infinity,
    dy ? (r.h / 2 + 3) / Math.abs(dy) : Infinity,
  );
  return t === Infinity ? c : { x: c.x + dx * t, y: c.y + dy * t };
}

type Linea = {
  x1: SharedValue<number>;
  y1: SharedValue<number>;
  x2: SharedValue<number>;
  y2: SharedValue<number>;
  ver: SharedValue<number>;
};

// Una ficha con sus gestos: tocar abre (o elige, en modo selección), mantener
// quieto 500 ms elige varias y mantener 350 ms y mover la arrastra.
function FichaMovil({
  f,
  item,
  children,
  enSeleccion,
  onTocar,
  onElegir,
  onArrastre,
  onSoltar,
}: {
  f: FichaPos;
  item: Item;
  children: React.ReactNode;
  enSeleccion: boolean;
  onTocar: (id: string) => void;
  onElegir: (id: string) => void;
  onArrastre: (activo: boolean) => void;
  onSoltar: (id: string, x: number, y: number) => void;
}) {
  const tx = useSharedValue(0),
    ty = useSharedValue(0),
    activa = useSharedValue(0),
    eligio = useSharedValue(0);
  const c = centro(f.rect);
  const id = item.id;
  const pan = Gesture.Pan()
    .activateAfterLongPress(350)
    .onStart(() => {
      activa.value = 1;
      scheduleOnRN(onArrastre, true);
    })
    .onUpdate((e) => {
      tx.value = e.translationX;
      ty.value = e.translationY;
    })
    .onEnd((e) => {
      if (!eligio.value && Math.hypot(e.translationX, e.translationY) > 8)
        scheduleOnRN(onSoltar, id, c.x + e.translationX, c.y + e.translationY);
    })
    .onFinalize(() => {
      tx.value = withSpring(0, motion.snappy);
      ty.value = withSpring(0, motion.snappy);
      activa.value = 0;
      eligio.value = 0;
      scheduleOnRN(onArrastre, false);
    });
  const larga = Gesture.LongPress()
    .minDuration(500)
    .maxDistance(8)
    .onStart(() => {
      eligio.value = 1;
      scheduleOnRN(onElegir, id);
    });
  const tap = Gesture.Tap()
    .maxDuration(300)
    .onEnd((_e, ok) => {
      if (ok) scheduleOnRN(onTocar, id);
    });
  const estilo = useAnimatedStyle(() => ({
    zIndex: activa.value ? 10 : 1,
    opacity: activa.value ? 0.92 : 1,
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: activa.value ? 1.04 : 1 },
    ],
  }));
  return (
    <GestureDetector
      gesture={Gesture.Exclusive(Gesture.Simultaneous(pan, larga), tap)}
    >
      <Animated.View
        accessible
        accessibilityRole="button"
        accessibilityLabel={`${item.title}, ${item.type}`}
        accessibilityHint={enSeleccion ? "Toca para elegir" : "Toca para abrir"}
        accessibilityActions={[{ name: "longpress", label: "Elegir varias" }]}
        onAccessibilityAction={() => onElegir(id)}
        onAccessibilityTap={() => onTocar(id)}
        style={[
          {
            position: "absolute",
            left: f.rect.x,
            top: f.rect.y,
            width: f.rect.w,
            height: f.rect.h,
            borderRadius: radius.badge,
          },
          estilo,
        ]}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

// El puntito del borde derecho: arrastrarlo hasta otra ficha las conecta.
function PuntoConectar({
  f,
  id,
  tono,
  linea,
  onConectar,
}: {
  f: FichaPos;
  id: string;
  tono: Tonos;
  linea: Linea;
  onConectar: (id: string, x: number, y: number) => void;
}) {
  const x = f.rect.x + f.rect.w - 4,
    y = f.rect.y + f.rect.h / 2;
  const pan = Gesture.Pan()
    .minDistance(4)
    .onStart(() => {
      linea.x1.value = x;
      linea.y1.value = y;
      linea.x2.value = x;
      linea.y2.value = y;
      linea.ver.value = 1;
    })
    .onUpdate((e) => {
      linea.x2.value = x + e.translationX;
      linea.y2.value = y + e.translationY;
    })
    .onEnd((e) => {
      scheduleOnRN(onConectar, id, x + e.translationX, y + e.translationY);
    })
    .onFinalize(() => {
      linea.ver.value = 0;
    });
  return (
    <GestureDetector gesture={pan}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          position: "absolute",
          left: x - 14,
          top: y - 14,
          width: 28,
          height: 28,
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
        }}
      >
        <View
          style={{
            width: 9,
            height: 9,
            borderRadius: 5,
            backgroundColor: color.surface,
            borderWidth: 2,
            borderColor: tono.base,
          }}
        />
      </View>
    </GestureDetector>
  );
}

function LineaViva({ l }: { l: Linea }) {
  const estilo = useAnimatedStyle(() => {
    const dx = l.x2.value - l.x1.value,
      dy = l.y2.value - l.y1.value;
    return {
      opacity: l.ver.value,
      left: l.x1.value,
      top: l.y1.value - 1,
      width: Math.hypot(dx, dy),
      transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }],
    };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          height: 2,
          backgroundColor: color.primary,
          transformOrigin: "left center",
          zIndex: 20,
        },
        estilo,
      ]}
    />
  );
}

// Plano de cerca (spec B §3.3): fichas ordenadas en grilla, grupos como zonas
// y la persona decide el orden.
export default function PlanoCerca({
  destino,
  ventana,
  now,
  seleccion,
  marcada,
  onAbrir,
  onSeleccion,
  onMarcar,
  onEntrar,
  onCrear,
  onEditar,
  onAviso,
}: {
  destino: Destino;
  ventana: Ventana;
  now: number;
  seleccion: string[];
  marcada: string;
  onAbrir: (i: Item) => void;
  onSeleccion: (ids: string[]) => void;
  onMarcar: (id: string) => void;
  onEntrar: (d: Destino) => void;
  onCrear: (d: Destino) => void;
  onEditar: (g: Group) => void;
  onAviso: (texto: string) => void;
}) {
  const { data, change } = useApp();
  const [ancho, setAncho] = useState(0);
  const [verAnteriores, setVerAnteriores] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const linea: Linea = {
    x1: useSharedValue(0),
    y1: useSharedValue(0),
    x2: useSharedValue(0),
    y2: useSharedValue(0),
    ver: useSharedValue(0),
  };
  const rutina = data.groups.find(
    (g) => g.id === destino.groupId && esRutina(g),
  );
  const anteriores = rutina
    ? ocurrencias(data, rutina.id, now).anteriores.length
    : 0;
  const vista = useMemo(
    () => (verAnteriores ? data : sinAnteriores(data, now)),
    [data, now, verAnteriores],
  );
  const r = useMemo(
    () => (ancho ? acomodoPlanoCerca(vista, destino, ancho) : null),
    [vista, destino, ancho],
  );
  const zonas = r ? plana(r.zonas) : [];
  const fichas = r ? [...r.sueltas, ...zonas.flatMap(([z]) => z.fichas)] : [];
  const porId = new Map(vista.items.map((i) => [i.id, i]));
  const grupos = new Map(vista.groups.map((g) => [g.id, g]));
  const tono = tonosDe(
    data.workspaces.find((w) => w.id === destino.workspaceId)?.color,
  );
  const enSeleccion = seleccion.length > 0;

  const tocar = (id: string) => {
    const i = porId.get(id);
    if (!i) return;
    haptic.selection();
    if (enSeleccion)
      onSeleccion(
        seleccion.includes(id)
          ? seleccion.filter((x) => x !== id)
          : [...seleccion, id],
      );
    else {
      onMarcar(id);
      onAbrir(i);
    }
  };
  const elegir = (id: string) => {
    haptic.light();
    if (!seleccion.includes(id)) onSeleccion([...seleccion, id]);
  };
  const soltar = (id: string, x: number, y: number) => {
    const item = porId.get(id);
    if (!item || !r) return;
    const z = zonas
      .filter(([z]) => dentro(z.rect, x, y))
      .sort((a, b) => b[1] - a[1])[0]?.[0];
    const lugar = z
      ? {
          a: { workspaceId: destino.workspaceId, groupId: z.id },
          fichas: z.fichas,
        }
      : { a: destino, fichas: r.sueltas };
    let indice = indiceEn(lugar, x, y);
    try {
      if (
        item.workspaceId === lugar.a.workspaceId &&
        item.groupId === lugar.a.groupId
      ) {
        const ahora = lugar.fichas.findIndex((f) => f.id === id);
        if (ahora >= 0 && ahora < indice) indice--;
        change((d) => reordenar(d, id, indice));
      } else change((d) => reordenar(moverItems(d, [id], lugar.a), id, indice));
      haptic.selection();
    } catch (e) {
      onAviso((e as Error).message);
    }
  };
  const conectar = (id: string, x: number, y: number) => {
    const otra = fichas.find((f) => f.id !== id && dentro(f.rect, x, y));
    const a = porId.get(id),
      b = otra && porId.get(otra.id);
    if (!a || !b) return;
    try {
      change((d) => {
        const i = d.items.find((o) => o.id === id)!;
        return i.dependencies.includes(b.id)
          ? d
          : saveItem(d, { ...i, dependencies: [...i.dependencies, b.id] });
      });
      haptic.success();
      onAviso(`«${a.title}» ahora espera a «${b.title}».`);
    } catch (e) {
      onAviso((e as Error).message);
    }
  };
  const tocarFondo = (d: Destino) => {
    if (marcada) return onMarcar("");
    if (!enSeleccion) onCrear(d);
  };

  // Conexiones de la cosa marcada: flechas a las que se ven y avisos por mesa
  // para las que no.
  const flechas: {
    desde: { x: number; y: number };
    hasta: { x: number; y: number };
  }[] = [];
  const fuera = new Map<string, { n: number; a: Destino }>();
  if (marcada && porId.has(marcada)) {
    const pos = new Map(fichas.map((f) => [f.id, f.rect]));
    const m = pos.get(marcada);
    const c = conexiones(data, marcada);
    for (const [otra, entra] of [
      ...c.requisitos.map((i) => [i, true] as const),
      ...c.dependientes.map((i) => [i, false] as const),
    ]) {
      const p = pos.get(otra.id);
      if (m && p) {
        const [a, b] = entra ? [p, m] : [m, p];
        flechas.push({ desde: borde(a, centro(b)), hasta: borde(b, centro(a)) });
      }
      else {
        const k = otra.workspaceId;
        const x = fuera.get(k);
        fuera.set(k, {
          n: (x?.n ?? 0) + 1,
          a: x?.a ?? { workspaceId: k, groupId: otra.groupId },
        });
      }
    }
  }

  return (
    <View style={{ flex: 1 }}>
      {anteriores > 0 && (
        <View
          style={{
            paddingHorizontal: space.screen,
            paddingBottom: space.sm,
            flexDirection: "row",
          }}
        >
          <Chip
            title={
              verAnteriores
                ? "Ocultar anteriores"
                : `Anteriores (${anteriores})`
            }
            selected={verAnteriores}
            onPress={() => setVerAnteriores((v) => !v)}
          />
        </View>
      )}
      <ScrollView
        style={{ flex: 1 }}
        scrollEnabled={!arrastrando}
        onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
        contentContainerStyle={{ height: (r?.alto ?? 0) + 120 }}
      >
        {r && (
          <>
            <GestureDetector
              gesture={Gesture.Tap()
                .runOnJS(true)
                .onEnd((_e, ok) => ok && tocarFondo(destino))}
            >
              <View
                accessibilityLabel="Crear aquí"
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  right: 0,
                  height: r.alto + 120,
                }}
              />
            </GestureDetector>
            {!r.sueltas.length && !r.zonas.length && (
              <View pointerEvents="none" style={{ padding: space.xxl }}>
                <Txt tone="secondary" align="center">
                  Aquí no hay nada todavía. Toca para crear.
                </Txt>
              </View>
            )}
            {zonas.map(([z, nivel]) => {
              const g = grupos.get(z.id);
              const w = z.fichas[0]?.rect.w ?? 0;
              const k = z.fichas.length;
              return (
                <React.Fragment key={z.id}>
                  <GestureDetector
                    gesture={Gesture.Exclusive(
                      Gesture.LongPress()
                        .minDuration(500)
                        .runOnJS(true)
                        .onStart(() => {
                          if (!g) return;
                          haptic.selection();
                          onEditar(g);
                        }),
                      Gesture.Tap()
                        .runOnJS(true)
                        .onEnd(
                          (_e, ok) =>
                            ok &&
                            tocarFondo({
                              workspaceId: destino.workspaceId,
                              groupId: z.id,
                            }),
                        ),
                    )}
                  >
                    <View
                      accessible
                      accessibilityRole="button"
                      accessibilityLabel={`${z.nombre}: toca para crear aquí, mantén para editar`}
                      style={{
                        position: "absolute",
                        left: z.rect.x,
                        top: z.rect.y,
                        width: z.rect.w,
                        height: z.rect.h,
                        backgroundColor: nivel ? tono.zonaInterna : tono.zona,
                        borderTopLeftRadius: 30,
                        borderTopRightRadius: 44,
                        borderBottomRightRadius: 34,
                        borderBottomLeftRadius: 48,
                        borderWidth: 1.5,
                        borderColor: color.surface,
                        paddingHorizontal: space.md,
                        paddingTop: space.sm,
                      }}
                    >
                      <Txt variant="callout" weight={800} numberOfLines={1}>
                        {z.tipo === "rutina" ? "↻ " : ""}
                        {z.nombre}
                        <Txt variant="caption" weight={700} tone="secondary">
                          {"  "}
                          {z.fichas.length + z.mas}
                        </Txt>
                      </Txt>
                    </View>
                  </GestureDetector>
                  {z.mas > 0 && (
                    <PressableScale
                      onPress={() =>
                        onEntrar({
                          workspaceId: destino.workspaceId,
                          groupId: z.id,
                        })
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`${z.mas} más en ${z.nombre}`}
                      style={{
                        position: "absolute",
                        left: z.rect.x + 8 + (k % 2) * (w + 8),
                        top: z.rect.y + 30 + Math.floor(k / 2) * 58 + 9,
                        height: 32,
                        paddingHorizontal: space.md,
                        borderRadius: radius.pill,
                        backgroundColor: color.surface,
                        borderWidth: 1,
                        borderColor: color.line,
                        justifyContent: "center",
                      }}
                    >
                      <Txt variant="caption" weight={700} tone="primary">
                        + {z.mas} más
                      </Txt>
                    </PressableScale>
                  )}
                </React.Fragment>
              );
            })}
            {fichas.map((f) => {
              const i = porId.get(f.id);
              if (!i) return null;
              return (
                <FichaMovil
                  key={f.id}
                  f={f}
                  item={i}
                  enSeleccion={enSeleccion}
                  onTocar={tocar}
                  onElegir={elegir}
                  onArrastre={setArrastrando}
                  onSoltar={soltar}
                >
                  <FichaPlano
                    item={i}
                    seleccionada={seleccion.includes(i.id) || marcada === i.id}
                    {...fichaProps(vista, i, ventana, now)}
                  />
                </FichaMovil>
              );
            })}
            {!enSeleccion &&
              fichas.map((f) => {
                const i = porId.get(f.id);
                return i && !passive(i) ? (
                  <PuntoConectar
                    key={`p${f.id}`}
                    f={f}
                    id={i.id}
                    tono={tono}
                    linea={linea}
                    onConectar={conectar}
                  />
                ) : null;
              })}
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: ancho,
                height: r.alto,
                zIndex: 5,
              }}
            >
              <CapaConexiones flechas={flechas} />
            </View>
            <LineaViva l={linea} />
          </>
        )}
      </ScrollView>
      {fuera.size > 0 && (
        <View
          style={{
            position: "absolute",
            top: anteriores > 0 ? 48 : space.sm,
            right: space.screen,
            gap: space.sm,
            alignItems: "flex-end",
          }}
        >
          {[...fuera].map(([wid, { n, a }]) => {
            const w = data.workspaces.find((x) => x.id === wid);
            return (
              <AvisoBorde
                key={wid}
                texto={`${n} en ${w?.name ?? "otra mesa"}`}
                tonoHex={tonosDe(w?.color).base}
                onPress={() => onEntrar(a)}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}
