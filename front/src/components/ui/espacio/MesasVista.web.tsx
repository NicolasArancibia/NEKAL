import { WithSkiaWeb } from "@shopify/react-native-skia/lib/module/web";
import { Txt } from "../base";
import type { MesasProps } from "./MesasLienzo";

// En web, Skia necesita cargar CanvasKit antes de importar el lienzo.
export default function MesasVista(props: MesasProps) {
  return (
    <WithSkiaWeb
      opts={{ locateFile: (file: string) => `/${file}` }}
      getComponent={() => import("./MesasLienzo")}
      componentProps={props}
      fallback={
        <Txt tone="secondary" align="center">
          Cargando 3D…
        </Txt>
      }
    />
  );
}
