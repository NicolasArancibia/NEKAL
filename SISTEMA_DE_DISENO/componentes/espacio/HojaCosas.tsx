import React from "react";
import { View } from "react-native";
import { Sheet, ListRow } from "../base";
import { color } from "../../../styles/theme";
import { useApp } from "../../../utils/AppContext";
import { fechaDe } from "../../../utils/espacio";
import { Item } from "../../../utils/model";

const diaCorto = (i: Item) => {
  const f = fechaDe(i);
  if (!f) return "Sin fecha";
  return new Date(f).toLocaleDateString("es-CL", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

// Una lista de cosas para abrir una por una (la burbuja «+N» del círculo).
export default function HojaCosas({
  titulo,
  items,
  onAbrir,
  onCerrar,
}: {
  titulo: string;
  items: Item[];
  onAbrir: (i: Item) => void;
  onCerrar: () => void;
}) {
  const { data } = useApp();
  return (
    <Sheet visible title={titulo} onClose={onCerrar}>
      <View>
        {items.map((i) => {
          const mesa = data.workspaces.find((w) => w.id === i.workspaceId);
          return (
            <ListRow
              key={i.id}
              title={i.title}
              detail={`${diaCorto(i)} · ${mesa?.name ?? ""}`}
              dotColor={mesa?.color ?? color.primary}
              done={i.status === "completado"}
              onPress={() => onAbrir(i)}
            />
          );
        })}
      </View>
    </Sheet>
  );
}
