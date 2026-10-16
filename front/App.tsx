import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import AppNavigator from "./src/navigation/AppNavigator";
import { AppProvider } from "./src/utils/AppContext";
import { color } from "./src/styles/theme";

export default function App() {
  const [loaded, error] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  // Si la fuente falla, la app sigue con la del sistema: nunca queda en blanco.
  if (!loaded && !error)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: color.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={color.primary} />
      </View>
    );
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <NavigationContainer documentTitle={{ formatter: () => "Nekal" }}>
            <AppNavigator />
          </NavigationContainer>
        </AppProvider>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
