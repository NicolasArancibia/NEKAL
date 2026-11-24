import { useEffect, useState } from "react";
import { Platform, Share, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { color, size, space } from "../../../styles/theme";
import { useApp } from "../../../utils/AppContext";
import { Busqueda, useAmigos } from "../../../utils/AmigosContext";
import { AVISOS, otroDe } from "../../../utils/amigos/amistades";
import { mostrarCodigo } from "../../../utils/amigos/codigo";
import { haptic } from "../../../utils/haptics";
import {
  Button,
  Card,
  Field,
  PressableScale,
  SectionTitle,
  Sheet,
  Txt,
} from "../base";
import FilaAmigo from "./FilaAmigo";
import Inicial from "./Inicial";
import PerfilAmigo from "./PerfilAmigo";
import TarjetaSolicitud from "./TarjetaSolicitud";

export type Pagina =
  { tipo: "amigos" } | { tipo: "agregar" } | { tipo: "amigo"; uid: string };

// La hoja Amigos (spec F §6.2): tres páginas en un mismo Sheet; ‹ vuelve.
export default function HojaAmigos({
  pagina,
  onPagina,
  onClose,
  onEditarPerfil,
}: {
  pagina: Pagina | null;
  onPagina: (p: Pagina) => void;
  onClose: () => void;
  onEditarPerfil: () => void;
}) {
  const a = useAmigos();
  const [aviso, setAviso] = useState("");
  useEffect(() => {
    if (!pagina) setAviso("");
  }, [pagina]);
  const fila =
    pagina?.tipo === "amigo"
      ? a.amigos.find((f) => f.uid === pagina.uid)
      : undefined;
  // Si el amigo se eliminó (aquí o desde el otro teléfono), vuelve a la lista.
  useEffect(() => {
    if (pagina?.tipo === "amigo" && !fila) onPagina({ tipo: "amigos" });
  }, [pagina, fila]);
  const titulo =
    pagina?.tipo === "agregar"
      ? "Agregar amigo"
      : pagina?.tipo === "amigo" && fila
        ? fila.nombre
        : "Amigos";
  const volver = (
    <PressableScale
      onPress={() => onPagina({ tipo: "amigos" })}
      accessibilityRole="button"
      accessibilityLabel="Volver a Amigos"
      style={{
        minHeight: size.minTouch,
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
        alignSelf: "flex-start",
        marginLeft: -space.sm,
        marginTop: -space.sm,
      }}
    >
      <Ionicons
        name="chevron-back-outline"
        size={size.icon}
        color={color.primary}
      />
      <Txt variant="body" weight={600} tone="primary">
        Amigos
      </Txt>
    </PressableScale>
  );
  return (
    <Sheet
      visible={!!pagina}
      title={titulo}
      onClose={onClose}
      pagina={pagina?.tipo === "amigo" ? pagina.uid : pagina?.tipo}
    >
      {a.estado === "sin-conexion" && (
        <Txt variant="callout" tone="secondary">
          {AVISOS["sin-conexion"]}
        </Txt>
      )}
      {pagina?.tipo === "amigos" && (
        <PaginaAmigos
          aviso={aviso}
          onAgregar={() => {
            setAviso("");
            onPagina({ tipo: "agregar" });
          }}
          onAmigo={(uid) => onPagina({ tipo: "amigo", uid })}
          onEditarPerfil={onEditarPerfil}
        />
      )}
      {pagina?.tipo === "agregar" && (
        <>
          {volver}
          <PaginaAgregar
            onEnviada={(nombre) => {
              setAviso(`Le enviamos tu solicitud a ${nombre}.`);
              onPagina({ tipo: "amigos" });
            }}
            onAceptada={() => onPagina({ tipo: "amigos" })}
          />
        </>
      )}
      {pagina?.tipo === "amigo" && fila && (
        <>
          {volver}
          <PerfilAmigo fila={fila} onEliminar={() => a.borrar(fila.id)} />
        </>
      )}
    </Sheet>
  );
}

function PaginaAmigos({
  aviso,
  onAgregar,
  onAmigo,
  onEditarPerfil,
}: {
  aviso: string;
  onAgregar: () => void;
  onAmigo: (uid: string) => void;
  onEditarPerfil: () => void;
}) {
  const { data } = useApp();
  const a = useAmigos();
  const [texto, setTexto] = useState("");
  const compartir = async () => {
    if (!a.miCodigo) return;
    const message = `Agrégame en Nekal con mi código ${mostrarCodigo(a.miCodigo)}`;
    const nav = (globalThis as { navigator?: { share?: unknown } }).navigator;
    // En un navegador sin menú de compartir, se muestra el texto para copiarlo.
    if (Platform.OS === "web" && typeof nav?.share !== "function")
      return setTexto(message);
    try {
      await Share.share({ message });
    } catch (e) {
      if ((e as Error).name !== "AbortError") setTexto(message);
    }
  };
  if (!data.profile.name.trim() && !a.miCodigo)
    return (
      <Card style={{ gap: space.md }}>
        <Txt variant="headline">Primero, tu nombre</Txt>
        <Txt variant="callout" tone="secondary">
          Tus amigos te van a reconocer por tu nombre. Escríbelo y te damos tu
          código.
        </Txt>
        <Button title="Escribir mi nombre" onPress={onEditarPerfil} />
      </Card>
    );
  return (
    <>
      {!!aviso && (
        <Card
          variant="featured"
          style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={size.icon - 2}
            color={color.primary}
          />
          <Txt variant="callout" weight={600} accessibilityRole="alert">
            {aviso}
          </Txt>
        </Card>
      )}
      <Card style={{ gap: space.md }}>
        <View
          style={{ flexDirection: "row", alignItems: "center", gap: space.md }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="caption" tone="secondary">
              Tu código
            </Txt>
            <Txt variant="title" selectable numberOfLines={1}>
              {a.miCodigo ? mostrarCodigo(a.miCodigo) : "NEKA-…"}
            </Txt>
          </View>
          <Button
            title="Compartir"
            variant="secondary"
            small
            disabled={!a.miCodigo}
            onPress={() => void compartir()}
          />
        </View>
        {!!texto && (
          <Txt variant="callout" tone="secondary" selectable>
            {texto}
          </Txt>
        )}
        <Button title="Agregar con un código" onPress={onAgregar} />
      </Card>
      {!!a.recibidas.length && (
        <>
          <SectionTitle
            title="Solicitudes"
            detail={String(a.recibidas.length)}
          />
          {a.recibidas.map((s) => (
            <TarjetaSolicitud
              key={s.id}
              nombre={otroDe(s, a.yo!).nombre}
              onAceptar={() => a.aceptar(s.id)}
              onRechazar={() => a.borrar(s.id)}
            />
          ))}
        </>
      )}
      {!!a.enviadas.length && (
        <>
          <SectionTitle title="Enviadas" detail={String(a.enviadas.length)} />
          <Card style={{ gap: 0 }}>
            {a.enviadas.map((s, k) => (
              <View key={s.id}>
                {k > 0 && (
                  <View style={{ height: 1, backgroundColor: color.line }} />
                )}
                <Enviada
                  nombre={otroDe(s, a.yo!).nombre}
                  onCancelar={() => a.borrar(s.id)}
                />
              </View>
            ))}
          </Card>
        </>
      )}
      {!!a.amigos.length && (
        <>
          <SectionTitle title="Tus amigos" detail={String(a.amigos.length)} />
          <Card style={{ gap: 0 }}>
            {a.amigos.map((f, k) => (
              <View key={f.uid}>
                {k > 0 && (
                  <View style={{ height: 1, backgroundColor: color.line }} />
                )}
                <FilaAmigo fila={f} onPress={() => onAmigo(f.uid)} />
              </View>
            ))}
          </Card>
        </>
      )}
      {!!a.miCodigo && <CambiarCodigo />}
    </>
  );
}

function Enviada({
  nombre,
  onCancelar,
}: {
  nombre: string;
  onCancelar: () => Promise<void>;
}) {
  const [ocupado, setOcupado] = useState(false),
    [error, setError] = useState("");
  return (
    <View style={{ gap: space.xs }}>
      <View
        style={{
          minHeight: 60,
          flexDirection: "row",
          alignItems: "center",
          gap: space.md,
        }}
      >
        <Inicial nombre={nombre} size={40} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="headline" numberOfLines={1}>
            {nombre}
          </Txt>
          <Txt variant="caption" tone="secondary">
            Pendiente
          </Txt>
        </View>
        <Button
          title="Cancelar"
          variant="secondary"
          small
          disabled={ocupado}
          onPress={async () => {
            setOcupado(true);
            setError("");
            try {
              await onCancelar();
            } catch (e) {
              setError((e as Error).message);
              setOcupado(false);
            }
          }}
        />
      </View>
      {!!error && (
        <Txt variant="callout" tone="danger" accessibilityRole="alert">
          {error}
        </Txt>
      )}
    </View>
  );
}

// «Cambiar mi código» se confirma en la misma hoja (como Eliminar amigo).
function CambiarCodigo() {
  const a = useAmigos();
  const [confirmar, setConfirmar] = useState(false),
    [ocupado, setOcupado] = useState(false),
    [error, setError] = useState("");
  if (!confirmar)
    return (
      <Button
        title="Cambiar mi código"
        variant="plain"
        onPress={() => setConfirmar(true)}
      />
    );
  return (
    <Card style={{ backgroundColor: color.dangerSoft, gap: space.md }}>
      <Txt variant="callout">
        Tu código actual dejará de funcionar. Tus amigos no se pierden.
      </Txt>
      <View style={{ flexDirection: "row", gap: space.sm }}>
        <View style={{ flex: 1 }}>
          <Button
            title="Cambiar mi código"
            small
            disabled={ocupado}
            onPress={async () => {
              setOcupado(true);
              setError("");
              try {
                await a.cambiarCodigo();
                setConfirmar(false);
              } catch (e) {
                setError((e as Error).message);
              }
              setOcupado(false);
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            title="Cancelar"
            variant="secondary"
            small
            disabled={ocupado}
            onPress={() => setConfirmar(false)}
          />
        </View>
      </View>
      {!!error && (
        <Txt variant="callout" tone="danger" accessibilityRole="alert">
          {error}
        </Txt>
      )}
    </Card>
  );
}

function PaginaAgregar({
  onEnviada,
  onAceptada,
}: {
  onEnviada: (nombre: string) => void;
  onAceptada: () => void;
}) {
  const a = useAmigos();
  const [codigo, setCodigo] = useState(""),
    [busqueda, setBusqueda] = useState<Busqueda | null>(null),
    [ocupado, setOcupado] = useState<"" | "buscar" | "enviar" | "aceptar">(""),
    [error, setError] = useState("");
  const buscar = async () => {
    setOcupado("buscar");
    setError("");
    setBusqueda(await a.buscar(codigo));
    setOcupado("");
  };
  const aviso = busqueda?.tipo === "aviso" ? AVISOS[busqueda.aviso] : undefined;
  return (
    <>
      <Txt variant="callout" tone="secondary">
        Pídele su código a tu amigo. Lo encuentra en su Perfil, en Amigos.
      </Txt>
      <Field
        label="Código de tu amigo"
        value={codigo}
        onChange={(v) => {
          setCodigo(v);
          setBusqueda(null);
        }}
        error={
          busqueda?.tipo === "aviso" && busqueda.aviso !== "te-envio"
            ? aviso
            : undefined
        }
      />
      {busqueda?.tipo !== "encontrado" && (
        <Button
          title={ocupado === "buscar" ? "Buscando…" : "Buscar"}
          disabled={!!ocupado || !codigo.trim()}
          onPress={() => void buscar()}
        />
      )}
      {busqueda?.tipo === "aviso" && busqueda.aviso === "te-envio" && (
        <Card style={{ gap: space.md }}>
          <Txt variant="callout">{aviso}</Txt>
          <Button
            title="Aceptar"
            disabled={!!ocupado}
            onPress={async () => {
              setOcupado("aceptar");
              setError("");
              try {
                await a.aceptar(busqueda.id!);
                haptic.success();
                onAceptada();
              } catch (e) {
                setError((e as Error).message);
              }
              setOcupado("");
            }}
          />
        </Card>
      )}
      {busqueda?.tipo === "encontrado" && (
        <Card style={{ gap: space.md }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: space.md,
            }}
          >
            <Inicial nombre={busqueda.persona.nombre} size={40} />
            <View style={{ flex: 1, gap: 2 }}>
              <Txt variant="headline" numberOfLines={1}>
                {busqueda.persona.nombre}
              </Txt>
              <Txt variant="callout" tone="secondary">
                ¿Le envías una solicitud?
              </Txt>
            </View>
          </View>
          <Button
            title={ocupado === "enviar" ? "Enviando…" : "Enviar solicitud"}
            disabled={!!ocupado}
            onPress={async () => {
              setOcupado("enviar");
              setError("");
              try {
                await a.enviar(busqueda.persona, busqueda.codigo);
                haptic.success();
                onEnviada(busqueda.persona.nombre.split(" ")[0]);
              } catch (e) {
                setError((e as Error).message);
              }
              setOcupado("");
            }}
          />
        </Card>
      )}
      {!!error && (
        <Txt variant="callout" tone="danger" accessibilityRole="alert">
          {error}
        </Txt>
      )}
    </>
  );
}
