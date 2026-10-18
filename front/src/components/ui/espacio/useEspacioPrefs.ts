import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Ventana } from "../../../utils/espacio";

export type Vista = "tiempo" | "mesas" | "plano";
type Prefs = { vista: Vista; ventana: Ventana };

const CLAVE = "nekal:espacio";
const VISTAS: Vista[] = ["tiempo", "mesas", "plano"];
const VENTANAS: Ventana[] = ["hoy", "semana", "2semanas", "todo"];

// Última vista y último tiempo elegidos, en este dispositivo. La primera vez:
// Mesas, semana (spec B §3).
export function useEspacioPrefs() {
  const [prefs, setPrefs] = useState<Prefs>({ vista: "mesas", ventana: "semana" });
  const [listo, setListo] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(CLAVE)
      .then((raw) => {
        const p = raw ? JSON.parse(raw) : {};
        setPrefs((x) => ({
          vista: VISTAS.includes(p.vista) ? p.vista : x.vista,
          ventana: VENTANAS.includes(p.ventana) ? p.ventana : x.ventana,
        }));
      })
      .catch(() => {})
      .finally(() => setListo(true));
  }, []);
  const cambiar = (parte: Partial<Prefs>) =>
    setPrefs((x) => {
      const next = { ...x, ...parte };
      AsyncStorage.setItem(CLAVE, JSON.stringify(next)).catch(() => {});
      return next;
    });
  return {
    ...prefs,
    listo,
    setVista: (vista: Vista) => cambiar({ vista }),
    setVentana: (ventana: Ventana) => cambiar({ ventana }),
  };
}
