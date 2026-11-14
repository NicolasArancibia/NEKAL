// Saca pantallazos reales de Nekal en modo invitado con los datos de ejemplo.
// No toca ninguna cuenta: cada corrida parte de un navegador limpio.
//
// Antes: tener la app corriendo en http://localhost:8082
//   (desde la raíz: npm --prefix front run web -- --port 8082)
// Uso, desde esta carpeta:  node capturar.mjs
// Salida: ../pantallas/*.png  (1170 × 2532 px, tamaño iPhone a 3x)
import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";

const URL = process.env.NEKAL_URL ?? "http://localhost:8082";
const SALIDA = new URL_("../pantallas/");
function URL_(rel) {
  return new globalThis.URL(rel, import.meta.url);
}

const navegador = await chromium.launch({ channel: "msedge" });
const contexto = await navegador.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  locale: "es-CL",
});
const pagina = await contexto.newPage();
await mkdir(SALIDA, { recursive: true });

const foto = async (nombre) => {
  await pagina.waitForTimeout(900); // deja terminar las animaciones
  await pagina.screenshot({ path: new globalThis.URL(`${nombre}.png`, SALIDA).pathname.slice(1) });
  console.log("listo:", nombre);
};
const pestana = (nombre) => pagina.getByRole("tab", { name: nombre }).click();
const siExiste = async (localizador, accion) => {
  if (await localizador.first().isVisible().catch(() => false)) await accion(localizador.first());
};

await pagina.goto(URL, { waitUntil: "networkidle" });
await foto("01-bienvenida");

await pagina.getByRole("button", { name: "Continuar como invitado" }).click();
await pagina.waitForFunction(() => typeof globalThis.nekalDemo === "function");
await pagina.evaluate(() => globalThis.nekalDemo());
await pagina.waitForTimeout(1500);

// Al cargar los datos salta el aviso de logros nuevos.
await siExiste(pagina.getByRole("button", { name: "Genial" }), async (b) => {
  await foto("02-logro-nuevo");
  await b.click();
});

await foto("03-resumen");
await pagina.mouse.wheel(0, 700);
await foto("04-resumen-tus-dias");

await pestana("Calendario");
await foto("05-calendario-mes");
await siExiste(pagina.getByText("Agenda", { exact: true }), async (b) => {
  await b.click();
  await foto("06-calendario-agenda");
});

await pestana("Espacio");
await foto("07-espacio-circulo");

await pestana("Chat con Neka");
await foto("08-neka-chat");

await pestana("Perfil");
await foto("09-perfil");

await navegador.close();
