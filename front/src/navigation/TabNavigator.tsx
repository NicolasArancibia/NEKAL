import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Topbar from "../components/layout/Topbar";
import Navbar from "../components/layout/Navbar";
import Resumen from "../pages/Resumen";
import Calendario from "../pages/Calendario";
import EspacioTrabajo from "../pages/EspacioTrabajo";
import Chat from "../pages/Chat";
import Perfil from "../pages/Perfil";

export type TabParamList = {
  Resumen: undefined;
  Calendario: undefined;
  EspacioTrabajo: undefined;
  Chat: undefined;
  Perfil: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <Topbar />
      <View style={styles.tabsWrap}>
        <Tab.Navigator
          screenOptions={{ headerShown: false }}
          tabBar={(props) => <Navbar {...props} />}
        >
          <Tab.Screen name="Resumen" component={Resumen} />
          <Tab.Screen name="Calendario" component={Calendario} />
          <Tab.Screen
            name="EspacioTrabajo"
            component={EspacioTrabajo}
            options={{ title: "Espacio" }}
          />
          <Tab.Screen name="Chat" component={Chat} />
          <Tab.Screen name="Perfil" component={Perfil} />
        </Tab.Navigator>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F2F0FA" },
  tabsWrap: { flex: 1 },
});
