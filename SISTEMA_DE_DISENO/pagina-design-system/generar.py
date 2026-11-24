import json, os, sys
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "project")

POSES = {
 1: "a4b0e4a97f279ca275c6602cd2bc30b5", 2: "5c8b54e9329ecd36c496074310a95598", 3: "5357306ebaaac21dfa1d81b2fbf68c85",
 4: "bd4f71dfbec42094dabe51d743758b49", 5: "798f16ff5b79dbf188c1f634a7e5e8f9", 6: "84962367ca431bd3d063bcfcb34fefb3",
 7: "b8de440757138d61793d4b74edf3ea9e", 8: "edf1e1c32c8651f12deb1e62e87f1061", 9: "fd8efd82bbdb56c2385b5666e8355940",
 10: "8a3634aeb5499c89dd049963c6b71b10", 11: "63f2a9c3e33901bcbe3d2500fc1c6365", 12: "9a44a94a761e1aa20f8132c03d415d60",
 13: "3278307b7ae2ac8a3f7a853162a1117d", 14: "b84ead71efd7fc96de89430235b5df4a", 15: "69f813f5c3e9a0d7c661ad60f62c288b",
 16: "f13155da5ea44242a8f002c9063ed969", 17: "a14c5db26c6c228856c130f58925f41b", 18: "342ca64660c90996070039d618bb2602",
}
SIZES = {1:34561,2:32099,3:32668,4:31957,5:34045,6:34131,7:32937,8:32590,9:34422,10:31494,11:34082,12:32836,13:33540,14:40311,15:51537,16:34335,17:33588,18:34874}

def w(path, text):
    p = os.path.join(OUT, path)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)

# ---------------------------------------------------------------- tokens.json
def c(name, value, usage): return {"name": name, "value": value, "usage": usage}
color = [
 c("primary", "#7546EC", "Marca y acción principal: botón primario, pestaña activa, selección, nivel. Texto o ícono sobre `surface` y `background` (5,5:1 y 5,2:1) y sobre `primary-soft` (4,6:1)."),
 c("primary-soft", "#EFE7FF", "Fondo de íconos, chips, segmento de la cápsula, tarjeta destacada de Neka y botón secundario. Lleva texto `ink` o `primary`."),
 c("background", "#FAF8FF", "Fondo de cada pantalla (lavanda muy claro). Texto `ink` e `ink-secondary` encima."),
 c("surface", "#FFFFFF", "Tarjetas, hojas, barra inferior y campos. Texto `ink`, `ink-secondary`, `ink-done` y `primary` encima."),
 c("ink", "#241D38", "Texto principal y ícono oscuro, sobre `background`, `surface`, `primary-soft` y `line` (más de 13:1)."),
 c("ink-secondary", "#6F6683", "Texto de apoyo: horas, detalles, notas, íconos de pestañas inactivas. Sobre `background` y `surface` (5,1:1 y 5,4:1). Sobre `primary-soft` llega a 4,49:1, un pelo bajo el mínimo: ahí usar `ink`."),
 c("ink-done", "#776E8A", "Texto tachado de las cosas completadas, sobre `surface` (4,8:1) y `background` (4,6:1)."),
 c("line", "#EEE9F6", "Divisores, bordes de tarjeta y riel de las barras. Decorativo: no lleva información por sí solo."),
 c("line-strong", "#948BA6", "Borde de campos e interruptores apagados (WCAG 1.4.11: 3,2:1 sobre `surface`, 3,1:1 sobre `background`). Nunca como texto."),
 c("danger", "#B42A55", "Errores, conflictos, urgente y el contador rojo. Texto sobre `surface` (6,2:1) y sobre `danger-soft` (5,3:1). Siempre va con una palabra o un ícono."),
 c("danger-soft", "#FCE8EF", "Fondo de la etiqueta de urgencia y de los avisos de error. Lleva texto `danger`."),
 c("success", "#2F9E77", "Confirmaciones y completado. Solo ícono, marca o relleno (3,4:1 sobre `surface`): no usarlo como texto pequeño."),
 c("warning", "#E8962E", "Avisos como relleno o marca. NO sirve como texto (2,4:1 sobre `surface`). La maqueta de conexiones (13/11) propone un ámbar oscuro `#8A5A00` sobre `#FFF4DF` para texto de aviso; aún no está en el código."),
 c("on-primary", "#FFFFFF", "Texto e íconos sobre `primary` y sobre `danger` (5,5:1 sobre `primary`)."),
 c("backdrop", "rgba(32, 20, 54, 0.35)", "Fondo atenuado detrás de hojas y del modal de logro."),
 c("map-dot", "#DBCEF6", "Decorativo del círculo del tiempo (Espacio). No se usa como texto."),
 c("map-edge", "#CFBAF6", "Decorativo del círculo del tiempo (Espacio). No se usa como texto."),
 c("cable", "#B9A6F4", "Conexiones entre mesas y fuentes externas, línea de 1,6 a 2,4 px."),
 c("glass", "rgba(255, 255, 255, 0.18)", "Mesa «tranquila» en vidrio (Mesas 3D, hoy apagado)."),
 c("glass-border", "#D3C6F5", "Borde punteado del vidrio."),
 c("floor-shadow", "rgba(70, 40, 140, 0.20)", "Sombra de piso de Mesas 3D (hoy apagado)."),
 c("medal-off", "#F6F3FC", "Fondo de la medalla de un logro que aún falta; lleva ícono `line-strong` y candado."),
 c("heat-0", "#EEE9F6", "Heatmap «Tus días»: nada de lo que tenías ese día. No suma a la racha."),
 c("heat-1", "#DCCFFB", "Heatmap: poco. No suma a la racha."),
 c("heat-2", "#BBA3F6", "Heatmap: la mitad. Desde este tono el día suma a la racha."),
 c("heat-3", "#9773F0", "Heatmap: casi todo."),
 c("heat-4", "#7546EC", "Heatmap: todo listo."),
 c("mesa-violet", "#7546EC", "Color de mesa 1. Se guarda en cada mesa; va en puntos, franjas, anillos y detalles, nunca como fondo grande."),
 c("mesa-green", "#2E9E6B", "Color de mesa 2 (mismo uso que `mesa-violet`)."),
 c("mesa-orange", "#D9693C", "Color de mesa 3 (mismo uso que `mesa-violet`)."),
 c("mesa-gray", "#948BA6", "Color de mesa 4, la «tranquila» (mismo uso que `mesa-violet`)."),
]
def st(name, size, lh, wt, ls, usage, sample):
    return {"name": name, "fontSize": size, "lineHeight": lh, "fontWeight": wt, "letterSpacing": ls, "usage": usage, "sample": sample}
tokens = {
 "name": "Nekal", "version": 1,
 "color": {"themes": [{"id": "light", "name": "Claro"}], "tokens": color},
 "type": {
  "fonts": [],
  "families": {"sans": "\"Plus Jakarta Sans\", system-ui, sans-serif"},
  "groups": [{"name": "Texto", "family": "sans", "styles": [
   st("large-title", "26px", "32px", 800, "-0.6px", "Título de pantalla («Hola, Claudio»). Componente Txt, variante largeTitle.", "Hola, Claudio"),
   st("title", "20px", "26px", 700, "-0.3px", "Título de hoja o de panel. Txt, variante title.", "Nivel 3"),
   st("headline", "15px", "20px", 700, "0px", "Encabezado de sección («Lo siguiente», «Hoy»). Txt, variante headline.", "Lo siguiente"),
   st("body", "14px", "20px", 500, "0px", "Texto normal. Txt, variante body.", "Estirar 10 minutos"),
   st("callout", "13px", "18px", 500, "0px", "Horas y detalles, con cifras tabulares. Txt, variante callout.", "19:00 – 20:00 · Personal"),
   st("caption", "12px", "16px", 500, "0px", "Notas pequeñas y etiquetas. Txt, variante caption.", "hasta 07:40 · 10 min"),
  ]}],
 },
 "spacing": {"tokens": [
  c("space-xs", "4px", "Entre ícono y texto muy pegados."), c("space-sm", "8px", "Separación mínima entre elementos relacionados."),
  c("space-md", "12px", "Separación dentro de una fila o tarjeta."), c("space-lg", "16px", "Relleno de tarjeta; separación entre bloques."),
  c("space-xl", "20px", "Relleno de tarjeta destacada."), c("space-xxl", "24px", "Separación entre secciones."),
  c("space-xxxl", "32px", "Separación grande entre bloques."), c("space-screen", "18px", "Margen lateral de toda pantalla."),
 ]},
 "radius": {"tokens": [
  c("radius-sm", "12px", "Campos de texto, aviso de sincronización."), c("radius-badge", "14px", "Insignia de ícono (cuadrado lavanda de 42 px)."),
  c("radius-md", "20px", "Tarjetas."), c("radius-lg", "26px", "Tarjeta destacada y hojas (esquinas de arriba)."),
  c("radius-pill", "999px", "Botones, chips, etiquetas y cápsula de segmentos."),
 ]},
 "shadow": {"tokens": [
  c("shadow-card", "0px 6px 20px rgba(90, 51, 164, 0.08)", "Tarjetas: sombra suave teñida de violeta."),
  c("shadow-raised", "0px 12px 32px rgba(40, 20, 90, 0.18)", "Hojas, menús y elementos flotantes."),
 ]},
 "size": {"tokens": [
  c("touch-min", "44px", "Alto y ancho mínimos de toda zona tocable."), c("icon", "22px", "Tamaño de ícono Ionicons de línea."),
  c("tab-icon", "23px", "Ícono de pestaña inactiva."), c("tab-icon-active", "29px", "Ícono de pestaña activa."),
  c("tab-bar", "56px", "Alto de la barra inferior, sin el área segura."),
 ]},
}
w("tokens.json", json.dumps(tokens, ensure_ascii=False, indent=1))

# ---------------------------------------------------------------- README.md
w("README.md", """Nekal es una app de organización personal con cinco pestañas (Resumen, Calendario, Espacio, Chat con Neka, Perfil). Se ve violeta sobre lavanda, con tarjetas blancas muy redondeadas, y Neka, la mascota, aparece solo cuando tiene algo que decir. Corre en web y en iPhone (Expo, React Native).

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
""")

# ---------------------------------------------------------------- assets README
w("assets/Neka/README.md", """# Neka

Las 18 poses originales de la mascota, copiadas sin cambios de `front/assets/Img/`. La app usa seis:

| Pose | Cuándo |
|---|---|
| 1 | Todo listo por hoy |
| 3 | Saludo: cuenta nueva, día libre, sin amigos, invitado |
| 5 | Celebra un logro nuevo |
| 7 | Pensando o armando un plan |
| 14 | Atención: conflicto, cosa vencida, pregunta por lo atrasado |
| 15 | Día con cosas pendientes |

Las poses 2, 4, 6, 8 a 13 y 16 a 18 están disponibles y sin significado asignado. Son imágenes a color con fondo transparente: ponlas siempre sobre `primary-soft` o `surface`, nunca recoloreadas.
""")

# ---------------------------------------------------------------- previews
FONT = '<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">'
BASE = """html,body{margin:0}
body{padding:var(--space-lg);background:var(--background);color:var(--ink);font:500 14px/20px var(--font-sans)}
.row{display:flex;gap:var(--space-md);flex-wrap:wrap;align-items:center}
.col{display:flex;flex-direction:column;gap:var(--space-md)}
.cap{font:500 12px/16px var(--font-sans);color:var(--ink-secondary)}
.sec{font:700 12px/16px var(--font-sans);color:var(--ink-secondary);margin:0 0 var(--space-sm)}"""

def preview(name, group, height, css, body, subtitle=""):
    sub = f' subtitle="{subtitle}"' if subtitle else ""
    html = f"""<!-- @dsCard group="{group}" height={height}{sub} -->
<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><title>{name} — vista previa</title>
{FONT}
<style>
{BASE}
{css}
</style></head>
<body>
{body}
</body></html>
"""
    w(f"components/{name}/preview.html", html)

def readme(name, text): w(f"components/{name}/README.md", text.strip() + "\n")

# Button
readme("Button", """
Botón en píldora de alto mínimo 44. Cuatro variantes: `primary` (violeta lleno, la acción principal), `secondary` (lavanda, la alternativa), `danger` (para lo destructivo) y `plain` (solo texto violeta, lo menor).

Pon **un solo** `primary` por vista. El texto es un verbo directo en `callout` 700: «Crear tarea», «Aceptar», «Descartar». Al tocar escala a 0,97 con resorte rápido.

El consumidor entrega la etiqueta y la acción. Un `danger` pide confirmar la acción antes de ejecutarla. No pongas dos botones `primary` juntos ni uses `plain` para la acción principal.
""")
preview("Button", "Acciones", 150, """
.btn{min-height:var(--touch-min);padding:0 var(--space-xl);border:0;border-radius:var(--radius-pill);font:700 13px/18px var(--font-sans);cursor:pointer}
.pri{background:var(--primary);color:var(--on-primary)}
.sec2{background:var(--primary-soft);color:var(--primary)}
.dan{background:var(--danger);color:var(--on-primary)}
.pla{background:transparent;color:var(--primary)}
""", """<p class="sec">Variantes</p>
<div class="row"><button class="btn pri">Crear tarea</button><button class="btn sec2">Reprogramar</button><button class="btn dan">Descartar</button><button class="btn pla">Ahora no</button></div>""")

# Chip
readme("Chip", """
Filtro o opción corta en píldora. Seleccionado va en `primary` con texto `on-primary`; sin seleccionar, `surface` con borde `line` y texto `primary`. Usa `caption` en peso 700.

Para filtrar listas (mesas en el Calendario, tipo de cosa en el editor). Si las opciones son excluyentes y de una sola fila, usa `Segmentos`. Toda la píldora es tocable (mínimo 44 de alto en el toque, aunque se vea más baja).
""")
preview("Chip", "Acciones", 110, """
.chip{padding:7px 14px;border-radius:var(--radius-pill);font:700 12px/16px var(--font-sans);background:var(--surface);border:1px solid var(--line);color:var(--primary)}
.chip.on{background:var(--primary);border-color:var(--primary);color:var(--on-primary)}
""", """<div class="row"><span class="chip on">Todos</span><span class="chip">Casa</span><span class="chip">Trabajo</span><span class="chip">Universidad</span></div>""")

# Segmentos
readme("Segmentos", """
Cápsula `primary-soft` con segmentos de texto; el activo va en `surface` con `shadow-card`. Cambia entre dos o tres vistas de lo mismo: hoy **Mes · Agenda** en el Calendario.

El consumidor entrega las opciones y la activa. Segmentos de 34 px de alto dentro de una cápsula con `radius-pill`. No lo uses para filtros de muchas opciones (usa `Chip`). El Plano estaba como tercer segmento y hoy está apagado.
""")
preview("Segmentos", "Acciones", 90, """
.seg{display:inline-flex;gap:2px;padding:3px;background:var(--primary-soft);border-radius:var(--radius-pill)}
.seg span{height:34px;min-width:84px;display:flex;align-items:center;justify-content:center;border-radius:var(--radius-pill);font:700 13px/18px var(--font-sans);color:var(--primary)}
.seg .on{background:var(--surface);box-shadow:var(--shadow-card);color:var(--ink)}
""", """<div class="seg"><span class="on">Mes</span><span>Agenda</span></div>""")

# Card
readme("Card", """
Superficie blanca (`surface`) con `radius-md` y `shadow-card`. La variante `featured` es `primary-soft` con `radius-lg` y sin sombra: se usa para el nivel y para los avisos de Neka.

Una `featured` por pantalla, como mucho. Relleno `space-lg` (`space-xl` en la destacada). El consumidor pone el contenido; la tarjeta no define su propio texto. No anides tarjetas.
""")
preview("Card", "Superficies", 190, """
.card{background:var(--surface);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--space-lg);display:flex;flex-direction:column;gap:var(--space-xs);flex:1;min-width:200px}
.feat{background:var(--primary-soft);border-radius:var(--radius-lg);box-shadow:none;padding:var(--space-xl)}
.h{font:700 15px/20px var(--font-sans)}.c{font:500 13px/18px var(--font-sans);color:var(--ink-secondary)}
""", """<div class="row" style="align-items:stretch"><div class="card"><span class="h">Lo siguiente</span><span class="c">19:00 – 20:00 · Personal</span></div>
<div class="card feat"><span class="h">Nivel 3</span><span class="c" style="color:var(--ink)">345 pts</span></div></div>""")

# NekaCard
pose = lambda n: f"/_blob/{POSES[n]}"
readme("NekaCard", """
Tarjeta destacada con la pose y el mensaje de Neka, y uno o dos botones. Cada situación fija su pose: 14 conflicto o cosa vencida, 7 cosas por revisar, 3 sin cosas o saludo, 1 todo listo, 15 día en curso.

El consumidor entrega la situación (`nekaState`): mensaje, pose y acciones. Una sola por pantalla, y solo cuando Neka dice algo. En la pregunta por lo atrasado los botones son «Reprogramar», «Ya la hice» y «Soltarla», de a una cosa. Sin frases motivacionales.
""")
preview("NekaCard", "Neka", 230, f"""
.nk{{display:flex;gap:var(--space-md);align-items:center;background:var(--primary-soft);border-radius:var(--radius-lg);padding:var(--space-xl)}}
.nk img{{width:82px;height:96px;object-fit:contain;flex:none}}
.nk p{{margin:0 0 var(--space-md);font:700 15px/20px var(--font-sans)}}
.btn{{min-height:var(--touch-min);padding:0 var(--space-xl);border:0;border-radius:var(--radius-pill);font:700 13px/18px var(--font-sans);background:var(--primary);color:var(--on-primary)}}
""", f"""<div class="nk"><img src="{pose(14)}" alt="Neka, pose de atención"><div><p>A las 14:00 se te juntan «Revisión de sprint» y «Clase de estadística».</p><button class="btn">Resolver</button></div></div>""")

# Tag
readme("Tag", """
Etiqueta corta de estado en una palabra: «Urgente», «Choca», «Vencida». Tonos: `danger` (`danger-soft` con texto `danger`), `primary` (`primary-soft` con `primary`) y `neutral` (`line` con `ink`). Usa `caption` en peso 700.

Una palabra o dos, nunca una frase. Siempre acompaña a un título; nunca va sola. El color refuerza la palabra, no la reemplaza.
""")
preview("Tag", "Estado", 90, """
.tag{display:inline-block;padding:2px 9px;border-radius:var(--radius-pill);font:700 12px/16px var(--font-sans)}
.d{background:var(--danger-soft);color:var(--danger)}.p{background:var(--primary-soft);color:var(--primary)}.n{background:var(--line);color:var(--ink)}
""", """<div class="row"><span class="tag d">Urgente</span><span class="tag d">Con entrega</span><span class="tag p">Hoy</span><span class="tag n">34 atrasadas</span></div>""")

# ListRow
readme("ListRow", """
Fila de una cosa: círculo para completar (el borde lleva el color de su mesa), título, hora y una `Tag` opcional. Cuando está completada el título va tachado en `ink-done` y el círculo se llena con un check.

Toda la fila se toca. El círculo mide `touch-min` de zona táctil aunque se vea de 22. El consumidor entrega título, hora, color de mesa y estado. Las horas llevan cifras tabulares. No uses solo el color del círculo para decir de qué mesa es: la mesa se nombra al abrir la cosa.
""")
preview("ListRow", "Listas", 200, """
.card{background:var(--surface);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--space-xs) var(--space-lg)}
.r{display:flex;align-items:center;gap:var(--space-md);min-height:52px;border-bottom:1px solid var(--line)}.r:last-child{border:0}
.o{width:22px;height:22px;border-radius:50%;border:2px solid var(--mesa-violet);flex:none;box-sizing:border-box}
.o.g{border-color:var(--mesa-green)}.o.dn{background:var(--success);border-color:var(--success)}
.t{flex:1;font:600 14px/20px var(--font-sans)}.t.dn{text-decoration:line-through;color:var(--ink-done)}
.h{font:500 13px/18px var(--font-sans);color:var(--ink-secondary);font-variant-numeric:tabular-nums}
.tag{padding:2px 9px;border-radius:var(--radius-pill);font:700 12px/16px var(--font-sans);background:var(--danger-soft);color:var(--danger)}
""", """<div class="card">
<div class="r"><span class="o"></span><span class="t">Revisión de sprint</span><span class="tag">Choca</span><span class="h">14:00</span></div>
<div class="r"><span class="o g"></span><span class="t">Clase de estadística</span><span class="h">14:00</span></div>
<div class="r"><span class="o dn"></span><span class="t dn">Estirar 10 minutos</span><span class="h">07:30</span></div></div>""")

# ProgressBar
readme("ProgressBar", """
Barra gruesa de 10 px con extremos redondeados y relleno `primary`. Sobre una tarjeta `primary-soft` el riel es blanco (`riel="blanco"`); sobre `surface`, `line`.

Siempre con un texto al lado que diga qué mide y cuánto («Nivel 4 · 340 pts»). El relleno se anima con resorte suave, en píxeles, para conservar las puntas. No la uses como único indicador de un estado.
""")
preview("ProgressBar", "Progreso", 170, """
.card{background:var(--surface);border-radius:var(--radius-md);box-shadow:var(--shadow-card);padding:var(--space-lg);margin-bottom:var(--space-md)}
.f{background:var(--primary-soft);border-radius:var(--radius-lg);padding:var(--space-xl)}
.bar{height:10px;border-radius:var(--radius-pill);background:var(--line);overflow:hidden;margin-top:var(--space-sm)}
.f .bar{background:var(--surface)}.bar i{display:block;height:10px;border-radius:var(--radius-pill);background:var(--primary)}
.h{display:flex;justify-content:space-between;font:700 15px/20px var(--font-sans)}.h span+span{font:500 13px/18px var(--font-sans);color:var(--ink-secondary)}.f .h span+span{color:var(--ink)}
""", """<div class="card"><div class="h"><span>Hoy</span><span>3 de 5 listo</span></div><div class="bar"><i style="width:60%"></i></div></div>
<div class="f"><div class="h"><span>Nivel 3</span><span>345 pts</span></div><div class="bar"><i style="width:30%"></i></div></div>""")

# Medalla
readme("Medalla", """
Medalla de un logro. Lograda: círculo `primary` con ícono blanco y el texto «Logrado». Por lograr: `medal-off` con ícono `line-strong`, candado y un anillo de avance.

Son 25 logros que no dan puntos y nunca se pierden. El modal de logro nuevo lleva la pose 5 de Neka y espera a que no haya hojas abiertas ni sincronización en curso. El nombre del logro siempre va en texto: la medalla sola no lo dice.
""")
preview("Medalla", "Progreso", 150, """
.m{width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex:none}
.on{background:var(--primary)}.off{background:var(--medal-off);box-shadow:inset 0 0 0 3px var(--line)}
.w{display:flex;flex-direction:column;align-items:center;gap:var(--space-xs);width:96px}.w b{font:700 12px/16px var(--font-sans)}.w span{font:500 12px/16px var(--font-sans);color:var(--ink-secondary)}
""", """<div class="row"><div class="w"><div class="m on"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v6a4 4 0 0 1-8 0zM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 14v4M8 21h8"/></svg></div><b>Racha de 7</b><span>Logrado</span></div>
<div class="w"><div class="m off"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#948BA6" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v6a4 4 0 0 1-8 0zM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 14v4M8 21h8"/></svg></div><b>Racha de 14</b><span>Faltan 6 días</span></div></div>""")

# Field
readme("Field", """
Campo de texto con etiqueta arriba. Alto 46 (96 si es multilínea), `radius-sm`, fondo `surface` y borde `line-strong` (el contraste que exige WCAG 1.4.11); con foco el borde pasa a `primary`.

La etiqueta va siempre visible en `callout` 700, no solo como placeholder. El consumidor entrega etiqueta, valor y mensaje de error («qué pasó + qué hacer»). `Toggle` sigue el mismo borde `line-strong` cuando está apagado.
""")
preview("Field", "Formularios", 150, """
.f{display:flex;flex-direction:column;gap:6px;max-width:320px}.l{font:700 13px/18px var(--font-sans)}
.i{min-height:46px;box-sizing:border-box;padding:0 var(--space-md);display:flex;align-items:center;background:var(--surface);border:1.5px solid var(--line-strong);border-radius:var(--radius-sm);color:var(--ink-secondary)}
.i.foco{border-color:var(--primary);color:var(--ink)}
""", """<div class="row" style="align-items:flex-start"><div class="f"><span class="l">Nombre</span><div class="i">Trabajo, Universidad…</div></div><div class="f"><span class="l">Nombre</span><div class="i foco">Universidad</div></div></div>""")

# TabBar
ic = lambda d: f'<svg width="{{S}}" height="{{S}}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">{d}</svg>'
icons = {
 "Resumen": '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
 "Calendario": '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
 "Espacio": '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="8" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M8 7l8 1M7 8l4 8M17 10l-4 6"/>',
 "Chat": '<path d="M4 5h16v11H9l-5 4z"/>',
 "Perfil": '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
}
tabs = ""
for i, (k, d) in enumerate(icons.items()):
    on = (i == 0); s = 29 if on else 23
    tabs += f'<span class="t{" on" if on else ""}" aria-label="{k}">{ic(d).replace("{S}", str(s))}</span>'
readme("TabBar", """
Barra inferior a todo el ancho, pegada abajo, fondo `surface` y borde superior `line`; respeta el área segura. Cinco pestañas solo con íconos de línea: Resumen, Calendario, Espacio, Chat con Neka y Perfil.

La pestaña activa crece de `tab-icon` (23) a `tab-icon-active` (29) y va en `primary`; las demás en `ink-secondary`. Cada una conserva su nombre accesible y una zona de al menos `touch-min`. Vibración de selección al cambiar. Un contador rojo (`danger`) puede ir sobre el ícono de Perfil para las solicitudes de amistad.
""")
preview("TabBar", "Navegación", 130, """
.bar{display:flex;justify-content:space-around;align-items:center;height:var(--tab-bar);background:var(--surface);border-top:1px solid var(--line);border-radius:var(--radius-md) var(--radius-md) 0 0;max-width:380px}
.t{color:var(--ink-secondary);display:flex}.t.on{color:var(--primary)}
""", f'<div class="bar">{tabs}</div><p class="cap" style="margin-top:var(--space-sm)">Íconos de ejemplo; en la app son Ionicons de línea.</p>')

# Heatmap
cells = ""
import random
random.seed(7)
for col in range(12):
    for row in range(7):
        v = random.choice([0,0,1,1,2,3,4,3,2])
        cells += f'<i style="background:var(--heat-{v})"></i>'
readme("Heatmap", """
Grilla tipo GitHub de «Tus días»: columnas = semanas, filas = lunes a domingo. El tono (de `heat-0` a `heat-4`) depende del porcentaje de lo que tenías ese día que completaste. Desde `heat-2` el día suma a la racha.

Las celdas son chicas, así que su detalle se lee debajo y para lector de pantalla; el color solo no alcanza. Muestra una leyenda de menos a más. Nunca uses estos tonos para otra cosa.
""")
preview("Heatmap", "Progreso", 190, """
.g{display:grid;grid-template-rows:repeat(7,14px);grid-auto-flow:column;grid-auto-columns:14px;gap:4px}
.g i{border-radius:4px;display:block}
.lg{display:flex;align-items:center;gap:6px;margin-top:var(--space-md)}.lg i{width:14px;height:14px;border-radius:4px;display:block}
""", f'<div class="g">{cells}</div><div class="lg"><span class="cap">Menos</span><i style="background:var(--heat-0)"></i><i style="background:var(--heat-1)"></i><i style="background:var(--heat-2)"></i><i style="background:var(--heat-3)"></i><i style="background:var(--heat-4)"></i><span class="cap">Más</span></div>')

# ---------------------------------------------------------------- Cover
rects = []
def R(cls, x, y, wd, ht, rx): rects.append(f'<rect class="{cls}" x="{x}" y="{y}" width="{wd}" height="{ht}" rx="{rx}"/>')
R("brand blk", 16, -16, 144, 248, 26)         # slab bleeding off the top
R("tint blk", 176, 72, 144, 176, 26)
R("deep blk", 336, 40, 160, 208, 26)           # bleeds off the right edge
R("orange chip", 16, 248, 56, 24, 12)
R("green chip", 80, 248, 32, 24, 12)
for (x, y, wd) in [(192,224,40),(240,224,24),(272,224,32),(200,200,24),(240,200,48),(192,176,16),(224,176,32),(272,176,24),(208,152,40),(264,152,24),(200,128,16),(240,128,32),(216,104,32),(264,104,16)]:
    R("pill", x, y, wd, 8, 4)
for (x, y, wd) in [(32,192,32),(56,168,24),(40,144,16),(88,200,24)]:
    R("pill cut", x, y, wd, 8, 4)
for (cx, cy, r) in [(416,96,24),(416,152,16)]:
    rects.append(f'<circle class="disc" cx="{cx}" cy="{cy}" r="{r}"/>')
cover = f"""<!-- @dsCard height=288 -->
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Nekal</title>
{FONT}
<style>
  html, body {{ margin:0; height:100%; }}
  body {{ background:var(--background); color:var(--ink); font-family:var(--font-sans); overflow:hidden; }}
  .cover {{ position:relative; height:288px; overflow:hidden; }}
  .art {{ position:absolute; top:0; left:480px; width:480px; height:288px; overflow:hidden; }}
  .art svg {{ display:block; width:480px; height:288px; }}
  .brand {{ fill:var(--primary); }}
  .tint {{ fill:var(--primary-soft); }}
  .deep {{ fill:var(--ink); }}
  .orange {{ fill:var(--mesa-orange); }}
  .green {{ fill:var(--mesa-green); }}
  .blk {{ rx:var(--radius-lg); }}
  .pill {{ fill:var(--primary); }}
  .pill.cut {{ fill:var(--primary-soft); }}
  .disc {{ fill:var(--primary-soft); }}
  .words {{ position:absolute; left:var(--space-xxl); bottom:var(--space-xxl); max-width:440px; }}
  .name {{ margin:0; font-size:120px; line-height:.92; font-weight:800; letter-spacing:-.03em; color:var(--ink); }}
  .tag {{ margin:var(--space-sm) 0 0 4px; font-size:14px; line-height:20px; color:var(--ink-secondary); }}
</style>
</head>
<body>
<div class="cover">
<div class="art" aria-hidden="true">
<svg viewBox="0 0 480 288" width="480" height="288">
<!--
  blocks      primary 144x248 bled off the top (the brand violet, largest) · primary-soft 144x176 (the lavender every card sits on) · ink 160x208 bleeding off the right edge · mesa-orange 56x24 and mesa-green 32x24 once each (the mesa colours, small: they only mark a mesa) — about 36% of 960x288
  arrangement one tall violet slab with satellites, bottoms on one line space-xxl above the edge, space-lg gutters
  pattern     pills and discs, from "tarjetas muy redondeadas, botones en píldora": space-sm-tall pills at a space-xxl pitch thinning upward over the lavender block, four cut into the slab in primary-soft, two discs cut from the ink block
  scales      sides in space-sm multiples; gutters space-lg; blocks radius-lg (26); pill rx = half of space-sm
-->
{chr(10).join(rects)}
</svg>
</div>
<div class="words">
<h1 class="name">Nekal</h1>
<p class="tag">Tu día, ordenado con Neka.</p>
</div>
</div>
</body>
</html>
"""
w("components/Cover/preview.html", cover)

# ---------------------------------------------------------------- index
order = [f"Neka_Pose{n}.png" for n in range(1, 19)]
files = {f"Neka_Pose{n}.png": {"name": f"Neka_Pose{n}.png", "blob": POSES[n], "size": SIZES[n], "type": "image/png"} for n in range(1, 19)}
index = {
 "v": 3, "layout": "files", "createdOnFiles": {"v": 1, "at": "2026-11-14T12:00:00Z"},
 "title": "Nekal", "namespace": "Nekal", "libraries": [],
 "sections": {}, "groups": ["Neka"],
 "assetGroups": {"Neka": {"name": "Neka", "tile": "l", "order": order, "files": files}},
 "blobs": {}, "docs": {"readme": "project/README.md", "sections": []},
 "lastChange": {"by": "Claude", "at": "2026-11-14T12:00:00Z", "via": "Claude Code", "note": "Primera versión desde SISTEMA_DE_DISENO/ del repositorio de Nekal."},
}
w("design-system.json", json.dumps(index, ensure_ascii=False, indent=1))
print("ok")
for root, _, fs in os.walk(OUT):
    for f in fs: print(os.path.relpath(os.path.join(root, f), OUT))
