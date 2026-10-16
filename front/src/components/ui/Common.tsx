// Adaptador temporal hacia components/ui/base (plan A, Task 3). Se elimina al
// terminar la migración de pantallas (Task 12).
import React from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, s } from "../../styles/globalStyles";
import { color, space } from "../../styles/theme";
import * as base from "./base";
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
    <base.Button
      title={title}
      onPress={onPress}
      variant={danger ? "danger" : secondary ? "secondary" : "primary"}
      disabled={disabled}
      small={small}
    />
  );
}
export const Chip = base.Chip;
export const Field = base.Field;
export const Toggle = base.Toggle;
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
      animationType={Platform.OS === "web" ? "none" : "slide"}
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
    <base.Card>
      <base.Txt variant="headline">{title}</base.Txt>
      <base.Txt tone="secondary">{detail}</base.Txt>
    </base.Card>
  );
}
export function Loading() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: color.background,
        justifyContent: "center",
        alignItems: "center",
        gap: space.lg,
      }}
    >
      <ActivityIndicator color={color.primary} />
      <base.Txt tone="secondary">Cargando…</base.Txt>
    </View>
  );
}
