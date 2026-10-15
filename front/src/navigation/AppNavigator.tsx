import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TabNavigator from "./TabNavigator";
import Bienvenida from "../pages/Bienvenida";
import { useApp } from "../utils/AppContext";
import { Loading } from "../components/ui/Common";
import { Text, View, Modal, ActivityIndicator } from "react-native";
import { s } from "../styles/globalStyles";
import type { NavigatorScreenParams } from "@react-navigation/native";
import type { TabParamList } from "./TabNavigator";

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { ready, error, user, guest, cloudBusy } = useApp();
  if (!ready)
    return error ? (
      <View style={[s.content, { marginTop: 60 }]}>
        <Text style={s.error}>{error}</Text>
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
            backgroundColor: "rgba(30,20,50,.4)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View style={s.card}>
            <ActivityIndicator />
            <Text style={s.text}>Sincronizando con Firebase…</Text>
          </View>
        </View>
      </Modal>
    </>
  );
}
