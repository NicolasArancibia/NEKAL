const { spawnSync } = require("node:child_process");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const build = spawnSync(
  process.execPath,
  [
    path.join(root, "node_modules/typescript/bin/tsc"),
    "src/utils/model.ts",
    "src/utils/planner.ts",
    "src/utils/storage.ts",
    "src/utils/syncModel.ts",
    "src/utils/SyncEngine.ts",
    "src/utils/syncStorage.ts",
    "src/utils/neka.ts",
    "src/utils/syncBanner.ts",
    "src/utils/acomodo/proyeccion.ts",
    "src/utils/colores.ts",
    "src/utils/estructura.ts",
    "src/utils/espacio.ts",
    "src/utils/rutinas.ts",
    "src/utils/acomodo/tiempo.ts",
    "src/utils/acomodo/plano.ts",
    "--outDir",
    ".test-build",
    "--module",
    "commonjs",
    "--target",
    "es2022",
    "--esModuleInterop",
    "--skipLibCheck",
    "--ignoreConfig",
  ],
  { cwd: root, stdio: "inherit" },
);
if (build.status !== 0) process.exit(build.status || 1);
// El tema vive fuera de src/utils: compilarlo aparte para no cambiar la raíz de salida.
const theme = spawnSync(
  process.execPath,
  [
    path.join(root, "node_modules/typescript/bin/tsc"),
    "src/styles/theme.ts",
    "--outDir",
    ".test-build/styles",
    "--module",
    "commonjs",
    "--target",
    "es2022",
    "--esModuleInterop",
    "--skipLibCheck",
    "--ignoreConfig",
  ],
  { cwd: root, stdio: "inherit" },
);
if (theme.status !== 0) process.exit(theme.status || 1);
require("./rules.cjs");
require("./sync.cjs");
require("./outbox.cjs");
require("./theme.cjs");
require("./neka.cjs");
require("./syncBanner.cjs");
require("./acomodo.cjs");
require("./estructura.cjs");
require("./espacio.cjs");
require("./rutinas.cjs");
require("./styles.cjs");
