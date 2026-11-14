# V2/H3–H5 · Conexiones: Google y Outlook (correo y calendario)

Spec del 12/11/2026. Reemplaza las fases 3 y 4 y la decisión de servidor (§4) de [H_DIAGNOSTICO_Y_PLAN.md](H_DIAGNOSTICO_Y_PLAN.md). El antiguo «H5 · cierre de tesis» pasa a llamarse **H6**.

## 1. Qué queremos

Que Nekal se conecte, con permiso del usuario, a **Gmail + Google Calendar** y a **Outlook Mail + Outlook Calendar**, para:

- **traer el calendario y mantenerlo en espejo**: lo que se crea, edita, mueve o borra en un lado cambia en el otro;
- **leer y responder correos** dentro de Nekal, con Neka diciendo qué es importante y redactando borradores;
- **conectar al crear la cuenta**: lo primero que se ve es «Conecta tus cuentas» (el tutorial queda para después).

Usuarios: 5–10 (tesis, presentación y cuentas de prueba).

## 2. Decisiones del usuario (12/11/2026)

| Tema | Decisión |
|---|---|
| Servidor | **Ninguno, sin plan Blaze.** La app pide el permiso y habla directo con Google y Microsoft. |
| Plataforma | **Web instalada como app** (Safari → Compartir → Agregar a inicio; también Android y computador). La app nativa se ve al terminar todo. Expo Go queda solo para desarrollo. |
| Correo | **Neka + bandeja**: Neka destaca lo que pide algo («Crear tarea», «Responder») y debajo está la bandeja; abrir, leer, responder, con borrador de Neka. Nada se envía sin tocar «Enviar». |
| Calendario | **Espejo completo**: los eventos externos se traen y se pueden editar o borrar desde Nekal; lo creado en Nekal con hora se copia a un calendario «Nekal» en la cuenta elegida. |
| Neka | «Que todo se conecte»: cuando aceptas un plan de Neka, sus cambios también llegan a Google/Outlook. Por defecto Neka trata los eventos externos como **fijos** y solo los mueve si se lo pides; siempre ves la propuesta antes de aceptar. |
| Orden | H3 conectar cuentas → H4 calendario en espejo → H5 correo con Neka. |
| Tutorial | Fuera de esta etapa (su maqueta sigue en `H_MAQUETA/04`). |

## 3. Fuera de alcance (por ahora)

- Sincronizar con la app cerrada, avisos de correos nuevos y actualizaciones en segundo plano (necesitarían servidor).
- Copiar a Google/Outlook las **rutinas** de Nekal (grupos con `repeat`). Sus ocurrencias siguen solo en Nekal.
- Editar una **serie** completa de un evento repetido desde Nekal: se edita solo esa ocurrencia.
- Adjuntos de correo, carpetas o etiquetas, búsqueda en el correo y redactar correos nuevos desde cero (solo **responder**; «Escribir» queda deseable si sobra tiempo).
- Que Neka lea el correo desde el chat. En esta etapa Neka trabaja con el correo dentro de la parte Correo.
- App nativa (después). El diseño la deja preparada: solo cambian los dos archivos que hablan con internet (§5.1).

## 4. Cómo se conecta (sin servidor)

### 4.1 Google

- Cliente OAuth de tipo **«Aplicación web»** en el proyecto de Google Cloud `nekal-973b2`, con orígenes `http://localhost:8081`, `http://localhost:8082`, `https://nekal-973b2.web.app` y `https://nekal-973b2.firebaseapp.com`.
- Flujo **implícito por redirección de página completa** (`response_type=token`), no por ventana emergente: la página va a Google, el usuario acepta y vuelve con el pase en el `#` de la URL.
  - **Por qué:** en el iPhone, con la web instalada, las ventanas emergentes fallan. La redirección funciona igual en el computador y en el teléfono, y no la bloquea ningún bloqueador.
  - `state` aleatorio guardado en `sessionStorage` y comparado a la vuelta (evita que otra página inyecte un pase).
  - La URL se limpia (`history.replaceState`) apenas se lee el pase.
- **Permisos (scopes):** `openid email profile`, `https://www.googleapis.com/auth/calendar` y `https://www.googleapis.com/auth/gmail.modify`. Con `gmail.modify` se lee, se responde y se marca como leído. Si el usuario destilda alguno en la pantalla de Google, Nekal lo detecta y lo muestra («Falta permiso de correo · Volver a dar permiso»).
- El pase dura **1 hora** y no se renueva solo. Al vencer, la cuenta queda en estado «Toca para actualizar»: un toque rehace la redirección con `prompt=none` y `login_hint`, y vuelve sin preguntar si la sesión de Google sigue abierta.
- Modo **«Testing»** en Google: máximo 100 usuarios de prueba agregados a mano; Google muestra el aviso de app no verificada (se acepta en «Avanzado»). Suficiente para 5–10 personas.

### 4.2 Microsoft (Outlook)

- App registrada en Microsoft Entra:
  - tipo de cuentas: **«cualquier directorio organizativo y cuentas Microsoft personales»**;
  - plataforma **«Single-page application»** con las mismas cuatro direcciones como *redirect URI*.
- Librería oficial **`@azure/msal-browser`**, autoridad `common`, flujo de código con PKCE por **redirección**. El caché va en `localStorage` para que la web instalada recuerde la sesión.
- **Permisos:** `User.Read`, `Calendars.ReadWrite`, `Mail.ReadWrite`, `Mail.Send`, `offline_access`.
- `acquireTokenSilent` renueva solo el pase. El permiso dura unas 24 h desde el último inicio de sesión (límite de Microsoft para apps de una sola página); después pide un toque, igual que Google.
- **Riesgo:** registrar la app con una cuenta personal puede exigir crear una cuenta gratis de Azure (a veces pide tarjeta, sin cobro). Se comprueba en el trámite del día 1 (§9).

### 4.3 Dónde viven los pases

- **Solo en el dispositivo**: Google en `sessionStorage` (vence en 1 h de todas formas) y Microsoft en el caché de MSAL.
- **Nunca en Firestore ni en los registros.**
- En otro dispositivo, la cuenta aparece como conectada (ver §6.2) pero con «Toca para activar aquí».

### 4.4 Web instalable

`manifest` con nombre, ícono de Neka y `display: standalone`, más las etiquetas `apple-mobile-web-app-*`, para que «Agregar a inicio» abra Nekal a pantalla completa. Hay que comprobar en la doc de Expo 57 dónde va la plantilla HTML de la web sin expo-router.

## 5. Estructura del código

Mismo patrón que Neka y Amigos: **lógica pura con pruebas** y **un archivo por servicio que habla con la red**.

### 5.1 Archivos

```
front/src/utils/conexiones/
  tipos.ts          Cuenta, EventoFuera, CorreoResumen, CorreoCompleto, Proveedor ("google" | "microsoft")
  estado.ts         puro: estado de cada cuenta (activa / toca para actualizar / sin permiso de correo / sin activar aquí)
  pase.ts           puro: armar la URL de Google, leer y validar el #pase a la vuelta (state, vencimiento, scopes)
  eventos.ts        puro: Google y Graph → EventoFuera; EventoFuera ↔ Item (día completo, zonas horarias, varios días, cancelados)
  espejo.ts         puro: planDeSincronizacion(...) → qué crear/cambiar/borrar en cada lado (§7)
  correo.ts         puro: Gmail y Graph → CorreoResumen/CorreoCompleto; MIME y base64url → texto; armar la respuesta (RFC 2822 con In-Reply-To/References)
  neka.ts           puro: armar el pedido a Neka para destacar correos y para el borrador; leer su respuesta
  ejemplo.ts        datos de ejemplo de Google y Graph (pruebas y modo invitado)
  google.ts         ÚNICO que llama a googleapis.com (Calendar y Gmail)
  microsoft.ts      ÚNICO que llama a graph.microsoft.com e importa @azure/msal-browser
  falso.ts          proveedor falso con los datos de ejemplo (pruebas y `nekalConexiones()` en invitado)
front/src/utils/ConexionesContext.tsx   une todo: cuentas, pases, sincronización cada ~5 min y al volver a la app
front/src/components/ui/conexiones/     UI (hoja de conectar, filas de cuenta, ícono de origen)
front/src/components/ui/correo/         UI de la bandeja, el correo abierto y el borrador
```

### 5.2 Datos que se guardan

**`Item.origen` (opcional)**, para eventos externos y para lo que Nekal copió afuera:

```ts
origen?: {
  proveedor: "google" | "microsoft";
  cuenta: string;        // correo de la cuenta
  calendario: string;    // id del calendario externo
  idExterno: string;     // id del evento allá (para una ocurrencia, el id de la instancia)
  version: string;       // etag (Google) o changeKey (Graph)
  creadoEn: "fuera" | "nekal";
  sincronizado: string;  // ISO, última vez que ambos lados quedaron iguales
}
```

- Mismo patrón que `Workspace.area`: las reglas aceptan el ítem **con o sin** `origen`, nunca un campo suelto distinto. Hay que tocar `model.ts`, `readBackup`, `syncModel.validateRecords`, `firestore.rules` y sus pruebas (emulador).
- Lo traído de afuera entra a **General** (`workspaceId: "general"`) como `type: "Evento"`, `flexible: false`, `countsForScore: false`.

**`settings/conexiones`**, la lista de cuentas sin pases, para verlas en todos los dispositivos:

```ts
{ cuentas: { proveedor, correo, nombre, calendarioNekal: string, desde: string }[],
  destinoNekal: string,   // correo de la cuenta donde se copia lo creado en Nekal ("" = no copiar)
  ofrecido: boolean }     // ya se mostró «Conecta tus cuentas» al crear la cuenta
```

**Los correos no se guardan**: se leen en vivo y quedan en memoria mientras la app está abierta.

### 5.3 Neka y el resto de la app

- **Atrasadas:** `estaAtrasada` ignora los ítems con `origen.creadoEn === "fuera"`. Una clase que ya pasó no es una tarea atrasada.
- **Planes de Neka:**
  - Neka ve los eventos externos como fijos (`flexible: false`) y con su origen en el contexto.
  - Las instrucciones dicen que no los mueva salvo pedido explícito.
  - Si el plan los toca, la hoja del plan lo marca («Se cambiará también en Google»).
  - Al aceptar, los cambios siguen el camino normal y el espejo los envía.
- **Vistas:** Agenda, Mes, círculo y detalle muestran un ícono pequeño de origen. El detalle dice «De Google · cuenta» y ofrece «Abrir en Google/Outlook».

## 6. Pantallas

Todas con el sistema de diseño (`theme.ts`, `components/ui/base`, `Txt`, Ionicons de línea). Las maquetas están en `H_MAQUETA/05…08` y hay que aprobarlas antes de programar.

### 6.1 «Conecta tus cuentas» (al crear la cuenta)

- Aparece **una vez**, apenas se crea una cuenta nueva (`ofrecido: false`). En modo invitado no aparece.
- Tiene dos botones grandes, **Conectar Google** y **Conectar Outlook**, una línea de qué se trae («tus eventos y tu correo») y **«Ahora no»** siempre visible.
- Tras volver de Google/Microsoft: «Google conectado · traje N eventos». Se puede conectar la otra cuenta o tocar **Continuar**.
- Si algo falla, se explica en una línea con **Reintentar** y «Ahora no» sigue disponible.

### 6.2 Ajustes → «Cuentas conectadas»

Se llama así, no «Conexiones», que en el código ya significa dependencias.

- Cada cuenta en una fila: ícono, correo, estado (Activa · Toca para actualizar · Toca para activar aquí · Falta permiso de correo) y última sincronización.
- Conectar Google y Conectar Outlook.
- **«Lo que creas en Nekal va a:»** elige la cuenta, o «No copiar». La primera cuenta que se conecta queda elegida por defecto.
- **Desconectar**, con confirmación: «Sus eventos se quitan de Nekal y siguen intactos en Google. Lo que creaste en Nekal se queda».

### 6.3 Eventos externos en la app

Ícono de origen en Agenda, Mes, círculo y detalle. Editar y borrar funcionan igual que con cualquier cosa. Si el pase venció, el cambio queda en cola con el aviso «Se enviará a Google cuando actualices».

### 6.4 Pestaña **IA** (antes «Chat»)

- Arriba, un selector **Chat | Correo**. Chat es el chat de Neka de hoy, sin cambios.
- **Correo: solo lo importante** (decisión del 13/11: «no quiero que salga todo, solo lo importante o relacionado con las cosas de la app»). Ver §6.5.
  - Arriba, una línea de Neka: «De 27 correos de esta semana, 4 son para ti».
  - **Lo importante:** ambas cuentas mezcladas por fecha. Cada correo muestra el ícono de su cuenta, el remitente, el asunto, el punto de no leído, **por qué está ahí** («Pide algo · viernes», «Te pregunta algo», «Sobre tu reunión de hoy», «Fecha · 1 dic») y **una acción** (Crear tarea, Responder, Al calendario o Ver).
  - Abajo, una fila discreta: «23 correos más · promociones, avisos y boletines → Ver». Nada se pierde, pero no estorba.
  - Se actualiza tirando hacia abajo.
  - Sin cuentas: «Conecta tu correo» con los dos botones.
- **Correo abierto:**
  - El texto se muestra como **texto plano**: sin HTML, sin imágenes remotas ni píxeles de rastreo.
  - Al abrirlo se marca como leído.
  - **Responder** abre el borrador. **«Que Neka lo escriba»** acepta una indicación opcional («dile que sí, el sábado»).
  - El borrador se puede editar y solo se manda con **Enviar**. Queda en el mismo hilo.
- **Crear tarea:** crea una Tarea con el asunto como título y el remitente y las primeras líneas en la descripción. Si Neka detectó una fecha, se propone como `dueAt`. Antes de guardar se muestra la hoja normal de edición.

### 6.5 Cómo se elige lo importante

El filtro tiene dos pasos, uno gratis y otro con Neka.

1. **Filtro del proveedor (gratis e instantáneo).** Solo se piden correos de los últimos 7 días (máximo 50 por cuenta) que el propio proveedor ya considera personales:
   - Gmail: `in:inbox category:primary newer_than:7d`. Deja fuera las pestañas Promociones, Social, Notificaciones y Foros.
   - Outlook: bandeja de entrada con `inferenceClassification eq 'focused'` (Prioritarios), filtrando por fecha.

   Lo que queda fuera de este paso se cuenta en «N correos más» y se puede ver ahí sin pasar por Neka.
2. **Neka clasifica lo que pasó el paso 1.** Le llegan solo el remitente, el asunto y las primeras líneas. Además recibe los títulos de lo próximo en Nekal (eventos y tareas de los próximos 14 días) y los nombres de las mesas, para reconocer lo relacionado. Por cada correo responde una razón:
   - `pide`: pide algo o tiene un plazo; acción **Crear tarea**;
   - `pregunta`: espera una respuesta tuya; acción **Responder**;
   - `fecha`: trae una fecha, una cita o un evento; acción **Al calendario**;
   - `relacionado`: tiene que ver con algo de Nekal; acción **Ver**, y en el texto se nombra («Sobre tu reunión de hoy»);
   - `nada`: no se muestra en «Lo importante» y queda en «N correos más».

   La respuesta se valida en `conexiones/neka.ts`: razones desconocidas cuentan como `nada` y una fecha debe ser válida.
3. **Memoria corta.** La clasificación de cada correo se guarda en memoria por su id mientras la app está abierta. Así, al actualizar, solo se clasifican los correos nuevos.
4. **Si Neka falla** (sin IA o sin cuota), no se esconde nada. Se muestra la lista del paso 1 completa, con el aviso «Neka no pudo ordenar tu correo; te muestro todo lo principal».

## 7. El espejo del calendario

**Cuándo:** al conectar, al abrir o volver a la app, cada ~5 min con la app abierta, al tirar hacia abajo en Agenda, y justo después de un cambio local que toque algo con `origen` o que deba copiarse.

**Ventana:** de 14 días atrás a 60 días adelante. Google `events.list` con `singleEvents=true` en los calendarios visibles de la cuenta (`calendarList` con `selected`); Graph `calendarView`. Se trae la ventana completa cada vez (pocas cuentas, sin `syncToken`; simple y robusto).

**`planDeSincronizacion(itemsNekal, eventosFuera, cuenta, destinoNekal, ahora)`** es pura y devuelve listas de acciones:

| Caso | Acción |
|---|---|
| Evento afuera sin ítem con su `idExterno` | crear ítem en Nekal (`creadoEn: "fuera"`) |
| Ítem con `origen` y versión distinta afuera | si afuera cambió después de `sincronizado` y Nekal no cambió → actualizar Nekal; si solo cambió Nekal → actualizar afuera; si cambiaron ambos → **gana el más reciente** (`updated` de afuera vs `updatedAt` de Nekal) |
| Ítem con `origen` que ya no está afuera (borrado o cancelado) y está dentro de la ventana | mandar el ítem a la papelera de Nekal (`deletedAt`) |
| Ítem con `origen` y `deletedAt` en Nekal | borrar afuera (queda en la papelera de Google/Outlook) |
| Ítem sin `origen`, con `scheduledAt`, no rutina, no borrado, y `destinoNekal` ≠ "" | crear afuera en el calendario «Nekal» (se crea si no existe) y guardar `origen` (`creadoEn: "nekal"`) |
| Ítem fuera de la ventana | no se toca |

**Conversión:**
- Día completo → `scheduledAt` del día a las 00:00 y `duration` 0, marcado como de día completo para las vistas.
- Varios días → un ítem en el primer día, con `duration` tope 1440 y «hasta el …» en la descripción.
- Hora en la zona del dispositivo.
- Ocurrencias de un evento repetido: cada una es un ítem, con el id de la instancia.

Cada acción afuera que falla por pase vencido queda pendiente: el ítem conserva `updatedAt` > `sincronizado` y se reintenta en la próxima pasada. Así **reconectar nunca duplica**, porque la identidad es `proveedor + cuenta + idExterno`.

## 8. Errores y avisos

| Situación | Qué ve el usuario |
|---|---|
| Pase vencido | fila de la cuenta y aviso de sincronización: «Google: toca para actualizar» (un toque) |
| Permiso destildado | «Falta permiso de correo/calendario · Volver a dar permiso» |
| Sin internet | lo de Nekal funciona igual; el espejo reintenta al volver la red |
| Error de Google/Microsoft (5xx, límites) | reintento en la próxima pasada; un aviso discreto si falla 3 veces seguidas |
| Neka falla al destacar o redactar | la bandeja se ve igual y el borrador queda vacío para escribir a mano |
| Desconectar | confirmación (§6.2); los ítems `creadoEn: "fuera"` de esa cuenta van a la papelera; los `"nekal"` pierden `origen` y se quedan |

## 9. Lo que tiene que hacer el usuario (con guía paso a paso)

1. **Google Cloud** (proyecto `nekal-973b2`):
   - activar *Gmail API* y *Google Calendar API*;
   - pantalla de consentimiento externa en modo Testing, con sus cuentas como usuarios de prueba;
   - cliente OAuth Web con los cuatro orígenes;
   - pasar el **ID de cliente** (es público, no es secreto).
2. **Microsoft Entra:** registrar «Nekal» (cuentas organizativas y personales, SPA con las cuatro direcciones, los 5 permisos) y pasar el **ID de aplicación** (público).
3. Los dos ID van en `front/.env.local` (`EXPO_PUBLIC_GOOGLE_CLIENT_ID`, `EXPO_PUBLIC_MICROSOFT_CLIENT_ID`), que no se commitea.
4. Probar en su iPhone con la web instalada cuando se le pida.

## 10. Pruebas

- **Puras:** `pase`, `estado`, `eventos`, `espejo`, `correo` y `neka`, con los datos de `ejemplo.ts`. Cubren:
  - día completo, zonas horarias, cancelados, instancias;
  - choque en ambos lados y reconectar dos veces = 0 duplicados;
  - MIME multiparte y base64url;
  - respuesta con encabezados de hilo;
  - `state` inválido rechazado.
- **Reglas** en el emulador: ítem con y sin `origen` válidos; `origen` con campos de más o tipos malos, rechazado; `settings/conexiones` válido o inválido. Se escriben primero y se ven fallar.
- **Navegador:**
  - modo invitado (8082) con `nekalConexiones()` y el proveedor falso;
  - después con las cuentas reales del usuario, que inicia sesión él mismo.
- **iPhone** con la web instalada: el ida y vuelta de Google y Microsoft es lo **primero** que se prueba en H3 (riesgo principal).
- Antes de cerrar cada fase: `npm test`, `npm run typecheck`, `npm --prefix front run build:web` y `/code-review`.

## 11. Fases y criterios de aceptación

| Fase | Contenido | Listo cuando |
|---|---|---|
| **H3 · Conectar cuentas** | trámites; web instalable; prueba temprana del ida y vuelta en el iPhone; `pase`/`estado`; `google.ts`/`microsoft.ts` (solo perfil); `settings/conexiones` + reglas; hoja «Conecta tus cuentas» al crear cuenta; «Cuentas conectadas» en Ajustes | conectar y desconectar Google y Outlook en el computador y en el iPhone (web instalada); se ve el correo de cada cuenta; «Ahora no» funciona; los pases no aparecen en Firestore |
| **H4 · Calendario en espejo** | `Item.origen` + reglas + sync; `eventos`/`espejo` con pruebas; sincronización periódica; ícono de origen en las vistas; atrasadas y Neka | conectar → aparecen los eventos; editar en Google se ve en Nekal (≤5 min con la app abierta) y al revés; crear en Nekal → aparece en el calendario «Nekal»; borrar en ambos sentidos; reconectar 2 veces = 0 duplicados; Neka no mueve eventos externos sin pedírselo |
| **H5 · Correo con Neka** | pestaña IA (Chat \| Correo); filtro de dos pasos (§6.5) y «N correos más»; correo abierto en texto; marcar leído; Neka redacta; responder en el hilo; crear tarea y llevar al calendario | con correos reales, «Lo importante» deja fuera promociones y avisos y cada fila dice por qué está; una respuesta enviada desde Nekal llega en el mismo hilo, en Gmail y en Outlook; crear tarea y llevar al calendario desde un correo funcionan; si Neka falla se ve todo lo principal |

Cada fase tiene su plan (`H3_PLAN_IMPLEMENTACION.md`, etc.), su rama `v2/h3-…` y su registro, como en las fases anteriores.

## 12. Riesgos

| Riesgo | Plan |
|---|---|
| Microsoft exige cuenta de Azure | se descubre el día 1 en el trámite. Si no se puede, H4 y H5 siguen solo con Google y Outlook queda para después |
| Redirección rara en la web instalada del iPhone | es lo primero que se prueba en H3; plan B: abrir la conexión en Safari normal (no instalada), que comparte la sesión de Google |
| Pase de Google de 1 h molesta | un toque y sin volver a aceptar; si molesta mucho, revisar después (servidor u app nativa) |
| Gemini recibe datos del correo | solo remitente, asunto y primeras líneas para destacar; el texto completo solo al pedir un borrador; se avisa una vez en Correo |
| `Item` más grande toca reglas y sync | campo opcional con el patrón de `area`, pruebas en el emulador antes de publicar y publicar reglas solo con permiso |
