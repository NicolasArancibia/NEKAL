import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { useIsFocused } from "@react-navigation/native";

// Hora actual para pantallas con textos relativos ("en 20 min", "Hoy"):
// se renueva cada minuto mientras la pantalla está visible, al volver a ella y
// al volver la app al frente (también pasa la medianoche).
export function useNow(intervalMs = 60000) {
  const [now, setNow] = useState(Date.now());
  const focused = useIsFocused();
  useEffect(() => {
    if (!focused) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") setNow(Date.now());
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [focused, intervalMs]);
  return now;
}
