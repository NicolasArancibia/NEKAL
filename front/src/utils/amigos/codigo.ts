// Código de amigo (spec F §3): 6 caracteres sin letras confusas (0/O, 1/I/L).
export const ALFABETO = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const LARGO = 6;

export function nuevoCodigo(azar: () => number = Math.random): string {
  let c = "";
  for (let k = 0; k < LARGO; k++)
    c += ALFABETO[Math.floor(azar() * ALFABETO.length)];
  return c;
}

// Ignora mayúsculas, espacios, guiones y el prefijo «NEKA». El prefijo solo se
// quita con 10 caracteres: N, E, K y A también son parte del alfabeto.
export function normalizarCodigo(texto: string): string | null {
  let c = texto.toUpperCase().replace(/[\s-]/g, "");
  if (c.length === LARGO + 4 && c.startsWith("NEKA")) c = c.slice(4);
  if (c.length !== LARGO || [...c].some((x) => !ALFABETO.includes(x)))
    return null;
  return c;
}

export const mostrarCodigo = (codigo: string) => `NEKA-${codigo}`;
