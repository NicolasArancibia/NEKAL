# Respaldo del proyecto en GitHub

- Repositorio: https://github.com/NicolasArancibia/NEKAL
- Rama principal: `main`.
- Git controla la carpeta completa del proyecto, incluidos `front`, `back`, `DOCUMENTOS`, `PROYECTO` e `IDEAS_ESPACIODETRABAJO`.
- El historial conserva el commit inicial que existía en `front`. Al incorporar todo el proyecto, sus archivos aparecen bajo `front` en la versión actual.

## Qué se guarda

Código, reglas y configuración pública de Firebase, archivos de dependencias, pruebas con datos sintéticos, documentación, prototipos e imágenes del proyecto.

No se suben dependencias instaladas, compilaciones, registros, cachés, configuraciones privadas `.env*`, claves privadas ni el contenido de `tmp`. Tampoco se suben instalaciones locales de herramientas de asistentes.

Las cuentas y los datos de usuarios de Authentication y Firestore viven en Firebase. Subir el código a GitHub no crea un respaldo de esas bases de datos.

## Guardar cambios futuros

La conexión no sube cada edición automáticamente. Desde la terminal en la carpeta principal:

```powershell
git status
git add .
git diff --cached --stat
git commit -m "Describe los cambios realizados"
git push
```

Revisa la lista de archivos antes de confirmar. Los archivos ignorados permanecen en tu equipo.

## Descargar y ejecutar en otro equipo

Con Git y una versión de Node.js compatible con el proyecto instalados:

```powershell
git clone https://github.com/NicolasArancibia/NEKAL.git
cd NEKAL
npm ci
npm --prefix front ci
Copy-Item front/.env.example front/.env.local
```

Completa `front/.env.local` con la configuración de la aplicación web del proyecto Firebase. El ejemplo contiene los nombres de las variables, sin sus valores. Conserva ese archivo fuera de Git.

Para abrir la versión web:

```powershell
npm run web
```

Para iniciar Expo y abrir la app desde Expo Go:

```powershell
npm start
```

## Conservación local al conectar GitHub

La configuración anterior de Git de `front` se conserva íntegra en `tmp/github-2026-10-15/front.git.original`. También existe un respaldo del historial en `tmp/github-2026-10-15/front-history.bundle` y una copia del `.gitignore` original. Estos archivos quedan solo en este equipo.

No se movió código de la aplicación. El único archivo existente editado para esta conexión fue el `.gitignore` de la raíz, al que se agregaron exclusiones. Este documento se añadió como guía.

Para el mapa de documentos y carpetas, consulta [ORDEN.md](ORDEN.md).
