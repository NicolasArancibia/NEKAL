import { useState } from "react";
import { TextInput, View } from "react-native";
import { color, font, radius, space, type } from "../../../styles/theme";
import Txt from "./Txt";

export default function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  secure = false,
  keyboardType = "default",
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  secure?: boolean;
  keyboardType?: "default" | "email-address" | "numeric";
  error?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: space.xs + 2 }}>
      <Txt variant="callout" weight={600}>
        {label}
      </Txt>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={color.inkSecondary}
        multiline={multiline}
        secureTextEntry={secure}
        autoCapitalize={
          secure || keyboardType === "email-address" ? "none" : "sentences"
        }
        keyboardType={keyboardType}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          borderWidth: 1,
          borderColor: error
            ? color.danger
            : focused
              ? color.primary
              : color.line,
          borderRadius: radius.sm,
          paddingHorizontal: space.md,
          paddingVertical: space.md,
          minHeight: multiline ? 96 : 46,
          textAlignVertical: multiline ? "top" : "center",
          backgroundColor: color.background,
          color: color.ink,
          fontFamily: font[500],
          fontSize: type.body.size,
        }}
      />
      {!!error && (
        <Txt variant="caption" tone="danger">
          {error}
        </Txt>
      )}
    </View>
  );
}
