const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"),
  path = require("node:path");
const front = path.resolve(__dirname, "..");
const files = (d) =>
  fs
    .readdirSync(d, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory()
        ? files(path.join(d, e.name))
        : /\.tsx?$/.test(e.name)
          ? [path.join(d, e.name)]
          : [],
    );
// Solo interfaz: utils/ queda fuera porque model.ts guarda colores de espacios como datos.
const ui = [
  path.join(front, "App.tsx"),
  ...["components", "pages", "navigation"].flatMap((d) =>
    files(path.join(front, "src", d)),
  ),
];
test("estilos: sin valores sueltos en la interfaz", () => {
  const bad = [];
  for (const f of ui) {
    const text = fs.readFileSync(f, "utf8");
    for (const [name, re] of [
      ["color", /#[0-9a-fA-F]{3,8}\b|rgba?\(/],
      ["fontSize", /fontSize\s*:\s*\d/],
      ["fontWeight", /fontWeight\s*:\s*["']?\d/],
    ])
      if (re.test(text)) bad.push(`${path.relative(front, f)}: ${name}`);
  }
  assert.deepEqual(bad, []);
});
test("estilos: nadie importa Common ni globalStyles", () => {
  const bad = ui.filter((f) =>
    /from ["'][^"']*(Common|globalStyles)["']/.test(fs.readFileSync(f, "utf8")),
  );
  assert.deepEqual(bad, []);
});
