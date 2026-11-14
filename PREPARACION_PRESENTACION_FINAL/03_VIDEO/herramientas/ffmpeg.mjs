// Encuentra ffmpeg aunque la terminal todavía no lo tenga en el PATH
// (winget lo instala en una carpeta propia) y lo deja disponible para
// este proceso y los que lance (hyperframes lo necesita para exportar).
import { existsSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

export function prepararFfmpeg() {
  if (spawnSync("ffmpeg", ["-version"]).status === 0) return;
  const base = path.join(process.env.LOCALAPPDATA ?? "", "Microsoft", "WinGet", "Packages");
  if (existsSync(base)) {
    for (const paquete of readdirSync(base).filter((n) => n.startsWith("Gyan.FFmpeg"))) {
      for (const version of readdirSync(path.join(base, paquete))) {
        const bin = path.join(base, paquete, version, "bin");
        if (existsSync(path.join(bin, "ffmpeg.exe"))) {
          process.env.PATH = bin + path.delimiter + process.env.PATH;
          return;
        }
      }
    }
  }
  throw new Error("No encontré ffmpeg. Instálalo con: winget install --id Gyan.FFmpeg -e");
}
