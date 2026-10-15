import React, { useState } from "react";
import { Text, View } from "react-native";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, firebaseConfigured } from "../utils/firebase";
import { Button, Field } from "../components/ui/Common";
import { s } from "../styles/globalStyles";
function errorText(error: unknown) {
  const code = (error as { code?: string }).code;
  return (
    (
      {
        "auth/invalid-credential": "Correo o contraseña incorrectos.",
        "auth/invalid-email": "El correo no es válido.",
        "auth/email-already-in-use": "Ese correo ya tiene una cuenta.",
        "auth/weak-password": "Usa una contraseña de al menos 6 caracteres.",
        "auth/network-request-failed":
          "No hay conexión con Firebase. Inténtalo de nuevo.",
        "auth/operation-not-allowed":
          "Activa Email/Password en Firebase Authentication.",
        "auth/too-many-requests":
          "Demasiados intentos. Espera antes de volver a intentarlo.",
      } as Record<string, string>
    )[code ?? ""] ??
    "No se pudo completar la operación. Revisa la configuración de Firebase y tu conexión."
  );
}
export default function Login({ onGuest }: { onGuest?: () => void }) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [confirmation, setConfirmation] = useState(""),
    [register, setRegister] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const run = async (reset = false) => {
    if (!auth) return;
    setBusy(true);
    setMessage("");
    try {
      if (!email.trim()) throw { code: "auth/invalid-email" };
      if (reset) {
        await sendPasswordResetEmail(auth, email.trim());
        setMessage(
          "Si existe una cuenta, recibirás las instrucciones para recuperar el acceso.",
        );
      } else if (register) {
        if (password !== confirmation) {
          setMessage("Las contraseñas no coinciden.");
          return;
        }
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (e) {
      setMessage(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  if (!firebaseConfigured)
    return (
      <View style={s.card}>
        <Text style={s.heading}>Firebase aún no está configurado</Text>
        <Text style={s.text}>
          Puedes usar todas las funciones locales. Para activar cuentas,
          configura el proyecto Firebase siguiendo documentacion/V1.md.
        </Text>
        <Text style={s.small}>
          Se necesita registrar una app web, habilitar Email/Password y
          Firestore, y completar front/.env.local. No ingreses claves de
          administrador.
        </Text>
        {!!onGuest && (
          <Button title="Continuar como invitado" onPress={onGuest} />
        )}
      </View>
    );
  return (
    <View style={{ gap: 16 }}>
      <View style={s.card}>
        <Text style={s.heading}>
          {register ? "Crear cuenta" : "Iniciar sesión"}
        </Text>
        <Text style={s.small}>
          Cada cuenta tiene su propio espacio. Los datos del modo local se
          conservan separados; puedes transferirlos mediante un respaldo.
        </Text>
        <Field
          label="Correo electrónico"
          value={email}
          onChange={setEmail}
          keyboardType="email-address"
        />
        <Field
          label="Contraseña"
          value={password}
          onChange={setPassword}
          secure
        />
        {register && (
          <Field
            label="Confirmar contraseña"
            value={confirmation}
            onChange={setConfirmation}
            secure
          />
        )}
        <Button
          title={busy ? "Conectando…" : register ? "Registrarme" : "Entrar"}
          disabled={busy}
          onPress={() => void run()}
        />
        <Button
          title={register ? "Ya tengo una cuenta" : "Crear una cuenta"}
          secondary
          disabled={busy}
          onPress={() => {
            setRegister(!register);
            setMessage("");
            setPassword("");
            setConfirmation("");
          }}
        />
        <Button
          title="Recuperar contraseña"
          secondary
          disabled={busy}
          onPress={() => void run(true)}
        />
        {!!message && (
          <Text accessibilityRole="alert" style={s.error}>
            {message}
          </Text>
        )}
      </View>
      {!!onGuest && (
        <View style={{ gap: 10 }}>
          <Button
            title="Continuar como invitado"
            secondary
            disabled={busy}
            onPress={onGuest}
          />
          <Text style={[s.small, { textAlign: "center" }]}>
            Como invitado, tus datos se guardan solo en este dispositivo. No se
            sincronizan con una cuenta y se pierden si borras el almacenamiento
            de la app.
          </Text>
        </View>
      )}
    </View>
  );
}
