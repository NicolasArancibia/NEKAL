import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Login from "./Login";
import { useApp } from "../utils/AppContext";
import { colors, s } from "../styles/globalStyles";

export default function Bienvenida() {
  const { enterGuest } = useApp();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 460,
              alignSelf: "center",
              gap: 20,
            }}
          >
            <View style={{ alignItems: "center", gap: 8 }}>
              <Image
                source={require("../../assets/Img/Neka_Pose5.png")}
                style={{ width: 94, height: 94 }}
                resizeMode="contain"
                accessibilityLabel="Neka te da la bienvenida"
              />
              <Text style={[s.title, { color: colors.primary }]}>
                Bienvenido a Nekal
              </Text>
              <Text
                style={[s.subtitle, { textAlign: "center", marginBottom: 0 }]}
              >
                Un espacio para lo importante, a tu ritmo.
              </Text>
            </View>
            <Login onGuest={enterGuest} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
