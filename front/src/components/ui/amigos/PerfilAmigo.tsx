import { useState } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { color, size, space } from "../../../styles/theme";
import { FilaAmigo } from "../../../utils/amigos/amistades";
import { areasOrdenadas } from "../../../utils/amigos/tarjeta";
import { LOGRO_IDS } from "../../../utils/model";
import { mesYAnio } from "../../../utils/progreso/desde";
import { CATALOGO, miles } from "../../../utils/progreso/logros";
import { nivelDe } from "../../../utils/progreso/nivel";
import {
  Button,
  Card,
  PressableScale,
  ProgressBar,
  SectionTitle,
  Txt,
} from "../base";
import Medalla from "../progreso/Medalla";
import FilaArea from "./FilaArea";
import Inicial from "./Inicial";

const VISIBLES = 8;

// El perfil en corto de un amigo (spec F §6.2, maqueta 03): sus logros
// conseguidos y sus áreas, nunca los nombres de sus mesas.
export default function PerfilAmigo({
  fila,
  onEliminar,
}: {
  fila: FilaAmigo;
  onEliminar: () => Promise<void>;
}) {
  const [todos, setTodos] = useState(false);
  const t = fila.tarjeta;
  const logros = t ? (todos ? t.logros : t.logros.slice(0, VISIBLES)) : [];
  const areas = t ? areasOrdenadas(t.areas) : [];
  return (
    <>
      <Card style={{ alignItems: "center", gap: space.sm }}>
        <Inicial nombre={fila.nombre} size={64} />
        {!t ? (
          <Txt variant="callout" tone="secondary" align="center">
            Su perfil aparece cuando abra Nekal.
          </Txt>
        ) : (
          <>
            {!!t.roles && (
              <Txt variant="callout" tone="secondary" align="center">
                {t.roles}
              </Txt>
            )}
            <Txt variant="caption" tone="secondary">
              En Nekal desde {mesYAnio(t.desde)}
            </Txt>
          </>
        )}
      </Card>
      {t && (
        <>
          <Card variant="featured">
            <View
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                justifyContent: "space-between",
              }}
            >
              <Txt variant="title">Nivel {t.nivel}</Txt>
              <Txt variant="callout" tone="secondary">
                {miles(t.puntos)} pts
              </Txt>
            </View>
            <ProgressBar
              value={nivelDe(t.puntos).avance}
              riel="blanco"
              accessibilityLabel={`Avance de ${fila.nombre} al nivel ${t.nivel + 1}`}
            />
          </Card>
          <SectionTitle
            title="Logros"
            detail={`${t.logros.length} de ${LOGRO_IDS.length}`}
          />
          {!!logros.length && (
            <Card>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  rowGap: space.lg,
                }}
              >
                {logros.map((id) => {
                  const logro = CATALOGO.find((l) => l.id === id)!;
                  return (
                    <View
                      key={id}
                      accessible
                      accessibilityLabel={logro.nombre}
                      style={{
                        width: "25%",
                        alignItems: "center",
                        gap: space.xs,
                      }}
                    >
                      <Medalla id={id} logrado />
                      <Txt
                        variant="caption"
                        weight={600}
                        align="center"
                        numberOfLines={2}
                      >
                        {logro.corto}
                      </Txt>
                    </View>
                  );
                })}
              </View>
              {!todos && t.logros.length > VISIBLES && (
                <>
                  <View style={{ height: 1, backgroundColor: color.line }} />
                  <PressableScale
                    onPress={() => setTodos(true)}
                    accessibilityRole="button"
                    accessibilityLabel={`Ver sus ${t.logros.length} logros`}
                    style={{
                      minHeight: size.minTouch,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: space.xs,
                      marginVertical: -space.sm,
                    }}
                  >
                    <Txt variant="callout" weight={700} tone="primary">
                      Ver sus {t.logros.length} logros
                    </Txt>
                    <Ionicons
                      name="chevron-forward-outline"
                      size={size.icon - 6}
                      color={color.primary}
                    />
                  </PressableScale>
                </>
              )}
            </Card>
          )}
          {!!areas.length && (
            <>
              <SectionTitle title="Sus áreas" detail="cómo va en cada una" />
              <Card style={{ gap: 0 }}>
                {areas.map((a, k) => (
                  <View key={a.area}>
                    {k > 0 && (
                      <View
                        style={{ height: 1, backgroundColor: color.line }}
                      />
                    )}
                    <FilaArea area={a.area} valor={a.valor} mesas={a.mesas} />
                  </View>
                ))}
              </Card>
            </>
          )}
        </>
      )}
      <Eliminar nombre={fila.nombre} onEliminar={onEliminar} />
    </>
  );
}

// «Eliminar amigo» se confirma en la misma hoja, sin ventana encima.
function Eliminar({
  nombre,
  onEliminar,
}: {
  nombre: string;
  onEliminar: () => Promise<void>;
}) {
  const [confirmar, setConfirmar] = useState(false),
    [ocupado, setOcupado] = useState(false),
    [error, setError] = useState("");
  if (!confirmar)
    return (
      <PressableScale
        onPress={() => setConfirmar(true)}
        accessibilityRole="button"
        accessibilityLabel="Eliminar amigo"
        style={{
          minHeight: 46,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Txt variant="callout" weight={700} tone="danger">
          Eliminar amigo
        </Txt>
      </PressableScale>
    );
  return (
    <Card style={{ backgroundColor: color.dangerSoft, gap: space.md }}>
      <Txt variant="headline" accessibilityRole="header">
        ¿Eliminar a {nombre}?
      </Txt>
      <Txt variant="callout" tone="secondary">
        Ya no verán sus perfiles. Para volver a ser amigos, uno tiene que enviar
        otra solicitud.
      </Txt>
      <View style={{ flexDirection: "row", gap: space.sm }}>
        <View style={{ flex: 1 }}>
          <Button
            title="Eliminar"
            variant="danger"
            small
            disabled={ocupado}
            onPress={async () => {
              setOcupado(true);
              setError("");
              try {
                await onEliminar();
              } catch (e) {
                setError((e as Error).message);
                setOcupado(false);
              }
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            title="Cancelar"
            variant="secondary"
            small
            disabled={ocupado}
            onPress={() => setConfirmar(false)}
          />
        </View>
      </View>
      {!!error && (
        <Txt variant="callout" tone="danger" accessibilityRole="alert">
          {error}
        </Txt>
      )}
    </Card>
  );
}
