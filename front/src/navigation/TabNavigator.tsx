import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Button, TabBar, Txt } from "../components/ui/base";
import { color, radius, space } from "../styles/theme";
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
  const rutinas = useRutinas();
  useDemo();
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: color.background }}
      edges={["top"]}
    >
      {!!rutinas.aviso && (
        <View
          accessibilityRole="alert"
          style={{
            marginHorizontal: space.screen,
            marginTop: space.sm,
            padding: space.md,
            gap: space.xs,
            borderRadius: radius.sm,
            backgroundColor: color.dangerSoft,
          }}
        >
          <Txt variant="callout" tone="danger">
            {rutinas.aviso}
          </Txt>
          <Button title="Entendido" variant="plain" small onPress={rutinas.cerrar} />
        </View>
      )}
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
