const fs = require("node:fs");
const assert = require("node:assert/strict");
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require("@firebase/rules-unit-testing");
const {
  doc,
  getDoc,
  getDocs,
  collection,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
  disableNetwork,
  enableNetwork,
} = require("firebase/firestore");
const { firestoreRemote, SyncConflict } = require("../.test-build/cloudSync");
const { recordsOf, dataOf, operation } = require("../.test-build/syncModel");
const { emptyData, newItem, saveItem } = require("../.test-build/model");
(async () => {
  const env = await initializeTestEnvironment({
    projectId: "demo-nekal-sync",
    firestore: {
      host: "127.0.0.1",
      port: 8080,
      rules: fs.readFileSync("../back/firestore.rules", "utf8"),
    },
  });
  try {
    const db = env.authenticatedContext("alice").firestore();
    const other = env.authenticatedContext("bob").firestore();
    const anon = env.unauthenticatedContext().firestore();
    const base = saveItem(emptyData(), {
      ...newItem(),
      id: "task",
      title: "Before migration",
    });
    await env.withSecurityRulesDisabled(async (c) =>
      setDoc(doc(c.firestore(), "users/alice/nekal/state"), {
        data: base,
        revision: 1,
        updatedAt: new Date().toISOString(),
      }),
    );
    const a = firestoreRemote(db, "alice");
    await a.initialize();
    await a.initialize();
    let snap = await a.read();
    assert.deepEqual(dataOf(snap.records), base);
    console.log("OK Firestore: resumable, idempotent legacy migration");
    await assertFails(getDoc(doc(other, "users/alice/items/task")));
    await assertFails(getDocs(collection(other, "users/alice/items")));
    await assertFails(getDoc(doc(anon, "users/alice/items/task")));
    await assertFails(
      setDoc(doc(other, "users/alice/settings/profile"), {
        value: { name: "x", roles: "" },
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(doc(db, "users/alice/nekal/state"), { revision: 2 }),
    );
    await assertFails(deleteDoc(doc(db, "users/alice/nekal/state")));
    await assertFails(
      updateDoc(doc(db, "users/alice/sync/meta"), {
        revision: 0,
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      setDoc(doc(db, "users/alice/settings/profile"), {
        value: { name: "x", roles: "" },
        updatedAt: serverTimestamp(),
      }),
    );
    console.log(
      "OK Firestore: anonymous/cross-account blocked, legacy frozen, revision lock required",
    );
    const next = { ...base, profile: { name: "Alice", roles: "Personal" } };
    const op = operation(base, next);
    assert.equal(await a.commit(snap, op), "committed");
    assert.equal(await a.commit(snap, op), "already");
    await assertFails(
      updateDoc(doc(db, "users/alice/operations/" + op.id), {
        at: serverTimestamp(),
      }),
    );
    await assertFails(deleteDoc(doc(db, "users/alice/operations/" + op.id)));
    snap = await a.read();
    assert.equal(dataOf(snap.records).profile.name, "Alice");
    async function invalid(path, value) {
      const b = writeBatch(db);
      b.update(doc(db, "users/alice/sync/meta"), {
        revision: snap.revision + 1,
        updatedAt: serverTimestamp(),
      });
      b.set(doc(db, "users/alice/" + path), {
        value,
        updatedAt: serverTimestamp(),
      });
      await assertFails(b.commit());
    }
    await invalid("settings/profile", { name: "x", roles: "", admin: true });
    await invalid("settings/profile", { name: "x" });
    await invalid("items/task", {
      ...snap.records["items/task"],
      steps: [{ id: "bad", title: "x", done: "yes" }],
    });
    await invalid("items/task", {
      ...snap.records["items/task"],
      steps: Array.from({ length: 51 }, (_, i) => ({
        id: String(i),
        title: "x",
        done: false,
      })),
    });
    await invalid("settings/preferences", {
      ...snap.records["settings/preferences"],
      dayStart: 25,
    });
    console.log(
      "OK Firestore: invalid creates/updates, unexpected fields and oversized lists blocked",
    );
    const db2 = env.authenticatedContext("alice").firestore();
    const b = firestoreRemote(db2, "alice");
    await b.initialize();
    const old = await b.read();
    const edit1 = {
      ...dataOf(snap.records),
      items: base.items.map((i) => ({ ...i, title: "Device A" })),
    };
    await a.commit(snap, operation(dataOf(snap.records), edit1));
    const edit2 = {
      ...dataOf(old.records),
      items: base.items.map((i) => ({ ...i, description: "Device B" })),
    };
    const op2 = operation(dataOf(old.records), edit2);
    assert.equal(await b.commit(old, op2), "retry");
    assert.equal(await b.commit(await b.read(), op2), "committed");
    const combined = dataOf((await a.read()).records);
    assert.equal(combined.items[0].title, "Device A");
    assert.equal(combined.items[0].description, "Device B");
    console.log(
      "OK Firestore: competing revisions retried; edits to different fields combined",
    );
    const current = await a.read();
    const badEdit = {
      ...base,
      items: base.items.map((i) => ({ ...i, title: "Stale title" })),
    };
    await assert.rejects(
      () => a.commit(current, operation(base, badEdit)),
      SyncConflict,
    );
    const rich = {
      ...combined,
      items: combined.items.map((i) => ({
        ...i,
        steps: Array.from({ length: 150 }, (_, i) => ({
          id: String(i),
          title: "Step " + i,
          done: false,
        })),
      })),
    };
    await a.commit(current, operation(combined, rich));
    assert.equal(dataOf((await b.read()).records).items[0].steps.length, 150);
    console.log(
      "OK Firestore: same-field conflict preserved; 150 individually validated steps accepted",
    );
    snap = await a.read();
    await invalid("steps/bad", {
      id: "bad",
      itemId: "task",
      order: 0,
      title: "Bad",
      done: "yes",
    });
    await invalid("rewardEntries/bad", {
      key: "bad",
      itemId: "task",
      order: 0,
      at: "now",
      reason: "x",
      points: -10,
    });
    const note = {
      ...newItem("general", "Nota"),
      id: "attachments",
      title: "Large account",
      attachments: Array.from({ length: 3 }, (_, i) => ({
        id: String(i),
        name: "file",
        mime: "text/plain",
        data: "data:text/plain;base64," + "A".repeat(460000),
      })),
    };
    const attached = saveItem(rich, note);
    await a.commit(snap, operation(rich, attached));
    assert.equal(
      dataOf((await b.read()).records).items.find((i) => i.id === "attachments")
        .attachments.length,
      3,
    );
    console.log(
      "OK Firestore: account larger than 1 MB, independent attachment documents",
    );
    // Interrupted migration with a real saved V1 fixture, if available (never prints contents).
    if (fs.existsSync("../tmp/private-backups/appdata-before-sync.json")) {
      const legacy = JSON.parse(
        fs.readFileSync("../tmp/private-backups/appdata-before-sync.json"),
      );
      await env.withSecurityRulesDisabled(async (c) => {
        await setDoc(doc(c.firestore(), "users/fixture/nekal/state"), {
          data: legacy,
          revision: 3,
          updatedAt: new Date().toISOString(),
        });
        await setDoc(doc(c.firestore(), "users/fixture/sync/meta"), {
          schema: 2,
          phase: "migrating",
          revision: 0,
          legacyRevision: 3,
          updatedAt: serverTimestamp(),
        });
      });
      const f = firestoreRemote(
        env.authenticatedContext("fixture").firestore(),
        "fixture",
      );
      await f.initialize();
      assert.deepEqual(
        recordsOf(dataOf((await f.read()).records)),
        recordsOf(legacy),
      );
      console.log(
        "OK Firestore: existing user data migrated without loss in emulator",
      );
    }
  } finally {
    await env.cleanup();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
