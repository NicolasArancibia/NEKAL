# Pantallas reales de la app

Sacadas el 13/11/2026 con `../herramientas/capturar.mjs` (modo invitado + datos de ejemplo `nekalDemo()`), a 1170 × 2532 px. Para rehacerlas cuando la app cambie: app corriendo en `localhost:8082` y `node capturar.mjs` desde `herramientas/`.

| Archivo | Qué muestra |
|---|---|
| 01-bienvenida | Entrada: iniciar sesión, crear cuenta, invitado |
| 02-logro-nuevo | Modal de logros nuevos |
| 03-resumen | Resumen: pregunta de Neka por algo atrasado, lo siguiente, hoy |
| 04-resumen-tus-dias | Resumen más abajo: racha, mapa de días, «desde el día 1» |
| 05-calendario-mes | Calendario por mes |
| 06-calendario-agenda | Calendario como agenda |
| 07-espacio-circulo | Espacio: círculo del tiempo con las mesas |
| 08-neka-chat | Chat con Neka (vacío, sin conversación) |
| 09-perfil | Perfil: nivel, logros, mesas |

## Faltan (necesitan IA o pasos a mano)

- Neka proponiendo un plan (la hoja «Plan de Neka» con el día dibujado, Aceptar / Descartar): es LA pantalla del proyecto.
- Choque marcado en la Agenda con «Arreglar con Neka».
- Hoja de atrasadas, hoja Nuevo, Amigos y perfil de un amigo.

## Detalles que se ven en las capturas (son de la app, no de la captura)

- En el círculo, las etiquetas «SIN FECHA» y «Universidad» se enciman, y «Trabajo» sale cortada.
- En el mapa de días, «sep» y «oct» se enciman.
- Los datos de ejemplo dejan 34 atrasadas, que no se ve bien para mostrar: conviene un set de datos más limpio para las piezas finales.
