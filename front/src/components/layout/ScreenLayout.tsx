import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Topbar from "./Topbar";

export default function ScreenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Topbar />
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F2F0FA" },
  content: { flex: 1 },
});
