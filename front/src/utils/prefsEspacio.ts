import type { Ventana } from "./espacio";

// Lo que el Espacio recuerda en el dispositivo (spec H2 §5): solo el tiempo
// elegido. Un valor viejo con la vista («mesas» o «plano») se ignora, porque el
// Espacio ya solo tiene el círculo.
export const VENTANAS: Ventana[] = ["hoy", "semana", "2semanas", "todo"];
export type PrefsEspacio = { ventana: Ventana };

export function leerPrefs(raw: string | null): PrefsEspacio {
  try {
    const p = raw ? JSON.parse(raw) : null;
    const ventana = VENTANAS.find((v) => v === p?.ventana);
    return { ventana: ventana ?? "semana" };
  } catch {
    return { ventana: "semana" };
  }
}
