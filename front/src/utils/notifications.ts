import { Platform } from "react-native";
import { AppData, activeItems, passive } from "./model";
export async function requestReminders(): Promise<void> {
  if (Platform.OS === "web")
    throw new Error(
      "Los recordatorios del sistema están disponibles en Expo Go para iOS. En web tienes avisos dentro de la app.",
    );
  const N = await import("expo-notifications");
  const permission = await N.requestPermissionsAsync();
  if (!permission.granted)
    throw new Error(
      "No se concedió el permiso. Puedes habilitarlo desde Ajustes del teléfono.",
    );
}
export async function scheduleReminders(data: AppData) {
  if (Platform.OS === "web") return;
  const N = await import("expo-notifications");
  const existing = await N.getAllScheduledNotificationsAsync();
  await Promise.all(
    existing
      .filter((n) => n.content.data?.source === "nekal")
      .map((n) => N.cancelScheduledNotificationAsync(n.identifier)),
  );
  if (!data.preferences.notifications || !data.preferences.softAlerts) return;
  const permission = await N.getPermissionsAsync();
  if (!permission.granted) return;
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  const { quiet, quietStart, quietEnd } = data.preferences;
  const upcoming = activeItems(data)
    .filter(
      (i) =>
        !passive(i) && i.status !== "completado" && (i.scheduledAt || i.dueAt),
    )
    .map((i) => ({
      i,
      at: new Date(Date.parse(i.scheduledAt || i.dueAt) - 10 * 60000),
    }))
    .filter(({ at }) => {
      const h = at.getHours();
      const silent =
        quiet &&
        (quietStart <= quietEnd
          ? h >= quietStart && h < quietEnd
          : h >= quietStart || h < quietEnd);
      return at.getTime() > Date.now() && !silent;
    })
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, 32);
  for (const { i, at } of upcoming)
    await N.scheduleNotificationAsync({
      content: {
        title: "Un momento con Neka",
        body: `${i.title} · en 10 minutos`,
        data: { source: "nekal", itemId: i.id },
        sound: false,
      },
      trigger: { type: N.SchedulableTriggerInputTypes.DATE, date: at },
    });
}
