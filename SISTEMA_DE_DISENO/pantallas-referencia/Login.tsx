import React, { useState } from "react";
import { View } from "react-native";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, firebaseConfigured } from "../utils/firebase";
import { space } from "../styles/theme";
import { Button, Card, Field, Txt } from "../components/ui/base";

type Target = "email" | "password" | "confirmation" | "general";
type Notice = { text: string; target: Target; info?: boolean } | null;

function errorNotice(error: unknown): Notice {
  const code = (error as { code?: string }).code ?? "";
  const known: Record<string, Notice> = {
    "auth/invalid-credential": {
      text: "Correo o contraseña incorrectos.",
      target: "general",
    },
    "auth/invalid-email": {
      text: "Escribe un correo válido.",
      target: "email",
    },
    "auth/email-already-in-use": {
      text: "Ese correo ya tiene una cuenta. Inicia sesión.",
      target: "email",
    },
    "auth/weak-password": {
      text: "Usa al menos 6 caracteres.",
      target: "password",
    },
    "auth/network-request-failed": {
      text: "Sin conexión. Revisa tu internet y reintenta.",
      target: "general",
    },
    "auth/operation-not-allowed": {
      text: "Activa Email/Password en Firebase Authentication.",
      target: "general",
    },
    "auth/too-many-requests": {
      text: "Demasiados intentos. Espera un momento y reintenta.",
      target: "general",
    },
  };
  return (
    known[code] ?? {
      text: "No se pudo completar. Revisa tu conexión y reintenta.",
      target: "general",
    }
  );
}

export default function Login({ onGuest }: { onGuest?: () => void }) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [confirmation, setConfirmation] = useState(""),
    [register, setRegister] = useState(false),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState<Notice>(null);
  const errorFor = (target: Target) =>
    notice && !notice.info && notice.target === target
      ? notice.text
      : undefined;
  const run = async (reset = false) => {
    if (!auth) return;
    setBusy(true);
    setNotice(null);
    try {
      if (!email.trim()) throw { code: "auth/invalid-email" };
      if (reset) {
        await sendPasswordResetEmail(auth, email.trim());
        setNotice({
          text: "Si existe una cuenta con ese correo, te enviamos las instrucciones.",
          target: "general",
          info: true,
        });
      } else if (register) {
        if (password !== confirmation) {
          setNotice({
            text: "Las contraseñas no coinciden.",
            target: "confirmation",
          });
          return;
        }
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (e) {
      setNotice(errorNotice(e));
    } finally {
      setBusy(false);
    }
  };
  if (!firebaseConfigured)
    return (
      <Card>
        <Txt variant="headline">Las cuentas no están configuradas</Txt>
        <Txt tone="secondary">
          Puedes usar Nekal como invitado. Para activar cuentas, completa
          front/.env.local siguiendo DOCUMENTOS/V1/V1.md.
        </Txt>
        {!!onGuest && (
          <Button title="Continuar como invitado" onPress={onGuest} />
        )}
      </Card>
    );
  return (
    <View style={{ gap: space.lg }}>
      <Card>
        <Txt variant="title">
          {register ? "Crear cuenta" : "Iniciar sesión"}
        </Txt>
        <Field
          label="Correo electrónico"
          value={email}
          onChange={setEmail}
          keyboardType="email-address"
          error={errorFor("email")}
        />
        <Field
          label="Contraseña"
          value={password}
          onChange={setPassword}
          secure
          error={errorFor("password")}
        />
        {register && (
          <Field
            label="Confirmar contraseña"
            value={confirmation}
            onChange={setConfirmation}
            secure
            error={errorFor("confirmation")}
          />
        )}
        <Button
          title={busy ? "Conectando…" : register ? "Registrarme" : "Entrar"}
          disabled={busy}
          onPress={() => void run()}
        />
        {notice?.target === "general" && (
          <Txt
            variant="callout"
            tone={notice.info ? "primary" : "danger"}
            accessibilityRole="alert"
          >
            {notice.text}
          </Txt>
        )}
        <Button
          title={register ? "Ya tengo una cuenta" : "Crear una cuenta"}
          variant="secondary"
          disabled={busy}
          onPress={() => {
            setRegister(!register);
            setNotice(null);
            setPassword("");
            setConfirmation("");
          }}
        />
        {!register && (
          <Button
            title="Recuperar contraseña"
            variant="plain"
            disabled={busy}
            onPress={() => void run(true)}
          />
        )}
      </Card>
      {!!onGuest && (
        <View style={{ gap: space.sm }}>
          <Button
            title="Continuar como invitado"
            variant="secondary"
            disabled={busy}
            onPress={onGuest}
          />
          <Txt variant="caption" tone="secondary" align="center">
            Como invitado, tus datos quedan solo en este dispositivo.
          </Txt>
        </View>
      )}
    </View>
  );
}
