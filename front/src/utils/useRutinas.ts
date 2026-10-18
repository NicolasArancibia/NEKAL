import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { useApp } from "./AppContext";
import { aplicarRutinas } from "./rutinas";

// Crea las ocurrencias de las rutinas que falten (de hoy a hoy+6) al cargar,
// al volver a la app y cuando cambian los datos (una rutina nueva se ve al
// tiro). Va de a un día por vez para no pasar el límite de la sincronización;
// si un día solo no cabe, devuelve un aviso con el nombre de la rutina.
export function useRutinas(): { aviso: string; cerrar: () => void } {
  const { data, ready, change } = useApp();
  const [vuelta, setVuelta] = useState(0);
  const [aviso, setAviso] = useState("");
  const [cerrado, setCerrado] = useState("");
  useEffect(() => {
    const s = AppState.addEventListener("change", (estado) => {
      if (estado === "active") setVuelta((v) => v + 1);
    });
    return () => s.remove();
  }, []);
  useEffect(() => {
    if (!ready) return;
    const siguiente = aplicarRutinas(data, Date.now(), 1);
    if (siguiente === data) return;
    try {
      change((d) => aplicarRutinas(d, Date.now(), 1));
    } catch (e) {
      const mensaje = (e as Error).message;
      // Datos cargando o importación en curso: se intenta de nuevo después.
      if (mensaje.startsWith("Espera")) return;
      const dia = siguiente.groups.find((g) => !data.groups.includes(g));
      const rutina = data.groups.find((g) => g.id === dia?.parentId);
      setAviso(
        `La rutina «${rutina?.name ?? ""}» es demasiado grande para copiarse cada día. Divídela en rutinas más chicas.`,
      );
    }
  }, [ready, data, vuelta]);
  return {
    aviso: aviso === cerrado ? "" : aviso,
    cerrar: () => setCerrado(aviso),
  };
}
