# Sincronización automática — 30 de septiembre de 2026

## Uso

Al iniciar sesión se muestra la copia local disponible y se carga Firebase automáticamente. Cada cambio validado se escribe primero en la cola local de esa cuenta y luego se envía mediante una transacción. El encabezado y Perfil muestran el estado y el número de cambios pendientes. “Reintentar conexión” sirve para adelantar un reintento; no es un botón obligatorio de guardado.

Un listener de Firestore recibe nuevas revisiones de la cuenta. Se vuelve a leer una instantánea consistente y se incorporan los cambios de otros dispositivos. Hay reintentos progresivos y comprobaciones al volver a la app, enfocar la web o recuperar la conexión. Debe estar abierta para sincronizar: un navegador cerrado o una app suspendida por iOS no ejecutan trabajo permanente en segundo plano.

Invitado sigue siendo local. Cerrar sesión separa los datos por UID: no mezcla cuentas ni importa automáticamente al invitado. Para transferir datos del invitado, exporta e importa el respaldo en la cuenta elegida.

## Datos en Firestore

El orden visual de la consola no importa. Los nombres de las colecciones y sus relaciones sí:

```text
users/{uid}/
  settings/profile                 nombre y roles descriptivos
  settings/preferences             jornada y preferencias compartidas
  workspaces/{id}                   espacios
  groups/{id}                       rutinas
  items/{id}                        datos principales del ítem
  steps/{itemId~stepId}             subtareas/hitos y su orden
  dependencies/{itemId~targetId}    referencias y su orden
  attachments/{itemId~attachmentId} adjuntos pequeños independientes
  rewards/{itemId}                  cabecera del historial de puntos
  rewardEntries/{key}               presupuesto y movimientos de puntos
  messages/{id}                     conversación guiada con Neka
  sync/meta                        versión del esquema, fase y revisión
  operations/{id}                   comprobantes de operaciones aplicadas
  nekal/state                      respaldo anterior, solo lectura
```

Los IDs compuestos se codifican para usarlos como nombres de documentos. Las entidades llevan `value` y `updatedAt` del servidor; sus IDs y referencias son estables. La preferencia de permiso de notificaciones es local a cada dispositivo. `AppData.version` continúa en 1 para conservar los respaldos existentes; el formato remoto tiene `schema: 2`. Las carpetas del proyecto no se reorganizaron.

Los pasos, relaciones, adjuntos y movimientos separados evitan que una cuenta completa o una lista anidada deba caber en un solo documento. La app todavía carga el conjunto de datos de una cuenta: para volúmenes muy grandes convendrá paginar y escuchar colecciones selectivamente. No se necesita Firebase Storage para los adjuntos pequeños actuales; archivos grandes requerirán incorporarlo.

## Migración y respaldo

La primera conexión crea un marcador `migrating`, copia el documento anterior en bloques y marca `ready` al terminar. Si se interrumpe, continúa creando solo los documentos faltantes. Dos dispositivos pueden intentar migrar sin sobrescribirse. El documento antiguo no se borra ni vuelve a actualizarse; las versiones antiguas de la web deben recargarse.

Antes del despliegue se respaldaron datos y reglas actuales en `tmp/private-backups/`, excluido de Git y de Hosting. No se incluyen credenciales. Una copia de esos datos también se usó para comprobar la migración en el emulador sin imprimir su contenido.

Cuando hay una copia local V1 sin historial de sincronización conocido, se preservan sus aportes y se solicita revisión ante versiones incompatibles. No se adivina cuál edición era más reciente ni se descarta la copia local.

## Desconexión y cambios simultáneos

- Cada operación conserva el valor de partida y el nuevo valor de cada entidad afectada, con un ID único. AsyncStorage guarda una cola por cuenta; en web usa almacenamiento del navegador. Las operaciones se guardan individualmente para evitar que una pestaña borre la cola de otra.
- Un fallo de red deja operaciones pendientes; cerrar y reabrir conserva la cola. Confirmar una operación genera un comprobante remoto para no repetirla si se interrumpe la confirmación local.
- La transacción exige la revisión que se leyó. Si otro dispositivo escribió, se vuelve a leer y combinar. Campos distintos se combinan; cambios incompatibles del mismo campo, borrado frente a edición y alteraciones estructurales requieren revisión.
- Las listas lógicas de pasos y dependencias se tratan como una unidad al combinar: dos modificaciones diferentes a la misma lista pueden requerir revisión aunque sus documentos físicos estén separados. Esto prioriza conservar coherencia de orden y relaciones.
- Perfil muestra ambas versiones de las entidades en conflicto. La elección se aplica a los cambios pendientes de ese dispositivo. Antes se guarda un respaldo completo recuperable en Ajustes. Ninguna resolución automática decide entre dos textos distintos.
- Un formulario abierto no pisa silenciosamente cambios recibidos durante su edición. Si cambió el mismo campo, conserva el borrador y explica cómo reabrir la versión actual.
- Los puntos de un ítem se combinan por el máximo ya ganado, sin sumar dos veces su finalización. Presupuestos diferentes requieren revisión. Reabrir un ítem no vuelve a premiarlo.

No borres datos del navegador ni desinstales Expo Go si aún hay cambios pendientes: eso elimina su almacenamiento local. Un fallo por cuota muestra “Cambios sin guardar”; conserva la app abierta y exporta. La web necesita poder cargar sus archivos para abrirse: esta entrega no instala una PWA con arranque web sin conexión. Con la app abierta, la edición y su cola no necesitan internet.

## Límites y seguridad

Se mantienen 3 adjuntos por nota, de hasta 350 KB cada uno, y respaldos de hasta 10 MB de texto. Se validan documentos lógicos de hasta 700 KB y operaciones de hasta 400 documentos físicos, por debajo del límite de escrituras de la transacción. Una importación masiva que exceda el límite se rechaza conservando los datos existentes; debe dividirse. Límites adicionales de texto se informan antes de encolar.

Las reglas aíslan por UID y deniegan acceso a otras cuentas o a personas sin sesión. Validan estructura, tipos y límites tanto al crear como al actualizar. Los recibos son inmutables y la revisión debe avanzar de forma atómica. Los roles descriptivos no otorgan permisos. La aplicación valida dependencias, ciclos y coherencia de puntos; para puntajes competitivos o colaboración se necesitaría validación autoritativa del servidor. Las reglas son un prototipo probado en emulador y requieren revisión antes de una distribución amplia.

## Verificación y ejecución

Desde la raíz, en terminal de Codex o VS Code:

```powershell
npm run web                 # desarrollo web
npm start                   # QR para Expo Go, PC/iPhone en la misma Wi-Fi
npm test                    # 28 pruebas de dominio + escenarios de sync y cola local
npm run typecheck
npm run test:firestore       # requiere Java 21+, emulador demo-nekal-sync
npm --prefix front run build:web
npm --prefix front run build:ios
npm run deploy              # publica reglas y web en el proyecto configurado
```

Pruebas añadidas: combinación de campos, conflictos, doble finalización, eliminación concurrente, edición offline y reinicio, reintentos, recepción de cambios, respaldo al resolver, pestañas paralelas, aislamiento local, recuperación tras error de almacenamiento, migración interrumpida, repetición idempotente, permisos de otras cuentas/anónimos, campos inválidos, recibos inmutables, transacciones concurrentes, 150 pasos y cuenta con adjuntos de más de 1 MB en total. iOS se valida por compilación; la prueba física en tu iPhone sigue pendiente.

Tecnología añadida: `@firebase/rules-unit-testing` como dependencia de desarrollo. Se usó Java 21 portátil para el emulador, sin modificar la instalación del sistema. No se cambió Expo, React Native ni Firebase, ni se añadió un servicio de IA o infraestructura de pago.

## Comprobación de publicación — 1 de octubre de 2026

La publicación iniciada el 30 de septiembre sí terminó. Se comprobó mediante lectura del servicio que el HTML publicado coincide con `front/dist/index.html` y que las reglas desplegadas coinciden con `back/firestore.rules`. La cuenta existente tiene `sync/meta.phase = ready`; conserva el documento anterior `nekal/state`.

En la web publicada se verificó la carga automática de la cuenta, la creación de una nota temporal, su edición en una segunda pestaña y la recepción del cambio en la primera sin recargar. Después se envió únicamente esa nota de prueba a la papelera y se verificó la propagación a la segunda pestaña. La nota quedó recuperable, sin modificar los ítems del usuario. La app mostró “Sincronizado automáticamente”. Se cerró la segunda pestaña temporal.

Auditoría de dependencias ejecutada el 1 de octubre: `npm --prefix front audit --omit=dev` reportó 10 avisos moderados y 4 altos (sin críticos). Los altos corresponden a la cadena Firebase/Firestore → `@grpc/grpc-js` 1.9.16 usada en el entorno Node; los moderados a herramientas Expo/xcode/uuid. No se forzó la solución sugerida por npm, que propone retroceder Firebase a 9 y Expo a 46. Queda pendiente una actualización compatible de esas dependencias; esta comprobación no equivale a una auditoría integral de seguridad.
