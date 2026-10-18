import { SafeAreaView } from "react-native-safe-area-context";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { TabBar } from "../components/ui/base";
import { color } from "../styles/theme";
import Resumen from "../pages/Resumen";
import Calendario from "../pages/Calendario";
import EspacioTrabajo from "../pages/EspacioTrabajo";
import Chat from "../pages/Chat";
import Perfil from "../pages/Perfil";
import { useDemo } from "../utils/useDemo";
import { useRutinas } from "../utils/useRutinas";

export type TabParamList = {
  Resumen: undefined;
  Calendario: undefined;
  EspacioTrabajo: undefined;
  Chat: undefined;
  Perfil: { settings?: boolean } | undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  useRutinas();
  useDemo();
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: color.background }}
      edges={["top"]}
    >
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: color.background },
        }}
        tabBar={(props) => <TabBar {...props} />}
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
    </SafeAreaView>
  );
}
