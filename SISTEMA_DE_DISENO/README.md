# SISTEMA_DE_DISENO · Nekal

Todo el diseño de Nekal en un solo lugar: tokens, componentes, assets, maquetas y documentos. Creada el **14/11/2026**.

**Para quien parta algo nuevo, quiera compartir, ver o sacar algo, o para una IA que necesite saber cómo se ve Nekal: empieza aquí.**

## Qué leer primero

| Archivo | Para qué |
|---|---|
| [DISENO.md](DISENO.md) | El sistema de diseño actualizado: colores, tipografía, espaciado, componentes, Neka, pantallas |
| [CONTRADICCIONES_Y_CAMBIOS.md](CONTRADICCIONES_Y_CAMBIOS.md) | Qué dicen distinto los docs viejos, el código y las maquetas; qué espera tu decisión |
| [REGISTRO_DE_CAMBIOS.md](REGISTRO_DE_CAMBIOS.md) | Historia de cada cambio de diseño, con fecha y razón |
| [Página Design System (privada, en claude.ai)](https://claude.ai/artifact/QDctbUdDicGkER2W1fiHXd) | La misma información para mirar: portada, colores, tipografía, espaciado, radios, sombras, 12 componentes con vista previa y las 18 poses de Neka. Solo la abre quien tenga acceso (no se ha compartido). Sus fuentes están en `pagina-design-system/` (`generar.py` la regenera; `project/` es lo publicado) |

## Qué hay en cada carpeta (todo son **copias**; los originales no se tocaron)

| Carpeta | Contenido | Original (fuente de verdad) |
|---|---|---|
| `tokens/` | `theme.ts` (colores, espacio, radios, sombras, tipos, movimiento), `colores-de-mesa.ts`, `vistasActivas.ts` (flag del Plano), `styles-regla-de-estilos.cjs` (la prueba que prohíbe estilos sueltos) | `front/src/styles/theme.ts`, `front/src/utils/colores.ts`, `front/src/utils/vistasActivas.ts`, `front/tests/styles.cjs` |
| `componentes/` | `base/` (22 componentes + `nekaImages`), `espacio/`, `neka/`, `progreso/`, `amigos/`, `ChatUi/`, `ItemCard`, `ItemEditor` | `front/src/components/ui/` |
| `pantallas-referencia/` | Las 8 pantallas (Resumen, Calendario, Espacio, Chat, Perfil, Ajustes, Bienvenida, Login) | `front/src/pages/` |
| `assets/neka-poses/` | Las 18 poses de Neka (la app usa 1, 3, 5, 7, 14, 15) | `front/assets/Img/` (idénticas a `DOCUMENTOS/RECURSOS_COMPARTIDOS/POSES_NEKA/`) |
| `assets/referencias-visuales/` | `maqueta-B/` (capturas del Espacio y `neka15` de la maqueta A) y `favoritos/` (10 imágenes FAV de inspiración) | `DOCUMENTOS/V2/B_MAQUETA/img/`, `DOCUMENTOS/V2/A_MAQUETA/`, `IDEAS_ESPACIODETRABAJO/FAV/` |
| `maquetas/` | Todas las maquetas HTML: A, B, D, E, F, H y la **MEGA_MAQUETA**. La más completa es `MEGA_MAQUETA/mega-maqueta-v2.html` (14/11, suma lo de H3); la original del 2/11 se conserva | `DOCUMENTOS/V2/*_MAQUETA/` |
| `docs-anteriores/` | Los docs viejos que describen diseño: A (sistema), B (visual y Espacio), D (Neka), E (gamificación), F (amigos), H2 (vistas), H3 (conexiones), diagnóstico H y ROADMAP | `DOCUMENTOS/V2/` |

**No se copió a propósito:** `PREPARACION_PRESENTACION_FINAL/` (la presentación), las rondas de exploración de `IDEAS_ESPACIODETRABAJO/` (00–04, son históricas y pesadas) ni `DOCUMENTOS/V0` y `V1` (históricos). Siguen donde estaban.

## Reglas para mantenerla al día

1. **Cada cambio de diseño** (token, componente, pantalla, maqueta nueva o aprobada) se anota en `REGISTRO_DE_CAMBIOS.md` con fecha y razón.
2. **Si cambia el código** de `theme.ts`, `components/ui/` o `pages/`, se vuelve a copiar aquí y se actualiza `DISENO.md`. La fuente de verdad del código sigue siendo `front/`; esta carpeta es la referencia ordenada.
3. **Maqueta nueva:** se guarda en su carpeta de fase (`DOCUMENTOS/V2/..._MAQUETA/`), se copia a `maquetas/` y se anota. Las maquetas viejas **nunca** se borran: una versión nueva es un archivo nuevo.
4. **Si un doc viejo y el código dicen cosas distintas:** decidir si es *cambio con razón* o *contradicción* y anotarlo en `CONTRADICCIONES_Y_CAMBIOS.md`. No resolverlo en silencio.
5. Las copias de `.tsx` y `.ts` de esta carpeta **no se compilan**: no están en `front/`. Si editas aquí no cambias la app.

## Lo que no pude comprobar

La descripción de cada pantalla (`DISENO.md` §11) viene de los specs de cada fase y de la mega maqueta; no la verifiqué abriendo la app. La app tampoco se ejecutó para esta tarea.
