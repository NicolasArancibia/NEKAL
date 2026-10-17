import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { color, radius, space } from "../../../styles/theme";
import { Tonos, tonosDe } from "../../../utils/colores";
import {
  cargaDe,
  conexiones,
  diasHasta,
  Estado,
  estadoDe,
  fechaDe,
  Ventana,
} from "../../../utils/espacio";
import { AppData, Item, passive } from "../../../utils/model";
import { hhmm } from "../../../utils/neka";
import { Txt } from "../base";
import { typeIcons } from "../ItemCard";

const SEMANA = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MESES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

// Etiqueta corta de fecha: "Hoy", "Mañana", "vie", "29 oct" o "Atrasada".
function cuando(i: Item, now: number): string {
  const f = fechaDe(i);
  if (!f) return "";
  const dias = diasHasta(f, now);
  const d = new Date(f);
  if (dias < 0) return "Atrasada";
  if (dias === 0) return i.scheduledAt ? `Hoy ${hhmm(i.scheduledAt)}` : "Hoy";
  if (dias === 1) return "Mañana";
  if (dias < 7) return SEMANA[d.getDay()];
  return `${d.getDate()} ${MESES[d.getMonth()]}`;
}

// ●●○: 1 hasta 1,5 de carga, 2 hasta 4 y 3 más arriba.
const nivelDe = (carga: number) =>
  carga <= 0 ? 0 : carga <= 1.5 ? 1 : carga <= 4 ? 2 : 3;

// Lo que la ficha necesita saber de los datos.
export function fichaProps(d: AppData, i: Item, v: Ventana, now: number) {
  return {
    estado: estadoDe(i, d, v, now),
    carga: cargaDe(i, now),
    tono: tonosDe(d.workspaces.find((w) => w.id === i.workspaceId)?.color),
    espera: conexiones(d, i.id).requisitos.filter((r) => r.status !== "completado").length,
    now,
  };
}

// Ficha de Plano (B_SISTEMA_VISUAL §3–4). Solo dibuja: los gestos los pone
// quien la usa.
export default function FichaPlano({
  item,
  estado,
  carga,
  tono,
  espera,
  now,
  seleccionada = false,
}: {
  item: Item;
  estado: Estado;
  carga: number;
  tono: Tonos;
  espera: number;
  now: number;
  seleccionada?: boolean;
}) {
  const hecho = estado === "hecho";
  const pasos = item.steps.length;
  const listos = item.steps.filter((s) => s.done).length;
  const fecha = cuando(item, now);
  const dato =
    estado === "bloqueado"
      ? `Espera ${espera}`
      : pasos
        ? `${listos}/${pasos}`
        : item.type;
  const nivel = passive(item) ? 0 : nivelDe(carga);
  return (
    <View
      style={{
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: space.sm,
        paddingHorizontal: space.sm,
        borderRadius: radius.badge,
        backgroundColor: hecho ? color.line : color.surface,
        borderWidth: seleccionada ? 2 : 1,
        borderStyle:
          estado === "bloqueado" && !seleccionada ? "dashed" : "solid",
        borderColor: seleccionada
          ? color.primary
          : estado === "bloqueado"
            ? color.lineStrong
            : color.line,
        outlineColor: color.primarySoft,
        outlineWidth: seleccionada ? 4 : 0,
        opacity: estado === "tenue" ? 0.4 : 1,
      }}
    >
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 9,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: hecho ? color.surface : tono.suave,
        }}
      >
        <Ionicons
          name={hecho ? "checkmark" : typeIcons[item.type]}
          size={14}
          color={hecho ? color.inkDone : tono.base}
        />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Txt
          variant="caption"
          weight={700}
          numberOfLines={1}
          strike={hecho}
          tone={hecho ? "done" : "ink"}
        >
          {item.title}
        </Txt>
        <View
          style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}
        >
          <Txt
            variant="caption"
            tone="secondary"
            numberOfLines={1}
            style={{ flexShrink: 1 }}
          >
            {dato}
          </Txt>
          {!!fecha && !hecho && (
            <View
              style={{
                paddingHorizontal: estado === "hoy" ? 6 : 0,
                borderRadius: radius.pill,
                backgroundColor:
                  estado === "hoy" ? color.primary : "transparent",
              }}
            >
              <Txt
                variant="caption"
                weight={800}
                tone={
                  estado === "hoy"
                    ? "onPrimary"
                    : fecha === "Atrasada"
                      ? "danger"
                      : "primary"
                }
                numberOfLines={1}
              >
                {fecha}
              </Txt>
            </View>
          )}
          {item.priority === "urgente" && !hecho && !passive(item) && (
            <Txt variant="caption" weight={800} tone="danger">
              Urgente
            </Txt>
          )}
        </View>
        {pasos > 0 && !hecho && (
          <View
            style={{
              height: 4,
              borderRadius: 4,
              backgroundColor: color.line,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: `${(100 * listos) / pasos}%`,
                height: "100%",
                borderRadius: 4,
                backgroundColor: tono.base,
              }}
            />
          </View>
        )}
      </View>
      {nivel > 0 && !hecho && (
        <View
          accessibilityLabel={`Carga ${nivel} de 3`}
          style={{
            flexDirection: "row",
            gap: 2,
            alignSelf: "flex-end",
            marginBottom: space.sm,
          }}
        >
          {[1, 2, 3].map((n) => (
            <View
              key={n}
              style={{
                width: 4,
                height: 4,
                borderRadius: 2,
                backgroundColor: n <= nivel ? tono.base : color.line,
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}
