import { useEffect, useMemo, useState } from "react";
import {
  AccessibilityInfo,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { color, motion, radius, shadow, space } from "../../../styles/theme";
import { useApp } from "../../../utils/AppContext";
import { haptic } from "../../../utils/haptics";
import { useHojasAbiertas } from "../../../utils/hojasAbiertas";
import { LogroId } from "../../../utils/model";
import { useNeka } from "../../../utils/NekaContext";
import { useAmigos } from "../../../utils/AmigosContext";
import {
  CATALOGO,
  Cola,
  hechosDe,
  listoParaLogro,
  siguiente,
  verLogros,
} from "../../../utils/progreso/logros";
import { Button, Txt, nekaImage } from "../base";
import Medalla from "./Medalla";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
type Icono = keyof typeof Ionicons.glyphMap;
const TAM = 120,
  GROSOR = 6,
  R = (TAM - GROSOR) / 2,
  C = 2 * Math.PI * R,
  CARA = TAM - 28;
// El anillo parte casi lleno y se completa: el último paso que faltaba.
const ANTES = 0.75;

// La medalla bloqueada se completa, gira y queda violeta (spec E §6.3).
function MedallaQueGira({ id, reducido }: { id: LogroId; reducido: boolean }) {
  const icono = CATALOGO.find((l) => l.id === id)!.icono as Icono;
  const anillo = useSharedValue(reducido ? 1 : ANTES),
    giro = useSharedValue(reducido ? 180 : 0),
    brillo = useSharedValue(0);
  useEffect(() => {
    if (reducido) return;
    anillo.value = withDelay(350, withTiming(1, { duration: 450 }));
    giro.value = withDelay(800, withSpring(180, motion.snappy));
    brillo.value = withDelay(1200, withTiming(1, { duration: 900 }));
  }, []);
  const props = useAnimatedProps(() => ({
    strokeDashoffset: C * (1 - anillo.value),
  }));
  const frente = useAnimatedStyle(() => ({
    transform: [{ perspective: 600 }, { rotateY: `${giro.value}deg` }],
  }));
  const dorso = useAnimatedStyle(() => ({
    transform: [{ perspective: 600 }, { rotateY: `${giro.value + 180}deg` }],
  }));
  const luz = useAnimatedStyle(() => ({
    opacity: brillo.value === 0 ? 0 : 1 - brillo.value,
    transform: [{ scale: 1 + brillo.value * 0.5 }],
  }));
  const cara = {
    position: "absolute" as const,
    top: (TAM - CARA) / 2,
    left: (TAM - CARA) / 2,
    width: CARA,
    height: CARA,
    borderRadius: radius.pill,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backfaceVisibility: "hidden" as const,
  };
  return (
    <View aria-hidden style={{ width: TAM, height: TAM }}>
      <Svg width={TAM} height={TAM} style={{ position: "absolute" }}>
        <Circle
          cx={TAM / 2}
          cy={TAM / 2}
          r={R}
          stroke={color.line}
          strokeWidth={GROSOR}
          fill="none"
        />
        <AnimatedCircle
          cx={TAM / 2}
          cy={TAM / 2}
          r={R}
          stroke={color.primary}
          strokeWidth={GROSOR}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${C} ${C}`}
          transform={`rotate(-90 ${TAM / 2} ${TAM / 2})`}
          animatedProps={props}
        />
      </Svg>
      <Animated.View
        style={[
          cara,
          {
            borderWidth: 2,
            borderColor: color.primary,
            backfaceVisibility: "visible",
          },
          luz,
        ]}
      />
      <Animated.View
        style={[cara, { backgroundColor: color.medallaApagada }, frente]}
      >
        <Ionicons name={icono} size={40} color={color.lineStrong} />
      </Animated.View>
      <Animated.View
        style={[
          cara,
          {
            backgroundColor: color.primary,
            borderWidth: 6,
            borderColor: color.primarySoft,
            boxShadow: shadow.raised,
          },
          dorso,
        ]}
      >
        <Ionicons name={icono} size={44} color={color.onPrimary} />
      </Animated.View>
    </View>
  );
}

// Modal de logro (spec E §6.3): tarjeta al centro, de a uno o en resumen. Espera
// a que no haya hojas abiertas, grabación ni sincronización en curso.
export default function LogroNuevo({
  onVerLogros,
}: {
  onVerLogros: () => void;
}) {
  const { data, change, user, cloudStatus } = useApp();
  const neka = useNeka();
  const hojas = useHojasAbiertas();
  const reducido = useReducedMotion();
  const { cuantos } = useAmigos();
  const cola = useMemo(
    () => siguiente(data, hechosDe(data, Date.now(), cuantos)),
    [data, cuantos],
  );
  const [mostrando, setMostrando] = useState<Cola>(null);
  const libre = listoParaLogro({
    hojas,
    grabando: neka.grabando,
    planAbierto: neka.hoja,
    conCuenta: !!user,
    estadoNube: cloudStatus,
  });
  // Medio segundo de margen: en el iPhone un Modal no se presenta mientras otro
  // (la hoja que se acaba de cerrar) todavía se está yendo.
  useEffect(() => {
    if (mostrando || !libre || !cola) return;
    const t = setTimeout(() => setMostrando(cola), 500);
    return () => clearTimeout(t);
  }, [cola, libre, mostrando]);

  const entrada = useSharedValue(0),
    salto = useSharedValue(0),
    textos = useSharedValue(0);
  useEffect(() => {
    if (!mostrando) return;
    const logro =
      mostrando.tipo === "uno"
        ? CATALOGO.find((l) => l.id === mostrando.id)!
        : null;
    AccessibilityInfo.announceForAccessibility(
      logro ? `Logro nuevo: ${logro.nombre}` : titulo(mostrando),
    );
    if (reducido) {
      entrada.value = salto.value = textos.value = 1;
      haptic.success();
      return;
    }
    entrada.value = 0;
    salto.value = 0;
    textos.value = 0;
    entrada.value = withSpring(1, motion.gentle);
    salto.value = withDelay(1150, withSpring(1, motion.snappy));
    textos.value = withDelay(1250, withTiming(1, { duration: 300 }));
    const vibra = setTimeout(
      () => haptic.success(),
      mostrando.tipo === "uno" ? 800 : 300,
    );
    return () => clearTimeout(vibra);
  }, [mostrando]);
  const tarjeta = useAnimatedStyle(() => ({
    opacity: entrada.value,
    transform: [{ scale: 0.92 + 0.08 * entrada.value }],
  }));
  const nekaSalta = useAnimatedStyle(() => ({
    opacity: salto.value,
    transform: [{ translateY: 18 * (1 - salto.value) }],
  }));
  const aparecen = useAnimatedStyle(() => ({ opacity: textos.value }));

  if (!mostrando) return null;
  const ids: LogroId[] =
    mostrando.tipo === "uno" ? [mostrando.id] : mostrando.ids;
  const cerrar = (ver = false) => {
    change((d) => verLogros(d, ids, Date.now()));
    setMostrando(null);
    if (ver) onVerLogros();
  };
  const logro =
    mostrando.tipo === "uno"
      ? CATALOGO.find((l) => l.id === mostrando.id)!
      : null;
  return (
    <Modal
      transparent
      visible
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => cerrar()}
    >
      <Animated.View
        entering={FadeIn.duration(motion.fadeMs)}
        style={{ flex: 1, justifyContent: "center", padding: space.xl }}
      >
        <Pressable
          accessibilityLabel="Cerrar"
          onPress={() => cerrar()}
          style={[StyleSheet.absoluteFill, { backgroundColor: color.backdrop }]}
        />
        <Animated.View
          accessibilityViewIsModal
          style={[
            {
              backgroundColor: color.surface,
              borderRadius: radius.lg,
              paddingTop: space.xxl,
              paddingHorizontal: space.xl,
              paddingBottom: space.md,
              alignItems: "center",
              gap: space.sm,
              boxShadow: shadow.raised,
            },
            tarjeta,
          ]}
        >
          <Animated.View
            aria-hidden
            style={[{ position: "absolute", top: -62, left: 6 }, nekaSalta]}
          >
            <Image
              source={nekaImage(5)}
              resizeMode="contain"
              style={{ width: 104, height: 104 }}
            />
          </Animated.View>
          {logro ? (
            <MedallaQueGira id={logro.id} reducido={reducido} />
          ) : (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: space.md,
                maxWidth: 3 * 56 + 2 * space.md,
              }}
            >
              {ids.slice(0, 9).map((id) => (
                <Medalla key={id} id={id} logrado />
              ))}
            </View>
          )}
          <Animated.View
            style={[{ alignItems: "center", gap: space.xs }, aparecen]}
          >
            {logro ? (
              <>
                <Txt variant="caption" weight={700} tone="primary">
                  Logro nuevo
                </Txt>
                <Txt variant="title" align="center">
                  {logro.nombre}
                </Txt>
                <Txt variant="callout" tone="secondary" align="center">
                  {logro.frase}
                </Txt>
              </>
            ) : (
              <>
                {ids.length > 9 && (
                  <Txt variant="caption" tone="secondary">
                    y {ids.length - 9} más
                  </Txt>
                )}
                <Txt variant="title" align="center">
                  {titulo(mostrando)}
                </Txt>
                {mostrando.tipo === "resumen" && mostrando.lanzamiento && (
                  <Txt variant="callout" tone="secondary" align="center">
                    Ahora cada nivel cuesta un poco más. Tus puntos siguen
                    intactos.
                  </Txt>
                )}
              </>
            )}
          </Animated.View>
          <Animated.View
            style={[{ alignSelf: "stretch", marginTop: space.sm }, aparecen]}
          >
            <Button title="Genial" onPress={() => cerrar()} />
            <Button
              title="Ver mis logros"
              variant="plain"
              onPress={() => cerrar(true)}
            />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const titulo = (c: NonNullable<Cola>) =>
  c.tipo === "uno"
    ? "Logro nuevo"
    : c.lanzamiento
      ? `Ya tenías ${c.ids.length} logros`
      : `${c.ids.length} logros nuevos`;
