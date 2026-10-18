import React, { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Button,
  EmptyState,
  PressableScale,
  ScreenHeader,
  Txt,
} from "../components/ui/base";
import {
  BarraSeleccion,
  FormGrupo,
  FormMesa,
  HojaCosa,
  MenuCrear,
  SelectorTiempo,
  useEspacioPrefs,
  VistaSelector,
} from "../components/ui/espacio";
import PlanoCerca from "../components/ui/espacio/PlanoCerca";
import PlanoLejos from "../components/ui/espacio/PlanoLejos";
import MesasVista from "../components/ui/espacio/MesasVista";
import TiempoVista from "../components/ui/espacio/TiempoVista";
import { color, radius, shadow, size, space } from "../styles/theme";
import { useApp } from "../utils/AppContext";
import type { Foco } from "../utils/acomodo/mesas";
import { gruposBajo, rutaDe } from "../utils/espacio";
import { Destino, GENERAL } from "../utils/estructura";
import { activeItems, Group, Item, Workspace } from "../utils/model";

// El Espacio (spec B §3): tres vistas de los mismos datos, con la misma hoja,
// el mismo menú de crear y la misma selección múltiple.
export default function EspacioTrabajo() {
  const { data } = useApp();
  const prefs = useEspacioPrefs();
  const [planoDestino, setPlanoDestino] = useState<Destino | null>(null);
  const [foco, setFoco] = useState<Foco>({ workspaceId: GENERAL, ruta: [] });
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [abierta, setAbierta] = useState<Item | null>(null);
  const [marcada, setMarcada] = useState("");
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
  // Dónde estás: en Plano, el lugar abierto; en Mesas, el piso en foco.
  // `null` = arriba (todo General).
  const focoLugar: Destino | null =
    foco.ruta.length || foco.workspaceId !== GENERAL
      ? { workspaceId: foco.workspaceId, groupId: foco.ruta.at(-1) ?? "" }
      : null;
  const existe = (d: Destino | null) =>
    !d ||
    (data.workspaces.some((w) => w.id === d.workspaceId) &&
      (!d.groupId || data.groups.some((g) => g.id === d.groupId)));
  // Si otro dispositivo borró la mesa o el grupo en que estás, vuelve arriba.
  const planoOk = existe(planoDestino),
    focoOk = existe(focoLugar);
  useEffect(() => {
    if (!planoOk) setPlanoDestino(null);
    if (!focoOk) setFoco({ workspaceId: GENERAL, ruta: [] });
  }, [planoOk, focoOk]);
  const ir = (d: Destino | null) => {
    setSeleccion([]);
    if (prefs.vista === "mesas")
      setFoco(
        d
          ? {
              workspaceId: d.workspaceId,
              ruta: d.groupId ? rutaDe(data, d.groupId).map((g) => g.id) : [],
            }
          : { workspaceId: GENERAL, ruta: [] },
      );
    else setPlanoDestino(d);
  };

  const mesaDe = (id: string) => data.workspaces.find((w) => w.id === id);
  const grupoDe = (id: string) => data.groups.find((g) => g.id === id);
  const vivas = activeItems(data);
  const vacia =
    !vivas.length && !data.groups.length && data.workspaces.length === 1;
  const lugar =
    prefs.vista === "plano" && planoOk
      ? planoDestino
      : prefs.vista === "mesas" && focoOk
        ? focoLugar
        : null;
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
    prefs.setVista("plano");
    setPlanoDestino({ workspaceId: i.workspaceId, groupId: i.groupId });
    setMarcada(i.id);
  };

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
        <ScreenHeader
          title={titulo}
          right={
            <VistaSelector
              vista={prefs.vista}
              onCambio={(v) => {
                prefs.setVista(v);
                setSeleccion([]);
                setMarcada("");
                if (v === "plano") setPlanoDestino(null);
              }}
            />
          }
        />
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
        ) : prefs.vista === "plano" ? (
          lugar ? (
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
          )
        ) : prefs.vista === "tiempo" ? (
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
            onEntrar={(d) => {
              prefs.setVista("plano");
              entrar(d);
            }}
            onAviso={setAviso}
          />
        ) : (
          <MesasVista
            foco={foco}
            ventana={prefs.ventana}
            now={now}
            seleccion={seleccion}
            marcada={marcada}
            onFoco={(f) => {
              setSeleccion([]);
              setFoco(f);
            }}
            onAbrir={setAbierta}
            onSeleccion={setSeleccion}
            onMarcar={setMarcada}
            onEditarMesa={setEditarMesa}
            onEditarGrupo={setEditarGrupo}
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
