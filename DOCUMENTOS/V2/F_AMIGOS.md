# V2 · Subproyecto F — Amigos

Especificación del diseño aprobado en brainstorming el 26 de octubre de 2026. Parte del [ROADMAP](ROADMAP.md). El registro de cada decisión está en [F_NOTAS_BRAINSTORMING.md](F_NOTAS_BRAINSTORMING.md).

- Maquetas (no se borran): [F_MAQUETA/](F_MAQUETA/).
  - **01**: dónde viven tus amigos (A sección, B botón arriba, C en tu tarjeta).
  - **02**: A y B juntas, la opción aprobada.
  - **03**: qué ve un amigo; se eligió la A (sus áreas, sin nombres de mesas).
  - **04**: agregar con un código; se eligió la A (ves a quién antes de enviar).
  - **05**: estados (sin amigos, invitado, eliminar amigo, sin nombre).

## 1. Objetivo

Que puedas **agregar a un amigo con su código y ver su perfil en corto**: nombre, nivel, los logros que consiguió y cómo va en cada área. Todo con cuentas y datos reales en Firebase, y sin que nadie que no sea tu amigo vea nada tuyo.

F es solo eso: el perfil y los amigos. Los espacios compartidos son el subproyecto G.

## 2. Decisiones

| Tema | Decisión |
|---|---|
| Cómo se encuentran | **Código de amigo** de 6 caracteres, que se comparte con «Compartir» y el otro pega en Nekal. |
| Solicitud | **El otro acepta.** Hasta que acepta, ninguno ve el perfil del otro. Cualquiera de los dos puede eliminar la amistad. |
| Dónde viven | **Sección Amigos en el Perfil + botón arriba**; «Agregar» y el botón abren la misma **hoja Amigos** (§6). |
| Qué ve un amigo | **Sus áreas, sin nombres de mesas**: una fila por área con el promedio de sus mesas (§4.2). |
| Agregar | **Ves el nombre antes de enviar** («Buscar» → «Enviar solicitud»). |
| Logro | Se suma **«Primer amigo»** (logro 25). |
| Enfoque | **Tarjeta pública + amistades**, sin servidor. La caja privada `users/{uid}` no cambia (§5). |

## 3. El código de amigo

- **Alfabeto:** `23456789ABCDEFGHJKMNPQRSTUVWXYZ` (31 caracteres, sin 0/O ni 1/I/L). **Largo:** 6. Son unos 887 millones de códigos: no se pueden adivinar probando.
- **Se muestra** como `NEKA-7KQ2PX`. **Se guarda** como `7KQ2PX`.
- **Al escribirlo** se ignoran mayúsculas, espacios, guiones y el prefijo «NEKA». Si después de eso no quedan exactamente 6 caracteres del alfabeto, el código no es válido.
- **Se crea solo** la primera vez que la cuenta publica su tarjeta (§7.2). Si el código al azar ya existe, se prueba otro (hasta 5 veces).
- **«Cambiar mi código»** crea uno nuevo y borra el viejo, que deja de funcionar. Los amigos actuales y las solicitudes ya enviadas no se pierden.
- **«Compartir»** abre el menú del teléfono con el texto «Agrégame en Nekal con mi código NEKA-7KQ2PX». Si el navegador no tiene ese menú, la hoja muestra el texto para copiarlo.

## 4. Lo que muestras: la tarjeta

### 4.1 Contenido

La tarjeta se arma desde tus datos privados y es lo único que un amigo puede leer de ti:

| Campo | De dónde sale |
|---|---|
| `nombre`, `roles` | Tu perfil (`data.profile`). |
| `desde` | Tu día 1 (`dia1De`), como `AAAA-MM-DD`. El amigo ve «En Nekal desde septiembre de 2026». |
| `nivel`, `puntos` | `totalPoints` y `nivelDe`, igual que tu Perfil. |
| `logros` | Los logros que ya conseguiste (`desbloqueados`), del más reciente al más antiguo. |
| `areas` | Mapa área → `{ valor, mesas }` (§4.2). |
| `codigo` | Tu código actual. |
| `actualizado` | La hora de Firebase de la última escritura. |

Un amigo **no** ve tus cosas, tu calendario, tu racha, tu chat con Neka ni los nombres de tus mesas.

### 4.2 Áreas

- Por cada área (las 6 de E), el **promedio redondeado** del rating de tus mesas de esa área (`ratings` y `areaDe`).
- Solo cuentan las mesas que **ya tienen rating**; las muy nuevas (`valor === null`) no suman ni cuentan.
- `mesas` es cuántas mesas entraron al promedio. Un área sin mesas con rating no aparece.
- El amigo las ve de mayor a menor. Ejemplo: Inglés 70 y Magíster 61 son «Estudio 66 · 2 mesas».

### 4.3 Cuándo se publica

- Solo con cuenta, con nombre y **después de la primera sincronización** de la sesión (el estado de la nube ya no es «Conectando» ni «Sincronizando»). Así un teléfono recién abierto no sube «Nivel 1» encima de la tarjeta real.
- Cuando cambia algo de la tarjeta, espera ~2 s y escribe. Si la tarjeta nueva es igual a la última publicada, no escribe.
- Al cambiar tu nombre también se actualiza el nombre de tu código.

La tarjeta la escribe tu propio teléfono, así que alguien muy hábil podría inflar su nivel. Para la tesis se acepta; las reglas ponen límites (§5.2).

## 5. Datos y reglas

### 5.1 Colecciones nuevas

Fuera de `users/{uid}`, que no cambia (salvo §5.3):

| Colección | Campos | Lee | Escribe |
|---|---|---|---|
| `codigos/{CODIGO}` | `uid`, `nombre` | cualquier cuenta, **solo `get`** del código exacto (sin listar) | el dueño |
| `amistades/{uidMenor_uidMayor}` | `de`, `para`, `miembros` (`[de, para]`), `estado` (`pendiente` / `aceptada`), `nombreDe`, `nombrePara`, `codigo`, `creada`, `aceptada` | solo los dos miembros (incluye la consulta «`miembros` contiene mi uid») | ver §5.2 |
| `perfiles/{uid}` (tarjeta) | §4.1 | el dueño y quien tenga una amistad **aceptada** con él | el dueño |

El id de una amistad es siempre `uidMenor_uidMayor` (orden de texto), así que hay **un solo papel por pareja** sin importar quién envió.

### 5.2 Reglas

**`codigos/{codigo}`**
- `get`: cualquier cuenta. `list`: nadie.
- `create`: `uid == auth.uid`, el id cumple el formato (§3), `nombre` de 1 a 80 caracteres, y en el mismo lote `perfiles/{auth.uid}.codigo == codigo` (`getAfter`).
- `update`: el dueño, y solo puede cambiar `nombre`.
- `delete`: el dueño.

**`amistades/{par}`**
- `read`: `auth.uid in miembros`.
- `create`: `de == auth.uid`; `de != para`; el id es el par ordenado de `de` y `para`; `miembros == [de, para]`; `estado == 'pendiente'`; `creada == request.time`; `aceptada == null`; nombres de 1 a 80; y **`codigos/{codigo}.uid == para`** (no se puede enviar sin el código real).
- `update`: solo `para`, desde `pendiente` a `aceptada`, cambiando solo `estado` y `aceptada` (`aceptada == request.time`).
- `delete`: cualquiera de los dos miembros (Rechazar, Cancelar y Eliminar).

**`perfiles/{uid}`**
- `read`: el dueño, o existe `amistades/{par(uid, auth.uid)}` con `estado == 'aceptada'`.
- `create` / `update`: el dueño, con la forma exacta de §4.1 y estos límites:
  - `nombre` de 1 a 80; `roles` hasta 200; `desde` hasta 10;
  - `nivel` entero de 1 a 200; `puntos` entero de 0 a 10.000.000;
  - `logros`: lista de hasta 25 ids, todos del catálogo (`hasOnly`);
  - `areas`: mapa con claves de las 6 áreas; cada valor `{ valor: entero 0–100, mesas: entero 1–100 }`;
  - `codigo` con el formato de §3; `actualizado == request.time`.
- `delete`: el dueño.

Borrar una amistad corta la lectura de la tarjeta en ese momento. Las reglas se revisan con la skill `firebase-security-rules-auditor` y con pruebas en el emulador (§11).

### 5.3 Cambio en la caja privada

`users/{uid}/logros` acepta el id nuevo `primer-amigo`.

## 6. Pantallas

### 6.1 Perfil (`pages/Perfil.tsx`)

- **Arriba:** el botón de personas (`people-outline`, «Amigos») junto al engranaje, **solo con cuenta**. Muestra el número de solicitudes recibidas.
- **Bajo tu tarjeta, la sección «Amigos»** (`SeccionAmigos`):
  - las solicitudes recibidas, cada una con **Aceptar** y **Rechazar**: máximo dos, y con más aparece «Ver todas», que abre la hoja;
  - la fila de amigos: primero «Agregar» y después cada amigo (inicial, nombre de pila, «Nivel n»), por nombre. Con muchos amigos, la fila se desliza;
  - tocar un amigo abre la hoja directo en su perfil.
- **Logros:** «n de 25» (se cuenta el catálogo; ya no dice 24 escrito a mano).

### 6.2 Hoja Amigos (`HojaAmigos`)

Un solo `Sheet` grande con tres páginas. La flecha ‹ vuelve a «Amigos».

**Amigos**
1. Tu código (`NEKA-…`) con **Compartir**, y el botón **Agregar con un código**.
2. **Solicitudes**: las que te llegaron, con Aceptar y Rechazar.
3. **Enviadas**: las tuyas pendientes, con «Pendiente» y **Cancelar**.
4. **Tus amigos**: inicial, nombre, «Nivel n · m logros» y chevron. Si su tarjeta todavía no carga, muestra el nombre de la solicitud.
5. Al final, **Cambiar mi código**, que se confirma en la misma hoja: «Tu código actual dejará de funcionar. Tus amigos no se pierden».

Si tu perfil no tiene nombre, en vez del código aparece «Primero, tu nombre» con **Escribir mi nombre**, que abre «Editar perfil».

**Agregar amigo**
- El texto «Pídele su código a tu amigo. Lo encuentra en su Perfil, en Amigos.», el campo «Código de tu amigo» y **Buscar**.
- Si lo encuentra: la tarjeta con su inicial y su nombre, «¿Le envías una solicitud?» y **Enviar solicitud**. Al enviar vuelve a «Amigos» con el aviso «Le enviamos tu solicitud a {nombre}.».
- Avisos bajo el campo:
  - código mal escrito o que no existe: «No encontramos ese código. Revisa que esté bien escrito.»;
  - tu propio código: «Ese es tu código.»;
  - ya son amigos: «Ya son amigos.»;
  - ya le enviaste una: «Ya le enviaste una solicitud.»;
  - esa persona ya te envió una: «Esa persona ya te envió una solicitud.», con **Aceptar**.

**Perfil de un amigo** (`PerfilAmigo`, maqueta 03)
- Título: su nombre. Tarjeta con su inicial, roles y «En Nekal desde…».
- Su nivel y puntos con la barra.
- **Logros** («n de 25»): sus 8 más recientes; «Ver sus n logros» despliega el resto en la misma página.
- **Sus áreas** («cómo va en cada una»): ícono del área en el anillo, nombre del área, «n mesa(s)» y el número.
- Al final, **Eliminar amigo**, que se confirma en la misma hoja: «¿Eliminar a {nombre}? Ya no verán sus perfiles. Para volver a ser amigos, uno tiene que enviar otra solicitud.» con **Eliminar** y **Cancelar**.
- Si su tarjeta todavía no existe (por ejemplo, no ha abierto Nekal desde que se aceptó), la página muestra su nombre de la solicitud y «Su perfil aparece cuando abra Nekal.», más Eliminar amigo.

### 6.3 Estados (maqueta 05)

- **Sin amigos:** Neka pose 3 con «Comparte tu código o pega el de un amigo para ver cómo va cada uno.» y **Agregar amigo**.
- **Invitado:** Neka pose 3 con «Crea una cuenta para agregar amigos. Así tu progreso también queda guardado.» y **Crear cuenta**, que abre «Tu cuenta Nekal». Sin botón de personas arriba.
- **Sin conexión:** al apretar un botón, si Firebase no confirma en ~10 s, «Sin conexión. Revisa tu internet y reintenta.» y el botón vuelve a estar disponible. Si se corta mientras miras, se mantiene lo último cargado con un aviso suave.
- **Trabajando:** cada botón muestra su estado («Buscando…», «Enviando…») y no se puede apretar dos veces.

### 6.4 Pestaña, logro y cuidado

- **Pestaña Perfil:** un número rojo con las solicitudes recibidas. El lector de pantalla dice «Perfil, 1 solicitud».
- **«Primer amigo»:** sale con el modal de E cuando se cierra la hoja (ya espera a que no haya hojas abiertas).
- **Cuidado:** vibración de éxito al enviar y al aceptar; toques de al menos 44 puntos; nombre para el lector de pantalla en cada botón de ícono; solo tokens de `theme.ts`, componentes de `base/`, texto con `Txt` e íconos Ionicons de línea.

## 7. Cómo se construye

### 7.1 Lógica pura (`utils/amigos/`, con pruebas)

- **`codigo.ts`:** `ALFABETO`, `nuevoCodigo(azar)` (azar inyectable), `normalizarCodigo(texto) → string | null` y `mostrarCodigo(codigo)`.
- **`tarjeta.ts`:** el tipo `Tarjeta`, `tarjetaDe(data, now)` (§4.1 y §4.2), `areasDe(data, now)`, `mismaTarjeta(a, b)` y `areasOrdenadas(tarjeta)` para la vista del amigo.
- **`amistades.ts`:** el tipo `Amistad`, `idPar(a, b)`, `listas(amistades, yo)` → `{ recibidas, enviadas, amigos }`, `revisarEnvio(...)` → `ok` o el aviso de §6.2, y `filasAmigos(amigos, tarjetas)`.
- **Logros:** `primer-amigo` en `LOGRO_IDS` (`model.ts`) y en `CATALOGO` (`progreso/logros.ts`, familia «primeras», ícono `people-outline`, frase «Te hiciste amigo de alguien en Nekal.», pista «Agrega a alguien con su código.»). `Hechos` suma `amigos` (cuántas amistades aceptadas tienes) y `cumple('primer-amigo')` es `amigos >= 1`. Una vez visto queda en `data.logros`, así que eliminar al amigo no lo quita.

### 7.2 Nube y estado

- **`utils/amigos/nube.ts`** es el único archivo de F que importa Firestore: `buscarCodigo`, `enviarSolicitud`, `aceptar`, `borrarAmistad`, `publicarTarjeta`, `crearCodigo` (lote: código nuevo + tarjeta + borrar el viejo), `escucharAmistades` y `escucharTarjeta`.
- **`utils/AmigosContext.tsx`** (como `NekaContext`):
  - con cuenta, escucha las amistades y la tarjeta de cada amigo aceptado;
  - publica tu tarjeta según §4.3 y crea tu código la primera vez;
  - expone las listas, las tarjetas, tu código, el número de solicitudes, cuántos amigos tienes, el estado y las acciones;
  - con invitado no se conecta; al cerrar sesión o cambiar de cuenta, deja de escuchar y limpia.
- **`useProgreso`** recibe cuántos amigos tienes para calcular los logros.
- **`nekalAmigos()`** (solo en desarrollo, como `nekalDemo()`): carga amigos, solicitudes y enviadas de ejemplo en el contexto, sin Firebase, para revisar las pantallas en modo invitado. Mientras está activo, la sección y la hoja se comportan como con cuenta, y las acciones cambian solo ese estado de ejemplo.

### 7.3 Componentes (`components/ui/amigos/`)

`SeccionAmigos`, `HojaAmigos`, `PerfilAmigo`, `Inicial`, `TarjetaSolicitud`, `FilaAmigo` y `FilaArea`. `TabBar` suma el número de la pestaña Perfil.

## 8. Orden de trabajo

1. Código de amigo (`codigo.ts`) con pruebas.
2. Tarjeta y áreas (`tarjeta.ts`) con pruebas.
3. Amistades y revisión antes de enviar (`amistades.ts`) con pruebas.
4. Logro «Primer amigo» y catálogo de 25, con pruebas.
5. Reglas de Firestore y sus pruebas en el emulador.
6. Nube (`nube.ts`) y `AmigosContext`, con `nekalAmigos()`.
7. Pantallas: sección, hoja con sus tres páginas, estados y número de la pestaña.
8. Verificación en modo invitado, auditoría de reglas y publicación (con permiso).
9. Prueba real con dos cuentas, registro y mezcla en `main`.

El plan detallado va en `F_PLAN_IMPLEMENTACION.md`.

## 9. Pruebas

**Lógica** (`tests/amigos.cjs`, nuevo):
- `normalizarCodigo`: «neka-7kq2px», «7KQ 2PX» y «NEKA7KQ2PX» dan `7KQ2PX`; con O, 0, I, 1 o L, o con 5 o 7 caracteres, da `null`. `nuevoCodigo` con un azar fijo da siempre lo mismo y solo usa el alfabeto.
- `areasDe`: promedio redondeado, mesas sin rating fuera, área sin mesas con rating ausente, conteo de mesas. `areasOrdenadas`: de mayor a menor.
- `tarjetaDe`: nombre, roles, desde, nivel, puntos y logros del más reciente al más antiguo. `mismaTarjeta`: igual si nada cambió (sin mirar `actualizado`) y distinta si cambia un logro o un área.
- `idPar` igual en los dos sentidos. `listas` separa recibidas, enviadas y amigos.
- `revisarEnvio` cubre cada aviso de §6.2. `filasAmigos` usa el nombre de la solicitud si no hay tarjeta y ordena por nombre.

**Logros** (`tests/progreso.cjs`): el catálogo tiene 25; «Primer amigo» se cumple con 1 amigo y no con 0; si ya fue visto, sigue desbloqueado con 0 amigos.

**Reglas** (`tests/firestore.cjs`, en el emulador con Java 21):
- se puede: leer un código exacto; crear tu código junto a tu tarjeta; enviar con el código real; aceptar si eres `para`; leer la tarjeta de un amigo aceptado; borrar la amistad si eres miembro;
- no se puede: listar códigos; crear un código para otro uid o sin actualizar tu tarjeta; enviar sin código o con el código de otra persona; enviarte a ti; aceptar si eres `de`; cambiar otros campos al aceptar; leer una tarjeta con la amistad pendiente o sin amistad; que un tercero lea o borre una amistad; escribir la tarjeta de otro; una tarjeta con nivel 999, un logro inventado o un área inventada.

**Siempre:** `npm test` (incluida la prueba de estilos), `npm run typecheck` y `npm --prefix front run build:web`.

**Pantallas:** en modo invitado (servidor `nekal-web-invitado`, puerto 8082) con `nekalDemo()` y `nekalAmigos()`: cada página de la hoja, cada estado de §6.3 y el ancho de un teléfono.

**Prueba real** (después de publicar las reglas, con permiso): PruebaClaude en el navegador de Claude y una segunda cuenta creada por el usuario (idealmente en su iPhone). Recorrido: compartir el código, buscar, enviar, ver el número en la pestaña, aceptar, ver el perfil y las áreas, que salte «Primer amigo», cambiar el código y eliminar.

## 10. Fuera de alcance

- Espacios compartidos (G).
- Chat entre amigos, comparar o rankings, bloquear usuarios, QR y enlaces que abren la app.
- Avisos push: solo el número de la pestaña Perfil.
- Borrar la cuenta.
- Verificar en un servidor que la tarjeta no fue inflada.

## 11. Criterios de éxito

- Dos cuentas reales se agregan con el código, la solicitud se acepta y cada una ve el perfil en corto de la otra (nivel, logros y áreas, sin nombres de mesas).
- Nadie que no sea tu amigo lee tu tarjeta: lo prueban las reglas en el emulador y la auditoría.
- El número de la pestaña Perfil aparece con una solicitud nueva sin recargar.
- «Primer amigo» se gana con la primera amistad aceptada y no se pierde al eliminarla.
- El modo invitado sigue funcionando igual, con la invitación a crear una cuenta.
- Funciona en la web y en el iPhone (Expo Go).
- `npm test`, `typecheck` y `build:web` en verde.
