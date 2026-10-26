// Niveles con curva (spec E §3): llegar al nivel n cuesta 50·n·(n−1) puntos.
export type Nivel = {
  nivel: number;
  desde: number;
  hasta: number;
  avance: number;
};

export const puntosParaNivel = (n: number) => 50 * n * (n - 1);

export function nivelDe(puntos: number): Nivel {
  const p = Math.max(0, puntos);
  let n = Math.max(1, Math.floor((1 + Math.sqrt(1 + p / 12.5)) / 2));
  // La raíz puede quedar corta o larga por redondeo: se corrige con la curva exacta.
  while (puntosParaNivel(n + 1) <= p) n++;
  while (n > 1 && puntosParaNivel(n) > p) n--;
  const desde = puntosParaNivel(n),
    hasta = puntosParaNivel(n + 1);
  return { nivel: n, desde, hasta, avance: (p - desde) / (hasta - desde) };
}
