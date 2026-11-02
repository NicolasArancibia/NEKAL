# H1 · Estabilizar Neka — plan de implementación

> **Para quien ejecute:** usar `superpowers:executing-plans` (ejecución nativa, tarea por tarea, como en D, E y F). Los pasos usan casillas `- [ ]`. Ledger en `.superpowers/sdd/H1_PLAN_IMPLEMENTACION/progress.md`; cada decisión fuera del plan = `Ruling`.

**Meta:** que un imprevisto produzca una propuesta coherente que, al aceptarse, no cree choques nuevos, y que Neka explique lo que hace y responda sin ruido técnico.

**Arquitectura:** una sola función pura (`choquesDelPlan`, en `agente/plan.ts`) compara la agenda antes y después de aplicar los pasos de un plan. La usan tres puntos: `ejecutar` (rechaza al modelo una propuesta que choca, para que corrija dentro de sus 5 vueltas), `aceptar` (revalida con la agenda de ese momento) y `HojaPlan` (avisa en vivo). El resto son ajustes pequeños a `planner.ts`, `herramientas.ts`, `contexto.ts` y `conversar.ts`.

**Tecnología:** TypeScript, runner propio de Node (`npm test`), sin dependencias nuevas.

**Spec:** [H_DIAGNOSTICO_Y_PLAN.md](H_DIAGNOSTICO_Y_PLAN.md) (§1 «Neka y reorganización», huecos A–D, Fase 1 puntos 1.1–1.7). Spec de origen de Neka: [D_NEKA_IA.md](D_NEKA_IA.md).

## Restricciones globales

- Rama `v2/h-estabilizacion`; mensajes de commit `V2/H1: …`, con la línea `Co-Authored-By` de siempre. Revisar `git diff` antes de cada commit: el formateador toca líneas ajenas.
- TDD en `utils`: la prueba falla antes de escribir el código. Pruebas nuevas en `front/tests/estabilidad.cjs`, registradas en `front/tests/run.cjs` (`require` y, si es módulo nuevo, la lista de `tsc`).
- Textos de cara a la persona: español neutro, tuteo, breves. Nada de ids internos en lo que ve la persona.
- UI solo con `styles/theme.ts` y `components/ui/base/` (`Txt`, íconos Ionicons de línea); lo verifica `tests/styles.cjs`.
- Antes de dar algo por terminado: `npm test`, `npm run typecheck`, `npm --prefix front run build:web`.
- Doc de Expo v57 solo si se toca algo propio de Expo (aquí no se espera).
- **No se publica nada** (`npm run deploy` solo si se pide).

## Revisión de casos que la spec no nombra

| # | Caso | Qué debe pasar | Prueba en |
|---|---|---|---|
| 1 | Un choque que ya existía antes del plan | No se le atribuye al plan ni lo bloquea | Tarea 1 |
| 2 | El usuario desmarca un paso y el resto deja un choque | Se avisa y no se puede aceptar | Tarea 1 |
| 3 | Mover una Nota/Idea (pasivas) o algo ya completado sobre una reunión | No cuenta como choque | Tarea 1 |
| 4 | Texto de Neka con corchetes que no son ids (`[sic]`) | No se borran | Tarea 4 |
| 5 | Algo con plazo que se corre más allá del plazo | Se marca «no cabe», no se mueve | Tarea 3 |

---

## Archivos

| Archivo | Cambio |
|---|---|
| `front/src/utils/agente/plan.ts` | + `Choque`, `choquesDelPlan`; `aceptar` revalida |
| `front/src/utils/agente/herramientas.ts` | `ejecutar` rechaza lo que choca; texto del salto; alternativa de «no cabe»; plazo en `buscarHueco` |
| `front/src/utils/planner.ts` | `Corrimiento` + `salta`, `pasaPlazo` |
| `front/src/utils/agente/contexto.ts` | `linea` incluye la prioridad si no es media |
| `front/src/utils/agente/conversar.ts` | reglas nuevas en `INSTRUCCIONES`; `quitarIds` |
| `front/src/utils/agente/mensajes.ts` | + `mensajesDelTurno` (un fallo de IA no se guarda) |
| `front/src/utils/NekaContext.tsx` | `aviso` transitorio y `repetir()` |
| `front/src/pages/Chat.tsx`, `front/src/components/ui/neka/HojaPlan.tsx` | muestran aviso, choques y «Pedir de nuevo» (**tras aprobar la maqueta H/01**) |
| `front/tests/estabilidad.cjs` (nuevo), `front/tests/run.cjs`, `front/tests/agente.cjs` | pruebas |

Cada archivo conserva su responsabilidad. No hay archivos nuevos en `src`.

---

### Task 1: `choquesDelPlan` y revalidación al aceptar

**Archivos:** modificar `agente/plan.ts`; crear `tests/estabilidad.cjs` (con los ayudantes `ti`, `cosa`, `viejo` y `llamar` copiados de `agente.cjs:7-26` y `:176`) y registrarlo en `run.cjs`.

**Interfaces — produce:**
```ts
export type Choque = { clave: string; descripcion: string; bloquea: boolean };
export function choquesDelPlan(
  d: AppData, pasos: PasoPlan[], marcados: boolean[], now: number,
): Choque[];
```
Devuelve los choques que **aparecen** al aplicar los pasos marcados sobre `d` (los que `findConflicts(d)` ya tenía no cuentan). `clave` = `tipo|ids ordenados`. `bloquea` = el choque es de tipo `overlap`, `deadline` o `dependency` y alguno de sus ítems es flexible **y** lo toca el plan (está en `toca` de un paso marcado o lo crea). El resto (dos fijos entre sí, `capacity`) avisa y no bloquea.

- [ ] **Paso 1: escribir las pruebas que fallan** (`estabilidad.cjs`):
  - `choquesDelPlan: algo fijo nuevo en el hueco destino bloquea` — caso B: «mamá» flexible 19:30 (30 min), «gimnasio» fijo 19:50 (10 min); plan = `correrDesde 20 min` desde 19:00 (mamá → 20:00). Después se agrega «nuevo» fijo 20:00 con `updatedAt` distinto. Esperado: un choque con `bloquea: true` y `descripcion` que coincide con `/se superpone/`; y `pl.aceptar(d2, plan, [true], ahora19)` lanza `/La agenda cambió/`.
  - `choquesDelPlan: no culpa al plan de choques que ya existían` — dos flexibles ya superpuestos y un plan que solo completa un tercero → `[]`.
  - `choquesDelPlan: dos fijos avisan pero no bloquean` — plan que crea un Evento fijo encima de un Meeting → un choque con `bloquea: false`.
  - `choquesDelPlan: desmarcar un paso puede dejar un choque` — paso 1 saca X de un hueco, paso 2 mete Y en ese hueco; con `[false, true]` hay un choque que bloquea, con `[true, true]` no hay ninguno.
  - `choquesDelPlan: notas y completadas no cuentan` — mover una Nota y una cosa completada sobre una reunión → `[]`.
- [ ] **Paso 2: verlas fallar.** `npm test` → falla con «choquesDelPlan is not a function».
- [ ] **Paso 3: implementar `choquesDelPlan`** en `plan.ts` con `probar` + `findConflicts` de `planner.ts` (sin ciclos de importación: `planner` no importa `plan`). En `aceptar`, tras `probar`, lanzar `Error("La agenda cambió: " + descripcion + " Pídeselo de nuevo.")` con el primer choque que bloquea.
- [ ] **Paso 4: `npm test`** → todo en verde (si una prueba vieja de `agente.cjs` aceptaba un plan que ahora bloquea, se corrige la prueba y se anota un `Ruling`).
- [ ] **Paso 5: commit** `V2/H1: choquesDelPlan y revalidación al aceptar`.

---

### Task 2: Neka no propone lo que choca

**Archivos:** modificar `agente/herramientas.ts` (`ejecutar`, líneas ~552-573); pruebas en `estabilidad.cjs`.

**Consume:** `choquesDelPlan` (Tarea 1). **Produce:** `ejecutar` devuelve `{ resultado: { error }, pasos: [] }` si los pasos nuevos crean un choque que bloquea y que los pasos previos no tenían.

- [ ] **Paso 1: pruebas que fallan** (casos C y D):
  - `ejecutar: mover una tarea sobre algo fijo se rechaza` — «tarea» 18:00, «reunión» fija 20:00–21:00; `mover tarea → 2030-05-06 20:15` → `resultado.error` coincide con `/se superpone/` y `/buscarHueco/`; `pasos` vacío.
  - `ejecutar: crear una tarea sobre algo fijo se rechaza` — `crear Tarea 20:30` sobre esa reunión → igual.
  - `ejecutar: crear un evento fijo sobre algo fijo se permite` — `crear Evento` con `fija: true` → un paso (el aviso lo da la hoja).
  - `ejecutar: mover a un hueco libre sigue funcionando` — `mover tarea → 21:30` → un paso, sin error.
- [ ] **Paso 2: verlas fallar.**
- [ ] **Paso 3: implementar** en `ejecutar`: después de la comprobación de `probar`, comparar los choques que bloquean de `juntos` contra los de `previos`; si hay uno nuevo → error `«Choca: <descripcion> Busca otro hueco con buscarHueco.»`.
- [ ] **Paso 4: `npm test`** en verde.
- [ ] **Paso 5: commit** `V2/H1: ejecutar rechaza propuestas que chocan`.

---

### Task 3: explicar el salto y «no cabe todo» con alternativa

**Archivos:** modificar `planner.ts` (`Corrimiento`, `correrDesde`), `herramientas.ts` (ejecutor `correrDesde`); pruebas en `estabilidad.cjs`; ajustar `agente.cjs:321`.

**Interfaces — produce:** `Corrimiento` gana `salta: string | null` (id de la cosa fija que lo empujó) y `pasaPlazo: boolean` (correrlo lo dejaría después de su `dueAt`; entonces `noCabe` es `true` y `despues === antes`). En `resultado.noCaben`, cada elemento pasa a `{ id, titulo, alternativa }` con `alternativa` = primer hueco del día siguiente (`buscarHueco` desde las 00:00 del día siguiente, formato `AAAA-MM-DD HH:mm`) o `null`.

- [ ] **Paso 1: pruebas que fallan:**
  - `correrDesde: dice qué fijo saltó` — caso A: `p.correrDesde(...)[0].salta === "gimnasio"`; y `salta === null` cuando no choca con nada fijo.
  - `herramientas: el paso explica el salto` — `pasos[0].texto` coincide con `/salta «gimnasio»/`.
  - `correrDesde: no empuja algo más allá de su plazo` — cosa 10:00 de 30 min con `dueAt` 10:30, atraso 20 desde las 9:10 → `noCabe: true`, `pasaPlazo: true`, `despues === antes`.
  - `herramientas: lo que no cabe trae su alternativa` — «tarde» 20:30, atraso 40 desde 20:00 → `noCaben` es `[{ id: "tarde", titulo: "tarde", alternativa: "2030-05-07 08:00" }]` (esto reemplaza lo que hoy afirma `agente.cjs:321`).
- [ ] **Paso 2: verlas fallar.**
- [ ] **Paso 3: implementar.** `salta` = el último `f` del bucle `choca` en `correrDesde`; el texto del paso queda `«<título> 19:30 → 20:00 (salta «<fijo>», que es fija)»` (en `pasoMover` o en el ejecutor).
- [ ] **Paso 4: `npm test`** en verde.
- [ ] **Paso 5: commit** `V2/H1: Neka explica el salto y ofrece alternativa cuando no cabe`.

---

### Task 4: plazo, prioridad y respuestas sin ruido

**Archivos:** modificar `herramientas.ts` (`buscarHueco`), `contexto.ts` (`linea`), `conversar.ts`; pruebas en `estabilidad.cjs`.

**Interfaces — produce:** `export function quitarIds(texto: string, d: AppData): string` en `conversar.ts` (borra `[id]` solo si `id` es de un ítem, grupo o mesa de `d`; colapsa el espacio sobrante). `conversar` la aplica a `respuesta`.

- [ ] **Paso 1: pruebas que fallan:**
  - `buscarHueco: con id usa el plazo de la cosa` — «x» (60 min, `dueAt` 10:00) y «ocupado» fijo 8:00–10:00; `buscarHueco { id: "x", desde: "2030-05-06 09:00" }` → `inicio: null`; sin `dueAt` → `2030-05-06 10:00`.
  - `contexto: la prioridad aparece si no es media` — `linea` de una cosa `urgente` incluye `urgente`; la `media` no incluye `prioridad`.
  - `quitarIds: borra ids reales y respeta corchetes ajenos` — `"Tienes Estirar [gym]."` → `"Tienes Estirar."`; `"Dijo [sic] eso"` queda igual; también borra un id de grupo y uno de mesa.
  - `conversar: la respuesta sale sin ids` — cerebro falso que responde `"Hoy: Gym [gym]"` → `respuesta === "Hoy: Gym"`.
  - `INSTRUCCIONES: pide no escribir ids, listar todo lo pendiente de hoy y ofrecer el siguiente hueco libre cuando lo pedido choca`.
- [ ] **Paso 2: verlas fallar.**
- [ ] **Paso 3: implementar:** en `buscarHueco`, si hay `id` y no hay `hasta`, `hasta = dueAt` de la cosa; `linea` agrega ` · prioridad <x>` si no es `media`; agregar a `INSTRUCCIONES` tres reglas («nunca escribas ids», «si te preguntan qué tienen, incluye todo lo pendiente de hoy con su hora», «si lo que piden choca con algo fijo, dilo y ofrece el siguiente hueco») y «si hay que elegir qué sacrificar, conserva lo urgente».
- [ ] **Paso 4: `npm test`** en verde.
- [ ] **Paso 5: commit** `V2/H1: plazo y prioridad para Neka, respuestas sin ids`.

---

### Task 5: un fallo de IA no se guarda en el historial

**Archivos:** modificar `agente/mensajes.ts`, `NekaContext.tsx`; pruebas en `estabilidad.cjs`.

**Interfaces — produce:**
```ts
export function mensajesDelTurno(
  c: Pick<Contestacion, "respuesta" | "plan" | "fallo">,
): { respuesta: Message | null; plan: Message | null };
```
Con `fallo`, ambos `null` (nada que guardar). Sin fallo: `respuesta` es un mensaje de 3 claves; `plan`, si hay, un mensaje de 6 claves con `estado: "pendiente"` y `plan: c.plan.resumen`. `NekaContext` expone `aviso: string` (el texto del fallo, solo en memoria; se limpia al enviar el siguiente mensaje).

- [ ] **Paso 1: pruebas que fallan:** `mensajesDelTurno: un fallo no guarda nada`; `… sin plan guarda un mensaje de 3 claves`; `… con plan guarda además el mensaje del plan pendiente`.
- [ ] **Paso 2: verlas fallar.**
- [ ] **Paso 3: implementar** `mensajesDelTurno` y usarla en `turnoCon` (`NekaContext.tsx:137-141`); con `fallo`, `setAviso(c.respuesta)` en lugar de `agregar`. La pregunta de la persona sigue guardándose.
- [ ] **Paso 4: `npm test` y `npm run typecheck`** en verde.
- [ ] **Paso 5: commit** `V2/H1: los fallos de IA ya no quedan en el historial`.

---

### Task 6: pantallas — **empieza solo tras aprobar la maqueta H/01**

**Puerta:** antes de tocar `HojaPlan.tsx` y `Chat.tsx` se muestra en el navegador la maqueta `H_MAQUETA/01-plan-de-neka-estados.html` (plan con el salto explicado, plan con aviso, plan que ya no se puede aceptar con «Pedir de nuevo», «no cabe hoy» con alternativa, aviso transitorio en el chat). El diseño y los textos se ajustan a lo que apruebes; la copia queda en `DOCUMENTOS/V2/H_MAQUETA/` y en el manifiesto.

**Archivos:** modificar `HojaPlan.tsx`, `Chat.tsx`, `NekaContext.tsx`.

**Interfaces — consume:** `choquesDelPlan` (Tarea 1), `aviso` (Tarea 5). **Produce:** `Neka.repetir(): void` (descarta el plan pendiente y vuelve a enviar la última pregunta con el mismo origen).

- [ ] **Paso 1:** maqueta H/01 aprobada (anotar en el ledger).
- [ ] **Paso 2: implementar** en `HojaPlan`: `choques = useMemo(() => choquesDelPlan(data, plan.pasos, marcados, Date.now()))`; los que bloquean se muestran en tono de error bajo la lista y desactivan «Aceptar»; los demás, como aviso; si `neka.error` y hay pregunta, botón «Pedir de nuevo» (`neka.repetir`). En `Chat`, mostrar `neka.aviso` como burbuja de Neka al final de los mensajes.
- [ ] **Paso 3: `npm test`, `typecheck`** (incluye `tests/styles.cjs`).
- [ ] **Paso 4: verificar en el navegador** (modo invitado, 8082, con la clave de AI Studio): «pasa X para mañana a las 10», plan con salto explicado, plan que choca rechazado por Neka, y el flujo «La agenda cambió» + «Pedir de nuevo».
- [ ] **Paso 5: commit** `V2/H1: la hoja del plan avisa choques y permite pedir de nuevo`.

---

### Task 7: cierre de la fase

- [ ] **Paso 1:** `npm test`, `npm run typecheck`, `npm --prefix front run build:web`; comprobar que la clave de AI Studio no está en `dist`.
- [ ] **Paso 2:** recorrido completo en el navegador (pedido → propuesta → aceptar → resultado en Resumen y Calendario, sin choques nuevos) y comprobación manual de que, en invitado, un fallo de guardado muestra el aviso «No se pudo guardar» (`AppContext.tsx:173-189`).
- [ ] **Paso 3:** copiar el ledger a `DOCUMENTOS/V2/H1_REGISTRO_IMPLEMENTACION.md`; línea en `CLAUDE.md` (módulos nuevos y que `CLAUDE.md` ya no diga «prueba física pendiente desde V1»); fila H en el `ROADMAP` (C queda absorbida por H; G, aparte).
- [ ] **Paso 4:** prueba en el iPhone por tu parte (Expo Go, con la clave en el archivo de desarrollo).
- [ ] **Paso 5:** mezclar en `main` con `--no-ff` («Mezcla V2/H1: …») y borrar la rama de trabajo, **solo con tu visto bueno**.

---

## Revisión del plan frente a la spec

- Cobertura: 1.1 → Tarea 1 (pruebas A–D repartidas en 1, 2 y 3); 1.2 y 1.3 → Tareas 1 y 2; 1.4 → Tarea 3; 1.5 → Tareas 3 y 4; 1.6 → Tarea 5 (el aviso de guardado en invitado ya existe; se comprueba en la Tarea 7); 1.7 → Tarea 4.
- Consistencia: `Choque`/`choquesDelPlan` se definen en la Tarea 1 y se usan con esa firma en 2 y 6; `mensajesDelTurno` y `aviso` en 5 y 6; `quitarIds` solo en 4.
- Decisión que conviene que revises: **una propuesta de Neka que choca con algo fijo se rechaza (Neka busca otro hueco) en lugar de mostrarse con aviso**; solo se permite y se avisa cuando el choque es entre dos cosas fijas que la persona pidió.
