import { color, radius, space } from "../../../styles/theme";
import PressableScale from "./PressableScale";
import Txt from "./Txt";

export default function Chip({
  title,
  selected = false,
  onPress,
}: {
  title: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={title}
      accessibilityState={{ selected }}
      hitSlop={6}
      style={{
        minHeight: 32,
        paddingHorizontal: space.md,
        borderRadius: radius.pill,
        justifyContent: "center",
        backgroundColor: selected ? color.primary : color.primarySoft,
      }}
    >
      <Txt
        variant="caption"
        weight={600}
        tone={selected ? "onPrimary" : "primary"}
      >
        {title}
      </Txt>
    </PressableScale>
  );
}
