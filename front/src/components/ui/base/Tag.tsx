import { View } from "react-native";
import { color, radius, space } from "../../../styles/theme";
import Txt, { TxtTone } from "./Txt";

export type TagTone = "danger" | "primary" | "neutral";

const look: Record<TagTone, { bg: string; tone: TxtTone }> = {
  danger: { bg: color.dangerSoft, tone: "danger" },
  primary: { bg: color.primarySoft, tone: "primary" },
  neutral: { bg: color.line, tone: "ink" },
};

// Etiqueta corta: siempre color + texto, nunca solo color.
export default function Tag({
  text,
  tone = "neutral",
}: {
  text: string;
  tone?: TagTone;
}) {
  return (
    <View
      style={{
        alignSelf: "flex-start",
        paddingHorizontal: space.sm + 1,
        paddingVertical: space.xs,
        borderRadius: radius.pill,
        backgroundColor: look[tone].bg,
      }}
    >
      <Txt variant="caption" weight={700} tone={look[tone].tone}>
        {text}
      </Txt>
    </View>
  );
}
