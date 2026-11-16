import React, { useState } from "react";
import { Image, Platform, ScrollView, Share, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useApp } from "../../utils/AppContext";
import AvisoOrigen from "./conexiones/AvisoOrigen";
import { mergeValue } from "../../utils/syncModel";
import {
  Item,
  TYPES,
  activeItems,
  dateInput,
  deleteItem,
  difficultyOf,
  parseDateInput,
  passive,
  pointsFor,
  saveItem,
  uid,
} from "../../utils/model";
import { color, size, space } from "../../styles/theme";
import {
  Button,
  Card,
  Chip,
  Disclosure,
  Field,
  PressableScale,
  Sheet,
  Tag,
  Toggle,
  Txt,
} from "./base";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: space.md }}>
      <Txt variant="headline">{title}</Txt>
      {children}
    </View>
  );
}

// «antes de las 18:00» (hoy), «antes del viernes» (esta semana) o «antes del 12 de noviembre».
function antesDe(iso: string) {
  const fecha = new Date(iso),
    hoy = new Date();
  const dias = Math.round(
    (new Date(
      fecha.getFullYear(),
      fecha.getMonth(),
      fecha.getDate(),
    ).getTime() -
      new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime()) /
      86400000,
  );
  if (dias === 0)
    return `antes de las ${fecha.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
  return `antes del ${fecha.toLocaleDateString("es-CL", dias <= 6 ? { weekday: "long" } : { day: "numeric", month: "long" })}`;
}

// `acciones` va bajo el tipo (la hoja del Espacio agrega "Conectar con…" y
// "Ver dónde está"). `sinCompletar`: el modelo de una rutina no se completa,
// se completa cada día que toca (spec B §2.1).
export default function ItemEditor({
  item,
  onClose,
  acciones,
  sinCompletar = false,
}: {
  item: Item;
  onClose: () => void;
  acciones?: React.ReactNode;
  sinCompletar?: boolean;
}) {
  const { data, change } = useApp();
  const [original] = useState(item);
  const [originalExists] = useState(data.items.some((i) => i.id === item.id));
  const [draft, setDraft] = useState<Item>(item),
    [scheduled, setScheduled] = useState(dateInput(item.scheduledAt)),
    [due, setDue] = useState(dateInput(item.dueAt)),
    [error, setError] = useState(""),
    [step, setStep] = useState(""),
    [confirmDelete, setConfirmDelete] = useState(false),
    [busy, setBusy] = useState(false);
  const exists = data.items.some((i) => i.id === item.id),
    isPassive = passive(draft),
    appointment = ["Evento", "Visita", "Meeting"].includes(draft.type);
  const patch = (fields: Partial<Item>) =>
    setDraft((d) => ({ ...d, ...fields }));
  let estimatedItem = draft;
  try {
    estimatedItem = {
      ...draft,
      dueAt: isPassive || appointment ? "" : parseDateInput(due),
    };
  } catch {
    // An incomplete date is validated when saving; keep the last valid estimate.
  }
  const frozenPoints = data.rewards.find(
    (r) => r.key === `${draft.id}:budget`,
  )?.points;
  // Spec E §3: el estimado ya trae el +20% si la fecha límite aún no pasa.
  const bonusHasta =
    frozenPoints === undefined &&
    estimatedItem.dueAt &&
    Date.parse(estimatedItem.dueAt) > Date.now()
      ? antesDe(estimatedItem.dueAt)
      : "";
  const save = () => {
    try {
      const result = {
        ...draft,
        scheduledAt: isPassive ? "" : parseDateInput(scheduled),
        dueAt: isPassive || appointment ? "" : parseDateInput(due),
      };
      change((d) => {
        const current = d.items.find((i) => i.id === original.id);
        if (
          originalExists &&
          (!current || current.deletedAt !== original.deletedAt)
        )
          throw new Error(
            "Este ítem se eliminó o restauró en otro dispositivo. Tu borrador sigue aquí; copia lo necesario antes de cerrar.",
          );
        const merged = originalExists
          ? mergeValue(original, result, current)
          : { value: result, conflict: false };
        if (merged.conflict)
          throw new Error(
            "Este ítem cambió en otro dispositivo mientras lo editabas. Tu borrador sigue aquí; copia tus cambios y vuelve a abrir el ítem actualizado.",
          );
        return saveItem(d, merged.value);
      });
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const addAttachment = async () => {
    try {
      setBusy(true);
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if ((asset.size ?? 0) > 350000)
        throw new Error("Máximo 350 KB por adjunto en esta V1.");
      let encoded: string;
      if (Platform.OS === "web") {
        const blob = await (await fetch(asset.uri)).blob();
        if (blob.size > 350000) throw new Error("Máximo 350 KB por adjunto.");
        encoded = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        encoded = `data:${asset.mimeType ?? "application/octet-stream"};base64,${await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 })}`;
      }
      if (draft.attachments.length >= 3)
        throw new Error("Máximo 3 adjuntos por nota.");
      patch({
        attachments: [
          ...draft.attachments,
          {
            id: uid(),
            name: asset.name,
            mime: asset.mimeType ?? "application/octet-stream",
            data: encoded,
          },
        ],
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const spaceName =
    data.workspaces.find((w) => w.id === draft.workspaceId)?.name ?? "";
  const linkable = activeItems(data).filter(
    (i) => i.id !== draft.id && !passive(i),
  );
  return (
    <Sheet
      visible
      title={exists ? "Editar ítem" : "Crear ítem"}
      onClose={onClose}
    >
      {!exists ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: space.sm, paddingVertical: space.xs }}
        >
          {TYPES.map((type) => (
            <Chip
              key={type}
              title={type}
              selected={draft.type === type}
              onPress={() =>
                patch({
                  type,
                  flexible: !["Evento", "Visita", "Meeting"].includes(type),
                })
              }
            />
          ))}
        </ScrollView>
      ) : (
        <Tag text={draft.type} tone="primary" />
      )}
      {acciones}
      {!!draft.origen && <AvisoOrigen origen={draft.origen} />}

      <Section title="Qué">
        <Field
          label="Título"
          value={draft.title}
          onChange={(title) => patch({ title })}
          placeholder="¿Qué quieres organizar?"
        />
        <Field
          label="Descripción"
          value={draft.description}
          onChange={(description) => patch({ description })}
          multiline
          placeholder="Contexto, enlaces, lo que necesites recordar"
        />
        {draft.type === "Nota" && (
          <Field
            label="Contenido de la nota"
            value={draft.content}
            onChange={(content) => patch({ content })}
            multiline
          />
        )}
        {draft.type === "Idea" && (
          <>
            <Field
              label="Categoría de la idea"
              value={draft.category}
              onChange={(category) => patch({ category })}
            />
            {exists && (
              <Button
                title="Convertir en tarea"
                variant="secondary"
                onPress={() =>
                  patch({
                    type: "Tarea",
                    flexible: true,
                    description: [
                      draft.description,
                      draft.category
                        ? `Categoría original: ${draft.category}`
                        : "",
                    ]
                      .filter(Boolean)
                      .join("\n"),
                  })
                }
              />
            )}
          </>
        )}
        {isPassive && (
          <Txt variant="caption" tone="secondary">
            Las notas e ideas no tienen estado ni suman puntos.
          </Txt>
        )}
      </Section>

      <Section title="Cuándo">
        <Field
          label="Fecha de inicio"
          value={draft.startDate}
          onChange={(startDate) => patch({ startDate })}
          placeholder="AAAA-MM-DD"
        />
        {!isPassive && (
          <>
            <Field
              label={appointment ? "Fecha y hora" : "Horario (opcional)"}
              value={scheduled}
              onChange={setScheduled}
              placeholder="AAAA-MM-DD HH:mm"
            />
            {!appointment && (
              <Field
                label={
                  draft.type === "Deadline"
                    ? "Fecha límite"
                    : "Fecha límite (opcional)"
                }
                value={due}
                onChange={setDue}
                placeholder="AAAA-MM-DD HH:mm"
              />
            )}
            <Field
              label="Duración (minutos)"
              value={String(draft.duration)}
              onChange={(v) => patch({ duration: v ? Number(v) : 0 })}
              keyboardType="numeric"
            />
            <Txt variant="caption" tone="secondary">
              El horario ocupa tiempo en tu día; la fecha límite es cuándo debe
              estar listo.
            </Txt>
            <Toggle
              label="Neka puede proponer moverlo"
              value={draft.flexible}
              onChange={(flexible) => patch({ flexible })}
              detail="Siempre verás la propuesta antes de que cambie."
            />
          </>
        )}
      </Section>

      {!isPassive && draft.type !== "Goal" && draft.type !== "Deadline" && (
        <Section title="Detalles">
          <Field
            label={draft.type === "Visita" ? "Ubicación" : "Ubicación o enlace"}
            value={draft.location}
            onChange={(location) => patch({ location })}
          />
          {draft.type === "Visita" && (
            <Field
              label="Persona o motivo de la visita"
              value={draft.visitReason}
              onChange={(visitReason) => patch({ visitReason })}
            />
          )}
          {draft.type === "Meeting" && (
            <>
              <Field
                label="Participantes"
                value={draft.participants}
                onChange={(participants) => patch({ participants })}
                placeholder="Nombres separados por comas"
              />
              <Field
                label="Agenda"
                value={draft.agenda}
                onChange={(agenda) => patch({ agenda })}
                multiline
              />
            </>
          )}
          {appointment && (
            <>
              <Toggle
                label="Cuenta para mi puntaje"
                value={draft.countsForScore}
                onChange={(countsForScore) => patch({ countsForScore })}
              />
              {draft.countsForScore && (
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: space.sm,
                  }}
                >
                  {([1, 2, 3] as const).map((difficulty) => (
                    <Chip
                      key={difficulty}
                      title={["Baja", "Media", "Alta"][difficulty - 1]}
                      selected={draft.difficulty === difficulty}
                      onPress={() => patch({ difficulty })}
                    />
                  ))}
                </View>
              )}
            </>
          )}
        </Section>
      )}

      {!isPassive && !appointment && (
        <Section title={draft.type === "Goal" ? "Hitos" : "Subtareas"}>
          {draft.steps.map((st) => (
            <View
              key={st.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: space.sm,
              }}
            >
              <View style={{ flex: 1 }}>
                <Toggle
                  label={st.title}
                  value={st.done}
                  onChange={(done) =>
                    patch({
                      steps: draft.steps.map((x) =>
                        x.id === st.id ? { ...x, done } : x,
                      ),
                    })
                  }
                />
              </View>
              <PressableScale
                accessibilityLabel={`Quitar ${st.title}`}
                onPress={() =>
                  patch({ steps: draft.steps.filter((x) => x.id !== st.id) })
                }
                style={{
                  width: size.minTouch,
                  height: size.minTouch,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="close-outline"
                  size={size.icon}
                  color={color.inkSecondary}
                />
              </PressableScale>
            </View>
          ))}
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              gap: space.sm,
            }}
          >
            <View style={{ flex: 1 }}>
              <Field
                label={draft.type === "Goal" ? "Nuevo hito" : "Nueva subtarea"}
                value={step}
                onChange={setStep}
              />
            </View>
            <Button
              title="Añadir"
              variant="secondary"
              onPress={() => {
                if (step.trim()) {
                  patch({
                    steps: [
                      ...draft.steps,
                      { id: uid(), title: step.trim(), done: false },
                    ],
                  });
                  setStep("");
                }
              }}
            />
          </View>
        </Section>
      )}

      {!isPassive && (
        <Section title="Estado y prioridad">
          <View
            style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}
          >
            {(sinCompletar
              ? (["pendiente", "en curso"] as const)
              : (["pendiente", "en curso", "completado"] as const)
            ).map(
              (status) => (
                <Chip
                  key={status}
                  title={status}
                  selected={draft.status === status}
                  onPress={() => patch({ status })}
                />
              ),
            )}
          </View>
          {sinCompletar && (
            <Txt variant="caption" tone="secondary">
              Es el modelo de la rutina: se copia en cada día que toca y ahí se
              completa.
            </Txt>
          )}
          <View
            style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}
          >
            {(["baja", "media", "urgente"] as const).map((priority) => (
              <Chip
                key={priority}
                title={priority}
                selected={draft.priority === priority}
                onPress={() => patch({ priority })}
              />
            ))}
          </View>
          <Txt variant="caption" tone="secondary">
            {frozenPoints ?? pointsFor(estimatedItem, data.items)} pts{" "}
            {frozenPoints === undefined ? "estimados" : "asignados"}
            {bonusHasta && ` (+20% si lo terminas ${bonusHasta})`} · dificultad{" "}
            {["baja", "media", "alta"][difficultyOf(estimatedItem) - 1]}
          </Txt>
        </Section>
      )}

      <Disclosure title={`Espacio y relaciones · ${spaceName}`}>
        <Txt variant="callout" weight={600}>
          Espacio
        </Txt>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          {data.workspaces.map((w) => (
            <Chip
              key={w.id}
              title={w.name}
              selected={draft.workspaceId === w.id}
              onPress={() => patch({ workspaceId: w.id, groupId: "" })}
            />
          ))}
        </View>
        <Txt variant="callout" weight={600}>
          Rutina o grupo
        </Txt>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          <Chip
            title="Sin grupo"
            selected={!draft.groupId}
            onPress={() => patch({ groupId: "" })}
          />
          {data.groups
            .filter((g) => g.workspaceId === draft.workspaceId)
            .map((g) => (
              <Chip
                key={g.id}
                title={g.name}
                selected={draft.groupId === g.id}
                onPress={() => patch({ groupId: g.id })}
              />
            ))}
        </View>
        {!isPassive && (
          <>
            <Txt variant="callout" weight={600}>
              Depende de
            </Txt>
            <Txt variant="caption" tone="secondary">
              Lo marcado debe completarse antes de terminar este ítem.
            </Txt>
            {linkable.map((i) => (
              <Toggle
                key={i.id}
                label={i.title}
                value={draft.dependencies.includes(i.id)}
                onChange={(checked) =>
                  patch({
                    dependencies: checked
                      ? [...draft.dependencies, i.id]
                      : draft.dependencies.filter((id) => id !== i.id),
                  })
                }
              />
            ))}
            {!linkable.length && (
              <Txt variant="caption" tone="secondary">
                Crea otro ítem accionable para vincularlo.
              </Txt>
            )}
          </>
        )}
      </Disclosure>

      {draft.type === "Nota" && (
        <Disclosure title={`Adjuntos (${draft.attachments.length}/3)`}>
          <Button
            title={busy ? "Leyendo archivo…" : "Adjuntar imagen o archivo"}
            disabled={busy}
            variant="secondary"
            onPress={() => void addAttachment()}
          />
          <Txt variant="caption" tone="secondary">
            Hasta 3 adjuntos de 350 KB. Se guardan dentro del respaldo.
          </Txt>
          {draft.attachments.map((a) => (
            <Card key={a.id}>
              <Txt numberOfLines={1}>{a.name}</Txt>
              {a.mime.startsWith("image/") && (
                <Image
                  source={{ uri: a.data }}
                  style={{ height: 160, width: "100%" }}
                  resizeMode="contain"
                />
              )}
              <View style={{ flexDirection: "row", gap: space.sm }}>
                <Button
                  title="Abrir"
                  variant="secondary"
                  small
                  onPress={async () => {
                    try {
                      if (Platform.OS === "web") {
                        const link = document.createElement("a");
                        link.href = a.data;
                        link.download = a.name;
                        link.click();
                      } else {
                        const path =
                          FileSystem.cacheDirectory +
                          a.id +
                          "-" +
                          a.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
                        await FileSystem.writeAsStringAsync(
                          path,
                          a.data.split(",")[1],
                          { encoding: FileSystem.EncodingType.Base64 },
                        );
                        await Share.share({ url: path });
                      }
                    } catch {
                      setError("No se pudo abrir el adjunto.");
                    }
                  }}
                />
                <Button
                  title="Quitar"
                  variant="plain"
                  small
                  onPress={() =>
                    patch({
                      attachments: draft.attachments.filter(
                        (x) => x.id !== a.id,
                      ),
                    })
                  }
                />
              </View>
            </Card>
          ))}
        </Disclosure>
      )}

      {!!error && (
        <Txt tone="danger" accessibilityRole="alert">
          {error}
        </Txt>
      )}
      <Button title="Guardar" onPress={save} disabled={busy} />
      {exists &&
        (!confirmDelete ? (
          <Button
            title="Enviar a la papelera"
            variant="plain"
            onPress={() => setConfirmDelete(true)}
          />
        ) : (
          <Card variant="featured">
            <Txt>
              Podrás restaurarlo desde Ajustes. Los puntos que ganaste se
              conservan.
            </Txt>
            <Button
              title="Enviar a la papelera"
              variant="danger"
              onPress={() => {
                try {
                  change((d) => deleteItem(d, item.id));
                  onClose();
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            />
            <Button
              title="Cancelar"
              variant="secondary"
              onPress={() => setConfirmDelete(false)}
            />
          </Card>
        ))}
    </Sheet>
  );
}
