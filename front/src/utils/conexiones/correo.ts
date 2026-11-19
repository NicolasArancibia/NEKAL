import type { CorreoCompleto, CorreoResumen, Persona } from "./tipos";

// Correos de Gmail y de Graph (spec H3 §6.4). Puro: no habla con la red.
// Se muestran como texto plano: sin HTML, imágenes remotas ni píxeles de rastreo.

function bytesDeBase64(b64: string): Uint8Array {
  const limpio = b64.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, "");
  const bin = atob(limpio + "=".repeat((4 - (limpio.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function base64DeBytes(b: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < b.length; i += 0x8000)
    bin += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(bin);
}

const base64Utf8 = (s: string) => base64DeBytes(new TextEncoder().encode(s));

function decodificar(b: Uint8Array, charset = "utf-8"): string {
  try {
    return new TextDecoder(charset.trim() || "utf-8").decode(b);
  } catch {
    return new TextDecoder("utf-8").decode(b);
  }
}

// «Q» de RFC 2047: `_` es espacio y `=XX` es un byte.
function bytesDeQ(t: string): Uint8Array {
  const out: number[] = [];
  const s = t.replace(/_/g, " ");
  for (let i = 0; i < s.length; i++) {
    const hex = s.slice(i + 1, i + 3);
    if (s[i] === "=" && /^[0-9A-Fa-f]{2}$/.test(hex)) {
      out.push(parseInt(hex, 16));
      i += 2;
    } else out.push(s.charCodeAt(i) & 0xff);
  }
  return new Uint8Array(out);
}

const PALABRA = /=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g;

// Cabeceras con tildes o emoji (RFC 2047), en UTF-8, ISO-8859-1, etc.
export function decodificarCabecera(s: string): string {
  return (s ?? "")
    .replace(/(=\?[^?]+\?[BbQq]\?[^?]*\?=)\s+(?==\?)/g, "$1")
    .replace(PALABRA, (_, charset: string, tipo: string, txt: string) =>
      decodificar(
        tipo.toUpperCase() === "B" ? bytesDeBase64(txt) : bytesDeQ(txt),
        charset,
      ),
    );
}

const ENTIDADES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function entidades(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] !== "#") return ENTIDADES[e.toLowerCase()] ?? m;
    const n =
      e[1].toLowerCase() === "x"
        ? parseInt(e.slice(2), 16)
        : Number(e.slice(1));
    if (n === 160) return " ";
    return n > 0 && n < 0x110000 ? String.fromCodePoint(n) : m;
  });
}

const ordenarLineas = (s: string) =>
  s
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export function htmlATexto(html: string): string {
  const sinTags = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(style|script|head|title)\b[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/\r\n?|\n/g, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h[1-6]|table|ul|ol|blockquote)\s*>/gi, "\n\n")
    .replace(/<\/(div|li|tr)\s*>/gi, "\n")
    .replace(/<\/t[dh]\s*>/gi, " ")
    .replace(/<[^>]*>/g, "");
  return ordenarLineas(entidades(sinTags));
}

// Texto plano → HTML mínimo (para el `comment` de Graph, que se lee como HTML).
export const htmlDeTexto = (texto: string) =>
  texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\r?\n/g, "<br>");

export function persona(cabecera: string): Persona {
  // Varias direcciones: queda la primera.
  const s = decodificarCabecera(cabecera ?? "")
    .trim()
    .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)(?=[^<>]*(?:<|$))/)[0]
    .trim();
  const m = s.match(/^(.*?)\s*<([^<>]+)>\s*$/);
  const correo = (m ? m[2] : s).trim();
  const nombre = (m ? m[1] : "")
    .trim()
    .replace(/^"(.*)"$/, "$1")
    .trim();
  return { nombre: nombre || correo, correo };
}

const isoDe = (ms: number) =>
  new Date(Number.isFinite(ms) && ms > 0 ? ms : 0).toISOString();

type Parte = {
  mimeType?: string;
  filename?: string;
  headers?: { name?: string; value?: string }[];
  body?: { data?: string };
  parts?: Parte[];
};

const cabecera = (p: Parte | undefined, nombre: string) =>
  p?.headers?.find((h) => h.name?.toLowerCase() === nombre.toLowerCase())
    ?.value ?? "";

function hojas(p: Parte): Parte[] {
  return p.parts?.length ? p.parts.flatMap(hojas) : [p];
}

// Gmail suele entregar el cuerpo ya en UTF-8 aunque la cabecera diga otro
// charset (pasa con lo que manda Outlook): si es UTF-8 válido, se lee así.
function cuerpo(p: Parte): string {
  const bytes = bytesDeBase64(p.body?.data ?? "");
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    const charset = cabecera(p, "Content-Type").match(
      /charset="?([^";\s]+)"?/i,
    )?.[1];
    return decodificar(bytes, charset);
  }
}

export function desdeGmail(m: any, cuenta: string): CorreoResumen | null {
  if (!m?.id || !m.payload) return null;
  const p = m.payload as Parte;
  const interna = Number(m.internalDate);
  return {
    id: String(m.id),
    proveedor: "google",
    cuenta,
    hilo: String(m.threadId ?? m.id),
    de: persona(cabecera(p, "From")),
    asunto: decodificarCabecera(cabecera(p, "Subject")),
    fecha: isoDe(interna > 0 ? interna : Date.parse(cabecera(p, "Date"))),
    extracto: entidades(String(m.snippet ?? "")).trim(),
    leido: !(m.labelIds ?? []).includes("UNREAD"),
  };
}

export function desdeGmailCompleto(
  m: any,
  cuenta: string,
): CorreoCompleto | null {
  const r = desdeGmail(m, cuenta);
  if (!r) return null;
  const p = m.payload as Parte;
  // Los adjuntos (con nombre de archivo) no son el cuerpo.
  const partes = hojas(p).filter((x) => !x.filename && x.body?.data);
  const de = (tipo: string) =>
    partes.find((x) => (x.mimeType ?? "").toLowerCase() === tipo);
  const plano = de("text/plain");
  const html = de("text/html");
  const responder = cabecera(p, "Reply-To");
  return {
    ...r,
    texto: plano
      ? ordenarLineas(cuerpo(plano))
      : html
        ? htmlATexto(cuerpo(html))
        : r.extracto,
    para: decodificarCabecera(cabecera(p, "To")),
    responderA: responder ? persona(responder) : r.de,
    idMensaje: cabecera(p, "Message-ID").trim(),
    referencias: cabecera(p, "References").trim(),
  };
}

export function desdeGraph(m: any, cuenta: string): CorreoResumen | null {
  const dir = m?.from?.emailAddress?.address;
  if (!m?.id || typeof dir !== "string") return null;
  return {
    id: String(m.id),
    proveedor: "microsoft",
    cuenta,
    hilo: String(m.conversationId ?? m.id),
    de: { nombre: m.from.emailAddress.name || dir, correo: dir },
    asunto: String(m.subject ?? ""),
    fecha: isoDe(Date.parse(m.receivedDateTime)),
    extracto: String(m.bodyPreview ?? "").trim(),
    leido: m.isRead !== false,
  };
}

export function desdeGraphCompleto(
  m: any,
  cuenta: string,
): CorreoCompleto | null {
  const r = desdeGraph(m, cuenta);
  if (!r) return null;
  const contenido = String(m.body?.content ?? "");
  const responder = m.replyTo?.[0]?.emailAddress;
  return {
    ...r,
    texto:
      m.body?.contentType === "html"
        ? htmlATexto(contenido)
        : ordenarLineas(contenido) || r.extracto,
    para: (m.toRecipients ?? [])
      .map((x: any) => x?.emailAddress?.address)
      .filter(Boolean)
      .join(", "),
    responderA:
      typeof responder?.address === "string"
        ? {
            nombre: responder.name || responder.address,
            correo: responder.address,
          }
        : r.de,
    idMensaje: String(m.internetMessageId ?? ""),
    referencias: "",
  };
}

export const asuntoRespuesta = (asunto: string) =>
  /^\s*(re|rv|aw)\s*:/i.test(asunto) ? asunto : `Re: ${asunto}`;

// El mensaje completo (RFC 2822) en base64url, lo que Gmail recibe en `raw`.
// In-Reply-To y References dejan la respuesta en el mismo hilo.
export function respuestaGmail(o: CorreoCompleto, texto: string): string {
  const refs = [o.referencias, o.idMensaje].filter(Boolean).join(" ");
  const lineas = [
    `To: ${o.responderA.correo}`,
    `Subject: =?UTF-8?B?${base64Utf8(asuntoRespuesta(o.asunto))}?=`,
    ...(o.idMensaje
      ? [`In-Reply-To: ${o.idMensaje}`, `References: ${refs}`]
      : []),
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    (base64Utf8(texto).match(/.{1,76}/g) ?? []).join("\r\n"),
  ];
  return base64Utf8(lineas.join("\r\n"))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Las cuentas juntas, lo más nuevo primero y sin repetir.
export function mezclar(listas: CorreoResumen[][]): CorreoResumen[] {
  const vistos = new Map<string, CorreoResumen>();
  for (const c of listas.flat())
    vistos.set(`${c.proveedor}:${c.cuenta}:${c.id}`, c);
  return [...vistos.values()].sort((a, b) =>
    a.fecha === b.fecha ? 0 : a.fecha < b.fecha ? 1 : -1,
  );
}
