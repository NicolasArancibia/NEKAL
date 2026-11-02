import { AppData, Item, dateInput, passive } from "../model";
import { timedItems } from "../espacio";
import { esOcurrencia } from "../estructura";
import { MESES } from "../rutinas";
import type { Turno } from "./tipos";

// Lo que Neka sabe en cada mensaje (spec D §3): ahora, jornada, mesas, grupos
// y las cosas de ayer a hoy+14 (más las pendientes sin fecha). Nunca adjuntos
// ni el contenido de notas e ideas.
const DIAS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];
const dos = (n: number) => String(n).padStart(2, "0");
// "AAAA-MM-DD HH:mm" en hora local: el formato que Neka lee y escribe.
export const fechaHora = (ms: number) => dateInput(new Date(ms).toISOString());
export const hora = (iso: string) => {
  const t = new Date(iso);
  return `${t.getHours()}:${dos(t.getMinutes())}`;
};
// "mar 7 may 10:00", para los textos del plan.
export function corto(iso: string): string {
  const t = new Date(iso);
  return `${DIAS[t.getDay()].slice(0, 3)} ${t.getDate()} ${MESES[t.getMonth()]} ${hora(iso)}`;
}

export function linea(d: AppData, i: Item): string {
  const mesa =
    d.workspaces.find((w) => w.id === i.workspaceId)?.name ?? "General";
  const grupo = d.groups.find((g) => g.id === i.groupId)?.name;
  const donde = grupo ? `${mesa} / ${grupo}` : mesa;
  if (passive(i)) return `- [${i.id}] ${i.type} «${i.title}» · ${donde}`;
  const cuando =
    [
      i.scheduledAt && `inicio ${dateInput(i.scheduledAt)}`,
      i.dueAt && `plazo ${dateInput(i.dueAt)}`,
    ]
      .filter(Boolean)
      .join(" · ") || "sin fecha";
  const prioridad = i.priority === "media" ? "" : ` · prioridad ${i.priority}`;
  return `- [${i.id}] ${i.type} «${i.title}» · ${cuando} · ${i.duration} min · ${i.flexible ? "flexible" : "fija"} · ${i.status}${prioridad} · ${donde}`;
}

export function enVentana(i: Item, now: number): boolean {
  const f = i.scheduledAt || i.dueAt;
  if (!f) return i.status !== "completado";
  const hoy = new Date(now);
  const desde = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 1);
  const hasta = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 15);
  const t = Date.parse(f);
  return t >= desde.getTime() && t < hasta.getTime();
}

const repeticion = (g: AppData["groups"][number]) =>
  g.repeat === "dias"
    ? `rutina de ${g.repeatDays.map((n) => DIAS[n]).join(", ")}`
    : `rutina ${g.repeat}`;

export function contexto(d: AppData, now: number): string {
  const t = new Date(now);
  const mesa = (id: string) =>
    d.workspaces.find((w) => w.id === id)?.name ?? "General";
  const grupos = d.groups
    .filter((g) => !esOcurrencia(d, g))
    .map(
      (g) =>
        `${g.name} [${g.id}] en ${mesa(g.workspaceId)}${g.repeat ? `, ${repeticion(g)}` : ""}`,
    );
  const cosas = timedItems(d)
    .filter((i) => enVentana(i, now))
    .sort((a, b) =>
      (a.scheduledAt || a.dueAt || "~").localeCompare(
        b.scheduledAt || b.dueAt || "~",
      ),
    )
    .map((i) => linea(d, i));
  return [
    `Ahora: ${DIAS[t.getDay()]} ${t.getDate()} ${MESES[t.getMonth()]} ${t.getFullYear()}, ${fechaHora(now)}. Jornada: de ${d.preferences.dayStart}:00 a ${d.preferences.dayEnd}:00.`,
    `Mesas: ${d.workspaces.map((w) => `${w.name} [${w.id}]`).join("; ")}`,
    `Grupos: ${grupos.join("; ") || "ninguno"}`,
    cosas.length
      ? "Cosas (id · tipo · «título» · cuándo · duración · fija/flexible · estado · mesa / grupo):"
      : "Cosas: ninguna entre ayer y dentro de 14 días.",
    ...cosas,
  ].join("\n");
}

// Últimos `n` mensajes como turnos; un plan se resume en una línea.
export function historial(d: AppData, n = 20): Turno[] {
  return d.messages
    .map((m) => ({
      deUsuario: m.isUser,
      texto: m.plan ? `[Plan · ${m.plan}: ${m.estado || "pendiente"}]` : m.text,
    }))
    .filter((t) => t.texto)
    .slice(-n);
}
