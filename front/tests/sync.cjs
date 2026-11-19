const assert = require("node:assert/strict");
const {
  emptyData,
  newItem,
  saveItem,
  totalPoints,
} = require("../.test-build/model");
const {
  recordsOf,
  dataOf,
  operation,
  mergeOperation,
  newEnvelope,
  validateRecords,
} = require("../.test-build/syncModel");
const { SyncEngine } = require("../.test-build/SyncEngine");
const { SyncConflict } = require("../.test-build/cloudSync");
const clone = (v) => JSON.parse(JSON.stringify(v));
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(fn) {
  for (let i = 0; i < 200; i++) {
    if (fn()) return;
    await delay(20);
  }
  throw Error("Sync timed out");
}
const a = saveItem(emptyData(), { ...newItem(), id: "a", title: "Original" });
const edit = (d, fields) => ({
  ...d,
  items: d.items.map((i) => ({ ...i, ...fields })),
});
assert.deepEqual(dataOf(recordsOf(a)), a);
// V2/B: posiciones viejas de la nube se leen como orden (y = 0).
{
  const viejo = recordsOf({
    ...a,
    items: [
      { ...a.items[0], id: "p", x: 300, y: 200 },
      { ...a.items[0], id: "q", x: 100, y: 200 },
    ],
  });
  assert.deepEqual(
    dataOf(viejo).items.map((i) => [i.id, i.x, i.y]),
    [
      ["p", 1, 0],
      ["q", 0, 0],
    ],
  );
}
// V2/B: un registro de grupo viejo (3 campos) se lee con los campos nuevos.
assert.deepEqual(
  dataOf({
    "workspaces/general": { id: "general", name: "General", color: "#7847EB" },
    "groups/g": { id: "g", name: "G", workspaceId: "general" },
  }).groups,
  [
    {
      id: "g",
      name: "G",
      workspaceId: "general",
      parentId: "",
      repeat: "",
      repeatDays: [],
      repeatStart: "",
    },
  ],
);
const local = edit(a, { title: "Local" }),
  remote = edit(a, { description: "Remote" });
const merged = mergeOperation(recordsOf(remote), operation(a, local));
assert.equal(merged.conflicts.length, 0);
assert.equal(dataOf(merged.records).items[0].title, "Local");
assert.equal(dataOf(merged.records).items[0].description, "Remote");
assert.deepEqual(
  mergeOperation(recordsOf(edit(a, { title: "Remote" })), operation(a, local))
    .conflicts,
  ["items/a"],
);
const completed = saveItem(a, { ...a.items[0], status: "completado" });
const duplicate = saveItem(a, { ...a.items[0], status: "completado" });
assert.equal(
  totalPoints(
    dataOf(
      mergeOperation(recordsOf(completed), operation(a, duplicate)).records,
    ),
  ),
  totalPoints(completed),
);
const deleted = { ...a, items: [] };
assert.deepEqual(
  mergeOperation(recordsOf(deleted), operation(a, local)).conflicts,
  ["items/a"],
);
// H5 (prueba real): una cuenta de antes de H3 no tiene settings/conexiones en
// la nube; el primer cambio (ofrecido, conectar) no es un conflicto.
{
  const nube = recordsOf(a);
  delete nube["settings/conexiones"];
  const conectado = {
    ...a,
    conexiones: { cuentas: [], ofrecido: true, destinos: [] },
  };
  const m = mergeOperation(nube, operation(dataOf(nube), conectado));
  assert.deepEqual(m.conflicts, []);
  assert.equal(dataOf(m.records).conexiones.ofrecido, true);
}
// Prueba real: dataOf reordena posiciones viejas (x) sin escribirlas en la
// nube; borrar ese ítem no es un conflicto (el orden no es contenido).
{
  const nube = recordsOf(a);
  nube["items/a"] = { ...nube["items/a"], x: 0 };
  const visto = { ...a, items: [{ ...a.items[0], x: 45 }] };
  const borrado = {
    ...visto,
    items: [{ ...visto.items[0], deletedAt: "2026-11-19T04:10:15.698Z" }],
  };
  const m = mergeOperation(nube, operation(visto, borrado));
  assert.deepEqual(m.conflicts, []);
  assert.equal(m.records["items/a"].deletedAt, "2026-11-19T04:10:15.698Z");
}
console.log(
  "OK sync: normalization, field merge, same-field conflict, duplicate rewards, deletion conflict, missing settings record, layout-only difference",
);
(async () => {
  let snapshot = { revision: 1, records: recordsOf(a) },
    online = false,
    saved,
    backups = 0,
    commits = 0,
    callbacks = [];
  const receipts = new Set();
  const remote = {
    initialize: async () => {
      if (!online) throw Error("offline");
    },
    read: async () => {
      if (!online) throw Error("offline");
      return clone(snapshot);
    },
    watch: (fn) => {
      callbacks.push(fn);
      return () => {
        callbacks = callbacks.filter((x) => x !== fn);
      };
    },
    commit: async (s, op) => {
      if (!online) throw Error("offline");
      if (receipts.has(op.id)) return "already";
      if (s.revision !== snapshot.revision) return "retry";
      const m = mergeOperation(snapshot.records, op);
      if (m.conflicts.length) throw new SyncConflict(m.conflicts);
      validateRecords(m.records);
      snapshot = { revision: snapshot.revision + 1, records: m.records };
      receipts.add(op.id);
      commits++;
      callbacks.forEach((fn) => fn());
      return "committed";
    },
  };
  let engine = new SyncEngine(
    { ...newEnvelope(a), base: a },
    remote,
    async (s) => {
      saved = clone(s);
    },
    () => {},
    async () => {
      backups++;
    },
  );
  try {
    engine.start();
    engine.change(local);
    await engine.flushLocal();
    assert.equal(saved.pending.length, 1);
    engine.stop();
    engine = new SyncEngine(
      saved,
      remote,
      async (s) => {
        saved = clone(s);
      },
      () => {},
      async () => {
        backups++;
      },
    );
    engine.start();
    online = true;
    engine.kick();
    await until(
      () =>
        engine.state.pending.length === 0 &&
        dataOf(snapshot.records).items[0].title === "Local",
    );
    assert.equal(commits, 1);
    console.log(
      "OK sync: offline edit, durable restart, reconnect, exactly-once delivery",
    );
    await until(() => !engine.running);
    snapshot = {
      revision: snapshot.revision + 1,
      records: recordsOf(
        edit(engine.state.base, { description: "Other device" }),
      ),
    };
    callbacks.forEach((fn) => fn());
    await until(
      () => engine.state.data.items[0].description === "Other device",
    );
    console.log("OK sync: realtime remote changes");
    await until(() => !engine.running);
    engine.change(edit(engine.state.data, { title: "Device A" }));
    snapshot = {
      revision: snapshot.revision + 1,
      records: recordsOf(edit(engine.state.base, { title: "Device B" })),
    };
    engine.kick();
    await until(() => engine.state.conflict && !engine.running);
    assert.equal(engine.state.data.items[0].title, "Device A");
    assert.equal(engine.state.base.items[0].title, "Device B");
    await engine.resolve("local");
    await until(() => !engine.state.pending.length && !engine.running);
    assert.equal(dataOf(snapshot.records).items[0].title, "Device A");
    assert.equal(backups, 1);
    console.log(
      "OK sync: both conflicting versions retained, explicit resolution backed up",
    );
  } finally {
    engine.stop();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
// V2/H3: cuentas conectadas como settings/conexiones, sin pases.
{
  const conCuentas = {
    ...emptyData(),
    conexiones: {
      cuentas: [
        {
          proveedor: "google",
          correo: "a@b.cl",
          nombre: "Sofía",
          desde: "2026-11-14T10:00:00.000Z",
        },
      ],
      ofrecido: true,
      destinos: ["google:a@b.cl"],
    },
  };
  const recs = recordsOf(conCuentas);
  assert.deepEqual(Object.keys(recs["settings/conexiones"]).sort(), [
    "cuentas",
    "destinos",
    "ofrecido",
  ]);
  assert.deepEqual(dataOf(recs).conexiones, conCuentas.conexiones);
  assert.deepEqual(validateRecords(recs).conexiones, conCuentas.conexiones);
  console.log("OK sync: conexiones va y vuelve");
}
// V2/H4: un ítem con origen (espejo) va y vuelve.
{
  const origen = {
    proveedor: "microsoft",
    cuenta: "a@b.cl",
    calendario: "cal1",
    idExterno: "AAMk1",
    version: "ck1",
    firma: "[]",
    creadoEn: "fuera",
    diaCompleto: true,
    soloLectura: false,
  };
  const conOrigen = saveItem(emptyData(), {
    ...newItem("general", "Evento"),
    id: "ext",
    title: "Clase",
    scheduledAt: new Date(2030, 4, 2, 0, 0).toISOString(),
    startDate: "2030-05-01",
    duration: 1440,
    origen,
  });
  const recs = recordsOf(conOrigen);
  assert.deepEqual(recs["items/ext"].origen, origen);
  assert.deepEqual(dataOf(recs).items[0].origen, origen);
  assert.deepEqual(validateRecords(recs).items[0].origen, origen);
  const malo = {
    ...recs,
    "items/ext": {
      ...recs["items/ext"],
      origen: { ...origen, proveedor: "yahoo" },
    },
  };
  assert.equal(validateRecords(malo).items[0].origen, undefined);
  console.log("OK sync: ítem con origen va y vuelve");
}
