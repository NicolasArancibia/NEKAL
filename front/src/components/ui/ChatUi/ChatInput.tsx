import React, { useState } from "react";
import { View, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { color, font, radius, size, space, type } from "../../../styles/theme";
import { PressableScale } from "../base";

export default function ChatInput({
  onSend,
}: {
  onSend: (text: string) => void;
}) {
  const [value, setValue] = useState("");
  const ready = !!value.trim();
  const submit = () => {
    if (ready) {
      onSend(value.trim());
      setValue("");
    }
  };
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.sm,
        backgroundColor: color.surface,
        paddingLeft: space.lg,
        paddingRight: space.xs,
        paddingVertical: space.xs,
        marginHorizontal: space.screen,
        marginBottom: space.md,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: color.lineStrong,
      }}
    >
      <TextInput
        accessibilityLabel="Mensaje para Neka"
        value={value}
        onChangeText={setValue}
        placeholder="Escríbele a Neka"
        placeholderTextColor={color.inkSecondary}
        style={{
          flex: 1,
          minHeight: size.minTouch,
          fontFamily: font[500],
          fontSize: type.body.size,
          color: color.ink,
        }}
        returnKeyType="send"
        onSubmitEditing={submit}
      />
      <PressableScale
        accessibilityLabel="Enviar"
        onPress={submit}
        disabled={!ready}
        style={{
          width: size.minTouch,
          height: size.minTouch,
          borderRadius: radius.pill,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: color.primary,
          opacity: ready ? 1 : 0.4,
        }}
      >
        <Ionicons
          name="arrow-up-outline"
          size={size.icon}
          color={color.onPrimary}
        />
      </PressableScale>
    </View>
  );
}
