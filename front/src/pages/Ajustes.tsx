import React, { useEffect, useState } from "react";
import { Platform, Share, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useApp } from "../utils/AppContext";
import { AppData, localDay, restoreItem } from "../utils/model";
import { readBackup } from "../utils/storage";
import { requestReminders } from "../utils/notifications";
import { space } from "../styles/theme";
import {
  Button,
  Card,
  Disclosure,
  Field,
  Sheet,
  Toggle,
  Txt,
} from "../components/ui/base";

type Where = "neka" | "jornada" | "backup" | "json" | "trash";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: space.sm }}>
      <Txt variant="headline">{title}</Txt>
      <Card>{children}</Card>
    </View>
  );
}

// Ajustes en un panel; las ventanas internas de V1 pasaron a desplegables para
// no anidar paneles.
export default function Ajustes({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const {
    data,
    change,
    error,
    retry,
    clearError,
    hasRecovery,
    replaceData,
    restorePrevious,
  } = useApp();
  const [json, setJson] = useState(""),
    [showJson, setShowJson] = useState(false),
    [confirmRecovery, setConfirmRecovery] = useState(false);
  const [notice, setNotice] = useState<{ at: Where; text: string } | null>(
      null,
    ),
    [imported, setImported] = useState<AppData | null>(null),
    [busy, setBusy] = useState(false);
  const [dayStart, setDayStart] = useState(String(data.preferences.dayStart)),
    [dayEnd, setDayEnd] = useState(String(data.preferences.dayEnd)),
    [quietStart, setQuietStart] = useState(String(data.preferences.quietStart)),
    [quietEnd, setQuietEnd] = useState(String(data.preferences.quietEnd));
  const trashed = data.items.filter((i) => i.deletedAt);
  const say = (at: Where, text: string) => setNotice({ at, text });
  // El mensaje aparece junto a la acción que lo produjo.
  const note = (at: Where) =>
    notice?.at === at ? (
      <Txt tone="primary" weight={600} accessibilityRole="alert">
        {notice.text}
      </Txt>
    ) : null;
  // Tras importar o recuperar, los campos muestran los horarios nuevos.
  const p = data.preferences;
  useEffect(() => {
    setDayStart(String(p.dayStart));
    setDayEnd(String(p.dayEnd));
    setQuietStart(String(p.quietStart));
    setQuietEnd(String(p.quietEnd));
  }, [p.dayStart, p.dayEnd, p.quietStart, p.quietEnd]);
  const pref = (patch: Partial<AppData["preferences"]>) =>
    change((d) => ({ ...d, preferences: { ...d.preferences, ...patch } }));
  const exportBackup = async () => {
    try {
      const text = JSON.stringify(data, null, 2),
        name = `nekal-${localDay()}.json`;
      if (Platform.OS === "web") {
        const url = URL.createObjectURL(
          new Blob([text], { type: "application/json" }),
        );
        const link = document.createElement("a");
        link.href = url;
        link.download = name;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        const path = FileSystem.cacheDirectory + name;
        await FileSystem.writeAsStringAsync(path, text);
        await Share.share({ url: path });
      }
      say("backup", "Respaldo listo. Guárdalo en un lugar privado.");
    } catch {
      say("backup", "No se pudo exportar el respaldo. Inténtalo de nuevo.");
    }
  };
  const importBackup = async () => {
    try {
      setBusy(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const a = result.assets[0];
      if ((a.size ?? 0) > 10000000)
        throw new Error("El respaldo supera 10 MB.");
      const text =
        Platform.OS === "web"
          ? await (await fetch(a.uri)).text()
          : await FileSystem.readAsStringAsync(a.uri);
      setImported(readBackup(text));
      say("backup", "Revisa el respaldo antes de reemplazar tus datos.");
    } catch (e) {
      say("backup", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet
      visible={visible}
      title="Ajustes"
      onClose={() => {
        setImported(null);
        setNotice(null);
        onClose();
      }}
    >
      {!!error && (
        <Card>
          <Txt tone="danger">{error}</Txt>
          <Button
            title="Reintentar guardado"
            onPress={() => {
              clearError();
              retry();
            }}
          />
        </Card>
      )}
      <Section title="Neka">
        <Toggle
          label="Avisos suaves"
          value={data.preferences.softAlerts}
          onChange={(softAlerts) => pref({ softAlerts })}
          detail="Avisos de choques dentro de la app, sin sonido."
        />
        <Toggle
          label="Recordatorios del teléfono"
          value={data.preferences.notifications}
          onChange={async (enabled) => {
            try {
              if (enabled) await requestReminders();
              pref({ notifications: enabled });
              say(
                "neka",
                enabled
                  ? "Recordatorios activados, 10 minutos antes."
                  : "Recordatorios desactivados.",
              );
            } catch (e) {
              say("neka", (e as Error).message);
            }
          }}
          detail={
            Platform.OS === "web"
              ? "Actívalos desde Expo Go en tu iPhone."
              : "10 minutos antes, respetando las horas de silencio."
          }
        />
        <Txt variant="caption" tone="secondary">
          Neka siempre te pregunta antes de mover algo.
        </Txt>
        {note("neka")}
      </Section>
      <Section title="Jornada">
        <Toggle
          label="Horas de silencio"
          value={data.preferences.quiet}
          onChange={(quiet) => pref({ quiet })}
        />
        <View style={{ flexDirection: "row", gap: space.md }}>
          <View style={{ flex: 1 }}>
            <Field
              label="Silencio desde"
              value={quietStart}
              onChange={setQuietStart}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="Silencio hasta"
              value={quietEnd}
              onChange={setQuietEnd}
              keyboardType="numeric"
            />
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: space.md }}>
          <View style={{ flex: 1 }}>
            <Field
              label="Jornada desde"
              value={dayStart}
              onChange={setDayStart}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="Jornada hasta"
              value={dayEnd}
              onChange={setDayEnd}
              keyboardType="numeric"
            />
          </View>
        </View>
        <Txt variant="caption" tone="secondary">
          Horas de 0 a 23. Neka solo propone horarios dentro de tu jornada.
        </Txt>
        <Button
          title="Guardar horarios"
          variant="secondary"
          onPress={() => {
            const values = [dayStart, dayEnd, quietStart, quietEnd].map(Number);
            if (
              [dayStart, dayEnd, quietStart, quietEnd].some((v) => !v.trim()) ||
              values.some((v) => !Number.isInteger(v) || v < 0 || v > 23) ||
              values[0] >= values[1] ||
              values[2] === values[3]
            ) {
              say(
                "jornada",
                "Usa horas enteras de 0 a 23, con el inicio antes del fin y horas de silencio distintas.",
              );
              return;
            }
            pref({
              dayStart: values[0],
              dayEnd: values[1],
              quietStart: values[2],
              quietEnd: values[3],
            });
            say("jornada", "Horarios guardados.");
          }}
        />
        {note("jornada")}
      </Section>
      <Section title="Tus datos">
        <Disclosure title="Respaldar o importar">
          <Txt tone="secondary">
            El respaldo incluye ítems, adjuntos, perfil, preferencias, chat y
            puntos. Importar reemplaza tus datos actuales, pero antes guardamos
            una copia que puedes recuperar.
          </Txt>
          <Button
            title="Exportar respaldo JSON"
            onPress={() => void exportBackup()}
          />
          <Button
            title="Ver JSON para copiar o pegar"
            variant="secondary"
            onPress={() => {
              setJson(JSON.stringify(data, null, 2));
              setShowJson(!showJson);
            }}
          />
          {showJson && (
            <>
              <Field
                label="Respaldo JSON"
                value={json}
                onChange={setJson}
                multiline
              />
              <Button
                title="Validar JSON pegado"
                variant="secondary"
                onPress={() => {
                  try {
                    setImported(readBackup(json));
                    say("json", "Respaldo válido. Revísalo abajo.");
                  } catch (e) {
                    say("json", (e as Error).message);
                  }
                }}
              />
              {note("json")}
            </>
          )}
          {hasRecovery && (
            <>
              <Button
                title="Recuperar datos anteriores"
                variant="secondary"
                disabled={busy}
                onPress={() => setConfirmRecovery(true)}
              />
              {confirmRecovery && (
                <>
                  <Txt>
                    Vuelves a la copia anterior a la última importación. Lo que
                    tienes ahora queda guardado como nueva copia.
                  </Txt>
                  <Button
                    title="Confirmar recuperación"
                    disabled={busy}
                    onPress={async () => {
                      try {
                        setBusy(true);
                        await restorePrevious();
                        setConfirmRecovery(false);
                        setImported(null);
                        say("backup", "Datos anteriores recuperados.");
                      } catch (e) {
                        say("backup", (e as Error).message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  />
                </>
              )}
            </>
          )}
          <Button
            title={busy ? "Leyendo…" : "Elegir respaldo para importar"}
            variant="secondary"
            disabled={busy}
            onPress={() => void importBackup()}
          />
          {imported && (
            <Card variant="featured">
              <Txt variant="headline">Respaldo válido</Txt>
              <Txt>
                {imported.items.length} ítems · {imported.workspaces.length}{" "}
                espacios · {imported.profile.name || "Sin nombre"}
              </Txt>
              <Txt variant="caption" tone="secondary">
                Podrás deshacerlo con «Recuperar datos anteriores».
              </Txt>
              <Button
                title="Importar con copia de recuperación"
                variant="danger"
                disabled={busy}
                onPress={async () => {
                  try {
                    setBusy(true);
                    await replaceData({
                      ...imported,
                      preferences: {
                        ...imported.preferences,
                        notifications: false,
                      },
                    });
                    setImported(null);
                    say(
                      "backup",
                      "Respaldo importado. Vuelve a activar los recordatorios en este dispositivo.",
                    );
                  } catch (e) {
                    say("backup", (e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            </Card>
          )}
          {note("backup")}
        </Disclosure>
        <Disclosure title={`Papelera (${trashed.length})`}>
          {!trashed.length && (
            <Txt tone="secondary">La papelera está vacía.</Txt>
          )}
          {trashed.map((i) => (
            <View
              key={i.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: space.md,
              }}
            >
              <Txt numberOfLines={1} style={{ flex: 1 }}>
                {i.title}
              </Txt>
              <Button
                title="Restaurar"
                variant="secondary"
                small
                onPress={() => {
                  try {
                    change((d) => restoreItem(d, i.id));
                    say("trash", `«${i.title}» restaurado.`);
                  } catch (e) {
                    say("trash", (e as Error).message);
                  }
                }}
              />
            </View>
          ))}
          {note("trash")}
        </Disclosure>
        <Txt variant="caption" tone="secondary">
          Si borras los datos del navegador o desinstalas la app, solo te quedan
          tu respaldo o tu cuenta.
        </Txt>
      </Section>
      <Section title="Sobre Nekal">
        <Disclosure title="¿Cómo se calculan los puntos?">
          <Txt>
            Base = 10 × dificultad × prioridad. Dificultad: 1, 2 o 3. Prioridad:
            baja ×1, media ×1,5, urgente ×2.
          </Txt>
          <Txt>
            Desbloquear dependencias suma 5 puntos por ítem, hasta 15 extra.
            Notas e ideas no suman. Eventos, visitas y reuniones solo suman si
            lo activas.
          </Txt>
          <Txt>
            Los goals entregan hasta el 80% con sus hitos y el resto al
            completarlos. Reabrir o marcar otra vez no duplica puntos. Cada 100
            puntos subes un nivel.
          </Txt>
        </Disclosure>
        <Disclosure title="Privacidad">
          <Txt>
            Tú revisas y aceptas cada cambio sugerido. Neka funciona con reglas
            en tu dispositivo y no envía conversaciones a servicios de IA.
          </Txt>
          <Txt>
            Como invitado, tus datos quedan en este navegador o teléfono. Con
            una cuenta, se sincronizan con Firebase y solo tú puedes leerlos.
          </Txt>
          <Txt variant="caption" tone="secondary">
            Versión de prueba. Antes de publicarla hay que definir contacto y
            condiciones de privacidad.
          </Txt>
        </Disclosure>
        <Txt variant="caption" tone="secondary">
          Nekal · V2
        </Txt>
      </Section>
    </Sheet>
  );
}
