import type { ReactNode } from "react";
import { View } from "react-native";
import { space } from "../../../styles/theme";
import SyncBanner from "./SyncBanner";
import Txt from "./Txt";

const today = () => {
  const text = new Date().toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return text.charAt(0).toUpperCase() + text.slice(1).replace(",", "");
};

// Encabezado de cada pestaña: fecha opcional, título grande y accesorio.
export default function ScreenHeader({
  title,
  showDate = false,
  right,
}: {
  title: string;
  showDate?: boolean;
  right?: ReactNode;
}) {
  return (
    <View style={{ gap: space.md, marginTop: space.sm }}>
      <View
        style={{ flexDirection: "row", alignItems: "center", gap: space.md }}
      >
        <View style={{ flex: 1, gap: 2 }}>
          {showDate && (
            <Txt variant="caption" tone="secondary">
              {today()}
            </Txt>
          )}
          <Txt
            variant="largeTitle"
            accessibilityRole="header"
            numberOfLines={1}
          >
            {title}
          </Txt>
        </View>
        {right}
      </View>
      <SyncBanner />
    </View>
  );
}
