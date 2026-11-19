import { useEffect, useState } from "react";
import { View } from "react-native";
import { color, space } from "../../../styles/theme";
import type { Item } from "../../../utils/model";
import type { CorreoEnLista, useCorreo } from "../../../utils/useCorreo";
import type { CorreoCompleto } from "../../../utils/conexiones/tipos";
import {
  type Borrador,
  eventoDesdeCorreo,
  tareaDesdeCorreo,
  textoInicio,
} from "../../../utils/conexiones/correoNeka";
import { Button, Field, Sheet, Txt } from "../base";
import LogoCuenta from "../conexiones/LogoCuenta";

type Correo = ReturnType<typeof useCorreo>;

const fechaLarga = (iso: string) =>
  new Date(iso).toLocaleString("es-CL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

const motivo = (e: unknown) =>
  (e as Error)?.message === "pase"
    ? "Tu permiso venció: toca «Actualizar» en Ajustes → Cuentas conectadas."
    : String((e as Error)?.message ?? e);

// Lo que se lleva escrito, para volver a la respuesta después de «Agregar».
export type Respuesta = {
  indicacion: string;
  texto: string;
  deNeka: Borrador | null;
};

// Correo abierto (maqueta H/05 D2) y la respuesta con Neka (D3), en la misma
// hoja. Crear tarea / Agregar cierran la hoja y abren el editor normal; tras
// «Agregar», la hoja vuelve con la respuesta como estaba.
export default function CorreoAbierto({
  correo,
  responder: responderAlAbrir,
  inicial,
  bandeja,
  onClose,
  onEditar,
  onEnviado,
}: {
  correo: CorreoEnLista;
  responder: boolean;
  inicial?: Respuesta;
  bandeja: Correo;
  onClose: () => void;
  onEditar: (i: Item, volver?: Respuesta) => void;
  onEnviado: (texto: string) => void;
}) {
  const [completo, setCompleto] = useState<CorreoCompleto | null>(null);
  const [error, setError] = useState("");
  const [responder, setResponder] = useState(responderAlAbrir);
  const [indicacion, setIndicacion] = useState(inicial?.indicacion ?? "");
  const [texto, setTexto] = useState(inicial?.texto ?? "");
  const [deNeka, setDeNeka] = useState<Borrador | null>(
    inicial?.deNeka ?? null,
  );
  const [escribiendo, setEscribiendo] = useState(false);
  const [nekaFallo, setNekaFallo] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let vivo = true;
    bandeja.abrir(correo).then(
      (c) => vivo && setCompleto(c),
      (e) => vivo && setError(`No se pudo abrir el correo. ${motivo(e)}`),
    );
    return () => {
      vivo = false;
    };
    // Solo al abrir este correo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [correo.id]);

  const pedirANeka = async () => {
    if (!completo) return;
    setEscribiendo(true);
    setNekaFallo(false);
    const b = await bandeja.borrador(completo, indicacion);
    setEscribiendo(false);
    if (!b) return setNekaFallo(true);
    setDeNeka(b);
    setTexto(b.texto);
  };

  const enviar = async () => {
    if (!completo || !texto.trim()) return;
    setEnviando(true);
    setError("");
    try {
      await bandeja.enviar(completo, texto.trim());
      onEnviado(`Respuesta enviada a ${completo.responderA.nombre}.`);
    } catch (e) {
      setError(`No se pudo enviar. ${motivo(e)}`);
    } finally {
      setEnviando(false);
    }
  };

  const evento = deNeka?.evento;
  return (
    <Sheet visible title="Correo" onClose={onClose}>
      <View style={{ gap: space.lg }}>
        <Txt variant="title">{correo.asunto || "(sin asunto)"}</Txt>
        <View
          style={{ flexDirection: "row", alignItems: "center", gap: space.md }}
        >
          <LogoCuenta proveedor={correo.proveedor} chico />
          <View style={{ flex: 1 }}>
            <Txt variant="headline" numberOfLines={1}>
              {correo.de.nombre}
            </Txt>
            <Txt variant="caption" tone="secondary" numberOfLines={1}>
              {`para ${correo.cuenta} · ${fechaLarga(correo.fecha)}`}
            </Txt>
          </View>
        </View>

        {!completo && !error && <Txt tone="secondary">Abriendo el correo…</Txt>}
        {!!completo && (
          <View
            style={{
              borderTopWidth: 1,
              borderColor: color.line,
              paddingTop: space.lg,
            }}
          >
            <Txt selectable>{completo.texto}</Txt>
          </View>
        )}

        {!!completo && !responder && (
          <View style={{ gap: space.sm }}>
            <Button title="Responder" onPress={() => setResponder(true)} />
            <Button
              title="Crear tarea"
              variant="secondary"
              onPress={() => onEditar(tareaDesdeCorreo(completo, correo.clase))}
            />
          </View>
        )}

        {!!completo && responder && (
          <View style={{ gap: space.md }}>
            <Txt variant="headline">{`Responder a ${completo.responderA.nombre}`}</Txt>
            <Txt variant="caption" tone="secondary">
              {`Se envía desde ${completo.cuenta}, en el mismo hilo.`}
            </Txt>
            <Field
              label="Dile a Neka qué responder"
              value={indicacion}
              onChange={setIndicacion}
              placeholder="dile que sí, en la biblioteca a las 5"
            />
            <Button
              title={
                escribiendo
                  ? "Neka está escribiendo…"
                  : deNeka
                    ? "Otra versión"
                    : "Que Neka lo escriba"
              }
              variant="secondary"
              disabled={escribiendo}
              onPress={pedirANeka}
            />
            {nekaFallo && (
              <Txt variant="callout" tone="danger" accessibilityRole="alert">
                Neka no pudo escribir; puedes escribirlo tú.
              </Txt>
            )}
            <Field
              label={
                deNeka ? "Borrador de Neka · puedes editarlo" : "Tu respuesta"
              }
              value={texto}
              onChange={setTexto}
              multiline
            />
            {!!evento && (
              <View style={{ gap: space.sm }}>
                <Txt variant="callout" tone="secondary">
                  {`También puedo agregar «${evento.titulo}» el ${textoInicio(evento.inicio)}.`}
                </Txt>
                <View style={{ alignSelf: "flex-start" }}>
                  <Button
                    title="Agregar"
                    variant="secondary"
                    small
                    onPress={() =>
                      onEditar(
                        eventoDesdeCorreo(
                          completo,
                          { razon: "fecha", fecha: evento.inicio },
                          Date.now(),
                          { titulo: evento.titulo, minutos: evento.minutos },
                        ),
                        // Ya se agregó: al volver no se ofrece de nuevo.
                        {
                          indicacion,
                          texto,
                          deNeka: deNeka ? { texto: deNeka.texto } : null,
                        },
                      )
                    }
                  />
                </View>
              </View>
            )}
            <Button
              title={enviando ? "Enviando…" : "Enviar"}
              disabled={!texto.trim() || enviando}
              onPress={enviar}
            />
            <Button
              title="Cancelar"
              variant="plain"
              onPress={() => setResponder(false)}
            />
            <Txt variant="caption" tone="secondary" align="center">
              Nada se envía hasta que tocas Enviar.
            </Txt>
          </View>
        )}

        {!!error && (
          <Txt variant="callout" tone="danger" accessibilityRole="alert">
            {error}
          </Txt>
        )}
      </View>
    </Sheet>
  );
}
