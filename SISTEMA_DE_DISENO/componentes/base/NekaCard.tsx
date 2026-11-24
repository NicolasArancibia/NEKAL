import { Image, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { color, radius, size, space } from "../../../styles/theme";
import type { NekaAction, NekaState } from "../../../utils/neka";
import Button from "./Button";
import Card from "./Card";
import PressableScale from "./PressableScale";
import Txt from "./Txt";
import { nekaImage } from "./nekaImages";

// Tarjeta principal del Resumen: Neka reacciona a la situación del día.
// onMicIn/onMicOut: micrófono para hablarle a Neka (mantener y soltar, spec D §5.3).
// Con una pregunta (lo importante que se pasó, spec H2) trae hasta 3 respuestas,
// Neka arriba a la derecha y un pie con «Ver la lista».
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
  const acciones = state.acciones ?? (state.action ? [state.action] : []);
  const pregunta = state.kind === "pregunta";
  return (
    <Card
      variant="featured"
      style={{
        paddingRight: pregunta ? space.lg : 116,
        minHeight: pregunta ? 0 : 122,
      }}
    >
      <Txt
        weight={600}
        numberOfLines={pregunta ? 5 : 4}
        style={pregunta ? { paddingRight: 84 } : undefined}
      >
        {state.message}
      </Txt>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          gap: space.sm,
        }}
      >
        {acciones.map((a, n) => (
          <Button
            key={a.label}
            title={a.label}
            small
            variant={pregunta && n > 0 ? "secondary" : "primary"}
            onPress={() => onAction(a)}
          />
        ))}
        {onMicIn && !pregunta && (
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
      {pregunta && (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "center",
            gap: space.xs,
          }}
        >
          {!!state.pie && (
            <Txt variant="caption" tone="secondary">
              {state.pie}
            </Txt>
          )}
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Ver la lista de atrasadas"
            hitSlop={8}
            onPress={() =>
              onAction({ label: "Ver la lista", target: "atrasadas" })
            }
          >
            <Txt variant="caption" weight={700} tone="primary">
              Ver la lista
            </Txt>
          </PressableScale>
        </View>
      )}
      <Image
        source={nekaImage(state.pose)}
        resizeMode="contain"
        aria-hidden
        style={
          pregunta
            ? {
                position: "absolute",
                right: 6,
                top: -6,
                width: 84,
                height: 96,
              }
            : {
                position: "absolute",
                right: 6,
                bottom: -4,
                width: 104,
                height: 116,
              }
        }
      />
    </Card>
  );
}
