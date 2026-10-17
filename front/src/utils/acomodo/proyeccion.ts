// Falso 3D de la vista Mesas (spec B §5): giro alrededor del eje vertical,
// inclinación de la cámara y zoom. Puro, sin React, para probarlo y poder
// cambiar de motor de dibujo sin tocar el cálculo.
export type Punto3 = { x: number; y: number; z: number };
export type Camara = {
  giro: number;
  inclinacion: number;
  zoom: number;
  cx: number;
  cy: number;
};
export const INCLINACION = { min: 0.6, max: 1.15, inicial: 0.95 };

export function proyectar(
  p: Punto3,
  c: Camara,
): { x: number; y: number; profundidad: number } {
  const cos = Math.cos(c.giro),
    sin = Math.sin(c.giro);
  const x = p.x * cos - p.y * sin;
  const y = p.x * sin + p.y * cos;
  const ci = Math.cos(c.inclinacion),
    si = Math.sin(c.inclinacion);
  return {
    x: c.cx + c.zoom * x,
    y: c.cy + c.zoom * (y * ci - p.z * si),
    profundidad: y * si + p.z * ci,
  };
}

// Orden de dibujo: primero lo lejano, al final lo cercano.
export function ordenarPorProfundidad<T extends { profundidad: number }>(
  lista: T[],
): T[] {
  return [...lista].sort((a, b) => a.profundidad - b.profundidad);
}
