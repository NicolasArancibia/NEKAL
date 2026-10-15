import React, { useState } from "react";
import { Platform, ScrollView, Share, Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useApp } from "../utils/AppContext";
import { AppData, localDay, restoreItem } from "../utils/model";
import { readBackup } from "../utils/storage";
import { requestReminders } from "../utils/notifications";
import { Button, Field, Sheet, Toggle } from "../components/ui/Common";
import { colors, s } from "../styles/globalStyles";
export default function Ajustes({ onBack }: { onBack: () => void }) {
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
  const [message, setMessage] = useState(""),
    [modal, setModal] = useState<"backup" | "trash" | "about" | "score" | null>(
      null,
    ),
    [imported, setImported] = useState<AppData | null>(null),
    [busy, setBusy] = useState(false);
  const [dayStart, setDayStart] = useState(String(data.preferences.dayStart)),
    [dayEnd, setDayEnd] = useState(String(data.preferences.dayEnd)),
    [quietStart, setQuietStart] = useState(String(data.preferences.quietStart)),
    [quietEnd, setQuietEnd] = useState(String(data.preferences.quietEnd));
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
      setMessage("Respaldo preparado. Guárdalo en un lugar privado.");
    } catch {
      setMessage("No se pudo exportar el respaldo.");
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
      setMessage("Revisa el respaldo antes de reemplazar tus datos.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <View style={s.between}>
        <Text style={s.title}>Ajustes</Text>
        <Button title="Volver al perfil" secondary small onPress={onBack} />
      </View>
      <Text style={s.subtitle}>Una organización que se adapta a ti.</Text>
      <View style={s.card}>
        <Text style={s.heading}>Cómo te acompaña Neka</Text>
        <Toggle
          label="Avisos suaves"
          value={data.preferences.softAlerts}
          onChange={(softAlerts) => pref({ softAlerts })}
          detail="Avisos de conflictos dentro de la app. Sin sonidos."
        />
        <View>
          <Text style={s.text}>Preguntar siempre antes de cambiar</Text>
          <Text style={s.small}>
            Activado en esta V1: ninguna propuesta se aplica sin tu
            confirmación.
          </Text>
        </View>
        <Toggle
          label="Horas de silencio"
          value={data.preferences.quiet}
          onChange={(quiet) => pref({ quiet })}
        />
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Field
              label="Silencio desde (0–23)"
              value={quietStart}
              onChange={setQuietStart}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="Silencio hasta (0–23)"
              value={quietEnd}
              onChange={setQuietEnd}
              keyboardType="numeric"
            />
          </View>
        </View>
        <Text style={s.heading}>Tu jornada para propuestas</Text>
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Field
              label="Inicio (0–23)"
              value={dayStart}
              onChange={setDayStart}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="Fin (0–23)"
              value={dayEnd}
              onChange={setDayEnd}
              keyboardType="numeric"
            />
          </View>
        </View>
        <Button
          title="Guardar horarios"
          secondary
          onPress={() => {
            const values = [dayStart, dayEnd, quietStart, quietEnd].map(Number);
            if (
              [dayStart, dayEnd, quietStart, quietEnd].some((v) => !v.trim()) ||
              values.some((v) => !Number.isInteger(v) || v < 0 || v > 23) ||
              values[0] >= values[1] ||
              values[2] === values[3]
            ) {
              setMessage(
                "Usa horas enteras de 0 a 23, inicio anterior al fin y horas de silencio distintas.",
              );
              return;
            }
            pref({
              dayStart: values[0],
              dayEnd: values[1],
              quietStart: values[2],
              quietEnd: values[3],
            });
            setMessage("Horarios guardados.");
          }}
        />
        <Toggle
          label="Recordatorios del teléfono"
          value={data.preferences.notifications}
          onChange={async (enabled) => {
            try {
              if (enabled) await requestReminders();
              pref({ notifications: enabled });
              setMessage(
                enabled
                  ? "Recordatorios activados, 10 minutos antes."
                  : "Recordatorios desactivados.",
              );
            } catch (e) {
              setMessage((e as Error).message);
            }
          }}
          detail={
            Platform.OS === "web"
              ? "Actívalos desde Expo Go en tu iPhone."
              : "Diez minutos antes, respetando las horas de silencio."
          }
        />
      </View>
      <View style={s.card}>
        <Text style={s.heading}>Tus datos</Text>
        <Button
          title="Respaldar o importar"
          secondary
          onPress={() => {
            setModal("backup");
            setMessage("");
          }}
        />
        <Button
          title={`Papelera (${data.items.filter((i) => i.deletedAt).length})`}
          secondary
          onPress={() => setModal("trash")}
        />
        <Text style={s.small}>
          Los cambios se guardan en este dispositivo. Si borras los datos del
          navegador o desinstalas la app, necesitarás tu respaldo o copia de
          Firebase.
        </Text>
      </View>
      <View style={s.card}>
        <Text style={s.heading}>Sobre Nekal</Text>
        <Button
          title="Cómo se calculan mis puntos"
          secondary
          onPress={() => setModal("score")}
        />
        <Button
          title="Información de uso y privacidad"
          secondary
          onPress={() => setModal("about")}
        />
        <Text style={s.small}>
          NEKAL · V1.0 · hecho para avanzar a tu ritmo
        </Text>
      </View>
      {!!message && (
        <Text
          accessibilityRole="alert"
          style={[s.text, { color: colors.primary }]}
        >
          {message}
        </Text>
      )}
      {!!error && (
        <View style={s.card}>
          <Text style={s.error}>{error}</Text>
          <Button
            title="Reintentar guardado"
            onPress={() => {
              clearError();
              retry();
            }}
          />
        </View>
      )}
      <Sheet
        visible={!!modal}
        title={
          modal === "backup"
            ? "Respaldos"
            : modal === "trash"
              ? "Papelera"
              : modal === "score"
                ? "Tu puntaje"
                : "Uso y privacidad"
        }
        onClose={() => {
          setModal(null);
          setImported(null);
        }}
      >
        {modal === "backup" && (
          <>
            <Text style={s.text}>
              El respaldo incluye ítems, adjuntos, perfil, preferencias, chat y
              puntos. La importación reemplaza los datos del modo o cuenta
              actual. Antes de reemplazarlos guardamos una copia recuperable en
              este dispositivo.
            </Text>
            <Button
              title="Exportar respaldo JSON"
              onPress={() => void exportBackup()}
            />
            <Button
              title="Ver JSON para copiar o pegar"
              secondary
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
                  secondary
                  onPress={() => {
                    try {
                      setImported(readBackup(json));
                      setMessage("Respaldo válido, listo para revisar.");
                    } catch (e) {
                      setMessage((e as Error).message);
                    }
                  }}
                />
              </>
            )}
            {hasRecovery && (
              <>
                <Button
                  title="Recuperar datos anteriores"
                  secondary
                  disabled={busy}
                  onPress={() => setConfirmRecovery(true)}
                />
                {confirmRecovery && (
                  <>
                    <Text style={s.text}>
                      Recupera la copia anterior a la última importación o
                      descarga. El estado actual quedará guardado como nueva
                      copia recuperable.
                    </Text>
                    <Button
                      title="Confirmar recuperación"
                      disabled={busy}
                      onPress={async () => {
                        try {
                          setBusy(true);
                          await restorePrevious();
                          setConfirmRecovery(false);
                          setImported(null);
                          setMessage("Datos anteriores recuperados.");
                        } catch (e) {
                          setMessage((e as Error).message);
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
              secondary
              disabled={busy}
              onPress={() => void importBackup()}
            />
            {imported && (
              <View style={s.card}>
                <Text style={s.heading}>Respaldo válido</Text>
                <Text style={s.text}>
                  {imported.items.length} ítems · {imported.workspaces.length}{" "}
                  espacios · {imported.profile.name || "Sin nombre"}
                </Text>
                <Text style={s.small}>
                  Se guardará una copia de los datos actuales. Podrás deshacer
                  esta importación con «Recuperar datos anteriores».
                </Text>
                <Button
                  title="Importar con copia de recuperación"
                  danger
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
                      setModal(null);
                      setMessage(
                        "Respaldo importado. Los recordatorios requieren activarse en este dispositivo.",
                      );
                    } catch (e) {
                      setMessage((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              </View>
            )}
            {!!message && <Text style={s.text}>{message}</Text>}
          </>
        )}
        {modal === "trash" && (
          <>
            {!data.items.some((i) => i.deletedAt) && (
              <Text style={s.subtitle}>La papelera está vacía.</Text>
            )}
            {data.items
              .filter((i) => i.deletedAt)
              .map((i) => (
                <View key={i.id} style={s.card}>
                  <Text style={s.heading}>{i.title}</Text>
                  <Button
                    title={`Restaurar ${i.title}`}
                    secondary
                    onPress={() => {
                      try {
                        change((d) => restoreItem(d, i.id));
                        setMessage("Ítem restaurado.");
                      } catch (e) {
                        setMessage((e as Error).message);
                      }
                    }}
                  />
                </View>
              ))}
            {!!message && <Text style={s.text}>{message}</Text>}
          </>
        )}
        {modal === "score" && (
          <>
            <Text style={s.heading}>Cada avance cuenta</Text>
            <Text style={s.text}>
              Base = 10 × dificultad × prioridad. Dificultad: 1, 2 o 3.
              Prioridad: baja ×1, media ×1,5, urgente ×2.
            </Text>
            <Text style={s.text}>
              Desbloquear dependencias suma 5 puntos por ítem, con un máximo de
              15 adicionales. Notas e ideas no puntúan. Eventos, visitas y
              reuniones solo puntúan si lo activas.
            </Text>
            <Text style={s.text}>
              Los goals entregan hasta el 80% por sus hitos y el resto al
              completarlos. El presupuesto queda fijo al ganar la primera
              recompensa; reabrir o marcar otra vez no duplica puntos. Cada 100
              puntos subes un nivel.
            </Text>
            <Text style={s.small}>
              Consulta documentacion/V1.md para la fórmula completa, sus límites
              y las decisiones de diseño.
            </Text>
          </>
        )}
        {modal === "about" && (
          <>
            <Text style={s.heading}>Tu planificación sigue siendo tuya</Text>
            <Text style={s.text}>
              Nekal es una herramienta personal de organización. Tú revisas y
              aceptas los cambios sugeridos. Neka funciona con reglas locales;
              no envía conversaciones a servicios de inteligencia artificial.
            </Text>
            <Text style={s.text}>
              En modo local, los datos permanecen en este navegador o teléfono.
              Al conectar Firebase, el correo y la autenticación se procesan
              allí; tus datos de planificación se envían cuando eliges subirlos.
              Cada usuario accede a su propia copia si se despliegan las reglas
              incluidas.
            </Text>
            <Text style={s.text}>
              Los avisos dependen de permisos y configuración del dispositivo.
              Mantén respaldos de información importante.
            </Text>
            <Text style={s.small}>
              Versión personal de prueba. Antes de una publicación pública, el
              responsable deberá definir sus datos de contacto y las condiciones
              de servicio y privacidad correspondientes.
            </Text>
          </>
        )}
      </Sheet>
    </ScrollView>
  );
}
