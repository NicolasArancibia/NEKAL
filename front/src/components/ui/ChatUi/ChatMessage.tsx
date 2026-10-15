// front/src/components/ui/ChatUi/ChatMessage.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ChatMessageProps {
  message?: string;
  isUser: boolean;
  isTyping?: boolean;
}

export default function ChatMessage({
  message,
  isUser,
  isTyping,
}: ChatMessageProps) {
  const alignStyle = isUser ? styles.userAlign : styles.nekaAlign;
  const label = isUser ? "USUARIO" : "NEKA";

  return (
    <View style={[styles.container, alignStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.bubble}>
        {isTyping ? (
          <Ionicons name="ellipsis-horizontal" size={24} color="#333" />
        ) : (
          <Text style={styles.messageText}>{message}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    marginHorizontal: 20,
    maxWidth: "80%",
  },
  userAlign: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  nekaAlign: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  label: {
    fontSize: 10,
    color: "#7B5CFA",
    fontWeight: "bold",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  bubble: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: "#7B5CFA",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  messageText: {
    fontSize: 14,
    color: "#333333",
    lineHeight: 20,
  },
});
