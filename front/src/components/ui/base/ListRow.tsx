import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { color, motion, radius, size, space } from "../../../styles/theme";
import PressableScale from "./PressableScale";
import Tag, { TagTone } from "./Tag";
import Txt from "./Txt";

const CHECK = 22;

// Círculo para completar: el borde lleva el color del espacio.
function Check({
  done,
  dotColor,
  title,
  onToggle,
}: {
  done: boolean;
  dotColor: string;
  title: string;
  onToggle: () => void;
}) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  useEffect(() => {
    if (done && !reduced) {
      scale.value = 0.6;
      scale.value = withSpring(1, motion.snappy);
    }
  }, [done]);
  const pop = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <PressableScale
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={`${done ? "Marcar pendiente" : "Completar"} ${title}`}
      onPress={onToggle}
      style={{
        width: size.minTouch,
        height: size.minTouch,
        marginHorizontal: -(size.minTouch - CHECK) / 2,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View
        style={[
          {
            width: CHECK,
            height: CHECK,
            borderRadius: radius.pill,
            borderWidth: 2,
            borderColor: done ? color.primary : dotColor,
            backgroundColor: done ? color.primary : "transparent",
            alignItems: "center",
            justifyContent: "center",
          },
          pop,
        ]}
      >
        {done && (
          <Ionicons name="checkmark" size={14} color={color.onPrimary} />
        )}
      </Animated.View>
    </PressableScale>
  );
}

export default function ListRow({
  title,
  time,
  dotColor,
  done,
  tag,
  onPress,
  onToggle,
}: {
  title: string;
  time?: string;
  dotColor: string;
  done: boolean;
  tag?: { text: string; tone: TagTone };
  onPress: () => void;
  onToggle?: () => void;
}) {
  // La zona que abre el ítem y el círculo son hermanos (no anidados) para que
  // VoiceOver y la web los expongan como dos controles distintos.
  const label = [time, title, done ? "completado" : "", tag?.text]
    .filter(Boolean)
    .join(", ");
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        minHeight: size.minTouch,
      }}
    >
      <PressableScale
        onPress={onPress}
        accessibilityLabel={label}
        style={StyleSheet.absoluteFill}
      >
        <View />
      </PressableScale>
      <View aria-hidden style={{ width: 42, pointerEvents: "none" }}>
        <Txt variant="callout" tone="secondary" tabular>
          {time ?? ""}
        </Txt>
      </View>
      {onToggle ? (
        <Check
          done={done}
          dotColor={dotColor}
          title={title}
          onToggle={onToggle}
        />
      ) : (
        <View
          aria-hidden
          style={{
            width: 8,
            height: 8,
            borderRadius: radius.pill,
            backgroundColor: dotColor,
            pointerEvents: "none",
          }}
        />
      )}
      <View
        aria-hidden
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          gap: space.md,
          pointerEvents: "none",
        }}
      >
        <Txt
          numberOfLines={1}
          strike={done}
          tone={done ? "done" : "ink"}
          style={{ flex: 1 }}
        >
          {title}
        </Txt>
        {tag && <Tag text={tag.text} tone={tag.tone} />}
      </View>
    </View>
  );
}
