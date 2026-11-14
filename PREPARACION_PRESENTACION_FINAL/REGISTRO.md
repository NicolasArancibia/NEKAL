# Registro — preparación de la presentación final

Qué se hizo, en qué quedó cada pieza y por dónde seguir. **Léelo antes de retomar cualquier pieza.**

## Ronda 1 · 13–14 de noviembre de 2026 (Claude Fable 5.2)

Una sesión principal armó la base y lanzó tres sesiones en paralelo, una por pieza. Las tres se cortaron una vez por límite de uso, se retomaron y terminaron. Después la sesión principal revisó cada entrega (PNG de las láminas, las 56 páginas del PDF del deck y un cuadro cada 6 s del video).

Sesiones (en la barra lateral de la app):

| Pieza | Sesión | Estado |
|---|---|---|
| Base | Sesión principal (esta conversación) | Terminada |
| Láminas | «Nekal · Plantilla de láminas» | Terminada |
| Presentación | «Nekal · Plantilla de presentación» | Terminada |
| Video | «Nekal · Guion y prototipo del video» | Terminada |

Son **plantillas para partir**, no la versión final. Nada está commiteado: la carpeta entera está sin seguimiento de git.

### Decisiones tomadas

- Láminas: 2 verticales de 50 × 105 cm (proporción 1 : 2,1 de la referencia). El tamaño es una variable; falta confirmarlo con la coordinadora o la imprenta.
- Presentación: 1920 × 1080, en HTML, sin depender de internet, 30 min de exposición como máximo.
- Video: entre 1:40 y 2:00, con Hyperframes + GSAP. No se usaron servicios de pago ni generadores de video con IA.
- Todo con el estilo de la app: violeta `#7546EC`, fondo lila, Plus Jakarta Sans y Neka. El revisor de diseño marcaba la tipografía y el rebote como «muy usados»; quedaron como excepción en `.impeccable/config.json` (raíz del repo) porque son los de la app.
- El contenido sale solo de `00_BASE/RELATO.md`. Lo que no existe va marcado **FALTA**; lo interpretado por Claude, **REVISAR**. No se inventaron cifras ni resultados.

---

## 00_BASE — lo común

| Archivo | Qué es |
|---|---|
| `RELATO.md` | Contenido único de las tres piezas (desde el anteproyecto y `DOCUMENTOS/V2`). **Nicolás tiene que revisarlo.** |
| `REQUISITOS_UDD.md` | Resumen del reglamento, el protocolo, la pauta de evaluación y el cronograma. |
| `estilo/nekal.css` + `estilo/fuentes/` | Colores, tipografía y movimiento, copiados de `front/src/styles/theme.ts`. |
| `pantallas/` | 9 pantallazos reales (1170 × 2532) en modo invitado con `nekalDemo()`. `LEEME.md` dice cuáles faltan. |
| `herramientas/capturar.mjs` | Rehace los pantallazos: app corriendo en `localhost:8082` y `node capturar.mjs` desde `herramientas/`. |
| `marca/` | 18 poses de Neka (470 × 470 px: no aguantan agrandarse mucho). **Aquí va el logo UDD cuando exista.** |
| `referencias/` | Las 2 láminas de la compañera (Lumen) que fijan el formato. |

## 01_LAMINAS — terminada como plantilla

- **Salida:** `salida/nekal-lamina-1.pdf` y `-2.pdf` (50 × 105 cm reales) + PNG de vista previa.
- **Lámina 1, la investigación:** 01 Contexto y problema (con balanza), 02 Evidencia, 03 Marco teórico y línea de tiempo, 04 Estado del arte y el vacío, 05 Pregunta, 06 Usuarios, y las referencias al pie.
- **Lámina 2, el proyecto:** 07 Propuesta y objetivos, 08 Seis teléfonos con pantallas reales, 09 Principios, 10 Cómo negocia Neka (6 pasos), 11 Qué cambió desde el anteproyecto, 12 Validación, costos y proyección (seis bloques FALTA).
- **Cómo se edita:** todos los textos, las imágenes y el tamaño están en `contenido.js`. `exportar.bat` (doble clic) exporta y avisa si algo no cabe. Detalle en `LEEME.md`.
- **Ojo:** caben justo, con unos 3 cm libres por lámina. Si se agrega texto en un bloque, hay que acortar en otro.
- **FALTA (10):** logo UDD (en las dos láminas), captura del Plan de Neka, razón del cambio del Perfil, y los 6 bloques de la sección 12.
- **REVISAR:** la bajada, «Neka propone, tú decides», la tabla «Qué cambió». También frases redactadas por la sesión: los textos de la balanza, «Abandono de las apps de productividad», «Lo que ves es lo que se aplica» y el texto bajo el teléfono del plan. Dos textos se acortaron para caber: el paso 4 de Neka y la línea «Hecha con…». Falta confirmar la numeración corrida (01–06 y 07–12).

## 02_PRESENTACION — terminada como plantilla

- **Salida:** `salida/Nekal_Presentacion.pdf` (56 páginas) + `salida/capturas/` (una imagen por diapositiva).
- **Contenido:** 50 diapositivas + 6 de respaldo (glosario, ficha de la encuesta, por qué un plan no crea choques, fases de la V2, referencias). Suma **28:18 de 30:00**; el reparto por diapositiva está en `REPARTO_DE_MINUTOS.md`, que se rehace solo al exportar.
- **Cómo se usa:** se abre `presentacion.html` con doble clic. Teclas: F pantalla completa, N notas y reloj, G ver todas, O ventana del orador. Hay 18 tipos de diapositiva para copiar. `EXPORTAR.bat` rehace el PDF y avisa si se pasa de 30 min o si un texto se sale. Detalle en `LEEME.md`.
- **Probado** con navegador automático; **no probado en un proyector real.**
- **FALTA (12):**
  - el video (va en `media/video.mp4`) y el pantallazo del Plan de Neka;
  - las fechas de V0 y V1 y la razón del cambio del Perfil;
  - validación con usuarios (2 diapositivas), carta Gantt, costos, financiamiento, impacto y ética;
  - el orden de la proyección, las conclusiones y la ficha de la encuesta.
- **Dudas abiertas:**
  - la bajada y los 4 principios;
  - las diapositivas 37–39 (qué cambió);
  - el recorrido de la demo y su plan B;
  - video y demo seguidos suman 4 min, y de ahí se puede sacar tiempo para validación;
  - decir en voz propia que la encuesta es exploratoria.

## 03_VIDEO — prototipo terminado

- **Salida:** `salida/nekal-video.mp4`, **1:46** medido en el archivo, 1920 × 1080, 30 cuadros por segundo, **sin audio**.
- **Guion:** `GUION.md`, 10 escenas con la locución escrita. El arco es portada, problema y cifras, pregunta, propuesta, la app en uso (algo choca, Neka propone, Aceptar), Espacio, progreso, proceso V0→V2 y cierre.
- **Material real:** las escenas 05 a 08 (45 de los 106 segundos) son grabaciones de la app. El plan de Neka se grabó con la IA real.
  - La grabación ajusta los datos de ejemplo **solo dentro de su navegador temporal**, sin tocar la app: agrega una clase fija que choca, manda a la papelera casi todas las atrasadas y pone el nombre «Nicolás».
- **Comandos** desde `03_VIDEO/`:

  | Comando | Qué hace |
  |---|---|
  | `npm run vista` | Vista previa |
  | `npm run revisar` | Saca cuadros a `revision/` |
  | `npm run exportar` | Genera el MP4 y avisa si pasa de 2:00 |
  | `npm run grabar [-- plan]` | Vuelve a grabar la app (con la app en `:8082`) |
  | `npm run preparar` | Vuelve a copiar `00_BASE` |

  Detalle en `LEEME.md`.
- **Instalado en el equipo:** ffmpeg 9.0.2 (winget) y Playwright. Hyperframes queda fijo en la versión 0.9.42 y se ejecuta con npx.
- **Provisional:**
  - Escena 09: caja «FALTA · Validación con usuarios».
  - Escena 06: la IA movió la llamada a las 08:15 y hay que deslizar para ver los botones. Conviene repetir la toma (`npm run grabar -- plan`); cada intento gasta una consulta gratis de la IA.
  - Escenas 01 y 10: falta el logo UDD.
  - Escenas 05 a 08: hay que regrabarlas cuando cambie la app.
- **Falta:** grabar la voz, elegir música (`proyecto/assets/audio/`) y conseguir el logo.

---

## Revisión de la sesión principal (14/11)

Las tres piezas se ven profesionales y coherentes entre sí, con la misma identidad, y respetan lo pedido. No encontré textos cortados ni encimados en lo que miré. Cosas que noté:

1. **Las piezas no se conectan todavía.** El video ya tiene la grabación real del plan de Neka (`03_VIDEO/proyecto/assets/app/plan.mp4`), pero láminas y deck siguen con ese teléfono en FALTA. Tampoco se copió el MP4 a `02_PRESENTACION/media/video.mp4`.
2. **Los pantallazos de `00_BASE` están desactualizados respecto del video.** Muestran «34 atrasadas», «Sin nombre» en el Perfil y el chat vacío. El video resolvió eso con datos limpios dentro de su grabación, pero `capturar.mjs` no lo hace.
3. **Los principios no son iguales en las tres piezas.** Láminas y deck usan 4; el video muestra 3 chips. Hay que unificarlos cuando Nicolás confirme la redacción.
4. Las dos sesiones dijeron haber dejado una nota para las otras (`laminas.md` y una del video), pero **no están en la carpeta**. Lo útil de esas notas quedó en este registro.
5. Cada pieza trae su propio `node_modules` (`00_BASE/herramientas` y `03_VIDEO`, 14 MB cada uno); git ya los ignora. El video y sus grabaciones pesan unos 36 MB; tenerlo en cuenta si se commitea.

## Ronda 2 · 14 de noviembre de 2026 (después de Fable, Claude Opus 5.5)

Pedido de Nicolás: una guía sobre cómo se hace la memoria; una segunda versión de las láminas, más minimalista; presentación y video quietos. También advirtió que la ronda 1 usa demasiada información vieja del anteproyecto y de versiones pasadas. El proyecto cambió mucho, así que las piezas deben parecerse más a una maqueta: qué es el proyecto, las pantallas y lo más importante.

### 01_LAMINAS/v2_minimal — láminas minimalistas (sesión «Nekal · Plantilla de láminas», pasada a Opus)

- **Salida:** `salida/nekal-minimal-1.pdf` y `-2.pdf` (50 × 105 cm) + PNG. La versión 1 queda intacta.
- **Lámina 1:** frase de la app, qué es Nekal, el problema en dos frases, 3 cifras (85,4 %, 62,5 %, 72,9 %), la pregunta de investigación y los tres perfiles.
- **Lámina 2:** «Neka propone. Tú decides.» en 3 teléfonos (algo choca, plan de Neka, tú aceptas), las 4 partes de la app (Resumen, Espacio, Neka, Perfil) y 3 principios.
- **Fuera respecto de la v1:** línea de tiempo de referentes, estado del arte, marco teórico, glosario, tabla de cambios, multiagente y bloques FALTA grandes.
- **Pantallas:** cuadros de las grabaciones reales del video, con datos limpios («Hola, Nicolás», sin las 34 atrasadas). Ya incluyen el plan de Neka con «Aceptar 1 cambio».
- **Skill:** no pudo instalar una nueva por permisos; usó `taste-skill` y `frontend-design`.
- **Revisión de la sesión principal:** se ve limpia y coherente. Hay que mirar dos cosas:
  - Las pantallas miden 780 px de ancho: impresas a unos 15 cm dan cerca de 130 dpi, suficiente para mirar a un metro, pero no «alta calidad». Para la versión final conviene regrabarlas a 1170 px.
  - En el teléfono del plan de Neka casi toda la pantalla es la grilla horaria vacía (12:00–18:00).
  - Además, el círculo del Espacio muestra el defecto de la app con las etiquetas encimadas («SIN FECHA»/«Universidad», «Trabajo» cortado).

### 04_MEMORIA — guía de la memoria (sesión nueva «Guía de la memoria de título (UDD)»)

- `GUIA_MEMORIA.md`, unas 9.800 palabras. Cubre:
  - qué es la memoria y cuánto pesa: 10 % del Taller, cerca de 3 % del título, y 1,0 si no se entrega;
  - los plazos 2026-1;
  - la estructura parte por parte, con lo que exige la UDD y su fuente y página;
  - la **pauta de la memoria definitiva transcrita completa** (18 indicadores) y qué mostrar para sacar «Excelente»;
  - aspectos formales, APA 7 frente a la norma, cómo escribirla y una lista final;
  - preguntas para el profesor guía y las fuentes.
- `ESTRUCTURA_PLANTILLA.md`: índice en blanco de una memoria de proyecto aplicado, con extensiones aproximadas.
- No contiene nada de Nekal, como se pidió.
- **Revisión de la sesión principal:** comparé la transcripción con la pauta escaneada (KIT p. 30) y coincide.

### Corrección de la sesión principal

En la ronda 1 dije que el abstract se entregaba el lunes 23/11. **Era un error**: esa fila del cronograma está en la columna «Secciones 2026-2». Para la sección de Nicolás (2026-1) la fecha clave es la memoria final, cerca del «Lunes 15 de diciembre». Ese día cae martes en 2026: confirmar con la coordinadora. Quedó corregido en `00_BASE/REQUISITOS_UDD.md`.

### Información vieja en la ronda 1 (pendiente, sin tocar por ahora)

Presentación y video se dejaron quietos por pedido de Nicolás. Cuando se retomen, aplicar el mismo criterio de la v2 de láminas. En la presentación, lo más cargado de anteproyecto son:

- la línea de tiempo de referentes (diapositiva 13);
- «Cinco ideas sostienen el proyecto» (12);
- el bloque «qué cambió» (37–39).

El relato (`00_BASE/RELATO.md` §4, §5, §10) también arrastra esa información. Conviene que Nicolás decida qué de eso sigue vigente.

## Por dónde seguir (en orden)

1. **Nicolás revisa `00_BASE/RELATO.md`**: lo marcado REVISAR, la razón del cambio del Perfil, las fechas de V0 y V1, y confirma las fechas de entrega con la coordinadora (memoria final cerca del 15/12; ver ronda 2).
2. **Unificar el material** (lo puede hacer Claude):
   - rehacer los pantallazos con datos limpios, reusando lo que hace `03_VIDEO/herramientas/grabar.mjs`;
   - sacar el pantallazo del Plan de Neka de `plan.mp4`;
   - ponerlo en láminas y deck, y copiar el video al deck;
   - repetir la toma de la escena 06;
   - unificar los principios.
3. **Contenido que solo puede generar Nicolás:** pruebas con usuarios (pesa en la pauta y es el objetivo específico 4), costos y financiamiento, impacto y ética, Gantt con fechas, conclusiones. Cuando existan, se agregan al relato y luego a cada pieza.
4. **Logo UDD** en `00_BASE/marca/`.
5. **Voz y música** del video.
6. Antes del examen: probar el deck en un proyector real e imprimir una prueba de lámina a escala.
