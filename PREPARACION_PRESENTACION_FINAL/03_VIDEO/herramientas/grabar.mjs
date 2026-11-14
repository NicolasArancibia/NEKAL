// Graba la app REAL de Nekal en modo invitado y deja los clips en
// proyecto/assets/app/ (un .mp4 y un .json con las marcas de tiempo por clip).
//
// Antes: la app corriendo en http://localhost:8082
//   (desde la raíz del repo: npm --prefix front run web -- --port 8082)
// Uso, desde 03_VIDEO:  npm run grabar            (todos los clips)
//                       npm run grabar -- plan    (solo los que nombres)
//
// Qué datos usa: los de ejemplo de la app (nekalDemo y nekalAmigos) con tres
// ajustes hechos solo en este navegador temporal, nunca en una cuenta:
//   1. agrega «Clase recuperativa de Cálculo» (fija) mañana a las 19:00, que
//      choca con «Llamar a mamá»: es el choque que Neka arregla en el video;
//   2. manda a la papelera las atrasadas de ejemplo, menos «Renovar el pasaporte»;
//   3. pone el nombre «Nicolás» en el perfil.
// El plan de Neka lo arma la IA real: puede variar un poco entre grabaciones.
import { chromium } from "playwright-core";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prepararFfmpeg } from "./ffmpeg.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SALIDA = path.join(AQUI, "..", "proyecto", "assets", "app");
const TMP = path.join(AQUI, "..", ".tmp-grabacion");
const URL = process.env.NEKAL_URL ?? "http://localhost:8082";
const pedir = process.argv.slice(2);
const quiero = (n) => pedir.length === 0 || pedir.includes(n);

prepararFfmpeg();
await mkdir(SALIDA, { recursive: true });

const navegador = await chromium.launch({
  channel: "msedge",
  args: ["--force-device-scale-factor=2"], // cuadros a 780 × 1688 (nítidos)
});
const contexto = await navegador.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: "es-CL",
});
const p = await contexto.newPage();
const cdp = await contexto.newCDPSession(p);
const espera = (ms) => p.waitForTimeout(ms);

// ---------- grabación cuadro a cuadro ----------
let actual = null;
cdp.on("Page.screencastFrame", (f) => {
  cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
  if (!actual || actual.pausado) return;
  const n = actual.cuadros.length;
  const archivo = path.join(actual.dir, `c${String(n).padStart(5, "0")}.png`);
  actual.cuadros.push({ archivo, t: f.metadata.timestamp - actual.descuento });
  actual.pendientes.push(writeFile(archivo, Buffer.from(f.data, "base64")));
});

// Si la acción devuelve false, la toma se descarta y se repite (hasta 5 veces).
async function grabar(nombre, accion) {
  if (!quiero(nombre)) return;
  for (let intento = 1; intento <= 5; intento++) {
    if (await grabarUna(nombre, accion)) return;
    console.log(`  toma ${intento} de «${nombre}» descartada; repito`);
  }
  throw new Error(`No salió una buena toma de «${nombre}» en 5 intentos.`);
}
async function grabarUna(nombre, accion) {
  const dir = path.join(TMP, nombre);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  actual = { dir, cuadros: [], pendientes: [], marcas: {}, descuento: 0, pausado: false, pausaDesde: 0 };
  const reg = actual;
  await cdp.send("Page.startScreencast", { format: "png", everyNthFrame: 1, maxWidth: 2000, maxHeight: 4000 });
  await toque(1, 1, true); // fuerza un primer cuadro
  await espera(300);
  const sirve = (await accion()) !== false;
  await espera(300);
  await cdp.send("Page.stopScreencast");
  actual = null;
  await Promise.all(reg.pendientes);
  if (!sirve) return false;
  const t0 = reg.cuadros[0].t;
  const fin = reg.cuadros.at(-1).t - t0 + 0.4;
  let lista = "ffconcat version 1.0\n";
  reg.cuadros.forEach((c, i) => {
    const sig = i + 1 < reg.cuadros.length ? reg.cuadros[i + 1].t : c.t + 0.4;
    lista += `file '${path.basename(c.archivo)}'\nduration ${Math.max(sig - c.t, 0.001).toFixed(4)}\n`;
  });
  lista += `file '${path.basename(reg.cuadros.at(-1).archivo)}'\n`;
  await writeFile(path.join(dir, "lista.txt"), lista);
  const mp4 = path.join(SALIDA, `${nombre}.mp4`);
  const r = spawnSync(
    "ffmpeg",
    ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", "lista.txt",
     "-vf", "fps=30,format=yuv420p", "-c:v", "libx264", "-crf", "12", "-preset", "slow",
     "-g", "15", "-movflags", "+faststart", mp4],
    { cwd: dir, encoding: "utf8" },
  );
  if (r.status !== 0) throw new Error(`ffmpeg falló en ${nombre}: ${r.stderr}`);
  const marcas = Object.fromEntries(
    Object.entries(reg.marcas).map(([k, v]) => [k, +Math.max(v - t0, 0).toFixed(2)]),
  );
  await writeFile(path.join(SALIDA, `${nombre}.json`), JSON.stringify({ duracion: +fin.toFixed(2), marcas }, null, 2));
  console.log(`listo: ${nombre}.mp4 (${fin.toFixed(1)} s)`, marcas);
  return true;
}
const ahora = () => Date.now() / 1000;
// El navegador fecha los cuadros con el mismo reloj (segundos desde 1970).
const marca = (n) => { if (actual) actual.marcas[n] = ahora() - actual.descuento; };
// Deja de guardar cuadros mientras se espera algo (por ejemplo, a la IA).
const pausar = () => { if (actual) { actual.pausado = true; actual.pausaDesde = ahora(); } };
const reanudar = () => {
  if (actual?.pausado) { actual.descuento += ahora() - actual.pausaDesde; actual.pausado = false; }
};

// ---------- gestos ----------
async function toque(x, y, invisible = false) {
  await p.evaluate(([x, y, invisible]) => {
    const d = document.createElement("div");
    const o = invisible ? 0.01 : 1;
    d.style.cssText =
      `position:fixed;left:${x - 24}px;top:${y - 24}px;width:48px;height:48px;border-radius:50%;` +
      `background:rgba(117,70,236,.26);border:2px solid rgba(117,70,236,.55);pointer-events:none;` +
      `z-index:2147483647;opacity:0;`;
    document.body.appendChild(d);
    d.animate(
      [
        { transform: "scale(.4)", opacity: 0 },
        { transform: "scale(1)", opacity: o, offset: 0.35 },
        { transform: "scale(1)", opacity: o, offset: 0.7 },
        { transform: "scale(1.25)", opacity: 0 },
      ],
      { duration: 650, easing: "ease-out" },
    ).onfinish = () => d.remove();
  }, [x, y, invisible]);
}
async function tocar(loc) {
  const l = loc.first();
  await l.waitFor({ state: "visible", timeout: 15000 });
  const c = await l.boundingBox();
  await toque(c.x + c.width / 2, c.y + c.height / 2);
  await espera(280);
  await l.click();
}
async function deslizar(dy, ms = 1400) {
  const pasos = Math.round(ms / 16);
  let hecho = 0;
  await p.mouse.move(195, 480);
  for (let i = 1; i <= pasos; i++) {
    const k = i / pasos;
    const suave = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const meta = Math.round(dy * suave);
    if (meta !== hecho) await p.mouse.wheel(0, meta - hecho);
    hecho = meta;
    await espera(16);
  }
}
const pestana = (nombre) => tocar(p.getByRole("tab", { name: nombre }));
async function cerrarLogros() {
  for (let i = 0; i < 4; i++) {
    const g = p.getByRole("button", { name: "Genial" }).first();
    if (!(await g.isVisible().catch(() => false))) return;
    await g.click();
    await espera(700);
  }
}

// El servidor de desarrollo de Expo a veces muestra un cuadrito negro con un
// rayo (aviso de recarga). No es parte de la app: se esconde para grabar.
const esconderAvisoDeDesarrollo = () =>
  p.addStyleTag({ content: "body > div:empty:not([style]) { display: none !important; }" });

// ---------- preparar los datos de ejemplo ----------
await p.goto(URL, { waitUntil: "networkidle" });
await p.getByRole("button", { name: "Continuar como invitado" }).click();
await p.waitForFunction(() => typeof globalThis.nekalDemo === "function");
await p.evaluate(() => globalThis.nekalDemo());
await espera(1500);
await p.evaluate(() => {
  const K = "nekal:v1:guest";
  const d = JSON.parse(localStorage[K]);
  const hoy = new Date();
  const dia = (n, h = 0, m = 0) =>
    new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + n, h, m).toISOString();
  for (const i of d.items) {
    const f = i.scheduledAt || i.dueAt;
    if (i.status === "pendiente" && f && f < dia(0) && i.id !== "demo-atr-pasaporte") i.deletedAt = dia(0);
  }
  const base = d.items.find((i) => i.id === "demo-mama");
  d.items.push({
    ...base, id: "video-clase", type: "Evento", title: "Clase recuperativa de Cálculo",
    workspaceId: "demo-universidad", scheduledAt: dia(1, 19, 0), duration: 90,
    flexible: false, priority: "urgente", x: 9, y: 9,
  });
  d.profile = { ...d.profile, name: "Nicolás" };
  localStorage[K] = JSON.stringify(d);
  localStorage.removeItem("nekal:atrasadas:preguntadas");
});
await p.reload({ waitUntil: "networkidle" });
await p.getByRole("button", { name: "Continuar como invitado" }).click();
await espera(2500);
await esconderAvisoDeDesarrollo();
await cerrarLogros();

// ---------- clips ----------
await grabar("resumen", async () => {
  marca("inicio");
  await espera(2200);
  await deslizar(640, 1800);
  marca("tusdias");
  await espera(2200);
  await deslizar(-640, 1200);
  await espera(600);
});

// La IA real no siempre propone lo mismo. Para el video sirve la toma en que
// el plan completo (dibujo del día y botón Aceptar) cabe en la pantalla sin
// deslizar; si no cabe, se descarta el plan en la app y se pide de nuevo
// (dos veces). A la tercera se graba igual, deslizando hasta los botones.
let tomasPlan = 0;
await grabar("plan", async () => {
  await pestana("Resumen");
  await espera(700);
  await pestana("Calendario");
  await espera(900);
  await tocar(p.getByText("Agenda", { exact: true }));
  await espera(900);
  const arreglar = p.getByRole("button", { name: "Arreglar con Neka" });
  const caja = await arreglar.first().boundingBox();
  await deslizar(Math.round(caja.y - 560), 1300);
  marca("choque");
  await espera(3200);
  marca("tocar");
  await tocar(arreglar);
  await espera(1700); // «Neka está pensando…»
  pausar(); // la espera real de la IA no entra al clip
  const aceptar = p.getByRole("button", { name: /Aceptar \d+ cambio/ });
  await p.getByText("Plan de Neka").first().waitFor({ timeout: 60000 });
  reanudar();
  marca("plan");
  await aceptar.first().waitFor({ timeout: 60000 });
  await espera(900);
  const boton = await aceptar.first().boundingBox();
  const descartar = p.getByRole("button", { name: "Descartar" }).first();
  const abajo = await descartar.boundingBox();
  const fondo = abajo ? Math.round(abajo.y + abajo.height) : 9999;
  const cabe = !!boton && fondo <= 830;
  console.log(`  plan de Neka: ${cabe ? "cabe en la pantalla" : "hay que deslizar para ver el botón"}`);
  if (!cabe && tomasPlan++ < 2) {
    await descartar.scrollIntoViewIfNeeded();
    await descartar.click();
    await espera(1200);
    return false;
  }
  if (!cabe) {
    // Plan largo: se muestra arriba, se desliza hasta los botones y se acepta.
    await espera(3200);
    await deslizar(fondo - 800, 1500);
    marca("botones");
    await espera(1400);
  } else await espera(5200);
  marca("aceptar");
  await tocar(aceptar);
  await espera(600);
  marca("logro");
  await espera(2800);
  await cerrarLogros();
  marca("final");
  await espera(3200);
});

await grabar("espacio", async () => {
  await pestana("Espacio");
  marca("inicio");
  await espera(2600);
  await tocar(p.getByRole("button", { name: "Hoy", exact: true }));
  marca("hoy");
  await espera(2000);
  await tocar(p.getByRole("button", { name: "2 semanas", exact: true }));
  marca("dos");
  await espera(2000);
  await tocar(p.getByRole("button", { name: "Semana", exact: true }));
  marca("semana");
  await espera(2200);
});

if (quiero("perfil")) {
  await p.evaluate(() => globalThis.nekalAmigos?.());
  await espera(1500);
  await cerrarLogros(); // cargar amigos da un logro nuevo
}
await grabar("perfil", async () => {
  await pestana("Perfil");
  marca("inicio");
  await espera(1800);
  await deslizar(900, 2400);
  marca("nivel");
  await espera(1800);
  await deslizar(800, 2200);
  marca("logros");
  await espera(2000);
  await deslizar(-1700, 1500);
  await espera(500);
});

await grabar("chat", async () => {
  await pestana("Chat con Neka");
  marca("inicio");
  await espera(1500);
  await tocar(p.getByText("¿Qué tengo hoy?", { exact: true }));
  await espera(1500);
  pausar();
  await p
    .waitForFunction(() => !document.body.innerText.includes("pensando"), null, { timeout: 60000 })
    .catch(() => {});
  await espera(600);
  reanudar();
  marca("respuesta");
  await espera(3500);
});

await navegador.close();
await rm(TMP, { recursive: true, force: true });
console.log("Clips en proyecto/assets/app/");
