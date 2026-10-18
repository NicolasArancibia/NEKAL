// Tokens del sistema de diseño (DOCUMENTOS/V2/A_SISTEMA_DE_DISENO.md).
// Única fuente de colores, tamaños y movimiento de la interfaz. Sin imports de
// React Native para poder compilarlo en las pruebas.
export const color = {
  primary: "#7546EC",
  primarySoft: "#EFE7FF",
  background: "#FAF8FF",
  surface: "#FFFFFF",
  ink: "#241D38",
  inkSecondary: "#6F6683",
  inkDone: "#776E8A",
  line: "#EEE9F6",
  // Bordes de campos e interruptores apagados (≥ 3:1, WCAG 1.4.11).
  lineStrong: "#948BA6",
  danger: "#B42A55",
  dangerSoft: "#FCE8EF",
  success: "#2F9E77",
  warning: "#E8962E",
  onPrimary: "#FFFFFF",
  backdrop: "rgba(32, 20, 54, 0.35)",
  // Decorativos del mapa del Espacio (no se usan como texto).
  mapDot: "#DBCEF6",
  mapEdge: "#CFBAF6",
  // Espacio (subproyecto B): cables entre mesas, mesas en vidrio y sombras de piso.
  cable: "#B9A6F4",
  vidrio: "rgba(255, 255, 255, 0.18)",
  vidrioBorde: "#D3C6F5",
  sombraPiso: "rgba(70, 40, 140, 0.20)",
} as const;
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  screen: 18,
} as const;
export const radius = { sm: 12, badge: 14, md: 20, lg: 26, pill: 999 } as const;
export const shadow = {
  card: "0px 6px 20px rgba(90, 51, 164, 0.08)",
  raised: "0px 12px 32px rgba(40, 20, 90, 0.18)",
} as const;
export type Weight = 400 | 500 | 600 | 700 | 800;
export const font: Record<Weight, string> = {
  400: "PlusJakartaSans_400Regular",
  500: "PlusJakartaSans_500Medium",
  600: "PlusJakartaSans_600SemiBold",
  700: "PlusJakartaSans_700Bold",
  800: "PlusJakartaSans_800ExtraBold",
};
export const type = {
  largeTitle: { size: 26, weight: 800, lineHeight: 32, letterSpacing: -0.6 },
  title: { size: 20, weight: 700, lineHeight: 26, letterSpacing: -0.3 },
  headline: { size: 15, weight: 700, lineHeight: 20, letterSpacing: 0 },
  body: { size: 14, weight: 500, lineHeight: 20, letterSpacing: 0 },
  callout: { size: 13, weight: 500, lineHeight: 18, letterSpacing: 0 },
  caption: { size: 12, weight: 500, lineHeight: 16, letterSpacing: 0 },
} as const;
export type TypeVariant = keyof typeof type;
export const motion = {
  gentle: { damping: 20, stiffness: 180, mass: 1 },
  snappy: { damping: 18, stiffness: 420, mass: 0.6 },
  pressScale: 0.97,
  fadeMs: 180,
} as const;
export const size = {
  minTouch: 44,
  icon: 22,
  tabIcon: 23,
  tabIconActive: 29,
  tabBar: 56,
  sheetDragClose: 120,
  sheetVelocityClose: 800,
  todayLimit: 6,
} as const;
