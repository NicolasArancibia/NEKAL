import { View } from "react-native";
import { space } from "../../../styles/theme";
import Txt from "./Txt";

// Título de sección con un detalle a la derecha (Resumen y Perfil).
export default function SectionTitle({
  title,
  detail,
}: {
  title: string;
  detail?: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: space.md,
        marginTop: space.sm,
      }}
    >
      <Txt variant="headline">{title}</Txt>
      {!!detail && (
        <Txt variant="callout" tone="secondary">
          {detail}
        </Txt>
      )}
    </View>
  );
}
