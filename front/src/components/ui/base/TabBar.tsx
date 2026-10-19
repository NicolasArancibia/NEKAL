import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  withSpring,
} from "react-native-reanimated";
import { color, motion, size } from "../../../styles/theme";
import { haptic } from "../../../utils/haptics";
import PressableScale from "./PressableScale";
import { useNeka } from "../../../utils/NekaContext";

const tabs: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; label: string }
> = {
  Resumen: { icon: "grid-outline", label: "Resumen" },
  Calendario: { icon: "calendar-outline", label: "Calendario" },
  EspacioTrabajo: { icon: "git-network-outline", label: "Espacio" },
  Chat: { icon: "chatbubble-outline", label: "Chat con Neka" },
  Perfil: { icon: "person-outline", label: "Perfil" },
};

function TabIcon({
  name,
  active,
}: {
  name: keyof typeof Ionicons.glyphMap;
  active: boolean;
}) {
  const reduced = useReducedMotion();
  const target = active ? 1 : size.tabIcon / size.tabIconActive;
  const scaled = useAnimatedStyle(
    () => ({
      transform: [
        { scale: reduced ? target : withSpring(target, motion.snappy) },
      ],
    }),
    [target, reduced],
  );
  return (
    <Animated.View style={scaled}>
      <Ionicons
        name={name}
        size={size.tabIconActive}
        color={active ? color.primary : color.inkSecondary}
      />
    </Animated.View>
  );
}

// Barra inferior a todo el ancho, solo íconos (spec A, sección 5).
export default function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const neka = useNeka();
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: "row",
        backgroundColor: color.surface,
        borderTopWidth: 1,
        borderTopColor: color.line,
        height: size.tabBar + insets.bottom,
        paddingBottom: insets.bottom,
      }}
    >
      {state.routes.map((route, index) => {
        const active = state.index === index;
        const tab = tabs[route.name] ?? {
          icon: "ellipse-outline",
          label: route.name,
        };
        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!active && !event.defaultPrevented) {
            haptic.selection();
            navigation.navigate(route.name);
          }
        };
        // Mantener apretada la pestaña Neka graba desde cualquier pantalla (spec D §5.3).
        const esNeka = route.name === "Chat";
        return (
          <PressableScale
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityHint={
              esNeka ? "Mantén apretado para hablarle a Neka" : undefined
            }
            onLongPress={
              esNeka ? () => void neka.empezarGrabar("rapido") : undefined
            }
            onPressOut={esNeka ? () => void neka.soltar() : undefined}
            accessibilityState={{ selected: active }}
            onPress={onPress}
            style={{
              flex: 1,
              minHeight: size.minTouch,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TabIcon name={tab.icon} active={active} />
          </PressableScale>
        );
      })}
    </View>
  );
}
