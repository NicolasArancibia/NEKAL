import { Image, View } from "react-native";
import type { NekaPose } from "../../../utils/neka";
import { space } from "../../../styles/theme";
import Button from "./Button";
import Txt from "./Txt";
import { nekaImage } from "./nekaImages";

export default function EmptyState({
  pose,
  text,
  action,
}: {
  pose: NekaPose;
  text: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View
      style={{ alignItems: "center", gap: space.md, paddingVertical: space.xl }}
    >
      <Image
        source={nekaImage(pose)}
        style={{ width: 82, height: 96 }}
        resizeMode="contain"
        aria-hidden
      />
      <Txt tone="secondary" align="center">
        {text}
      </Txt>
      {action && (
        <Button
          title={action.label}
          variant="secondary"
          small
          onPress={action.onPress}
        />
      )}
    </View>
  );
}
