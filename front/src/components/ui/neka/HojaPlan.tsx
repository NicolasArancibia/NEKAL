import { useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button, PressableScale, Sheet, Txt } from "../base";
import { color, radius, size, space } from "../../../styles/theme";
import { useApp } from "../../../utils/AppContext";
import { useNeka } from "../../../utils/NekaContext";
import { choquesDelPlan, probar } from "../../../utils/agente/plan";
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
  // Lo que el plan dejaría chocando con la agenda de ahora (maqueta H/01).
  const choques = useMemo(
    () => (plan ? choquesDelPlan(data, plan.pasos, marcados, Date.now()) : []),
    [data, plan, marcados],
  );
  const bloqueos = choques.filter((c) => c.bloquea);
  const avisos = choques.filter((c) => !c.bloquea);
  const n = marcados.filter(Boolean).length;
  const todos = n === marcados.length;
  // Con todo marcado, un choque quiere decir que la agenda cambió: se pide de nuevo.
  const cambio = bloqueos.length > 0 && todos;
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
      {avisos.map((c) => (
        <View
          key={c.clave}
          style={{
            flexDirection: "row",
            gap: space.sm,
            alignItems: "flex-start",
            padding: space.md,
            borderRadius: radius.sm,
            borderWidth: 1,
            borderColor: color.line,
            backgroundColor: color.background,
          }}
        >
          <Ionicons
            name="warning-outline"
            size={size.icon - 4}
            color={color.warning}
          />
          <Txt variant="callout" style={{ flex: 1 }}>
            Ojo: {c.descripcion}
          </Txt>
        </View>
      ))}
      {bloqueos.length > 0 && (
        <View
          accessibilityRole="alert"
          style={{
            gap: space.xs,
            padding: space.md,
            borderRadius: radius.sm,
            backgroundColor: color.dangerSoft,
          }}
        >
          <Txt variant="callout" weight={700} tone="danger">
            {cambio
              ? "La agenda cambió"
              : "Con lo que dejaste marcado queda un choque"}
          </Txt>
          {bloqueos.map((c) => (
            <Txt key={c.clave} variant="callout">
              {c.descripcion}
            </Txt>
          ))}
          {cambio && (
            <Txt variant="callout">
              Pídeselo de nuevo y Neka lo acomoda con tu agenda de ahora.
            </Txt>
          )}
        </View>
      )}
      {!!neka.error && !bloqueos.length && (
        <Txt variant="callout" tone="danger" accessibilityRole="alert">
          {neka.error}
        </Txt>
      )}
      {plan && (
        <>
          {cambio ? (
            <Button title="Pedir de nuevo" onPress={neka.repetir} />
          ) : (
            <Button
              title={`Aceptar ${n} cambio${n === 1 ? "" : "s"}`}
              disabled={!n || conError || bloqueos.length > 0}
              onPress={() => neka.aceptar(marcados)}
            />
          )}
          {!cambio && !!neka.error && !bloqueos.length && !!t.pregunta && (
            <Button
              title="Pedir de nuevo"
              variant="secondary"
              onPress={neka.repetir}
            />
          )}
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
