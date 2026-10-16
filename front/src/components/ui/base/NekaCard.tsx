import { Image, View } from "react-native";
import type { NekaAction, NekaState } from "../../../utils/neka";
import Button from "./Button";
import Card from "./Card";
import Txt from "./Txt";
import { nekaImage } from "./nekaImages";

// Tarjeta principal del Resumen: Neka reacciona a la situación del día.
export default function NekaCard({
  state,
  onAction,
}: {
  state: NekaState;
  onAction: (a: NekaAction) => void;
}) {
  const action = state.action;
  return (
    <Card variant="featured" style={{ paddingRight: 116, minHeight: 122 }}>
      <Txt weight={600} numberOfLines={4}>
        {state.message}
      </Txt>
      {action && (
        <View style={{ alignSelf: "flex-start" }}>
          <Button title={action.label} small onPress={() => onAction(action)} />
        </View>
      )}
      <Image
        source={nekaImage(state.pose)}
        resizeMode="contain"
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={{
          position: "absolute",
          right: 6,
          bottom: -4,
          width: 104,
          height: 116,
        }}
      />
    </Card>
  );
}
