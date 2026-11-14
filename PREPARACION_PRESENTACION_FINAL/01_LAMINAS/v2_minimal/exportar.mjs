// Exporta las dos láminas minimal a PDF (tamaño real de impresión) y PNG (vista previa).
// Uso: doble clic en exportar.bat, o desde esta carpeta:  node exportar.mjs
// Salida: salida/nekal-minimal-1.pdf, .png  y  salida/nekal-minimal-2.pdf, .png
//
// El tamaño se cambia en contenido.js (formato: ancho_cm y alto_cm), no aquí.
import { createRequire } from "node:module";
import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const aqui = path.dirname(fileURLToPath(import.meta.url));
// Usa el navegador de control ya instalado en 00_BASE/herramientas.
const require = createRequire(path.join(aqui, "../../00_BASE/herramientas/package.json"));
const { chromium } = require("playwright-core");

const salida = path.join(aqui, "salida");
await mkdir(salida, { recursive: true });

const navegador = await chromium.launch({ channel: "msedge" });
let problemas = 0;

for (const n of [1, 2]) {
  const pagina = await navegador.newPage({ viewport: { width: 1000, height: 1200 }, deviceScaleFactor: 2 });
  const errores = [];
  pagina.on("pageerror", (e) => errores.push(e.message));
  pagina.on("requestfailed", (r) => errores.push("no se pudo cargar: " + decodeURI(r.url())));
  await pagina.goto(pathToFileURL(path.join(aqui, `lamina-${n}.html`)).href, { waitUntil: "load" });
  await pagina.evaluate(() => document.fonts.ready);

  const datos = await pagina.evaluate(async () => {
    await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
    const lamina = document.getElementById("lamina");
    const cuerpo = lamina.querySelector(".cuerpo");
    const hijos = [...cuerpo.children];
    const usado = hijos.reduce((s, h) => s + h.getBoundingClientRect().height, 0);
    const estilo = getComputedStyle(cuerpo);
    const disponible = cuerpo.clientHeight - parseFloat(estilo.paddingTop) - parseFloat(estilo.paddingBottom);
    return {
      formato: window.NEKAL.formato,
      alto: lamina.offsetHeight,
      sobra: Math.round(disponible - usado),
      secciones: hijos.length,
      rotas: [...document.images].filter((i) => !i.naturalWidth).map((i) => i.getAttribute("src")),
      fuente: document.fonts.check('800 20px "Plus Jakarta Sans"'),
      faltas: document.querySelectorAll(".udd-falta").length,
      revisar: 0,
    };
  });

  const { ancho_cm, alto_cm } = datos.formato;
  console.log(`\nLámina ${n}  (${ancho_cm} × ${alto_cm} cm)`);
  if (errores.length) { problemas++; errores.forEach((e) => console.log("  ✗ " + e)); }
  if (datos.rotas.length) { problemas++; console.log("  ✗ Imágenes que no se encontraron: " + datos.rotas.join(", ")); }
  if (!datos.fuente) { problemas++; console.log("  ✗ No cargó la tipografía Plus Jakarta Sans."); }
  if (datos.sobra < 0) {
    problemas++;
    console.log(`  ✗ EL CONTENIDO NO CABE: sobran ${-datos.sobra} unidades de alto (${((-datos.sobra * ancho_cm) / 1000).toFixed(1)} cm). Acorta textos o agranda alto_cm.`);
  } else {
    const aire = datos.sobra / Math.max(1, datos.secciones - 1);
    console.log(`  ✓ Todo cabe. Espacio libre repartido entre secciones: ${datos.sobra} unidades (${((datos.sobra * ancho_cm) / 1000).toFixed(1)} cm).`);
    if (aire < 24) console.log("    Ojo: queda apretado; si agregas texto puede dejar de caber.");
    if (aire > 140) console.log("    Ojo: sobra mucho espacio; se pueden agrandar las pantallas o achicar alto_cm.");
  }
  if (datos.faltas) console.log("  Falta el logo UDD (logoUDD en contenido.js).");

  // PNG de vista previa (2000 px de ancho)
  await pagina.setViewportSize({ width: 1000, height: datos.alto });
  const png = path.join(salida, `nekal-minimal-${n}.png`);
  await pagina.locator("#lamina").screenshot({ path: png });

  // PDF en tamaño real: se agranda todo parejo hasta los centímetros pedidos.
  const zoom = ((ancho_cm / 2.54) * 96) / 1000;
  await pagina.addStyleTag({
    content: `@page { size: ${ancho_cm}cm ${alto_cm}cm; margin: 0 }
              html, body { background: #fff !important; overflow: hidden; height: ${alto_cm}cm }
              .lamina { zoom: ${zoom}; margin: 0 !important }`,
  });
  const pdf = path.join(salida, `nekal-minimal-${n}.pdf`);
  await pagina.pdf({ path: pdf, printBackground: true, preferCSSPageSize: true, pageRanges: "1" });
  const bytes = await readFile(pdf);
  console.log(`  → salida/${path.basename(png)}`);
  console.log(`  → salida/${path.basename(pdf)}  (${(bytes.length / 1048576).toFixed(1)} MB)`);
  await pagina.close();
}

await navegador.close();
console.log(problemas ? `\nTerminó con ${problemas} aviso(s). Revisa las líneas con ✗.` : "\nListo, sin problemas.");
