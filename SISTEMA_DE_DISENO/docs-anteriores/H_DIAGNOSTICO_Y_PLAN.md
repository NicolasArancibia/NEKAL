# V2 · H — Estabilización y conexiones: diagnóstico y plan

Estado: **borrador para aprobación** (1 nov 2026). Nada de esto está implementado. Nace del encargo «Plan de estabilización y evolución» (conversación con GPT) y de la revisión del repositorio en `main` (commit `ff7c4e5`).

Método: lectura del código, la documentación y los registros, `npm test` (261 pruebas, todas pasan) y tres scripts de solo lectura contra la build de pruebas (no modifican el repo). Cada afirmación lleva su evidencia.

Leyenda: **OK** implementado y comprobado · **VER** implementado, falta verificar · **PARCIAL** · **FALTA** pendiente.

---

## 1. Qué está hecho, qué necesita pruebas y qué falta

### Neka y reorganización (encargo §3)

| Punto | Estado | Evidencia |
|---|---|---|
| Compromisos con horario fijo | **OK** | `Item.flexible` (`model.ts:33`; Evento/Visita/Meeting nacen fijos, `model.ts:205`). `correrDesde` los salta (`planner.ts:191`; pruebas «salta lo fijo», `rules.cjs`). El plan marca «· era fija» (`HojaPlan.tsx:108`). |
| Tareas que pueden moverse | **OK** | Mismo campo `flexible`; `proposeSlot` solo mueve flexibles (`planner.ts:97`). |
| Duración | **OK** | `Item.duration`; `primerHueco` la usa (`planner.ts:131`). |
| Prioridad | **FALTA** | `priority` no aparece en `planner.ts` ni en el contexto de Neka (`contexto.ts:32-46`). El modelo no la ve. |
| Fechas límite | **PARCIAL** | La V1 (`proposeSlot`, `findConflicts`) las respeta. La V2 no: `correrDesde` y `buscarHueco` no miran `dueAt` (0 apariciones en `planner.ts:181-236`); solo se las pasa el modelo de IA como texto. |
| Tiempo realmente disponible | **PARCIAL** | Jornada `dayStart/dayEnd` sí (`primerHueco`, `correrDesde`). No considera horas de silencio ni carga del día. Rutinas: `timedItems` deja fuera la plantilla y deja las ocurrencias (`espacio.ts:108`); **VER** que planifique bien con ellas. |
| Rutinas y recurrentes | **VER** | Ver arriba; hay pruebas de rutinas (`rutinas.cjs`) pero no de planificación sobre ocurrencias. |
| Conflictos en cascada | **PARCIAL** | `correrDesde` encadena dentro del día. Nada revisa los conflictos *después* de armar o aplicar un plan (scripts B, C y D abajo). |
| No cabe todo | **PARCIAL** | `correrDesde` devuelve `noCabe` y la instrucción pide ofrecer otro día (`conversar.ts:14`). Depende de que el modelo lo haga; no hay camino determinista «no es viable → alternativas». |
| Pedido → propuesta → validación → confirmación → aplicación → resultado | **OK** (con huecos) | Pruebas `agente.cjs`; prueba en navegador del registro D Task 8 (`D_REGISTRO_IMPLEMENTACION.md:54`). La prueba final completa en iPhone sigue pendiente (ROADMAP, fila D). |
| La propuesta coincide con lo aplicado | **OK** en los pasos / **PARCIAL** en el texto libre | Los textos de cada paso los arma código (`herramientas.ts:249`, `pasoMover`) y la *misma* lista se prueba y se aplica (`plan.ts:106-147`). La frase de Neka (modelo de IA) no está atada a los pasos. |
| Agenda cambia con una propuesta esperando | **PARCIAL** | `aceptar` compara `updatedAt` solo de las cosas que el paso toca (`plan.ts:137-141`). Si entra algo *nuevo* en el hueco destino, acepta y crea un choque (script B). La V1 sí revalida el hueco (`applyProposal`, `planner.ts:237`); la V2 no heredó eso. |
| Recuperación ante error de IA | **OK** | Límite de 30 s por turno, `MENSAJES` por tipo de fallo, vuelta a los atajos sin IA (`conversar.ts`, `ChatSinIA.tsx`); prueba del enum vacío (registro D Task 8). |
| Recuperación ante error de guardado | **OK** con cuenta / **PARCIAL** invitado | Con cuenta, `SyncEngine.change` valida y lanza antes de marcar «aceptado» (`SyncEngine.ts:91`, `NekaContext.tsx:255`). En invitado, `persistLocal` falla *después*, de forma asíncrona (`AppContext.tsx:173-189`): el plan ya se vio aceptado. |

**Las dos observaciones de la revisión visual, resueltas:**

1. **«IA no disponible» en el historial: es histórico, con una causa que sigue viva.** Hubo un 429 por cupo agotado (registro D, línea 27) y un 400 por `enum` con `""` (línea 53), ambos corregidos. Pero cada fallo se guarda como un mensaje normal de Neka (`NekaContext.tsx:137-141`), se sincroniza y queda hasta 100 mensajes (`mensajes.ts:23`). Por eso se sigue viendo. Además, el cupo de Flash-Lite (~500/día) viene de fuentes no oficiales.
2. **«20 minutos» pero 19:30 → 20:00: no es un error de cálculo.** Lo reproduje (script A): Mamá 19:30 + 20 min = 19:50, choca con el Gimnasio fijo, y salta hasta que éste termina (20:00). Es el caso exacto del registro D (línea 54). El defecto real es de *explicación*: el paso dice solo «19:30 → 20:00» y no dice «salta Gimnasio».

**Tres huecos reales encontrados con ejecución** (scripts en el scratchpad de la sesión; en la Fase 1 pasan a ser pruebas que fallan primero):

- **A.** Corrimiento correcto pero sin explicar el salto.
- **B.** Plan pendiente + algo nuevo fijo a las 20:00 → `aceptar` no falla y deja «Mamá se superpone con nuevo-fijo».
- **C.** `mover` de una tarea a las 20:15 sobre una reunión fija 20:00–21:00: sin error, y el plan aceptado crea el choque.
- **D.** `crear` una tarea a las 20:30 sobre esa reunión: igual.

### Conexiones, importación y sincronización (encargo §4 y §5)

| Punto | Estado | Evidencia |
|---|---|---|
| Conectar Google / Outlook / Notion | **FALTA** | Búsqueda de `google|outlook|notion|oauth` en `front/src`: solo aparece Gemini. No hay código de integraciones. |
| Paso de conexiones al crear cuenta | **FALTA** | `Login.tsx` es solo correo + contraseña (importa `createUserWithEmailAndPassword`/`signIn…`); `Bienvenida.tsx` es Login + invitado. |
| Sección Conexiones en Perfil/Ajustes | **FALTA** | Ajustes tiene Cuenta, Neka, Jornada, Tus datos y Sobre Nekal (`Ajustes.tsx`). |
| Origen, id externo, zona horaria, día completo, recurrencia, solo lectura | **FALTA** | `Item` (`model.ts:21-51`) no tiene ninguno. Las reglas de Firestore exigen el conjunto *exacto* de campos (`firestore.rules:15`): agregar un campo toca modelo, sincronización, reglas y pruebas. |
| Servidor | **FALTA** | `back/` solo tiene reglas; `firebase.json` no declara Functions. |
| Base reutilizable | **OK** | `SyncEngine` con cola, reintentos y conflicto local/remoto (`sync.cjs`), y el patrón «un solo archivo habla con la red» (`amigos/nube.ts`, `agente/cerebro.ts`). |

**Choque de nombres:** en el código, «conexiones» ya significa *dependencias entre cosas* (`espacio.ts:91`, `CapaConexiones`). La sección nueva debe llamarse distinto (propuesta: **Cuentas conectadas**) o renombrar la vieja a «Dependencias».

**Restricción técnica que condiciona todo (verificada en la doc de Expo):** *Expo Go no sirve para probar OAuth* (no permite esquema propio; hace falta un development build). Tú pruebas en iPhone con Expo Go. Ver §4 (decisión de servidor).

### Vistas (encargo §6)

| Punto | Estado | Evidencia |
|---|---|---|
| Círculo del tiempo | **OK** funciona / **VER** legibilidad | `acomodo/tiempo.ts`. Con 126 elementos sintéticos (24 hoy, 16 mañana, 50 semana, 36 sin fecha): en 390 px, 0 pares a menos de 11 px; en 340 px, 2 pares (5 si todo está en una sola mesa); nada invade el anillo siguiente ni sale del lienzo. Los puntos van a 14 px entre centros y **sin nombre**: el problema es de legibilidad, no de geometría. Falta medirlo con tus 126 reales. |
| Hoy / próximos / atrasados / sin fecha | **PARCIAL** | Anillos hoy, mañana, ventana y sin fecha existen; «atrasado» solo como estado de color (`estadoDe`). |
| Agrupar cuando hay demasiados | **FALTA** | Solo pasa a otra fila 14 px más afuera (`tiempo.ts`). |
| Propuestas de Neka en el círculo | **FALTA** | El día dibujado vive solo en la hoja (`DiaPlan.tsx`). |
| Agenda/lista | **PARCIAL** | `Calendario.tsx`: mes + lista del día con hora, filtros por mesa y tipo, marcar hecho. Falta: varios días seguidos, duración visible, choques/atrasados marcados, Neka en contexto. |
| Vista 3D (Mesas) | **OK** | Es la vista **por defecto** (`useEspacioPrefs.ts:15`) y una de tres en `VistaSelector.tsx:8-12`. |
| Plano y «conexiones» | **VER** | Plano es la forma de entrar a mesas/grupos; `CapaConexiones` dibuja flechas de dependencias, que alimentan los conflictos `dependency`. |

### Arquitectura y resto (encargo §7 y §9)

| Punto | Estado | Evidencia |
|---|---|---|
| Inteligencia aislada | **OK** | Solo `agente/cerebro.ts` importa `firebase/ai`; interfaz `Cerebro` en `tipos.ts`. |
| Orquestación | **PARCIAL** | Existe (`conversar.ts` hasta 5 vueltas; `plan.ts` probar/aceptar) pero no *verifica el resultado* (huecos B, C, D). |
| Conectores | **FALTA** | No hay interfaz. |
| Gamificación, perfil, amigos | **OK** | Pruebas verdes; F aprobada en iPhone el 26/10. E: falta la prueba completa en iPhone (ROADMAP). |
| Espacios compartidos (G) | **FALTA** | Ningún código (las coincidencias de «compartid» son comentarios). |
| Nota | — | `CLAUDE.md` aún dice «Prueba física en iPhone pendiente desde V1»: está desactualizado, ya hubo pruebas en D y F. |

---

## 2. Qué se reutiliza y qué cambia

**Se reutiliza tal cual:** `SyncEngine` y su cola; `Item`, mesas y grupos; `planner.ts` (`primerHueco`, `buscarHueco`, `correrDesde`); `agente/` entero (herramientas, plan, conversar); `HojaPlan` y `DiaPlan`; `TiempoVista`; `Calendario`; componentes `base/`; el patrón `AmigosContext` + `nube.ts` para un `ConexionesContext`; la papelera (`deletedAt`) para «quitar lo importado» de forma recuperable.

**Cambia:** `model.ts` (campos de origen) + `firestore.rules` + `cloudRecords`/`syncModel` + pruebas; `planner.ts` (plazo, prioridad); `plan.ts` (validación posterior); `contexto.ts` (prioridad, origen, solo lectura); `NekaContext.tsx` (fallos fuera del historial permanente); `VistaSelector`/`useEspacioPrefs`/`EspacioTrabajo` (sacar Mesas); `TiempoVista` (nombres y agrupación); `Calendario` (modo agenda); `Login`/`Bienvenida` (paso de conexiones); `Ajustes`/`Perfil` (Cuentas conectadas).

**No se toca:** gamificación, amigos, logros, sistema visual. Lo importado entra con `countsForScore: false` para no inflar el puntaje.

---

## 3. Plan por fases

| Fase | Contenido | Depende de | Criterio de aceptación | Esfuerzo |
|---|---|---|---|---|
| **0** | Maquetas de partida y manifiesto (ver §5); prueba física pendiente de D y E; actualizar `CLAUDE.md` | — | Existe `H_MAQUETA/` con índice; lista de pruebas en iPhone con fecha | 0,5 d |
| **1** Estabilizar Neka | 1.1 Los scripts A–D pasan a pruebas que fallan primero. 1.2 `validarPlan`: tras `probar`, comparar conflictos antes/después; si el plan crea uno nuevo, se le devuelve al modelo como error para que corrija (dentro de las 5 vueltas) o se avisa en la hoja. 1.3 Revalidar al aceptar (hueco aún libre); si cambió: «La agenda cambió: …» + botón *Pedir de nuevo*. 1.4 Explicar saltos («salta Gimnasio, que es fijo») y resumen de «no cabe todo» con alternativas calculadas en código. 1.5 Plazo y prioridad en `correrDesde`/`buscarHueco`/contexto. 1.6 Fallos de IA fuera del historial permanente; aviso si el guardado local falla en invitado. 1.7 Respuestas de Neka sin ids internos y completas (visto en vivo el 1/11: a «¿Qué tengo hoy?» respondió con ids entre corchetes y solo 2 de las 5 cosas de hoy) | — | Imprevisto → propuesta coherente → aceptar → guardado, **sin conflictos nuevos** que antes no existían; los 4 casos A–D cubiertos; 261+ pruebas verdes; prueba en iPhone | 2–3 d |
| **2** Vistas | 2.1 Quitar Mesas del selector y del valor por defecto (el código y los datos se conservan hasta cerrar la fase). 2.2 Círculo legible: nombre al tocar, agrupación «+N» por sector y anillo, filtro por área, atrasados diferenciados, propuesta de Neka visible. 2.3 Modo **Agenda** en Calendario: varios días seguidos, duración, choques y atrasados marcados, atajo a Neka. 2.4 Decidir Plano y capa de dependencias viendo maqueta | Maquetas aprobadas | Mismos datos en círculo y agenda (prueba de consistencia); 126 elementos legibles en 340 px; ninguna mesa, grupo ni dato eliminado | 3–4 d |
| **3** Modelo + Google Calendar (solo lectura) | 3.1 Campos de origen en `Item` + reglas + sync + pruebas. 3.2 Interfaz `Conector` y normalización pura con datos de ejemplo de Google (día completo, zonas, recurrentes expandidas, cancelados). 3.3 Autorización y almacenamiento del token (según decisión §4). 3.4 Importación y actualización con identidad `proveedor + cuenta + idExterno`. 3.5 Paso de conexiones al crear cuenta y sección *Cuentas conectadas*. 3.6 Neka trata lo externo como fijo y de solo lectura | Decisión de servidor; fases 1 y 2 para no mezclar | Conectar, elegir calendarios, ver el resultado y reorganizar tareas propias alrededor de lo externo; «continuar sin conectar» funciona; la sección solo muestra lo que funciona | 5–7 d |
| **4** Coherencia | Reconectar sin duplicar; edición o cancelación externa; token vencido → «Reconectar»; desconectar con elección (ver abajo); falla parcial | Fase 3 | Prueba de reconectar 2 veces = 0 duplicados; editar en Google se refleja; la agenda queda coherente | 2 d |
| **5** Cierre de tesis | Pruebas integrales en iPhone, documentación, presentación, G mínimo si hay tiempo | 1–4 | Recorrido completo sin errores en iPhone y web | 3–4 d |
| **6** Después | Outlook, Notion, correo, escritura externa | 3–4 | — | — |

**Qué pasa al desconectar (propuesta):** se deja de sincronizar y lo importado **se conserva** como solo lectura con la marca «ya no se actualiza». Una segunda opción explícita, «Quitar también lo importado», lo manda a la papelera (recuperable). Nunca se borra algo sin que lo elijas.

**Cuando algo cambia en ambos lados (propuesta):** lo externo manda sobre lo externo (es solo lectura en Nekal); tus tareas propias nunca se modifican desde afuera. Escribir en el servicio original queda fuera de la tesis; si más adelante se permite, el cambio se guarda *en el servicio original* y Nekal lo refleja al sincronizar.

Estimación total de las fases 0–5: ~16–21 días de trabajo, frente a ~39 días hasta el ~10 de diciembre. Las fases 0–1 y el inicio de la 2 caben en ~4 días; **Google Calendar no cabe en 4 días**.

---

## 4. Decisión de servidor para Google Calendar

| Opción | Cómo funciona | A favor | En contra |
|---|---|---|---|
| **A. Cloud Functions (plan Blaze)** *(recomendada)* | La página https de Nekal abre el consentimiento de Google; el servidor recibe el código, guarda el *refresh token* y sincroniza hacia Firestore. El iPhone solo lee Firestore | Funciona en web y en Expo Go (no hace falta esquema propio); el token nunca llega al teléfono; permite actualización continua | Requiere tarjeta (Blaze tiene cuota gratis; poner alerta de gasto); es el trozo más nuevo del proyecto |
| **B. Enlace secreto iCal (ICS)** | Pegas la «dirección secreta» de tu calendario | Sin OAuth ni verificación; sirve también para Outlook | Solo lectura; Google tarda en refrescarlo (por verificar cuánto); la web no puede leerlo directo (CORS) sin un proxy; no es «autorizar y conectar» |
| **C. OAuth en el cliente** | Inicio de sesión de Google dentro de la app | Sin servidor | Exige development build; instalar en iPhone desde Windows requiere EAS y cuenta de Apple Developer de pago; en web el token dura 1 h y no se renueva |

**Dato de Google a confirmar en la consola:** los *refresh tokens* emitidos con la pantalla de consentimiento en estado «Testing» caducan a los 7 días (fuentes de la comunidad, sin doc oficial a la vista). Para la demo: reconectar cada semana, o pasar a «En producción» sin verificar (aparece el aviso de app no verificada, tope de 100 usuarios). El alcance será el de solo lectura de eventos.

La opción A es mi propuesta; antes de construir todo se haría un *spike* de un día (conectar → traer 5 eventos → verlos en Firestore).

**Notion (alcance propuesto):** el usuario elige **una base de datos**; se importan las filas que tengan una propiedad de fecha, como tareas de solo lectura (título → título, fecha → plazo/inicio, estado → estado). Sin páginas libres, sin «importar todo». Se confirma después de Google.

---

## 5. Maquetas y «mega maqueta»

Cada pantalla que te muestre se guarda en `DOCUMENTOS/V2/H_MAQUETA/` con prefijo numérico y versión (nunca se borra una), con el sistema de diseño real (tokens, Plus Jakarta, Ionicons de línea, poses de Neka) y pasada por las skills de diseño antes de mostrarla. Además cada una se anota en un **manifiesto** (`H_MAQUETA/manifiesto.json`: flujo, paso, título y explicación), así la mega maqueta se genera al final con todos los cuadros, en orden y explicados.

Flujos que cubrirá:

1. **Primer inicio:** bienvenida → crear cuenta → «Conecta lo que ya usas» (con «Ahora no») → autorizar → elegir calendarios → resultado de la importación.
2. **Cuentas conectadas:** lista con estado, detalle, reconectar, desconectar (con la elección).
3. **Crear una cosa:** menú crear → formulario → cosa en su lugar (pantallas reales de la app).
4. **Imprevisto con Neka:** pedido → plan (con «salta Gimnasio») → «no cabe todo» con alternativas → aceptar → resultado → plan vencido por cambio de agenda.
5. **Vistas:** círculo denso y legible, agenda, filtros.
6. **Estados de error:** conexión vencida, IA no disponible, guardado fallido.

Las pantallas que ya existen se capturan reales (modo invitado, puerto 8082); las nuevas se maquetan.

---

## 6. Alcance

**Imprescindible para la tesis (~10 dic):** fases 1 y 2; Google Calendar solo lectura con el paso de inicio y *Cuentas conectadas*; coherencia al reconectar o editar; pruebas integrales en iPhone; documentación y presentación.

**Deseable si hay tiempo:** Outlook (mismo `Conector`, Microsoft Graph); Notion con una base de datos; actualización automática periódica; **espacios compartidos (G) en su versión mínima** («invitar a un amigo a ver una mesa», solo lectura).

**Evolución posterior:** escribir en el calendario externo; correo → tarea; seguimiento de compromisos; WhatsApp; widget.

Cambio propuesto al ROADMAP: **G pasa de imprescindible a deseable** (el ROADMAP dice «recortar, no eliminar»; esto lo recorta al mínimo). Se confirma antes de tocar el ROADMAP.

---

## 7. Preguntas abiertas

1. ¿Los «4 días» son el tiempo para esta etapa? (cubre fases 0–1 y parte de la 2; no Google.)
2. ¿Aceptas el plan Blaze con alerta de gasto para las Cloud Functions (opción A), o prefieres la opción B?
3. ¿Confirmas bajar G a «deseable»?
4. ¿Confirmas ~10 de diciembre como entrega?
