import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Resumen: "grid-outline",
  Calendario: "calendar-outline",
  EspacioTrabajo: "briefcase-outline",
  Chat: "chatbubble-outline",
  Perfil: "person-outline",
};

export default function Navbar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const isActive = state.index === index;
        const { options } = descriptors[route.key];
        const label = (options.title ?? route.name) as string;
        const iconName = ICONS[route.name] ?? "ellipse-outline";

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isActive && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: isActive }}
            style={styles.tab}
            onPress={onPress}
          >
            <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
              <Ionicons
                name={iconName}
                size={22}
                color={isActive ? "#FFFFFF" : "#8A85A0"}
              />
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  tab: { flex: 1, alignItems: "center", justifyContent: "center" },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: { backgroundColor: "#7B5CFA" },
  label: { fontSize: 11, color: "#8A85A0", marginTop: 2 },
  labelActive: { color: "#7B5CFA", fontWeight: "600" },
});
