# Nekal V2 — Roadmap

Aprobado el 15 de octubre de 2026. Entrega de tesis: **~10 de diciembre de 2026** (fecha exacta por confirmar).

Objetivo: todo funcional y real (cuentas con mail, datos reales en Firebase), no pantallas de muestra.

Fase 1 (migrar de Codex a Claude Code + kickoff) quedó terminada el 15/10.

## Subproyectos

Cada subproyecto tiene su propio ciclo: brainstorming → spec → plan → implementación. Los specs y planes van en `DOCUMENTOS/V2/`.

| # | Subproyecto | Semanas | Estado |
|---|---|---|---|
| A | Sistema de diseño refinado | 1–2 (16–29 oct) | Implementado y probado en iPhone el 16/10 (rama `v2/a-sistema-diseno`). [Spec](A_SISTEMA_DE_DISENO.md) · [Plan](A_PLAN_IMPLEMENTACION.md) |
| B | Espacio: General como raíz + rediseño del mapa | 1–3 (17 oct–7 nov) | **Terminado y mezclado en `main` el 18/10**: Tiempo, Mesas (Skia) y Plano; rutinas que se repiten. Reglas publicadas, probado en iPhone ("funciona todo perfecto") y revisión final con 4 arreglos de rutinas. Pendientes menores en el [registro](B_REGISTRO_IMPLEMENTACION.md). Cuenta de prueba con 2 semanas de datos de ejemplo ([plan](B_PLAN_IMPLEMENTACION.md); avance en `.superpowers/sdd/B_PLAN_IMPLEMENTACION/progress.md`). Prueba 3D con Skia aprobada en iPhone el 17/10. [Spec](B_ESPACIO.md) · [Sistema visual](B_SISTEMA_VISUAL.md) · [Notas](B_NOTAS_BRAINSTORMING.md) · [Maquetas](B_MAQUETA/) |
| C | Importar Google Calendar | 3–4 (30 oct–12 nov) | Pendiente |
| D | Neka con IA (un solo agente) | 3–4 (30 oct–12 nov) | **Terminado y mezclado en `main` el 25/10** (se adelantó; C queda para después). Gemini Flash-Lite por Firebase AI Logic (gratis; Flash da solo 20 consultas al día), App Check, audio y voz, plan dibujado en el día y acceso rápido (pestaña Neka y Resumen). Reglas publicadas. Prueba en iPhone del 19/10 aprobada (texto, audio y voz); falta la prueba final completa. [Spec](D_NEKA_IA.md) · [Plan](D_PLAN_IMPLEMENTACION.md) · [Registro](D_REGISTRO_IMPLEMENTACION.md) · [Maquetas](D_MAQUETA/) |
| E | Gamificación: puntaje + nivel, rating, logros, heatmap | 5 (13–19 nov) | **Terminado y mezclado en `main` el 26/10** (se adelantó). Perfil = lo que muestras (nivel, 24 logros, mesas con área y rating); Resumen = tu día a día (heatmap, racha, desde el día 1); puntaje con bonus a tiempo y niveles con curva; modal de logro animado. 243 pruebas. Reglas publicadas y probadas con PruebaClaude. Falta la prueba completa en el iPhone (7 pasos del registro). Pendientes menores en el [registro](E_REGISTRO_IMPLEMENTACION.md). [Spec](E_GAMIFICACION.md) · [Plan](E_PLAN_IMPLEMENTACION.md) · [Notas](E_NOTAS_BRAINSTORMING.md) · [Maquetas](E_MAQUETA/) |
| F | Amigos: cuentas, lista, perfil simple | 6–7 (20 nov–3 dic) | **Terminado y mezclado en `main` el 26/10** (se adelantó). Código de amigo de 6 caracteres con solicitud que el otro acepta, sección Amigos en el Perfil + hoja Amigos, perfil en corto del amigo (nivel, logros conseguidos y áreas, sin nombres de mesas) y logro «Primer amigo» (25 logros). Reglas probadas en el emulador (Java 21), auditadas y publicadas; prueba real con dos cuentas aprobada y prueba en el iPhone (7 pasos del registro) aprobada el 26/10. [Spec](F_AMIGOS.md) · [Plan](F_PLAN_IMPLEMENTACION.md) · [Registro](F_REGISTRO_IMPLEMENTACION.md) · [Notas](F_NOTAS_BRAINSTORMING.md) · [Maquetas](F_MAQUETA/) |
| G | Espacios compartidos con amigos | 6–7 (20 nov–3 dic) | Pendiente |
| — | Prueba en iPhone, arreglos, presentación | hasta la entrega | Pendiente |

### A · Sistema de diseño
Refinar el estilo violeta actual con `apple-design` y `ui-ux-pro-max`: jerarquía tipográfica, espaciados, componentes, micro-interacciones. Se puede reemplazar lo que haga falta. Las pantallas que se rehacen después (Espacio) se pulen en su propio subproyecto.

### B · Espacio
El espacio **General** es la raíz con la que parte cada usuario: contiene todos los espacios que cree, y el usuario los ordena dentro de él. Grupos dentro de grupos: posible más adelante, no obligatorio. Elegir dirección visual a partir de `IDEAS_ESPACIODETRABAJO` (la investigación recomienda Territorios como vista habitual + Red para conexiones). Hoy los espacios son planos y el mapa muestra uno a la vez: cambia el modelo de datos.

**Decidido el 17/10** ([spec](B_ESPACIO.md)): General más mesas secundarias de un solo nivel; grupos anidables sin límite; rutinas = grupos que se repiten. Tres vistas de los mismos datos: **Tiempo** (órbitas 2D), **Mesas** (falso 3D con Skia; se prueba primero en el iPhone y el usuario puede pedir three.js) y **Plano** (2D). Estimación de 3 semanas. Por ahora no se corren las fechas de C a G: se revisa al terminar la semana 2.

### C · Google Calendar
Integración para que el usuario no parta de cero. Empezar por importar (lectura). Outlook usa el mismo diseño si queda tiempo.

### D · Neka con IA
Un solo agente de calendario, dentro del Chat que ya existe: entiende el calendario, detecta conflictos y **propone cambios que el usuario confirma** (patrón que la V1 ya usa). El widget conversacional aparte no es necesario.

### E · Gamificación
El nivel ya existe en V1 (1 nivel cada 100 puntos). Revisar la fórmula de puntaje y sumar: rating por categoría que sube al completar, logros que se desbloquean al cruzar umbrales, heatmap tipo GitHub por día cumplido y "progreso desde el día 1". Ideas de referencia (videos): chips de filtro, cards expandibles con heatmap, grilla de logros bloqueados con modal de revelado.

### F · Amigos
Botón de amigos → lista, agregar amigos, ver perfil simple del otro (nivel y algunos logros).

### G · Espacios compartidos
Espacios con amigos. Es el más complejo (hoy cada cuenta está aislada en Firebase). Si falta tiempo, recortar a algo simple (invitar a un amigo a un espacio), no eliminar.

## Decisiones abiertas (se resuelven en el brainstorming de cada subproyecto)

- Servidor para calendario: Firebase Cloud Functions (plan Blaze, requiere tarjeta del usuario) u otra opción. (IA: resuelto en D, Gemini por Firebase AI Logic.)
- Google Calendar en modo prueba admite 100 usuarios; abrir al público requiere verificación de Google.

## Después de la tesis / si sobra tiempo

- Outlook Calendar.
- WhatsApp: el mismo agente por otra puerta (audio → propuesta → confirmación).
- Resumen diario corto con puntos de fricción.
- Sugerencias proactivas de reordenamiento según dificultad y puntaje.
- Logros por patrones reales (rachas, recuperarse tras un mal día).
- IA conectada a un objeto físico (lámpara que cambia de color según pendientes).
- Widget del iPhone para hablarle a Neka más rápido (pedido el 19/10).

## Pendientes del usuario

- Seguir juntando fotos y documentos del espacio de trabajo en `IDEAS_ESPACIODETRABAJO` (ronda nueva).
- Confirmar la fecha exacta de entrega.
