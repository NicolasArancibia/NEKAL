// Copia a proyecto/assets/base/ lo que el video usa de 00_BASE (tipografía,
// colores, poses de Neka y pantallazos). Así, si 00_BASE cambia, basta volver
// a correr esto (lo hacen solos «npm run vista» y «npm run exportar»).
import { cp, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const BASE = path.join(AQUI, "..", "..", "00_BASE");
const DESTINO = path.join(AQUI, "..", "proyecto", "assets", "base");

export async function preparar() {
  await mkdir(DESTINO, { recursive: true });
  for (const carpeta of ["estilo", "marca", "pantallas"]) {
    await cp(path.join(BASE, carpeta), path.join(DESTINO, carpeta), { recursive: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await preparar();
  console.log("Listo: proyecto/assets/base/ al día con 00_BASE.");
}
