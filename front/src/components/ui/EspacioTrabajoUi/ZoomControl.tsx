// front/src/components/ui/ZoomControl.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ZoomControlProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export default function ZoomControl({
  zoomLevel,
  onZoomIn,
  onZoomOut,
}: ZoomControlProps) {
  // Convertimos el valor decimal (ej. 1.2) a porcentaje (120%)
  const percentage = Math.round(zoomLevel * 100);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Alejar"
        style={styles.button}
        onPress={onZoomOut}
      >
        <Ionicons name="remove" size={18} color="#7B5CFA" />
      </TouchableOpacity>

      <Text style={styles.text}>{percentage}%</Text>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Acercar"
        style={styles.button}
        onPress={onZoomIn}
      >
        <Ionicons name="add" size={18} color="#7B5CFA" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EBE5FF",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    marginHorizontal: 12,
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    minWidth: 40,
    textAlign: "center",
  },
});
