import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppData } from "./model";
import { readBackup } from "./storage";
import {
  Envelope,
  newEnvelope,
  Operation,
  optimistic,
  readEnvelope,
} from "./syncModel";

// Immutable operation IDs avoid one browser tab overwriting another tab's outbox.
export function accountStorage(userId: string) {
  const prefix = `nekal:v2:${userId}:`,
    legacy = `nekal:v1:${userId}`;
  let previous = new Set<string>();
  return {
    async load(): Promise<Envelope> {
      const old = await AsyncStorage.getItem(legacy);
      const cached = await AsyncStorage.getItem(prefix + "cache");
      let state: Envelope = cached
        ? readEnvelope(cached)
        : newEnvelope(
            old ? readBackup(old) : (await import("./model")).emptyData(),
          );
      const keys = (await AsyncStorage.getAllKeys()).filter((k) =>
        k.startsWith(prefix + "outbox:"),
      );
      const pairs = await AsyncStorage.multiGet(keys);
      const pending: Operation[] = [];
      for (const [k, raw] of pairs) {
        if (!raw) continue;
        const op = JSON.parse(raw) as Operation;
        if (!(await AsyncStorage.getItem(prefix + "done:" + op.id)))
          pending.push(op);
      }
      pending.sort(
        (a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id),
      );
      previous = new Set(pending.map((p) => p.id));
      if (state.base) {
        try {
          const data = optimistic(
            state.base,
            pending,
            state.data.preferences.notifications,
          );
          readBackup(JSON.stringify(data));
          state = { ...state, data };
        } catch {
          /* Preserve the last intact view and the complete outbox. */
        }
      }
      return { ...state, pending, conflict: null };
    },
    async save(state: Envelope) {
      // Persist new operations before the UI snapshot and before acknowledging old ones.
      for (const op of state.pending) {
        if (!(await AsyncStorage.getItem(prefix + "done:" + op.id)))
          await AsyncStorage.setItem(
            prefix + "outbox:" + op.id,
            JSON.stringify(op),
          );
      }
      await AsyncStorage.setItem(prefix + "cache", JSON.stringify(state));
      const next = new Set(state.pending.map((p) => p.id));
      for (const id of previous)
        if (!next.has(id)) {
          await AsyncStorage.setItem(prefix + "done:" + id, "1");
          await AsyncStorage.removeItem(prefix + "outbox:" + id);
        }
      previous = next;
    },
    async backup(state: Envelope) {
      await AsyncStorage.setItem(
        prefix + "recovery:" + Date.now(),
        JSON.stringify(state),
      );
      await AsyncStorage.setItem(
        legacy + ":recovery",
        JSON.stringify(state.data),
      );
    },
  };
}
