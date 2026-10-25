import React, { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { TabParamList } from "../navigation/TabNavigator";
import { useApp } from "../utils/AppContext";
import { auth } from "../utils/firebase";
import { totalPoints } from "../utils/model";
import { nivelDe } from "../utils/progreso/nivel";
import { mergeValue, recordsOf } from "../utils/syncModel";
import { color, radius, size, space } from "../styles/theme";
import {
  Button,
  Card,
  Field,
  PressableScale,
  ScreenHeader,
  Sheet,
  Tag,
  Txt,
} from "../components/ui/base";
import Login from "./Login";
import Ajustes from "./Ajustes";

export default function Perfil() {
  const {
    data,
    change,
    user,
    storageStatus,
    cloud,
    cloudBusy,
    cloudStatus,
    exitGuest,
    pendingChanges,
    conflict,
    remoteData,
    resolveConflict,
  } = useApp();
  const [settings, setSettings] = useState(false),
    [edit, setEdit] = useState(false),
    [account, setAccount] = useState(false),
    [name, setName] = useState(""),
    [roles, setRoles] = useState(""),
    [error, setError] = useState(""),
    [review, setReview] = useState(false);
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
  const points = totalPoints(data);
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
      <ScreenHeader title="Perfil" />
      <Card style={{ alignItems: "center", paddingVertical: space.xxl }}>
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
        <View style={{ flexDirection: "row", gap: space.sm }}>
          <Tag text={`Nivel ${nivelDe(points).nivel}`} tone="primary" />
          <Tag text={`${points} pts`} tone="primary" />
        </View>
      </Card>
      <Button
        title="Editar perfil"
        variant="secondary"
        onPress={() => {
          setName(data.profile.name);
          setProfileBase(data.profile);
          setRoles(data.profile.roles);
          setEdit(true);
        }}
      />
      <Card
        onPress={() => setSettings(true)}
        accessibilityLabel="Abrir ajustes"
      >
        <View
          style={{ flexDirection: "row", alignItems: "center", gap: space.md }}
        >
          <Ionicons
            name="settings-outline"
            size={size.icon}
            color={color.primary}
          />
          <Txt weight={600} style={{ flex: 1 }}>
            Ajustes
          </Txt>
          <Ionicons
            name="chevron-forward-outline"
            size={size.icon}
            color={color.inkSecondary}
          />
        </View>
      </Card>
      <View style={{ gap: space.sm }}>
        <Txt variant="headline">Cuenta</Txt>
        <Card>
          <Txt weight={600}>
            {user ? (user.email ?? "Cuenta") : "Modo invitado"}
          </Txt>
          <Txt variant="callout" tone="secondary">
            {user
              ? `${cloudStatus} · ${pendingChanges} ${pendingChanges === 1 ? "cambio pendiente" : "cambios pendientes"}`
              : "Tus datos quedan solo en este dispositivo."}
          </Txt>
          {!!storageStatus && (
            <Txt variant="caption" tone="secondary">
              {storageStatus}
            </Txt>
          )}
          {user ? (
            <>
              <Button
                title="Reintentar conexión"
                variant="secondary"
                onPress={() => void cloud()}
              />
              {!!conflict && (
                <Button
                  title="Revisar cambios en conflicto"
                  onPress={() => setReview(true)}
                />
              )}
              <Button
                title="Cerrar sesión"
                variant="plain"
                disabled={cloudBusy}
                onPress={() => {
                  if (auth)
                    void signOut(auth).catch(() =>
                      setError(
                        "No se pudo cerrar la sesión. Revisa tu conexión y reintenta.",
                      ),
                    );
                }}
              />
            </>
          ) : (
            <>
              <Button
                title="Conectar mi cuenta"
                variant="secondary"
                onPress={() => setAccount(true)}
              />
              <Button
                title="Volver al inicio"
                variant="plain"
                onPress={exitGuest}
              />
            </>
          )}
        </Card>
      </View>
      {!!error && (
        <Txt tone="danger" accessibilityRole="alert">
          {error}
        </Txt>
      )}
      {settings && <Ajustes visible onClose={() => setSettings(false)} />}
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
