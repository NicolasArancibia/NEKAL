# Presentación del examen — Nekal

Plantilla de las diapositivas (1920 × 1080) para los 30 minutos de exposición. Es un punto de partida, no la versión final: todo se puede cambiar y volver a exportar. Funciona sin internet.

| Archivo | Qué es |
|---|---|
| `presentacion.html` | **La presentación.** Aquí está todo el texto. Es el único archivo que hay que editar. |
| `salida/Nekal_Presentacion.pdf` | La misma presentación en PDF, una diapositiva por página (respaldo para el día del examen). |
| `salida/capturas/` | Una imagen por diapositiva, para revisar rápido o pegar en otro lado. |
| `REPARTO_DE_MINUTOS.md` | Cuántos minutos tiene cada bloque y cada diapositiva. Se escribe solo al exportar. |
| `EXPORTAR.bat` | Doble clic para rehacer el PDF, las capturas y el reparto. |
| `estilo/`, `motor/`, `exportar.mjs` | El diseño y el funcionamiento. No hace falta tocarlos. |

## Abrirla

Doble clic en `presentacion.html` (se abre en Edge o Chrome).

| Tecla | Qué hace |
|---|---|
| → ↓ Espacio Enter AvPág, o clic | Avanzar (sirve un control remoto de presentaciones) |
| ← ↑ RePág, o clic en el borde izquierdo | Retroceder |
| **F** | Pantalla completa |
| **N** | Notas: la diapositiva, lo que sigue, tu guion y el reloj |
| **O** | Abre la ventana del orador (ver abajo) |
| **G** | Ver todas las diapositivas; clic en una para ir a ella |
| **T** | Reiniciar el reloj |
| Inicio / Fin | Ir a la portada / a la última antes del respaldo |
| Esc | Salir de las notas o de la vista de todas |

Al mover el mouse aparecen abajo los mismos botones.

**El día del examen, con proyector:** conecta el proyector como segunda pantalla («Extender», tecla Windows + P). Abre la presentación, aprieta **O** y deja esa ventana nueva en tu notebook: ahí ves tu guion, la diapositiva que sigue y el reloj. Arrastra la ventana original al proyector y aprieta **F**. Las dos avanzan juntas, desde cualquiera de las dos. El reloj parte cuando sales de la portada y se pone rosado si vas atrasado respecto del reparto.

## Cambiar un texto

1. Abre `presentacion.html` con un editor de texto (clic derecho → Abrir con → Bloc de notas, o VS Code).
2. Busca la frase que quieres cambiar (Ctrl + B o Ctrl + F) y escríbela de nuevo. No borres lo que va entre `<` y `>`.
3. Guarda y recarga la página en el navegador (F5).

El guion de cada diapositiva está justo debajo de ella, entre `<aside class="notas">` y `</aside>`. No se proyecta.

Las etiquetas naranjas **FALTA** y rosadas **REVISAR** son avisos de trabajo. Cuando el contenido esté confirmado, borra la etiqueta completa: `<span class="marca-falta">FALTA</span>` o `<span class="marca-revisar">REVISAR</span>`.

## Cambiar una imagen

- **Pantallas de la app:** las diapositivas usan directo los archivos de `00_BASE/pantallas/`. Si se vuelven a sacar los pantallazos con el mismo nombre, la presentación se actualiza sola. Para usar otra pantalla, cambia el nombre del archivo en la línea `<img src="../00_BASE/pantallas/03-resumen.png" …>`.
- **Neka:** igual, con las poses de `00_BASE/marca/` (`Neka_Pose1.png` a `Neka_Pose18.png`).
- **Una imagen nueva** (una foto de las pruebas con usuarios, por ejemplo): guárdala en una carpeta `media/` dentro de `02_PRESENTACION/` y úsala como `<img src="media/nombre.jpg" alt="qué muestra">`.
- **El video:** guárdalo como `media/video.mp4`. Aparece solo en la diapositiva del video; mientras no exista, se ve el aviso.

## Agregar una diapositiva

Cada diapositiva es un bloque que parte con `<section class="dp dp-…">` y termina con `</section>`.

1. Busca una diapositiva del tipo que necesitas (cada tipo tiene un comentario `<!-- TIPO: … -->` la primera vez que aparece).
2. Copia el bloque completo, de `<section` a `</section>`, y pégalo donde quieras que vaya.
3. Cambia el texto y el guion.
4. Ajusta `data-min` (minutos pensados para esa diapositiva: `0.5` son 30 segundos). Si empieza un bloque nuevo, pon también `data-bloque="Nombre del bloque"`; si no, hereda el de la anterior.

Para borrar una, borra el bloque completo. Para moverla, córtalo y pégalo en otro lugar. Los números se rehacen solos.

| Tipo | Para qué sirve | Ejemplo en la plantilla |
|---|---|---|
| `dp-portada` | Primera diapositiva | 1 |
| `dp-seccion` | Título de cada parte (fondo violeta) | 2 |
| `dp-frase` | Una sola idea, enorme; con etiqueta, bajada o fuente opcionales | 3, 4 |
| `dp-cita` | Lo que dijo alguien, con quién lo dijo | 20 |
| `dp-cifra` | Un número protagonista | 6 |
| `dp-cifras` | Dos o tres números lado a lado (con o sin flecha) | 7, 10 |
| `dp-comparacion` | Dos lados: antes / hoy, problema / respuesta | 5, 37 |
| `dp-pantalla` | Uno o dos teléfonos + explicación (`invertida` pone el teléfono a la derecha) | 22, 26, 27 |
| `dp-pantallas` | Varias pantallas en fila | 25 |
| `dp-pasos` | Secuencia numerada (`de-4` para cuatro en fila; `clave` destaca un paso) | 19, 33 |
| `dp-linea` | Línea de tiempo | 13, 36 |
| `dp-tabla` | Tabla (`compacta` para tres columnas con más texto) | 14, 39 |
| `dp-tarjetas` | Ideas paralelas sin orden (`de-4`, `altas`, `numerada`) | 12, 21, 23 |
| `dp-falta` | Espacio pendiente: dice qué va ahí | 41 |
| `dp-video` | El video de 2 minutos | 31 |
| `dp-demo` | Momento de la demo en vivo | 32 |
| `dp-cierre` | Última diapositiva | 50 |
| `dp-lista` | Listas largas, solo para respaldo (glosario, referencias) | Respaldo 2 y 6 |

Si a una diapositiva le agregas la clase `respaldo`, queda fuera de la numeración y del reparto de minutos (va al final, para las preguntas).

Regla de la casa: **una idea por diapositiva, poco texto y grande**. Si un texto no cabe, es señal de que son dos diapositivas.

## Exportar a PDF

Doble clic en `EXPORTAR.bat` (o, en una terminal dentro de esta carpeta, `node exportar.mjs`). Tarda unos 20 segundos y:

- rehace `salida/Nekal_Presentacion.pdf` y `salida/capturas/`;
- rehace `REPARTO_DE_MINUTOS.md` y avisa si la suma se pasa de 30 minutos;
- avisa con un «OJO» si algún texto se sale de los márgenes o si falta una imagen.

Opciones: `node exportar.mjs --sin-respaldo` deja fuera las diapositivas de respaldo; `--sin-capturas` hace solo el PDF.

También sirve imprimir desde el navegador (Ctrl + P → Guardar como PDF, con «Gráficos de fondo» activado), pero el exportador es más seguro.

## Lo que falta (resumen)

Está marcado dentro de la presentación; el detalle por diapositiva queda en `REPARTO_DE_MINUTOS.md`, columna «Pendiente».

- **Espacios FALTA:** el video, el pantallazo del «Plan de Neka», fechas de V0 y V1, la razón del cambio del Perfil, validación con usuarios (2 diapositivas), carta Gantt, costos, financiamiento, impacto y ética, el orden de la proyección, conclusiones y la ficha de la encuesta (respaldo).
- **Por REVISAR** (redacción que Nicolás debe confirmar): la bajada de la portada, los cuatro principios, el recorrido de la demo y las tres diapositivas de «qué cambió desde el anteproyecto».

## Detalles a saber

- Las poses de Neka miden 470 × 470 px: se ven bien al tamaño que tienen aquí, pero no aguantan agrandarse mucho más.
- Los pantallazos actuales muestran «34 atrasadas» y la pantalla de Neka sin conversación; conviene rehacerlos con datos más limpios antes de la versión final (se hace en `00_BASE/herramientas/`).
- La presentación lee el estilo, las fuentes y las imágenes de `00_BASE/`. Si se copia a otro computador, hay que llevar la carpeta `PREPARACION_PRESENTACION_FINAL` completa. El PDF, en cambio, funciona solo.
