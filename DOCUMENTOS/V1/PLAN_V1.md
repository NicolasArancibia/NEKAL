# Plan V1 Nekal

Decisiones: web y Expo Go (iOS), Firebase opcional para cuentas/datos, asistente local sin IA externa, fórmula de puntos documentada. Se conserva front/src/{pages,navigation,components/layout,components/ui,styles,utils} y back.

1. Modelo tipado, validaciones, persistencia local y pruebas de reglas.
2. Formularios de los ocho tipos, espacios, red, dependencias y rutinas.
3. Calendario, resumen, progreso y recompensas sin duplicación.
4. Neka con detección/propuestas confirmables, perfil, ajustes y Firebase.
5. Pruebas de integración web, exportación web/iOS y documentación operativa.

Firebase requiere un proyecto del propietario, Email/Password habilitado, Firestore y reglas desplegadas. La app será utilizable localmente sin estos accesos. No se publicará ni creará infraestructura de pago automáticamente.

Estado de entrega: etapas 1–5 implementadas para uso local y verificadas en web. Pruebas automatizadas: 28/28; TypeScript y exportaciones web/iOS aprobadas. React Native actualizado de 0.86.2 a 0.86.3 para ajustarse al SDK instalado. Integración Firebase preparada; pendiente configuración y validación con el proyecto del propietario. Prueba física de Expo Go pendiente. Ver V1.md y README.md para operación y límites.
