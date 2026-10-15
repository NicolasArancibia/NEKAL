# Nekal — V1

Aplicación de organización personal para web y Expo Go. Conserva React Native, Expo y la arquitectura original. Funciona con almacenamiento local sin Firebase.

## Iniciar desde esta carpeta (terminal de Codex o VS Code)

Abre `NombreApp_V1_Codex` en VS Code y usa **Terminal > Nueva terminal**. Los mismos comandos funcionan en una terminal abierta desde Codex en esta carpeta.

```powershell
npm run web
```

Expo muestra la dirección local y abre la web. Para detenerlo: `Ctrl+C`. Si el puerto está ocupado, acepta otro puerto o detén el proceso anterior. Usa siempre la misma dirección/puerto para conservar el mismo almacenamiento del navegador.

Para iPhone:

```powershell
npm start
```

Conecta el PC y el iPhone a la misma Wi-Fi, abre la cámara del iPhone y escanea el QR de Expo. Abre el enlace con **Expo Go**, con una versión compatible con el SDK 57 del proyecto. Desde la terminal de Expo, `w` abre la web. En Windows no uses `npm run ios` para el teléfono físico: ese comando intenta abrir un simulador, que requiere macOS.

En una instalación nueva, antes de iniciar:

```powershell
npm --prefix front ci
```

Si estás situado dentro de `front`, usa directamente `npm ci`, `npm run web` o `npm start`. No ejecutes dos servidores innecesariamente. Si necesitas limpiar la caché del compilador: `npm --prefix front start -- --clear` (no borra tus datos).

## Verificación

```powershell
npm test
npm run typecheck
npm --prefix front run build:web
npm --prefix front run build:ios
```

Las exportaciones quedan en `front/dist` y `front/dist-ios`. Exportar iOS comprueba el bundle; no instala una app en el iPhone ni genera una publicación de App Store.

## Firebase

El proyecto `nekal-973b2` usa Authentication con Email/Password y Cloud Firestore. La configuración está en `front/.env.local`. Para otro proyecto, copia `front/.env.example`, completa las cuatro variables públicas del cliente, publica las reglas de `back/firestore.rules` y reinicia Expo.

Las cuentas cargan, guardan y reciben cambios automáticamente. Sin conexión conservan una cola local que se reenvía al reconectar; un conflicto incompatible requiere elegir una versión desde Perfil. Invitado conserva datos únicamente en ese dispositivo. No se necesitan claves privadas ni cuentas de servicio. Ver [sincronización, estructura y recuperación](documentacion/SINCRONIZACION.md) y [funciones y puntaje de V1](documentacion/V1.md).

## Publicar actualizaciones en Firebase Hosting

Desde la raíz:

```powershell
npm run deploy:web
```

Requiere una sesión autorizada de Firebase CLI (`npx firebase login` si no existe). El despliegue compila primero Expo web y publica `front/dist` en https://nekal-973b2.web.app/. `public/index.html` es la bienvenida generada por Firebase y no contiene Nekal; esa carpeta ya no se publica. No vuelvas a ejecutar `firebase init hosting` para cada actualización.

La configuración pública del cliente está en `front/.env.local`, excluido de Git. El despliegue de Hosting no modifica las reglas de Firestore ni habilita proveedores de Authentication.

Para publicar reglas y web juntas: `npm run deploy`. Para probar las reglas, instala Java 21+, ejecuta `npm test` y después `npm run test:firestore` desde la raíz. Este último comando usa el emulador y el proyecto ficticio `demo-nekal-sync`, nunca tus datos reales.
