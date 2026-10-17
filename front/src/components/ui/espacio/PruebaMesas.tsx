import React from "react";
import PruebaMesasMarco from "./PruebaMesasMarco";
import PruebaMesasLienzo from "./PruebaMesasLienzo";

export default function PruebaMesas(props: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <PruebaMesasMarco {...props}>
      {props.visible && <PruebaMesasLienzo />}
    </PruebaMesasMarco>
  );
}
