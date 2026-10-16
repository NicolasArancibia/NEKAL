import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

// Vibraciones de la interfaz. En web no hacen nada; un fallo nunca interrumpe la acción.
const run = (fn: () => Promise<void>) => {
  if (Platform.OS === "web") return;
  fn().catch(() => {});
};

export const haptic = {
  selection: () => run(() => Haptics.selectionAsync()),
  success: () =>
    run(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    ),
  light: () =>
    run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
};
