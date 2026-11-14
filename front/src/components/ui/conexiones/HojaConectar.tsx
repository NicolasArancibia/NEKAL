import { useEffect, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { color, radius, shadow, size, space } from "../../../styles/theme";
import { useConexiones } from "../../../utils/ConexionesContext";
import { abrirHoja, useHojasAbiertas } from "../../../utils/hojasAbiertas";
import type { Proveedor } from "../../../utils/conexiones/tipos";
import { googleDisponible } from "../../../utils/conexiones/google";
import { microsoftDisponible } from "../../../utils/conexiones/microsoft";
import { Button, PressableScale, Txt, nekaImage } from "../base";
import LogoCuenta, { NOMBRE_PROVEEDOR } from "./LogoCuenta";

const DETALLE: Record<Proveedor, string> = {
  google: "Calendar y Gmail",
  microsoft: "Calendario y correo de Microsoft",
};
const ERROR: Record<string, string> = {
  cancelado: "Cancelaste el permiso.",
  red: "Se perdió la conexión. Reintenta.",
};

function FilaProveedor({
  proveedor,
  detalle,
  derecha,
  onPress,
}: {
  proveedor: Proveedor;
  detalle: string;
  derecha: React.ReactNode;
  onPress?: () => void;
}) {
  const contenido = (
    <>
      <LogoCuenta proveedor={proveedor} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Txt variant="headline">{NOMBRE_PROVEEDOR[proveedor]}</Txt>
        <Txt variant="caption" tone="secondary" numberOfLines={2}>
          {detalle}
        </Txt>
      </View>
      {derecha}
    </>
  );
  const estilo = {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: space.md,
    minHeight: 64,
    padding: space.md,
    borderRadius: radius.badge,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.surface,
  };
  return onPress ? (
    <PressableScale
      accessibilityLabel={`Conectar ${NOMBRE_PROVEEDOR[proveedor]}`}
      onPress={onPress}
      style={estilo}
    >
      {contenido}
    </PressableScale>
  ) : (
    <View style={estilo}>{contenido}</View>
  );
}

// «Conecta tus cuentas» (maqueta H/05 A1/A2): una vez por cuenta y al volver de Google u Outlook.
export default function HojaConectar() {
  const c = useConexiones();
  const hojas = useHojasAbiertas();
  const vuelta = c.ultima?.origen === "inicio" ? c.ultima : null;
  const [mostrar, setMostrar] = useState(false);
  // Entra solo sin otras hojas; una vez a la vista, su propia cuenta no la esconde.
  const visible = !!vuelta || (c.ofrecer && (mostrar || hojas === 0));

  // Medio segundo de margen: en el iPhone un Modal no aparece mientras otro se va.
  useEffect(() => {
    if (!visible) return setMostrar(false);
    const t = setTimeout(() => setMostrar(true), 500);
    return () => clearTimeout(t);
  }, [visible]);
  // Cuenta como hoja abierta: el modal de logro espera a que se cierre.
  useEffect(() => (mostrar ? abrirHoja() : undefined), [mostrar]);

  if (!mostrar) return null;
  const conectados = new Set(c.cuentas.map((x) => x.proveedor));
  const disponibles = (["google", "microsoft"] as Proveedor[]).filter((p) =>
    p === "google" ? googleDisponible : microsoftDisponible,
  );
  const conectar = (p: Proveedor) => {
    c.marcarOfrecido();
    c.limpiarUltima();
    c.conectar(p, "inicio");
  };
  const cerrar = () => {
    c.marcarOfrecido();
    c.limpiarUltima();
  };

  let pose: 1 | 3 = 3,
    titulo = "Conecta tus cuentas",
    texto =
      "Trae tu calendario y tu correo. Neka ve tu día completo y te ayuda a responder.";
  let filas = disponibles.map((p) => (
    <FilaProveedor
      key={p}
      proveedor={p}
      detalle={DETALLE[p]}
      onPress={() => conectar(p)}
      derecha={
        <Ionicons
          name="chevron-forward-outline"
          size={18}
          color={color.lineStrong}
        />
      }
    />
  ));
  let pie = (
    <>
      <Button title="Ahora no" variant="plain" onPress={cerrar} />
      <Txt variant="caption" tone="secondary" align="center">
        Puedes conectarlas cuando quieras en Ajustes.
      </Txt>
    </>
  );
  if (vuelta?.ok) {
    const nombre = NOMBRE_PROVEEDOR[vuelta.proveedor];
    pose = 1;
    titulo = `${nombre} conectado`;
    texto =
      "Tu cuenta quedó lista. Pronto Neka traerá tus eventos y tu correo.";
    filas = [
      <FilaProveedor
        key="ok"
        proveedor={vuelta.proveedor}
        detalle={vuelta.correo ?? ""}
        derecha={
          <Ionicons
            name="checkmark-circle-outline"
            size={size.icon}
            color={color.success}
          />
        }
      />,
      ...disponibles
        .filter((p) => !conectados.has(p))
        .map((p) => (
          <FilaProveedor
            key={p}
            proveedor={p}
            detalle={`¿También usas ${NOMBRE_PROVEEDOR[p]}?`}
            onPress={() => conectar(p)}
            derecha={
              <Txt variant="callout" weight={700} tone="primary">
                Conectar
              </Txt>
            }
          />
        )),
    ];
    pie = <Button title="Continuar" onPress={cerrar} />;
  } else if (vuelta) {
    const nombre = NOMBRE_PROVEEDOR[vuelta.proveedor];
    titulo = `No se conectó ${nombre}`;
    texto = ERROR[vuelta.error ?? ""] ?? "Algo no calzó. Reintenta.";
    pie = (
      <>
        <Button title="Reintentar" onPress={() => conectar(vuelta.proveedor)} />
        <Button title="Ahora no" variant="plain" onPress={cerrar} />
      </>
    );
  }

  return (
    <Modal
      transparent
      visible
      animationType="fade"
      statusBarTranslucent
      onRequestClose={cerrar}
    >
      <View style={{ flex: 1, justifyContent: "center", padding: space.xl }}>
        <Pressable
          accessibilityLabel="Ahora no"
          onPress={cerrar}
          style={[StyleSheet.absoluteFill, { backgroundColor: color.backdrop }]}
        />
        <View
          accessibilityViewIsModal
          style={{
            backgroundColor: color.surface,
            borderRadius: radius.lg,
            paddingTop: 64,
            paddingHorizontal: space.xl,
            paddingBottom: space.md,
            gap: space.md,
            boxShadow: shadow.raised,
          }}
        >
          <Image
            aria-hidden
            source={nekaImage(pose)}
            resizeMode="contain"
            style={{
              position: "absolute",
              top: -56,
              alignSelf: "center",
              width: 104,
              height: 118,
            }}
          />
          <Txt variant="title" align="center">
            {titulo}
          </Txt>
          <Txt variant="callout" tone="secondary" align="center">
            {texto}
          </Txt>
          {filas}
          {pie}
        </View>
      </View>
    </Modal>
  );
}
