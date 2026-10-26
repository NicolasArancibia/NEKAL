import { useSyncExternalStore } from "react";

// Cuántas hojas (Sheet) hay abiertas. En el iPhone un Modal no puede aparecer
// sobre otro, así que el modal de logro espera a que no quede ninguna (spec E §6.3).
let abiertas = 0;
const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach((f) => f());

// Devuelve la función para cerrarla; llamarla dos veces no descuenta de más.
export function abrirHoja(): () => void {
  abiertas++;
  avisar();
  let cerrada = false;
  return () => {
    if (cerrada) return;
    cerrada = true;
    abiertas--;
    avisar();
  };
}

export function useHojasAbiertas(): number {
  return useSyncExternalStore(
    (f) => {
      oyentes.add(f);
      return () => {
        oyentes.delete(f);
      };
    },
    () => abiertas,
    () => abiertas,
  );
}
