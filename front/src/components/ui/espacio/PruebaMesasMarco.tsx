import React, { ReactNode } from "react";
import { Modal, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { color, space } from "../../../styles/theme";
import { Button, Txt } from "../base";

// Marco de la prueba 3D (plan B, Task 1): pantalla completa con cerrar.
export default function PruebaMesasMarco({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView
        style={{ flex: 1, backgroundColor: color.background }}
      >
        <View
          style={{
            paddingTop: insets.top + space.md,
            paddingHorizontal: space.screen,
            gap: space.xs,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Txt variant="title">Prueba 3D</Txt>
            <Button
              title="Cerrar"
              variant="secondary"
              small
              onPress={onClose}
            />
          </View>
          <Txt variant="caption" tone="secondary">
            Un dedo mueve; dos dedos giran o acercan. Toca Trabajo o acércate para entrar.
          </Txt>
        </View>
        <View style={{ flex: 1 }}>{children}</View>
      </GestureHandlerRootView>
    </Modal>
  );
}
