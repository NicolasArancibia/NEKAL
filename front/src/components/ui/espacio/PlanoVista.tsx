import React, { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button, EmptyState, PressableScale, Txt } from "../base";
import BarraSeleccion from "./BarraSeleccion";
import FormGrupo from "./FormGrupo";
import FormMesa from "./FormMesa";
import HojaCosa from "./HojaCosa";
import MenuCrear from "./MenuCrear";
import PlanoCerca from "./PlanoCerca";
import PlanoLejos from "./PlanoLejos";
import SelectorTiempo from "./SelectorTiempo";
import { useEspacioPrefs } from "./useEspacioPrefs";
import { color, radius, shadow, size, space } from "../../../styles/theme";
import { useApp } from "../../../utils/AppContext";
import { gruposBajo } from "../../../utils/espacio";
import { Destino, GENERAL } from "../../../utils/estructura";
import { activeItems, Group, Item, Workspace } from "../../../utils/model";

// El Plano (spec B §3.3), ahora dentro del Calendario (spec H2 §4): "tu orden".
// Es la rama de Plano que tenía el Espacio, con la misma hoja, el mismo menú de
// crear y la misma selección múltiple. `destino` y `marcadaInicial` llegan
// desde «Ver dónde está» y los avisos del borde.
export default function PlanoVista({
  destino,
  marcadaInicial,
}: {
  destino?: Destino | null;
  marcadaInicial?: string;
}) {
  const { data } = useApp();
  const prefs = useEspacioPrefs();
  const [planoDestino, setPlanoDestino] = useState<Destino | null>(
    destino ?? null,
  );
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [abierta, setAbierta] = useState<Item | null>(null);
  const [marcada, setMarcada] = useState(marcadaInicial ?? "");
  const [crear, setCrear] = useState<(Destino & { dia?: string }) | null>(null);
  const [editarMesa, setEditarMesa] = useState<Workspace | null>(null);
  const [editarGrupo, setEditarGrupo] = useState<Group | null>(null);
  const [aviso, setAviso] = useState("");
  const now = useMemo(() => Date.now(), [data]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(""), 4000);
    return () => clearTimeout(t);
  }, [aviso]);
  const existe = (d: Destino | null) =>
    !d ||
    (data.workspaces.some((w) => w.id === d.workspaceId) &&
      (!d.groupId || data.groups.some((g) => g.id === d.groupId)));
  // Si otro dispositivo borró la mesa o el grupo en que estás, vuelve arriba.
  const planoOk = existe(planoDestino);
  useEffect(() => {
    if (!planoOk) setPlanoDestino(null);
  }, [planoOk]);
  const ir = (d: Destino | null) => {
    setSeleccion([]);
    setPlanoDestino(d);
  };

  const mesaDe = (id: string) => data.workspaces.find((w) => w.id === id);
  const grupoDe = (id: string) => data.groups.find((g) => g.id === id);
  const vivas = activeItems(data);
  const vacia =
    !vivas.length && !data.groups.length && data.workspaces.length === 1;
  const lugar = planoOk ? planoDestino : null;
  const grupo = lugar && grupoDe(lugar.groupId);
  const mesa = mesaDe(lugar?.workspaceId ?? GENERAL);
  const titulo = grupo?.name ?? mesa?.name ?? "General";
  const enLugar = lugar && gruposBajo(data, lugar);
  const cantidad = lugar
    ? vivas.filter(
        (i) => i.workspaceId === lugar.workspaceId && enLugar!.has(i.groupId),
      ).length
    : vivas.length;
  const atras = !lugar
    ? null
    : grupo
      ? {
          texto: grupoDe(grupo.parentId)?.name ?? mesa?.name ?? "General",
          ir: () =>
            ir({ workspaceId: grupo.workspaceId, groupId: grupo.parentId }),
        }
      : {
          texto: lugar.workspaceId === GENERAL ? "Todo" : "General",
          ir: () => ir(null),
        };
  const entrar = (d: Destino) => {
    setSeleccion([]);
    setPlanoDestino(d);
  };
  const verDonde = (i: Item) => {
    setPlanoDestino({ workspaceId: i.workspaceId, groupId: i.groupId });
    setMarcada(i.id);
  };

  if (!prefs.listo)
    return <View style={{ flex: 1, backgroundColor: color.background }} />;
  return (
    <View style={{ flex: 1, backgroundColor: color.background }}>
      <View style={{ paddingHorizontal: space.screen, gap: space.sm }}>
        <View
          style={{
            minHeight: 24,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {atras ? (
            <PressableScale
              onPress={atras.ir}
              accessibilityRole="button"
              accessibilityLabel={`Volver a ${atras.texto}`}
              hitSlop={10}
              style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
            >
              <Ionicons name="chevron-back" size={16} color={color.primary} />
              <Txt variant="callout" weight={700} tone="primary">
                {atras.texto}
              </Txt>
            </PressableScale>
          ) : (
            <View />
          )}
          {!vacia && (
            <Button
              title="Editar"
              variant="plain"
              small
              onPress={() =>
                grupo ? setEditarGrupo(grupo) : mesa && setEditarMesa(mesa)
              }
            />
          )}
        </View>
        {!!lugar && (
          <Txt variant="title" accessibilityRole="header">
            {titulo}
          </Txt>
        )}
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
            {cantidad} {cantidad === 1 ? "cosa" : "cosas"}
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
        ) : lugar ? (
          <PlanoCerca
            key={`${lugar.workspaceId}|${lugar.groupId}`}
            destino={lugar}
            ventana={prefs.ventana}
            now={now}
            seleccion={seleccion}
            marcada={marcada}
            onAbrir={setAbierta}
            onSeleccion={setSeleccion}
            onMarcar={setMarcada}
            onEntrar={entrar}
            onCrear={setCrear}
            onEditar={setEditarGrupo}
            onAviso={setAviso}
          />
        ) : (
          <PlanoLejos
            ventana={prefs.ventana}
            now={now}
            onEntrar={entrar}
            onEditar={(z) =>
              z.tipo === "mesa"
                ? setEditarMesa(mesaDe(z.workspaceId) ?? null)
                : setEditarGrupo(grupoDe(z.groupId) ?? null)
            }
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
            onPress={() =>
              setCrear(lugar ?? { workspaceId: GENERAL, groupId: "" })
            }
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
          onVerDonde={verDonde}
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
      {editarGrupo && (
        <FormGrupo
          visible
          inicial={editarGrupo}
          destino={{
            workspaceId: editarGrupo.workspaceId,
            groupId: editarGrupo.parentId,
          }}
          rutina={!!editarGrupo.repeat}
          onClose={() => setEditarGrupo(null)}
        />
      )}
    </View>
  );
}
