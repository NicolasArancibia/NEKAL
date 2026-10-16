const { test } = require("node:test");
const assert = require("node:assert/strict");
const { color, type } = require("../.test-build/styles/theme.js");
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
test("tema: contraste de texto ≥ 4.5", () => {
  for (const [fg, bg] of [
    [color.ink, color.background],
    [color.inkSecondary, color.background],
    [color.inkSecondary, color.surface],
    [color.inkDone, color.background],
    [color.onPrimary, color.primary],
    [color.danger, color.dangerSoft],
    [color.primary, color.primarySoft],
    [color.primary, color.background],
  ])
    assert.ok(contrast(fg, bg) >= 4.5, `${fg} sobre ${bg}`);
});
test("tema: ningún estilo de texto bajo 11 px", () => {
  for (const v of Object.values(type)) assert.ok(v.size >= 11);
});
test("tema: bordes de controles ≥ 3:1 (WCAG 1.4.11)", () => {
  for (const bg of [color.surface, color.background])
    assert.ok(contrast(color.lineStrong, bg) >= 3, `lineStrong sobre ${bg}`);
});
