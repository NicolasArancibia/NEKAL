# Preparación de la presentación final — Nekal

Todo lo que se arma para el examen de título, aparte de la app. Creado el 13 de noviembre de 2026.

**Son plantillas para partir, no la versión final.** La app todavía cambia; todo aquí debe poder editarse y volver a generarse.

**Estado y próximos pasos: [REGISTRO.md](REGISTRO.md).** Léelo primero.

| Carpeta | Qué tiene |
|---|---|
| `00_BASE/` | Lo que comparten las tres piezas: relato del proyecto, requisitos de la universidad, estilo de Nekal y pantallazos reales de la app. **Se lee antes de tocar cualquier otra carpeta.** |
| `01_LAMINAS/` | Plantilla de las 2 láminas verticales (HTML → PDF para imprimir). |
| `02_PRESENTACION/` | Plantilla de diapositivas 1920×1080 para los 30 minutos de exposición (HTML → PDF). |
| `03_VIDEO/` | Guion y prototipo del video de 1:40 a 2:00, hecho con código (Hyperframes + GSAP). |

## Reglas para quien trabaje aquí

- Cada pieza toca **solo su carpeta**. `00_BASE/` se lee; si le falta algo, se avisa en vez de cambiarla por cuenta propia.
- No se toca la app (`front/`, `back/`) ni `DOCUMENTOS/`. No se hace commit ni se cambia de rama.
- El contenido sale de `00_BASE/RELATO.md`. Lo marcado **[FALTA]** no se inventa: se deja un espacio visible que diga qué va ahí.
- Los datos, citas y cifras solo se usan si están en el relato. Nada de cifras inventadas.
- El estilo sale de `00_BASE/estilo/nekal.css` (mismos colores y tipografía que la app).
- Las pantallas de la app son las reales de `00_BASE/pantallas/`, nunca dibujos aproximados.
- Texto en español de Chile, simple y directo.
