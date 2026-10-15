import React, { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import ChatHeader from "../components/ui/ChatUi/ChatHeader";
import ChatMessage from "../components/ui/ChatUi/ChatMessage";
import ChatInput from "../components/ui/ChatUi/ChatInput";
import ItemEditor from "../components/ui/ItemEditor";
import { Button, Chip, Field, Sheet, Toggle } from "../components/ui/Common";
import { useApp } from "../utils/AppContext";
import {
  Item,
  ItemType,
  TYPES,
  activeItems,
  displayDate,
  newItem,
  passive,
  uid,
} from "../utils/model";
import {
  Proposal,
  applyProposal,
  findConflicts,
  proposeSlot,
} from "../utils/planner";
import { colors, s } from "../styles/globalStyles";
export default function Chat() {
  const { data, change } = useApp();
  const [editor, setEditor] = useState<Item | null>(null),
    [proposal, setProposal] = useState<Proposal | null>(null),
    [error, setError] = useState(""),
    [grouping, setGrouping] = useState(false),
    [groupName, setGroupName] = useState(""),
    [ids, setIds] = useState<string[]>([]);
  const scroll = useRef<ScrollView>(null),
    items = activeItems(data),
    conflicts = findConflicts(data);
  const respond = (text: string, isUser = false) =>
    change((d) => ({
      ...d,
      messages: [...d.messages, { id: uid(), text, isUser }].slice(-100),
    }));
  const send = (text: string) => {
    const normalized = text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    let reply =
      "Soy Neka, tu asistente local. Puedo revisar conflictos, buscar huecos, preparar ítems y agrupar rutinas. Usa las acciones de abajo o escribe «crear tarea: título».";
    const create =
      /^(?:crear|crea|anadir)\s+(nota|idea|evento|visita|meeting|deadline|goal|tarea)\s*:?\s+(.+)$/i.exec(
        normalized,
      );
    if (create) {
      const type = TYPES.find((t) => t.toLowerCase() === create[1]) as ItemType;
      const originalTitle = text.replace(
        /^(?:crear|crea|añadir|anadir)\s+\w+\s*:?\s*/i,
        "",
      );
      setEditor({ ...newItem("general", type), title: originalTitle });
      reply =
        "Preparé el formulario. Revisa los datos y guarda cuando esté listo.";
    } else if (/grupo|rutina|agrupar/.test(normalized)) {
      setGrouping(true);
      reply =
        "Elige los ítems que quieres agrupar. Todos deben pertenecer al mismo espacio.";
    } else if (/conflicto|organiza|hueco|planifica/.test(normalized)) {
      reply = conflicts.length
        ? `Detecté ${conflicts.length} conflictos:\n${conflicts
            .slice(0, 5)
            .map((c) => c.description)
            .join(
              "\n",
            )}\nAbajo puedes revisar una alternativa. Nunca moveré un compromiso fijo.`
        : "No detecté conflictos. Puedes buscar un horario para tus ítems flexibles pendientes desde las acciones de abajo.";
    } else if (/resumen|pendiente|hoy/.test(normalized)) {
      const pending = items.filter(
        (i) => !passive(i) && i.status !== "completado",
      );
      reply = pending.length
        ? `Tienes ${pending.length} ítems pendientes:\n${pending
            .slice(0, 8)
            .map(
              (i) =>
                `• ${i.title}${i.scheduledAt ? " · " + displayDate(i.scheduledAt) : " · sin horario"}`,
            )
            .join("\n")}`
        : "No tienes ítems pendientes. Podemos empezar con una idea o una tarea.";
    }
    change((d) => ({
      ...d,
      messages: [
        ...d.messages,
        { id: uid(), text, isUser: true },
        { id: uid(), text: reply, isUser: false },
      ].slice(-100),
    }));
  };
  const suggest = (id: string) => {
    const next = proposeSlot(data, id);
    setProposal(next);
    setError(
      next
        ? ""
        : "No encontré un hueco válido en los próximos 30 días. Revisa el plazo, la jornada o las dependencias sin horario.",
    );
  };
  const candidates = items
    .filter((i) => !passive(i) && i.status !== "completado" && i.flexible)
    .sort(
      (a, b) =>
        Number(conflicts.some((c) => c.itemIds.includes(b.id))) -
        Number(conflicts.some((c) => c.itemIds.includes(a.id))),
    );
  return (
    <KeyboardAvoidingView
      style={s.page}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ChatHeader />
      <ScrollView
        ref={scroll}
        contentContainerStyle={{ paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[s.small, { textAlign: "center", margin: 12 }]}>
          Asistente local · sin IA externa · tú decides los cambios
        </Text>
        <ChatMessage
          isUser={false}
          message="Hola, soy Neka. Hagamos espacio para lo que importa. ¿Revisamos tu planificación?"
        />
        {data.messages.map((m) => (
          <ChatMessage key={m.id} message={m.text} isUser={m.isUser} />
        ))}
        <View style={{ padding: 20, gap: 12 }}>
          <View style={s.wrap}>
            {["Revisar conflictos", "Mis pendientes", "Crear rutina"].map(
              (title) => (
                <Chip key={title} title={title} onPress={() => send(title)} />
              ),
            )}
          </View>
          <Button
            title="Crear ítem con Neka"
            secondary
            onPress={() => setEditor(newItem())}
          />
          <Text style={s.heading}>Opciones de reorganización</Text>
          {!candidates.length && (
            <Text style={s.subtitle}>
              No hay ítems flexibles pendientes. Crea uno o activa «Neka puede
              proponer moverlo» en su formulario.
            </Text>
          )}
          {candidates.map((i) => (
            <View key={i.id} style={s.card}>
              <Text style={s.heading}>{i.title}</Text>
              <Text style={s.small}>
                {i.scheduledAt
                  ? displayDate(i.scheduledAt)
                  : "Todavía sin horario"}
              </Text>
              <Button
                title={`Buscar hueco para ${i.title}`}
                secondary
                small
                onPress={() => suggest(i.id)}
              />
            </View>
          ))}
          {!!error && <Text style={s.error}>{error}</Text>}
          {conflicts.length > 0 && (
            <View style={s.card}>
              <Text style={[s.heading, { color: colors.red }]}>
                Conflictos detectados
              </Text>
              {conflicts.map((c) => (
                <View key={c.id} style={{ gap: 6 }}>
                  <Text style={s.text}>{c.description}</Text>
                  <Button
                    title="Revisar ítem"
                    secondary
                    small
                    onPress={() =>
                      setEditor(items.find((i) => i.id === c.itemIds[0])!)
                    }
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      <ChatInput onSend={send} />
      {editor && (
        <ItemEditor
          key={editor.id}
          item={editor}
          onClose={() => setEditor(null)}
        />
      )}
      <Sheet
        visible={!!proposal}
        title="Propuesta de Neka"
        onClose={() => setProposal(null)}
      >
        {proposal && (
          <>
            <Text style={s.heading}>
              {items.find((i) => i.id === proposal.itemId)?.title}
            </Text>
            <Text style={s.text}>Antes: {displayDate(proposal.previous)}</Text>
            <Text style={[s.heading, { color: colors.primary }]}>
              Propuesto: {displayDate(proposal.next)}
            </Text>
            <Text style={s.subtitle}>{proposal.reason}</Text>
            <Text style={s.small}>
              Solo se modifica el horario planificado de este ítem. Su plazo y
              los demás compromisos se conservan.
            </Text>
            <Button
              title="Aceptar cambio"
              onPress={() => {
                try {
                  change((d) => applyProposal(d, proposal));
                  respond(
                    `Listo: ${items.find((i) => i.id === proposal.itemId)?.title} quedó para ${displayDate(proposal.next)}.`,
                  );
                  setProposal(null);
                  setError("");
                } catch (e) {
                  setError((e as Error).message);
                  setProposal(null);
                }
              }}
            />
            <Button
              title="Mantener horario actual"
              secondary
              onPress={() => setProposal(null)}
            />
          </>
        )}
      </Sheet>
      <Sheet
        visible={grouping}
        title="Agrupar con Neka"
        onClose={() => setGrouping(false)}
      >
        <Field
          label="Nombre de la nueva rutina"
          value={groupName}
          onChange={setGroupName}
        />
        {items.map((i) => (
          <Toggle
            key={i.id}
            label={`${i.title} · ${data.workspaces.find((w) => w.id === i.workspaceId)?.name}`}
            value={ids.includes(i.id)}
            onChange={(on) =>
              setIds(on ? [...ids, i.id] : ids.filter((id) => id !== i.id))
            }
          />
        ))}
        <Button
          title="Crear grupo con estos ítems"
          onPress={() => {
            try {
              const chosen = items.filter((i) => ids.includes(i.id));
              if (!groupName.trim() || !chosen.length)
                throw new Error(
                  "Indica un nombre y selecciona al menos un ítem.",
                );
              if (new Set(chosen.map((i) => i.workspaceId)).size !== 1)
                throw new Error("Selecciona ítems de un mismo espacio.");
              const group = {
                id: uid(),
                name: groupName.trim(),
                workspaceId: chosen[0].workspaceId,
              };
              change((d) => ({
                ...d,
                groups: [...d.groups, group],
                items: d.items.map((i) =>
                  ids.includes(i.id) ? { ...i, groupId: group.id } : i,
                ),
              }));
              setGrouping(false);
              setIds([]);
              setGroupName("");
              setError("");
              respond(
                `Creé la rutina «${group.name}». Puedes reutilizarla desde tu espacio.`,
              );
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        />
        {!!error && <Text style={s.error}>{error}</Text>}
      </Sheet>
    </KeyboardAvoidingView>
  );
}
