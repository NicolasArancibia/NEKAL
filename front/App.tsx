import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import AppNavigator from "./src/navigation/AppNavigator";
import { AppProvider } from "./src/utils/AppContext";

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer documentTitle={{ formatter: () => "Nekal" }}>
          <AppNavigator />
        </NavigationContainer>
      </AppProvider>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
