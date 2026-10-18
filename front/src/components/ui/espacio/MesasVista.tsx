import MesasLienzo, { MesasProps } from "./MesasLienzo";

// En el iPhone, Skia está listo de inmediato.
export default function MesasVista(props: MesasProps) {
  return <MesasLienzo {...props} />;
}
