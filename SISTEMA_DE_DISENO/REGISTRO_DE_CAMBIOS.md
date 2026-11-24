# Registro de cambios de diseño

Lo más nuevo arriba. Cada entrada: qué cambió, por qué y dónde. Las anteriores al 14/11 las reconstruí desde la línea de tiempo de la mega maqueta, el manifiesto de `H_MAQUETA` y los registros de cada fase; los detalles finos están en `DOCUMENTOS/V2/*_REGISTRO_IMPLEMENTACION.md`.

## 19/11/2026 · H5 construido: correo con Neka (pestaña IA)
- La pestaña Chat pasa a llamarse **IA** (ícono `sparkles-outline`, etiqueta «IA: chat y correo») con `Segmentos` Chat | Correo; el chat no cambia. Ya está en el código (aprobado en maqueta el 13/11).
- Componentes nuevos en `front/src/components/ui/correo/` (maqueta 05 D1–D3): `FilaCorreo` (logo de la cuenta, remitente en 800 si no está leído, asunto, por qué está ahí en `primary` o el extracto, punto `primary` de no leído y botón `small` con la acción), `BandejaCorreo` (tarjeta de encabezado con «De N correos de esta semana, M son para ti» y botón de actualizar, avisos por cuenta, «Lo importante», «N correos más» plegable y una línea de privacidad) y `CorreoAbierto` (una sola hoja con el correo en texto plano y la respuesta: indicación para Neka, borrador editable, Enviar / Cancelar y «Nada se envía hasta que tocas Enviar.»).
- Si Neka no puede ordenar, el encabezado dice «Tienes N correos de esta semana.» y debajo «Neka no pudo ordenar tu correo; te muestro todo lo principal.» (cambio tras la prueba real del 19/11).
- Tamaños solo con tokens (`space.*`, `radius.pill`); sin colores sueltos.

## 17/11/2026 · H4 construido: calendario en espejo con Google y Outlook
- Lo de Google/Outlook se ve en Agenda, Mes y Resumen con el ícono de línea `calendar-clear-outline` en vez del círculo de hecho (no son tareas tuyas: no se marcan), y el origen como texto al final del detalle («Google», «Outlook», «en Google y Outlook»). Los de día completo dicen «Todo el día» y no muestran hora.
- `ListRow` gana la prop opcional `icono` (Ionicons de línea, reemplaza al círculo).
- Nuevo `AvisoOrigen` arriba del editor (maqueta 05 C2): una línea por cuenta con `LogoCuenta` chico («De Google · correo» / «Copiado en Outlook · correo») y si los cambios vuelven afuera o es solo lectura.
- Ajustes → «Lo que creas en Nekal va a»: chips que se marcan y desmarcan (Google, Outlook, ambas) más «No copiar»; pedido del usuario tras la prueba real del 16/11. Si algo falla con una cuenta, aparece debajo un texto `danger` en tamaño `caption` con el motivo.
- Diferencia con la maqueta (ver `CONTRADICCIONES_Y_CAMBIOS.md` §2): el origen en las filas es texto, sin logo.

## 16/11/2026 · H3 construido: conectar Google y Outlook
- Componentes nuevos en `front/src/components/ui/conexiones/`: `LogoCuenta` (ficha blanca con el logo de Google o Microsoft), `FilaCuenta` (proveedor, correo y estado con punto de color), `HojaConectar` (modal centrado con Neka, maqueta 05 A1/A2 y el caso de error) y `SeccionCuentas` (Ajustes → «Cuentas conectadas», maqueta 05 B1/B2).
- Dos diferencias con la maqueta, con razón (ver `CONTRADICCIONES_Y_CAMBIOS.md` §2): «Cuentas conectadas» es una sección dentro del panel de Ajustes y el detalle de una cuenta se despliega en la misma fila, no en otra pantalla ni otra hoja; y el estado «Toca para actualizar» usa un punto `warning` + texto secundario, porque `warningSoft` / `warningInk` todavía no están en `theme.ts`.
- La web es instalable: `front/public/manifest.json`, `index.html` con las etiquetas de Apple e íconos `icono-192.png` / `icono-512.png` (Neka pose 5 sobre `#F2F0FA`).
- La pestaña «IA» (Chat | Correo) todavía no está en el código: llega en H5.

## 14/11/2026 · Mega maqueta v2 (suma lo de H3)
- Nuevo archivo `DOCUMENTOS/V2/MEGA_MAQUETA/mega-maqueta-v2.html` (copia en `SISTEMA_DE_DISENO/maquetas/MEGA_MAQUETA/`). **La original `mega-maqueta.html` (2/11) no se tocó.**
- Suma la sección «Conexiones con Google y Outlook» con los cuadros aprobados de `H_MAQUETA/05` (conectar cuentas, cuentas conectadas, calendario en espejo, correo con Neka) y el tutorial guiado de `H_MAQUETA/04` como propuesta sin aprobar; lo decidido el 12 y 13/11; el color ámbar nuevo propuesto; nodos nuevos en el mapa; filas H3 a H6 en el estado; glosario; y la línea de tiempo hasta el 14/11. Se quita «Outlook Calendar» de las ideas para después, porque ya está en H3.
- Se genera con `.superpowers/maquetas/mega_v2.py` (copia en `generar-v2.py`). Revisada en el navegador: los 17 teléfonos de la sección nueva se cargan con sus imágenes y el foco iluminado del tutorial se ve bien.
- Cambio de diseño que viene en esa maqueta: la pestaña **Chat pasa a llamarse «IA»** (ícono de destellos) con **Chat | Correo**. Aprobado en maqueta el 13/11, aún no en el código.
- Pendiente: las 17 fichas de pantallas y el flujo «Calendario» no se tocaron; cuando se construya H3 a H5 hay que actualizarlas.

## 14/11/2026 · Decisiones sobre C1, C2 y C3
- **C1:** el espacio General de las cuentas nuevas parte con `#7546EC` (antes `#7847EB`), en `front/src/utils/model.ts:176`. Las cuentas existentes no se migran. Razón: era un resto de la V1 sin registro y no coincidía con el violeta de la marca.
- **C2:** sin cambios. Queda dormida hasta que se reactive el Plano.
- **C3:** resuelto: el color identifica la mesa; el significado lo da el área.

## 14/11/2026 · Se crea `SISTEMA_DE_DISENO/`
- Se junta en una carpeta: tokens, 22 componentes base y los de Espacio, Neka, Progreso y Amigos, pantallas, 18 poses de Neka, imágenes de referencia, todas las maquetas (A–H y la mega) y los docs de diseño viejos.
- Se escribe `DISENO.md` (documento maestro actualizado) y `CONTRADICCIONES_Y_CAMBIOS.md`.
- **Hallazgos para decidir:** C1 (color de General `#7847EB` ≠ violeta `#7546EC`), C2 (letra mínima 11 px frente a las fichas del Plano), C3 (significado del color de mesa).
- **Hallazgo de pendientes:** la mega maqueta no incluye aún lo de H3 (conexiones, espejo, correo, tutorial) ni los tokens `warningSoft` / `warningInk`.
- Se publica la página tipo Design System (privada, en claude.ai) con portada, tokens, 12 componentes con vista previa y las 18 poses de Neka; sus fuentes quedan en `pagina-design-system/`.
- Se agrega un puntero en `CLAUDE.md` para que toda sesión nueva sepa que esta carpeta existe.
- No se tocó código ni se borró ningún original. `npm test` (338 pruebas) y `npm run typecheck` pasan.

## 13/11/2026 · H3: maqueta 05 aprobada (conexiones, espejo y correo)
- Se aprueban: conectar Google y Outlook al primer uso, Cuentas conectadas, calendario en espejo (con ícono de origen), correo abierto y responder con Neka.
- Correo «solo lo importante» (05 D1) queda en propuesta v2.
- Reemplaza a la maqueta 04 A (solo Google). La 04 B (tutorial guiado) sigue sin aprobar.
- Nuevos colores en la maqueta: `#FFF4DF`, `#8A5A00` (aviso ámbar); aún no están en `theme.ts`.
- Docs: `H3_CONEXIONES.md`, `H3_GUIA_TRAMITES.md`, `H3_PLAN_IMPLEMENTACION.md`. Maquetas: `H_MAQUETA/04-…` y `05-…`.

## 2/11/2026 · H2: vistas simples y atrasadas (aprobado y construido)
- El **Espacio** queda solo con el círculo del tiempo (burbujas «+N»). Mesas 3D retirada del acceso.
- El **Calendario** muestra Mes · Agenda con el nuevo `Segmentos`. El Plano queda **apagado** con el flag `PLANO_ACTIVO = false` (no se veía bien en iPhone). Nada se borró.
- Nueva regla **Atrasada** (pendiente, con fecha, más de 2 días vencida; derivada, no se guarda). Nueva hoja `HojaAtrasadas` y la situación `pregunta` de Neka (Reprogramar / Ya la hice / Soltarla).
- Maquetas `H_MAQUETA/02` y `03`.

## 1/11/2026 · H1: Neka estable
- El plan explica por qué mueve cada cosa, avisa choques sin bloquear, muestra «La agenda cambió» + «Pedir de nuevo» y propone mañana lo que no cabe hoy. El fallo de IA no se guarda en el historial.
- Maqueta `H_MAQUETA/01`.

## 25–26/10/2026 · E (gamificación) y F (amigos)
- Nivel con curva, racha, rating por mesa con área, 25 logros, heatmap «Tus días», modal `LogroNuevo` (Neka pose 5). Nuevos tokens `heat` y `medallaApagada`.
- Amigos con código de 6 caracteres; `Contador` en el botón de personas. Probado en iPhone el 26/10.
- Maquetas `E_MAQUETA/` y `F_MAQUETA/`.

## 19–25/10/2026 · D: Neka con IA
- Chat, audio y voz; plan dibujado en el día (`HojaPlan`, `TarjetaPlan`, `DiaPlan`). Maquetas `D_MAQUETA/`.

## 17–18/10/2026 · B: Espacio
- Tiempo (órbitas), Mesas (3D) y Plano; tokens `mapDot`, `mapEdge`, `cable`, `vidrio`, `vidrioBorde`, `sombraPiso` y los 4 colores de mesa. Maquetas `B_MAQUETA/` (01–07).

## 16/10/2026 · A: sistema de diseño
- Dirección **B v3** (violeta, lavanda, Plus Jakarta Sans), `theme.ts`, componentes base, `TabBar` solo con íconos, `Sheet` desde abajo, sin barra superior. Maqueta `A_MAQUETA/resumen-b-v3.html`.

## 15/10/2026 · Roadmap V2 aprobado
- Problemas de partida: demasiada información por pantalla, textos genéricos, se veía plana, no se sentía app de iPhone; 12 tamaños de letra y ~40 colores sueltos.
