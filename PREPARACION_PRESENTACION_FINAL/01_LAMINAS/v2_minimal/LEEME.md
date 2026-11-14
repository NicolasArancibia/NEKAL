# Láminas de Nekal, versión minimal

Segunda versión de las dos láminas (50 × 105 cm): menos texto, más pantallas. La versión 1, con todo el detalle, sigue en la carpeta de arriba (`01_LAMINAS/`), intacta.

- **Lámina 1:** qué es Nekal, el problema en dos frases, 3 cifras de la encuesta, la pregunta de investigación y para quién es.
- **Lámina 2:** el momento central en 3 teléfonos (algo choca, Neka propone, tú aceptas), las 4 partes de la app y los 3 principios.

Listas en `salida/`: `nekal-minimal-1.pdf` y `-2.pdf` en tamaño real, y un PNG de vista previa de cada una.

## Archivos

| Archivo | Para qué |
|---|---|
| `contenido.js` | **Todos los textos e imágenes.** Es el único que hay que tocar normalmente. |
| `imagenes/` | Las pantallas: cuadros de la grabación real de la app (`03_VIDEO`), con datos de ejemplo limpios. |
| `diseno/laminas.css` | Colores, tamaños de letra y espacios. |
| `lamina-1.html`, `lamina-2.html` | Doble clic para ver cada lámina en el navegador. |
| `exportar.bat` | Doble clic: genera los PDF y PNG en `salida/`. |

## Cambiar un texto

Abre `contenido.js` (sirve el Bloc de notas), busca el texto y cambia lo que está entre comillas. No borres comillas, comas ni llaves. `**así**` deja palabras en negrita.

## Cambiar una pantalla

Guarda la imagen nueva en `imagenes/` y escribe su nombre en `contenido.js` (por ejemplo `"imagenes/calendario.png"`). Usa capturas verticales de teléfono, de al menos 780 px de ancho: a ese tamaño se imprimen nítidas en los teléfonos de las láminas (de unos 15 cm). Para el logo UDD: guárdalo en `imagenes/` y escribe la ruta en `logoUDD`.

Si la app cambia, la sesión del video puede volver a grabar (`03_VIDEO`, `npm run grabar`) y de ahí se sacan cuadros nuevos.

## Cambiar el tamaño

En `contenido.js`, arriba: `ancho_cm` y `alto_cm`. Todo escala con el ancho.

## Volver a exportar

Doble clic en `exportar.bat`. Avisa si algo no cabe, si falta una imagen o si falta el logo UDD.
