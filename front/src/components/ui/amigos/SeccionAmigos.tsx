import { ScrollView, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { color, radius, size, space } from "../../../styles/theme";
import { useAmigos } from "../../../utils/AmigosContext";
import { otroDe } from "../../../utils/amigos/amistades";
import { Card, EmptyState, PressableScale, SectionTitle, Txt } from "../base";
import Inicial from "./Inicial";
import TarjetaSolicitud from "./TarjetaSolicitud";
import { Pagina } from "./HojaAmigos";

const SOLICITUDES_VISIBLES = 2;

// Amigos en el Perfil (spec F §6.1): solicitudes que llegaron y la fila de
// amigos. «Agregar» y cada amigo abren la hoja Amigos.
export default function SeccionAmigos({
  onAbrir,
  onCrearCuenta,
}: {
  onAbrir: (p: Pagina) => void;
  onCrearCuenta: () => void;
}) {
  const a = useAmigos();
  if (!a.activo)
    return (
      <>
        <SectionTitle title="Amigos" />
        <Card>
          <EmptyState
            pose={3}
            text="Crea una cuenta para agregar amigos. Así tu progreso también queda guardado."
            action={{ label: "Crear cuenta", onPress: onCrearCuenta }}
          />
        </Card>
      </>
    );
  if (!a.amigos.length && !a.recibidas.length)
    return (
      <>
        <SectionTitle title="Amigos" />
        <Card>
          <EmptyState
            pose={3}
            text="Comparte tu código o pega el de un amigo para ver cómo va cada uno."
            action={{
              label: "Agregar amigo",
              onPress: () => onAbrir({ tipo: "amigos" }),
            }}
          />
        </Card>
      </>
    );
  return (
    <>
      <SectionTitle
        title="Amigos"
        detail={a.amigos.length ? String(a.amigos.length) : undefined}
      />
      {a.recibidas.slice(0, SOLICITUDES_VISIBLES).map((s) => (
        <TarjetaSolicitud
          key={s.id}
          nombre={otroDe(s, a.yo!).nombre}
          destacada
          onAceptar={() => a.aceptar(s.id)}
          onRechazar={() => a.borrar(s.id)}
        />
      ))}
      {a.recibidas.length > SOLICITUDES_VISIBLES && (
        <PressableScale
          onPress={() => onAbrir({ tipo: "amigos" })}
          accessibilityRole="button"
          accessibilityLabel="Ver todas las solicitudes"
          style={{ minHeight: size.minTouch, justifyContent: "center" }}
        >
          <Txt variant="callout" weight={700} tone="primary" align="center">
            Ver todas
          </Txt>
        </PressableScale>
      )}
      <Card>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: space.sm }}
        >
          <Persona
            etiqueta="Agregar"
            primario
            accesible="Agregar amigo"
            onPress={() => onAbrir({ tipo: "amigos" })}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: radius.pill,
                borderWidth: 2,
                borderStyle: "dashed",
                borderColor: color.lineStrong,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name="person-add-outline"
                size={size.icon}
                color={color.primary}
              />
            </View>
          </Persona>
          {a.amigos.map((f) => (
            <Persona
              key={f.uid}
              etiqueta={f.nombre.split(" ")[0]}
              detalle={f.nivel === null ? undefined : `Nivel ${f.nivel}`}
              accesible={
                f.nivel === null ? f.nombre : `${f.nombre}, nivel ${f.nivel}`
              }
              onPress={() => onAbrir({ tipo: "amigo", uid: f.uid })}
            >
              <Inicial nombre={f.nombre} />
            </Persona>
          ))}
        </ScrollView>
      </Card>
    </>
  );
}

function Persona({
  etiqueta,
  detalle,
  primario = false,
  accesible,
  onPress,
  children,
}: {
  etiqueta: string;
  detalle?: string;
  primario?: boolean;
  accesible: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accesible}
      style={{ width: 64, alignItems: "center", gap: 2 }}
    >
      {children}
      <Txt
        variant="caption"
        weight={600}
        tone={primario ? "primary" : "ink"}
        numberOfLines={1}
        style={{ marginTop: space.xs }}
      >
        {etiqueta}
      </Txt>
      {!!detalle && (
        <Txt variant="caption" tone="secondary">
          {detalle}
        </Txt>
      )}
    </PressableScale>
  );
}
