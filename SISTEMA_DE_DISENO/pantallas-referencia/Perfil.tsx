import React, { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { TabParamList } from "../navigation/TabNavigator";
import { useApp } from "../utils/AppContext";
import { mesYAnio } from "../utils/progreso/desde";
import { desbloqueados, paraPerfil } from "../utils/progreso/logros";
import { useProgreso } from "../utils/useProgreso";
import { useAmigos } from "../utils/AmigosContext";
import { mergeValue, recordsOf } from "../utils/syncModel";
import { LOGRO_IDS } from "../utils/model";
import { color, radius, size, space } from "../styles/theme";
import {
  Button,
  Card,
  Contador,
  Field,
  PressableScale,
  ScreenHeader,
  SectionTitle,
  Sheet,
  Txt,
} from "../components/ui/base";
import TarjetaNivel from "../components/ui/progreso/TarjetaNivel";
import GrillaLogros from "../components/ui/progreso/GrillaLogros";
import HojaLogros from "../components/ui/progreso/HojaLogros";
import FilaMesa from "../components/ui/progreso/FilaMesa";
import SeccionAmigos from "../components/ui/amigos/SeccionAmigos";
import HojaAmigos, { Pagina } from "../components/ui/amigos/HojaAmigos";
import Login from "./Login";
import Ajustes from "./Ajustes";

export default function Perfil() {
  const { data, change, conflict, remoteData, resolveConflict } = useApp();
  const [settings, setSettings] = useState(false),
    [edit, setEdit] = useState(false),
    [account, setAccount] = useState(false),
    [name, setName] = useState(""),
    [roles, setRoles] = useState(""),
    [error, setError] = useState(""),
    [review, setReview] = useState(false),
    [verLogros, setVerLogros] = useState(false),
    [hoja, setHoja] = useState<Pagina | null>(null);
  const amigos = useAmigos();
  const [profileBase, setProfileBase] = useState(data.profile);
  const route = useRoute<RouteProp<TabParamList, "Perfil">>();
  const navigation = useNavigation();
  // El aviso "Cambios sin guardar" abre Ajustes mediante este parámetro.
  useEffect(() => {
    if (route.params?.settings) {
      setSettings(true);
      navigation.setParams({ settings: undefined } as never);
    }
  }, [route.params?.settings]);
  const progreso = useProgreso();
  const logrados = desbloqueados(data, progreso.hechos);
  const abrirEditar = () => {
    setName(data.profile.name);
    setProfileBase(data.profile);
    setRoles(data.profile.roles);
    setEdit(true);
  };
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: color.background }}
      contentContainerStyle={{
        padding: space.screen,
        paddingBottom: space.xxxl,
        gap: space.lg,
        width: "100%",
        maxWidth: 960,
        alignSelf: "center",
      }}
    >
      <ScreenHeader
        title="Perfil"
        right={
          <View style={{ flexDirection: "row" }}>
            {amigos.activo && (
              <PressableScale
                onPress={() => setHoja({ tipo: "amigos" })}
                accessibilityRole="button"
                accessibilityLabel="Amigos"
                style={{
                  width: size.minTouch,
                  height: size.minTouch,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="people-outline"
                  size={size.icon + 2}
                  color={color.primary}
                />
                {amigos.solicitudes > 0 && (
                  <Contador
                    n={amigos.solicitudes}
                    style={{ position: "absolute", top: 2, right: 0 }}
                  />
                )}
              </PressableScale>
            )}
            <PressableScale
              onPress={() => setSettings(true)}
              accessibilityRole="button"
              accessibilityLabel="Ajustes"
              style={{
                width: size.minTouch,
                height: size.minTouch,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name="settings-outline"
                size={size.icon + 2}
                color={color.primary}
              />
            </PressableScale>
          </View>
        }
      />
      <Card style={{ alignItems: "center", paddingVertical: space.xxl }}>
        <PressableScale
          onPress={abrirEditar}
          accessibilityRole="button"
          accessibilityLabel="Editar perfil"
          style={{
            position: "absolute",
            top: space.xs,
            right: space.xs,
            width: size.minTouch,
            height: size.minTouch,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name="create-outline"
            size={size.icon}
            color={color.primary}
          />
        </PressableScale>
        <View
          style={{
            backgroundColor: color.primary,
            borderRadius: radius.pill,
            width: 76,
            height: 76,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Txt variant="title" tone="onPrimary">
            {data.profile.name.slice(0, 1).toUpperCase() || "N"}
          </Txt>
        </View>
        <Txt variant="headline" numberOfLines={1}>
          {data.profile.name || "Sin nombre"}
        </Txt>
        {!!data.profile.roles && (
          <Txt variant="callout" tone="secondary" align="center">
            {data.profile.roles}
          </Txt>
        )}
        <Txt variant="caption" tone="secondary">
          En Nekal desde {mesYAnio(progreso.desde.dia1)}
        </Txt>
      </Card>
      <SeccionAmigos onAbrir={setHoja} onCrearCuenta={() => setAccount(true)} />
      <TarjetaNivel nivel={progreso.nivel} puntos={progreso.puntos} />
      <SectionTitle
        title="Logros"
        detail={`${logrados.length} de ${LOGRO_IDS.length}`}
      />
      <GrillaLogros
        logros={paraPerfil(data, progreso.hechos, Date.now())}
        hechos={progreso.hechos}
        onVerTodos={() => setVerLogros(true)}
      />
      <SectionTitle title="Tus mesas" detail="cómo vas en cada una" />
      <Card style={{ gap: space.sm }}>
        {progreso.mesas.length ? (
          progreso.mesas.map((r, k) => {
            const mesa = data.workspaces.find((w) => w.id === r.mesaId)!;
            return (
              <View key={r.mesaId} style={{ gap: space.sm }}>
                {k > 0 && (
                  <View style={{ height: 1, backgroundColor: color.line }} />
                )}
                <FilaMesa mesa={mesa} rating={r} hoy={progreso.hoy} />
              </View>
            );
          })
        ) : (
          <Txt variant="callout" tone="secondary">
            Crea una mesa en el Espacio para ver cómo vas en cada una.
          </Txt>
        )}
      </Card>
      <HojaAmigos
        pagina={hoja}
        onPagina={setHoja}
        onClose={() => setHoja(null)}
        onEditarPerfil={() => {
          setHoja(null);
          // En el iPhone un Modal no se presenta mientras otro se está yendo.
          setTimeout(abrirEditar, 500);
        }}
      />
      <HojaLogros
        visible={verLogros}
        onClose={() => setVerLogros(false)}
        desbloqueados={logrados}
        hechos={progreso.hechos}
      />
      {settings && (
        <Ajustes
          visible
          onClose={() => setSettings(false)}
          onConectar={() => {
            setSettings(false);
            setAccount(true);
          }}
          onRevisar={() => {
            setSettings(false);
            setReview(true);
          }}
        />
      )}
      <Sheet
        visible={edit}
        title="Editar perfil"
        size="auto"
        onClose={() => setEdit(false)}
      >
        <Field label="Tu nombre" value={name} onChange={setName} />
        <Field
          label="Tus roles"
          value={roles}
          onChange={setRoles}
          placeholder="Estudiante, diseñadora, emprendedor…"
        />
        <Button
          title="Guardar perfil"
          onPress={() => {
            if (!name.trim()) {
              setError("Escribe tu nombre.");
              return;
            }
            try {
              change((d) => {
                const merged = mergeValue(
                  profileBase,
                  {
                    name: name.trim().slice(0, 80),
                    roles: roles.trim().slice(0, 200),
                  },
                  d.profile,
                );
                if (merged.conflict)
                  throw new Error(
                    "Tu perfil cambió en otro dispositivo. Copia tus cambios y vuelve a abrir el perfil.",
                  );
                return {
                  ...d,
                  profile: merged.value,
                };
              });
              setEdit(false);
              setError("");
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        />
        {!!error && (
          <Txt tone="danger" accessibilityRole="alert">
            {error}
          </Txt>
        )}
      </Sheet>
      <Sheet
        visible={account}
        title="Tu cuenta Nekal"
        onClose={() => setAccount(false)}
      >
        <Login />
      </Sheet>
      <Sheet
        visible={review}
        title="Cambios en conflicto"
        onClose={() => setReview(false)}
      >
        <Txt>{conflict?.reason ?? "No quedan conflictos pendientes."}</Txt>
        <Txt variant="callout" tone="secondary">
          Se guardan las dos versiones. Lo que elijas se aplica a los cambios
          pendientes de este dispositivo, y antes queda una copia en Ajustes.
        </Txt>
        {conflict?.paths.map((path) => (
          <Card key={path}>
            <Txt variant="headline">
              {recordsOf(data)[path]?.title ??
                recordsOf(data)[path]?.name ??
                path}
            </Txt>
            <Txt variant="callout" weight={600}>
              Este dispositivo
            </Txt>
            <Txt selectable variant="caption" tone="secondary">
              {JSON.stringify(recordsOf(data)[path] ?? "Eliminado", null, 2)}
            </Txt>
            <Txt variant="callout" weight={600}>
              Firebase
            </Txt>
            <Txt selectable variant="caption" tone="secondary">
              {JSON.stringify(
                remoteData
                  ? (recordsOf(remoteData)[path] ?? "Eliminado")
                  : "Pendiente de cargar",
                null,
                2,
              )}
            </Txt>
          </Card>
        ))}
        <Button
          title="Conservar mis cambios"
          disabled={!conflict}
          onPress={async () => {
            try {
              await resolveConflict("local");
              setReview(false);
              setError("");
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        />
        <Button
          title="Usar la versión de Firebase"
          variant="secondary"
          disabled={!conflict}
          onPress={async () => {
            try {
              await resolveConflict("remote");
              setReview(false);
              setError("");
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        />
        {!!error && (
          <Txt tone="danger" accessibilityRole="alert">
            {error}
          </Txt>
        )}
      </Sheet>
    </ScrollView>
  );
}
