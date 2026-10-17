import React from "react";
import { WithSkiaWeb } from "@shopify/react-native-skia/lib/module/web";
import PruebaMesasMarco from "./PruebaMesasMarco";
import { Txt } from "../base";

// En web, Skia necesita cargar CanvasKit antes de importar el lienzo.
export default function PruebaMesas(props: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <PruebaMesasMarco {...props}>
      {props.visible && (
        <WithSkiaWeb
          opts={{ locateFile: (file: string) => `/${file}` }}
          getComponent={() => import("./PruebaMesasLienzo")}
          fallback={<Txt tone="secondary">Cargando 3D…</Txt>}
        />
      )}
    </PruebaMesasMarco>
  );
}
