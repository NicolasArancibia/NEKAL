import React, { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import Svg, { Circle, Path } from "react-native-svg";
import { color, motion, radius, shadow, space } from "../../../styles/theme";
import { useApp } from "../../../utils/AppContext";
import {
  acomodoTiempo,
  agruparNodos,
  Burbuja,
  diaDesdeRadio,
  NodoTiempo,
  Radios,
} from "../../../utils/acomodo/tiempo";
import { tonosDe } from "../../../utils/colores";
import {
  conexiones,
  fechaDe,
  moverAFecha,
  Ventana,
} from "../../../utils/espacio";
import { Destino } from "../../../utils/estructura";
import { haptic } from "../../../utils/haptics";
import { Item, localDay, saveItem, Workspace } from "../../../utils/model";
import { PressableScale, Txt } from "../base";
import { typeIcons } from "../ItemCard";
import AvisoBorde from "./AvisoBorde";
import CapaConexiones from "./CapaConexiones";
import HojaCosas from "./HojaCosas";
import { PLANO_ACTIVO } from "../../../utils/vistasActivas";

const VENTANAS: Ventana[] = ["hoy", "semana", "2semanas", "todo"];
const BANDA: Record<Ventana, string> = {
  hoy: "SEMANA",
  semana: "SEMANA",
  "2semanas": "2 SEMANAS",
  todo: "MÁS ADELANTE",
};
const HORA = 9;
const rad = (g: number) => (g * Math.PI) / 180;
const enCirculo = (c: number, r: number, grados: number) => ({
  x: c + r * Math.sin(rad(grados)),
  y: c - r * Math.cos(rad(grados)),
});
// Ángulo en grados, 0 = arriba, sentido horario.
const anguloDe = (dx: number, dy: number) =>
  ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;

function cuñaPath(c: number, r: number, desde: number, hasta: number) {
  if (hasta - desde >= 359.99)
    return `M ${c} ${c - r} A ${r} ${r} 0 1 1 ${c - 0.01} ${c - r} Z`;
  const a = enCirculo(c, r, desde),
    b = enCirculo(c, r, hasta);
  return `M ${c} ${c} L ${a.x} ${a.y} A ${r} ${r} 0 ${hasta - desde > 180 ? 1 : 0} 1 ${b.x} ${b.y} Z`;
}

const diaCorto = (dia: string) => {
  if (!dia) return "Sin fecha";
  const [y, m, n] = dia.split("-").map(Number);
  return new Date(y, m - 1, n).toLocaleDateString("es-CL", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

// Un punto de Tiempo: tocar abre, mantener quieto elige varias y mantener y
// mover cambia la fecha (encaja por día).
function Punto({
  n,
  item,
  mesa,
  seleccionada,
  enSeleccion,
  onTocar,
  onElegir,
  onMover,
  onSoltar,
}: {
  n: NodoTiempo;
  item: Item;
  mesa: Workspace | undefined;
  seleccionada: boolean;
  enSeleccion: boolean;
  onTocar: (id: string) => void;
  onElegir: (id: string) => void;
  onMover: (id: string, x: number, y: number) => void;
  onSoltar: (id: string, x: number, y: number, movio: boolean) => void;
}) {
  const reducido = useReducedMotion();
  const tx = useSharedValue(0),
    ty = useSharedValue(0),
    activo = useSharedValue(0),
    eligio = useSharedValue(0);
  const { id } = item;
  const { x, y } = n;
  const pan = Gesture.Pan()
    .activateAfterLongPress(250)
    .onStart(() => {
      activo.value = 1;
    })
    .onUpdate((e) => {
      tx.value = e.translationX;
      ty.value = e.translationY;
      if (!eligio.value)
        scheduleOnRN(onMover, id, x + e.translationX, y + e.translationY);
    })
    .onEnd((e) => {
      scheduleOnRN(
        onSoltar,
        id,
        x + e.translationX,
        y + e.translationY,
        !eligio.value && Math.hypot(e.translationX, e.translationY) > 6,
      );
    })
    .onFinalize(() => {
      tx.value = reducido ? 0 : withSpring(0, motion.snappy);
      ty.value = reducido ? 0 : withSpring(0, motion.snappy);
      activo.value = 0;
      eligio.value = 0;
    });
  const larga = Gesture.LongPress()
    .minDuration(500)
    .maxDistance(6)
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
    zIndex: activo.value ? 10 : 1,
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: activo.value ? 1.3 : 1 },
    ],
  }));
  const t = tonosDe(mesa?.color);
  const hoy = n.estado === "hoy";
  const hecho = n.estado === "hecho";
  const hueco = n.estado === "hueco";
  const fecha = fechaDe(item);
  return (
    <GestureDetector
      gesture={Gesture.Exclusive(Gesture.Simultaneous(pan, larga), tap)}
    >
      <Animated.View
        accessible
        accessibilityRole="button"
        accessibilityLabel={`${item.title}, ${fecha ? diaCorto(localDay(new Date(fecha))) : "sin fecha"}, ${mesa?.name ?? ""}`}
        accessibilityHint={
          enSeleccion
            ? "Toca para elegir"
            : "Toca para abrir; mantén y mueve para cambiar la fecha"
        }
        accessibilityActions={[{ name: "longpress", label: "Elegir varias" }]}
        onAccessibilityAction={() => onElegir(id)}
        onAccessibilityTap={() => onTocar(id)}
        style={[
          {
            position: "absolute",
            left: x - 22,
            top: y - 22,
            width: 44,
            height: 44,
            alignItems: "center",
            justifyContent: "center",
          },
          estilo,
        ]}
      >
        <View
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: hecho
              ? color.line
              : hoy
                ? color.ink
                : color.surface,
            borderWidth: seleccionada ? 2 : 1.4,
            borderStyle: n.estado === "bloqueado" || hueco ? "dashed" : "solid",
            borderColor: seleccionada
              ? color.primary
              : hecho
                ? color.lineStrong
                : t.base,
            outlineColor: color.primarySoft,
            outlineWidth: seleccionada ? 4 : 0,
            opacity: n.estado === "tenue" ? 0.3 : 1,
          }}
        >
          <Ionicons
            name={hecho ? "checkmark" : typeIcons[item.type]}
            size={10}
            color={hecho ? color.inkDone : hoy ? color.onPrimary : t.base}
          />
        </View>
        {item.priority === "urgente" && !hecho && (
          <View
            style={{
              position: "absolute",
              top: 11,
              right: 11,
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: color.danger,
            }}
          />
        )}
      </Animated.View>
    </GestureDetector>
  );
}

// La burbuja «+N» del círculo (spec H2 §4): lo que no cabe a la vista.
function BurbujaMas({
  b,
  mesa,
  onPress,
}: {
  b: Burbuja;
  mesa: Workspace | undefined;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${b.ids.length} cosas más en ${mesa?.name ?? "esta mesa"}. Ver la lista`}
      style={{
        position: "absolute",
        left: b.x - 14,
        top: b.y - 14,
        width: 28,
        height: 28,
        borderRadius: radius.pill,
        borderWidth: 2,
        borderColor: color.surface,
        backgroundColor: tonosDe(mesa?.color).base,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Txt variant="caption" weight={800} tone="onPrimary">
        +{b.ids.length}
      </Txt>
    </PressableScale>
  );
}

// El nombre de la cosa marcada, sobre su punto: se toca de nuevo para abrirla.
function EtiquetaPunto({
  n,
  item,
  mesa,
  lado,
}: {
  n: NodoTiempo;
  item: Item;
  mesa: Workspace | undefined;
  lado: number;
}) {
  const ancho = 150;
  const arriba = n.y > 56;
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: Math.min(Math.max(0, n.x - ancho / 2), lado - ancho),
        top: arriba ? n.y - 50 : n.y + 16,
        width: ancho,
        paddingHorizontal: space.md,
        paddingVertical: space.xs + 2,
        borderRadius: radius.sm,
        backgroundColor: color.surface,
        boxShadow: shadow.card,
      }}
    >
      <Txt variant="caption" weight={700} numberOfLines={1}>
        {item.title}
      </Txt>
      <Txt variant="caption" tone="secondary" numberOfLines={1}>
        {fechaDe(item) ? diaCorto(localDay(new Date(fechaDe(item)))) : "Sin fecha"}
        {mesa ? ` · ${mesa.name}` : ""}
      </Txt>
    </View>
  );
}

// Vista Tiempo (spec B §3.1): hoy al centro, un anillo por tramo y una porción
// por mesa. La distancia al centro es la fecha.
export default function TiempoVista({
  ventana,
  now,
  seleccion,
  marcada,
  onAbrir,
  onSeleccion,
  onMarcar,
  onCrear,
  onVentana,
  onEditarMesa,
  onEntrar,
  onAviso,
  onCuenta,
}: {
  ventana: Ventana;
  now: number;
  seleccion: string[];
  marcada: string;
  onAbrir: (i: Item) => void;
  onSeleccion: (ids: string[]) => void;
  onMarcar: (id: string) => void;
  onCrear: (d: Destino & { dia?: string }) => void;
  onVentana: (v: Ventana) => void;
  onEditarMesa: (w: Workspace) => void;
  onEntrar: (d: Destino) => void;
  onAviso: (texto: string) => void;
  onCuenta?: (n: number) => void; // cuántas cosas dibuja el círculo
}) {
  const { data, change } = useApp();
  const [caja, setCaja] = useState({ w: 0, h: 0 });
  const [cambio, setCambio] = useState<{ de: string; a: string } | null>(null);
  const ultimo = useRef("");
  const [lista, setLista] = useState<string[] | null>(null);
  const lado = Math.min(caja.w, caja.h);
  const c = lado / 2;
  const r = useMemo(
    () => (lado ? acomodoTiempo(data, ventana, now, lado) : null),
    [data, ventana, now, lado],
  );
  const porId = new Map(data.items.map((i) => [i.id, i]));
  const mesas = new Map(data.workspaces.map((w) => [w.id, w]));
  const enSeleccion = seleccion.length > 0;
  const nodos = new Map((r?.nodos ?? []).map((n) => [n.id, n]));
  // Más de 6 en un mismo sector y anillo: 3 puntos y una burbuja «+N».
  const { puntos, burbujas } = useMemo(
    () => agruparNodos(r?.nodos ?? []),
    [r],
  );
  useEffect(() => {
    onCuenta?.(r ? r.nodos.length : 0);
  }, [r]);

  const diaEn = (x: number, y: number, rs: Radios) =>
    diaDesdeRadio(Math.hypot(x - c, y - c), rs, ventana, now);
  const diaDe = (i: Item) => (fechaDe(i) ? localDay(new Date(fechaDe(i))) : "");

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
    // El primer toque marca la cosa (su nombre y sus flechas); el segundo la abre.
    else if (marcada === id) onAbrir(i);
    else onMarcar(id);
  };
  const elegir = (id: string) => {
    haptic.light();
    if (!seleccion.includes(id)) onSeleccion([...seleccion, id]);
  };
  const mover = (id: string, x: number, y: number) => {
    const i = porId.get(id);
    if (!i || !r) return;
    const dia = diaEn(x, y, r.radios);
    if (dia === ultimo.current) return;
    ultimo.current = dia;
    haptic.selection();
    setCambio({ de: diaCorto(diaDe(i)), a: diaCorto(dia) });
  };
  const soltar = (id: string, x: number, y: number, movio: boolean) => {
    ultimo.current = "";
    setCambio(null);
    const i = porId.get(id);
    if (!movio || !i || !r) return;
    const dia = diaEn(x, y, r.radios);
    if (dia === diaDe(i)) return;
    try {
      change((d) => {
        const actual = d.items.find((o) => o.id === id)!;
        return saveItem(d, moverAFecha(actual, dia, HORA));
      });
      haptic.success();
    } catch (e) {
      onAviso((e as Error).message);
    }
  };
  // Tocar el fondo: dentro del círculo crea en esa mesa y ese día.
  const fondo = (x: number, y: number) => {
    if (!r) return;
    if (marcada) return onMarcar("");
    if (enSeleccion) return;
    const dist = Math.hypot(x - c, y - c);
    if (dist > c) return;
    const ang = anguloDe(x - c, y - c);
    const s =
      r.sectores.find((q) => ang >= q.desde && ang < q.hasta) ?? r.sectores[0];
    onCrear({
      workspaceId: s.workspaceId,
      groupId: "",
      dia: diaEn(x, y, r.radios),
    });
  };
  const gestoFondo = Gesture.Simultaneous(
    Gesture.Tap()
      .runOnJS(true)
      .onEnd((e, ok) => ok && fondo(e.x, e.y)),
    // Abrir los dedos acorta el tiempo elegido; juntarlos lo alarga.
    Gesture.Pinch()
      .runOnJS(true)
      .onEnd((e) => {
        const k = VENTANAS.indexOf(ventana);
        const sig = e.scale > 1.2 ? k - 1 : e.scale < 0.8 ? k + 1 : k;
        if (sig !== k && VENTANAS[sig]) {
          haptic.selection();
          onVentana(VENTANAS[sig]);
        }
      }),
  );

  // Conexiones de lo marcado: flechas a lo que se ve; aviso por mesa para el resto.
  const flechas: {
    desde: { x: number; y: number };
    hasta: { x: number; y: number };
  }[] = [];
  const fuera = new Map<string, { n: number; a: Destino }>();
  const m = marcada ? nodos.get(marcada) : undefined;
  if (marcada && porId.has(marcada)) {
    const cx = conexiones(data, marcada);
    const corto = (
      a: { x: number; y: number },
      b: { x: number; y: number },
    ) => {
      const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      return {
        x: a.x + ((b.x - a.x) * 11) / d,
        y: a.y + ((b.y - a.y) * 11) / d,
      };
    };
    for (const [otra, entra] of [
      ...cx.requisitos.map((i) => [i, true] as const),
      ...cx.dependientes.map((i) => [i, false] as const),
    ]) {
      const p = nodos.get(otra.id);
      if (m && p) {
        const [a, b] = entra ? [p, m] : [m, p];
        flechas.push({ desde: corto(a, b), hasta: corto(b, a) });
      } else {
        const x = fuera.get(otra.workspaceId);
        fuera.set(otra.workspaceId, {
          n: (x?.n ?? 0) + 1,
          a: x?.a ?? { workspaceId: otra.workspaceId, groupId: otra.groupId },
        });
      }
    }
  }

  const etiquetaAnillo = (texto: string, radio: number) => {
    const p = enCirculo(c, radio, 315);
    return (
      <Txt
        key={texto}
        variant="caption"
        weight={700}
        tone="secondary"
        style={{
          position: "absolute",
          left: p.x - 60,
          top: p.y - 18,
          width: 120,
          textAlign: "center",
          letterSpacing: 0.4,
        }}
      >
        {texto}
      </Txt>
    );
  };

  return (
    <View
      style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
      onLayout={(e) =>
        setCaja({
          w: e.nativeEvent.layout.width,
          h: e.nativeEvent.layout.height - 72,
        })
      }
    >
      {r && (
        <View style={{ width: lado, height: lado, marginBottom: 72 }}>
          <GestureDetector gesture={gestoFondo}>
            <View
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: lado,
                height: lado,
              }}
            >
              <Svg width={lado} height={lado}>
                {r.sectores.map((s) => (
                  <Path
                    key={s.workspaceId}
                    d={cuñaPath(c, c, s.desde, s.hasta)}
                    fill={tonosDe(mesas.get(s.workspaceId)?.color).suave}
                  />
                ))}
                {[
                  r.radios.hoy,
                  r.radios.manana,
                  r.radios.ventanaDesde,
                  r.radios.ventanaHasta,
                ].map((radio) => (
                  <Circle
                    key={radio}
                    cx={c}
                    cy={c}
                    r={radio}
                    fill="none"
                    stroke={color.surface}
                    strokeWidth={1.6}
                  />
                ))}
                <Circle
                  cx={c}
                  cy={c}
                  r={r.radios.sinFecha}
                  fill="none"
                  stroke={color.surface}
                  strokeWidth={1.6}
                  strokeDasharray="3 4"
                />
                <Circle
                  cx={c}
                  cy={c}
                  r={r.radios.centro}
                  fill={color.primary}
                />
              </Svg>
            </View>
          </GestureDetector>
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: c - r.radios.centro,
              top: c - r.radios.centro,
              width: 2 * r.radios.centro,
              height: 2 * r.radios.centro,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Txt variant="caption" weight={800} tone="onPrimary">
              Hoy
            </Txt>
            <Txt variant="caption" tone="onPrimary" numberOfLines={1}>
              {new Date(now).toLocaleDateString("es-CL", {
                weekday: "short",
                day: "numeric",
              })}
            </Txt>
          </View>
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: lado,
              height: lado,
            }}
          >
            {etiquetaAnillo("MAÑANA", r.radios.manana)}
            {etiquetaAnillo(
              BANDA[ventana],
              (r.radios.ventanaDesde + r.radios.ventanaHasta) / 2,
            )}
            {etiquetaAnillo("SIN FECHA", r.radios.sinFecha)}
          </View>
          {r.sectores.map((s) => {
            const w = mesas.get(s.workspaceId);
            if (!w) return null;
            const p = enCirculo(
              c,
              c - 14,
              (s.desde + s.hasta) / 2,
            );
            return (
              <GestureDetector
                key={s.workspaceId}
                gesture={Gesture.LongPress()
                  .minDuration(500)
                  .runOnJS(true)
                  .onStart(() => {
                    haptic.selection();
                    onEditarMesa(w);
                  })}
              >
                <View
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel={`${w.name}: mantén para editar la mesa`}
                  style={{
                    position: "absolute",
                    left: Math.min(Math.max(0, p.x - 50), lado - 100),
                    top: Math.min(Math.max(0, p.y - 12), lado - 24),
                    width: 100,
                    height: 24,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Txt
                    variant="callout"
                    weight={800}
                    numberOfLines={1}
                    style={{ color: tonosDe(w.color).base }}
                  >
                    {w.name}
                  </Txt>
                </View>
              </GestureDetector>
            );
          })}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: lado,
              height: lado,
            }}
          >
            <CapaConexiones flechas={flechas} />
          </View>
          {puntos.map((n) => {
            const i = porId.get(n.id);
            return i ? (
              <Punto
                key={n.id}
                n={n}
                item={i}
                mesa={mesas.get(n.workspaceId)}
                seleccionada={seleccion.includes(n.id) || marcada === n.id}
                enSeleccion={enSeleccion}
                onTocar={tocar}
                onElegir={elegir}
                onMover={mover}
                onSoltar={soltar}
              />
            ) : null;
          })}
          {burbujas.map((b) => (
            <BurbujaMas
              key={`${b.workspaceId}|${b.anillo}`}
              b={b}
              mesa={mesas.get(b.workspaceId)}
              onPress={() => setLista(b.ids)}
            />
          ))}
          {marcada && nodos.get(marcada) && porId.get(marcada) && (
            <EtiquetaPunto
              n={nodos.get(marcada)!}
              item={porId.get(marcada)!}
              mesa={mesas.get(nodos.get(marcada)!.workspaceId)}
              lado={lado}
            />
          )}
        </View>
      )}
      {cambio && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: space.sm,
            alignSelf: "center",
            paddingHorizontal: space.md,
            paddingVertical: space.xs,
            borderRadius: radius.pill,
            backgroundColor: color.ink,
          }}
        >
          <Txt variant="callout" weight={700} tone="onPrimary">
            {cambio.de} → {cambio.a}
          </Txt>
        </View>
      )}
      {PLANO_ACTIVO && fuera.size > 0 && (
        <View
          style={{
            position: "absolute",
            top: space.sm,
            right: space.screen,
            gap: space.sm,
            alignItems: "flex-end",
          }}
        >
          {[...fuera].map(([wid, { n, a }]) => {
            const w = mesas.get(wid);
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
      {lista && (
        <HojaCosas
          titulo={`${lista.length} cosas`}
          items={lista
            .map((id) => porId.get(id))
            .filter((x): x is Item => !!x)}
          onAbrir={(it) => {
            setLista(null);
            onMarcar(it.id);
            onAbrir(it);
          }}
          onCerrar={() => setLista(null)}
        />
      )}
    </View>
  );
}
