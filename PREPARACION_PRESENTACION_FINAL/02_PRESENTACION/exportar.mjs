// Exporta la presentación a PDF (una diapositiva por página) y saca una imagen de cada una.
// También vuelve a escribir REPARTO_DE_MINUTOS.md con los minutos que tiene cada diapositiva.
//
// Uso, desde esta carpeta:   node exportar.mjs
//   (o doble clic en EXPORTAR.bat)
// Opciones:  --sin-capturas   solo el PDF, más rápido
//            --sin-respaldo   deja fuera las diapositivas de respaldo
// Salida:    salida/Nekal_Presentacion.pdf   y   salida/capturas/NN-tipo.png
//
// Usa el navegador Edge que ya viene con Windows, sin internet.
import { chromium } from "../00_BASE/herramientas/node_modules/playwright-core/index.mjs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SALIDA = path.join(AQUI, "salida");
const CAPTURAS = path.join(SALIDA, "capturas");
const sinCapturas = process.argv.includes("--sin-capturas");
const sinRespaldo = process.argv.includes("--sin-respaldo");
const MAXIMO = 30;

await mkdir(SALIDA, { recursive: true });

const navegador = await chromium.launch({ channel: "msedge" });
const pagina = await navegador.newPage({ viewport: { width: 1920, height: 1080 } });
const avisos = [];
pagina.on("pageerror", (e) => avisos.push("Error en la página: " + e.message));
pagina.on("requestfailed", (r) => { if (!r.url().endsWith("media/video.mp4")) avisos.push("No se encontró: " + decodeURI(r.url())); });

await pagina.goto(pathToFileURL(path.join(AQUI, "presentacion.html")).href + "?imprimir", { waitUntil: "load" });
await pagina.evaluate(() => document.fonts.ready);
await pagina.waitForTimeout(600);
if (sinRespaldo) await pagina.evaluate(() => document.querySelectorAll(".dp.respaldo").forEach((d) => d.remove()));

// Datos de cada diapositiva + revisión de textos que se salen
const datos = await pagina.evaluate(() =>
  [...document.querySelectorAll(".dp")].map((dp, i) => {
    const caja = dp.getBoundingClientRect();
    const fuera = [...dp.querySelectorAll("h1,h2,h3,p,li,td,th,figcaption,table,.telefono,.tarjeta,.paso,.lado,.hueco,.cifra")].filter((el) => {
      if (el.closest(".notas, .sin-video") && !dp.classList.contains("vacio")) return false;
      if (el.closest(".notas")) return false;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return false;
      return r.left < caja.left + 40 || r.right > caja.right - 40 || r.top < caja.top + 30 || r.bottom > caja.bottom - 96;
    }).map((el) => (el.textContent || el.className).trim().replace(/\s+/g, " ").slice(0, 50));
    return {
      n: i + 1,
      tipo: [...dp.classList].find((c) => c.startsWith("dp-")).slice(3),
      respaldo: dp.classList.contains("respaldo"),
      bloque: dp.dataset.bloque,
      min: parseFloat(dp.dataset.min || "0"),
      titulo: (dp.querySelector("h1,h2,.frase,.cita,.numero")?.textContent || "").trim().replace(/\s+/g, " ").slice(0, 70),
      pendiente: dp.querySelector(".marca-falta") ? "FALTA" : dp.querySelector(".marca-revisar") ? "REVISAR" : "",
      fuera,
    };
  })
);

await pagina.pdf({ path: path.join(SALIDA, "Nekal_Presentacion.pdf"), width: "1920px", height: "1080px", printBackground: true, preferCSSPageSize: true });
console.log("PDF listo: salida/Nekal_Presentacion.pdf (" + datos.length + " páginas)");

if (!sinCapturas) {
  await rm(CAPTURAS, { recursive: true, force: true });
  await mkdir(CAPTURAS, { recursive: true });
  const dps = pagina.locator(".dp");
  for (const d of datos) {
    await dps.nth(d.n - 1).screenshot({ path: path.join(CAPTURAS, String(d.n).padStart(2, "0") + "-" + d.tipo + ".png") });
  }
  console.log("Capturas listas: salida/capturas/ (" + datos.length + ")");
}
await navegador.close();

// Reparto de minutos
const fmt = (m) => { const s = Math.round(m * 60); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
const principales = datos.filter((d) => !d.respaldo);
const bloques = [];
for (const d of principales) {
  let b = bloques.at(-1);
  if (!b || b.nombre !== d.bloque) bloques.push((b = { nombre: d.bloque, min: 0, desde: d.n, hasta: d.n, cuantas: 0 }));
  b.min += d.min; b.hasta = d.n; b.cuantas++;
}
const total = principales.reduce((a, d) => a + d.min, 0);
let acum = 0;
let md = "# Reparto de minutos\n\n";
md += "> Este archivo lo escribe solo `exportar.mjs` cada vez que exportas. No lo edites a mano:\n> cambia el `data-min` de la diapositiva en `presentacion.html` y vuelve a exportar.\n\n";
md += `**Total: ${fmt(total)} de ${MAXIMO}:00** (${principales.length} diapositivas + ${datos.length - principales.length} de respaldo). `;
md += total > MAXIMO ? `**Te pasas por ${fmt(total - MAXIMO)}.**\n\n` : `Quedan ${fmt(MAXIMO - total)} de holgura.\n\n`;
md += "## Por bloque\n\n| Bloque | Diapositivas | Minutos | Termina en |\n|---|---|---|---|\n";
for (const b of bloques) { acum += b.min; md += `| ${b.nombre} | ${b.desde === b.hasta ? b.desde : b.desde + "–" + b.hasta} (${b.cuantas}) | ${fmt(b.min)} | ${fmt(acum)} |\n`; }
md += "\n## Por diapositiva\n\n| N.º | Bloque | Tipo | Qué dice | Minutos | Pendiente |\n|---|---|---|---|---|---|\n";
for (const d of datos) md += `| ${d.respaldo ? "R" : d.n} | ${d.bloque} | ${d.tipo} | ${d.titulo.replace(/\|/g, "/")} | ${d.respaldo ? "—" : fmt(d.min)} | ${d.pendiente} |\n`;
await writeFile(path.join(AQUI, "REPARTO_DE_MINUTOS.md"), md, "utf8");

console.log(`Reparto: ${fmt(total)} de ${MAXIMO}:00 en ${principales.length} diapositivas. Detalle en REPARTO_DE_MINUTOS.md`);
if (total > MAXIMO) console.log("OJO: la suma de minutos se pasa de " + MAXIMO + ".");
const conFuera = datos.filter((d) => d.fuera.length);
for (const d of conFuera) console.log(`OJO: en la diapositiva ${d.n} algo se sale del margen: ${d.fuera.join(" / ")}`);
for (const a of [...new Set(avisos)]) console.log("OJO: " + a);
if (!conFuera.length && !avisos.length) console.log("Revisión automática: nada se sale de los márgenes y no faltan archivos.");
