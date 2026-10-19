import { Image, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { color, radius, size, space } from "../../../styles/theme";
import type { NekaAction, NekaState } from "../../../utils/neka";
import Button from "./Button";
import Card from "./Card";
import Txt from "./Txt";
import { nekaImage } from "./nekaImages";

// Tarjeta principal del Resumen: Neka reacciona a la situación del día.
// onMicIn/onMicOut: micrófono para hablarle a Neka (mantener y soltar, spec D §5.3).
export default function NekaCard({
  state,
  onAction,
  onMicIn,
  onMicOut,
  grabando = false,
}: {
  state: NekaState;
  onAction: (a: NekaAction) => void;
  onMicIn?: () => void;
  onMicOut?: () => void;
  grabando?: boolean;
}) {
  const action = state.action;
  return (
    <Card variant="featured" style={{ paddingRight: 116, minHeight: 122 }}>
      <Txt weight={600} numberOfLines={4}>
        {state.message}
      </Txt>
      <View
        style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}
      >
        {action && (
          <Button title={action.label} small onPress={() => onAction(action)} />
        )}
        {onMicIn && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              grabando ? "Suelta para enviar" : "Mantén para hablarle a Neka"
            }
            onPressIn={onMicIn}
            onPressOut={onMicOut}
            style={{
              width: size.minTouch,
              height: size.minTouch,
              borderRadius: radius.pill,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: grabando ? color.danger : color.primary,
            }}
          >
            <Ionicons
              name="mic-outline"
              size={size.icon}
              color={color.onPrimary}
            />
          </Pressable>
        )}
      </View>
      <Image
        source={nekaImage(state.pose)}
        resizeMode="contain"
        aria-hidden
        style={{
          position: "absolute",
          right: 6,
          bottom: -4,
          width: 104,
          height: 116,
        }}
      />
    </Card>
  );
}
