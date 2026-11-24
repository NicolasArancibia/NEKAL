# Nekal hoy — avance y pendientes (15/11/2026)

**Trabajo cortado por límite de uso.** De los seis archivos pedidos no se alcanzó a escribir ninguno. Este archivo guarda lo que sí quedó comprobado, para retomar sin repetir la lectura. Nada aquí está inventado: cada punto dice de dónde sale.

## 1. Lo que ya se leyó

- Anteproyecto completo (PDF de julio, texto extraído).
- `00_BASE/RELATO.md`, `REQUISITOS_UDD.md`, `REGISTRO.md` y las notas de las otras sesiones.
- `DOCUMENTOS/V0/INFo_APP.pdf`, `DOCUMENTOS/V1/V1.md` y `PLAN_V1.md`.
- `DOCUMENTOS/V2/ROADMAP.md`, `H_DIAGNOSTICO_Y_PLAN.md`, `H2_VISTAS.md`, y el inicio de `D_NEKA_IA.md` y `H3_CONEXIONES.md`.
- `git log` completo (137 commits).
- Código: `navigation/`, `utils/vistasActivas.ts`, `utils/agente/` (conversar, cerebro, plan, contexto, tipos), y partes de `model.ts`, `planner.ts`, `espacio.ts`.

## 2. Hechos comprobados en el código

| Hecho | Dónde |
|---|---|
| Cinco pestañas: Resumen, Calendario, Espacio, Chat (Neka), Perfil | `front/src/navigation/TabNavigator.tsx` |
| Entrada: bienvenida con cuenta o modo invitado | `navigation/AppNavigator.tsx` |
| El Plano está apagado (`PLANO_ACTIVO = false`, «no se veía bien en el iPhone, 2 nov 2026») | `utils/vistasActivas.ts` |
| Neka es **una sola** asistente: un modelo (`gemini-3.5-flash-lite`) que pide herramientas; la app las ejecuta sobre una copia, hasta 5 vueltas y 30 s por turno | `utils/agente/conversar.ts`, `gemini.ts`, `cerebro.ts` |
| Las instrucciones le prohíben decir «ya lo hice»: debe decir «te propongo…» porque la persona acepta en pantalla; no mueve lo fijo salvo que la persona lo nombre | `conversar.ts` (`INSTRUCCIONES`) |
| 12 herramientas: buscar, buscarHueco, crear, editar, mover, correrDesde, completar, borrar, moverA, juntarEnGrupo, crearGrupo, crearMesa | `utils/agente/herramientas.ts` |
| El «revisor» no es otra IA, es código: `choquesDelPlan` compara los choques antes y después del plan; los que ya había no cuentan | `utils/agente/plan.ts` |
| Si un paso crea un choque, se le devuelve a Neka como error para que busque otro hueco | `herramientas.ts` (líneas 598–606) |
| Al aceptar se revisa de nuevo: si algo cambió, «Algo cambió, pídeselo de nuevo» o «La agenda cambió…»; nada se aplica | `plan.ts` → `aceptar` |
| Lo que Neka sabe: fecha y hora, jornada, mesas, grupos, cosas de ayer a 14 días y pendientes sin fecha, y los últimos 20 mensajes. Nunca adjuntos ni el contenido de notas | `utils/agente/contexto.ts` |
| Si la IA falla hay tres mensajes fijos y vuelve el modo sin IA | `conversar.ts` (`MENSAJES`) |
| Ocho tipos de cosa: Nota, Idea, Evento, Visita, Meeting, Deadline, Goal, Tarea. Evento, Visita y Meeting nacen fijos | `utils/model.ts` (líneas 3–12 y 214) |
| Cuatro tipos de choque: superposición, plazo, dependencia, capacidad | `utils/planner.ts` |
| «Atrasada» es una regla calculada (pendiente, con fecha, más de 2 días); no se guarda nada | `utils/espacio.ts` (`ATRASO_DIAS = 2`) |
| Conexiones con Google y Microsoft: existe el código de conectar cuentas y la hoja «Conecta tus cuentas» | `utils/conexiones/`, `ConexionesContext.tsx`, `components/ui/conexiones/` |

**Sin comprobar todavía en el código** (solo lo dicen los documentos): los 25 logros, la curva de niveles, amigos con código de 6 caracteres, cómo pregunta Neka por lo atrasado en el Resumen, las pantallas Calendario/Perfil/Ajustes, las notificaciones, y hasta dónde llega de verdad la conexión con Google y Microsoft (por los commits parece que solo se conecta la cuenta; el calendario en espejo y el correo son fases H4 y H5, sin commits).

## 3. Línea de versiones (fechas con evidencia)

- **V0** — documento de idea y prototipos de pantallas (`DOCUMENTOS/V0`). Sin fecha propia: los archivos se movieron el 15/10/2026. **Pregunta para Nicolás: ¿cuándo fue?**
- **Anteproyecto** — julio 2026 (según el encargo; el PDF no trae fecha en el texto).
- **V1** — app real con cuentas y datos en la nube. Fechas en `V1.md`: acceso inicial 28/9, sincronización automática 30/9, comprobación 1/10/2026. Neka era local, **sin IA**.
- **V2** — del 15/10/2026 (primer commit) a hoy:
  - A sistema de diseño, 15–16/10
  - B Espacio, 17–18/10
  - D Neka con IA, 19–25/10
  - E gamificación, 25–26/10
  - F amigos, 26/10
  - H1 Neka estable, 1/11
  - H2 vistas simples, 2/11
  - H3 conexiones, desde el 14/11, en curso en la rama `v2/h3-conexiones`

## 4. Anteproyecto frente a hoy (primeras conclusiones)

| Anteproyecto (julio) | Hoy | Razón escrita |
|---|---|---|
| Sistema multiagente: planificador, revisor y monitor | Una asistente; la revisión la hace el código | El ROADMAP (15/10) ya dice «un solo agente». No encontré el porqué escrito: **preguntar a Nicolás** |
| Interfaz espacial con bloques para arrastrar | Círculo del tiempo; Mesas 3D retirada, Plano apagado | `H2_VISTAS.md` §1–2 y `vistasActivas.ts`: se saturaba y no se leía en el iPhone |
| «Semana: carga antes que ocupación» | Calendario con Mes y Agenda, que marca choques | Sin razón escrita |
| «Perfil: reglas personales de equilibrio» | Perfil = progreso y amigos; solo queda la jornada en Ajustes | Sin razón escrita |
| «Nueva tarea: Nekal analiza duración y prioridad y propone dónde ponerla» | Crear es manual, o se le pide a Neka | Sin razón escrita |
| Monitor: carga semanal, postergaciones repetidas | No existe como tal; lo más cercano es la regla de atrasadas | — |
| Prototipo navegable de 6 pantallas | App real publicada | ROADMAP: «todo funcional y real» |
| — | Amigos, lo atrasado, cuentas conectadas | Nuevos |
| «Recursos mnemotécnicos» en el objetivo general | La palabra no aparece en ningún documento de la V2 | Hay que decidir si se mantiene |

Se mantiene: el problema (reorganizar a mano), la idea de negociar con la decisión final en la persona, los tres usuarios, la encuesta y la gamificación.

## 5. Lo que huele a anteproyecto en las piezas (por confirmar pieza por pieza)

- Línea de tiempo cuneiforme → cero → quipu → archivos → agendas: `RELATO.md` §4, lámina 1 sección 03, presentación diapositiva 13. No sostiene nada de la app de hoy.
- Wooldridge (multiagente), Shannon, Beeton, Schmandt-Besserat e Ifrah: bibliografía del anteproyecto sin uso actual.
- Objetivo general con «recursos mnemotécnicos»: `RELATO.md` §7 y las piezas que lo copian.
- Objetivo específico 1 habla de entrevistas; no encontré registro de entrevistas.
- Objetivo específico 4 (evaluar con usuarios): sigue en FALTA.

## 6. Lo que queda por hacer

1. Terminar de comprobar el código (lista «sin comprobar» de la sección 2).
2. Leer `01_LAMINAS/contenido.js`, `v2_minimal/contenido.js`, `02_PRESENTACION/presentacion.html`, `03_VIDEO/GUION.md`, `04_MEMORIA/GUIA_MEMORIA.md` y la sección «Evolución» de la mega maqueta.
3. Buscar y verificar en la web fuentes actuales (IA que propone y la persona decide, confianza en asistentes, reprogramación, gamificación de hábitos).
4. Escribir los seis archivos: `QUE_ES_NEKAL_HOY.md`, `QUE_CAMBIO.md`, `AUDITORIA_DE_PIEZAS.md`, `INVESTIGACION_POR_REHACER.md`, `RELATO_V2_BORRADOR.md`, `LEEME.md`.
