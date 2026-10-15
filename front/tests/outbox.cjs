const assert = require("node:assert/strict");
const Module = require("node:module");
const memory = new Map();
let failCache = false;
const storage = {
  getItem: async (k) => memory.get(k) ?? null,
  setItem: async (k, v) => {
    if (failCache && k.endsWith(":cache")) throw Error("quota");
    memory.set(k, v);
  },
  removeItem: async (k) => memory.delete(k),
  getAllKeys: async () => [...memory.keys()],
  multiGet: async (ks) => ks.map((k) => [k, memory.get(k) ?? null]),
};
const original = Module._load;
Module._load = function (name, ...args) {
  return name === "@react-native-async-storage/async-storage"
    ? storage
    : original.call(this, name, ...args);
};
const { accountStorage } = require("../.test-build/syncStorage");
Module._load = original;
const { emptyData } = require("../.test-build/model");
const { newEnvelope, operation } = require("../.test-build/syncModel");
(async () => {
  const base = emptyData(),
    a = accountStorage("a"),
    b = accountStorage("a");
  await a.load();
  await b.load();
  const first = { ...base, profile: { name: "A", roles: "" } },
    second = {
      ...base,
      messages: [{ id: "message", text: "B", isUser: true }],
    };
  const op1 = operation(base, first),
    op2 = operation(base, second);
  await a.save({ ...newEnvelope(first), base, pending: [op1] });
  await b.save({ ...newEnvelope(second), base, pending: [op2] });
  const recovered = await accountStorage("a").load();
  assert.equal(recovered.pending.length, 2);
  assert.equal(recovered.data.profile.name, "A");
  assert.equal(recovered.data.messages[0].text, "B");
  assert.equal((await accountStorage("other-user").load()).pending.length, 0);
  await a.save({ ...newEnvelope(first), base: first, pending: [] });
  const remaining = await accountStorage("a").load();
  assert.equal(remaining.pending.length, 1);
  assert.equal(remaining.pending[0].id, op2.id);
  assert.equal(
    [...memory.keys()].filter((k) => k.includes("outbox:")).length,
    1,
  );
  failCache = true;
  const third = { ...second, profile: { name: "Durable", roles: "" } },
    op3 = operation(second, third);
  await assert.rejects(() =>
    b.save({ ...newEnvelope(third), base, pending: [op2, op3] }),
  );
  failCache = false;
  assert.ok(
    (await accountStorage("a").load()).pending.some((p) => p.id === op3.id),
  );
  console.log(
    "OK outbox: parallel tabs, account isolation, acknowledgements, quota interruption recovery",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
