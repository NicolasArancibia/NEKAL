import React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, s } from "../../styles/globalStyles";
export function Button({
  title,
  onPress,
  secondary = false,
  danger = false,
  disabled = false,
  small = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  small?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: small ? 12 : 18,
        paddingVertical: small ? 9 : 13,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: secondary
          ? colors.lavender
          : danger
            ? colors.red
            : colors.primary,
        opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
        minHeight: small ? 36 : 46,
      })}
    >
      <Text
        style={{
          color: secondary ? colors.primary : "#FFF",
          fontSize: small ? 12 : 14,
          fontWeight: "700",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Chip({
  title,
  selected,
  onPress,
}: {
  title: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        s.pill,
        { backgroundColor: selected ? colors.primary : colors.lavender },
      ]}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: selected ? "#FFF" : colors.primary,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  secure = false,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  secure?: boolean;
  keyboardType?: "default" | "email-address" | "numeric";
}) {
  return (
    <View>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9A90A8"
        multiline={multiline}
        secureTextEntry={secure}
        autoCapitalize={
          secure || keyboardType === "email-address" ? "none" : "sentences"
        }
        keyboardType={keyboardType}
        style={[
          s.input,
          multiline && { minHeight: 96, textAlignVertical: "top" },
        ]}
      />
    </View>
  );
}
export function Toggle({
  label,
  value,
  onChange,
  detail,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  detail?: string;
}) {
  return (
    <View style={s.between}>
      <View style={{ flex: 1 }}>
        <Text style={s.text}>{label}</Text>
        {detail && <Text style={s.small}>{detail}</Text>}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.primary, false: "#DDD4EE" }}
      />
    </View>
  );
}
export function Sheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType={Platform.OS==='web'?'none':'slide'}
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(32,20,54,.35)",
          justifyContent: "center",
        }}
      >
        <SafeAreaView
          style={{
            flex: 1,
            maxWidth: 680,
            width: "100%",
            alignSelf: "center",
            backgroundColor: colors.background,
          }}
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View
              style={[
                s.between,
                { padding: 18, borderBottomWidth: 1, borderColor: colors.line },
              ]}
            >
              <Text accessibilityRole="header" style={[s.heading, { flex: 1 }]}>
                {title}
              </Text>
              <Button title="Cerrar" small secondary onPress={onClose} />
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                padding: 20,
                gap: 16,
                paddingBottom: 40,
              }}
            >
              {children}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
export function Empty({ title, detail }: { title: string; detail: string }) {
  return (
    <View style={[s.card, { paddingVertical: 30 }]}>
      <Text style={s.heading}>{title}</Text>
      <Text style={s.subtitle}>{detail}</Text>
    </View>
  );
}
export function Loading() {
  return (
    <View
      style={[
        s.page,
        { justifyContent: "center", alignItems: "center", gap: 16 },
      ]}
    >
      <ActivityIndicator color={colors.primary} />
      <Text style={s.subtitle}>Preparando tu espacio…</Text>
    </View>
  );
}
