import React, { useState } from "react";
import { Image, Platform, Share, Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useApp } from "../../utils/AppContext";
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
import { colors, s } from "../../styles/globalStyles";
import { Button, Chip, Field, Sheet, Toggle } from "./Common";

export default function ItemEditor({
  item,
  onClose,
}: {
  item: Item;
  onClose: () => void;
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
  return (
    <Sheet
      visible
      title={exists ? "Editar ítem" : "Crear ítem"}
      onClose={onClose}
    >
      <Text style={s.small}>Tus ideas y compromisos, en un mismo lugar.</Text>
      {!exists ? (
        <View style={s.wrap}>
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
        </View>
      ) : (
        <Text style={[s.heading, { color: colors.primary }]}>{draft.type}</Text>
      )}
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
        placeholder="Agrega contexto, a tu ritmo"
      />
      <Field
        label="Fecha de inicio"
        value={draft.startDate}
        onChange={(startDate) => patch({ startDate })}
        placeholder="AAAA-MM-DD"
      />
      <View>
        <Text style={s.label}>Espacio</Text>
        <View style={s.wrap}>
          {data.workspaces.map((w) => (
            <Chip
              key={w.id}
              title={w.name}
              selected={draft.workspaceId === w.id}
              onPress={() => patch({ workspaceId: w.id, groupId: "" })}
            />
          ))}
        </View>
      </View>
      <View>
        <Text style={s.label}>Rutina / grupo</Text>
        <View style={s.wrap}>
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
      </View>
      {draft.type === "Nota" && (
        <>
          <Field
            label="Contenido de la nota"
            value={draft.content}
            onChange={(content) => patch({ content })}
            multiline
          />
          <Button
            title={busy ? "Leyendo archivo…" : "Adjuntar imagen o archivo"}
            disabled={busy}
            secondary
            onPress={() => void addAttachment()}
          />
          <Text style={s.small}>
            Hasta 3 adjuntos de 350 KB. Se guardan dentro del respaldo.
          </Text>
          {draft.attachments.map((a) => (
            <View key={a.id} style={s.card}>
              <Text style={s.text}>{a.name}</Text>
              {a.mime.startsWith("image/") && (
                <Image
                  source={{ uri: a.data }}
                  style={{ height: 160, width: "100%" }}
                  resizeMode="contain"
                />
              )}
              <Button
                title={`Abrir ${a.name}`}
                secondary
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
                title={`Quitar ${a.name}`}
                small
                secondary
                onPress={() =>
                  patch({
                    attachments: draft.attachments.filter((x) => x.id !== a.id),
                  })
                }
              />
            </View>
          ))}
        </>
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
              secondary
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
          <Text style={s.small}>
            Las notas e ideas no tienen estado ni suman puntos.
          </Text>
        </>
      )}
      {!isPassive && (
        <>
          <View>
            <Text style={s.label}>Estado</Text>
            <View style={s.wrap}>
              {(["pendiente", "en curso", "completado"] as const).map(
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
          </View>
          <View>
            <Text style={s.label}>Prioridad</Text>
            <View style={s.wrap}>
              {(["baja", "media", "urgente"] as const).map((priority) => (
                <Chip
                  key={priority}
                  title={priority}
                  selected={draft.priority === priority}
                  onPress={() => patch({ priority })}
                />
              ))}
            </View>
          </View>
          <Field
            label={
              appointment
                ? "Fecha y hora del compromiso"
                : "Horario planificado (opcional)"
            }
            value={scheduled}
            onChange={setScheduled}
            placeholder="AAAA-MM-DD HH:mm"
          />
          {!appointment && (
            <Field
              label={
                draft.type === "Deadline"
                  ? "Fecha límite (obligatoria)"
                  : "Fecha límite (opcional)"
              }
              value={due}
              onChange={setDue}
              placeholder="AAAA-MM-DD HH:mm"
            />
          )}
          <Text style={s.small}>
            Fechas en la zona horaria de este dispositivo. El horario
            planificado ocupa tiempo; la fecha límite indica cuándo debe estar
            terminado.
          </Text>
          <Field
            label="Duración estimada (minutos)"
            value={String(draft.duration)}
            onChange={(v) => patch({ duration: v ? Number(v) : 0 })}
            keyboardType="numeric"
          />
          <Toggle
            label="Neka puede proponer moverlo"
            value={draft.flexible}
            onChange={(flexible) => patch({ flexible })}
            detail="Siempre verás la propuesta antes de aplicar un cambio."
          />
          {draft.type !== "Goal" && draft.type !== "Deadline" && (
            <Field
              label={
                draft.type === "Visita"
                  ? "Ubicación (obligatoria)"
                  : "Ubicación o enlace"
              }
              value={draft.location}
              onChange={(location) => patch({ location })}
            />
          )}
          {draft.type === "Visita" && (
            <Field
              label="Persona / motivo de la visita"
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
                label="Agenda de la reunión"
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
                <View style={s.wrap}>
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
          {!appointment && (
            <View style={s.card}>
              <Text style={s.heading}>
                {draft.type === "Goal" ? "Hitos" : "Checklist de subtareas"}
              </Text>
              {draft.steps.map((st) => (
                <View key={st.id} style={s.row}>
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
                  <Button
                    title={`Quitar ${st.title}`}
                    secondary
                    small
                    onPress={() =>
                      patch({
                        steps: draft.steps.filter((x) => x.id !== st.id),
                      })
                    }
                  />
                </View>
              ))}
              <Field
                label={draft.type === "Goal" ? "Nuevo hito" : "Nueva subtarea"}
                value={step}
                onChange={setStep}
              />
              <Button
                title="Añadir a la lista"
                secondary
                small
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
          )}
          <View style={s.card}>
            <Text style={s.heading}>Depende de</Text>
            <Text style={s.small}>
              Debe completarse antes de finalizar este ítem.
            </Text>
            {activeItems(data)
              .filter((i) => i.id !== draft.id && !passive(i))
              .map((i) => (
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
            {!activeItems(data).some(
              (i) => i.id !== draft.id && !passive(i),
            ) && (
              <Text style={s.small}>
                Crea otro ítem accionable para vincularlo.
              </Text>
            )}
          </View>
          <View style={s.card}>
            <Text style={s.heading}>
              {frozenPoints ?? pointsFor(estimatedItem, data.items)} puntos{" "}
              {frozenPoints === undefined ? "estimados" : "asignados"}
            </Text>
            <Text style={s.small}>
              Dificultad{" "}
              {["baja", "media", "alta"][difficultyOf(estimatedItem) - 1]}. El
              puntaje se fija al obtener la primera recompensa; reabrir un ítem
              no vuelve a premiarlo.
            </Text>
          </View>
        </>
      )}
      {!!error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}
      <Button title="Guardar ítem" onPress={save} disabled={busy} />
      {exists &&
        (!confirmDelete ? (
          <Button
            title="Mover a la papelera"
            secondary
            onPress={() => setConfirmDelete(true)}
          />
        ) : (
          <View style={s.card}>
            <Text style={s.text}>
              Podrás restaurarlo desde Ajustes. Los puntos ya obtenidos se
              conservan.
            </Text>
            <Button
              title="Confirmar eliminación"
              danger
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
              title="Cancelar eliminación"
              secondary
              onPress={() => setConfirmDelete(false)}
            />
          </View>
        ))}
    </Sheet>
  );
}
