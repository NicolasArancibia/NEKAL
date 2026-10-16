# Nekal

App de organización personal (Resumen, Calendario, Espacio, Chat con Neka, Perfil). V1 en producción en `nekal-973b2.web.app`; ahora se trabaja la **V2**.

Stack: Expo 57 + React Native 0.86 + React 19 + TypeScript (`front/`), Firebase Auth + Firestore + Hosting (`back/firestore.rules`). Web y iPhone (Expo Go).

## Comandos (desde la raíz)

- `npm run web` — app web local (puerto 8081)
- `npm test` — pruebas de dominio, sync, Neka, tema y estilos (runner propio en Node, no jest)
- `npm run typecheck` · `npm --prefix front run build:web`
- `npm run test:firestore` — reglas en emulador; requiere Java 21 (no instalado)
- `npm run deploy` — publica reglas + web. **Solo si se pide explícitamente.**

## Reglas

- Antes de escribir código Expo, consultar la doc de **Expo v57** (MCP `context7`); ver `front/AGENTS.md`.
- Lógica en `front/src/utils` (`model.ts`, `planner.ts`, sync, `neka.ts`). Pantallas en `front/src/pages`.
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
- Prueba física en iPhone pendiente desde V1.
