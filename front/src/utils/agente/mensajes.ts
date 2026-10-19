import { AppData, EstadoPlan, Message, uid } from "../model";

// Mensajes del chat de Neka (spec D §5.1 y §8). Sin extra tienen 3 claves; con
// extra (audio o plan), las 6 que exigen las reglas.
export function nuevoMensaje(
  text: string,
  isUser: boolean,
  extra?: { audio?: boolean; plan?: string; estado?: EstadoPlan },
): Message {
  const m = { id: uid(), text, isUser };
  return extra
    ? {
        ...m,
        audio: extra.audio ?? false,
        plan: extra.plan ?? "",
        estado: extra.estado ?? "",
      }
    : m;
}

export const agregar = (d: AppData, ...nuevos: Message[]): AppData => ({
  ...d,
  messages: [...d.messages, ...nuevos].slice(-100),
});

export const marcarPlan = (
  d: AppData,
  mensajeId: string,
  estado: EstadoPlan,
): AppData => ({
  ...d,
  messages: d.messages.map((m) => (m.id === mensajeId ? { ...m, estado } : m)),
});

// Un plan pendiente solo se puede abrir en la sesión que lo armó (vive en
// memoria): el de otra sesión o dispositivo ya no está disponible.
export type EstadoVisible = "pendiente" | "aceptado" | "descartado" | "vencido";
export function estadoVisible(
  m: Message,
  pendienteId: string | null,
): EstadoVisible {
  if (m.estado === "aceptado" || m.estado === "descartado") return m.estado;
  return m.id === pendienteId ? "pendiente" : "vencido";
}
