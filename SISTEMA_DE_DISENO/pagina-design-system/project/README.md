Nekal es una app de organización personal con cinco pestañas (Resumen, Calendario, Espacio, Chat con Neka, Perfil). Se ve violeta sobre lavanda, con tarjetas blancas muy redondeadas, y Neka, la mascota, aparece solo cuando tiene algo que decir. Corre en web y en iPhone (Expo, React Native).

> La fuente de verdad del código es `front/src/styles/theme.ts` y `front/src/components/ui/base/` del repositorio de Nekal. Este sistema es una referencia ordenada de ese código y de las maquetas aprobadas, actualizada el 14/11/2026. Si algo no coincide con la app, manda el código y se anota el cambio.

## Fundamentos de contenido

- Escribe corto y concreto: una oración por tarjeta, títulos de una a tres palabras, con horas, números y nombres reales («Hoy tienes 4 cosas. La siguiente es a las 16:00.»).
- Tutea, en español neutro de Chile. Sin eslóganes ni frases motivacionales genéricas.
- Los botones llevan un verbo directo: «Resolver», «Crear tarea», «Mover», «Aceptar», «Descartar», «Reprogramar».
- Un error dice qué pasó y qué hacer. Las explicaciones largas van en un desplegable, no en la vista principal.
- Singular y plural correctos («1 cosa», «4 cosas»). Horas en 24 h (`19:00`).
- Vocabulario fijo: *cosa* (cualquier ítem), *mesa* (cada gran espacio de tu vida; **General** es la raíz), *grupo*, *rutina*, *área* (Estudio, Trabajo, Salud, Hogar, Social, Personal), *plan* (la propuesta de Neka antes de aceptarla), *choque*, *atrasada*.

## Fundamentos visuales

- Fondo de pantalla `background`; tarjetas `surface` con radio `radius-md` y sombra `shadow-card`. La tarjeta destacada (nivel, mensaje de Neka) usa `primary-soft` y `radius-lg`.
- Una sola cosa destacada por pantalla; el resto va liviano. El violeta `primary` marca la acción principal, la selección y lo activo.
- Todo el texto va en Plus Jakarta Sans con los estilos `large-title`, `title`, `headline`, `body`, `callout` y `caption`. No hay otros tamaños. Las horas llevan cifras tabulares.
- Espaciado en pasos de 4 (`space-xs` a `space-xxxl`); margen lateral `space-screen`. Nada que se toque mide menos de `touch-min`.
- El color nunca es la única señal: urgente, vencido o conflicto llevan palabra o ícono además de `danger`.
- El color de una mesa (`mesa-violet`, `mesa-green`, `mesa-orange`, `mesa-gray`) identifica la mesa y solo va en puntos, franjas, anillos y el círculo de completar; nunca como fondo grande. Su significado lo da el área, no el color.
- Movimiento: toque con escala 0,97 y resorte rápido (amortiguación 18, rigidez 420, masa 0,6); hojas y tarjetas que se expanden con resorte suave (20, 180, 1); fundido de 180 ms. Con «Reducir movimiento» solo hay fundidos. En vibración: selección al cambiar de pestaña y éxito al completar o aceptar.
- Sin modo oscuro.
- Las hojas suben desde abajo con `radius-lg` arriba, manija y `backdrop` detrás; se cierran arrastrando, tocando el fondo o con «Cerrar» (que siempre existe).
- La barra inferior va pegada abajo, a todo el ancho, solo con íconos: el activo mide `tab-icon-active` y va en `primary`; los demás, `tab-icon` y `ink-secondary`.

## Iconografía

- Solo Ionicons de línea (`*-outline`), de `icon` (22 px), en `primary` o `ink`. Sin emojis ni íconos rellenos.
- Pestañas: Resumen `grid-outline`, Calendario `calendar-outline`, Espacio `git-network-outline`, Chat `chatbubble-outline`, Perfil `person-outline`.
- Áreas: Estudio `school-outline`, Trabajo `briefcase-outline`, Salud `barbell-outline`, Hogar `home-outline`, Social `people-outline`, Personal `heart-outline`.
- Un ícono suelto va en una `IconBadge`: cuadrado `primary-soft` de 42 px con radio `radius-badge`.

## Neka

Hay 18 poses (grupo Neka en Assets); la app usa seis, cada una con un significado fijo. Pon a Neka como máximo una vez por pantalla y solo cuando comunica algo: pose 1, todo listo por hoy; 3, saludo (cuenta nueva, día libre, sin amigos, invitado); 5, celebra un logro nuevo; 7, pensando o armando un plan; 14, atención (conflicto, cosa vencida, pregunta por lo atrasado); 15, día con cosas pendientes. Las otras doce no tienen significado asignado.

## Pantallas vigentes

Resumen (saludo, nivel, tarjeta de Neka, «Lo siguiente», «Hoy», progreso, «Tus días»), Calendario (`Segmentos` Mes · Agenda), Espacio (**solo el círculo del tiempo**), Chat con Neka, Perfil y Ajustes. Mesas 3D y el Plano existen en el código pero están apagados con un flag (`PLANO_ACTIVO = false`); no los muestres.

## Lo que viene y aún no existe en el código

Conexiones con Google y Outlook, calendario en espejo y correo con Neka (maqueta 05, aprobada el 13/11/2026). Necesitarán tokens nuevos de aviso ámbar (`#FFF4DF` de fondo y `#8A5A00` de texto), una fila de cuenta y una insignia de origen. El tutorial guiado sigue sin aprobar. No los inventes: pide la maqueta.

## Dónde mirar más

En el repositorio, la carpeta `SISTEMA_DE_DISENO/` guarda copias del código, las maquetas (con la mega maqueta), los docs viejos, el registro de cambios y las contradicciones por decidir.
