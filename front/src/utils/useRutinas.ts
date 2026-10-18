import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { useApp } from "./AppContext";
import { aplicarRutinas } from "./rutinas";

// Crea las ocurrencias de las rutinas que falten (de hoy a hoy+6) al cargar,
// al volver a la app y cuando cambian los datos (una rutina nueva se ve al
// tiro). Si algo falla, se reintenta en la próxima vez.
export function useRutinas() {
  const { data, ready, change } = useApp();
  const [vuelta, setVuelta] = useState(0);
  useEffect(() => {
    const s = AppState.addEventListener("change", (estado) => {
      if (estado === "active") setVuelta((v) => v + 1);
    });
    return () => s.remove();
  }, []);
  useEffect(() => {
    if (!ready || aplicarRutinas(data, Date.now()) === data) return;
    try {
      change((d) => aplicarRutinas(d, Date.now()));
    } catch {
      // Datos cargando o importación en curso: se intenta de nuevo después.
    }
  }, [ready, data, vuelta]);
}
