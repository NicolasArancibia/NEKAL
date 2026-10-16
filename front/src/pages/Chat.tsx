import React, { useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";
import {
  Button,
  Card,
  Chip,
  Field,
  ScreenHeader,
  Sheet,
  Toggle,
  Txt,
  nekaImage,
} from "../components/ui/base";
import { color, space } from "../styles/theme";
import ChatMessage from "../components/ui/ChatUi/ChatMessage";
import ChatInput from "../components/ui/ChatUi/ChatInput";
import ItemEditor from "../components/ui/ItemEditor";
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

const many = (n: number, one: string, more: string) =>
  `${n} ${n === 1 ? one : more}`;

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
    const normalized = text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    let reply =
      "Puedo revisar choques, mostrarte pendientes, buscar un hueco o crear algo. Prueba «crear tarea: título».";
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
      reply = "Listo. Revisa el formulario y guarda.";
    } else if (/grupo|rutina|agrupar/.test(normalized)) {
      setGrouping(true);
      reply = "Elige qué ítems agrupar. Tienen que ser del mismo espacio.";
    } else if (/conflicto|choque|organiza|hueco|planifica/.test(normalized)) {
      reply = conflicts.length
        ? `Encontré ${many(conflicts.length, "choque", "choques")}:\n${conflicts
            .slice(0, 5)
            .map((c) => c.description)
            .join(
              "\n",
            )}\nAbajo puedes buscar otro horario. Los compromisos fijos no se mueven.`
        : "No hay choques. Abajo puedes buscar horario para lo flexible.";
    } else if (/resumen|pendiente|hoy/.test(normalized)) {
      const pending = items.filter(
        (i) => !passive(i) && i.status !== "completado",
      );
      reply = pending.length
        ? `Tienes ${many(pending.length, "pendiente", "pendientes")}:\n${pending
            .slice(0, 8)
            .map(
              (i) =>
                `• ${i.title}${i.scheduledAt ? " · " + displayDate(i.scheduledAt) : " · sin horario"}`,
            )
            .join("\n")}`
        : "No tienes pendientes.";
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
        : "No encontré un hueco en los próximos 30 días. Revisa el plazo, tu jornada o las dependencias sin horario.",
    );
  };
  const candidates = items
    .filter((i) => !passive(i) && i.status !== "completado" && i.flexible)
    .sort(
      (a, b) =>
        Number(conflicts.some((c) => c.itemIds.includes(b.id))) -
        Number(conflicts.some((c) => c.itemIds.includes(a.id))),
    );
  const proposed = proposal
    ? items.find((i) => i.id === proposal.itemId)
    : undefined;
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: color.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ paddingHorizontal: space.screen }}>
        <ScreenHeader title="Neka" />
      </View>
      <ScrollView
        ref={scroll}
        contentContainerStyle={{ paddingBottom: space.xl }}
        keyboardShouldPersistTaps="handled"
      >
        <Txt
          variant="caption"
          tone="secondary"
          align="center"
          style={{ margin: space.md }}
        >
          Neka funciona en tu dispositivo. Tú apruebas cada cambio.
        </Txt>
        <ChatMessage
          isUser={false}
          message="Hola, soy Neka. Puedo revisar choques, mostrarte pendientes o buscar un hueco para algo."
        />
        {data.messages.map((m) => (
          <ChatMessage key={m.id} message={m.text} isUser={m.isUser} />
        ))}
        <View style={{ padding: space.screen, gap: space.md }}>
          <View
            style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}
          >
            {["Revisar conflictos", "Mis pendientes", "Crear rutina"].map(
              (title) => (
                <Chip key={title} title={title} onPress={() => send(title)} />
              ),
            )}
          </View>
          <Button
            title="Crear ítem con Neka"
            variant="secondary"
            onPress={() => setEditor(newItem())}
          />
          {conflicts.length > 0 && (
            <>
              <Txt variant="headline" style={{ marginTop: space.sm }}>
                Choques
              </Txt>
              <Card>
                {conflicts.map((c) => (
                  <View key={c.id} style={{ gap: space.xs }}>
                    <Txt>{c.description}</Txt>
                    <View style={{ alignSelf: "flex-start" }}>
                      <Button
                        title="Revisar"
                        variant="plain"
                        small
                        onPress={() =>
                          setEditor(
                            items.find((i) => i.id === c.itemIds[0]) ?? null,
                          )
                        }
                      />
                    </View>
                  </View>
                ))}
              </Card>
            </>
          )}
          <Txt variant="headline" style={{ marginTop: space.sm }}>
            Buscar un hueco
          </Txt>
          {!candidates.length && (
            <Txt tone="secondary">
              No hay ítems flexibles pendientes. Activa «Neka puede proponer
              moverlo» en un ítem para verlo aquí.
            </Txt>
          )}
          {candidates.map((i) => (
            <Card
              key={i.id}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Txt weight={600} numberOfLines={1}>
                  {i.title}
                </Txt>
                <Txt variant="callout" tone="secondary">
                  {i.scheduledAt ? displayDate(i.scheduledAt) : "Sin horario"}
                </Txt>
              </View>
              <Button
                title="Buscar hueco"
                variant="secondary"
                small
                onPress={() => suggest(i.id)}
              />
            </Card>
          ))}
          {!!error && (
            <Txt variant="callout" tone="danger" accessibilityRole="alert">
              {error}
            </Txt>
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
        size="auto"
        onClose={() => setProposal(null)}
      >
        {proposal && (
          <>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: space.md,
              }}
            >
              <Image
                source={nekaImage(7)}
                resizeMode="contain"
                accessibilityElementsHidden
                importantForAccessibility="no"
                style={{ width: 56, height: 64 }}
              />
              <Txt variant="headline" style={{ flex: 1 }}>
                {proposed?.title}
              </Txt>
            </View>
            <Card>
              <View style={{ gap: 2 }}>
                <Txt variant="caption" tone="secondary">
                  Antes
                </Txt>
                <Txt>{displayDate(proposal.previous)}</Txt>
              </View>
              <View style={{ gap: 2 }}>
                <Txt variant="caption" tone="secondary">
                  Propuesto
                </Txt>
                <Txt weight={700} tone="primary">
                  {displayDate(proposal.next)}
                </Txt>
              </View>
              <Txt variant="callout" tone="secondary">
                {proposal.reason}
              </Txt>
            </Card>
            <Button
              title="Aceptar"
              onPress={() => {
                try {
                  change((d) => applyProposal(d, proposal));
                  respond(
                    `Listo: «${proposed?.title}» quedó para ${displayDate(proposal.next)}`,
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
              title="Descartar"
              variant="secondary"
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
          title="Crear rutina"
          onPress={() => {
            try {
              const chosen = items.filter((i) => ids.includes(i.id));
              if (!groupName.trim() || !chosen.length)
                throw new Error("Ponle un nombre y elige al menos un ítem.");
              if (new Set(chosen.map((i) => i.workspaceId)).size !== 1)
                throw new Error("Elige ítems de un mismo espacio.");
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
        {!!error && (
          <Txt variant="callout" tone="danger" accessibilityRole="alert">
            {error}
          </Txt>
        )}
      </Sheet>
    </KeyboardAvoidingView>
  );
}
