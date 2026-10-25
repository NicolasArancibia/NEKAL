import { useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button, PressableScale, Sheet, Txt } from "../base";
import { color, size, space } from "../../../styles/theme";
import { useApp } from "../../../utils/AppContext";
import { useNeka } from "../../../utils/NekaContext";
import { probar } from "../../../utils/agente/plan";
import { bloquesDelDia } from "../../../utils/agente/dia";
import DiaPlan from "./DiaPlan";

// La hoja de Neka, igual desde el chat o desde otra pantalla (spec D §5.2): lo
// que dijiste, la respuesta, tu día dibujado y la lista de cambios, siempre
// visible y todo marcado. Sin plan, solo la pregunta y la respuesta.
export default function HojaPlan({ onAbrirChat }: { onAbrirChat: () => void }) {
  const neka = useNeka();
  const { data } = useApp();
  const t = neka.turno;
  const plan = t?.plan && neka.pendienteId === t.mensajeId ? t.plan : null;
  const [marcados, setMarcados] = useState<boolean[]>([]);
  useEffect(() => {
    setMarcados(plan ? plan.pasos.map(() => true) : []);
  }, [t?.mensajeId]);
  const errores = useMemo(
    () => (plan ? probar(data, plan.pasos, marcados, Date.now()).errores : []),
    [data, plan, marcados],
  );
  const dia = useMemo(
    () => (plan ? bloquesDelDia(data, plan, marcados) : null),
    [data, plan, marcados],
  );
  const n = marcados.filter(Boolean).length;
  const conError = errores.some((e, i) => e && marcados[i]);
  if (!t) return null;
  return (
    <Sheet
      visible={neka.hoja}
      title={plan ? "Plan de Neka" : "Neka"}
      size={plan ? "large" : "auto"}
      onClose={neka.cerrarHoja}
    >
      {!!t.pregunta && (
        <View
          style={{ flexDirection: "row", gap: space.sm, alignItems: "center" }}
        >
          <Ionicons
            name={t.audio ? "mic-outline" : "chatbubble-outline"}
            size={size.icon - 4}
            color={color.inkSecondary}
          />
          <Txt tone="secondary" style={{ flex: 1, fontStyle: "italic" }}>
            «{t.pregunta}»
          </Txt>
        </View>
      )}
      <View
        style={{ flexDirection: "row", gap: space.sm, alignItems: "center" }}
      >
        <Txt weight={600} style={{ flex: 1 }}>
          {t.respuesta}
        </Txt>
        <PressableScale
          accessibilityLabel="Leer en voz alta"
          onPress={() => neka.leer(t.respuesta)}
          style={{
            width: size.minTouch,
            height: size.minTouch,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name="volume-medium-outline"
            size={size.icon}
            color={color.primary}
          />
        </PressableScale>
      </View>
      {dia && (
        <DiaPlan desde={dia.desde} hasta={dia.hasta} bloques={dia.bloques} />
      )}
      {plan?.pasos.map((p, i) => (
        <Pressable
          key={i}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: !!marcados[i] }}
          accessibilityLabel={p.texto}
          onPress={() =>
            setMarcados((m) => m.map((x, j) => (j === i ? !x : x)))
          }
          style={{
            flexDirection: "row",
            gap: space.sm,
            alignItems: "center",
            minHeight: size.minTouch,
            borderTopWidth: i ? 1 : 0,
            borderTopColor: color.line,
          }}
        >
          <Ionicons
            name={marcados[i] ? "checkbox-outline" : "square-outline"}
            size={size.icon}
            color={marcados[i] ? color.primary : color.lineStrong}
          />
          <View style={{ flex: 1, gap: 2 }}>
            <Txt weight={600} tone={marcados[i] ? "ink" : "secondary"}>
              {p.texto}
              {p.eraFija ? " · era fija" : ""}
            </Txt>
            {!!errores[i] && (
              <Txt variant="caption" tone="danger">
                {errores[i]}
              </Txt>
            )}
          </View>
        </Pressable>
      ))}
      {!!neka.error && (
        <Txt variant="callout" tone="danger" accessibilityRole="alert">
          {neka.error}
        </Txt>
      )}
      {plan && (
        <>
          <Button
            title={`Aceptar ${n} cambio${n === 1 ? "" : "s"}`}
            disabled={!n || conError}
            onPress={() => neka.aceptar(marcados)}
          />
          <Button
            title="Descartar"
            variant="secondary"
            onPress={neka.descartar}
          />
        </>
      )}
      {t.origen === "rapido" && (
        <Button
          title="Abrir chat"
          variant="plain"
          onPress={() => {
            neka.cerrarHoja();
            onAbrirChat();
          }}
        />
      )}
    </Sheet>
  );
}
