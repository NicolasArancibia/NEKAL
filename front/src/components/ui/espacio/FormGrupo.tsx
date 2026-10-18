import React, { useState } from "react";
import { View } from "react-native";
import { space } from "../../../styles/theme";
import { useApp } from "../../../utils/AppContext";
import {
  borrarGrupo,
  esOcurrencia,
  crearGrupo,
  Destino,
  editarGrupo,
  juntarEnGrupo,
  moverGrupo,
} from "../../../utils/estructura";
import { haptic } from "../../../utils/haptics";
import {
  duplicateGroup,
  Group,
  localDay,
  parseDateInput,
  Repeat,
} from "../../../utils/model";
import { Button, Chip, Field, Sheet, Toggle, Txt } from "../base";

const FRECUENCIAS: [Exclude<Repeat, "">, string][] = [
  ["diario", "Cada día"],
  ["semanal", "Cada semana"],
  ["dias", "Ciertos días"],
];
// Lunes primero; el número es el de getDay (0 = domingo).
const DIAS: [number, string, string][] = [
  [1, "L", "Lunes"],
  [2, "M", "Martes"],
  [3, "X", "Miércoles"],
  [4, "J", "Jueves"],
  [5, "V", "Viernes"],
  [6, "S", "Sábado"],
  [0, "D", "Domingo"],
];

// Crear o editar un grupo o una rutina. Con `juntar`, el grupo nuevo se crea
// con esas cosas adentro (selección múltiple) y se puede elegir si se repite.
export default function FormGrupo({
  visible,
  inicial,
  destino,
  rutina,
  juntar,
  onClose,
}: {
  visible: boolean;
  inicial?: Group;
  destino: Destino;
  rutina: boolean;
  juntar?: string[];
  onClose: () => void;
}) {
  const { data, change } = useApp();
  const [nombre, setNombre] = useState(inicial?.name ?? "");
  const [mesa, setMesa] = useState(inicial?.workspaceId ?? destino.workspaceId);
  const [padre, setPadre] = useState(inicial?.parentId ?? destino.groupId);
  const [repite, setRepite] = useState(rutina);
  const [frecuencia, setFrecuencia] = useState<Exclude<Repeat, "">>(
    inicial?.repeat || "diario",
  );
  const [dias, setDias] = useState<number[]>(inicial?.repeatDays ?? []);
  const [desde, setDesde] = useState(inicial?.repeatStart || localDay());
  const [dia, setDia] = useState(localDay());
  const [error, setError] = useState("");
  const hacer = (fn: () => void) => {
    try {
      fn();
      haptic.selection();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const repeticion = () => {
    if (!repite)
      return { repeat: "" as Repeat, repeatDays: [], repeatStart: "" };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(desde.trim()))
      throw new Error("Usa AAAA-MM-DD para el día de inicio.");
    parseDateInput(desde.trim());
    return {
      repeat: frecuencia,
      repeatDays: frecuencia === "dias" ? dias : [],
      repeatStart: desde.trim(),
    };
  };
  const guardar = () =>
    hacer(() => {
      const r = repeticion();
      if (juntar)
        return change((d) => juntarEnGrupo(d, juntar, nombre, r).data);
      if (!inicial)
        return change(
          (d) =>
            crearGrupo(d, {
              name: nombre,
              workspaceId: mesa,
              parentId: padre,
              ...r,
            }).data,
        );
      change((d) => {
        const x = editarGrupo(d, { ...inicial, name: nombre, ...r });
        return mesa === inicial.workspaceId && padre === inicial.parentId
          ? x
          : moverGrupo(x, inicial.id, { workspaceId: mesa, parentId: padre });
      });
    });
  const grupos = data.groups.filter(
    (g) => g.workspaceId === mesa && g.id !== inicial?.id,
  );
  return (
    <Sheet
      visible={visible}
      title={
        inicial
          ? `Editar ${inicial.name}`
          : juntar
            ? `Juntar ${juntar.length}`
            : rutina
              ? "Rutina nueva"
              : "Grupo nuevo"
      }
      onClose={onClose}
    >
      <Field
        label="Nombre"
        value={nombre}
        onChange={setNombre}
        placeholder={repite ? "Mañana, Gimnasio…" : "Lanzamiento, Materia…"}
      />
      {!juntar && (
        <>
          <Txt variant="callout" weight={600}>
            Dentro de
          </Txt>
          <View
            style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}
          >
            {data.workspaces.map((w) => (
              <Chip
                key={w.id}
                title={w.name}
                selected={mesa === w.id}
                onPress={() => {
                  setMesa(w.id);
                  setPadre("");
                }}
              />
            ))}
          </View>
          {!!grupos.length && (
            <View
              style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}
            >
              <Chip
                title="Directo en la mesa"
                selected={!padre}
                onPress={() => setPadre("")}
              />
              {grupos.map((g) => (
                <Chip
                  key={g.id}
                  title={g.name}
                  selected={padre === g.id}
                  onPress={() => setPadre(g.id)}
                />
              ))}
            </View>
          )}
        </>
      )}
      {(juntar || inicial) && (
        <Toggle
          label="Se repite (rutina)"
          value={repite}
          onChange={setRepite}
        />
      )}
      {repite && (
        <>
          <View
            style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}
          >
            {FRECUENCIAS.map(([f, texto]) => (
              <Chip
                key={f}
                title={texto}
                selected={frecuencia === f}
                onPress={() => setFrecuencia(f)}
              />
            ))}
          </View>
          {frecuencia === "dias" && (
            <View
              style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}
            >
              {DIAS.map(([n, letra, nombreDia]) => (
                <Chip
                  key={n}
                  title={letra}
                  accessibilityLabel={nombreDia}
                  selected={dias.includes(n)}
                  onPress={() =>
                    setDias((x) =>
                      x.includes(n) ? x.filter((y) => y !== n) : [...x, n],
                    )
                  }
                />
              ))}
            </View>
          )}
          <Field
            label="Desde"
            value={desde}
            onChange={setDesde}
            placeholder="AAAA-MM-DD"
          />
          <Txt variant="caption" tone="secondary">
            Lo que pongas directo en la rutina es el modelo: se copia cada día
            que toca, con la misma hora.
          </Txt>
        </>
      )}
      {!!error && (
        <Txt variant="callout" tone="danger">
          {error}
        </Txt>
      )}
      <Button
        title={inicial ? "Guardar" : juntar ? "Juntar" : "Crear"}
        onPress={guardar}
      />
      {inicial && (
        <>
          <Txt variant="callout" weight={600}>
            Aplicar ahora
          </Txt>
          <Txt variant="caption" tone="secondary">
            Crea una copia de lo que tiene, con las fechas movidas a ese día y
            todo pendiente.
          </Txt>
          <Field label="Día" value={dia} onChange={setDia} placeholder="AAAA-MM-DD" />
          <Button
            title="Aplicar ahora"
            variant="secondary"
            onPress={() => hacer(() => change((d) => duplicateGroup(d, inicial.id, dia.trim())))}
          />
          {esOcurrencia(data, inicial) ? (
            <Txt variant="caption" tone="secondary" align="center">
              Es un día de la rutina: no se borra. Para quitar algo de este
              día, borra esa cosa.
            </Txt>
          ) : (
            <>
              <Button
                title="Borrar grupo"
                variant="plain"
                onPress={() =>
                  hacer(() => change((d) => borrarGrupo(d, inicial.id)))
                }
              />
              <Txt variant="caption" tone="secondary" align="center">
                Lo que tiene adentro no se borra: sube a donde estaba el grupo.
              </Txt>
            </>
          )}
        </>
      )}
    </Sheet>
  );
}
