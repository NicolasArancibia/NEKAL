import React, { useEffect, useState } from "react";
import { AccessibilityInfo, Pressable, View } from "react-native";
import { Piso } from "../../../utils/acomodo/mesas";
import { Camara, proyectar } from "../../../utils/acomodo/proyeccion";
import { Item } from "../../../utils/model";

const TIPO: Record<Piso["tipo"], string> = {
  general: "General",
  mesa: "Mesa",
  grupo: "Grupo",
  rutina: "Rutina",
};

// Capa invisible con un botón por piso y por cubito en su lugar proyectado,
// para usar Mesas con VoiceOver (spec B §5). Solo existe con el lector de
// pantalla encendido: así no tapa los gestos del lienzo.
export default function MesasAccesible({
  pisos,
  camara,
  items,
  onPiso,
  onCubito,
}: {
  pisos: Piso[];
  camara: Camara;
  items: Map<string, Item>;
  onPiso: (id: string) => void;
  onCubito: (id: string) => void;
}) {
  const [lector, setLector] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled()
      .then(setLector)
      .catch(() => {});
    const s = AccessibilityInfo.addEventListener(
      "screenReaderChanged",
      setLector,
    );
    return () => s.remove();
  }, []);
  if (!lector) return null;
  const boton = (
    key: string,
    x: number,
    y: number,
    label: string,
    onPress: () => void,
  ) => (
    <Pressable
      key={key}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        position: "absolute",
        left: x - 22,
        top: y - 22,
        width: 44,
        height: 44,
        opacity: 0,
      }}
    />
  );
  return (
    <View
      pointerEvents="box-none"
      style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }}
    >
      {pisos.map((p) => {
        const c = proyectar(
          { x: p.x + p.w / 2, y: p.y + p.h / 2, z: p.z },
          camara,
        );
        return boton(
          p.id,
          c.x,
          c.y,
          `${TIPO[p.tipo]} ${p.nombre}, ${p.total} ${p.total === 1 ? "cosa" : "cosas"}`,
          () => onPiso(p.id),
        );
      })}
      {pisos.flatMap((p) =>
        p.cubitos.map((q) => {
          const i = items.get(q.id);
          const c = proyectar(
            { x: q.x + q.lado / 2, y: q.y + q.lado / 2, z: p.z + q.alto },
            camara,
          );
          return boton(
            `c${q.id}`,
            c.x,
            c.y,
            `${i?.type ?? ""} ${i?.title ?? ""}`,
            () => onCubito(q.id),
          );
        }),
      )}
    </View>
  );
}
