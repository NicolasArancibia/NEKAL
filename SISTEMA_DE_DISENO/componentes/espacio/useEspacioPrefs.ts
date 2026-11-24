import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Ventana } from "../../../utils/espacio";
import { leerPrefs } from "../../../utils/prefsEspacio";

const CLAVE = "nekal:espacio";

// El último tiempo elegido, en este dispositivo (spec H2 §5). La primera vez:
// semana. La vista que se guardaba antes (mesas o plano) se ignora.
export function useEspacioPrefs() {
  const [ventana, setVentanaState] = useState<Ventana>("semana");
  const [listo, setListo] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(CLAVE)
      .then((raw) => setVentanaState(leerPrefs(raw).ventana))
      .catch(() => {})
      .finally(() => setListo(true));
  }, []);
  const setVentana = (v: Ventana) => {
    setVentanaState(v);
    AsyncStorage.setItem(CLAVE, JSON.stringify({ ventana: v })).catch(() => {});
  };
  return { ventana, listo, setVentana };
}
