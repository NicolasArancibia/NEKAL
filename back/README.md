# Backend V1

Esta carpeta conserva su función de backend. La V1 usa Firebase Authentication y Firestore directamente mediante su SDK, sin servidor Node adicional.

Authentication y Firestore están habilitados en `nekal-973b2`. Desde la raíz del repositorio, `npm run deploy:rules` publica `back/firestore.rules` mediante la configuración `firebase.json`. No usar reglas públicas.

Cada cuenta tiene colecciones privadas bajo `users/{uid}`. Entidades: `items`, `steps`, `dependencies`, `attachments`, `workspaces`, `groups`, `rewards`, `rewardEntries`, `messages`, `settings`. Control: `sync/meta` serializa revisiones y `operations/{id}` evita repetir operaciones confirmadas. La migración conserva `nekal/state` como respaldo de solo lectura. No hay colaboración entre cuentas.

Las reglas validan tipos, campos permitidos y límites por documento; exigen propietario autenticado y una revisión nueva en la misma transacción. La integridad global (ciclos, referencias, puntaje) se valida en el cliente contra una revisión consistente; no se presenta como validación autoritativa de un servidor para rankings o colaboración. Los roles del perfil son texto, no permisos.

Pruebas de aislamiento, entradas inválidas, revisiones, migración y concurrencia: `front/tests/firestore.cjs`. Modelo y recuperación: `documentacion/SINCRONIZACION.md`.

Configuración del cliente: copia `front/.env.example` a `front/.env.local`. Ver `documentacion/V1.md`.
