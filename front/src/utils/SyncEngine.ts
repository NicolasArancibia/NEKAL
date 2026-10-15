import { AppData, emptyData } from "./model";
import { readBackup } from "./storage";
import {
  Conflict,
  Envelope,
  newEnvelope,
  operation,
  optimistic,
  recordsOf,
  validateRecords,
  dataOf,
  diff,
} from "./syncModel";
import { SyncRemote, SyncConflict } from "./cloudSync";
import { toCloud } from "./cloudRecords";

export type SyncView = {
  data: AppData;
  pending: number;
  conflict: Conflict | null;
  status: string;
  error: string;
};
export class SyncEngine {
  private closed = false;
  private running = false;
  private resolving = false;
  private again = false;
  private initialized = false;
  private persistence: Promise<void> = Promise.resolve();
  private durable = true;
  private unsubscribe: (() => void) | undefined;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private failures = 0;
  private status = "Conectando con Firebase…";
  private error = "";
  constructor(
    public state: Envelope,
    private remote: SyncRemote,
    private save: (e: Envelope) => Promise<void>,
    private emit: (v: SyncView) => void,
    private backup: (e: Envelope) => Promise<void>,
  ) {}
  private notify() {
    if (!this.closed)
      this.emit({
        data: this.state.data,
        pending: this.state.pending.length,
        conflict: this.state.conflict,
        status: this.status,
        error: this.error,
      });
  }
  private persist() {
    const snapshot = JSON.parse(JSON.stringify(this.state)) as Envelope;
    this.persistence = this.persistence
      .catch(() => {})
      .then(() => this.save(snapshot))
      .then(() => {
        this.durable = true;
      })
      .catch((e) => {
        this.durable = false;
        this.error =
          "No se pudo guardar en este dispositivo. Conserva la app abierta y exporta un respaldo.";
        this.status = "Cambios sin guardar";
        this.notify();
        throw e;
      });
    // Avoid unhandled rejections when change() schedules a write.
    void this.persistence.catch(() => {});
    return this.persistence;
  }
  start() {
    this.notify();
    this.unsubscribe = this.remote.watch(
      () => this.kick(),
      () => this.kick(),
    );
    this.kick();
  }
  stop() {
    this.closed = true;
    this.unsubscribe?.();
    if (this.timer) clearTimeout(this.timer);
  }
  flushLocal() {
    return this.persistence;
  }
  change(next: AppData) {
    if (this.closed) throw new Error("La sesión cambió.");
    if (this.resolving)
      throw new Error("Espera a que se guarde la resolución del conflicto.");
    readBackup(JSON.stringify(next));
    validateRecords(recordsOf(next));
    if (
      diff(toCloud(recordsOf(this.state.data)), toCloud(recordsOf(next)))
        .length > 400
    )
      throw new Error(
        "Este cambio afecta más de 400 documentos. Divide la operación en bloques menores; los datos actuales no se han modificado.",
      );
    const op = operation(this.state.data, next);
    this.state = {
      ...this.state,
      data: next,
      pending: op ? [...this.state.pending, op] : this.state.pending,
    };
    this.status = op ? "Guardando cambios…" : this.status;
    this.error = "";
    this.notify();
    void this.persist()
      .then(() => this.kick())
      .catch(() => {});
  }
  kick() {
    if (this.closed) return;
    if (this.timer) clearTimeout(this.timer);
    if (this.running) {
      this.again = true;
      return;
    }
    this.timer = setTimeout(() => {
      void this.run();
    }, 300);
  }
  retry() {
    void this.persist()
      .then(() => this.kick())
      .catch(() => {});
  }
  private async run() {
    if (this.closed || this.running) return;
    this.running = true;
    this.again = false;
    try {
      await this.persistence;
      if (this.closed || !this.durable) return;
      this.status = "Sincronizando…";
      this.notify();
      if (!this.initialized) {
        await this.remote.initialize();
        this.initialized = true;
      }
      if (this.closed) return;
      let snapshot = await this.remote.read();
      if (this.closed) return;
      const remoteData = dataOf(
        snapshot.records,
        this.state.data.preferences.notifications,
      );
      if (!this.state.base) {
        // Unknown V1 baseline: preserve local-only data, flag competing copies instead of guessing.
        const seed = operation(emptyData(), this.state.data);
        this.state = {
          ...this.state,
          base: remoteData,
          pending: seed ? [seed] : [],
          conflict: null,
        };
        await this.persist();
      }
      let passes = 0;
      while (this.state.pending.length && !this.closed && passes++ < 30) {
        await this.persistence;
        if (this.closed || !this.durable) return;
        const op = this.state.pending[0];
        try {
          const outcome = await this.remote.commit(snapshot, op);
          if (this.closed) return;
          if (outcome !== "retry") {
            this.state = {
              ...this.state,
              pending: this.state.pending.filter((p) => p.id !== op.id),
              conflict: null,
            };
            // Persist acknowledgement before reading the new remote snapshot.
            // Receipts make retries safe if the app closes before this write finishes.
            await this.persist();
          }
          snapshot = await this.remote.read();
          if (this.closed) return;
        } catch (e) {
          if (!(e instanceof SyncConflict)) throw e;
          this.state = {
            ...this.state,
            conflict: { operationId: op.id, paths: e.paths, reason: e.message },
          };
          break;
        }
      }
      const base = dataOf(
        snapshot.records,
        this.state.data.preferences.notifications,
      );
      let data = this.state.data;
      try {
        data = optimistic(
          base,
          this.state.pending,
          data.preferences.notifications,
        );
        readBackup(JSON.stringify(data));
      } catch {
        /* Keep the complete local view until the conflict is resolved. */
      }
      this.state = { ...this.state, base, data };
      await this.persist();
      this.failures = 0;
      this.error = "";
      this.status = this.state.conflict
        ? "Revisión necesaria: ambas versiones están conservadas"
        : this.state.pending.length
          ? "Cambios pendientes de sincronizar"
          : "Sincronizado automáticamente";
      this.notify();
      if (this.state.pending.length && !this.state.conflict) this.again = true;
    } catch (e) {
      if (this.closed) return;
      this.error = (e as Error).message || "No se pudo conectar con Firebase.";
      this.status = this.durable
        ? "Sin conexión o sincronización pendiente · cambios conservados en este dispositivo"
        : "Cambios sin guardar";
      this.failures++;
      this.notify();
    } finally {
      this.running = false;
      if (!this.closed) {
        const delay = this.again
          ? 300
          : this.failures
            ? Math.min(60000, 2000 * 2 ** Math.min(this.failures, 5))
            : 30000;
        this.timer = setTimeout(() => {
          void this.run();
        }, delay);
      }
    }
  }
  async resolve(choice: "local" | "remote") {
    if (this.running)
      throw new Error(
        "Espera a que termine la sincronización y vuelve a intentar.",
      );
    if (!this.state.conflict || !this.state.base) return;
    this.running = true;
    if (this.timer) clearTimeout(this.timer);
    this.resolving = true;
    try {
      await this.persistence;
      await this.backup(this.state);
      const base = this.state.base,
        notifications = this.state.data.preferences.notifications;
      // Explicit choice applies only the local field changes over the newest known remote data.
      let next =
        choice === "remote"
          ? { ...base, preferences: { ...base.preferences, notifications } }
          : optimistic(base, this.state.pending, notifications);
      readBackup(JSON.stringify(next));
      const op = operation(base, next);
      this.state = {
        version: 2,
        base,
        data: next,
        pending: op ? [op] : [],
        conflict: null,
      };
      await this.persist();
      this.status = "Resolución guardada; sincronizando…";
      this.notify();
    } finally {
      this.resolving = false;
      this.running = false;
      this.kick();
    }
  }
}
