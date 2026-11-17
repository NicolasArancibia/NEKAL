# H5 · Correo con Neka — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Una pestaña **IA** con **Chat | Correo**: en Correo se ve solo lo importante de Gmail y Outlook (con la razón y una acción), el resto queda en «N correos más», se lee en texto plano, se marca leído, Neka redacta la respuesta y se envía en el mismo hilo; desde un correo se crea una tarea o un evento.

**Architecture:** Igual que H4. Lógica pura con pruebas en `utils/conexiones/` (`correo.ts`: Gmail/Graph → correos, MIME, respuesta RFC 2822; `correoNeka.ts`: pedidos a Neka y lectura de su respuesta; `bandeja.ts`: juntar las cuentas con una red inyectada). Solo `google.ts` y `microsoft.ts` hablan con la red. Los correos **no se guardan**: viven en memoria (`utils/useCorreo.ts`). UI en `components/ui/correo/`. Neka usa el `Cerebro` existente (`agente/cerebro.ts`) sin herramientas, pidiendo JSON.

**Tech Stack:** Expo 57 / React Native Web, TypeScript, Gmail API v1, Microsoft Graph v1.0 (mail), Firebase AI Logic (Gemini Flash-Lite) vía `Cerebro`, runner propio `npm test`.

**Spec:** [H3_CONEXIONES.md](H3_CONEXIONES.md) §3, §6.4, §6.5, §8, §10, §11 (fila H5) y §12 · maqueta [H_MAQUETA/05](H_MAQUETA/05-conexiones-correo-calendario.html) D1–D3.

## Global Constraints

- **Nada se envía sin tocar «Enviar»**; nada se crea sin pasar por la hoja normal de edición (`ItemEditor`).
- **Los correos no se guardan** en Firestore ni en `AppData`; tampoco los pases. Sin cambios de reglas ni de `model.ts`.
- Paso 1 del filtro, exacto: Gmail `in:inbox category:primary newer_than:7d`; Outlook bandeja de entrada con `inferenceClassification eq 'focused'` y fecha de los últimos 7 días. Máximo **50 por cuenta**.
- «Correos más» = Gmail `in:inbox newer_than:7d -category:primary`; Outlook `inferenceClassification eq 'other'` (mismos 7 días, máx. 50). Se ven sin pasar por Neka.
- A Neka para clasificar le llegan **solo remitente, asunto y primeras líneas** (extracto ≤ 300 caracteres) + títulos de los próximos 14 días + nombres de las mesas. El texto completo solo al pedir un borrador.
- Razones: `pide` → «Crear tarea»; `pregunta` → «Responder»; `fecha` → «Al calendario»; `relacionado` → «Ver»; `nada` → a «N correos más». Razón desconocida = `nada`; `fecha` sin fecha válida = `nada`.
- Si Neka falla: se muestra **toda** la lista del paso 1 con el aviso exacto «Neka no pudo ordenar tu correo; te muestro todo lo principal».
- Texto del encabezado, exacto: «De {total} correos de esta semana, {n} son para ti.» (total = principales + más).
- Correo abierto: **texto plano** (sin HTML, imágenes remotas ni píxeles); se marca leído al abrir.
- Fuera de alcance (spec §3): adjuntos, carpetas/etiquetas, búsqueda, redactar desde cero, que Neka lea el correo desde el chat.
- UI con `theme.ts` y `components/ui/base/` (`Txt`, `Segmentos`, `Sheet`, `ListRow`, `Button`, `Chip`), Ionicons de línea, sin colores ni tamaños sueltos (`tests/styles.cjs`). Sin modales anidados: el correo abierto se cierra antes de abrir `ItemEditor`.
- Solo web (`googleDisponible` / `microsoftDisponible`); en invitado, `nekalConexiones("correo")` muestra correos de ejemplo (solo desarrollo).

## Review Focus

1. **Correos con caracteres raros**: asunto con tildes/emoji (RFC 2047 `=?UTF-8?B?…?=` al recibir y al enviar), cuerpo en `quoted-printable` o `base64` con `charset` ISO-8859-1 → se lee bien y la respuesta llega con el asunto «Re: …» legible. *(Task 1)*
2. **Correo solo HTML** (boletines, Outlook): el texto plano no muestra etiquetas, `<style>`/`<script>` ni entidades (`&nbsp;`, `&amp;`), y conserva los saltos de línea de `<br>`/`<p>`. *(Task 1)*
3. **Neka responde basura o a medias** (JSON con texto alrededor, ids que no existen, fecha «mañana»): se ignora lo inválido sin romper la bandeja; los correos sin clase válida cuentan como `nada`, salvo que la respuesta entera no se pueda leer → «te muestro todo lo principal». *(Task 2)*
4. **Una cuenta falla y la otra no** (pase de Google vencido, Outlook bien): se ve el correo de Outlook y un aviso por la cuenta que falló, no una pantalla vacía. *(Task 3)*
5. **Responder a un correo que ya es «Re:»** o que trae `Reply-To`: no queda «Re: Re:», va a la dirección de `Reply-To` y lleva `In-Reply-To` + `References` del original. *(Task 1)*

---

### Task 1: `correo.ts` — leer Gmail y Graph, texto plano y la respuesta en el hilo

**Files:**
- Create: `front/src/utils/conexiones/correo.ts`
- Modify: `front/src/utils/conexiones/tipos.ts` (tipos de correo)
- Modify: `front/tests/run.cjs` (agregar `src/utils/conexiones/correo.ts` a la lista)
- Test: `front/tests/correo.cjs` (nuevo; `require` desde `run.cjs`)

**Interfaces:**
- Produces (en `tipos.ts`):
  ```ts
  export type Persona = { nombre: string; correo: string };
  export type CorreoResumen = {
    id: string; proveedor: Proveedor; cuenta: string; hilo: string;
    de: Persona; asunto: string; fecha: string /* ISO */; extracto: string; leido: boolean;
  };
  export type CorreoCompleto = CorreoResumen & {
    texto: string; para: string; responderA: Persona;
    idMensaje: string /* Message-ID */; referencias: string;
  };
  ```
- Produces (en `correo.ts`):
  - `persona(cabecera: string): Persona` — `"Ana Pérez <ana@x.cl>"`, `"ana@x.cl"`, con comillas y RFC 2047.
  - `decodificarCabecera(s: string): string` — RFC 2047 B y Q, UTF-8 e ISO-8859-1.
  - `htmlATexto(html: string): string`
  - `desdeGmail(m: any, cuenta: string): CorreoResumen | null` (formato `metadata`: `From`, `Subject`, `Date`; `snippet`; `UNREAD` en `labelIds`; `internalDate`).
  - `desdeGmailCompleto(m: any, cuenta: string): CorreoCompleto | null` (formato `full`: recorre `payload.parts`, prefiere `text/plain`, si no `text/html` → `htmlATexto`; `body.data` en base64url; respeta `Content-Transfer-Encoding` y `charset`).
  - `desdeGraph(m: any, cuenta: string): CorreoResumen | null` (`from.emailAddress`, `subject`, `receivedDateTime`, `bodyPreview`, `isRead`, `conversationId`).
  - `desdeGraphCompleto(m: any, cuenta: string): CorreoCompleto | null` (`body.contentType` `text` o `html` → `htmlATexto`; `replyTo[0]`; `internetMessageId`).
  - `respuestaGmail(original: CorreoCompleto, texto: string): string` — mensaje RFC 2822 completo en **base64url** (lo que va en `raw`).
  - `asuntoRespuesta(asunto: string): string` — antepone «Re: » salvo que ya empiece con `Re:`/`RE:`/`Rv:`.
  - `mezclar(listas: CorreoResumen[][]): CorreoResumen[]` — por fecha, más nuevo primero, sin repetir `proveedor:cuenta:id`.

- [ ] **Step 1: Write the failing tests** en `front/tests/correo.cjs`:
  - `correo: remitente y cabeceras codificadas` — `persona('"Pérez, Ana" <ana@x.cl>')` → `{nombre:"Pérez, Ana", correo:"ana@x.cl"}`; `persona("ana@x.cl")` → nombre `"ana@x.cl"`; `decodificarCabecera("=?UTF-8?B?wr9Ob3MganVudGFtb3M/?=")` → `"¿Nos juntamos?"`; `decodificarCabecera("=?ISO-8859-1?Q?Inscripci=F3n_de_ramos?=")` → `"Inscripción de ramos"`.
  - `correo: HTML a texto plano` — `htmlATexto("<style>p{}</style><p>Hola&nbsp;Ana</p><p>Sí &amp; no<br>chao</p><img src='http://x/p.gif'>")` → `"Hola Ana\n\nSí & no\nchao"` (sin la URL de la imagen).
  - `correo: Gmail resumen y completo (multiparte, base64url, quoted-printable)` — un mensaje `metadata` con `labelIds:["UNREAD","INBOX"]` → `leido:false`, `fecha` = ISO de `internalDate`; un `full` `multipart/alternative` con `text/plain` en base64url («¡Hola!») y `text/html` → `texto` = «¡Hola!»; un `full` solo `text/html` con `Content-Transfer-Encoding: quoted-printable` y `charset=ISO-8859-1` → texto con «ó» correcto; `responderA` toma `Reply-To` si existe; `idMensaje` y `referencias` desde `Message-ID` / `References`.
  - `correo: Graph resumen y completo` — `isRead:false`, `bodyPreview` como extracto, `body.contentType:"html"` → texto plano, `replyTo` vacío → `responderA` = `de`.
  - `correo: la respuesta queda en el hilo` — decodificar `respuestaGmail(original, "Sí, me sirve")` (base64url → texto): contiene `To: Ana Pérez <ana@x.cl>` (o el `Reply-To`), `Subject: =?UTF-8?B?…?=` que decodifica a `Re: ¿Nos juntamos el sábado?`, `In-Reply-To: <m1@x>`, `References: <m0@x> <m1@x>`, `Content-Type: text/plain; charset=UTF-8` y el cuerpo «Sí, me sirve» decodificable; `asuntoRespuesta("RE: Hola")` → `"RE: Hola"`.
  - `correo: mezclar dos cuentas por fecha sin repetir`.

- [ ] **Step 2: Run** `npm test` (desde `front/`). Expected: falla al compilar (`correo.ts` no existe).
- [ ] **Step 3: Implement** los tipos y `correo.ts`. base64url y UTF-8 con `atob`/`btoa` + `TextDecoder`/`TextEncoder` (existen en Node y en la web; nada de `Buffer`). El cuerpo de la respuesta va en `Content-Transfer-Encoding: base64`.
- [ ] **Step 4: Run** `npm test`. Expected: todo en verde.
- [ ] **Step 5: Commit** `V2/H5: leer correos de Gmail y Graph en texto plano y armar la respuesta en el hilo`.

### Task 2: `correoNeka.ts` — qué es importante y el borrador

**Files:**
- Create: `front/src/utils/conexiones/correoNeka.ts`
- Modify: `front/tests/run.cjs`
- Test: `front/tests/correo.cjs`

**Interfaces:**
- Consumes: `CorreoResumen`, `CorreoCompleto` (Task 1); `Cerebro` de `agente/tipos.ts`; `AppData`, `Item`, `newItem` de `model.ts`.
- Produces:
  ```ts
  export type Razon = "pide" | "pregunta" | "fecha" | "relacionado" | "nada";
  export type Clase = { razon: Razon; fecha?: string /* ISO */; sobre?: string /* ≤ 60 */ };
  export const clave = (c: CorreoResumen) => `${c.proveedor}:${c.cuenta}:${c.id}`;
  export function pedidoClasificar(correos: CorreoResumen[], d: AppData, ahora: number): string;
  export function leerClasificacion(texto: string, claves: string[]): Map<string, Clase> | null; // null = ilegible
  export async function clasificar(o: {
    cerebro: Cerebro; correos: CorreoResumen[]; data: AppData; ahora: number;
    memoria: Map<string, Clase>;   // se lee y se completa; solo se piden los que falten
  }): Promise<{ fallo: boolean }>;
  export function textoRazon(c: Clase, ahora: number): string;  // «Pide algo · viernes», «Te pregunta algo», «Sobre tu reunión de hoy», «Fecha · 1 dic»
  export function accion(r: Razon): "Crear tarea" | "Responder" | "Al calendario" | "Ver";
  export function resumenBandeja(total: number, importantes: number): string;
  export function pedidoBorrador(c: CorreoCompleto, indicacion: string, nombre: string): string;
  export type Borrador = { texto: string; evento?: { titulo: string; inicio: string; minutos: number } };
  export function leerBorrador(texto: string): Borrador | null;
  export function tareaDesdeCorreo(c: CorreoResumen, clase: Clase | undefined): Item;  // Tarea
  export function eventoDesdeCorreo(c: CorreoResumen, clase: Clase | undefined, ahora: number): Item; // Evento
  export const INSTRUCCIONES_CORREO: string;
  ```
- `clasificar` usa `cerebro.sesion(INSTRUCCIONES_CORREO, [], []).enviar(pedido)`; la respuesta pedida es JSON `{"correos":[{"id":"…","razon":"…","fecha":"AAAA-MM-DD[THH:mm]","sobre":"…"}]}`. Se aceptan bloques ```json. Lotes de a 25.

- [ ] **Step 1: Write the failing tests** (cerebro falso como en `tests/neka.cjs`):
  - `correo Neka: el pedido lleva solo remitente, asunto y extracto` — el extracto se corta a 300; incluye el título de una tarea dentro de 14 días y no uno a 20 días; incluye el nombre de una mesa; **no** incluye el texto completo de ningún correo.
  - `correo Neka: leer la clasificación` — acepta texto con ```json alrededor; `razon:"urgente"` → `nada`; id desconocido se ignora; `fecha:"mañana"` con `razon:"fecha"` → `nada`; `pide` con fecha inválida conserva `pide` sin fecha; `sobre` se corta a 60; texto no JSON → `null`.
  - `correo Neka: clasificar solo lo nuevo y no esconder nada si falla` — con `memoria` que ya tiene 1 de 3 correos, el cerebro recibe solo 2 ids; si el cerebro lanza error o devuelve `null`-ilegible → `{fallo:true}` y la memoria no cambia.
  - `correo Neka: textos de la fila y del encabezado` — `textoRazon({razon:"pide", fecha:<viernes>}, AHORA)` = `"Pide algo · viernes"`; `{razon:"pregunta"}` = `"Te pregunta algo"`; `{razon:"relacionado", sobre:"tu reunión de hoy"}` = `"Sobre tu reunión de hoy"`; `{razon:"fecha", fecha:"2026-12-01"}` = `"Fecha · 1 dic"`; `resumenBandeja(27, 4)` = `"De 27 correos de esta semana, 4 son para ti."`; `accion("fecha")` = `"Al calendario"`.
  - `correo Neka: tarea y evento desde un correo` — tarea: `type:"Tarea"`, `title` = asunto (≤160; asunto vacío → «Correo de {nombre}»), `description` empieza con `De: Ana Pérez <ana@x.cl>` y trae el extracto, `dueAt` = fecha de la clase si hay; evento: `type:"Evento"`, `scheduledAt` = fecha de la clase (sin hora → 09:00 local), sin fecha → mañana 09:00, `duration` 60.
  - `correo Neka: borrador` — `leerBorrador` acepta JSON `{"texto":"…","evento":{…}}`, descarta un `evento` con fecha inválida y devuelve `null` si no hay `texto`; `pedidoBorrador` incluye la indicación y el texto completo del correo.
- [ ] **Step 2: Run** `npm test`. Expected: falla (módulo ausente).
- [ ] **Step 3: Implement** `correoNeka.ts`. `INSTRUCCIONES_CORREO` en español: clasificar con las 5 razones y sus definiciones del spec §6.5, responder **solo** el JSON; para el borrador, escribir en el idioma del correo, breve, firmado con el nombre del usuario, sin inventar datos.
- [ ] **Step 4: Run** `npm test`. Expected: verde.
- [ ] **Step 5: Commit** `V2/H5: Neka elige lo importante del correo y redacta borradores`.

### Task 3: llamadas de correo y la bandeja de varias cuentas

**Files:**
- Modify: `front/src/utils/conexiones/google.ts`, `front/src/utils/conexiones/microsoft.ts`
- Create: `front/src/utils/conexiones/bandeja.ts`
- Modify: `front/tests/run.cjs`
- Test: `front/tests/correo.cjs`

**Interfaces:**
- Consumes: Task 1 (`desdeGmail*`, `desdeGraph*`, `respuestaGmail`, `mezclar`), `detalleDeError` (H4), `Cuenta`.
- Produces (en `bandeja.ts`):
  ```ts
  export type RedCorreo = {
    token: (c: Cuenta) => Promise<string | null>;
    permiso: (c: Cuenta) => boolean;                       // Google: scope de Gmail; Microsoft: true
    listar: (token: string, cuenta: string, ahora: number) => Promise<{ principales: CorreoResumen[]; mas: CorreoResumen[] }>;
    abrir: (token: string, cuenta: string, id: string) => Promise<CorreoCompleto>;
    marcarLeido: (token: string, id: string) => Promise<void>;
    responder: (token: string, original: CorreoCompleto, texto: string) => Promise<void>;
  };
  export type AvisoCuenta = { cuenta: Cuenta; tipo: "pase" | "permiso" | "red"; detalle: string };
  export type Bandeja = { principales: CorreoResumen[]; mas: CorreoResumen[]; avisos: AvisoCuenta[] };
  export async function traerBandeja(cuentas: Cuenta[], red: (c: Cuenta) => RedCorreo, ahora: number): Promise<Bandeja>;
  ```
- Produces (red real): en `google.ts` `correosGoogle`, `correoGoogle`, `marcarLeidoGoogle`, `responderGoogle`; en `microsoft.ts` `correosGraph`, `correoGraph`, `marcarLeidoGraph`, `responderGraph` — con las firmas de `RedCorreo.listar/abrir/marcarLeido/responder`.
  - Gmail: `users/me/messages?q=…&maxResults=50` y luego `messages/{id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date` (en paralelo, de a 10); abrir `format=full`; leído = `POST messages/{id}/modify {removeLabelIds:["UNREAD"]}`; responder = `POST messages/send {raw, threadId}`.
  - Graph: `me/mailFolders/inbox/messages?$filter=receivedDateTime ge {ISO} and inferenceClassification eq 'focused'&$orderby=receivedDateTime desc&$top=50&$select=id,subject,from,receivedDateTime,bodyPreview,isRead,conversationId` (igual con `'other'`); `$` sin codificar (el `%24` quedó como menor de H4); abrir `me/messages/{id}?$select=…,body,replyTo,toRecipients,internetMessageId` con `Prefer: outlook.body-content-type="text"`; leído = `PATCH {isRead:true}`; responder = `POST me/messages/{id}/reply {comment: texto}`.
- [ ] **Step 1: Write the failing tests** con una `RedCorreo` falsa:
  - `bandeja: junta las dos cuentas por fecha` — 2 cuentas → `principales` mezclados, `mas` mezclados, `avisos` vacío.
  - `bandeja: una cuenta falla y la otra se ve` — Google `token` → `null` ⇒ aviso `{tipo:"pase"}` y los correos de Outlook están; `listar` lanza `Error("red 500 · x")` ⇒ aviso `{tipo:"red", detalle:"red 500 · x"}`; `permiso` falso ⇒ aviso `{tipo:"permiso"}` sin llamar a `listar`.
- [ ] **Step 2: Run** `npm test`. Expected: falla.
- [ ] **Step 3: Implement** `traerBandeja` (cuentas en paralelo, `Promise.allSettled`) y las 8 funciones de red. Un 401 sigue siendo `Error("pase")`; otro error, `detalleDeError`.
- [ ] **Step 4: Run** `npm test` y `npm run typecheck` (desde la raíz). Expected: verde.
- [ ] **Step 5: Commit** `V2/H5: leer, marcar y responder correos en Gmail y Outlook`.

### Task 4: `useCorreo` — la bandeja viva en memoria

**Files:**
- Create: `front/src/utils/useCorreo.ts`
- Modify: `front/src/utils/ConexionesContext.tsx` (exponer `redCorreo(c: Cuenta): RedCorreo`; correos de ejemplo para `nekalConexiones("correo")`)

**Interfaces:**
- Consumes: Tasks 1–3, `useConexiones`, `useApp`, `crearCerebro`.
- Produces:
  ```ts
  export type CorreoEnLista = CorreoResumen & { clase?: Clase };
  export function useCorreo(): {
    estado: "sin_cuentas" | "cargando" | "listo";
    importantes: CorreoEnLista[]; mas: CorreoEnLista[]; total: number;
    nekaFallo: boolean; avisos: AvisoCuenta[];
    recargar: () => Promise<void>;
    abrir: (c: CorreoResumen) => Promise<CorreoCompleto>;          // y lo marca leído (también en la lista)
    borrador: (c: CorreoCompleto, indicacion: string) => Promise<Borrador | null>;
    enviar: (c: CorreoCompleto, texto: string) => Promise<void>;
  };
  ```
- `importantes` = principales con clase ≠ `nada`; si `nekaFallo`, todos los principales. `mas` = el resto de principales + `mas` de la bandeja. La memoria de clases es de módulo (dura mientras la app está abierta). Carga al montar la vista Correo y con `recargar` (tirar hacia abajo); no hay sincronización periódica.
- En `nekalConexiones("correo")`: `redCorreo` devuelve una red falsa con 6 correos de ejemplo (2 cuentas; uno con fecha, uno que pregunta, dos boletines en `mas`); `enviar` solo registra en consola.
- [ ] **Step 1:** Implementar y `npm run typecheck`. Expected: sin errores. (La lógica que decide está probada en Tasks 1–3; esto es pegamento.)
- [ ] **Step 2: Commit** `V2/H5: bandeja en memoria con la clasificación de Neka`.

### Task 5: Pestaña IA — Chat | Correo, correo abierto y responder con Neka

**Files:**
- Modify: `front/src/components/ui/base/TabBar.tsx` (Chat → ícono `sparkles-outline`, etiqueta «IA»)
- Modify: `front/src/pages/Chat.tsx` (título «IA» y `Segmentos` Chat | Correo; Chat sin cambios)
- Create: `front/src/components/ui/correo/BandejaCorreo.tsx`, `FilaCorreo.tsx`, `CorreoAbierto.tsx`, `index.ts`

**Interfaces:**
- Consumes: `useCorreo` (Task 4), `textoRazon`, `accion`, `resumenBandeja`, `tareaDesdeCorreo`, `eventoDesdeCorreo` (Task 2), `LogoCuenta`, `ItemEditor`, `useConexiones` (conectar / actualizar).
- Pantallas (maqueta D1–D3):
  - **D1 Bandeja:** encabezado de Neka con `resumenBandeja`; aviso de privacidad en `caption` («Neka lee solo remitente, asunto y primeras líneas para ordenar; el correo completo solo si le pides un borrador.»); «Lo importante · Google y Outlook»; cada fila: `LogoCuenta` chico, remitente, hora/fecha, asunto, punto de no leído, `textoRazon`, botón de `accion`; fila «{n} correos más · Promociones, avisos y boletines · Ver» que despliega la lista; `RefreshControl`; aviso de Neka si `nekaFallo`; por cada `AvisoCuenta`: «Google: toca para actualizar» / «Falta permiso de correo · Volver a dar permiso» (ambos → `actualizar(cuenta)`) / «No se pudo leer Outlook; se reintenta al recargar». Sin cuentas: «Conecta tu correo» con los botones Google y Outlook.
  - **D2 Correo abierto** (`Sheet`): asunto, remitente, «para {cuenta} · fecha», texto plano seleccionable, botones abajo **Responder** y **Crear tarea**.
  - **D3 Responder** (dentro del mismo `Sheet`): «Se envía desde {cuenta}, en el mismo hilo»; campo «Dile a Neka qué responder» + **Que Neka lo escriba**; campo del borrador editable; si el borrador trae `evento`: «También puedo agregar «{titulo}» el {fecha}» + **Agregar**; **Enviar** (deshabilitado si está vacío) y **Otra versión**; «Nada se envía hasta que tocas Enviar.»; tras enviar, «Enviado» y se cierra. Si Neka falla, el borrador queda vacío con «Neka no pudo escribir; puedes escribirlo tú».
  - Acciones: «Crear tarea» / «Al calendario» / «Agregar» cierran el `Sheet` y abren `ItemEditor` con `tareaDesdeCorreo` / `eventoDesdeCorreo`; «Responder» abre el correo directo en D3; «Ver» abre D2.
- [ ] **Step 1:** Implementar. `npm test` (incluye `styles.cjs`) y `npm run typecheck`. Expected: verde.
- [ ] **Step 2: Verificar en invitado** (`nekal-web-invitado`, 8082, móvil): `nekalConexiones("correo")` → IA → Correo muestra encabezado, filas con razón y acción, «N correos más» desplegable; abrir un correo lo marca leído; Responder → Enviar deshabilitado vacío; Crear tarea abre el editor con asunto y descripción; Chat sigue igual; consola sin errores.
- [ ] **Step 3: Commit** `V2/H5: pestaña IA con Chat y Correo`.

### Task 6: Revisión, prueba real y cierre

- [ ] `/code-review high` sobre la rama y una pasada de arreglos (cada arreglo con su prueba primero).
- [ ] `npm test`, `npm run typecheck`, `npm --prefix front run build:web`.
- [ ] Con permiso del usuario: publicar el canal de prueba (`hosting:channel:deploy conexiones`). No hay reglas nuevas.
- [ ] Prueba del usuario con correos reales (criterio §11): «Lo importante» deja fuera promociones y avisos y cada fila dice por qué; una respuesta enviada desde Nekal llega en el mismo hilo en Gmail **y** en Outlook; crear tarea y llevar al calendario funcionan; si Neka falla se ve todo lo principal.
- [ ] Cierre: `H5_REGISTRO_IMPLEMENTACION.md` (copia del ledger), ROADMAP, línea en `CLAUDE.md` (solo la mía), `SISTEMA_DE_DISENO/REGISTRO_DE_CAMBIOS.md`, mezcla en `main` con `commit-tree`, borrar rama y ledger, memoria.
