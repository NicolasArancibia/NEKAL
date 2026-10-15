// front/src/components/ui/ChatUi/ChatHeader.tsx
import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

export default function ChatHeader() {
  return (
    <View style={styles.container}>
      <Image
        // Asegúrate de que la ruta coincida con la ubicación de tu asset
        source={require("../../../../assets/Img/Neka_Pose5.png")}
        style={styles.image}
        resizeMode="contain"
      />
      <View style={styles.textContainer}>
        <Text style={styles.title}>Neka</Text>
        <Text style={styles.subtitle}>PREGÚNTALE LO QUE NECESITES</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 24,
    // Sombra/Resplandor morado
    shadowColor: "#7B5CFA",
    shadowOpacity: 0.15,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  image: {
    width: 60,
    height: 60,
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#7B5CFA",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#8A85A0",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
