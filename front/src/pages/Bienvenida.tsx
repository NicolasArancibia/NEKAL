import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Login from "./Login";
import { useApp } from "../utils/AppContext";
import { color, space } from "../styles/theme";
import { Txt, nekaImage } from "../components/ui/base";

export default function Bienvenida() {
  const { enterGuest } = useApp();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            padding: space.xxl,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 460,
              alignSelf: "center",
              gap: space.xl,
            }}
          >
            <View style={{ alignItems: "center", gap: space.sm }}>
              <Image
                source={nekaImage(3)}
                style={{ width: 104, height: 120 }}
                resizeMode="contain"
                accessibilityLabel="Neka te saluda"
              />
              <Txt
                variant="largeTitle"
                tone="primary"
                accessibilityRole="header"
              >
                Nekal
              </Txt>
              <Txt tone="secondary" align="center">
                Organiza tu día. Neka te avisa si algo choca.
              </Txt>
            </View>
            <Login onGuest={enterGuest} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
