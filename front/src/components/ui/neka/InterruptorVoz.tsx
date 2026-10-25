import { Switch, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Txt } from "../base";
import { color, size, space } from "../../../styles/theme";
import { useNeka } from "../../../utils/NekaContext";

// Arriba a la derecha del chat: si Neka lee sus respuestas en voz alta. Se
// guarda en cada dispositivo (spec D §2).
export default function InterruptorVoz() {
  const { voz, setVoz } = useNeka();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.xs,
        minHeight: size.minTouch,
      }}
    >
      <Ionicons
        name={voz ? "volume-medium-outline" : "volume-mute-outline"}
        size={size.icon - 4}
        color={color.inkSecondary}
      />
      <Txt variant="callout" tone="secondary" weight={600}>
        Voz
      </Txt>
      <Switch
        accessibilityLabel="Neka responde en voz alta"
        value={voz}
        onValueChange={setVoz}
        trackColor={{ true: color.primary, false: color.lineStrong }}
        thumbColor={color.surface}
        {...({ activeThumbColor: color.surface } as object)}
      />
    </View>
  );
}
