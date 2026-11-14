# H3 · Conectar cuentas (Google y Outlook): plan de implementación

> **Para quien ejecute:** `superpowers:executing-plans` (ejecución nativa, tarea por tarea, como en D, E, F, H1 y H2). Pasos con casillas `- [ ]`. Ledger en `.superpowers/sdd/H3_PLAN_IMPLEMENTACION/progress.md`; cada decisión fuera del plan es un `Ruling`.

**Meta:** conectar y desconectar Google y Outlook desde Nekal, sin servidor, en la web y en la web instalada del iPhone. Se ofrece al entrar con una cuenta y se administra en Ajustes → «Cuentas conectadas». En esta fase todavía no se traen eventos ni correos (eso es H4 y H5); para probar la conexión se muestran el nombre y el correo de cada cuenta.

**Arquitectura:**
- Dos módulos puros con pruebas: `pase.ts` (URL de Google y lectura de la vuelta) y `estado.ts` (lista de cuentas y su estado).
- Dos únicos archivos que hablan con la red: `google.ts` (flujo implícito por redirección) y `microsoft.ts` (`@azure/msal-browser` por redirección). Los dos son solo web; en Expo Go, `disponible` es `false`.
- `ConexionesContext` los une y guarda en `AppData.conexiones` solo la lista de cuentas, sin pases. Ese dato se sincroniza como `settings/conexiones`.

**Queda para H4** (por YAGNI): `destinoNekal` y `calendarioNekal` de `settings/conexiones` (spec §5.2) y la fila «Lo que creas en Nekal va a» (B1). Se agregan junto con `Item.origen`, en el mismo cambio de reglas.

**Tecnología:** TypeScript, runner propio (`npm test`), Firebase (reglas en emulador), `@azure/msal-browser` (dependencia nueva, solo web), PWA de Expo (`public/index.html` + `manifest.json`).

**Spec:** [H3_CONEXIONES.md](H3_CONEXIONES.md), §2, §4, §5.1, §5.2, §6.1, §6.2, §8, §9 y §11 (fila H3). Maqueta aprobada: [H/05](H_MAQUETA/05-conexiones-correo-calendario.html), cuadros A1, A2, B1 y B2.

## Restricciones globales

- **Git y commits:**
  - Rama `v2/h3-conexiones`; commits `V2/H3: …` con `Co-Authored-By`.
  - Revisar `git diff` antes de cada commit: el formateador reescribe líneas ajenas.
- **TDD en `utils`:**
  - La prueba falla antes de escribir el código.
  - Pruebas nuevas en `front/tests/conexiones.cjs`. Se registran en `run.cjs` (`require`) y se agregan a la lista de `tsc`: `src/utils/conexiones/tipos.ts`, `src/utils/conexiones/pase.ts`, `src/utils/conexiones/estado.ts`.
- **ID de cliente:** en `front/.env.local` (ya están): `EXPO_PUBLIC_GOOGLE_CLIENT_ID` y `EXPO_PUBLIC_MICROSOFT_CLIENT_ID`. Son públicos. **No existe ni se usa ningún secreto de cliente.**
- **Pases (tokens):**
  - Nunca entran a `AppData`, Firestore, `console.log` ni mensajes de error.
  - Google: `sessionStorage`, clave `nekal:pase:google:<correo>`. Microsoft: caché de MSAL en `localStorage`.
- **Scopes exactos:**
  - Google: `openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.modify`.
  - Microsoft: `User.Read Calendars.ReadWrite Mail.ReadWrite Mail.Send offline_access`.
- **Redirección:** `redirect_uri` = `window.location.origin`, sin barra final. Así coincide con lo registrado.
- **UI:**
  - Solo con `styles/theme.ts` y `components/ui/base/`; texto con `Txt`; íconos Ionicons de línea (`logo-google`, `logo-microsoft`). `tests/styles.cjs` lo verifica.
  - Copiar los textos de la maqueta 05.
  - La sección se llama **«Cuentas conectadas»**, nunca «Conexiones».
- **Publicar:** las reglas (`npm run deploy:rules`) y cualquier `hosting` (también canales de vista previa) **solo con permiso explícito** del usuario.
- **Antes de cerrar:** `npm test`, `npm run typecheck`, `npm --prefix front run build:web`, recorrido en el navegador y prueba en el iPhone con la web instalada.

## Revisión de casos que la spec no nombra

| # | Caso | Qué debe pasar | Prueba en |
|---|---|---|---|
| 1 | El usuario cancela en Google («Cancelar» o «Denegar») | Vuelve a Nekal con «No se conectó Google», con Reintentar y «Ahora no»; el `#…` se limpia | Task 1 |
| 2 | Recarga o «atrás» con un `#access_token` viejo, o un `state` que no coincide | Se rechaza, no se guarda nada, se limpia el `#` | Task 1 |
| 3 | La misma cuenta se conecta dos veces | Una sola fila, con `desde` intacto | Task 2 |
| 4 | El pase vence mientras la app está abierta | La fila pasa a «Toca para actualizar» (margen de 60 s) | Task 2 |
| 5 | Datos viejos (respaldo o nube) sin `conexiones` | Se leen con `{ cuentas: [], ofrecido: false }`; la hoja aparece una vez | Task 3 |

**Ruling ya tomado (avisar al usuario):** la hoja «Conecta tus cuentas» aparece **una vez en toda cuenta que todavía no la vio** (`ofrecido: false`), no solo en las recién creadas. Así PruebaClaude y tu cuenta la ven para probar. En modo invitado no aparece nunca.

---

## Archivos

| Archivo | Cambio |
|---|---|
| `front/public/index.html` (nuevo, con `expo customize`), `front/public/manifest.json`, `front/public/icono-192.png`, `front/public/icono-512.png` | web instalable |
| `utils/conexiones/tipos.ts` (nuevo) | tipos compartidos |
| `utils/conexiones/pase.ts` (nuevo) | URL de Google y lectura de la vuelta |
| `utils/conexiones/estado.ts` (nuevo) | normalizar, agregar o quitar cuentas, estado de cada una |
| `utils/model.ts`, `utils/storage.ts`, `utils/syncModel.ts`, `back/firestore.rules` | `AppData.conexiones` ↔ `settings/conexiones` |
| `utils/conexiones/google.ts`, `utils/conexiones/microsoft.ts` (nuevos) | los únicos que tocan la red y `window.location` |
| `utils/ConexionesContext.tsx` (nuevo), `navigation/TabNavigator.tsx` | proveedor y hoja al entrar |
| `components/ui/conexiones/` (nuevo): `LogoCuenta.tsx`, `FilaCuenta.tsx`, `HojaConectar.tsx`, `SeccionCuentas.tsx`, `index.ts` | UI |
| `pages/Ajustes.tsx` | + sección «Cuentas conectadas» |
| `tests/conexiones.cjs` (nuevo), `tests/run.cjs`, `tests/sync.cjs`, `tests/rules.cjs`, `tests/firestore.cjs` | pruebas |

---

### Task 1: tipos y pase de Google (puro)

**Archivos:** crear `utils/conexiones/tipos.ts`, `utils/conexiones/pase.ts` y `tests/conexiones.cjs`; registrar en `run.cjs`.

**Interfaces — produce:**
```ts
// tipos.ts
export type Proveedor = "google" | "microsoft";
export type Cuenta = { proveedor: Proveedor; correo: string; nombre: string; desde: string };
export type Conexiones = { cuentas: Cuenta[]; ofrecido: boolean };
export type PaseGoogle = { token: string; vence: number; scopes: string[] };
export type Permisos = { calendario: boolean; correo: boolean };
export type Vuelta =
  | { ok: true; pase: PaseGoogle }
  | { ok: false; error: "state" | "cancelado" | "necesita_toque" | "sin_pase" };
// pase.ts
export const SCOPES_GOOGLE: string[];   // los 5 de las Restricciones, en ese orden
export function urlGoogle(o: { clientId: string; redirectUri: string; state: string; loginHint?: string; silencioso?: boolean }): string;
export function leerVuelta(hash: string, stateEsperado: string, ahora: number): Vuelta | null; // null si el hash no es una vuelta de Google
export function permisosGoogle(scopes: string[]): Permisos;
```

- [ ] **Step 1: pruebas que fallan** en `tests/conexiones.cjs`:
  - `"conexiones: url de Google"`: con `clientId: "abc"`, `redirectUri: "http://localhost:8081"`, `state: "g.x1"`, la URL empieza con `https://accounts.google.com/o/oauth2/v2/auth?`. Los parámetros son `response_type=token`, `client_id=abc`, `redirect_uri=http://localhost:8081`, `state=g.x1`, `include_granted_scopes=true`, `scope` = `SCOPES_GOOGLE.join(" ")` y `prompt=select_account consent`. Con `silencioso: true, loginHint: "a@b.cl"`: `prompt=none` y `login_hint=a@b.cl`.
  - `"conexiones: vuelta válida"`: con `#access_token=T&expires_in=3599&scope=openid%20https://www.googleapis.com/auth/calendar&state=g.x1` y `ahora = 1000`, devuelve `{ ok: true, pase: { token: "T", vence: 1000 + 3599000, scopes: ["openid", "https://www.googleapis.com/auth/calendar"] } }`.
  - `"conexiones: vuelta rechazada"`: con el `state` distinto, `{ ok: false, error: "state" }`. Con `#error=access_denied&state=g.x1`, `"cancelado"`. Con `#error=interaction_required&state=g.x1` y también con `login_required`, `"necesita_toque"`. Con `#state=g.x1` sin token, `"sin_pase"`. Con `""` o `#code=abc&state=zz` (vuelta de Microsoft), `null`.
  - `"conexiones: permisos"`: `permisosGoogle(SCOPES_GOOGLE)` → `{ calendario: true, correo: true }`; sin `gmail.modify` → `correo: false`.
- [ ] **Step 2:** `npm test` falla porque `pase.js` no existe.
- [ ] **Step 3:** implementar con `URLSearchParams`. Un hash con `state` que no empieza con `g.` es `null`.
- [ ] **Step 4:** `npm test` pasa.
- [ ] **Step 5:** commit `V2/H3: pase de Google (puro)`.

### Task 2: lista de cuentas y estado (puro)

**Archivos:** crear `utils/conexiones/estado.ts`; pruebas en `tests/conexiones.cjs`.

**Interfaces — consume:** `Cuenta`, `Conexiones`, `Proveedor` (Task 1). **Produce:**
```ts
export const CONEXIONES_VACIAS: Conexiones;            // { cuentas: [], ofrecido: false }
export function normalizarConexiones(v: unknown): Conexiones; // inválido o ausente → vacías; filtra cuentas mal formadas; máx. 6
export function agregarCuenta(c: Conexiones, nueva: Cuenta): Conexiones;      // reemplaza la de igual proveedor+correo, conservando su `desde`
export function quitarCuenta(c: Conexiones, proveedor: Proveedor, correo: string): Conexiones;
export type EstadoCuenta = "activa" | "actualizar" | "activar_aqui" | "falta_correo";
export function estadoCuenta(o: { tienePase: boolean; vence: number | null; correoPermitido: boolean; ahora: number }): EstadoCuenta;
export const TEXTO_ESTADO: Record<EstadoCuenta, string>;
// { activa: "Activa", actualizar: "Toca para actualizar", activar_aqui: "Toca para activar aquí", falta_correo: "Falta permiso de correo" }
```

- [ ] **Step 1: pruebas que fallan:**
  - `"conexiones: agregar sin duplicar"`: agregar dos veces `google/a@b.cl` deja 1 cuenta; la segunda trae `nombre` nuevo y conserva el `desde` de la primera. Agregar `microsoft/a@b.cl` deja 2.
  - `"conexiones: quitar"`.
  - `"conexiones: normalizar"`: `undefined`, `null` y `"x"` → `CONEXIONES_VACIAS`. Una cuenta con `proveedor: "yahoo"` o sin `correo` se descarta. 8 cuentas válidas → 6.
  - `"conexiones: estado"`:
    - sin pase → `activar_aqui`;
    - `vence = ahora + 30 000` → `actualizar` (margen de 60 s);
    - `vence = ahora + 3 600 000` y `correoPermitido: false` → `falta_correo`;
    - `vence = null` con pase (Microsoft) → `activa`.
- [ ] **Step 2:** falla. **Step 3:** implementar. **Step 4:** pasa.
- [ ] **Step 5:** commit `V2/H3: cuentas y estado (puro)`.

### Task 3: `AppData.conexiones` ↔ `settings/conexiones` (modelo, sync y reglas)

**Archivos:** `utils/model.ts` (`AppData.conexiones: Conexiones` y `emptyData`), `utils/storage.ts` (`readBackup` usa `normalizarConexiones(d.conexiones)`), `utils/syncModel.ts` (`recordsOf` escribe `settings/conexiones`; `dataOf` lo lee normalizado; `validateRecords` acota cada `correo` y `nombre` a 320 y `desde` a 40), `back/firestore.rules`, pruebas en `tests/sync.cjs`, `tests/rules.cjs` y `tests/firestore.cjs`.

**Regla nueva** (dentro de `validValue`, junto a las otras de `settings`):
```
|| (kind=='settings' && id=='conexiones' && fields(v,['cuentas','ofrecido']) && v.cuentas is list && v.cuentas.size()<=6 && v.ofrecido is bool)
```

- [ ] **Step 1: pruebas que fallan:**
  - `tests/rules.cjs` `"respaldo sin conexiones"`: `readBackup` de un respaldo sin la clave da `conexiones` igual a `{ cuentas: [], ofrecido: false }`.
  - `tests/sync.cjs` `"sync: conexiones va y vuelve"`: `dataOf(recordsOf(d))` conserva `conexiones` con 1 cuenta y `ofrecido: true`, y el registro `settings/conexiones` **no** tiene claves fuera de `cuentas` y `ofrecido`.
  - `tests/firestore.cjs` (emulador, Java 21 en el PATH):
    - acepta `settings/conexiones` válido;
    - rechaza un campo extra (`token: "x"`), `cuentas` con 7 elementos y `ofrecido: "si"`.
- [ ] **Step 2:** `npm test` y `npm run test:firestore` fallan.
- [ ] **Step 3:** implementar el modelo, el sync y la regla.
- [ ] **Step 4:** las dos suites pasan y `npm run typecheck` no da errores.
- [ ] **Step 5:** auditar el cambio de reglas con `firebase-security-rules-auditor` y anotar el resultado en el ledger.
- [ ] **Step 6:** commit `V2/H3: conexiones en el modelo, sync y reglas`.
- [ ] **Step 7 (usuario):** **pedir permiso** para `npm run deploy:rules`. Sin esa publicación, una cuenta real no puede guardar `settings/conexiones` y el sync queda en error. Publicar solo con un «sí».

### Task 4: web instalable

**Archivos:** `front/public/index.html` (desde `npx expo customize public/index.html`, ejecutado en `front/`), `front/public/manifest.json`, `front/public/icono-192.png` y `front/public/icono-512.png`. Los íconos se generan con Pillow desde `assets/Img/Neka_Pose5.png`, centrados en un cuadrado con fondo `#F2F0FA`.

- [ ] **Step 1:** generar `index.html` y agregar en el `<head>`:
  - `<link rel="manifest" href="/manifest.json">`
  - `<link rel="apple-touch-icon" href="/icono-192.png">`
  - `<meta name="apple-mobile-web-app-capable" content="yes">`
  - `<meta name="mobile-web-app-capable" content="yes">`
  - `<meta name="apple-mobile-web-app-status-bar-style" content="default">`
  - `<meta name="apple-mobile-web-app-title" content="Nekal">`
  - `<meta name="theme-color" content="#F2F0FA">`
- [ ] **Step 2:** `manifest.json` con `short_name` y `name` «Nekal», `start_url: "/"`, `display: "standalone"`, `background_color` y `theme_color` `#F2F0FA`, y los dos íconos.
- [ ] **Step 3:** `npm --prefix front run build:web`. En `front/dist/index.html` están las 7 líneas y existen `front/dist/manifest.json` y los íconos. Comprobar que `canvaskit.wasm` sigue en `dist/`.
- [ ] **Step 4:** commit `V2/H3: web instalable (manifest e íconos)`.

### Task 5: `google.ts` (red, solo web)

**Archivos:** crear `utils/conexiones/google.ts`.

**Interfaces — consume:** `urlGoogle`, `leerVuelta`, `permisosGoogle` (Task 1). **Produce:**
```ts
export const googleDisponible: boolean;    // Platform.OS === "web" && !!process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID
export function iniciarGoogle(o?: { loginHint?: string; silencioso?: boolean }): void; // guarda state "g.<aleatorio>" en sessionStorage y navega
export function recogerVueltaGoogle(): Promise<ResultadoGoogle | null>;
export type ResultadoGoogle =
  | { ok: true; cuenta: { correo: string; nombre: string }; permisos: Permisos }
  | { ok: false; error: "state" | "cancelado" | "necesita_toque" | "sin_pase" | "red" };
export function paseGoogle(correo: string): PaseGoogle | null;  // desde sessionStorage
export function olvidarGoogle(correo: string): Promise<void>;    // revoca y borra
```

- **`recogerVueltaGoogle`:**
  - lee `window.location.hash` y limpia el hash con `history.replaceState` **siempre que** `leerVuelta` no sea `null`;
  - si hay pase, pide `GET https://openidconnect.googleapis.com/v1/userinfo` con `Authorization: Bearer` para conocer `email` y `name`;
  - guarda el pase en `nekal:pase:google:<email>`.
- **`olvidarGoogle`:** `POST https://oauth2.googleapis.com/revoke` con `token` en el cuerpo (`application/x-www-form-urlencoded`). Si falla, se ignora; igual se borra el pase.
- [ ] **Step 1:** implementar. El `state` aleatorio sale de `crypto.getRandomValues` (16 bytes en hex).
- [ ] **Step 2:** `npm run typecheck` sin errores.
- [ ] **Step 3:** commit `V2/H3: google.ts`.

### Task 6: `microsoft.ts` (red, solo web)

**Archivos:** `front/package.json` (`npm --prefix front install @azure/msal-browser`; anotar la versión instalada en el ledger) y crear `utils/conexiones/microsoft.ts`.

**Interfaces — produce:**
```ts
export const microsoftDisponible: boolean; // Platform.OS === "web" && !!process.env.EXPO_PUBLIC_MICROSOFT_CLIENT_ID
export function iniciarMicrosoft(o?: { loginHint?: string }): Promise<void>;   // loginRedirect, prompt "select_account"
export function recogerVueltaMicrosoft(): Promise<ResultadoMicrosoft | null>;  // handleRedirectPromise
export type ResultadoMicrosoft =
  | { ok: true; cuenta: { correo: string; nombre: string } }
  | { ok: false; error: "cancelado" | "red" };
export function paseMicrosoft(correo: string): Promise<string | null>;  // acquireTokenSilent; InteractionRequiredAuthError → null
export function actualizarMicrosoft(correo: string): Promise<void>;     // acquireTokenRedirect con loginHint
export function olvidarMicrosoft(correo: string): Promise<void>;        // clearCache({ account }); sin logoutRedirect
```

- MSAL se carga con `import("@azure/msal-browser")` dentro de una función perezosa `msal()`, para que Expo Go nunca la evalúe.
- Configuración: `auth: { clientId, authority: "https://login.microsoftonline.com/common", redirectUri: window.location.origin }` y `cache: { cacheLocation: "localStorage" }`. Se espera `initialize()` antes de usarla.
- `"cancelado"` corresponde a los errores con `errorCode` `user_cancelled` o `access_denied`.
- `correo` = `account.username`; `nombre` = `account.name ?? username`.
- [ ] **Step 1:** instalar e implementar.
- [ ] **Step 2:** `npm run typecheck` y `npm --prefix front run build:web` sin errores.
- [ ] **Step 3:** commit `V2/H3: microsoft.ts`.

### Task 7: `ConexionesContext`

**Archivos:** crear `utils/ConexionesContext.tsx`; envolver en `navigation/TabNavigator.tsx` junto a `AmigosProvider`.

**Interfaces — consume:** Tasks 2, 5 y 6; `useApp()` (`data`, `change`, `user`, `guest`). **Produce:**
```ts
export type CuentaVista = Cuenta & { estado: EstadoCuenta };
export type UltimaConexion = { proveedor: Proveedor; ok: boolean; correo?: string; error?: string; origen: "inicio" | "ajustes" };
export function useConexiones(): {
  disponible: boolean;                  // web y con sesión (no invitado)
  cuentas: CuentaVista[];
  ofrecer: boolean;                     // disponible && !data.conexiones.ofrecido
  ultima: UltimaConexion | null;
  conectar(p: Proveedor, origen: "inicio" | "ajustes"): void; // guarda origen en sessionStorage "nekal:conexion:origen" y redirige
  actualizar(c: Cuenta): void;
  desconectar(c: Cuenta): Promise<void>;
  marcarOfrecido(): void;
  limpiarUltima(): void;
};
```

- **Al montar** (una vez): primero `recogerVueltaGoogle()`, luego `recogerVueltaMicrosoft()`. Si alguna devuelve un resultado:
  - `ok`: `change(d => ({ ...d, conexiones: agregarCuenta(d.conexiones, { proveedor, correo, nombre, desde: new Date().toISOString() }) }))`;
  - en todos los casos, `ultima` toma el origen guardado (por defecto `"ajustes"`).
- **El estado se recalcula** cada 30 s y al volver la app (`AppState`):
  - Google: con `paseGoogle` (vence y permisos);
  - Microsoft: `tienePase = (await paseMicrosoft(correo)) !== null`, `vence: null`.
- **`desconectar`:** olvida el pase y luego `quitarCuenta`.
- **`marcarOfrecido`:** `ofrecido: true`.
- **Solo desarrollo:** `window.nekalConexiones()` (bajo `__DEV__`, como `nekalAmigos()`) muestra dos cuentas de ejemplo en estado en memoria, sin guardar, para revisar la UI en modo invitado. Se usa `G`/`O` de la maqueta: `sofia.rojas@gmail.com` activa y `sofia.rojas@outlook.com` en «actualizar».
- [ ] **Step 1:** implementar. **Step 2:** `npm run typecheck`. **Step 3:** commit `V2/H3: ConexionesContext`.

### Task 8: UI «Conecta tus cuentas» y «Cuentas conectadas»

**Archivos:** crear `components/ui/conexiones/{LogoCuenta,FilaCuenta,HojaConectar,SeccionCuentas,index}.tsx|ts`; modificar `navigation/TabNavigator.tsx` (monta `HojaConectar`) y `pages/Ajustes.tsx` (`<Section title="Cuentas conectadas">` después de «Cuenta»).

- **`HojaConectar`** (maqueta A1/A2). Modal centrado con Neka (Pose3 al pedir, Pose1 al confirmar).
  - **Cuándo se ve:**
    - si `ofrecer` y no hay hojas abiertas (`utils/hojasAbiertas.ts`);
    - si `ultima?.origen === "inicio"`.
  - **A1:** filas Google («Calendar y Gmail») y Outlook («Calendario y correo de Microsoft»), «Ahora no» (`marcarOfrecido`) y «Puedes conectarlas cuando quieras en Ajustes.». Tocar una fila llama a `marcarOfrecido()` y luego a `conectar(p, "inicio")`.
  - **A2 con `ultima.ok`:**
    - título «Google conectado» u «Outlook conectado»;
    - la fila con el correo y el check;
    - la otra cuenta con «Conectar» (si no está ya);
    - el botón «Continuar» (`limpiarUltima`).

    En H3 el texto es «Tu cuenta quedó lista. Pronto Neka traerá tus eventos y tu correo.»; H4 lo cambia a la cantidad de eventos.
  - **Con `ultima.ok === false`:** «No se conectó Google» u «Outlook», con una línea según el error («Cancelaste el permiso.», «Se perdió la conexión. Reintenta.» o «Algo no calzó. Reintenta.»), «Reintentar» y «Ahora no».
- **`SeccionCuentas`** (maqueta B1/B2):
  - una `FilaCuenta` por cuenta: logo, proveedor, correo y estado con su color (`activa` → éxito; las demás → aviso);
  - con `actualizar` o `activar_aqui`, el botón «Actualizar» (`actualizar(c)`);
  - tocar la fila abre un `Sheet` con «Actualizar …» y «Desconectar» en rojo. Desconectar confirma: «Sus eventos se quitan de Nekal y siguen intactos en Google. Lo que creaste en Nekal se queda.»;
  - debajo, «Agregar otra» con dos botones secundarios (Google y Outlook) y la nota del candado: «Nekal nunca ve tu contraseña. El permiso queda solo en este dispositivo y lo puedes quitar cuando quieras.»
  - **Si `!disponible`:** en invitado, «Necesitas una cuenta para conectar Google u Outlook.»; en Expo Go, «Conectar funciona en la versión web de Nekal.».
- [ ] **Step 1:** implementar copiando la maqueta.
- [ ] **Step 2:** `npm test` (incluye `styles.cjs`) y `npm run typecheck` pasan.
- [ ] **Step 3:** en el navegador, modo invitado (`nekal-web-invitado`, 8082) con `nekalConexiones()`: se ven las dos filas, «Actualizar» en Outlook, el Sheet y la confirmación. Captura.
- [ ] **Step 4:** commit `V2/H3: hoja Conecta tus cuentas y Cuentas conectadas`.

### Task 9: prueba real en el computador

Requiere que las reglas de la Task 3 estén publicadas.

- [ ] **Step 1 (usuario):** en `http://localhost:8081`, el usuario inicia sesión con su cuenta. Debe aparecer la hoja A1.
- [ ] **Step 2 (usuario):** conecta Google con una cuenta de prueba. Esperado:
  - pasa por el aviso «app no verificada»;
  - vuelve a A2 con su correo;
  - la URL queda sin `#`;
  - en Ajustes la fila dice «Activa».
- [ ] **Step 3 (usuario):** conecta Outlook. Esperado: A2 o la fila «Activa»; al recargar la página sigue «Activa» (MSAL recuerda la sesión).
- [ ] **Step 4:** comprobar que en `settings/conexiones` solo hay `cuentas` y `ofrecido`. Se ve en la consola de Firebase o con `data.conexiones` en el navegador: ningún token. Buscar en `localStorage` y `sessionStorage` y confirmar que el token de Google solo está en `sessionStorage`.
- [ ] **Step 5 (usuario):** desconecta Outlook; la fila desaparece. Cancela a propósito en Google: aparece «No se conectó Google».
- [ ] **Step 6:** anotar los resultados en el ledger y corregir lo que falle con `superpowers:systematic-debugging`.

### Task 10: prueba en el iPhone con la web instalada

- [ ] **Step 1 (usuario):** **pedir permiso** para publicar un canal de vista previa: `firebase hosting:channel:deploy conexiones --expires 30d --project nekal-973b2`, después de `npm --prefix front run build:web`. Anotar la URL que entrega (`https://nekal-973b2--conexiones-….web.app`).
- [ ] **Step 2 (usuario):** agregar esa URL en Google (orígenes JavaScript **y** URI de redireccionamiento) y en Microsoft (*Autenticación* → SPA). Guía en [H3_GUIA_TRAMITES.md](H3_GUIA_TRAMITES.md).
- [ ] **Step 3 (usuario):** en el iPhone, abrir la URL en Safari, **Compartir → Agregar a inicio**, abrir el ícono, iniciar sesión y conectar Google y Outlook. Esperado:
  - pantalla completa, sin barra de Safari;
  - vuelve a Nekal instalada, no a Safari;
  - las filas quedan «Activa».
- [ ] **Step 4:** si la vuelta abre Safari en vez de la app instalada, aplicar el plan B de la spec §12: conectar desde Safari normal. Anotarlo como `Ruling` y avisar al usuario.

### Task 11: cierre

- [ ] **Step 1:** `superpowers:verification-before-completion`: `npm test`, `npm run typecheck` y `npm --prefix front run build:web`, en verde y con la salida en el ledger.
- [ ] **Step 2:** `/code-review` del diff de la rama y aplicar lo que corresponda.
- [ ] **Step 3:** documentar:
  - copiar el ledger a `DOCUMENTOS/V2/H3_REGISTRO_IMPLEMENTACION.md`;
  - una línea «Conexiones (V2/H3)» en `CLAUDE.md` (dónde viven `conexiones/`, que solo `google.ts` y `microsoft.ts` hablan con la red, y que no hay pases en Firestore);
  - la fila H del `ROADMAP.md`.
- [ ] **Step 4:** mezclar en `main` con `--no-ff` («Mezcla V2/H3: conectar cuentas Google y Outlook») y borrar la rama.
