import type { Item } from "../model";

// Traduce eventos de Google Calendar y Microsoft Graph ↔ Nekal (spec H3 §7). Puro.
export type EventoFuera = {
  id: string;
  calendario: string;
  titulo: string;
  inicio: string; // ISO
  minutos: number;
  diaCompleto: boolean;
  lugar: string;
  descripcion: string;
  version: string;
  actualizado: string; // ISO
  soloLectura: boolean;
  cancelado: boolean;
};

export const VENTANA = { atras: 14, adelante: 60 };

const dosDigitos = (n: number) => String(n).padStart(2, "0");
const diaLocal = (t: Date) =>
  `${t.getFullYear()}-${dosDigitos(t.getMonth() + 1)}-${dosDigitos(t.getDate())}`;
// «2026-11-21» → 00:00 local de ese día.
const medianocheDe = (fecha: string) => {
  const [a, m, d] = fecha.slice(0, 10).split("-").map(Number);
  return new Date(a, m - 1, d);
};
const sumarDias = (fecha: string, n: number) => {
  const t = medianocheDe(fecha);
  t.setDate(t.getDate() + n);
  return diaLocal(t);
};

export function limitesVentana(ahora: number): {
  desde: string;
  hasta: string;
} {
  const hoy = new Date(ahora);
  const desde = new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    hoy.getDate() - VENTANA.atras,
  );
  const hasta = new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    hoy.getDate() + VENTANA.adelante,
  );
  return { desde: desde.toISOString(), hasta: hasta.toISOString() };
}

const iso = (v: unknown) => {
  const t = typeof v === "string" ? Date.parse(v) : NaN;
  return Number.isFinite(t) ? new Date(t).toISOString() : "";
};
const minutosEntre = (a: Date, b: Date) =>
  Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000));

export function desdeGoogle(
  e: any,
  calendario: string,
  soloLectura: boolean,
): EventoFuera | null {
  const diaCompleto = !e?.start?.dateTime && !!e?.start?.date;
  const ini = diaCompleto
    ? medianocheDe(e.start.date)
    : new Date(Date.parse(e?.start?.dateTime ?? ""));
  if (!Number.isFinite(ini.getTime())) return null;
  const fin = diaCompleto
    ? medianocheDe(e.end?.date ?? sumarDias(e.start.date, 1))
    : new Date(Date.parse(e?.end?.dateTime ?? "") || ini.getTime());
  return {
    id: String(e.id),
    calendario,
    titulo: e.summary ?? "",
    inicio: ini.toISOString(),
    minutos: minutosEntre(ini, fin),
    diaCompleto,
    lugar: e.location ?? "",
    descripcion: e.description ?? "",
    version: e.etag ?? "",
    actualizado: iso(e.updated),
    soloLectura,
    cancelado: e.status === "cancelled",
  };
}

// Con `Prefer: outlook.timezone="UTC"` Graph manda la hora UTC sin «Z» y con 7 decimales.
const utcDeGraph = (v: string) => new Date(`${v.slice(0, 23)}Z`);

export function desdeGraph(
  e: any,
  calendario: string,
  soloLectura: boolean,
): EventoFuera | null {
  const crudoIni = e?.start?.dateTime;
  if (typeof crudoIni !== "string") return null;
  const diaCompleto = e.isAllDay === true;
  const ini = diaCompleto ? medianocheDe(crudoIni) : utcDeGraph(crudoIni);
  if (!Number.isFinite(ini.getTime())) return null;
  const crudoFin =
    typeof e.end?.dateTime === "string" ? e.end.dateTime : crudoIni;
  const fin = diaCompleto ? medianocheDe(crudoFin) : utcDeGraph(crudoFin);
  return {
    id: String(e.id),
    calendario,
    titulo: e.subject ?? "",
    inicio: ini.toISOString(),
    minutos: minutosEntre(ini, fin),
    diaCompleto,
    lugar: e.location?.displayName ?? "",
    descripcion: e.bodyPreview ?? "",
    version: e.changeKey ?? "",
    actualizado: iso(e.lastModifiedDateTime),
    soloLectura,
    cancelado: e.isCancelled === true,
  };
}

export function firmaDe(f: {
  title: string;
  scheduledAt: string;
  duration: number;
  location: string;
  diaCompleto: boolean;
}): string {
  return JSON.stringify([
    f.title,
    f.scheduledAt,
    f.duration,
    f.location,
    f.diaCompleto,
  ]);
}

export function camposDeEvento(
  e: EventoFuera,
): Pick<
  Item,
  | "title"
  | "scheduledAt"
  | "duration"
  | "location"
  | "description"
  | "startDate"
> {
  return {
    title: e.titulo.trim().slice(0, 160) || "(Sin título)",
    scheduledAt: e.inicio,
    duration: e.diaCompleto ? 1440 : Math.min(1440, Math.max(5, e.minutos)),
    location: e.lugar.slice(0, 100000),
    description: e.descripcion.slice(0, 100000),
    startDate: diaLocal(new Date(e.inicio)),
  };
}

type Espejable = Pick<
  Item,
  "title" | "scheduledAt" | "duration" | "location"
> & {
  origen?: { diaCompleto?: boolean };
};
const finDe = (i: Espejable) =>
  new Date(Date.parse(i.scheduledAt) + i.duration * 60000).toISOString();

export function cuerpoGoogle(i: Espejable): object {
  if (i.origen?.diaCompleto) {
    const dia = diaLocal(new Date(i.scheduledAt));
    const dias = Math.max(1, Math.round(i.duration / 1440));
    return {
      summary: i.title,
      location: i.location,
      start: { date: dia },
      end: { date: sumarDias(dia, dias) },
    };
  }
  return {
    summary: i.title,
    location: i.location,
    start: { dateTime: i.scheduledAt },
    end: { dateTime: finDe(i) },
  };
}

export function cuerpoGraph(i: Espejable, zona: string): object {
  if (i.origen?.diaCompleto) {
    const dia = diaLocal(new Date(i.scheduledAt));
    const dias = Math.max(1, Math.round(i.duration / 1440));
    return {
      subject: i.title,
      location: { displayName: i.location },
      start: { dateTime: `${dia}T00:00:00`, timeZone: zona },
      end: { dateTime: `${sumarDias(dia, dias)}T00:00:00`, timeZone: zona },
      isAllDay: true,
    };
  }
  return {
    subject: i.title,
    location: { displayName: i.location },
    start: { dateTime: i.scheduledAt.slice(0, 23), timeZone: "UTC" },
    end: { dateTime: finDe(i).slice(0, 23), timeZone: "UTC" },
    isAllDay: false,
  };
}
