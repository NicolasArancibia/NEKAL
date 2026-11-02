# Nekal

App de organización personal (Resumen, Calendario, Espacio, Chat con Neka, Perfil). V1 en producción en `nekal-973b2.web.app`; ahora se trabaja la **V2**.

Stack: Expo 57 + React Native 0.86 + React 19 + TypeScript (`front/`), Firebase Auth + Firestore + Hosting (`back/firestore.rules`). Web y iPhone (Expo Go).

## Comandos (desde la raíz)

- `npm run web` — app web local (puerto 8081)
- `npm test` — pruebas de dominio, sync, Neka, tema y estilos (runner propio en Node, no jest)
- `npm run typecheck` · `npm --prefix front run build:web`
- `npm run test:firestore` — reglas en emulador; requiere Java 21 (Temurin, instalado el 26/10; en PowerShell refrescar el PATH antes)
- `npm run deploy` — publica reglas + web. **Solo si se pide explícitamente.**

## Reglas

- Antes de escribir código Expo, consultar la doc de **Expo v57** (MCP `context7`); ver `front/AGENTS.md`.
- Lógica en `front/src/utils` (`model.ts`, `planner.ts`, sync, `neka.ts`). Pantallas en `front/src/pages`.
- Espacio (V2/B): `utils/estructura.ts` (mesas, grupos, mover), `utils/espacio.ts` (estados, carga, árbol), `utils/rutinas.ts` y `utils/acomodo/` (Tiempo, Plano, Mesas y proyección 3D), todos puros y con pruebas. Vistas en `components/ui/espacio/`. Mesas dibuja con **Skia** (`@shopify/react-native-skia`); en web carga CanvasKit con `WithSkiaWeb` (`front/public/canvaskit.wasm`, lo copia `postinstall`).
- Neka con IA (V2/D): `utils/agente/` (contexto, herramientas, plan, conversación, mensajes, día dibujado), puro y con pruebas con un cerebro falso. Solo `agente/cerebro.ts` importa `firebase/ai` (Gemini Flash-Lite por Firebase AI Logic, plan gratis); App Check se inicia en `utils/firebase.ts` (reCAPTCHA v3 en la web publicada; token de depuración en `front/.env.development.local`, que nunca se commitea ni entra en la build). `utils/NekaContext.tsx` une chat, audio (`expo-audio`) y voz (`expo-speech`).
- Gamificación (V2/E): `utils/progreso/` (nivel con curva, días y racha, rating por mesa con área, 25 logros, «desde el día 1»), puro y con pruebas; `utils/useProgreso.ts` lo junta para las pantallas y la UI vive en `components/ui/progreso/`. El puntaje (bonus a tiempo, dificultad sin fecha) está en `model.ts`. Solo se guardan el área de la mesa y los logros vistos (`logros`). El modal de logro (`LogroNuevo`) espera a que no haya hojas abiertas (`utils/hojasAbiertas.ts`) ni sincronización en curso.
- Amigos (V2/F): `utils/amigos/` (código de 6 caracteres, tarjeta y áreas, amistades y avisos, datos de ejemplo) puro y con pruebas; solo `amigos/nube.ts` habla con Firestore y `utils/AmigosContext.tsx` lo junta (escucha amistades y tarjetas, publica la tuya solo después de la primera sincronización). Colecciones fuera de la caja privada: `codigos`, `amistades` (`uidMenor_uidMayor`) y `perfiles` (tarjeta: nivel, logros conseguidos y áreas, nunca nombres de mesas). UI en `components/ui/amigos/`; `nekalAmigos()` en la consola carga amigos de ejemplo en modo invitado (solo desarrollo).
- Neka estable (V2/H1): `agente/plan.ts` → `choquesDelPlan` compara la agenda antes y después de un plan (los choques que ya había no cuentan; bloquea si lo que el plan toca es flexible y queda encima de otra cosa); lo usan `ejecutar` (Neka corrige dentro de sus vueltas), `aceptar` (revalida) y `HojaPlan` («La agenda cambió» + «Pedir de nuevo»). Un fallo de IA no se guarda en el historial (`mensajesDelTurno`). `agente/gemini.ts` es un segundo cerebro por REST con clave de Google AI Studio: solo si `EXPO_PUBLIC_GEMINI_STUDIO_KEY` está en `front/.env.development.local` (nunca en la web publicada); sin ella, Firebase como siempre. Diagnóstico y fases en `DOCUMENTOS/V2/H_DIAGNOSTICO_Y_PLAN.md`; maquetas en `DOCUMENTOS/V2/H_MAQUETA/` (con `manifiesto.json` para la mega maqueta).
- UI: usar `front/src/styles/theme.ts` y `front/src/components/ui/base/`; sin colores ni tamaños sueltos (lo verifica `tests/styles.cjs`). Texto siempre con `Txt`; íconos Ionicons de línea.
- `DOCUMENTOS/V0`, `DOCUMENTOS/V1` e `IDEAS_ESPACIODETRABAJO` son históricos: no sobrescribir. Documentar la V2 en `DOCUMENTOS/V2/`.
- Las maquetas de `IDEAS_ESPACIODETRABAJO` son propuestas, no funciones implementadas.
- Git solo local (sin GitHub por ahora). `skills-lock.json` está excluido en `.git/info/exclude` (sus hashes disparan el escáner de secretos).
- `front/.env.local` tiene la config pública de Firebase; nunca commitearlo.

## Herramientas recomendadas

- **Cada función de V2:** `superpowers:brainstorming` → `superpowers:writing-plans` → `superpowers:executing-plans`.
- **Lógica (utils):** `superpowers:test-driven-development`. **Bugs:** `superpowers:systematic-debugging`.
- **Antes de dar algo por terminado:** `superpowers:verification-before-completion` (test + typecheck + build:web) y `/code-review`.
- **Diseño/UI:** `ui-ux-pro-max` (cubre React Native) + `mobile-design` (convenciones iOS) + `apple-design` (gestos, animaciones spring, hojas, tipografía y movimiento estilo Apple). Revisar contra maquetas: `design:design-critique`; accesibilidad: `design:accessibility-review`.
- **Firebase:** skills en `.claude/skills` (`firebase-firestore`, `firebase-security-rules-auditor`, `firestore-rules-creation`, `firebase-auth-basics`…). Cambios en reglas: `/security-review`.
- **Ver la app:** `/run` o el navegador integrado (`.claude/launch.json` → `nekal-web`).
- **Solo si aplica:** `3d-web-experience` (Espacio en 3D), `claude-api` (Neka con IA real).

## Pendientes conocidos

- `npm audit` (front, producción): 32 avisos (1 crítico `shell-quote`, 24 altos), casi todos en herramientas Expo/Metro y Firebase/gRPC. `npm audit fix --force` propone retroceder Expo/Firebase: **no usarlo**.
- Pruebas físicas en iPhone pendientes: la prueba final completa de D, la completa de E y la de H1 (Neka sin choques).
