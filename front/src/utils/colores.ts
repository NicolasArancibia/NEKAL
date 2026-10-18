// Tonos de una mesa a partir de su color (dato guardado en Workspace.color).
// Mezcla lineal en RGB con blanco o negro (B_SISTEMA_VISUAL §2).
export type Tonos = {
  base: string;
  suave: string;
  zona: string;
  zonaInterna: string;
  bordeClaro: string;
  bordeOscuro: string;
};

function rgb(hex: string): [number, number, number] {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`Color inválido: ${hex}`);
  const h =
    m[1].length === 3
      ? m[1]
          .split("")
          .map((c) => c + c)
          .join("")
      : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [
    number,
    number,
    number,
  ];
}
const hex = (c: number[]) =>
  "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
// hacia = 255 (blanco) o 0 (negro); t = cuánto del destino.
const mezcla = (c: number[], hacia: number, t: number) =>
  hex(c.map((v) => v + (hacia - v) * t));

export function tonos(color: string): Tonos {
  const c = rgb(color);
  return {
    base: hex(c),
    suave: mezcla(c, 255, 0.88),
    zona: mezcla(c, 255, 0.92),
    zonaInterna: mezcla(c, 255, 0.84),
    bordeClaro: mezcla(c, 255, 0.25),
    bordeOscuro: mezcla(c, 0, 0.25),
  };
}

// Colores para elegir al crear una mesa (B_SISTEMA_VISUAL §2, provisorios).
export const COLORES_MESA = ["#7546EC", "#2E9E6B", "#D9693C", "#948BA6"];

// Para la interfaz: un color guardado que no sea hex (datos viejos) no rompe
// la pantalla; usa el violeta.
export function tonosDe(hex: string | undefined): Tonos {
  try {
    return tonos(hex ?? COLORES_MESA[0]);
  } catch {
    return tonos(COLORES_MESA[0]);
  }
}
