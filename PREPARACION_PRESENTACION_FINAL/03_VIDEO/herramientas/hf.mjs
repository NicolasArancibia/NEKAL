// Atajos del video. Uso (desde 03_VIDEO):
//   npm run vista      abre la vista previa en el navegador
//   npm run revisar    revisa errores y saca un cuadro de cada escena a revision/
//   npm run exportar   genera salida/nekal-video.mp4 y dice cuánto dura
import { spawnSync } from "node:child_process";
import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prepararFfmpeg } from "./ffmpeg.mjs";
import { preparar } from "./preparar.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(AQUI, "..");
const PROYECTO = path.join(RAIZ, "proyecto");
const HF = "hyperframes@0.9.42"; // versión fija: el video se exporta igual con el tiempo
const SALIDA = path.join(RAIZ, "salida", "nekal-video.mp4");

process.env.DO_NOT_TRACK = "1";
process.env.HYPERFRAMES_SKIP_SKILLS = "1";
prepararFfmpeg();
await preparar();

function hf(...args) {
  const r = spawnSync("npx", ["--yes", HF, ...args], { cwd: PROYECTO, stdio: "inherit", shell: true });
  return r.status ?? 1;
}
function duracion(archivo) {
  const r = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", archivo],
    { encoding: "utf8" },
  );
  return parseFloat(r.stdout);
}
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

// Los segundos en que empieza cada escena, leídos del index.html.
async function escenas() {
  const html = await readFile(path.join(PROYECTO, "index.html"), "utf8");
  return [...html.matchAll(/data-composition-id="(e\d\d-[\w-]+)"[^>]*?data-start="([\d.]+)"[^>]*?data-duration="([\d.]+)"/gs)].map(
    (m) => ({ id: m[1], inicio: +m[2], dura: +m[3] }),
  );
}

const orden = process.argv[2];
const extra = process.argv.slice(3);

if (orden === "vista") {
  process.exit(hf("preview", ...extra));
} else if (orden === "revisar") {
  const estado = hf("lint");
  const lista = await escenas();
  // Tres cuadros por escena: al entrar, al medio y casi al final.
  const tiempos = lista.flatMap((e) => [e.inicio + 1.2, e.inicio + e.dura / 2, e.inicio + e.dura - 0.8]);
  const dir = path.join(RAIZ, "revision");
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  hf("snapshot", "--at", tiempos.map((t) => t.toFixed(2)).join(","), "--output", `"${dir}"`, ...extra);
  console.log(`\nCuadros para mirar en: ${dir}`);
  process.exit(estado);
} else if (orden === "exportar") {
  await mkdir(path.dirname(SALIDA), { recursive: true });
  const estado = hf("render", "--output", `"${SALIDA}"`, "--fps", "30", "--quality", "high",
    "--video-frame-format", "png", "--workers", "2", ...extra);
  if (estado !== 0) process.exit(estado);
  const d = duracion(SALIDA);
  console.log(`\nVideo: ${SALIDA}`);
  console.log(`Dura ${mmss(d)} (${d.toFixed(1)} s).`);
  if (d > 120) console.log("⚠ PASA DE 2:00. La universidad no acepta más de 2 minutos: acorta alguna escena.");
  else if (d < 100) console.log("Aviso: dura menos de 1:40 (la meta es entre 1:40 y 2:00).");
  else console.log("Está dentro de la meta (1:40 a 2:00).");
} else {
  console.log("Uso: npm run vista | npm run revisar | npm run exportar");
  process.exit(1);
}
