import {
  collection,
  doc,
  Firestore,
  getDocFromServer,
  getDocsFromServer,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { emptyData } from "./model";
import { CLOUD_COLLECTIONS, toCloud, fromCloud } from "./cloudRecords";
import { readBackup } from "./storage";
import {
  COLLECTIONS,
  diff,
  Operation,
  Records,
  recordsOf,
  validateRecords,
  mergeOperation,
} from "./syncModel";

export type CloudSnapshot = { revision: number; records: Records };
export interface SyncRemote {
  initialize(): Promise<void>;
  read(): Promise<CloudSnapshot>;
  commit(
    snapshot: CloudSnapshot,
    op: Operation,
  ): Promise<"committed" | "already" | "retry">;
  watch(change: () => void, error: (error: unknown) => void): () => void;
}
export class SyncConflict extends Error {
  constructor(
    public paths: string[],
    message = "Hay cambios simultáneos que necesitan revisión.",
  ) {
    super(message);
  }
}
export function firestoreRemote(db: Firestore, userId: string): SyncRemote {
  const root = `users/${userId}`,
    meta = doc(db, root, "sync", "meta"),
    legacy = doc(db, root, "nekal", "state");
  const ref = (path: string) => doc(db, `${root}/${path}`);
  let cached: CloudSnapshot | undefined;
  return {
    async initialize() {
      // The marker freezes legacy writes. Its original document remains as a backup.
      await runTransaction(db, async (tx) => {
        const m = await tx.get(meta);
        if (m.exists()) return;
        const old = await tx.get(legacy);
        if (old.exists()) readBackup(JSON.stringify(old.data().data));
        tx.set(meta, {
          schema: 2,
          phase: "migrating",
          revision: 0,
          legacyRevision: old.exists() ? old.data().revision : 0,
          updatedAt: serverTimestamp(),
        });
      });
      const marker = await getDocFromServer(meta);
      if (marker.data()?.phase === "ready") return;
      const old = await getDocFromServer(legacy);
      const source = old.exists()
        ? readBackup(JSON.stringify(old.data().data))
        : emptyData();
      const entries = Object.entries(toCloud(recordsOf(source)));
      // Resume safely after interruption; only absent documents are created.
      for (let start = 0; start < entries.length; start += 150) {
        const chunk = entries.slice(start, start + 150);
        await runTransaction(db, async (tx) => {
          const m = await tx.get(meta);
          if (m.data()?.phase === "ready") return;
          const existing = await Promise.all(
            chunk.map(([p]) => tx.get(ref(p))),
          );
          chunk.forEach(([p, value], i) => {
            if (!existing[i].exists())
              tx.set(ref(p), { value, updatedAt: serverTimestamp() });
          });
        });
      }
      await runTransaction(db, async (tx) => {
        const m = await tx.get(meta);
        if (m.data()?.phase !== "ready")
          tx.update(meta, {
            phase: "ready",
            revision: 1,
            updatedAt: serverTimestamp(),
          });
      });
    },
    async read() {
      // Recheck the revision to avoid exposing a mixture of two atomic commits.
      for (let attempt = 0; attempt < 6; attempt++) {
        const before = await getDocFromServer(meta);
        if (before.data()?.phase !== "ready")
          throw new Error("La migración todavía está en curso.");
        if (cached && cached.revision === before.data()!.revision)
          return cached;
        const snapshots = await Promise.all(
          CLOUD_COLLECTIONS.map((name) =>
            getDocsFromServer(collection(db, root, name)),
          ),
        );
        const after = await getDocFromServer(meta);
        if (before.data()!.revision !== after.data()!.revision) continue;
        const physical: Records = {};
        snapshots.forEach((snap, i) =>
          snap.forEach((d) => {
            physical[`${CLOUD_COLLECTIONS[i]}/${d.id}`] = d.data().value;
          }),
        );
        const records = fromCloud(physical);
        validateRecords(records);
        cached = { revision: after.data()!.revision, records };
        return cached;
      }
      throw new Error(
        "Llegaron nuevos cambios. Reintentando la sincronización.",
      );
    },
    async commit(snapshot, op) {
      const receipt = doc(db, root, "operations", op.id);
      return runTransaction(db, async (tx) => {
        const [m, ack] = await Promise.all([tx.get(meta), tx.get(receipt)]);
        if (ack.exists()) return "already";
        if (m.data()?.revision !== snapshot.revision) return "retry";
        const result = mergeOperation(snapshot.records, op);
        if (result.conflicts.length) throw new SyncConflict(result.conflicts);
        try {
          validateRecords(result.records);
        } catch (e) {
          throw new SyncConflict(
            op.edits.map((e) => e.path),
            "La combinación no respeta las dependencias o el modelo: " +
              (e as Error).message,
          );
        }
        const edits = diff(toCloud(snapshot.records), toCloud(result.records));
        if (edits.length > 400)
          throw new Error("Demasiados documentos en una sola operación.");
        for (const edit of edits) {
          if (edit.after === null) tx.delete(ref(edit.path));
          else
            tx.set(ref(edit.path), {
              value: edit.after,
              updatedAt: serverTimestamp(),
            });
        }
        tx.set(receipt, { at: serverTimestamp() });
        tx.update(meta, {
          revision: snapshot.revision + 1,
          updatedAt: serverTimestamp(),
        });
        return "committed";
      });
    },
    watch(change, error) {
      return onSnapshot(
        meta,
        { includeMetadataChanges: true },
        (snap) => {
          if (!snap.metadata.fromCache) change();
        },
        error,
      );
    },
  };
}
