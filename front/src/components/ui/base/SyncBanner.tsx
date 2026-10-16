import { View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../navigation/AppNavigator";
import { useApp } from "../../../utils/AppContext";
import { syncBannerFor } from "../../../utils/syncBanner";
import { color, radius, space } from "../../../styles/theme";
import Button from "./Button";
import Txt from "./Txt";

// Aviso bajo el encabezado; solo existe cuando hay un problema de guardado.
export default function SyncBanner() {
  const { error, conflict, cloudStatus, pendingChanges, retry, clearError } =
    useApp();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const banner = syncBannerFor({
    error,
    hasConflict: !!conflict,
    cloudStatus,
    pendingChanges,
  });
  if (!banner) return null;
  const danger = banner.tone === "danger";
  const act = () => {
    const target = banner.action?.target;
    if (target === "retry") {
      clearError();
      retry();
    } else if (target === "perfil")
      navigation.navigate("Tabs", { screen: "Perfil" });
    else if (target === "ajustes")
      navigation.navigate("Tabs", {
        screen: "Perfil",
        params: { settings: true },
      });
  };
  return (
    <View
      accessibilityRole="alert"
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.sm,
        paddingVertical: space.xs,
        paddingLeft: space.md,
        paddingRight: banner.action ? space.xs : space.md,
        minHeight: 40,
        borderRadius: radius.sm,
        backgroundColor: danger ? color.dangerSoft : color.primarySoft,
      }}
    >
      <Txt
        variant="callout"
        weight={600}
        tone={danger ? "danger" : "ink"}
        style={{ flex: 1 }}
      >
        {banner.text}
      </Txt>
      {banner.action && (
        <Button
          title={banner.action.label}
          variant="plain"
          small
          onPress={act}
        />
      )}
    </View>
  );
}
