import { View, Text, Image, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { useApp } from "../../utils/AppContext";
import { findConflicts } from "../../utils/planner";
import { colors, s } from "../../styles/globalStyles";
import { Button } from "../ui/Common";
export default function Topbar() {
  const {
    data,
    error,
    retry,
    clearError,
    cloudBusy,
    user,
    cloudStatus,
    conflict,
  } = useApp();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const conflicts = findConflicts(data),
    h = new Date().getHours(),
    p = data.preferences;
  const quiet =
    p.quiet &&
    (p.quietStart <= p.quietEnd
      ? h >= p.quietStart && h < p.quietEnd
      : h >= p.quietStart || h < p.quietEnd);
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 8,
        gap: 6,
        backgroundColor: colors.background,
      }}
    >
      <View
        style={[
          s.between,
          {
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 24,
            backgroundColor: "white",
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Hablar con Neka"
          onPress={() => navigation.navigate("Tabs", { screen: "Chat" })}
        >
          <Image
            source={require("../../../assets/Img/Neka_Pose5.png")}
            style={{ width: 44, height: 44 }}
            resizeMode="contain"
          />
        </Pressable>
        <View style={{ alignItems: "center" }}>
          <Text
            style={{
              fontSize: 21,
              fontWeight: "900",
              letterSpacing: 1.5,
              color: colors.primary,
            }}
          >
            NEKAL
          </Text>
          <Text style={{ fontSize: 9, color: colors.muted, letterSpacing: 1 }}>
            ESPACIO PARA LO IMPORTANTE
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir mi perfil"
          onPress={() => navigation.navigate("Tabs", { screen: "Perfil" })}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>
            {data.profile.name[0]?.toUpperCase() || "N"}
          </Text>
        </Pressable>
      </View>
      {p.softAlerts && !quiet && conflicts.length > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ver conflictos con Neka"
          onPress={() => navigation.navigate("Tabs", { screen: "Chat" })}
        >
          <Text
            style={{ fontSize: 11, color: colors.red, textAlign: "center" }}
          >
            Neka encontró {conflicts.length} conflictos · Revisar
          </Text>
        </Pressable>
      )}
      {cloudBusy && <Text style={s.small}>Sincronizando tu cuenta…</Text>}
      {!!user && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ver estado de sincronización"
          onPress={() => navigation.navigate("Tabs", { screen: "Perfil" })}
        >
          <Text
            style={[
              s.small,
              {
                textAlign: "center",
                color: conflict ? colors.red : colors.muted,
              },
            ]}
          >
            {cloudStatus}
          </Text>
        </Pressable>
      )}
      {!!error && (
        <View style={s.card}>
          <Text accessibilityRole="alert" style={s.error}>
            {error}
          </Text>
          <Button
            title="Reintentar guardado"
            small
            onPress={() => {
              clearError();
              retry();
            }}
          />
        </View>
      )}
    </View>
  );
}
