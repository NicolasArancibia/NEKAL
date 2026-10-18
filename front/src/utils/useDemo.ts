import { useEffect } from "react";
import { useApp } from "./AppContext";
import { sembrarDemo } from "./demo";

// Solo en desarrollo: `nekalDemo()` en la consola agrega dos semanas de datos
// de ejemplo a la cuenta abierta (por la sincronización normal).
export function useDemo() {
  const { change } = useApp();
  useEffect(() => {
    if (!__DEV__) return;
    const g = globalThis as { nekalDemo?: () => string };
    g.nekalDemo = () => {
      change((d) => sembrarDemo(d, Date.now()));
      return "Listo: datos de ejemplo agregados.";
    };
    return () => {
      delete g.nekalDemo;
    };
  }, [change]);
}
