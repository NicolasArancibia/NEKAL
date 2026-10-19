# Subproyecto D · Neka con IA — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Neka entiende texto y audio, arma un plan de cambios con herramientas que calcula la app, lo muestra dibujado en tu día y lo aplica solo cuando aceptas. Responde escrito y en voz alta.

**Architecture:**
- Lógica pura y probada en `front/src/utils/agente/`:
  - contexto (lo que se manda a Gemini);
  - herramientas (declaraciones y ejecución sobre una copia);
  - plan (probar, desmarcar, aceptar);
  - conversación (ciclo de hasta 5 vueltas contra un `Cerebro` inyectado);
  - mensajes;
  - día dibujado.
- `correrDesde` y `buscarHueco` viven en `utils/planner.ts`.
- **Solo** `utils/agente/cerebro.ts` importa `firebase/ai`, y solo `utils/firebase.ts` inicializa App Check.
- `utils/NekaContext.tsx` une conversación, plan pendiente, grabación y voz para el chat, la pestaña y el Resumen.

**Tech Stack:**
- Expo 57, React Native 0.86.3, React 19.2.3, TypeScript 6.
- Firebase JS 12.19 (`firebase/ai` con `GoogleAIBackend`, `firebase/app-check`).
- **expo-audio** y **expo-speech**, ambas nuevas.
- React Navigation 7, Ionicons de línea.
- Pruebas con `node:test` mediante `front/tests/run.cjs`.

**Spec:** [D_NEKA_IA.md](D_NEKA_IA.md). Orden respecto a la spec §10: los mensajes en la nube pasan a la Task 2 porque el chat los necesita; las reglas se publican al final igual.

**Maquetas:** [01](D_MAQUETA/01-plan-y-acceso.html), [02](D_MAQUETA/02-pantallas.html). El plan se ve igual desde cualquier lugar, con la lista siempre visible y todo marcado: spec §5.2.

## Global Constraints

**Herramientas y dependencias**
- Antes de escribir código con una API de Expo, consultar su doc (MCP `context7`, Expo v57). Ver `front/AGENTS.md`.
- Dependencias nuevas permitidas: **solo** `expo-audio` y `expo-speech`, instaladas desde `front/` con `npx expo install`. `firebase/ai` y `firebase/app-check` ya vienen en `firebase`.
- `firebase/ai` se importa **solo** en `utils/agente/cerebro.ts`. Ningún archivo compilado por `tests/run.cjs` puede importar `cerebro.ts`, `firebase` ni nada de React Native.

**Secretos**
- El token de depuración vive en `front/.env.development.local` (`EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN`). Nunca se imprime, nunca se commitea y nunca entra en la build de producción.
- La clave del sitio de reCAPTCHA está en `front/.env.local` (`EXPO_PUBLIC_RECAPTCHA_SITE_KEY`). Es pública.
- No se escribe ni se guarda la clave de la cuenta de prueba: el usuario inicia sesión.

**Interfaz (reglas del sistema A)**
- Sin colores, `fontSize` ni `fontWeight` sueltos en `src/components`, `src/pages` y `src/navigation` (lo verifica `tests/styles.cjs`). El texto va con `Txt`. Íconos Ionicons `*-outline`.
- Área táctil mínima de 44 × 44. Con `useReducedMotion()`: sin resortes, solo fundidos.

**Textos fijos de la spec** (tuteo, se copian tal cual)
- «Neka usa Gemini de Google. Tú apruebas cada cambio.»
- «Ahora no puedo pensar con IA; te dejo lo de siempre.»
- «No alcancé, inténtalo de nuevo.»
- «No te escuché bien, ¿me lo repites?»
- «Algo cambió, pídeselo de nuevo.»
- «Te escucho… suelta para enviar»
- «Neka está pensando…»
- «Ya no está disponible»
- Atajos: «Voy atrasado», «¿Qué tengo hoy?», «Arregla los choques».

**Datos**
- `Message` suma `audio`, `plan` y `estado`. Un mensaje tiene **las 3 claves viejas o las 6**, nunca un punto intermedio, porque las reglas exigen el conjunto exacto.
- `back/firestore.rules` se edita en la Task 2 y **solo se publica con `npm run deploy:rules` y permiso explícito del usuario** (Task 10).

**Proceso**
- Se trabaja en la rama `v2/d-neka-ia`, creada desde `main`.
- Cada tarea termina con:
  - `npm test`, `npm run typecheck` y `npm --prefix front run build:web` en verde (desde la raíz);
  - un commit en español que termina con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Las pruebas en el navegador usan la cuenta **PruebaClaude@gmail.com**, que ya tiene 2 semanas de datos.
- **Puntos de control con el usuario** (el ejecutor se detiene y espera):
  1. al terminar la Task 1 (prueba en el iPhone);
  2. antes de publicar las reglas (Task 10);
  3. en la prueba final en el iPhone (Task 10).

## Review Focus

1. **Gemini inventa un id** o usa el de una cosa borrada: la herramienta devuelve el error «Esa cosa ya no existe.» y no agrega paso. → Task 5, test `herramientas: id inventado o borrado`.
2. **El plan mueve algo a otro día:** el dibujo muestra solo el primer día con cambios; los pasos de otros días aparecen solo en la lista y se aplican igual. → Task 8, test `dia: pasos de otro día solo en la lista`.
3. **Editas en el computador una cosa que el plan NO toca** antes de aceptar: el plan se acepta igual (solo bloquean las cosas tocadas). → Task 4, test `plan: cambios en otras cosas no bloquean`.
4. **Llega un plan "pendiente" desde otro dispositivo** por la sincronización: se ve «Ya no está disponible» y no se puede abrir. → Task 7, test `mensajes: pendiente ajeno se ve vencido`.
5. **"Voy atrasado" de noche:** nada pasa a mañana por correrse; lo que no cabe se marca «no cabe hoy». → Task 3, test `correrDesde: nada cruza la medianoche`.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---|---|
| `front/src/utils/firebase.ts` | Exporta `firebaseApp`; inicializa App Check (reCAPTCHA v3 en la web publicada, token de depuración en desarrollo) |
| `front/src/utils/agente/tipos.ts` (nuevo) | `Cerebro`, `Sesion`, `Llamada`, `Respuesta`, `Resultado`, `Declaracion`, `AudioGrabado` |
| `front/src/utils/agente/cerebro.ts` (nuevo) | Único que habla con Gemini (`crearCerebro`) |
| `front/src/utils/audio.ts` + `audio.web.ts` (nuevos) | Leer la grabación como base64 con su tipo |
| `front/src/utils/model.ts`, `storage.ts`, `syncModel.ts`, `back/firestore.rules` | Mensajes con `audio`, `plan` y `estado` |
| `front/src/utils/planner.ts` | `correrDesde`, `buscarHueco` |
| `front/src/utils/estructura.ts` | `crearMesa` y `crearGrupo` aceptan un id opcional |
| `front/src/utils/agente/plan.ts` (nuevo) | Pasos, probar sobre una copia, desmarcar, aceptar |
| `front/src/utils/agente/contexto.ts` (nuevo) | Contexto e historial para Gemini |
| `front/src/utils/agente/herramientas.ts` (nuevo) | Declaraciones y `ejecutar` |
| `front/src/utils/agente/conversar.ts` (nuevo) | Instrucciones, ciclo de vueltas, `oir` |
| `front/src/utils/agente/mensajes.ts` (nuevo) | Agregar mensajes, estado del plan y estado visible |
| `front/src/utils/agente/dia.ts` (nuevo) | Bloques del día dibujado |
| `front/src/utils/NekaContext.tsx` (nuevo) | Proveedor y `useNeka()` |
| `front/src/components/ui/neka/*` (nuevo) | `HojaPlan`, `DiaPlan`, `TarjetaPlan`, `InterruptorVoz`, `CapaGrabando`, `ChatSinIA` (el chat actual, para el modo sin IA) |
| `front/src/components/ui/ChatUi/ChatMessage.tsx`, `ChatInput.tsx` | Burbuja de audio con lo que entendió y parlante; micrófono |
| `front/src/pages/Chat.tsx` | Chat nuevo; el modo sin IA conserva el actual |
| `front/src/components/ui/base/PressableScale.tsx`, `TabBar.tsx`, `NekaCard.tsx`, `navigation/TabNavigator.tsx`, `pages/Resumen.tsx` | Acceso rápido |
| `front/src/pages/Ajustes.tsx` | Qué se manda a Gemini |
| `front/tests/agente.cjs` (nuevo), `rules.cjs`, `sync.cjs`, `run.cjs` | Pruebas |

---

### Task 1: Prueba de Gemini, App Check, audio y voz (web y iPhone) — punto de control

**Files:**
- Create: `front/src/utils/agente/tipos.ts`, `front/src/utils/agente/cerebro.ts`, `front/src/utils/audio.ts`, `front/src/utils/audio.web.ts`, `front/src/components/ui/neka/PruebaNeka.tsx` (temporal)
- Modify: `front/src/utils/firebase.ts`, `front/package.json`, `front/app.json`, `front/src/pages/Chat.tsx` (botón temporal «Prueba IA»)

**Interfaces:**
- Produces:
  ```ts
  // tipos.ts
  export type AudioGrabado = { base64: string; mime: string };
  export type Llamada = { nombre: string; args: Record<string, unknown> };
  export type Respuesta = { texto: string; llamadas: Llamada[] };
  export type Resultado = { nombre: string; respuesta: Record<string, unknown> };
  export type Turno = { deUsuario: boolean; texto: string };
  export type Declaracion = {
    name: string; description: string;
    parameters: { type: "object"; properties: Record<string, unknown>; required?: string[] };
  };
  export interface Sesion {
    enviar(texto: string): Promise<Respuesta>;
    devolver(resultados: Resultado[]): Promise<Respuesta>;
  }
  export interface Cerebro {
    transcribir(audio: AudioGrabado): Promise<string>;
    sesion(instrucciones: string, historial: Turno[], herramientas: Declaracion[]): Sesion;
  }
  // cerebro.ts
  export const MODELO = "gemini-3.5-flash";
  export function crearCerebro(): Cerebro; // lanza Error si Firebase no está configurado
  // audio.ts (nativo) y audio.web.ts
  export function leerAudio(uri: string): Promise<AudioGrabado>;
  // firebase.ts
  export const firebaseApp: FirebaseApp | null;
  ```
- **Transcribir es una llamada aparte** (`generateContent` con el audio y la instrucción «Escribe exactamente lo que dice este audio, en español. Si no se entiende, responde vacío.»). Así lo que entendió Neka aparece en la burbuja antes de la respuesta, y el ciclo de herramientas solo recibe texto.
- **App Check en `firebase.ts`**, antes de exportar:
  - si existe `process.env.EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN`, se asigna a `globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN` y el proveedor es un `CustomProvider` que rechaza (en modo depuración no se usa);
  - si no existe y `Platform.OS === "web"`, el proveedor es `new ReCaptchaV3Provider(process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY)`;
  - en nativo sin token, `CustomProvider` que rechaza. Gemini falla y la app cae al modo sin IA.
  - Siempre `isTokenAutoRefreshEnabled: true`.

- [ ] **Step 1: Rama e instalación**
  - `git checkout -b v2/d-neka-ia`.
  - Desde `front/`: `npx expo install expo-audio expo-speech`.
  - En `app.json`, plugin `["expo-audio", { "microphonePermission": "Nekal usa el micrófono para que le hables a Neka." }]`.
- [ ] **Step 2: Código de la prueba**
  - Escribir `tipos.ts`, `cerebro.ts`, `audio.ts` y `audio.web.ts`, y el bloque de App Check en `firebase.ts`.
  - `cerebro.ts`: `getAI(firebaseApp, { backend: new GoogleAIBackend() })`, `getGenerativeModel(ai, { model: MODELO, systemInstruction, tools: [{ functionDeclarations }] })` y `startChat({ history })`. `sendMessage` manda el texto o las partes `functionResponse`. `response.functionCalls()` se traduce a `Llamada[]`.
  - `audio.ts` (nativo): `new File(uri).base64()` de `expo-file-system`, con mime `"audio/mp4"`.
  - `audio.web.ts`: `fetch(uri)` → blob → base64, con mime `"audio/webm"`.
  - `PruebaNeka.tsx` en una `Sheet`:
    - un campo de texto, «Enviar» y la respuesta;
    - «Mantén para grabar» (`useAudioRecorder(RecordingPresets.HIGH_QUALITY)`, `requestRecordingPermissionsAsync`, `setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true })`), que transcribe y después manda lo transcrito;
    - la respuesta se lee con `Speech.speak(texto, { language: "es-CL" })`;
    - una herramienta de ejemplo `hora()` que devuelve la hora local, para comprobar que las llamadas a funciones funcionan.
- [ ] **Step 3: Verificación local**
  - `npm test`, `npm run typecheck` y `npm --prefix front run build:web` en verde.
  - **El token no está en la build:** `node -e` que lee el valor de `front/.env.development.local` y busca ese texto en `front/dist/**/*.js` **sin imprimirlo**. Expected: `token en dist: no`.
- [ ] **Step 4: Prueba en la web local**
  - El usuario ya registró el token de depuración.
  - Entrar con la cuenta de prueba (el usuario inicia sesión). Chat → «Prueba IA».
  - «¿Qué hora es?» Expected: responde usando `hora()`.
  - Grabar «hola Neka». Expected: aparece la transcripción, la respuesta, y se escucha la voz.
- [ ] **Step 5: Si algo falla, decidir y dejar un `Ruling:`**
  - Si el modelo no existe, se usa el Flash gratis vigente según la doc de AI Logic y se actualiza `MODELO`.
  - Si el SDK no acepta las declaraciones como objetos planos, `cerebro.ts` las traduce con `Schema.*`.
  - Si Gemini rechaza el audio, se prueba `"audio/m4a"` o `"audio/aac"`.
  - Si App Check no funciona en React Native, se aplican las salidas a/b/c de la spec §7, en ese orden, y se consulta al usuario si se llega a la (c).
- [ ] **Step 6: Commit**

  `V2/D: prueba de Gemini, App Check, audio y voz`.
- [ ] **Step 7: PUNTO DE CONTROL**

  El usuario prueba en el iPhone (`npm start`, Expo Go → Chat → «Prueba IA»): texto, audio (con permiso de micrófono) y voz. Mide en voz alta cuánto tarda. Se sigue **solo** con su respuesta. El resultado y cualquier `Ruling:` quedan en el registro.

---

### Task 2: Mensajes con audio y plan (datos, sincronización y reglas)

**Files:**
- Modify: `front/src/utils/model.ts`, `front/src/utils/storage.ts`, `front/src/utils/syncModel.ts`, `back/firestore.rules`, `front/tests/sync.cjs`, `front/tests/rules.cjs`

**Interfaces:**
- Produces:
  ```ts
  export type EstadoPlan = "" | "pendiente" | "aceptado" | "descartado";
  export type Message = { id: string; text: string; isUser: boolean; audio?: boolean; plan?: string; estado?: EstadoPlan };
  ```
- `readBackup` acepta un mensaje con exactamente `{id,text,isUser}` o `{id,text,isUser,audio,plan,estado}`. Las condiciones del segundo caso: `audio` booleano, `plan` texto de hasta 500 y `estado` dentro de `EstadoPlan`. Cualquier otro caso: «Conversación inválida.»
- Reglas: la línea de `messages` acepta los dos conjuntos con esos tipos. Usa `fields()`, que exige el conjunto exacto, y `v.estado in ['','pendiente','aceptado','descartado']`.

- [ ] **Step 1: Pruebas (fallan)**
  - `mensajes: audio y plan pasan readBackup`;
  - `mensajes: estado desconocido se rechaza`;
  - `mensajes: mitad de campos se rechaza` (solo `audio`);
  - `sync: mensaje con plan va y vuelve`: `dataOf(fromCloud(toCloud(recordsOf(d))))` conserva `audio`, `plan` y `estado`.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implementar los tipos, la validación y el límite `bound(value.plan, 500)` en `syncModel.ts`, y editar las reglas (sin publicar).
- [ ] **Step 4:** `npm test`. Expected: PASS. Revisar el diff de reglas con `/security-review` y anotar el resultado en el registro.
- [ ] **Step 5: Commit**

  `V2/D: mensajes con audio y plan`.

---

### Task 3: Correr desde y buscar hueco

**Files:**
- Modify: `front/src/utils/planner.ts`, `front/tests/rules.cjs`

**Interfaces:**
- Produces:
  ```ts
  export type Corrimiento = { itemId: string; antes: string; despues: string; noCabe: boolean };
  export function correrDesde(d: AppData, minutos: number, desde: number): Corrimiento[];
  export function buscarHueco(d: AppData, o: { duracion: number; desde?: number; hasta?: number; ignorar?: string }, now?: number): string | null; // ISO de inicio
  ```
- **`correrDesde`** (spec §4.3):
  1. Toma `timedItems` no pasivas, no completadas, con `scheduledAt` el mismo día local que `desde` y fin posterior a `desde`, ordenadas por inicio.
  2. La primera flexible empieza en `inicio + minutos`.
  3. Cada flexible siguiente empieza en `max(inicio, cursor)`.
  4. Mientras se cruce con una fija de esa lista, salta al fin de la fija.
  5. `cursor` = fin colocado.
  6. Las fijas no aparecen en el resultado.
  7. `noCabe` si el fin colocado pasa de `dayEnd` **o** cae en otro día; en ese caso `despues` queda igual a `antes`.
  8. Las que no cambian no aparecen.
  9. `minutos <= 0` lanza «Indica cuántos minutos.»
- **`buscarHueco`**: extrae el ciclo de 15 minutos de `proposeSlot` (jornada, mismo día, sin choques, hasta 30 días o `hasta`). `proposeSlot` pasa a usarlo y no cambia de comportamiento.

- [ ] **Step 1: Pruebas (fallan)**

  Día 2030-05-06 con jornada de 8 a 21:
  - Gimnasio 9:30 (60 min, flexible);
  - Estudiar 10:30 (90 min, flexible);
  - Reunión 12:30 (60 min, `Meeting`, fija);
  - Almuerzo 13:30 (60 min, flexible).

  Las pruebas:
  - `correrDesde: ejemplo de la spec`: a las 9:10, 20 minutos → `[Gimnasio 9:30→9:50, Estudiar 10:30→10:50]`.
  - `correrDesde: salta lo fijo`: 80 minutos → Gimnasio 10:50, Estudiar 13:30 (salta la reunión), Almuerzo 15:00.
  - `correrDesde: lo que está en curso se corre`: Gimnasio 9:00–10:00 a las 9:10 con 20 → 9:20.
  - `correrDesde: no cabe hoy`: 20:00 (60 min) con 30 → `noCabe: true`.
  - `correrDesde: nada cruza la medianoche` (Review Focus 5): con `dayEnd` 23, 23:00 (50 min) con 30 → `noCabe: true`.
  - `correrDesde: ignora completadas, pasivas y otros días`.
  - `buscarHueco: salta lo ocupado y respeta la jornada`.

  Las pruebas de `proposeSlot` que ya existen siguen pasando.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit**

  `V2/D: correr desde y buscar hueco`.

---

### Task 4: El plan (probar sobre una copia, desmarcar, aceptar)

**Files:**
- Create: `front/src/utils/agente/plan.ts`, `front/tests/agente.cjs`
- Modify: `front/src/utils/estructura.ts` (id opcional), `front/tests/run.cjs`

**Interfaces:**
- Consumes: `saveItem`, `deleteItem`, `moverItems`, `crearGrupo`, `crearMesa`.
- Produces:
  ```ts
  // estructura.ts (cambio mínimo, compatible)
  export function crearMesa(d: AppData, name: string, color: string, id?: string): { data: AppData; id: string };
  export function crearGrupo(d: AppData, g: Omit<Group, "id">, id?: string): { data: AppData; id: string };
  // plan.ts
  export type Paso =
    | { tipo: "crear"; item: Item }
    | { tipo: "editar"; id: string; cambios: Partial<Pick<Item, "title" | "description" | "priority" | "difficulty" | "duration" | "steps" | "flexible">> }
    | { tipo: "mover"; id: string; scheduledAt: string; dueAt: string; startDate: string }
    | { tipo: "completar"; id: string }
    | { tipo: "borrar"; id: string }
    | { tipo: "moverA"; ids: string[]; destino: Destino }
    | { tipo: "crearGrupo"; grupo: Group }
    | { tipo: "crearMesa"; mesa: Workspace };
  export type PasoPlan = Paso & { texto: string; toca: Record<string, string>; eraFija?: boolean }; // toca: id de cosa → updatedAt visto
  export type Plan = { id: string; resumen: string; pasos: PasoPlan[] };
  export function aplicarPaso(d: AppData, p: Paso, now: number): AppData;
  export function probar(d: AppData, pasos: PasoPlan[], marcados: boolean[], now: number): { data: AppData; errores: (string | null)[] };
  export function aceptar(d: AppData, plan: Plan, marcados: boolean[], now: number): AppData;
  ```
- **`aplicarPaso`** reusa las funciones de la app:
  - `crear` → `saveItem`; `editar` y `mover` → `saveItem` sobre la cosa actual;
  - `completar` → `saveItem` con `status: "completado"`, que da los puntos como a mano;
  - `borrar` → `deleteItem`; `moverA` → `moverItems`;
  - `crearGrupo` → `crearGrupo(d, grupo, grupo.id)`; `crearMesa` → `crearMesa(d, name, color, id)`.
  - Una cosa inexistente o borrada lanza «Esa cosa ya no existe.»
- **`probar`** aplica en orden solo los marcados.
  - Un paso marcado que usa un id creado por un paso **desmarcado** (en `moverA.ids`, `destino` o `grupo.parentId`) lleva el error `Depende de «<texto del paso desmarcado>», que desmarcaste.` y no se aplica.
  - Cualquier otro error queda en su fila.
- **`aceptar`**:
  - si alguna cosa de `toca` (de los pasos marcados) tiene otro `updatedAt` o ya no existe, lanza «Algo cambió, pídeselo de nuevo.»;
  - si hay errores en `probar`, lanza el primero;
  - si no, devuelve los datos con todo aplicado.

- [ ] **Step 1: Pruebas (fallan)** en `tests/agente.cjs`:
  - `plan: se prueba sobre una copia` (los datos originales no cambian);
  - `plan: un paso inválido devuelve su error` (crear un Evento sin fecha);
  - `plan: desmarcar deja esa cosa igual`;
  - `plan: depende de un paso desmarcado` (crear grupo desmarcado + mover adentro);
  - `plan: algo cambió`;
  - `plan: cambios en otras cosas no bloquean` (Review Focus 3);
  - `plan: completar da los mismos puntos que a mano`;
  - `plan: borrar va a la papelera`;
  - `plan: grupo nuevo y mover adentro`.

  Registrar en `run.cjs` la compilación de `src/utils/agente/plan.ts` (sale a `.test-build/agente/`) y `require("./agente.cjs")`.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit**

  `V2/D: plan de cambios sobre una copia`.

---

### Task 5: Contexto y herramientas

**Files:**
- Create: `front/src/utils/agente/contexto.ts`, `front/src/utils/agente/herramientas.ts`
- Modify: `front/tests/agente.cjs`, `front/tests/run.cjs`

**Interfaces:**
- Consumes: `Plan`, `PasoPlan` y `probar` (Task 4); `correrDesde` y `buscarHueco` (Task 3); `Declaracion` y `Llamada` (Task 1); `timedItems`, `moverAFecha` y `parseDateInput`.
- Produces:
  ```ts
  // contexto.ts
  export function contexto(d: AppData, now: number): string;
  export function historial(d: AppData, n?: number): Turno[]; // últimos n (20) mensajes; los de plan se resumen como "[Plan · N cambios: estado]"
  // herramientas.ts
  export const DECLARACIONES: Declaracion[];
  export type Efecto = { resultado: Record<string, unknown>; pasos: PasoPlan[] };
  export function ejecutar(d: AppData, previos: PasoPlan[], l: Llamada, now: number): Efecto;
  ```
- **`contexto`** contiene, en este orden:
  1. una línea «Ahora:» con el día de la semana, la fecha y la hora local, y la jornada;
  2. las mesas (nombre e id);
  3. los grupos (nombre, id, mesa y si es rutina, con su repetición);
  4. una línea por cosa: id, tipo, «título», inicio/plazo como `AAAA-MM-DD HH:mm`, duración, `fija`/`flexible`, estado, mesa y grupo.
  - Ventana: `scheduledAt` o `dueAt` desde **ayer 00:00 hasta hoy+14 23:59**, más las pendientes sin fecha.
  - Notas e ideas: solo título. Nunca descripción, contenido ni adjuntos.
  - Sin modelos de rutina.
- **Herramientas** (nombres exactos):
  - `buscar(texto?, desde?, hasta?)` y `buscarHueco(id? | duracion?, desde?, hasta?)`: solo resultado.
  - `crear(tipo, titulo, inicio?, plazo?, duracion?, mesa?, grupo?, fija?)`;
  - `editar(id, titulo?, descripcion?, prioridad?, dificultad?, duracion?, pasos?)`;
  - `mover(id, inicio?, dia?, sinFecha?)`;
  - `correrDesde(minutos, desde?)`;
  - `completar(id)` y `borrar(id)`;
  - `moverA(ids, mesa, grupo?)`;
  - `juntarEnGrupo(ids, nombre)`, que arma **2 pasos**: `crearGrupo` + `moverA`;
  - `crearGrupo(nombre, mesa, padre?, repetir?, dias?)` y `crearMesa(nombre)`.
- **Reglas de las herramientas:**
  - Las fechas llegan como `AAAA-MM-DD HH:mm` (se leen con `parseDateInput`). `mesa` y `grupo` aceptan id o nombre exacto, sin importar mayúsculas.
  - Cada paso nuevo se valida con `probar(d, [...previos, ...nuevos], todosMarcados)`. Si falla: `{ resultado: { error }, pasos: [] }`.
  - `mover` de una cosa con `flexible === false` lleva `eraFija: true`.
  - `correrDesde` agrega un paso `mover` por cada `Corrimiento` que cabe. Devuelve `{ corridas, noCaben: [{ id, titulo }] }` para que Gemini proponga otro día.
  - `texto` de cada paso, por ejemplo: «Gimnasio 9:30 → 9:50», «Nueva tarea «Dentista» · mar 10:00», «Completar «Compra»», «Borrar «Reunión» (a la papelera)», «Mover «X» a Universidad».
  - Herramienta desconocida o argumento faltante: `{ error: "No entendí ese pedido." }`.

- [ ] **Step 1: Pruebas (fallan)**
  - `contexto: ventana de ayer a hoy+14`;
  - `contexto: sin adjuntos ni contenido de notas`;
  - `contexto: sin modelos de rutina`;
  - `historial: últimos 20`;
  - `herramientas: crear arma la cosa en General`;
  - `herramientas: crear evento sin fecha devuelve error`;
  - `herramientas: correrDesde agrega lo que cambia y avisa lo que no cabe`;
  - `herramientas: mover algo fijo queda marcado`;
  - `herramientas: buscar fuera de la ventana`;
  - `herramientas: juntarEnGrupo arma dos pasos`;
  - `herramientas: id inventado o borrado` (Review Focus 1), que espera `«Esa cosa ya no existe.»`;
  - `herramientas: pedido desconocido`;
  - `herramientas: cada declaración tiene su ejecución` (los `name` de `DECLARACIONES` = las herramientas que acepta `ejecutar`).
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implementar y registrar los archivos en `run.cjs`.
- [ ] **Step 4:** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit**

  `V2/D: contexto y herramientas de Neka`.

---

### Task 6: Conversación (ciclo de vueltas) e instrucciones

**Files:**
- Create: `front/src/utils/agente/conversar.ts`
- Modify: `front/tests/agente.cjs`, `front/tests/run.cjs`

**Interfaces:**
- Consumes: `Cerebro` y `Sesion` (Task 1); `contexto`, `historial`, `DECLARACIONES` y `ejecutar` (Task 5); `Plan` (Task 4).
- Produces:
  ```ts
  export const INSTRUCCIONES: string;
  export const TOPE_VUELTAS = 5;
  export const ESPERA_MS = 30000;
  export type Fallo = "sin-ia" | "tarde" | "no-oi";
  export type Contestacion = { respuesta: string; plan: Plan | null; fallo?: Fallo; motivo?: string }; // motivo: mensaje técnico del error, para la consola en desarrollo
  export function conversar(c: Cerebro, d: AppData, texto: string, now: number, esperaMs?: number): Promise<Contestacion>;
  export function oir(c: Cerebro, audio: AudioGrabado, esperaMs?: number): Promise<{ texto: string; fallo?: Fallo }>;
  ```
- **El ciclo:**
  - `sesion(INSTRUCCIONES + "\n\n" + contexto(d, now), historial(d), DECLARACIONES)`, después `enviar(texto)`.
  - Mientras haya llamadas y queden vueltas (máximo 5): `ejecutar` cada una sobre los pasos acumulados y `devolver` los resultados.
  - Si al terminar hay pasos, el plan es `{ id: uid(), resumen: "N cambio(s)", pasos }`.
  - Si se acabaron las vueltas con llamadas pendientes, `respuesta` = el texto de Gemini, o «No logré armarlo del todo.» si viene vacío.
- **Los fallos:**
  - El cerebro lanza → `fallo: "sin-ia"` y la respuesta «Ahora no puedo pensar con IA; te dejo lo de siempre.»
  - Pasa `esperaMs` → `fallo: "tarde"` y «No alcancé, inténtalo de nuevo.»
  - `oir` con texto vacío → `fallo: "no-oi"` y «No te escuché bien, ¿me lo repites?»
- **`INSTRUCCIONES`** (en español; el ejecutor las redacta con este contenido):
  - Eres Neka, la asistente de Nekal. Hablas con tuteo y en un máximo de 2 oraciones, porque la respuesta se lee en voz alta.
  - Para cualquier cambio usas herramientas, nunca dices que ya lo hiciste: dices «te propongo…», porque la persona acepta en pantalla.
  - «Voy atrasado N» → `correrDesde`. Si no dice cuánto, preguntas.
  - No mueves algo «fija» salvo que la persona lo nombre.
  - Usas los ids del contexto y `buscar` para lo que no está.
  - Si algo es ambiguo, preguntas antes de proponer.
  - Para «arregla los choques» propones mover lo flexible con `buscarHueco`.

- [ ] **Step 1: Pruebas con un cerebro falso (fallan)**

  El cerebro falso devuelve respuestas guionadas y registra lo que recibe.
  - `conversar: responde sin herramientas`;
  - `conversar: dos vueltas arman un plan`;
  - `conversar: el error de una herramienta vuelve a Gemini` (el segundo `devolver` recibe `{ error }`);
  - `conversar: tope de 5 vueltas`;
  - `conversar: sin IA si el cerebro falla`;
  - `conversar: tarde si pasa el tiempo` (`esperaMs` 10 y una promesa que nunca resuelve);
  - `oir: audio vacío pide repetir`;
  - `conversar: el contexto va en las instrucciones`.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implementar y registrar en `run.cjs`.
- [ ] **Step 4:** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit**

  `V2/D: conversación de Neka con herramientas`.

---

### Task 7: Mensajes y proveedor de Neka

**Files:**
- Create: `front/src/utils/agente/mensajes.ts`, `front/src/utils/NekaContext.tsx`
- Modify: `front/tests/agente.cjs`, `front/tests/run.cjs`, `front/src/navigation/TabNavigator.tsx` (envuelve con `NekaProvider`)

**Interfaces:**
- Consumes: `Message` y `EstadoPlan` (Task 2); `conversar` y `oir` (Task 6); `crearCerebro` y `leerAudio` (Task 1); `aceptar` (Task 4).
- Produces:
  ```ts
  // mensajes.ts
  export function nuevoMensaje(text: string, isUser: boolean, extra?: { audio?: boolean; plan?: string; estado?: EstadoPlan }): Message; // sin extra: 3 claves; con extra: las 6
  export function agregar(d: AppData, ...m: Message[]): AppData; // conserva los últimos 100
  export function marcarPlan(d: AppData, mensajeId: string, estado: EstadoPlan): AppData;
  export type EstadoVisible = "pendiente" | "aceptado" | "descartado" | "vencido";
  export function estadoVisible(m: Message, pendienteId: string | null): EstadoVisible;
  // NekaContext.tsx
  export type Origen = "chat" | "rapido";
  export type Neka = {
    pensando: boolean; grabando: boolean; sinIA: boolean;
    voz: boolean; setVoz(v: boolean): void;
    pendiente: { mensajeId: string; plan: Plan; pregunta: string; respuesta: string; origen: Origen } | null;
    hoja: boolean; abrirPlan(mensajeId: string): void; cerrarHoja(): void;
    error: string;
    enviar(texto: string, origen: Origen): Promise<void>;
    empezarGrabar(): Promise<void>; soltar(origen: Origen): Promise<void>;
    aceptar(marcados: boolean[]): void; descartar(): void;
    leer(texto: string): void;
  };
  export function NekaProvider(p: { children: ReactNode }): JSX.Element;
  export function useNeka(): Neka;
  ```
- **`enviar`:**
  - Si `pensando`, no hace nada: nada de dos turnos a la vez.
  - Agrega el mensaje de la persona y llama `conversar(crearCerebro(), data, texto, Date.now())`.
  - Agrega la respuesta. Si hay plan, agrega `nuevoMensaje("", false, { audio: false, plan: resumen, estado: "pendiente" })`, guarda `pendiente` y abre la hoja.
  - Si `voz`, hace `Speech.speak(respuesta, { language: "es-CL" })`.
  - `fallo === "sin-ia"` deja `sinIA = true` hasta el próximo turno que funcione. En `__DEV__` se registra `motivo` con `console.warn` (spec §6: App Check que falla).
- `aceptar` de `plan.ts` se importa como `aceptarPlan` para no chocar con el método del contexto.
- **`empezarGrabar` / `soltar`:**
  - Pide permiso la primera vez. Si lo niega, `error` = «Activa el micrófono para Nekal en Ajustes del iPhone.»
  - `Speech.stop()` antes de grabar. Corta sola a los 60 s.
  - `soltar` → `leerAudio` → `oir`. El mensaje de la persona es `nuevoMensaje(texto, true, { audio: true, plan: "", estado: "" })`, y después `enviar` sigue con ese texto.
- **`aceptar`:** `change(d => marcarPlan(aceptar(d, plan, marcados, Date.now()), mensajeId, "aceptado"))`. Si lanza, el mensaje va a `error` y la hoja sigue abierta.
- **`descartar`:** `marcarPlan(..., "descartado")`.
- La voz se guarda en AsyncStorage `neka:voz` (por defecto `true`).

- [ ] **Step 1: Pruebas (fallan)**
  - `mensajes: tres o seis claves`;
  - `mensajes: tope de 100`;
  - `mensajes: marcar plan`;
  - `mensajes: pendiente ajeno se ve vencido` (Review Focus 4): un mensaje con `estado: "pendiente"` cuyo id no es el pendiente en memoria → `"vencido"`.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implementar `mensajes.ts` (registrarlo en `run.cjs`), `NekaContext.tsx` y el proveedor en `TabNavigator`.
- [ ] **Step 4:** `npm test` y `npm run typecheck`. Expected: PASS.
- [ ] **Step 5: Commit**

  `V2/D: proveedor de Neka (conversación, plan, audio y voz)`.

---

### Task 8: Chat nuevo y hoja del plan

**Files:**
- Create: `front/src/utils/agente/dia.ts`, `front/src/components/ui/neka/HojaPlan.tsx`, `DiaPlan.tsx`, `TarjetaPlan.tsx`, `InterruptorVoz.tsx`, `ChatSinIA.tsx`
- Modify: `front/src/pages/Chat.tsx`, `front/src/components/ui/ChatUi/ChatMessage.tsx`, `ChatInput.tsx`, `front/tests/agente.cjs`, `front/tests/run.cjs`
- Delete: `front/src/components/ui/neka/PruebaNeka.tsx` y el botón «Prueba IA»

**Interfaces:**
- Consumes: `useNeka()` (Task 7) y `Plan` (Task 4).
- Produces:
  ```ts
  export type Bloque = { id: string; titulo: string; inicio: number; fin: number; tipo: "antes" | "despues" | "fijo"; paso?: number };
  export function bloquesDelDia(d: AppData, plan: Plan, marcados: boolean[]): { dia: string; desde: number; hasta: number; bloques: Bloque[] } | null;
  // HojaPlan: { visible, pregunta, audio, respuesta, plan, error, onAceptar(marcados), onDescartar, onAbrirChat?, onCerrar }
  ```
- **`bloquesDelDia`:**
  - Usa el día local del primer paso con horario. `null` si ningún paso tiene horario.
  - Por cada paso de ese día: `antes` (si tenía hora ese día) y, si está marcado, `despues`.
  - Agrega las cosas fijas pendientes de ese día dentro del tramo como `fijo`.
  - El tramo va de la hora entera ≤ el menor inicio a la hora entera ≥ el mayor fin.
  - Los pasos de otros días no generan bloques.
- **`HojaPlan`** (maqueta 02 + spec §5.2), con `Sheet`:
  - Arriba, lo que dijiste (con ícono de micrófono si fue audio) y la respuesta con el botón de parlante.
  - `DiaPlan`:
    - una columna de horas;
    - `antes` con borde punteado `color.lineStrong`;
    - `despues` con `color.primarySoft` y borde `color.primary`;
    - `fijo` con candado (`lock-closed-outline`);
    - la línea «ahora» en `color.danger` si cae en el tramo.
  - La lista de pasos **siempre visible**, todo marcado, con casillas de 44 pt. Cada error de `probar` va en su fila con `tone="danger"`. Un paso con `eraFija` muestra «era fija».
  - Botones «Aceptar N cambio(s)» (deshabilitado con 0 marcados o con errores) y «Descartar»; también «Abrir chat» si `onAbrirChat` existe. `error` va arriba de los botones.
- **Chat:**
  - Encabezado «Neka» con `InterruptorVoz` a la derecha y, debajo, el texto de privacidad.
  - `ChatMessage` muestra la burbuja de audio (ícono `mic-outline`, el texto en cursiva como «lo que entendió») y, en las de Neka, un botón `volume-medium-outline` que llama `leer`.
  - Los mensajes con `plan` se dibujan como `TarjetaPlan` («Plan · N cambios» + Pendiente/Aceptado/Descartado/«Ya no está disponible»; tocar una pendiente → `abrirPlan`).
  - Atajos «Voy atrasado», «¿Qué tengo hoy?» y «Arregla los choques».
  - `ChatInput` suma el micrófono: mantener = `empezarGrabar`, soltar = `soltar("chat")`. Con `Pressable` `onPressIn`/`onPressOut`.
  - Mientras `pensando`, una burbuja «Neka está pensando…».
  - **Modo sin IA** (`sinIA` o Firebase sin configurar): se ven las secciones actuales («Choques», «Buscar hueco», crear y rutina) y el `send` por palabras clave. Ese código se mueve tal cual a `components/ui/neka/ChatSinIA.tsx`.

- [ ] **Step 1: Pruebas (fallan)**
  - `dia: antes punteado y después violeta`;
  - `dia: desmarcado no tiene después`;
  - `dia: tramo redondeado a la hora`;
  - `dia: plan sin horarios no dibuja`;
  - `dia: pasos de otro día solo en la lista` (Review Focus 2).
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implementar `dia.ts` (registrarlo en `run.cjs`), los componentes y el chat.
- [ ] **Step 4: Verificación en el navegador** (375×812, cuenta de prueba)
  - Escribir «voy atrasado 20 minutos». Expected: la hoja muestra el día dibujado y la lista toda marcada.
  - Desmarcar un paso. Expected: su bloque violeta desaparece y el botón cuenta uno menos.
  - Aceptar. Expected: la tarjetita queda «Aceptado» y el Calendario muestra las horas nuevas.
  - Doble toque rápido en enviar. Expected: un solo turno.
  - Con la red cortada (DevTools offline). Expected: aparece «Ahora no puedo pensar con IA; te dejo lo de siempre.» y las secciones de siempre.
  - Captura de pantalla.
- [ ] **Step 5:** `npm test`, `npm run typecheck` y `npm --prefix front run build:web` en verde.
- [ ] **Step 6: Commit**

  `V2/D: chat nuevo y plan dibujado en el día`.

---

### Task 9: Acceso rápido (pestaña Neka y Resumen)

**Files:**
- Create: `front/src/components/ui/neka/CapaGrabando.tsx`
- Modify: `front/src/components/ui/base/PressableScale.tsx` (agrega `onLongPress`, `onPressOut` y `accessibilityHint`), `TabBar.tsx`, `NekaCard.tsx`, `front/src/navigation/TabNavigator.tsx`, `front/src/pages/Resumen.tsx`

**Interfaces:**
- Consumes: `useNeka()` (Task 7) y `HojaPlan` (Task 8).
- **Pestaña:** en la pestaña `Chat`, `onLongPress` → `empezarGrabar()` y `onPressOut` (si estaba grabando) → `soltar("rapido")`. Lleva `accessibilityHint` «Mantén apretado para hablarle a Neka». Un toque normal no cambia.
- **`CapaGrabando`** se monta en `TabNavigator`, sobre todo, mientras `grabando`: «Te escucho… suelta para enviar» con el tiempo que lleva.
- **`HojaPlan` global** en `TabNavigator` cuando `pendiente?.origen === "rapido"` y `hoja`. Si el turno no trajo plan, muestra solo la pregunta y la respuesta con «Abrir chat», que navega a `Chat`.
- **`NekaCard`** suma la prop opcional `onMic` y un botón `mic-outline` de 44 pt (mantener/soltar, igual que la pestaña). `Resumen` lo conecta con `useNeka()`.

- [ ] **Step 1:** Implementar.
- [ ] **Step 2: Verificación en el navegador**
  - Desde Espacio, mantener la pestaña Neka con el mouse y soltar. Expected: aparece la capa y después la hoja encima del Espacio, sin cambiar de pantalla.
  - Lo mismo con el micrófono del Resumen.
  - Un clic normal en la pestaña abre el chat.
  - Captura de pantalla.
- [ ] **Step 3:** `npm test`, `npm run typecheck` y `npm --prefix front run build:web` en verde.
- [ ] **Step 4: Commit**

  `V2/D: hablarle a Neka desde cualquier pantalla`.

---

### Task 10: Privacidad, reglas, cierre — puntos de control

**Files:**
- Modify: `front/src/pages/Ajustes.tsx`, `CLAUDE.md`, `DOCUMENTOS/V2/ROADMAP.md`
- Create: `DOCUMENTOS/V2/D_REGISTRO_IMPLEMENTACION.md` (copia del registro, con las decisiones)

- [ ] **Step 1: Ajustes**

  Sección «Neka y tus datos», en 3 oraciones:
  - qué se manda (spec §3);
  - que el audio no se guarda;
  - que en el plan gratis Google puede usar los mensajes para mejorar sus modelos.
- [ ] **Step 2: `CLAUDE.md`**

  Una línea en «Reglas» sobre `utils/agente/` (puro y con pruebas; solo `cerebro.ts` importa `firebase/ai`; App Check en `firebase.ts`; token en `.env.development.local`).
- [ ] **Step 3: PUNTO DE CONTROL: reglas**

  Pedir permiso para `npm run deploy:rules`. Publicar **solo** con un sí explícito.
- [ ] **Step 4: PUNTO DE CONTROL: iPhone**

  El usuario prueba los criterios de éxito de la spec §13:
  - el audio «voy atrasado 20 minutos»;
  - «agrega dentista el martes a las 10»;
  - desmarcar;
  - el modo avión, que tiene que dejar el modo sin IA;
  - la voz y su interruptor;
  - mantener la pestaña Neka.
- [ ] **Step 5:** Revisión final de toda la rama (`/code-review`). Los hallazgos importantes se arreglan con una prueba que falle primero; los menores se anotan en el registro.
- [ ] **Step 6:** `npm test`, `npm run typecheck` y `npm --prefix front run build:web` en verde. Actualizar el ROADMAP.
  - Con el permiso del usuario, `git merge --no-ff v2/d-neka-ia` en `main` y borrar la rama.
  - Recordarle el **tope por persona** en la consola (Firebase AI Logic API → Cuotas → solicitudes por minuto por usuario, bajar a 10) y que la web publicada sigue en V1 hasta que pida `npm run deploy`.
