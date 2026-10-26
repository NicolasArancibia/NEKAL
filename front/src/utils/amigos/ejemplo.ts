import { LogroId } from "../model";
import { Amistad, idPar } from "./amistades";
import { Tarjeta } from "./tarjeta";

// Amigos de ejemplo para `nekalAmigos()` (solo en desarrollo), con los datos
// de las maquetas F/02–04. Tomás no tiene tarjeta todavía. Buscar cualquier
// código válido encuentra a Diego Lagos (`PERSONA_EJEMPLO`), como en la maqueta 04.
export const YO_EJEMPLO = "ejemplo-yo";
export const PERSONA_EJEMPLO = { uid: "ejemplo-diego", nombre: "Diego Lagos" };

const amistad = (
  otro: string,
  nombre: string,
  codigo: string,
  estado: Amistad["estado"],
  mia = false,
): Amistad => ({
  id: idPar(YO_EJEMPLO, otro),
  de: mia ? YO_EJEMPLO : otro,
  para: mia ? otro : YO_EJEMPLO,
  estado,
  nombreDe: mia ? "Tú" : nombre,
  nombrePara: mia ? nombre : "Tú",
  codigo,
});

const JAVIERA: LogroId[] = [
  "primer-amigo",
  "racha-14",
  "listas-250",
  "nivel-10",
  "semana-perfecta",
  "primera-meta",
  "primera-rutina",
  "primer-audio",
  "racha-7",
  "racha-3",
  "listas-100",
  "listas-50",
  "listas-10",
  "nivel-5",
  "primer-dia-100",
  "primera-mesa",
  "primera-cosa",
];
const MARTIN: LogroId[] = [
  "primer-amigo",
  "nivel-5",
  "racha-7",
  "racha-3",
  "listas-50",
  "listas-10",
  "primera-mesa",
  "primera-cosa",
];

export function amigosDeEjemplo(): {
  codigo: string;
  amistades: Amistad[];
  tarjetas: Record<string, Tarjeta | null>;
} {
  return {
    codigo: "7KQ2PX",
    amistades: [
      amistad("ejemplo-camila", "Camila Soto", "7KQ2PX", "pendiente"),
      amistad(
        "ejemplo-valentina",
        "Valentina Ríos",
        "4M8PQR",
        "pendiente",
        true,
      ),
      amistad("ejemplo-javiera", "Javiera Muñoz", "7KQ2PX", "aceptada"),
      amistad("ejemplo-martin", "Martín Pérez", "H3TW9C", "aceptada", true),
      amistad("ejemplo-tomas", "Tomás Reyes", "7KQ2PX", "aceptada"),
    ],
    tarjetas: {
      "ejemplo-javiera": {
        nombre: "Javiera Muñoz",
        roles: "Ingeniera · corredora",
        desde: "2026-09-14",
        nivel: 11,
        puntos: 5980,
        logros: JAVIERA,
        areas: {
          salud: { valor: 85, mesas: 1 },
          trabajo: { valor: 78, mesas: 1 },
          estudio: { valor: 66, mesas: 2 },
        },
        codigo: "R7DK2M",
      },
      "ejemplo-martin": {
        nombre: "Martín Pérez",
        roles: "Diseñador",
        desde: "2026-08-20",
        nivel: 6,
        puntos: 1720,
        logros: MARTIN,
        areas: {
          trabajo: { valor: 72, mesas: 1 },
          social: { valor: 64, mesas: 1 },
        },
        codigo: "H3TW9C",
      },
      "ejemplo-tomas": null,
    },
  };
}
