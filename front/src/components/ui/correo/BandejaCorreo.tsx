import { useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { color, size, space } from "../../../styles/theme";
import type { Item } from "../../../utils/model";
import { useConexiones } from "../../../utils/ConexionesContext";
import { googleDisponible } from "../../../utils/conexiones/google";
import { microsoftDisponible } from "../../../utils/conexiones/microsoft";
import { type CorreoEnLista, useCorreo } from "../../../utils/useCorreo";
import {
  eventoDesdeCorreo,
  resumenBandeja,
  tareaDesdeCorreo,
} from "../../../utils/conexiones/correoNeka";
import type { AvisoCuenta } from "../../../utils/conexiones/bandeja";
import { Button, Card, PressableScale, SectionTitle, Txt } from "../base";
import { NOMBRE_PROVEEDOR } from "../conexiones/LogoCuenta";
import ItemEditor from "../ItemEditor";
import CorreoAbierto, { type Respuesta } from "./CorreoAbierto";
import FilaCorreo from "./FilaCorreo";

const textoAviso = (a: AvisoCuenta) => {
  const nombre = NOMBRE_PROVEEDOR[a.cuenta.proveedor];
  if (a.tipo === "pase") return `${nombre}: toca para actualizar`;
  if (a.tipo === "permiso") return `${nombre}: falta permiso de correo`;
  return `No se pudo leer ${nombre}; se reintenta al actualizar. ${a.detalle}`;
};

// Pestaña IA → Correo (maqueta H/05 D1): solo lo importante, con la razón y
// una acción; el resto en «N correos más». Nada se envía ni se crea sin tocarlo.
export default function BandejaCorreo() {
  const c = useConexiones();
  const correo = useCorreo();
  type Abierto = {
    correo: CorreoEnLista;
    responder: boolean;
    inicial?: Respuesta;
  };
  const [abierto, setAbierto] = useState<Abierto | null>(null);
  const [editor, setEditor] = useState<Item | null>(null);
  // Al cerrar el editor, volver a la respuesta que se estaba escribiendo.
  const [volver, setVolver] = useState<Abierto | null>(null);
  const [verMas, setVerMas] = useState(false);
  const [enviado, setEnviado] = useState("");
  const ahora = Date.now();

  if (correo.estado === "sin_cuentas")
    return (
      <View style={{ padding: space.screen, gap: space.md }}>
        <Txt variant="title">Conecta tu correo</Txt>
        <Txt tone="secondary">
          Neka te muestra solo lo que pide algo de ti y te ayuda a responder.
        </Txt>
        {c.disponible ? (
          <View style={{ flexDirection: "row", gap: space.sm }}>
            {googleDisponible && (
              <View style={{ flex: 1 }}>
                <Button
                  title="Google"
                  variant="secondary"
                  onPress={() => c.conectar("google", "ajustes")}
                />
              </View>
            )}
            {microsoftDisponible && (
              <View style={{ flex: 1 }}>
                <Button
                  title="Outlook"
                  variant="secondary"
                  onPress={() => c.conectar("microsoft", "ajustes")}
                />
              </View>
            )}
          </View>
        ) : (
          <Txt variant="callout" tone="secondary">
            Conectar funciona en la versión web de Nekal, con una cuenta.
          </Txt>
        )}
      </View>
    );

  const accionDe = (x: CorreoEnLista) => {
    const r = x.clase?.razon;
    if (r === "pide") setEditor(tareaDesdeCorreo(x, x.clase));
    else if (r === "fecha")
      setEditor(eventoDesdeCorreo(x, x.clase, Date.now()));
    else setAbierto({ correo: x, responder: r === "pregunta" });
  };
  const proveedores = [
    ...new Set(c.cuentas.map((x) => NOMBRE_PROVEEDOR[x.proveedor])),
  ].join(" y ");

  return (
    <>
      <ScrollView
        contentContainerStyle={{
          padding: space.screen,
          gap: space.lg,
          paddingBottom: space.xxxl,
        }}
        refreshControl={
          <RefreshControl
            refreshing={correo.actualizando}
            onRefresh={correo.recargar}
            tintColor={color.primary}
          />
        }
      >
        <Card variant="featured">
          <View style={{ flexDirection: "row", gap: space.md }}>
            <View style={{ flex: 1, gap: space.xs }}>
              <Txt variant="headline">
                {correo.estado === "cargando"
                  ? "Neka está leyendo tu correo…"
                  : resumenBandeja(correo.total, correo.importantes.length)}
              </Txt>
              {correo.estado === "listo" && (
                <Txt variant="callout" tone="secondary">
                  {correo.nekaFallo
                    ? "Neka no pudo ordenar tu correo; te muestro todo lo principal."
                    : "El resto lo dejé aparte."}
                </Txt>
              )}
            </View>
            <PressableScale
              onPress={correo.recargar}
              disabled={correo.actualizando}
              accessibilityRole="button"
              accessibilityLabel="Actualizar el correo"
              style={{
                width: size.minTouch,
                height: size.minTouch,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name="refresh-outline"
                size={size.icon}
                color={color.primary}
              />
            </PressableScale>
          </View>
        </Card>

        {!!enviado && (
          <Txt variant="callout" tone="primary" accessibilityRole="alert">
            {enviado}
          </Txt>
        )}

        {correo.avisos.map((a) => (
          <View
            key={`${a.cuenta.proveedor}:${a.cuenta.correo}`}
            style={{ gap: space.xs }}
          >
            <Txt variant="callout" tone="danger">
              {textoAviso(a)}
            </Txt>
            {a.tipo !== "red" && (
              <View style={{ alignSelf: "flex-start" }}>
                <Button
                  title={
                    a.tipo === "pase" ? "Actualizar" : "Volver a dar permiso"
                  }
                  variant="secondary"
                  small
                  onPress={() => c.actualizar(a.cuenta)}
                />
              </View>
            )}
          </View>
        ))}

        {correo.estado === "listo" && (
          <View>
            <SectionTitle title="Lo importante" detail={proveedores} />
            {correo.importantes.length === 0 && (
              <Txt tone="secondary" style={{ marginTop: space.sm }}>
                Nada que pida algo de ti esta semana.
              </Txt>
            )}
            {correo.importantes.map((x) => (
              <FilaCorreo
                key={`${x.proveedor}:${x.cuenta}:${x.id}`}
                correo={x}
                ahora={ahora}
                conAccion={!!x.clase && x.clase.razon !== "nada"}
                onAbrir={() => setAbierto({ correo: x, responder: false })}
                onAccion={() => accionDe(x)}
              />
            ))}
          </View>
        )}

        {correo.estado === "listo" && correo.mas.length > 0 && (
          <View style={{ gap: space.sm }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: space.md,
                paddingTop: space.md,
                borderTopWidth: 1,
                borderColor: color.line,
              }}
            >
              <View style={{ flex: 1 }}>
                <Txt variant="headline">{`${correo.mas.length} ${correo.mas.length === 1 ? "correo más" : "correos más"}`}</Txt>
                <Txt variant="caption" tone="secondary">
                  Promociones, avisos y boletines
                </Txt>
              </View>
              <Button
                title={verMas ? "Ocultar" : "Ver"}
                variant="plain"
                small
                onPress={() => setVerMas(!verMas)}
              />
            </View>
            {verMas &&
              correo.mas.map((x) => (
                <FilaCorreo
                  key={`${x.proveedor}:${x.cuenta}:${x.id}`}
                  correo={x}
                  ahora={ahora}
                  conAccion={false}
                  onAbrir={() => setAbierto({ correo: x, responder: false })}
                  onAccion={() => {}}
                />
              ))}
          </View>
        )}

        <Txt variant="caption" tone="secondary">
          Para ordenar, Neka lee solo el remitente, el asunto y las primeras
          líneas; el correo completo, solo si le pides un borrador.
        </Txt>
      </ScrollView>

      {abierto && (
        <CorreoAbierto
          key={abierto.correo.id}
          correo={abierto.correo}
          responder={abierto.responder}
          inicial={abierto.inicial}
          bandeja={correo}
          onClose={() => setAbierto(null)}
          onEditar={(i, respuesta) => {
            setVolver(
              respuesta
                ? { correo: abierto.correo, responder: true, inicial: respuesta }
                : null,
            );
            setAbierto(null);
            setEditor(i);
          }}
          onEnviado={(t) => {
            setAbierto(null);
            setEnviado(t);
          }}
        />
      )}
      {editor && (
        <ItemEditor
          key={editor.id}
          item={editor}
          onClose={() => {
            setEditor(null);
            if (volver) setAbierto(volver);
            setVolver(null);
          }}
        />
      )}
    </>
  );
}
