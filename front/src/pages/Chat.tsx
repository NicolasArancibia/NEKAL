import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { Chip, ScreenHeader, Segmentos, Txt } from "../components/ui/base";
import { BandejaCorreo } from "../components/ui/correo";
import { color, space } from "../styles/theme";
import ChatMessage from "../components/ui/ChatUi/ChatMessage";
import ChatInput from "../components/ui/ChatUi/ChatInput";
import InterruptorVoz from "../components/ui/neka/InterruptorVoz";
import TarjetaPlan from "../components/ui/neka/TarjetaPlan";
import { useChatSinIA } from "../components/ui/neka/ChatSinIA";
import { useApp } from "../utils/AppContext";
import { useNeka } from "../utils/NekaContext";
import { firebaseConfigured } from "../utils/firebase";
import { estadoVisible } from "../utils/agente/mensajes";

const ATAJOS = ["Voy atrasado", "¿Qué tengo hoy?", "Arregla los choques"];

// Pestaña IA (spec H3 §6.4): arriba Chat | Correo.
// Chat con Neka (spec D §5.1). La hoja del plan es global (TabNavigator). Si la
// IA falla (sin internet o sin cupo), vuelven las secciones de la V1 y cada
// mensaje escrito la reintenta; sin Firebase, todo es el chat de la V1.
export default function Chat() {
  const [modo, setModo] = useState<"chat" | "correo">("chat");
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: color.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ paddingHorizontal: space.screen, gap: space.md }}>
        <ScreenHeader
          title="IA"
          right={modo === "chat" ? <InterruptorVoz /> : undefined}
        />
        <Segmentos
          opciones={[
            ["chat", "Chat"],
            ["correo", "Correo"],
          ]}
          valor={modo}
          onCambio={setModo}
        />
      </View>
      {modo === "correo" ? (
        <BandejaCorreo />
      ) : (
        <ChatConNeka />
      )}
    </KeyboardAvoidingView>
  );
}

// El chat de Neka de siempre, sin cambios.
function ChatConNeka() {
  const { data } = useApp();
  const neka = useNeka();
  const sinIA = useChatSinIA();
  const conIA = firebaseConfigured && !neka.sinIA;
  const scroll = useRef<ScrollView>(null);
  return (
    <>
      <ScrollView
        ref={scroll}
        onContentSizeChange={() =>
          scroll.current?.scrollToEnd({ animated: true })
        }
        contentContainerStyle={{ paddingBottom: space.xl }}
        keyboardShouldPersistTaps="handled"
      >
        <Txt
          variant="caption"
          tone="secondary"
          align="center"
          style={{ margin: space.md }}
        >
          Neka usa Gemini de Google. Tú apruebas cada cambio.
        </Txt>
        <ChatMessage
          isUser={false}
          message="Hola, soy Neka. Dime qué necesitas o mantén el micrófono para hablarme."
        />
        {data.messages.map((m) =>
          m.plan ? (
            <TarjetaPlan
              key={m.id}
              resumen={m.plan}
              estado={estadoVisible(m, neka.pendienteId)}
              onAbrir={() => neka.abrirPlan(m.id)}
            />
          ) : (
            <ChatMessage
              key={m.id}
              message={m.text}
              isUser={m.isUser}
              audio={m.audio}
              onLeer={m.isUser ? undefined : () => neka.leer(m.text)}
            />
          ),
        )}
        {!!neka.aviso && !neka.pensando && (
          <ChatMessage isUser={false} message={neka.aviso} />
        )}
        {neka.pensando && (
          <ChatMessage isUser={false} message="Neka está pensando…" />
        )}
        {conIA ? (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: space.sm,
              padding: space.screen,
            }}
          >
            {ATAJOS.map((t) => (
              <Chip key={t} title={t} onPress={() => neka.enviar(t, "chat")} />
            ))}
          </View>
        ) : (
          sinIA.secciones
        )}
        {!!neka.error && (
          <Txt
            variant="callout"
            tone="danger"
            accessibilityRole="alert"
            style={{ marginHorizontal: space.screen }}
          >
            {neka.error}
          </Txt>
        )}
      </ScrollView>
      <ChatInput
        onSend={firebaseConfigured ? (t) => neka.enviar(t, "chat") : sinIA.send}
        onMicIn={
          firebaseConfigured ? () => neka.empezarGrabar("chat") : undefined
        }
        onMicOut={neka.soltar}
        grabando={neka.grabando}
      />
      {sinIA.hojas}
    </>
  );
}
