import { ReactNode, useEffect } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  color,
  motion,
  radius,
  shadow,
  size,
  space,
} from "../../../styles/theme";
import Button from "./Button";
import Txt from "./Txt";

const EXIT_MS = 200;

// Panel que sube desde abajo. Se cierra arrastrando la manija, tocando el fondo
// o con "Cerrar". Si el padre pasa visible=false, se desmonta de inmediato.
export default function Sheet({
  visible,
  title,
  onClose,
  children,
  size: variant = "large",
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: "auto" | "large";
}) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const y = useSharedValue(height);
  const fade = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    fade.value = 0;
    fade.value = withTiming(1, { duration: motion.fadeMs });
    y.value = reduced ? 0 : height;
    if (!reduced) y.value = withSpring(0, motion.gentle);
  }, [visible]);

  const close = () => {
    fade.value = withTiming(0, { duration: EXIT_MS }, (done) => {
      if (done) scheduleOnRN(onClose);
    });
    if (!reduced) y.value = withTiming(height, { duration: EXIT_MS });
  };

  const drag = Gesture.Pan()
    .onUpdate((e) => {
      y.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (
        e.translationY > size.sheetDragClose ||
        e.velocityY > size.sheetVelocityClose
      ) {
        fade.value = withTiming(0, { duration: EXIT_MS }, (done) => {
          if (done) scheduleOnRN(onClose);
        });
        y.value = withTiming(height, { duration: EXIT_MS });
      } else y.value = withSpring(0, motion.gentle);
    });

  const backdrop = useAnimatedStyle(() => ({ opacity: fade.value }));
  const panel = useAnimatedStyle(() => ({
    opacity: reduced ? fade.value : 1,
    transform: [{ translateY: y.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={close}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: color.backdrop },
            backdrop,
          ]}
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Cerrar panel"
          />
        </Animated.View>
        <KeyboardAvoidingView
          pointerEvents="box-none"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1, justifyContent: "flex-end" }}
        >
          <Animated.View
            accessibilityViewIsModal
            style={[
              {
                width: "100%",
                maxWidth: 680,
                alignSelf: "center",
                height: variant === "large" ? "92%" : undefined,
                maxHeight: "92%",
                backgroundColor: color.surface,
                borderTopLeftRadius: radius.lg,
                borderTopRightRadius: radius.lg,
                boxShadow: shadow.raised,
                paddingBottom: insets.bottom,
              },
              panel,
            ]}
          >
            <GestureDetector gesture={drag}>
              <View
                style={{
                  paddingTop: space.sm,
                  paddingHorizontal: space.xl,
                  paddingBottom: space.md,
                  gap: space.sm,
                }}
              >
                <View
                  style={{
                    alignSelf: "center",
                    width: 36,
                    height: 5,
                    borderRadius: radius.pill,
                    backgroundColor: color.inkSecondary,
                    opacity: 0.35,
                  }}
                />
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: space.md,
                  }}
                >
                  <Txt
                    variant="title"
                    accessibilityRole="header"
                    numberOfLines={2}
                    style={{ flex: 1 }}
                  >
                    {title}
                  </Txt>
                  <Button
                    title="Cerrar"
                    variant="plain"
                    small
                    onPress={close}
                  />
                </View>
              </View>
            </GestureDetector>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                padding: space.xl,
                paddingTop: space.xs,
                gap: space.lg,
              }}
            >
              {children}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}
