# V2 · Subproyecto D — Neka con IA

Especificación del diseño aprobado en brainstorming el 19 de octubre de 2026. Parte del [ROADMAP](ROADMAP.md).

- Maquetas (no se borran): [D_MAQUETA/](D_MAQUETA/). **01**: opciones del plan y del acceso rápido. **02**: las pantallas aprobadas, con el ajuste de §5.2 (el plan se ve igual desde el chat y desde otra pantalla, con la lista siempre visible).

## 1. Objetivo

Neka pasa de reconocer palabras clave a entender lo que le dices, escrito o hablado. Ayuda con todo lo que haces en la app con tus cosas, y el caso estrella es "voy atrasado": mandas un audio rápido y Neka corre lo necesario. **Nunca cambia nada sin tu "Aceptar"**. Es el patrón que la V1 ya usa en "Buscar hueco".

## 2. Decisiones

| Tema | Decisión |
|---|---|
| Cerebro | **Gemini con Firebase AI Logic**, usando la API gratis de Gemini (Gemini Developer API). El proyecto sigue en el plan gratis (Spark): sin tarjeta y sin servidor propio. Se usa el modelo Flash gratis; el nombre exacto se confirma en la prueba (§10, paso 1). Groq se descartó porque necesitaba un servidor propio para esconder la clave y su cupo por minuto es chico. |
| Motor | **Herramientas, y la app calcula.** Gemini no toca datos ni calcula horas: pide herramientas (§4). La app hace las cuentas con su lógica y prueba cada paso sobre una copia. |
| Qué puede hacer | Todo lo que haces a mano con cosas, mesas, grupos y rutinas: crear, editar, mover, correr, completar, borrar y ordenar. Quedan fuera los Ajustes y la cuenta. |
| Entrada | Texto, y **audio de hasta 60 s** que Gemini escucha directo. |
| Salida | Texto, más **voz** (la voz del sistema), con un interruptor arriba a la derecha del chat. El interruptor se guarda **en cada dispositivo**. |
| Plan | **Dibujado en tu día**: punteado = antes, violeta = después. Debajo va la lista de cambios, **siempre visible y con todo marcado**, para desmarcar lo que no quieras. |
| Acceso rápido | **Mantener apretada la pestaña Neka** desde cualquier pantalla, más el **micrófono en la tarjeta de Neka del Resumen**. |
| Después del roadmap | Widget del iPhone (idea del usuario). |

## 3. Qué sabe Neka

Cada vez que le hablas, la app le manda a Gemini:

- La fecha y hora local, y la jornada (`preferences.dayStart`–`dayEnd`).
- Los nombres de las mesas y los grupos, indicando cuáles son rutinas.
- Las cosas **desde ayer hasta hoy+14**, más las pendientes sin fecha, en formato corto: id, título, tipo, inicio/plazo, duración, fija o flexible, estado, mesa y grupo. Se excluyen los modelos de rutina (`timedItems`).
- De las notas e ideas, solo el título. **Los adjuntos no se mandan nunca.**
- Los **últimos ~20 mensajes** del chat, como memoria de la conversación.

Lo que está fuera de esa ventana, Neka lo pide con la herramienta `buscar`.

**El audio no se guarda.** Gemini devuelve lo que entendió (la transcripción) junto con la respuesta, y solo ese texto queda en el chat.

**Privacidad.** El texto bajo el título del chat pasa a decir: "Neka usa Gemini de Google. Tú apruebas cada cambio." En Ajustes se explica qué se manda. En el plan gratis, Google puede usar los mensajes para mejorar sus modelos, y eso se dice en Ajustes.

## 4. Herramientas y plan

### 4.1 Herramientas para mirar (no cambian nada)

- `buscar(texto?, desde?, hasta?)`: cosas por título o rango de fechas, incluso fuera de la ventana.
- `buscarHueco(id | duración, desde?, hasta?)`: el primer hueco libre dentro de la jornada. Generaliza `proposeSlot` de `planner.ts`, que respeta duración, dependencias, plazo y lo ya agendado.

### 4.2 Herramientas que agregan un paso al plan

- `crear(tipo, título, inicio?, plazo?, duración?, mesa?, grupo?, fija?)`
- `editar(id, campos)`: título, descripción, prioridad, dificultad, duración y pasos.
- `mover(id, inicio | sinFecha)`: hora exacta o solo día (reusa `moverAFecha`).
- `correrDesde(minutos, desde?)`: ver §4.3.
- `completar(id)` y `borrar(id)`. Borrar manda a la papelera (`deleteItem`) y se puede recuperar.
- `moverA(ids, mesa, grupo?)`, `juntarEnGrupo(ids, nombre)`, `crearGrupo(nombre, mesa, padre?, repetir?)`, `crearMesa(nombre)`. Reusan `estructura.ts`.

Si un paso falla, la herramienta le devuelve el error a Gemini (por ejemplo, "Un evento necesita fecha.") para que lo corrija. El tope es **5 vueltas por mensaje**. Si no lo logra, Neka dice qué no pudo hacer.

**Fija** = `flexible === false` ("Neka puede proponer moverlo" apagado). Eventos, visitas y reuniones vienen fijos por defecto. Neka solo mueve algo fijo **si tú lo nombras**, y en el plan ese paso aparece marcado como "era fija".

### 4.3 Correr desde (voy atrasado)

`correrDesde(minutos, desde = ahora)` corre solo lo necesario, absorbiendo los huecos libres:

1. Toma las cosas de hoy que no son pasivas, no están completadas, tienen hora y terminan después de `desde`, ordenadas por inicio.
2. La primera **flexible** se corre exactamente `minutos`. Su fin queda como cursor.
3. Cada flexible siguiente empieza en `max(su inicio, cursor)`. Si queda encima de algo fijo, pasa al fin de lo fijo. El cursor avanza.
4. Lo fijo no se mueve.
5. Si algo terminaría después de `dayEnd`, el paso se marca **"no cabe hoy"** y Neka propone otro día con `buscarHueco`.
6. Lo que no cambió de hora no entra al plan.

Ejemplo de la maqueta, a las 9:10 con 20 minutos:
- Gimnasio 9:30 (60 min) → 9:50.
- Estudiar 10:30 → 10:50.
- La reunión de las 12:30 es fija y se queda.
- El almuerzo de las 13:30 no cambia.

### 4.4 El plan

- `Plan = { pasos: Paso[], resumen }`. Cada `Paso` guarda la operación, el texto para mostrar ("Gimnasio 9:30 → 9:50") y los ids que toca con su `updatedAt`.
- **Armar.** Cada paso se aplica en orden sobre una **copia** de los datos, con las mismas funciones y validaciones que la edición a mano (`saveItem`, `validateItem`, `estructura.ts`, etc.).
- **Desmarcar.** Los pasos que siguen marcados se vuelven a probar en orden. Si uno dependía de uno desmarcado, se avisa en esa fila (por ejemplo: "va dentro del grupo nuevo que desmarcaste") y no se puede aceptar hasta resolverlo.
- **Aceptar.**
  - Se comprueba que ningún dato tocado haya cambiado (`updatedAt`). Si cambió: "Algo cambió, pídeselo de nuevo".
  - Si no cambió, todo se aplica en **un solo** `change()`.
  - Completar con Neka da los mismos puntos que completar a mano.

## 5. Pantallas

Maqueta [02](D_MAQUETA/02-pantallas.html).

### 5.1 Chat

- Título "Neka". Arriba a la derecha va el interruptor **Voz**, con ícono de parlante.
- Mensaje de audio: forma de onda y duración, con lo que entendió Neka debajo, en cursiva.
- Respuesta de Neka: el texto con el ícono de voz alta. Tocar el ícono la vuelve a leer.
- Cada plan queda en el chat como una tarjetita "Plan · N cambios" con su estado: **Pendiente** (tocarla abre la hoja), **Aceptado**, **Descartado** o **Ya no está disponible**. Un plan pendiente vive solo en memoria: si la app se cierra, la tarjetita pasa a "Ya no está disponible".
- Atajos sobre la caja de texto: "Voy atrasado", "¿Qué tengo hoy?" y "Arregla los choques".
- Caja de texto con micrófono: mantener apretado para grabar y soltar para enviar.
- Las secciones actuales **"Choques"** y **"Buscar hueco"** salen del chat. Solo vuelven en el modo sin IA (§6).
- Mientras Neka piensa, se muestra "Neka está pensando…".

### 5.2 Hoja del plan (igual desde cualquier lugar)

1. Arriba: lo que dijiste (la cita del audio, o el texto) y la respuesta de Neka.
2. Tu día dibujado, solo con el tramo de horas que toca el plan:
   - **punteado** = como estaba;
   - **violeta** = como quedaría;
   - **candado** = fijo;
   - una línea roja marca "ahora".
3. La **lista de cambios siempre visible**, todo marcado. Desmarcar uno borra su bloque violeta. Los pasos que no son de horario (crear sin hora, completar, borrar, mover de mesa) aparecen solo en la lista.
4. Botones: "Aceptar N cambios" y "Descartar". Si se abrió desde otra pantalla, también "Abrir chat".

### 5.3 Acceso rápido

- **Pestaña Neka.** Mantener apretada graba ("Te escucho… suelta para enviar") y soltar envía. La respuesta sale en la hoja §5.2 **encima de la pantalla actual**; si no hay plan, solo la respuesta y "Abrir chat". Un toque normal sigue abriendo el chat.
- **Resumen.** La tarjeta de Neka suma un botón de micrófono que funciona igual.

## 6. Cuando algo falla

| Situación | Qué pasa |
|---|---|
| Sin internet, cupo agotado o Gemini caído | Una línea: "Ahora no puedo pensar con IA; te dejo lo de siempre". El chat vuelve al **modo sin IA**: los comandos y secciones actuales de `Chat.tsx`. |
| Más de 30 s sin respuesta | "No alcancé, inténtalo de nuevo." |
| Audio no entendido | "No te escuché bien, ¿me lo repites?" |
| Micrófono sin permiso | Explica cómo activarlo en Ajustes del iPhone. |
| Plan con datos viejos | No se aplica (§4.4). |
| App Check falla | Se trata como "sin IA" y en desarrollo se registra el motivo en la consola. |

## 7. App Check (obligatorio desde julio de 2026)

Firebase exige App Check para usar Gemini: cada llamada debe probar que viene de la app de verdad. Así nadie puede gastarse el cupo copiando la configuración pública.

| Dónde corre | Cómo prueba que es Nekal |
|---|---|
| Web publicada (`nekal-973b2.web.app`) | **reCAPTCHA v3** (gratis). La clave del sitio es pública y va en `EXPO_PUBLIC_RECAPTCHA_SITE_KEY` (`front/.env.local`). La clave secreta se pega solo en la consola de Firebase. |
| Web local (`localhost:8081`) | **Token de depuración**. No se agrega `localhost` a reCAPTCHA. |
| iPhone con Expo Go | **Token de depuración**. Expo Go no puede usar App Attest, que es la prueba nativa del iPhone. |

- El token de depuración es secreto. Va en **`front/.env.development.local`**: git lo ignora y Expo no lo carga al construir la web de producción (`expo export`). El usuario lo genera en la consola y lo pega él mismo en ese archivo. Si se filtra, se revoca en la consola.
- **Riesgo principal:** que App Check del SDK web de Firebase no funcione dentro de React Native, porque está pensado para el navegador. Lo responde la prueba de §10, paso 1, el primer día.
- Si falla, las salidas en orden de preferencia son:
  - (a) en el iPhone, usar Neka con IA desde la web en Safari (con "Agregar a inicio");
  - (b) un `CustomProvider` de App Check que entregue el token de depuración;
  - (c) un intermediario gratis (Cloudflare Worker) que guarde la clave.
- Lo que se decida queda en el registro de implementación.

## 8. Datos y nube

- **`Message`** suma campos opcionales: `audio?: boolean` (el texto es lo que entendió Neka), `plan?: string` (el resumen) y `estado?: "pendiente" | "aceptado" | "descartado"`. Los mensajes viejos siguen siendo válidos.
  - Cambian `cloudRecords`, `syncModel` y `back/firestore.rules`.
  - **Se publican solo las reglas** (`npm run deploy:rules`), con permiso explícito.
- El interruptor de voz va en AsyncStorage (`neka:voz`), no se sincroniza.
- El plan aceptado entra por el `change()` normal: un solo commit de sincronización. Un plan que supere el límite de la sincronización (400 documentos) se rechaza con un aviso.

## 9. Cómo se construye

- **`utils/agente/`**, lógica pura con pruebas:
  - `contexto.ts`: arma lo de §3;
  - `herramientas.ts`: declaraciones y ejecución sobre la copia;
  - `plan.ts`: armar, desmarcar y aceptar;
  - `conversar.ts`: el ciclo de hasta 5 vueltas, que recibe un `Cerebro` inyectado y se prueba con un cerebro falso.
- **`correrDesde`** y la generalización de `buscarHueco` van en `utils/planner.ts`, junto a `proposeSlot`.
- **`utils/agente/cerebro.ts`**: el **único** archivo que importa `firebase/ai`. Cambiar de proveedor es cambiar este archivo.
- **`utils/firebase.ts`**: inicializa App Check (§7) antes de usar Gemini.
- **`utils/useNeka.ts`**: hook que une conversación, plan pendiente, grabación y voz.
- **Grabar audio:** `expo-audio`. **Voz:** `expo-speech`. Se instalan con `npx expo install` después de leer la documentación de Expo v57 (context7).
- **UI** en `components/ui/neka/`: hoja del plan, día dibujado, burbuja de audio, interruptor de voz y capa de grabación. Se toca `pages/Chat.tsx`, la tarjeta de Neka del Resumen y `navigation/TabNavigator.tsx` (botón de pestaña con pulsación larga).
- `utils/neka.ts` (la tarjeta de estado del Resumen) no cambia.

## 10. Orden de trabajo

Estimación: unas 2 semanas. El roadmap lo tenía para el 30/10–12/11; empieza el 19/10.

1. **Prueba en el iPhone**, como la de Skia: Expo Go más App Check con token de depuración. Grabas un audio, Gemini responde, el teléfono lo lee en voz alta. Lo mismo en la web local.
2. Contexto, herramientas, `correrDesde` y plan, con pruebas.
3. Ciclo de conversación con cerebro falso, y el cerebro real.
4. Chat nuevo y hoja del plan.
5. Audio y voz.
6. Acceso rápido: pestaña y Resumen.
7. Mensajes en la nube y reglas.
8. Revisión final, prueba en el iPhone y mezcla en `main`.

## 11. Pruebas

- **Automáticas** (`npm test`, sin red y sin gastar cupo):
  - contexto: ventana de días, sin adjuntos, sin modelos de rutina;
  - cada herramienta, incluidos los errores;
  - `correrDesde`: el ejemplo de §4.3, fijos, "no cabe hoy" y huecos absorbidos;
  - armar, desmarcar y "algo cambió";
  - el ciclo con un cerebro falso: varias vueltas, tope de 5 y error de herramienta;
  - mensajes nuevos en la sincronización.
- **Reglas:** el cambio en `messages` se revisa con `/security-review`. Las pruebas en emulador necesitan Java 21, que no está instalado.
- **En el navegador:** con la cuenta PruebaClaude y sus 2 semanas de datos.
- **En el iPhone:** las hace el usuario.

## 12. Fuera de alcance

Widget del iPhone, WhatsApp, Neka que habla sin que le preguntes (sugerencias proactivas), cambiar Ajustes o la cuenta, App Attest o App Store, elegir la voz o el idioma, y respuestas que se escriben de a poco (streaming).

## 13. Criterios de éxito

- En el iPhone, el audio "voy atrasado 20 minutos" da en menos de ~10 s el plan correcto de §4.3. Al aceptarlo, los cambios se ven en el computador.
- "Agrega dentista el martes a las 10" crea la cosa correcta en General, con hora y tipo.
- Nada cambia sin "Aceptar". Desmarcar deja esa cosa como estaba.
- Sin internet o sin cupo, el chat sigue funcionando en modo sin IA.
- Pruebas, revisión de tipos y build web en verde. Prueba en el iPhone aprobada por el usuario.
