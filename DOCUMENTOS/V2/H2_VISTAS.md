# V2 · H2 — Vistas: círculo, agenda, Plano y atrasadas

Estado: **borrador para tu revisión** (2 nov 2026). Nace de [H_DIAGNOSTICO_Y_PLAN.md](H_DIAGNOSTICO_Y_PLAN.md) (§6) y de las maquetas [H/02](H_MAQUETA/02-vistas-circulo-agenda.html) y [H/03](H_MAQUETA/03-espacio-calendario-neka.html), aprobadas el 2/11/2026. Nada de esto está implementado.

## 1. Objetivo

Que el Espacio y el Calendario se lean bien con una cuenta con muchas cosas (tu cuenta de prueba tiene 132), sin perder la identidad de Nekal ni ningún dato: mesas, grupos, rutinas y cosas siguen intactos.

La causa principal de lo saturado: **todo lo atrasado y sin hacer cae para siempre en el anillo «Hoy»** del círculo (`puesto()` en `acomodo/tiempo.ts`, `enVentana()` en `espacio.ts`) y en las casillas del Plano (`sinAnteriores()` solo esconde los días de rutina *completos*).

## 2. Decisiones aprobadas

1. **Espacio** queda solo con el círculo del tiempo. Se saca el selector de vistas y **Mesas (3D)** deja de ser accesible. Su código **no se borra** en esta fase.
2. **Calendario** pasa a **Mes | Agenda | Plano**. El Plano se mueve ahí y funciona igual que hoy.
3. **Atrasada** = cosa pendiente con fecha (`scheduledAt` o, si no hay, `dueAt`) de **hace más de 2 días de calendario**. Lo **sin fecha no vence nunca**. Es una regla *derivada*: no se guarda nada, no cambia el modelo ni las reglas de Firestore, y reprogramar o completar la cosa la devuelve sola a la vista normal.
4. **Nada se borra solo.** Lo atrasado sale de la vista y de los choques, y tú la reprogramas, la completas o la mandas a la papelera.
5. **Lo importante, Neka lo pregunta.** Importante = atrasada con prioridad **urgente**, o con **fecha límite** (`dueAt`), o de tipo **Deadline**. Pregunta **una a la vez** en el Resumen (Reprogramar · Ya la hice · Soltarla) y, si no contestas, **no insiste hasta mañana**.
6. **El Plano se queda, con una revisión.** La regla de atrasadas se aplica también al Plano (ver §3). Si con tu cuenta real aún no se lee bien, se oculta el botón «Plano» (el código se conserva). Es una decisión que tomamos mirándolo en tu iPhone, no antes.

## 3. La regla de atrasadas y dónde se aplica

Funciones puras en `utils/espacio.ts` (con pruebas):

```ts
export const ATRASO_DIAS = 2;
export function estaAtrasada(i: Item, now: number): boolean;      // pendiente, con fecha, > 2 días
export function atrasadas(d: AppData, now: number): Item[];       // más recientes primero
export function esImportante(i: Item): boolean;                   // urgente | dueAt | Deadline
```

| Dónde | Efecto |
|---|---|
| Círculo (`acomodoTiempo`) | No dibuja las atrasadas. Las que pasaron hace 1–2 días se quedan en «Hoy». |
| Plano (`sinAnteriores` en `rutinas.ts`) | Una ocurrencia de rutina con más de 2 días sale aunque tenga cosas pendientes; sus cosas pasan a ser atrasadas. |
| Choques (`findConflicts`) | Ignora las atrasadas: ya no hay «plazo vencido» ni «sin hueco» por cosas de septiembre. |
| Neka (`contexto.ts`, `nekaState`) | El contexto no las incluye; una línea cuenta las importantes. El Resumen deja de decir «Tienes N entregas vencidas» por lo viejo. |
| Calendario | **Mes** muestra cada cosa en su día (es historia por fecha). **Agenda** empieza hoy y pone las atrasadas en una fila aparte arriba. |
| Puntaje y logros | Sin cambios. Completar una atrasada sigue sumando como hoy. |

## 4. Pantallas

- **Espacio** (`pages/EspacioTrabajo.tsx`): solo `TiempoVista`. Título «Espacio». Mantiene selector de tiempo, crear (+), selección múltiple y arrastrar para cambiar la fecha. Nuevo: la píldora «N atrasadas ›» (abre la hoja) y burbujas «+N» (`agruparNodos` pura: si un sector y anillo juntan más de 6 puntos se dibujan 3 y una burbuja con el resto; tocarla abre la lista). Tocar un punto muestra primero su nombre; tocarlo de nuevo abre la hoja.
- **Calendario** (`pages/Calendario.tsx`): control de tres segmentos. Se acuerda el último modo en el dispositivo (por defecto, Mes, como hoy). Acepta el parámetro `{ modo, destino }` para que «Ver dónde está» y los avisos del borde abran el Plano en su lugar.
  - **Agenda**: función pura `agenda(d, now, dias = 14)` → secciones por día con hora, fin, duración, mesa y marca «Choca» (los mismos choques de Neka). Desde un choque, «Arreglar con Neka» abre su hoja con el pedido hecho. «Ver más» amplía 14 días.
  - **Plano**: la rama de Plano de `EspacioTrabajo` se extrae a un componente `PlanoVista` (navegación ‹, «Editar», `PlanoCerca`/`PlanoLejos`, crear, selección, hoja, formularios). Lo usan solo el Calendario.
- **Hoja «Atrasadas»** (`components/ui/neka/` o `espacio/`): *Importantes* arriba con su etiqueta («Con entrega», «Urgente»), luego *Las demás*. Cada fila: abrir, **A hoy**, completar. Abajo, «Mandar las N a la papelera» con confirmación.
- **A hoy** = el primer hueco libre **de hoy** desde ahora (`buscarHueco`, respetando fijos); si hoy no cabe, avisa «Hoy no cabe» y no cambia nada.
- **Resumen**: la tarjeta de Neka admite hasta 3 botones. Con una importante atrasada pregunta (una a la vez, la más importante primero y, dentro de eso, la más reciente). **Reprogramar** pide a Neka el primer hueco libre y lo muestra en su hoja del plan (tú aceptas; reutiliza H1); **Ya la hice** la completa; **Soltarla** la manda a la papelera. «Hoy no preguntes más por esta» se guarda en el dispositivo (`AsyncStorage`, clave `nekal:atrasadas:pospuestas`, por cosa y día).

## 5. Mesas (3D)

Se quita `"mesas"` de `VistaSelector`/`useEspacioPrefs` y de `EspacioTrabajo`. Una preferencia guardada con `"mesas"` o `"plano"` se lee como `"tiempo"`. `MesasVista*`, `MesasLienzo`, `MesasAccesible`, `acomodo/mesas.ts` y `proyeccion.ts` quedan sin usar, con sus pruebas, y `CLAUDE.md` lo dice. Borrarlos (y Skia, `canvaskit.wasm`) es un paso aparte, solo si lo pides.

## 6. Pruebas

Nuevo `tests/vistas.cjs`, con la prueba escrita primero:

- `estaAtrasada`: justo hace 2 días = no, hace 3 = sí; sin fecha = nunca; completada = no; usa `scheduledAt` antes que `dueAt`.
- `acomodoTiempo` no dibuja atrasadas; con un conjunto de ~80 cosas (34 atrasadas) los puntos de «Hoy» bajan de 48 a 14 (el caso de la maqueta).
- `findConflicts` ignora atrasadas y sigue marcando las de ayer.
- `sinAnteriores` esconde ocurrencias viejas con cosas pendientes y conserva las de hoy y ayer.
- `agenda`: orden, secciones, duración y «Choca».
- `esImportante` y la pregunta de Neka: orden, una a la vez, respeta lo pospuesto.
- «A hoy»: hueco hoy; sin hueco no cambia nada.
- `agruparNodos`: límite de 6, centroide de la burbuja, sin pérdida de puntos.
- Preferencias: `"mesas"` guardado → `"tiempo"`.
- `nekalDemo()` (invitado) suma ~30 atrasadas, 2 importantes y una rutina con días viejos, para verificar en el navegador (`tests/demo.cjs`).

Además: `npm test`, `npm run typecheck`, `build:web`, recorrido en el navegador (invitado, puerto 8082) y tu prueba en el iPhone.

## 7. Fuera de alcance

Borrar el código 3D o Skia; mostrar en el círculo lo que propone Neka; cambiar datos, reglas de Firestore o la gamificación; Google Calendar (Fases 3–4).

## 8. Riesgos

- **Plano con datos reales**: se mitiga con la regla y se decide en tu iPhone (§2.6).
- **`findConflicts` es compartido** con Resumen y Neka (V1 y V2): la regla toca tres sitios; las pruebas existentes (296) tienen que seguir verdes.
- **Caché del hosting** (1 hora): para ver una publicación nueva, abrir con `?v=…`.

## 9. Orden de las tareas (el plan las detalla)

1. Regla pura y pruebas. 2. Aplicarla: círculo, choques, Neka, `sinAnteriores`. 3. `agruparNodos` y nombre al tocar. 4. `agenda`. 5. Espacio solo círculo y preferencias. 6. Calendario con tres modos, `PlanoVista` y navegación. 7. Hoja «Atrasadas», píldora y fila. 8. Neka pregunta en el Resumen. 9. Datos de demo, verificación, registro y mezcla.

## 10. Criterios de éxito

Con una cuenta de ~130 cosas: el círculo se lee (sin amontonar lo viejo), la Agenda muestra los próximos días con sus choques, lo importante atrasado lo pregunta Neka, no se pierde ningún dato, y tú decides en el iPhone si el Plano se queda.
