import React, { useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { signOut } from "firebase/auth";
import { useApp } from "../utils/AppContext";
import { auth } from "../utils/firebase";
import { totalPoints } from "../utils/model";
import { mergeValue, recordsOf } from "../utils/syncModel";
import { Button, Field, Sheet } from "../components/ui/Common";
import { colors, s } from "../styles/globalStyles";
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
  if (settings) return <Ajustes onBack={() => setSettings(false)} />;
  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <Text style={s.title}>Tu perfil</Text>
      <View style={[s.card, { alignItems: "center", paddingVertical: 26 }]}>
        <View
          style={{
            backgroundColor: colors.primary,
            borderRadius: 38,
            width: 76,
            height: 76,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontSize: 32, fontWeight: "700" }}>
            {data.profile.name.slice(0, 1).toUpperCase() || "N"}
          </Text>
        </View>
        <Text style={s.heading}>{data.profile.name || "Tu nombre"}</Text>
        <Text style={s.small}>
          {data.profile.roles || "Un espacio para todas tus facetas"}
        </Text>
        <View style={s.wrap}>
          <Text style={[s.pill, { color: colors.primary }]}>
            Nivel {Math.floor(totalPoints(data) / 100) + 1}
          </Text>
          <Text style={[s.pill, { color: colors.primary }]}>
            {totalPoints(data)} puntos
          </Text>
        </View>
      </View>
      <Button
        title="Editar perfil"
        onPress={() => {
          setName(data.profile.name);
          setProfileBase(data.profile);
          setRoles(data.profile.roles);
          setEdit(true);
        }}
      />
      <View style={s.card}>
        <View style={s.row}>
          <Image
            source={require("../../assets/Img/Neka_Pose7.png")}
            style={{ width: 60, height: 70 }}
            resizeMode="contain"
          />
          <View style={{ flex: 1 }}>
            <Text style={s.heading}>A tu ritmo</Text>
            <Text style={s.subtitle}>
              Preferencias, avisos, respaldos y tus datos.
            </Text>
          </View>
        </View>
        <Button
          title="Abrir ajustes"
          secondary
          onPress={() => setSettings(true)}
        />
      </View>
      <View style={s.card}>
        <Text style={s.heading}>
          {user ? "Cuenta conectada" : "Modo local"}
        </Text>
        <Text style={s.text}>
          {user?.email ?? "Tus datos se guardan en este navegador o teléfono."}
        </Text>
        <Text style={s.small}>{storageStatus}</Text>
        {user ? (
          <>
            <Text style={s.small}>{cloudStatus}</Text>
            <Text style={s.small}>
              Tus cambios se guardan automáticamente. Sin conexión quedan
              pendientes en este dispositivo y se enviarán cuando vuelvas a
              conectarte.
            </Text>
            <Text style={s.small}>{pendingChanges} cambios pendientes</Text>
            <Button
              title="Reintentar conexión"
              secondary
              onPress={() => void cloud()}
            />
            {!!conflict && (
              <Button
                title="Revisar cambios simultáneos"
                onPress={() => setReview(true)}
              />
            )}
            <Button
              title="Cerrar sesión"
              secondary
              disabled={cloudBusy}
              onPress={() => {
                if (auth)
                  void signOut(auth).catch(() =>
                    setError("No se pudo cerrar la sesión."),
                  );
              }}
            />
          </>
        ) : (
          <>
            <Button
              title="Conectar mi cuenta"
              secondary
              onPress={() => setAccount(true)}
            />
            <Button
              title="Volver a la pantalla de acceso"
              secondary
              onPress={exitGuest}
            />
          </>
        )}
      </View>
      {!!error && <Text style={s.error}>{error}</Text>}
      <Sheet
        visible={edit}
        title="Editar perfil"
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
                    "Tu perfil cambió en otro dispositivo. Copia tus cambios y vuelve a abrir el perfil actualizado.",
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
        {!!error && <Text style={s.error}>{error}</Text>}
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
        title="Revisar cambios simultáneos"
        onClose={() => setReview(false)}
      >
        <Text style={s.text}>
          {conflict?.reason ?? "No quedan conflictos pendientes."}
        </Text>
        <Text style={s.small}>
          La versión de este dispositivo y la de Firebase están conservadas. La
          elección se aplica a los cambios pendientes de este dispositivo. Antes
          de resolver se guarda una copia local recuperable en Ajustes.
        </Text>
        <Text style={s.heading}>Datos que requieren revisión</Text>
        <Text selectable style={s.small}>
          {conflict?.paths.join("\n")}
        </Text>
        {conflict?.paths.map((path) => (
          <View key={path} style={s.card}>
            <Text style={s.heading}>
              {recordsOf(data)[path]?.title ??
                recordsOf(data)[path]?.name ??
                path}
            </Text>
            <Text style={s.label}>Este dispositivo</Text>
            <Text selectable style={s.small}>
              {JSON.stringify(recordsOf(data)[path] ?? "Eliminado", null, 2)}
            </Text>
            <Text style={s.label}>Firebase</Text>
            <Text selectable style={s.small}>
              {JSON.stringify(
                remoteData
                  ? (recordsOf(remoteData)[path] ?? "Eliminado")
                  : "Pendiente de cargar",
                null,
                2,
              )}
            </Text>
          </View>
        ))}
        <Button
          title="Conservar mis cambios pendientes"
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
          secondary
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
        {!!error && <Text style={s.error}>{error}</Text>}
      </Sheet>
    </ScrollView>
  );
}
