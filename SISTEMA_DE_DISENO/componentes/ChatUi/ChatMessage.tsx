// front/src/components/ui/ChatUi/ChatMessage.tsx
import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { color, radius, size, space } from "../../../styles/theme";
import { PressableScale, Txt } from "../base";

// audio: el texto es lo que entendió Neka de tu grabación. onLeer: botón de
// parlante para volver a escuchar una respuesta de Neka.
export default function ChatMessage({
  message,
  isUser,
  audio = false,
  onLeer,
}: {
  message?: string;
  isUser: boolean;
  audio?: boolean;
  onLeer?: () => void;
}) {
  return (
    <View
      accessibilityLabel={`${isUser ? "Tú" : "Neka"}: ${message ?? ""}`}
      style={{
        maxWidth: "80%",
        alignSelf: isUser ? "flex-end" : "flex-start",
        marginHorizontal: space.screen,
        marginVertical: space.xs,
        paddingHorizontal: space.lg,
        paddingVertical: space.md,
        borderRadius: radius.md,
        borderBottomRightRadius: isUser ? 4 : radius.md,
        borderBottomLeftRadius: isUser ? radius.md : 4,
        backgroundColor: isUser ? color.primary : color.surface,
        borderWidth: isUser ? 0 : 1,
        borderColor: color.line,
      }}
    >
      <View
        style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}
      >
        {audio && (
          <Ionicons
            name="mic-outline"
            size={size.icon - 4}
            color={isUser ? color.onPrimary : color.inkSecondary}
          />
        )}
        <Txt
          tone={isUser ? "onPrimary" : "ink"}
          style={
            audio ? { flexShrink: 1, fontStyle: "italic" } : { flexShrink: 1 }
          }
        >
          {audio ? `«${message}»` : message}
        </Txt>
        {onLeer && (
          <PressableScale
            accessibilityLabel="Leer en voz alta"
            onPress={onLeer}
            hitSlop={space.sm}
          >
            <Ionicons
              name="volume-medium-outline"
              size={size.icon - 4}
              color={color.primary}
            />
          </PressableScale>
        )}
      </View>
    </View>
  );
}
