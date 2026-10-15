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
require("./rules.cjs");
require("./sync.cjs");
require("./outbox.cjs");
