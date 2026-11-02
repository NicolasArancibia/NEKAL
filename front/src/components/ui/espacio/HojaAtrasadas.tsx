import React, { useState } from "react";
import { View } from "react-native";
import { Button, EmptyState, PressableScale, Sheet, Tag, Txt } from "../base";
import ItemEditor from "../ItemEditor";
import { color, radius, size, space } from "../../../styles/theme";
import { useApp } from "../../../utils/AppContext";
import { aHoy, aPapelera, MAX_PAPELERA } from "../../../utils/atrasadas";
import {
  ATRASO_DIAS,
  atrasadas,
  diasHasta,
  esImportante,
  fechaDe,
} from "../../../utils/espacio";
import { Item } from "../../../utils/model";
import { useNow } from "../../../utils/useNow";
import { useToggleDone } from "../../../utils/useToggleDone";

const PAGINA = 20;
const etiqueta = (i: Item) =>
  i.priority === "urgente" ? "Urgente" : "Con entrega";

// Lo que se pasó hace más de ATRASO_DIAS días (spec H2 §4, maqueta H/02 C y
// H/03 H): lo importante arriba. Ya no cuenta para choques ni para Neka, pero
// nada se borra solo: se abre, se pasa a hoy, se completa o se manda a la
// papelera.
export default function HojaAtrasadas({ onCerrar }: { onCerrar: () => void }) {
  const { data, change } = useApp();
  const now = useNow();
  const { toggle, error } = useToggleDone();
  const [editor, setEditor] = useState<Item | null>(null);
  const [falla, setFalla] = useState("");
  const [aviso, setAviso] = useState("");
  const [confirma, setConfirma] = useState(false);
  const [mostrar, setMostrar] = useState(PAGINA);
  const lista = atrasadas(data, now);
  const importantes = lista.filter(esImportante);
  const demas = lista.filter((i) => !esImportante(i));
  const mesaDe = (id: string) => data.workspaces.find((w) => w.id === id);
  const hace = (i: Item) => -diasHasta(fechaDe(i), now);

  const pasarAHoy = (i: Item) => {
    try {
      change((d) => aHoy(d, i.id, Date.now()));
      setFalla("");
    } catch (e) {
      setFalla((e as Error).message);
    }
  };
  const mandarTodas = () => {
    const ids = lista.map((i) => i.id);
    let omitidas = 0;
    try {
      change((d) => {
        const r = aPapelera(d, ids);
        omitidas = r.omitidas;
        return r.data;
      });
    } catch (e) {
      setFalla((e as Error).message);
      return;
    }
    setConfirma(false);
    setFalla("");
    const hechas = Math.min(ids.length, MAX_PAPELERA) - omitidas;
    setAviso(
      `${hechas} a la papelera.` +
        (ids.length > MAX_PAPELERA
          ? ` Quedan ${ids.length - MAX_PAPELERA}: repite para seguir.`
          : "") +
        (omitidas
          ? ` ${omitidas} no se pudieron: otras cosas dependen de ellas.`
          : ""),
    );
  };

  const fila = (i: Item, n: number) => {
    const mesa = mesaDe(i.workspaceId);
    return (
      <View
        key={i.id}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: space.sm,
          minHeight: 60,
          paddingVertical: space.xs,
          borderTopWidth: n ? 1 : 0,
          borderTopColor: color.line,
        }}
      >
        <PressableScale
          onPress={() => setEditor(i)}
          accessibilityRole="button"
          accessibilityLabel={`${i.title}, hace ${hace(i)} días. Abrir`}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            gap: space.md,
          }}
        >
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: radius.pill,
              borderWidth: 2,
              borderColor: mesa?.color ?? color.primary,
            }}
          />
          <View style={{ flex: 1, gap: 2 }}>
            <Txt weight={600} numberOfLines={2}>
              {i.title}
            </Txt>
            <Txt variant="caption" tone="secondary" numberOfLines={1}>
              hace {hace(i)} días · {mesa?.name ?? ""}
            </Txt>
            {esImportante(i) && <Tag text={etiqueta(i)} tone="danger" />}
          </View>
        </PressableScale>
        <Button
          title="A hoy"
          small
          variant="secondary"
          onPress={() => pasarAHoy(i)}
        />
        <PressableScale
          accessibilityRole="checkbox"
          accessibilityState={{ checked: false }}
          accessibilityLabel={`Completar ${i.title}`}
          onPress={() => toggle(i)}
          style={{
            width: size.minTouch,
            height: size.minTouch,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: radius.pill,
              borderWidth: 2,
              borderColor: mesa?.color ?? color.primary,
            }}
          />
        </PressableScale>
      </View>
    );
  };

  return (
    <>
      <Sheet
        visible
        title={`Atrasadas · ${lista.length}`}
        size="large"
        onClose={onCerrar}
      >
        {!!aviso && (
          <Txt variant="callout" tone="secondary">
            {aviso}
          </Txt>
        )}
        {!!(falla || error) && (
          <Txt variant="callout" tone="danger" accessibilityRole="alert">
            {falla || error}
          </Txt>
        )}
        {lista.length === 0 ? (
          <EmptyState pose={1} text="No tienes nada atrasado." />
        ) : (
          <>
            <Txt variant="callout" tone="secondary">
              Pasaron hace más de {ATRASO_DIAS} días y ya no cuentan para tus
              choques ni para Neka. No se pierden: tú decides.
            </Txt>
            {importantes.length > 0 && (
              <>
                <Txt variant="headline">Importantes · {importantes.length}</Txt>
                <View>{importantes.map(fila)}</View>
              </>
            )}
            {demas.length > 0 && (
              <>
                <Txt variant="headline">Las demás · {demas.length}</Txt>
                <View>{demas.slice(0, mostrar).map(fila)}</View>
                {demas.length > mostrar && (
                  <View style={{ alignSelf: "flex-start" }}>
                    <Button
                      title={`Ver ${Math.min(PAGINA, demas.length - mostrar)} más`}
                      variant="plain"
                      small
                      onPress={() => setMostrar(mostrar + PAGINA)}
                    />
                  </View>
                )}
              </>
            )}
            <View
              style={{
                gap: space.sm,
                padding: space.md,
                borderRadius: radius.sm,
                backgroundColor: color.background,
              }}
            >
              <Txt variant="headline">Limpiar</Txt>
              {confirma ? (
                <>
                  <Txt variant="callout" tone="secondary">
                    Las manda a la papelera; de ahí las recuperas desde Ajustes.
                  </Txt>
                  <Button
                    title={`Sí, mandar ${Math.min(lista.length, MAX_PAPELERA)}`}
                    variant="danger"
                    onPress={mandarTodas}
                  />
                  <Button
                    title="Cancelar"
                    variant="secondary"
                    onPress={() => setConfirma(false)}
                  />
                </>
              ) : (
                <Button
                  title={`Mandar ${lista.length > MAX_PAPELERA ? `${MAX_PAPELERA} de las ${lista.length}` : `las ${lista.length}`} a la papelera`}
                  variant="secondary"
                  onPress={() => setConfirma(true)}
                />
              )}
            </View>
          </>
        )}
      </Sheet>
      {editor && (
        <ItemEditor
          key={editor.id}
          item={editor}
          onClose={() => setEditor(null)}
        />
      )}
    </>
  );
}
