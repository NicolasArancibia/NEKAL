# Proyecto Nekal

Documento de orientación creado el 15 de octubre de 2026. La organización de carpetas no modifica la aplicación ni publica cambios.

Nekal es una aplicación de organización personal con cinco secciones: Resumen, Calendario, Espacio, Chat y Perfil. Reúne notas, ideas, eventos, visitas, reuniones, fechas límite, objetivos y tareas. Neka ofrece acciones guiadas y propuestas de planificación; las exploraciones visuales del espacio de trabajo son investigación separada.

## Por dónde empezar

- [ORDEN: mapa e inventario de archivos](<ORDEN.md>).
- [V1: guía de lectura y estado documentado](<../DOCUMENTOS/V1/README.md>).
- [Firebase y sincronización automática](<CONEXIONES/SINCRONIZACION.md>).
- [Reglas de organización y arquitectura](<REGLAS_Y_ARQUITECTURA.md>).
- [Documento original de V0](<../DOCUMENTOS/V0/INFo_APP.pdf>).
- [Investigación y propuestas para el espacio de trabajo](<../IDEAS_ESPACIODETRABAJO/README.md>).
- [README técnico de la raíz: iniciar, probar y publicar](<../README.md>).

## Conexiones y funcionamiento documentado

La V1 utiliza Expo, React Native y TypeScript. Firebase Authentication gestiona las cuentas; Firestore guarda los datos por usuario; Firebase Hosting publica la web. AsyncStorage conserva datos locales y cambios pendientes. Invitado guarda solo en el dispositivo.

La última comprobación funcional registrada en la documentación es del 1 de octubre de 2026. Esta tarea del 15 de octubre organiza archivos: no vuelve a verificar el servicio ni cambia sus accesos. Los resultados, límites y pendientes de esa comprobación se conservan en el documento de sincronización.

Los archivos `front/.env.local`, `firebase.json`, `.firebaserc` y `back/firestore.rules` permanecen donde la app y las herramientas los buscan. Este directorio reúne documentación; no sustituye esos archivos operativos.
