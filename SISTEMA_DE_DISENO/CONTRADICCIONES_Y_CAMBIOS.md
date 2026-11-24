# Contradicciones, cambios y pendientes de diseño

Revisado el **14/11/2026** comparando: los docs viejos (`docs-anteriores/`), el código (`tokens/`, `componentes/`) y las maquetas (`maquetas/`, sobre todo la mega maqueta y la fase H).

Regla que usé: algo es **contradicción** solo si dos fuentes dicen cosas incompatibles *y no hay una razón registrada*. Si un doc quedó viejo porque el diseño evolucionó a propósito, es un **cambio** (sección 2) y no hay nada que decidir. **No elegí nada en silencio**: lo de la sección 1 espera tu decisión.

---

## 1. Contradicciones reales (las 3 decididas el 14/11/2026)

### C1 · El color de «General» no es el violeta de la marca
> **Decidido (14/11): igualar en cuentas nuevas.** `model.ts:176` ahora crea General con `#7546EC`. Las cuentas existentes conservan `#7847EB` (no se migraron). Los archivos de prueba `front/tests/fixtures/*-v1.json` y `tests/sync.cjs` siguen con `#7847EB` a propósito: representan datos guardados de la V1. `npm test` (338) y `typecheck` pasan.

- **Código:** `front/src/utils/model.ts:176` crea el espacio General con `color: "#7847EB"`.
- **Sistema:** el violeta principal es `#7546EC` (`theme.ts`, docs A y B, mega maqueta) y `COLORES_MESA[0]` también.
- **Qué pasa:** son dos violetas casi idénticos pero distintos. Parece un resto de la V1, no una decisión. No hay ningún registro que explique el cambio.
- **Ojo:** ese color se guarda en las cuentas ya creadas; cambiarlo en el código solo afecta a cuentas nuevas.
- **Opciones:** (a) igualarlo a `#7546EC` en cuentas nuevas; (b) dejarlo y documentarlo; (c) además migrar las cuentas existentes. *Recomendación: (a), que es lo más barato.*

### C2 · Tamaño mínimo de letra: 11 px frente a las fichas del Plano (9.5–10.5 px)
> **Decidido (14/11): dormida hasta reactivar el Plano.** No se cambia nada; se decide solo si `PLANO_ACTIVO` pasa a `true`.

- **Doc A §3:** «Mínimo absoluto: 11 px».
- **Doc B (`B_SISTEMA_VISUAL.md` §4):** la ficha de Plano usa título 10.5–11/700 y dato **9.5**/600.
- **Estado:** *dormida*. El Plano está apagado (`PLANO_ACTIVO = false`) y el código real usa solo la escala de `theme.ts` (mínimo 12). Solo importa si algún día se reactiva el Plano.
- **Decisión pendiente solo al reactivarlo:** subir las fichas a ≥ 11 px o aceptar la excepción.

### C3 · «El significado de cada color de mesa se define más adelante» (nunca se definió)
> **Decidido (14/11): resuelto.** El color identifica la mesa; el significado lo da el área. Ya está escrito así en `DISENO.md` §2.4 y en la página Design System.

- **Doc B §2** dejó los 4 colores de mesa como «provisorios» y dijo que su significado se definiría después.
- **Hoy:** esos mismos 4 colores son los reales (`COLORES_MESA`) y el significado quedó en la **área** de la mesa (Estudio, Trabajo, Salud, Hogar, Social, Personal), no en el color.
- **Esto no choca**, pero el doc B sigue diciendo «provisorio». Propongo darlo por resuelto: **el color identifica la mesa; el significado lo da el área**. ¿Te parece?

---

## 2. Cambios con razón (no son contradicciones; el doc viejo quedó atrás)

| # | Lo que dice el doc viejo | Lo que es hoy | Razón / dónde está registrado |
|---|---|---|---|
| 1 | A §7: Neka usa 5 poses (1, 3, 7, 14, 15) | **6 poses**: se suma la 5 (celebra logros) | Fase E, spec §6.3 |
| 2 | A §7: 7 situaciones de Neka | **8**: se suma `pregunta` (cosa importante atrasada) | Fase H2 (2/11), `H2_VISTAS.md` |
| 3 | A §3: radios `sm 12 · md 20 · lg 26 · pill` | Además `badge 14` | A ya usaba 14 en `IconBadge`; B lo lista. Fue omisión del doc A |
| 4 | A §3: 11 colores base | Se suman `lineStrong`, `onPrimary`, `backdrop` + los de Espacio y gamificación | `lineStrong` es WCAG 1.4.11 (comentado en `theme.ts`); el resto, fases B y E |
| 5 | A §4: 17 componentes base | **22** (más el ayudante `nekaImage`): se suman `Segmentos`, `Contador`, `Disclosure`, `SectionTitle`, `PressableScale` | Fases E, F y H2 |
| 6 | A §4: tonos de `Txt` = ink, secondary, primary, danger, done | Además `onPrimary` | Texto sobre botones violeta |
| 7 | A §3 nombra `spring.gentle` / `spring.snappy` | En código es `motion.gentle` / `motion.snappy` | Solo cambió el nombre |
| 8 | B: Espacio con 3 vistas (órbita · cubo · mapa) y Calendario con Plano | **Espacio = solo círculo**; Calendario **Mes · Agenda**; Mesas 3D y Plano apagados | H2 (2/11): el Plano no se veía bien en iPhone. Nada se borró; flag `PLANO_ACTIVO` |
| 9 | B: «Selector de vistas de 3 segmentos» | Ahora es `Segmentos` con texto (Mes · Agenda) | H2, maquetas 02 y 03 |
| 10 | A §13: «Fuera de alcance: visual de logros, rating y heatmap» | Construidos | Fase E |
| 11 | A §11: eliminar `Common.tsx` y `globalStyles.ts` | **Cumplido**: ya no existen | Fase A, paso 10 |
| 12 | A §3: «`theme.ts` es la única fuente»; `colores.ts` tiene los 4 colores de mesa y `demo.ts` y `model.ts` también escriben colores | Los colores de **mesa** son datos que elige el usuario, por eso viven en `utils/colores.ts` | Dato, no estilo. Los componentes sí usan solo `theme.ts` |
| 13 | Mega maqueta §7: «Outlook» como idea futura y «Importar Google Calendar: pendiente» | El 13/11 se aprobó Google **y Outlook**, calendario en espejo y correo con Neka (maqueta 05) | La mega maqueta es anterior (2/11). Falta incorporar H3 (ver §3) |
| 14 | Maqueta 04 A: pop-up solo para conectar Google | Reemplazado por 05 A1: «Conecta tus cuentas» (Google + Outlook, filas grandes) | Aprobado el 13/11. La 04 se conserva |
| 15 | `theme.ts`: `warning` `#E8962E` | La maqueta 05 usa `#8A5A00` sobre `#FFF4DF` para el aviso «Permiso vencido» | `#E8962E` sobre blanco da ~2.3:1 (no sirve como texto); hace falta un ámbar oscuro. Ver §3 |
| 16 | E §3 y mega: «dificultad sin fecha límite, bonus ×1,2 a tiempo» | Ya es lo vigente | Fase E. (Es regla de puntaje, no de diseño) |

---

### H3 (16/11/2026) · «Cuentas conectadas» en el código frente a la maqueta 05 B1/B2
- **Maqueta:** pantalla propia (Ajustes → Cuentas conectadas) y una pantalla de detalle de la cuenta con la hoja «¿Desconectar Outlook?»; el aviso «Toca para actualizar» va en ámbar (`#FFF4DF` / `#8A5A00`).
- **Código:** es una sección dentro del panel de Ajustes; tocar una cuenta despliega «Actualizar» y «Desconectar» (con la confirmación) en la misma fila; el estado usa un punto `color.warning` y texto secundario.
- **Razón:** Ajustes ya es un panel y en el iPhone un Modal no puede abrirse sobre otro (el proyecto ya evita paneles anidados, spec E §7.1); el ámbar no está en `theme.ts` (ver §3). Registrado en `DOCUMENTOS/V2/H3_REGISTRO_IMPLEMENTACION.md`.

### H4 (17/11/2026) · El origen en las filas es texto, no un logo chico
- **Maqueta 05 C1:** cada evento de afuera lleva el logo chico de Google o Outlook en la fila, y el selector de destino es de una sola opción.
- **Código:** el origen va como texto al final del detalle («Google», «Outlook», «en Google y Outlook») y la fila usa el ícono `calendar-clear-outline` en vez del círculo de hecho; el selector de destino permite varias cuentas a la vez.
- **Razón:** `ListRow` solo acepta texto en el detalle (un logo pediría otro componente de fila); varias cuentas a la vez lo pidió el usuario tras la prueba real del 16/11. Registrado en `DOCUMENTOS/V2/H4_REGISTRO_IMPLEMENTACION.md`.

## 3. Cosas nuevas que aún no están en el sistema ni en el código

1. **Tokens de color de la maqueta 05** (hay que sumarlos a `theme.ts` al construir H3, o `tests/styles.cjs` los rechazará): `warningSoft` `#FFF4DF`, `warningInk` `#8A5A00`, y por decidir `#F4F1FB` (cifra destacada; ¿usar `medallaApagada`?).
2. ~~La mega maqueta no incluye lo de H3.~~ **Resuelto el 14/11:** `mega-maqueta-v2.html` suma conectar cuentas, cuentas conectadas, calendario en espejo, correo con Neka y el tutorial (como propuesta). La original se conserva.
2b. **Cambio que viene y no está en el código:** la pestaña **Chat se llamará «IA»** (ícono de destellos) con **Chat | Correo** (maqueta 05, aprobada el 13/11). Hoy el código y el doc A siguen diciendo «Chat con Neka».
3. **Estados de aprobación pendientes** (manifiesto de H_MAQUETA): `04 A` y `04 B` (tutorial guiado) **sin aprobar**; `05 D1` (correo: solo lo importante) en **propuesta v2**.
4. **Componentes nuevos que H3 pedirá** y que aún no existen: fila de cuenta (logo + correo + estado), insignia de origen (Google/Outlook) para Agenda, Mes, círculo y detalle, aviso ámbar, tutorial con foco iluminado.
5. **Poses de Neka sin uso:** hay 18 poses y la app usa 6. Las otras 12 (2, 4, 6, 8–13, 16–18) están disponibles; ninguna tiene significado asignado.
6. **Sin documentar hasta hoy:** el comportamiento de las pantallas está repartido en 9 docs de fase; este sistema los resume en `DISENO.md` §11 pero la descripción de pantallas sale de los specs y de la mega maqueta, **no la verifiqué mirando cada pantalla en la app**.

---

## 4. Menores (sin decisión necesaria)

- La pestaña de Chat se llama «Chat» en el doc A y «Chat con Neka» en el código (etiqueta de accesibilidad). Es solo la redacción.
- El doc B describe «mesa ◇» y emojis (📅 📍 💬) para los tipos; la app usa Ionicons de línea. Los emojis eran solo ejemplo de la maqueta.
