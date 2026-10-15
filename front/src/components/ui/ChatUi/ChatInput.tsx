import React, { useState } from "react";
import { View, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, s } from "../../../styles/globalStyles";
export default function ChatInput({
  onSend,
}: {
  onSend: (text: string) => void;
}) {
  const [value, setValue] = useState("");
  const submit = () => {
    if (value.trim()) {
      onSend(value.trim());
      setValue("");
    }
  };
  return (
    <View
      style={[
        s.row,
        {
          backgroundColor: colors.white,
          padding: 10,
          marginHorizontal: 16,
          marginBottom: 12,
          borderRadius: 28,
          borderWidth: 1,
          borderColor: colors.line,
        },
      ]}
    >
      <TextInput
        accessibilityLabel="Mensaje para Neka"
        value={value}
        onChangeText={setValue}
        placeholder="Organiza con Neka"
        placeholderTextColor={colors.muted}
        style={{ flex: 1, padding: 10, fontSize: 14, color: colors.ink }}
        returnKeyType="send"
        onSubmitEditing={submit}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Enviar mensaje"
        onPress={submit}
        disabled={!value.trim()}
        style={{
          padding: 12,
          borderRadius: 22,
          backgroundColor: colors.primary,
          opacity: value.trim() ? 1 : 0.4,
        }}
      >
        <Ionicons name="send" size={18} color="white" />
      </Pressable>
    </View>
  );
}
