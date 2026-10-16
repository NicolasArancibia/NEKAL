// Aviso de sincronización: solo aparece cuando hay un problema (spec A, sección 5).
export type SyncInput = {
  error: string;
  hasConflict: boolean;
  cloudStatus: string;
  pendingChanges: number;
};
export type SyncBannerState = {
  tone: "danger" | "neutral";
  text: string;
  action?: { label: string; target: "retry" | "perfil" | "ajustes" };
};

export function syncBannerFor({
  error,
  hasConflict,
  cloudStatus,
  pendingChanges,
}: SyncInput): SyncBannerState | null {
  // SyncEngine fija error y estado a la vez al perder conexión: el estado
  // describe mejor la situación, así que va primero.
  if (cloudStatus.startsWith("Sin conexión"))
    return {
      tone: "neutral",
      text: pendingChanges
        ? `Sin conexión · ${pendingChanges} ${pendingChanges === 1 ? "cambio guardado" : "cambios guardados"} en este dispositivo`
        : "Sin conexión",
    };
  if (cloudStatus === "Cambios sin guardar")
    return {
      tone: "danger",
      text: "Cambios sin guardar. Exporta un respaldo.",
      action: { label: "Ajustes", target: "ajustes" },
    };
  if (error)
    return {
      tone: "danger",
      text: "No se pudo guardar.",
      action: { label: "Reintentar", target: "retry" },
    };
  if (hasConflict)
    return {
      tone: "danger",
      text: "Hay cambios en conflicto.",
      action: { label: "Revisar", target: "perfil" },
    };
  return null;
}
