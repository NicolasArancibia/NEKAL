import React, { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { TabParamList } from "../navigation/TabNavigator";
import {
  EmptyState,
  PressableScale,
  ScreenHeader,
  Txt,
} from "../components/ui/base";
import {
  BarraSeleccion,
  FormMesa,
  HojaCosa,
  MenuCrear,
  SelectorTiempo,
  useEspacioPrefs,
} from "../components/ui/espacio";
import TiempoVista from "../components/ui/espacio/TiempoVista";
import { color, radius, shadow, size, space } from "../styles/theme";
import { useApp } from "../utils/AppContext";
import { Destino, GENERAL } from "../utils/estructura";
import { activeItems, Item, Workspace } from "../utils/model";

// El Espacio (spec H2 §4): una sola vista, el círculo del tiempo. El Plano
// vive ahora en el Calendario; «Ver dónde está» lo abre ahí.
export default function EspacioTrabajo() {
  const { data } = useApp();
  const prefs = useEspacioPrefs();
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [abierta, setAbierta] = useState<Item | null>(null);
  const [marcada, setMarcada] = useState("");
  const [crear, setCrear] = useState<(Destino & { dia?: string }) | null>(null);
  const [editarMesa, setEditarMesa] = useState<Workspace | null>(null);
  const [aviso, setAviso] = useState("");
  const [cuenta, setCuenta] = useState(0);
  const now = useMemo(() => Date.now(), [data]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(""), 4000);
    return () => clearTimeout(t);
  }, [aviso]);

  const vacia =
    !activeItems(data).length &&
    !data.groups.length &&
    data.workspaces.length === 1;
  const verPlano = (destino: Destino, marcadaId?: string) =>
    navigation.navigate("Calendario", {
      modo: "plano",
      destino,
      marcada: marcadaId,
    });

  if (!prefs.listo)
    return <View style={{ flex: 1, backgroundColor: color.background }} />;
  return (
    <View style={{ flex: 1, backgroundColor: color.background }}>
      <View
        style={{
          paddingHorizontal: space.screen,
          paddingTop: space.screen,
          gap: space.sm,
        }}
      >
        <ScreenHeader title="Espacio" />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: space.sm,
          }}
        >
          <SelectorTiempo ventana={prefs.ventana} onCambio={prefs.setVentana} />
          <Txt variant="caption" tone="secondary">
            {cuenta} {cuenta === 1 ? "cosa" : "cosas"}
          </Txt>
        </View>
      </View>

      <View style={{ flex: 1, marginTop: space.sm }}>
        {vacia ? (
          <EmptyState
            pose={3}
            text="Crea tu primera cosa: una tarea, una nota o una mesa para ordenar lo tuyo."
            action={{
              label: "Crear",
              onPress: () => setCrear({ workspaceId: GENERAL, groupId: "" }),
            }}
          />
        ) : (
          <TiempoVista
            ventana={prefs.ventana}
            now={now}
            seleccion={seleccion}
            marcada={marcada}
            onAbrir={setAbierta}
            onSeleccion={setSeleccion}
            onMarcar={setMarcada}
            onCrear={setCrear}
            onVentana={prefs.setVentana}
            onEditarMesa={setEditarMesa}
            onEntrar={(d) => verPlano(d)}
            onAviso={setAviso}
            onCuenta={setCuenta}
          />
        )}
      </View>

      {!!aviso && (
        <View
          accessibilityLiveRegion="polite"
          style={{
            position: "absolute",
            left: space.screen,
            right: space.screen,
            bottom: seleccion.length ? 150 : 88,
            padding: space.md,
            borderRadius: radius.sm,
            backgroundColor: color.surface,
            boxShadow: shadow.card,
          }}
        >
          <Txt variant="callout">{aviso}</Txt>
        </View>
      )}
      {seleccion.length > 0 ? (
        <View
          style={{
            position: "absolute",
            left: space.screen,
            right: space.screen,
            bottom: space.lg,
          }}
        >
          <BarraSeleccion ids={seleccion} onListo={() => setSeleccion([])} />
        </View>
      ) : (
        !vacia && (
          <PressableScale
            onPress={() => setCrear({ workspaceId: GENERAL, groupId: "" })}
            accessibilityRole="button"
            accessibilityLabel="Crear"
            style={{
              position: "absolute",
              right: space.screen,
              bottom: space.lg,
              width: 56,
              height: 56,
              borderRadius: radius.pill,
              backgroundColor: color.primary,
              alignItems: "center",
              justifyContent: "center",
              boxShadow: shadow.raised,
            }}
          >
            <Ionicons name="add" size={size.icon + 6} color={color.onPrimary} />
          </PressableScale>
        )
      )}

      {abierta && (
        <HojaCosa
          item={abierta}
          onClose={() => setAbierta(null)}
          onVerDonde={(i) =>
            verPlano({ workspaceId: i.workspaceId, groupId: i.groupId }, i.id)
          }
        />
      )}
      {crear && (
        <MenuCrear visible destino={crear} onClose={() => setCrear(null)} />
      )}
      {editarMesa && (
        <FormMesa
          visible
          inicial={editarMesa}
          onClose={() => setEditarMesa(null)}
        />
      )}
    </View>
  );
}
