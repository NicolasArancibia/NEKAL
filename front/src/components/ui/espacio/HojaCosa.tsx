import React, { useState } from "react";
import { View } from "react-native";
import { space } from "../../../styles/theme";
import { useApp } from "../../../utils/AppContext";
import { esModelo } from "../../../utils/espacio";
import { Item, passive } from "../../../utils/model";
import { Button, Txt } from "../base";
import ItemEditor from "../ItemEditor";
import ConectarCon from "./ConectarCon";

// La hoja de una cosa en las tres vistas: el ItemEditor de siempre, más
// "Conectar con…" y "Ver dónde está". `aviso` explica dónde queda algo que la
// vista actual no muestra (una nota creada desde Tiempo).
export default function HojaCosa({
  item,
  onClose,
  onVerDonde,
  aviso,
}: {
  item: Item | null;
  onClose: () => void;
  onVerDonde: (i: Item) => void;
  aviso?: string;
}) {
  const { data } = useApp();
  const [conectar, setConectar] = useState(false);
  if (!item) return null;
  const existe = data.items.some((i) => i.id === item.id && !i.deletedAt);
  return (
    <ItemEditor
      key={item.id}
      item={item}
      onClose={onClose}
      sinCompletar={esModelo(item, data)}
      acciones={
        <>
          {!!aviso && (
            <Txt variant="callout" tone="secondary">
              {aviso}
            </Txt>
          )}
          {existe && (
            <View
              style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}
            >
              {!passive(item) && (
                <Button
                  title="Conectar con…"
                  variant="secondary"
                  small
                  onPress={() => setConectar(true)}
                />
              )}
              <Button
                title="Ver dónde está"
                variant="secondary"
                small
                onPress={() => {
                  onVerDonde(item);
                  onClose();
                }}
              />
            </View>
          )}
          {conectar && (
            <ConectarCon
              item={item}
              visible
              onClose={() => setConectar(false)}
            />
          )}
        </>
      }
    />
  );
}
