import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { localDay } from "./model";

const CLAVE = "nekal:atrasadas:preguntadas";

// Lo que Neka ya preguntó hoy por lo importante que se pasó (spec H2 §4): id →
// día. Se guarda en el dispositivo y solo conserva lo de hoy: mañana vuelve a
// preguntar, pero no insiste el mismo día.
export function usePreguntadas() {
  const [preguntadas, setPreguntadas] = useState<Record<string, string>>({});
  const [listo, setListo] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(CLAVE)
      .then((raw) => {
        const v = raw ? JSON.parse(raw) : {};
        if (v && typeof v === "object") setPreguntadas(v);
      })
      .catch(() => {})
      .finally(() => setListo(true));
  }, []);
  const marcar = (id: string) => {
    const hoy = localDay();
    setPreguntadas((antes) => {
      const siguiente = Object.fromEntries(
        Object.entries({ ...antes, [id]: hoy }).filter(
          ([, dia]) => dia === hoy,
        ),
      );
      AsyncStorage.setItem(CLAVE, JSON.stringify(siguiente)).catch(() => {});
      return siguiente;
    });
  };
  return { preguntadas, marcar, listo };
}
