import { color, radius, size, space } from "../../../styles/theme";
import { PressableScale, Txt } from "../base";

// Píldora blanca con borde punteado del color de la otra mesa: "2 en Estudios ›".
export default function AvisoBorde({
  texto,
  tonoHex,
  onPress,
}: {
  texto: string;
  tonoHex: string;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={texto}
      style={{
        minHeight: size.minTouch,
        justifyContent: "center",
        paddingHorizontal: space.md,
        borderRadius: radius.pill,
        backgroundColor: color.surface,
        borderWidth: 1.5,
        borderStyle: "dashed",
        borderColor: tonoHex,
      }}
    >
      <Txt variant="caption" weight={700}>
        {texto} ›
      </Txt>
    </PressableScale>
  );
}
