# Video de Nekal

Prototipo del video del examen (1:46, 1920 × 1080, 30 cuadros por segundo). Está hecho con código: cada escena es una página web animada y un programa la convierte en MP4. Por eso se puede cambiar un texto o una grabación y volver a exportar.

- Herramientas: **Hyperframes** (arma el video desde HTML) + **GSAP** (animaciones) + **ffmpeg** (codifica el MP4) + **Playwright** (graba la app).
- El video terminado queda en `salida/nekal-video.mp4`.
- Qué dice cada escena y qué falta: `GUION.md`.

## Los cuatro comandos

Se corren en una terminal, parado en esta carpeta (`03_VIDEO`). La primera vez en un equipo nuevo: `npm install`.

| Comando | Qué hace |
|---|---|
| `npm run vista` | Abre la vista previa en el navegador, con línea de tiempo. Se actualiza sola al guardar un archivo. Se cierra con Ctrl + C; si quedó abierta de fondo, con `npm run vista -- --stop`. |
| `npm run revisar` | Busca errores y saca tres cuadros de cada escena a `revision/` para mirarlos antes de exportar. |
| `npm run exportar` | Genera `salida/nekal-video.mp4` y dice cuánto dura. Avisa si pasa de 2:00. Demora varios minutos. |
| `npm run grabar` | Vuelve a grabar la app real (ver más abajo). |

## Dónde está cada cosa

```
03_VIDEO/
  GUION.md                 el guion, escena por escena
  salida/nekal-video.mp4   el video exportado
  proyecto/
    index.html             la línea de tiempo: orden y duración de las escenas
    estilo-video.css       tamaños de letra, teléfono, tarjetas (común a todas)
    compositions/          una escena por archivo: e01-portada.html … e10-cierre.html
    assets/app/            grabaciones reales de la app (.mp4) y sus marcas de tiempo (.json)
    assets/base/           copia automática de 00_BASE (no editar aquí: se pisa sola)
    assets/audio/          aquí van la voz y la música cuando existan
  herramientas/            los programas que graban, revisan y exportan
```

## Cambiar un texto

1. Abre la escena en `proyecto/compositions/` (por ejemplo `e02-problema.html`) con cualquier editor de texto.
2. Busca la frase y cámbiala. Lo que está entre `<` y `>` son etiquetas: no se tocan.
3. `npm run revisar` y mira los cuadros de esa escena en `revision/`: confirma que el texto nuevo no se corta ni se encima.
4. `npm run exportar`.

Las cifras y citas solo se cambian si antes cambiaron en `00_BASE/RELATO.md`.

## Reemplazar una grabación de la app

Las cuatro escenas de la app usan grabaciones reales en modo invitado, con los datos de ejemplo.

1. Deja la app corriendo en modo invitado: desde la raíz del repositorio, `npm --prefix front run web -- --port 8082`.
2. En esta carpeta: `npm run grabar` (todas) o, por ejemplo, `npm run grabar -- plan` (solo esa). Los nombres son `resumen`, `plan`, `espacio`, `perfil` y `chat` (la de chat se graba pero hoy no se usa en el video).
3. Cada grabación deja un `.json` con los segundos de sus momentos importantes. Si la toma nueva dura distinto, se ajustan los tiempos de esa escena (siguiente punto).
4. `npm run revisar` y `npm run exportar`.

Sobre la grabación del plan de Neka:

- La arma la **IA real**, así que cada toma puede salir distinta. El programa pide el plan hasta tres veces buscando uno que quepa completo en la pantalla; si no sale, graba el plan largo deslizando hasta los botones.
- Cada intento gasta una consulta del plan gratuito de la IA.
- Los datos de ejemplo se ajustan solo dentro del navegador temporal de la grabación (está explicado al inicio de `herramientas/grabar.mjs`): se agrega una clase fija que choca con «Llamar a mamá», se mandan a la papelera las atrasadas de ejemplo menos una, y se pone el nombre «Nicolás».

Para usar un pantallazo fijo en vez de una grabación: en la escena, cambia la línea `<video …>` por `<img src="assets/base/pantallas/07-espacio-circulo.png" alt="" />`.

## Ajustar tiempos

**Cuánto dura una escena** se decide en `proyecto/index.html`. Cada escena tiene:

- `data-start`: el segundo en que empieza.
- `data-duration`: cuántos segundos dura.

Si alargas una escena 2 segundos, súmale 2 al `data-start` de todas las que vienen después y al `data-duration` de la primera línea (`id="root"`), que es la duración total. **El total no puede pasar de 120.**

**Qué pasa dentro de una escena** se decide al final de su archivo, en la parte `<script>`. Cada línea termina con un número: el segundo, contado desde que empieza esa escena, en que ocurre esa animación. Ejemplo, en `e02-problema.html`, la segunda cifra aparece en el segundo 7.4:

```js
tl.fromTo(S + ".d2", { … }, { … }, 7.4);
```

La última línea de cada escena la hace desaparecer 0,45 s antes de terminar: si cambias la duración, mueve también ese número.

En las escenas con grabación, la línea `<video>` tiene `data-media-start` (desde qué segundo de la grabación parte) y `data-duration` (cuánto se muestra).

## Agregar la voz y la música

1. Guarda los archivos como `proyecto/assets/audio/locucion.mp3` y `proyecto/assets/audio/musica.mp3`.
2. En `proyecto/index.html`, casi al final, hay un bloque que dice «AUDIO»: quita el `<!--` y el `-->` que rodean las dos líneas `<audio …>`.
3. `npm run vista` para oír cómo calza, y `npm run exportar`.

## Si algo falla

- **«No encontré ffmpeg»**: instálalo con `winget install --id Gyan.FFmpeg -e` y abre una terminal nueva.
- **La exportación se cae o se pone muy lenta**: cierra otros programas (necesita memoria) y vuelve a correrla.
- **`npm run grabar` no encuentra un botón**: la app cambió. Hay que ajustar `herramientas/grabar.mjs`, que toca los botones por su nombre.
- **En la grabación aparece un cuadrito negro con un rayo**: es un aviso del servidor de desarrollo, no de la app. El programa lo esconde; si vuelve a salir, repite la toma.
