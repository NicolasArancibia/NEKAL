# Reglas y arquitectura del proyecto

Guía de orientación creada el 15 de octubre de 2026 a partir de las instrucciones del propietario y de la documentación existente.

## Reglas para ordenar

1. No borrar ni sobrescribir originales.
2. No mover código, configuración, `package.json`, archivos de dependencias ni `node_modules`.
3. Organizar documentos, imágenes y versiones conservando su procedencia.
4. Consultar al propietario antes de reorganizar carpetas técnicas.
5. Registrar las rutas anteriores y nuevas en [ORDEN.md](<ORDEN.md>).
6. Distinguir prototipos y propuestas visuales de funciones implementadas.
7. Conservar el historial; crear un documento nuevo si hace falta corregir una explicación sin sobrescribir el anterior.

## Arquitectura que permanece intacta

| Ubicación | Función |
|---|---|
| `front/src/pages` | Pantallas y sus acciones. |
| `front/src/navigation` | Navegación de la aplicación. |
| `front/src/components/layout` | Estructura visual compartida. |
| `front/src/components/ui` | Controles y componentes por pantalla. |
| `front/src/styles` | Tema y estilos. |
| `front/src/utils` | Modelo, planificación, persistencia y sincronización. |
| `front/assets` | Recursos que utiliza la app; no se trasladaron. |
| `front/tests` | Pruebas de desarrollo. |
| `back` | Reglas y documentación técnica de Firebase. |
| `node_modules` y `front/node_modules` | Dependencias instaladas; no se reorganizaron. |

## Documentos técnicos que deben seguir en su ubicación

- [README de la raíz](<../README.md>): comandos de ejecución, pruebas y despliegue.
- [README del backend](<../back/README.md>): contexto de reglas y datos.
- [front/AGENTS.md](<../front/AGENTS.md>): instrucciones para herramientas de desarrollo; exige leer la documentación de la versión de Expo antes de escribir código.
- [front/CLAUDE.md](<../front/CLAUDE.md>): remite a AGENTS.md.
- `.agents` y `.claude`: configuración/instrucciones de herramientas. No se trasladaron.

Los documentos de PROYECTO sirven como índice y explicación. Las instrucciones técnicas originales siguen vigentes en sus rutas originales. Tampoco se movieron `.firebase`, `public`, `tmp`, archivos ocultos ni respaldos privados. Si se desea ordenar esas ubicaciones, requiere una tarea y autorización separadas.
