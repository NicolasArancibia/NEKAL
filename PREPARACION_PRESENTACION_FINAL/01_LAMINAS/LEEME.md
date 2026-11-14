# Láminas de Nekal (plantilla)

Dos láminas verticales de 50 × 105 cm: la 1 es la investigación, la 2 es el proyecto.

Es una **plantilla para partir**, no la versión final. Exportadas y revisadas el 13/11/2026: todo cabe, pero justo (quedan unos 3 cm libres por lámina). Si agregas texto en un bloque, acorta en otro; el exportador avisa si algo deja de caber.

Lo que está marcado en naranja en las láminas es lo que falta (`FALTA`) o lo que tienes que confirmar (`revisar`).

## Archivos

| Archivo | Para qué |
|---|---|
| `contenido.js` | **Todos los textos e imágenes.** Es el único que hay que tocar normalmente. |
| `diseno/laminas.css` | Colores, tamaños de letra y espacios. |
| `diseno/motor.js` | Arma las láminas con el contenido. No hace falta tocarlo. |
| `lamina-1.html`, `lamina-2.html` | Se abren con doble clic para ver cada lámina en el navegador. |
| `exportar.bat` | Doble clic: genera los PDF y PNG en `salida/`. |

## Cambiar un texto

Abre `contenido.js` (con el Bloc de notas sirve), busca el texto y cambia lo que está entre comillas. No borres comillas, comas ni llaves. `**así**` deja palabras en negrita.

- Un texto que empieza con `[FALTA]` se muestra como espacio marcado en naranja. Cuando tengas el dato, borra `[FALTA]` y escribe el texto.
- Un texto que empieza con `[REVISAR]` lleva una marca «revisar». Cuando lo apruebes, borra `[REVISAR]`. Para esconder todas las marcas de una vez: `mostrarMarcasRevisar: false`.

## Cambiar una pantalla

En `contenido.js`, busca `pantallas:` y cambia la ruta de `imagen`, por ejemplo `"../00_BASE/pantallas/05-calendario-mes.png"`. Para una captura nueva, guárdala en una carpeta `imagenes/` aquí mismo y escribe `"imagenes/nombre.png"`. Igual para el logo UDD (`logoUDD`) y la captura del «Plan de Neka» (en `pantallas:`, la que tiene `imagen: ""`): al escribir la ruta, el espacio marcado desaparece solo.

Las capturas de `00_BASE/pantallas/` miden 1170 × 2532 px; a ese tamaño se imprimen nítidas. Usa capturas de esa misma medida.

## Cambiar el tamaño

En `contenido.js`, arriba: `ancho_cm` y `alto_cm`. Todo escala con el ancho. Si cambias la proporción, el exportador avisa si el contenido deja de caber.

## Volver a exportar

Doble clic en `exportar.bat` (necesita Node y Microsoft Edge, que ya están en este computador). Deja en `salida/` un PDF en tamaño real y un PNG de vista previa por lámina, y dice si todo cabe, si falta alguna imagen y cuántos espacios FALTA y REVISAR quedan.
