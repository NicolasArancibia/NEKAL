import { useState } from "react";
import { useApp } from "./AppContext";
import { Item, saveItem } from "./model";
import { haptic } from "./haptics";

// Completar o reabrir desde una lista. Las reglas (dependencias, puntos) siguen
// en saveItem; si las rompe, se devuelve su mensaje en `error`.
export function useToggleDone() {
  const { change } = useApp();
  const [error, setError] = useState("");
  const toggle = (item: Item) => {
    const completing = item.status !== "completado";
    try {
      change((d) => {
        const current = d.items.find((i) => i.id === item.id) ?? item;
        return saveItem(d, {
          ...current,
          status: completing ? "completado" : "pendiente",
        });
      });
      if (completing) haptic.success();
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return { toggle, error };
}
