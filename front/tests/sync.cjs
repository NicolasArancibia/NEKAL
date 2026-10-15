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
console.log(
  "OK sync: normalization, field merge, same-field conflict, duplicate rewards, deletion conflict",
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
