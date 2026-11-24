# Sistema visual del Espacio (para pasar a Figma)

Referencia de diseño del subproyecto B ([spec](B_ESPACIO.md)). Reúne lo decidido en las maquetas 05, 06 y 07 de [B_MAQUETA/](B_MAQUETA/), para rehacerlo ordenado en Figma. Los valores de base salen de `front/src/styles/theme.ts` (sistema A). Lo que el Espacio agrega se marca como **nuevo**.

## 1. Base (del sistema A)

| Token | Valor |
|---|---|
| Violeta principal | `#7546EC` · suave `#EFE7FF` |
| Fondo / superficie | `#FAF8FF` / `#FFFFFF` |
| Tinta / secundaria | `#241D38` / `#6F6683` · completado `#776E8A` |
| Líneas | `#EEE9F6` · fuertes `#948BA6` |
| Peligro / éxito / aviso | `#B42A55` / `#2F9E77` / `#E8962E` |
| Fuente | Plus Jakarta Sans 400–800 |
| Tipos | Título grande 26/800 · Título 20/700 · Destacado 15/700 · Cuerpo 14/500 · Nota 13/500 · Pie 12/500 |
| Espacios | 4 · 8 · 12 · 16 · 20 · 24 · 32 (borde de pantalla 18) |
| Radios | 12 · 14 · 20 · 26 · píldora |
| Sombras | tarjeta `0 6 20 rgba(90,51,164,.08)` · elevada `0 12 32 rgba(40,20,90,.18)` |
| Toque mínimo | 44 pt |
| Movimiento | resorte suave (20/180/1) · rápido (18/420/0.6) · presionar 0.97 · fundido 180 ms |

## 2. Colores de mesa (nuevo, provisorios)

| Mesa (ejemplo) | Color | Suave | Degradé del borde 3D |
|---|---|---|---|
| Violeta | `#7546EC` | `#EFE7FF` / zona `#F1ECFF`, `#E6DCFF` | `#4F2BC9 → #9B78FA → #3A1FA0` |
| Verde | `#2E9E6B` | `#E3F5EC` / zona `#E8F6EF` | `#1E7A50 → #4CC28C → #17643F` |
| Naranjo | `#D9693C` | `#FFEDE4` / zona `#FFF0E8` | `#B84A20 → #F59464 → #A2401A` |
| Tranquila (vidrio) | `#948BA6` | `#F4F2F8` | `#D9D3E6 → #F1EEF7 → #CFC8DE` |

El significado de cada color se define más adelante. El color identifica la mesa y nunca es la única señal de un estado.

## 3. Idioma común (nuevo)

| Estado | Tiempo (punto) | Mesas (cubito) | Plano (ficha) |
|---|---|---|---|
| Dentro del tiempo elegido | Borde de color + halo | Halo de color en la base | Normal + etiqueta de fecha |
| Hoy | Etiqueta "hoy" | Cubito **oscuro** (`#241D38`) | Etiqueta violeta llena "Hoy" |
| Más adelante | 30 % de opacidad | 32 % | 40 % |
| Sin fecha / en curso | Hueco, anillo de afuera | Normal | Sin etiqueta de fecha |
| Completada | Gris con ✓ | Plano con ✓ | Fondo gris, ✓, título tachado |
| Bloqueada | Borde punteado | Borde punteado | Borde punteado + "Espera N" |
| Seleccionada | Anillo violeta | Borde violeta + halo | Borde violeta 2 px + halo 4 px |
| Urgente | Punto rojo | Punto rojo | Etiqueta roja "Urgente" |
| Carga | (no se muestra) | **Altura** del cubito | ●●○ abajo a la derecha |
| Nota / Idea | No aparece | Plano | Ficha normal ("→ tarea" en ideas) |
| Goal | Arco de avance | Cubito | Barra de avance |

Íconos de línea (Ionicons de línea en la app): tarea ▢, evento 📅, visita 📍, meeting 💬, deadline ⚑, goal ◎, nota 📄, idea 💡, rutina ↻, mesa ◇.

## 4. Componentes (nuevos)

- **Botón de vistas:** 3 segmentos (órbita · cubo · mapa) en una cápsula violeta suave; el activo, blanco con sombra.
- **Selector de tiempo:** 4 píldoras (Hoy, Semana, 2 semanas, Todo). La activa, violeta llena.
- **Ficha de Plano:** blanca, radio 14, ícono en un cuadrado tintado de 26, título 10.5–11/700, dato 9.5/600, barra de 4 px, marcas ●●○.
- **Zona de Plano:** radio orgánico (30/44/34/48), relleno suave de su color, título 13/800 + cantidad. Las zonas internas usan un tono un poco más fuerte.
- **Piso de Mesas:** cara superior blanca, borde de 16–18 px con degradé de su color y sombra suave debajo. La etiqueta va en mayúsculas 11/800 con espaciado. Grupo: borde más delgado. Rutina: ↻. Vidrio: 18 % blanco con borde punteado.
- **Cubito:** cara superior blanca, lados lavanda. La altura es la carga; hoy es oscuro.
- **Fuente externa:** cubito pequeño con ícono gris, unido a General por cables en ángulo recto (`#B9A6F4`).
- **Cable / conexión:** violeta, 1.6–2.4 px, punta de flecha. En la selección se ve con un halo violeta al 12 %.
- **Aviso de borde:** píldora blanca con borde punteado del color de la otra mesa: "2 en Estudios ›".
- **Hoja de cosa:** el `Sheet` del sistema A con el `ItemEditor`, más "Conectar con…" y "Ver dónde está".
- **Menú crear:** hoja con rellenos previos en píldoras (mesa, fecha), una grilla de 4×2 tipos y una fila "Rutina" / "Mesa".
- **Barra de selección:** "N seleccionadas" y 4 acciones (Juntar en rutina, Sacar, Mover a otra mesa, Conectar).

## 5. Gestos

| Gesto | Tiempo | Mesas | Plano |
|---|---|---|---|
| Tocar | Abre la hoja y muestra conexiones | Mesa o grupo: bajar · cubito: hoja | Zona: entrar · ficha: hoja |
| Mantener y mover | Cambia la fecha (encaja por día, vibra) | — (en 3D no se arrastra: mover con la barra de selección) | Reordenar o cambiar de zona |
| Mantener quieto | Selección múltiple · en una mesa: editarla | Cubito: selección múltiple · piso: editar mesa o grupo | Ficha: selección múltiple · zona: editar mesa o grupo |
| Pellizcar | Cambia el tiempo elegido | Acercar y alejar (pisos) | Acercar y alejar |
| Dos dedos girar | — | Girar alrededor del eje | — |
| Arrastrar del puntito | — | — | Conectar |

## 6. Maquetas de referencia

- **05:** las 3 vistas lado a lado (Tiempo, Mesas, Plano de lejos y de cerca).
- **06:** tabla de estados y viñetas de interacción.
- **07:** ajustes finales: mismo eje, vidrio al bajar, crear y juntar comunes. Plano de cerca vuelve a fichas **ordenadas** como en la 05.
- **01–04:** exploración. Las órbitas salen de la 01; las plataformas, de la 02 y la 03.
