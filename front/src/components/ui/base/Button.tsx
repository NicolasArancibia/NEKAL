import { color, radius, size, space } from "../../../styles/theme";
import PressableScale from "./PressableScale";
import Txt, { TxtTone } from "./Txt";

export type ButtonVariant = "primary" | "secondary" | "danger" | "plain";

const look: Record<ButtonVariant, { bg?: string; tone: TxtTone }> = {
  primary: { bg: color.primary, tone: "onPrimary" },
  secondary: { bg: color.primarySoft, tone: "primary" },
  danger: { bg: color.danger, tone: "onPrimary" },
  plain: { tone: "primary" },
};

const SMALL = 36;

export default function Button({
  title,
  onPress,
  variant = "primary",
  small = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  small?: boolean;
  disabled?: boolean;
}) {
  const { bg, tone } = look[variant];
  return (
    <PressableScale
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onPress}
      hitSlop={small ? (size.minTouch - SMALL) / 2 : undefined}
      style={{
        minHeight: small ? SMALL : 46,
        paddingHorizontal: small ? space.md : space.xl,
        borderRadius: radius.pill,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: bg,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Txt variant="callout" weight={700} tone={tone} align="center">
        {title}
      </Txt>
    </PressableScale>
  );
}
