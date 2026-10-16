import { Switch, View } from "react-native";
import { color, space } from "../../../styles/theme";
import Txt from "./Txt";

export default function Toggle({
  label,
  value,
  onChange,
  detail,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  detail?: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: space.md,
        minHeight: 44,
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Txt>{label}</Txt>
        {!!detail && (
          <Txt variant="caption" tone="secondary">
            {detail}
          </Txt>
        )}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: color.primary, false: color.line }}
        thumbColor={color.surface}
        // react-native-web usa su propio verde si no se indica.
        {...({ activeThumbColor: color.surface } as object)}
      />
    </View>
  );
}
