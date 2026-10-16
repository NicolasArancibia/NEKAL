// front/src/components/ui/ChatUi/ChatMessage.tsx
import React from "react";
import { View } from "react-native";
import { color, radius, space } from "../../../styles/theme";
import { Txt } from "../base";

export default function ChatMessage({
  message,
  isUser,
}: {
  message?: string;
  isUser: boolean;
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
      <Txt tone={isUser ? "onPrimary" : "ink"}>{message}</Txt>
    </View>
  );
}
