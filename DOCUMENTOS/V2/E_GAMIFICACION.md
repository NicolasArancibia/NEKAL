# V2 · Subproyecto E — Gamificación

Especificación del diseño aprobado en brainstorming el 25 de octubre de 2026. Parte del [ROADMAP](ROADMAP.md). El registro de cada decisión está en [E_NOTAS_BRAINSTORMING.md](E_NOTAS_BRAINSTORMING.md).

- Maquetas (no se borran): [E_MAQUETA/](E_MAQUETA/).
  - **01**: primer intento, descartado por genérico.
  - **02**: dónde vive el progreso; se eligió la A (el Perfil).
  - **03**: el reparto aprobado entre Perfil y Resumen. El anillo de nivel del Resumen queda como hoy.
  - **04**: el modal de logro; se eligió la B (tarjeta al centro).

## 1. Objetivo

Que Nekal muestre **cómo vas**, con datos reales y sin trampas fáciles. Hay cuatro piezas:

- un puntaje que premia hacer las cosas a tiempo;
- niveles que significan algo;
- tus días, con heatmap y racha;
- un rating por mesa y logros que se celebran.

El **Perfil** pasa a ser lo que muestras: en el subproyecto F lo verán tus amigos. El **Resumen** suma tu día a día.

## 2. Decisiones

| Tema | Decisión |
|---|---|
| Motor | **Todo se calcula con lo que ya existe**: puntos con fecha, cosas con su día y estado, mesas, rutinas y mensajes. Solo se guardan dos cosas nuevas: el **área de cada mesa** y **qué logros ya viste**. Costo aceptado: si mueves algo de día o lo completas atrasado, la historia de ese día cambia. |
| Puntaje | **Ajuste fino** de la fórmula actual: la dificultad ya no depende de la fecha y hay un bonus por terminar a tiempo (§3). |
| Niveles | **Con curva**: cada nivel cuesta 100 puntos más que el anterior (§3). |
| Reparto | **Perfil = lo que muestras**: nombre, nivel, logros y tus mesas; en F se suman los amigos. **Resumen = tu día a día**: tus días y «desde el día 1». |
| Heatmap | Color según el **% de lo que tenías ese día que completaste** (§4). |
| Racha | Un día suma si completaste **al menos la mitad de tu día**. Un día sin nada agendado es descanso (§4). |
| Rating | **Por mesa**, de 0 a 100. Sube y baja suave; el nivel y los puntos nunca bajan (§5). |
| Área | Cada mesa tiene una de 6 áreas, sugerida por su nombre. Sirve para el ícono y para compararte con amigos en F (§5). |
| Logros | **24, iguales para todas las cuentas**, en tres familias: constancia, volumen y niveles, primeras veces. Nunca se pierden y no dan puntos (§6). |
| Modal de logro | **Tarjeta al centro**, con animación de medalla y Neka saltando (§6.3). |

## 3. Puntaje y niveles

**Puntos por cosa.** Se calculan y se congelan cuando se paga la cosa, igual que hoy.

```
puntos = round(10 × dificultad × prioridad × bonus) + min(15, 5 × cosas que dependen de ella)
```

- **Prioridad:** baja ×1, media ×1,5, urgente ×2 (como hoy).
- **Dificultad de tareas, entregas y metas:** se cuenta la carga = cantidad de pasos, más 1 si tiene lugar.
  - Carga 0 o 1: baja (1).
  - Carga de 2 a 4: media (2).
  - Carga de 5 o más: alta (3).
  - **La fecha límite ya no cuenta.** Antes premiaba dejar todo para el final, o incluso atrasarse.
- **Dificultad de eventos, visitas y reuniones:** la que elige el usuario, como hoy.
- **Bonus a tiempo: ×1,2** si la cosa tiene fecha límite y el pago ocurre antes de esa fecha. El pago es al completarla o, en una meta con pasos, al congelar su presupuesto en el primer pago.
- **Sin cambios:**
  - notas e ideas no dan puntos;
  - eventos, visitas y reuniones solo dan si «cuenta para el puntaje»;
  - las metas pagan 80% por pasos y el resto al terminar;
  - reabrir o editar no vuelve a pagar.
- **Ejemplo:** «Entregar informe», urgente, 3 pasos, fecha el viernes. Vale 10 × 2 × 2 × 1,2 = **48** si lo terminas antes del viernes, y **40** si se pasó la fecha. Hoy valdría 60 un día antes y 40 una semana antes.

**Niveles.** Llegar al nivel *n* cuesta `50 · n · (n − 1)` puntos acumulados.

| Nivel | 2 | 3 | 4 | 5 | 8 | 10 | 15 | 20 |
|---|---|---|---|---|---|---|---|---|
| Puntos | 100 | 300 | 600 | 1.000 | 2.800 | 4.500 | 10.500 | 19.000 |

- A ~33 puntos por día se llega al nivel 8 en 3 meses y al 16 en un año. Hoy serían 30 y 120.
- Una sola función, `nivelDe(puntos) → { nivel, desde, hasta, avance }`, reemplaza todos los `Math.floor(puntos / 100) + 1`.
- **Al lanzar E:** el historial de puntos no se toca. Como el nivel se calcula de los puntos, la curva se aplica sola y tu nivel baja **una única vez**. La tarjeta del lanzamiento lo explica (§6.3).

## 4. Tus días: heatmap y racha

**Lo que tenías un día** usa la misma regla que «Hoy» (`timeOn`): cosas con hora o fecha límite ese día local, sin notas, ideas ni borradas. Cada repetición de una rutina es su propia cosa.

**% del día** = completadas ÷ las que tenías.

**Tonos** (5, de lavanda a violeta):

| Tono | Cuándo |
|---|---|
| Vacío | Nada agendado y nada hecho (descanso), o 0% |
| 1 | Algo, pero menos de la mitad |
| 2 | Entre 50% y 74%, **o** sin nada agendado pero completaste algo ese día (según la fecha de sus puntos) |
| 3 | Entre 75% y 99% |
| 4 | 100% |

**Un día suma a la racha desde el tono 2.** Así la regla de colores no tiene excepciones.

**Racha y récord:**
- La **racha** son los días seguidos que suman, contados desde ayer hacia atrás.
- **Hoy** suma apenas llega al 50%. Si todavía no llega, no corta la racha.
- Un **descanso** (nada agendado y nada hecho) no corta ni suma.
- El **récord** es la racha más larga desde el día 1.
- Un día con cosas agendadas en 0% corta la racha, aunque ese día hayas completado otras cosas sin fecha.

**Vista** (en el Resumen, §7.2):
- Heatmap de **12 semanas**, de lunes a domingo, con hoy marcado con borde. Si la cuenta es más nueva, empieza en su primera semana.
- Al tocar un día aparece una línea, por ejemplo:
  - «jueves 23 de oct · 4 de 5 (80%)»;
  - «Descanso»;
  - «Sin nada agendado · completaste 2».
- VoiceOver lee el mismo texto en cada cuadrito, y el heatmap es un grupo llamado «Tus días, últimas 12 semanas».
- Arriba del heatmap van la racha y el récord. Al lado del título van los puntos de la semana, de lunes a domingo, con la misma regla actual (sin los `:budget`).

## 5. Tus mesas: rating y área

**El rating** va de 0 a 100 y dice «cómo vas ahora» en la mesa, incluidos sus grupos y rutinas (`workspaceId`).

- **Ventana:** los últimos 28 días, incluido hoy.
- **Qué cuenta:**
  - cada cosa con fecha en la ventana que ya está completada o cuya hora ya pasó (las no completadas son vencidas);
  - las cosas sin fecha completadas, en el día en que se pagaron sus puntos.
- **Peso según la antigüedad:** 0–6 días ×4, 7–13 ×3, 14–20 ×2, 21–27 ×1.
- **Fórmula:** `rating = round(100 × Σ peso·completadas ÷ Σ peso·todas)`.
- **Ejemplo:** 5 de 5, 4 de 6, 3 de 4 y 2 de 5 → 40 ÷ 51 → **78**.
- **Mesa quieta** (nada que contar en la ventana): toma el rating del último día con actividad y le resta 5 por cada semana completa desde ese día, sin bajar de 0.
- **Mesa nueva:** si nunca tuvo 3 cosas evaluadas en una ventana, muestra «Aún sin datos».
- **Etiqueta**, comparando con el rating de hace 7 días: subió 5 o más → «Sube»; bajó 5 o más → «Baja»; si no → «Igual».
- **General** no tiene rating: lo suelto ahí solo suma a puntos y nivel.

**Área** (`Area`):

| `area` | Nombre | Ícono (Ionicons de línea) |
|---|---|---|
| `estudio` | Estudio | `school-outline` |
| `trabajo` | Trabajo | `briefcase-outline` |
| `salud` | Salud | `barbell-outline` |
| `hogar` | Hogar | `home-outline` |
| `social` | Social | `people-outline` |
| `personal` | Personal | `heart-outline` |

- **Sugerencia por el nombre:** el nombre se pasa a minúsculas y sin tildes, y se busca palabra por palabra.

  | Área | Palabras |
  |---|---|
  | Estudio | universidad, uni, u, clase, curso, ramo, tesis, estudio, colegio, examen, prueba |
  | Trabajo | trabajo, pega, oficina, cliente, proyecto, empresa, negocio, freelance |
  | Salud | gym, gimnasio, salud, deporte, entreno, medico, doctor, correr, yoga |
  | Hogar | casa, hogar, depto, departamento, limpieza, compras, mascota |
  | Social | amigos, familia, social, pareja, cumpleanos |

  Si no hay coincidencia, va Personal. Gana la primera área de la tabla que coincida.
- **Guardado:** la mesa guarda `area` solo cuando el usuario elige una. Si no tiene el campo, se usa la sugerida.
- **Formulario de mesa** (`FormMesa`): debajo de nombre y color van 6 chips «Área». La sugerida aparece marcada mientras escribes, hasta que tocas otro chip.

## 6. Logros

### 6.1 Catálogo (24)

| id | Logro | Se desbloquea cuando | Ícono |
|---|---|---|---|
| `racha-3`, `racha-7`, `racha-14`, `racha-30`, `racha-60`, `racha-100` | Racha de N días | récord ≥ N | `flame-outline` |
| `semana-perfecta` | Semana perfecta | 7 días con agenda seguidos al 100%; los días sin agenda no cortan ni cuentan | `sparkles-outline` |
| `listas-10`, `listas-50`, `listas-100`, `listas-250`, `listas-500`, `listas-1000` | N cosas listas | cosas completadas, sin notas, ideas ni borradas, ≥ N | `checkmark-done-outline` |
| `nivel-5`, `nivel-10`, `nivel-15`, `nivel-20` | Nivel N | nivel ≥ N | `star-outline` |
| `primera-cosa` | Primera cosa completada | cosas listas ≥ 1 | `checkmark-circle-outline` |
| `primera-mesa` | Primera mesa | existe una mesa distinta de General | `layers-outline` |
| `primera-rutina` | Primera rutina | existe un grupo con `repeat` | `repeat-outline` |
| `primera-meta` | Primera meta cumplida | existe una meta (`Goal`) completada | `trophy-outline` |
| `primer-dia-100` | Primer día al 100% | algún día con agenda al 100% | `ribbon-outline` |
| `primer-audio` | Primer audio a Neka | existe un mensaje tuyo con `audio` | `mic-outline` |
| `primer-plan` | Primer plan de Neka aceptado | existe un mensaje con `estado: "aceptado"` | `chatbubble-ellipses-outline` |

**Reglas:**
- Un logro está **desbloqueado** si su condición se cumple ahora **o** si ya está guardado como visto. **Nunca se pierde.** Esto cubre, por ejemplo, el primer audio cuando sale de los últimos 100 mensajes.
- Los logros **no dan puntos**.
- **Avance de los bloqueados:**
  - rachas: récord/N;
  - listas: cuenta/N;
  - niveles: puntos ÷ puntos del nivel N;
  - primeras veces: 0, con el texto «Pendiente».

### 6.2 En el Perfil

- Se muestran 8 logros en una grilla de 4 columnas: los 4 desbloqueados más recientes (por fecha vista; uno desbloqueado y todavía no visto cuenta como de hoy) y los 4 bloqueados con más avance.
- **Desbloqueados:** medalla violeta con ícono blanco y el texto «Logrado».
- **Bloqueados:** medalla gris con candado, anillo de avance y texto de avance («12/30», «70%», «Pendiente»).
- «Ver los 24 logros» abre una hoja (`Sheet`) con todos, por familia. Los bloqueados de primeras veces dicen cómo conseguirlos, por ejemplo «Mantén el micrófono y háblale a Neka».

### 6.3 Modal de logro

- **Aspecto:**
  - tarjeta al centro sobre lo que estabas haciendo, con el fondo atenuado (`color.backdrop`);
  - Neka en pose 5, saltando desde la esquina de arriba;
  - el texto «Logro nuevo», el nombre y una línea, por ejemplo «Cumpliste tu día 7 días seguidos».
- **Botones:** «Genial» cierra y «Ver mis logros» va al Perfil. Tocar el fondo también cierra.
- **Animación:**
  1. Entra la tarjeta con el resorte `gentle`.
  2. El anillo de la medalla se completa.
  3. La medalla gira de gris con candado a violeta, con el resorte `snappy`.
  4. Aparece un brillo suave y Neka salta.
  5. En el mismo momento suena `haptic.success`.
- **Con «reducir movimiento»** la tarjeta solo aparece, sin giro, salto ni brillo.
- **Cola:**
  - 1 a 3 logros nuevos se muestran de a uno.
  - 4 o más juntos se muestran en una **tarjeta resumen** «Ya tenías N logros», con hasta 9 medallas y «y N más».
  - Si todavía no hay ningún logro guardado (lanzamiento de E), la tarjeta resumen suma la línea: «Ahora cada nivel cuesta un poco más. Tus puntos siguen intactos.»
- **Cuándo sale:** cuando cambian los datos, esperando a que no estés grabando ni con la hoja del plan de Neka abierta.
- **Al cerrar** se guardan como vistos todos los logros que mostró, con la fecha.
- **Accesibilidad:** el modal bloquea lo de atrás (`accessibilityViewIsModal`) y anuncia «Logro nuevo: Racha de 7 días». Los botones miden 48 y 44 de alto.

## 7. Pantallas

### 7.1 Perfil (`pages/Perfil.tsx`)

Según la maqueta 03, de arriba abajo:

1. **Encabezado** «Perfil», con un engranaje de 44×44 que abre Ajustes.
2. **Identidad:** avatar, nombre, roles y «En Nekal desde agosto de 2026» (el mes del día 1). El lápiz abre la hoja de editar perfil que ya existe.
3. **Nivel**, en tarjeta lavanda: «Nivel 8», los puntos, una barra con el riel blanco y «460 pts para el nivel 9».
4. **Logros** (§6.2).
5. **Tus mesas:** cada fila tiene un anillo con el color de la mesa y el ícono del área, el nombre, el área, el número y la etiqueta. Al tocar una fila se abre ahí mismo con el heatmap de esa mesa y un texto como «23 completadas · 3 vencidas en 4 semanas».

La sección **Cuenta** (correo, sincronización, reintentar, conflictos, cerrar sesión, modo invitado) se muda tal cual al inicio de Ajustes.

### 7.2 Resumen (`pages/Resumen.tsx`)

- Se quita la tarjeta «Progreso». Debajo de «Hoy» van:
  - **Tus días** (§4).
  - **Desde el día 1:**
    - el texto «Empezaste el 3 de agosto. Desde ahí subiste 7 niveles y completaste 187 cosas»;
    - una curva de puntos acumulados (área lavanda, línea violeta), con un punto en cada subida de nivel y etiquetas solo en la primera y la última;
    - el **día 1** es la fecha más antigua entre `createdAt` de tus cosas y `at` de tus puntos (en una cuenta sin nada, hoy);
    - con menos de 14 días de historia solo sale el texto, sin curva;
    - VoiceOver lee «Puntos acumulados desde el 3 de agosto: de 0 a 3.140; subiste 7 niveles».
- **Neka no aparece en «Desde el día 1»**, porque en el Resumen ya está arriba (una vez por pantalla, spec A §7).
- El **anillo de nivel** se ve igual que hoy y ahora se puede tocar: lleva al Perfil, con la etiqueta «Nivel 8. Ver tu perfil».

### 7.3 Otros

- **Ajustes:**
  - al inicio va la sección «Cuenta» (§7.1);
  - «¿Cómo se calculan los puntos?» se reescribe con la fórmula de §3, el bonus a tiempo y la curva de niveles.
- **Editor de cosas:** el estimado dice, por ejemplo, «48 pts estimados (+20% si lo terminas antes del viernes)» cuando hay fecha límite futura.
- **`ProgressBar`:** suma la variante de riel blanco para usarla sobre lavanda.

## 8. Datos y nube

- **`Workspace`** suma `area?: Area`. Si no lo tiene, se usa la sugerida.
- **`AppData`** suma `logros: { id: LogroId; at: string }[]`, los logros vistos. Si falta al cargar, vale `[]`. Va un documento por logro, para que dos dispositivos que desbloquean a la vez no choquen.
- Se toca:
  - `utils/model.ts`: tipos y `emptyData`;
  - `utils/storage.ts`: validación local;
  - `utils/syncModel.ts`: nueva colección `logros` y su límite (máximo 24);
  - el respaldo y la importación de Ajustes, que incluyen los logros.
- **`back/firestore.rules`:**
  - `workspaces`: `fields(v,['id','name','color'])` **o** `fields(v,['id','name','color','area']) && v.area in [...]` con los 6 valores de `area` de §5.
  - Tipo nuevo `logros`: `fields(v,['id','at']) && v.id == id && v.id in [...] && str(v.at,40)`, con los 24 ids de §6.1.
  - Se revisan con `/security-review` y con la skill `firebase-security-rules-auditor`.
  - **Se publican solo las reglas** (`npm run deploy:rules`), con permiso explícito y antes de probar escrituras con la cuenta real.
- **Sin migración:** puntos, nivel, días, racha, rating y logros desbloqueados se calculan.

## 9. Cómo se construye

- **`utils/progreso/`**, lógica pura con pruebas:
  - `nivel.ts`: `nivelDe`;
  - `dias.ts`: el día a día del §4, tonos, racha, récord y puntos de la semana;
  - `mesas.ts`: rating, etiqueta, `areaSugerida` y `AREAS`;
  - `logros.ts`: `CATALOGO`, `desbloqueados`, `avance`, `porVer` y `paraPerfil`;
  - `desde.ts`: día 1, curva semanal y subidas de nivel.
- El puntaje (dificultad y bonus) va en `utils/model.ts`, en `difficultyOf` y `pointsFor`.
- **`utils/useProgreso.ts`:** hook que calcula todo con `useMemo` sobre los datos.
- **UI en `components/ui/progreso/`:**
  - `TarjetaNivel`;
  - `TusDias` (heatmap y racha);
  - `FilaMesa`, que se abre con su heatmap;
  - `Medalla` y `GrillaLogros`;
  - `HojaLogros`;
  - `CurvaDesde`, con `react-native-svg` como el `LevelRing`;
  - `LogroNuevo` (el modal), montado una vez en `navigation/TabNavigator.tsx`, como `HojaPlan`.
- Todo con tokens de `theme.ts`, `Txt` e Ionicons de línea (lo verifica `tests/styles.cjs`). Las animaciones van con Reanimated y los resortes `motion.gentle` y `motion.snappy`, respetando `useReducedMotion`.
- Antes de usar APIs de Expo se consulta la documentación de Expo v57 (context7).

## 10. Orden de trabajo

Estimación: 1 a 1,5 semanas. El roadmap lo tenía para el 13–19/11; empieza el 26/10.

1. Puntaje y `nivelDe`, más los textos de Ajustes y del editor.
2. Días, tonos y racha.
3. Mesas: rating, área sugerida, `area` en los datos y chips en `FormMesa`.
4. Logros: catálogo y cálculo, más `logros` en datos y sincronización.
5. Reglas de Firestore, revisión de seguridad y publicación (con permiso).
6. Perfil nuevo y Cuenta en Ajustes.
7. Resumen: Tus días, Desde el día 1 y anillo tocable.
8. Modal de logro y tarjeta resumen.
9. Revisión final, recorrido en el navegador con PruebaClaude, prueba en el iPhone y mezcla en `main`.

## 11. Pruebas

- **Automáticas** (`npm test`):
  - **Puntaje:**
    - dificultad por pasos y lugar, sin fecha;
    - bonus antes, justo a la hora y atrasado;
    - el ejemplo de §3;
    - una meta que congela el bonus en el primer pago.
  - **Niveles:** `nivelDe` en 0, 99, 100, 299, 300, 2.800 y 4.500.
  - **Días:**
    - 0 a 4 de 4 cosas;
    - un día sin agenda, con y sin algo hecho (tono 2 o descanso);
    - una racha con un descanso al medio;
    - hoy bajo el 50%, que no corta;
    - un día en 0% con algo sin fecha hecho, que sí corta;
    - cambio de mes y de año;
    - una cuenta de menos de 12 semanas;
    - los puntos de la semana.
  - **Mesas:**
    - el ejemplo de §5;
    - una mesa nueva con menos de 3 cosas;
    - una mesa quieta 3 semanas (−15);
    - la etiqueta en +5 y −5;
    - General sin rating;
    - cosas sin fecha que suman el día de sus puntos;
    - `areaSugerida` con varios nombres, tildes y mayúsculas.
  - **Logros:**
    - cada umbral, justo antes y justo en el número;
    - un logro que se queda aunque se borre lo que lo dio;
    - la semana perfecta con un descanso al medio;
    - `porVer` y la cola: 1 a 3 de a uno, 4 o más en resumen, y la línea del lanzamiento;
    - `paraPerfil` (4 recientes y 4 más cerca).
  - **Desde el día 1:** el día 1, la curva semanal, las subidas de nivel y una cuenta de menos de 14 días.
  - **Datos:**
    - mesas con y sin `area` en la sincronización y en la validación local;
    - `logros` en la sincronización, el respaldo y la importación;
    - el límite de 24.
  - **Estilos:** los archivos nuevos pasan `tests/styles.cjs`.
- **Reglas:** se revisan con `/security-review` y la skill de auditoría. Las pruebas en emulador necesitan Java 21, que no está instalado, así que se prueban de verdad con PruebaClaude apenas estén publicadas.
- **En el navegador:**
  - con PruebaClaude: Perfil, Resumen, el modal y la tarjeta resumen, los chips de área y Ajustes;
  - con «reducir movimiento» activado.
- **En el iPhone:** las hace el usuario.

## 12. Fuera de alcance

- Amigos y compararse con ellos (F).
- Logros por área y logros que dan puntos.
- Congelar la racha.
- Avisos o notificaciones de racha.
- Un heatmap de más de 12 semanas (la historia completa se ve en la curva).
- Elegir qué logros mostrar en el Perfil.
- Widget.

## 13. Criterios de éxito

- Completar una cosa con fecha límite antes de esa fecha paga un 20% más, y hacerlo atrasado no. El editor lo anticipa.
- Con PruebaClaude:
  - el Resumen muestra tus días con una racha coherente con el heatmap;
  - el Perfil muestra el nivel con la curva nueva, los logros y las mesas con su área sugerida.
- La primera vez sale **un solo** modal «Ya tenías N logros», con la línea de los niveles, y no se repite en otro dispositivo.
- Un logro nuevo, por ejemplo crear la primera rutina en una cuenta nueva, muestra la tarjeta con su animación. Con «reducir movimiento» sale sin giro.
- Cambiar el área en el formulario de mesa se ve en el otro dispositivo.
- Pruebas, revisión de tipos y build web en verde. Prueba en el iPhone aprobada por el usuario.
