# Nekal V2 — Roadmap

Aprobado el 15 de octubre de 2026. Entrega de tesis: **~10 de diciembre de 2026** (fecha exacta por confirmar).

Objetivo: todo funcional y real (cuentas con mail, datos reales en Firebase), no pantallas de muestra.

Fase 1 (migrar de Codex a Claude Code + kickoff) quedó terminada el 15/10.

## Subproyectos

Cada subproyecto tiene su propio ciclo: brainstorming → spec → plan → implementación. Los specs y planes van en `DOCUMENTOS/V2/`.

| # | Subproyecto | Semanas | Estado |
|---|---|---|---|
| A | Sistema de diseño refinado | 1–2 (16–29 oct) | Implementado y probado en iPhone el 16/10 (rama `v2/a-sistema-diseno`). [Spec](A_SISTEMA_DE_DISENO.md) · [Plan](A_PLAN_IMPLEMENTACION.md) |
| B | Espacio: General como raíz + rediseño del mapa | 1–3 (17 oct–7 nov) | En implementación en la rama `v2/b-espacio`: tareas 1–2 de 13 listas ([plan](B_PLAN_IMPLEMENTACION.md); avance en `.superpowers/sdd/B_PLAN_IMPLEMENTACION/progress.md`). Prueba 3D con Skia aprobada en iPhone el 17/10. [Spec](B_ESPACIO.md) · [Sistema visual](B_SISTEMA_VISUAL.md) · [Notas](B_NOTAS_BRAINSTORMING.md) · [Maquetas](B_MAQUETA/) |
| C | Importar Google Calendar | 3–4 (30 oct–12 nov) | Pendiente |
| D | Neka con IA (un solo agente) | 3–4 (30 oct–12 nov) | Pendiente |
| E | Gamificación: puntaje + nivel, rating, logros, heatmap | 5 (13–19 nov) | Pendiente |
| F | Amigos: cuentas, lista, perfil simple | 6–7 (20 nov–3 dic) | Pendiente |
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

- Servidor para calendario e IA: Firebase Cloud Functions (plan Blaze, requiere tarjeta del usuario) o Firebase AI Logic (Gemini, sin servidor propio).
- Proveedor de IA (Gemini vía Firebase o Claude vía servidor).
- Google Calendar en modo prueba admite 100 usuarios; abrir al público requiere verificación de Google.

## Después de la tesis / si sobra tiempo

- Outlook Calendar.
- WhatsApp: el mismo agente por otra puerta (audio → propuesta → confirmación).
- Resumen diario corto con puntos de fricción.
- Sugerencias proactivas de reordenamiento según dificultad y puntaje.
- Logros por patrones reales (rachas, recuperarse tras un mal día).
- IA conectada a un objeto físico (lámpara que cambia de color según pendientes).

## Pendientes del usuario

- Seguir juntando fotos y documentos del espacio de trabajo en `IDEAS_ESPACIODETRABAJO` (ronda nueva).
- Confirmar la fecha exacta de entrega.
