import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TabNavigator from "./TabNavigator";
import Bienvenida from "../pages/Bienvenida";
import { useApp } from "../utils/AppContext";
import { View, Modal, ActivityIndicator } from "react-native";
import { Card, Txt } from "../components/ui/base";
import { color, space } from "../styles/theme";
import type { NavigatorScreenParams } from "@react-navigation/native";
import type { TabParamList } from "./TabNavigator";

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function Loading() {
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
      <Txt tone="secondary">Cargando…</Txt>
    </View>
  );
}

export default function AppNavigator() {
  const { ready, error, user, guest, cloudBusy } = useApp();
  if (!ready)
    return error ? (
      <View
        style={{
          flex: 1,
          backgroundColor: color.background,
          padding: space.screen,
          paddingTop: 60,
        }}
      >
        <Txt tone="danger" accessibilityRole="alert">
          {error}
        </Txt>
      </View>
    ) : (
      <Loading />
    );
  if (!user && !guest) return <Bienvenida />;
  return (
    <>
      <Stack.Navigator
        key={user?.uid ?? "guest"}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Tabs" component={TabNavigator} />
      </Stack.Navigator>
      <Modal visible={cloudBusy} transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: color.backdrop,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Card style={{ alignItems: "center" }}>
            <ActivityIndicator color={color.primary} />
            <Txt>Sincronizando tu cuenta…</Txt>
          </Card>
        </View>
      </Modal>
    </>
  );
}
