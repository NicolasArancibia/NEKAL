import type { ImageSourcePropType } from "react-native";
import type { NekaPose } from "../../../utils/neka";

// Poses de Neka con significado fijo (spec A, sección 7).
const poses: Record<NekaPose, ImageSourcePropType> = {
  1: require("../../../../assets/Img/Neka_Pose1.png"),
  3: require("../../../../assets/Img/Neka_Pose3.png"),
  7: require("../../../../assets/Img/Neka_Pose7.png"),
  14: require("../../../../assets/Img/Neka_Pose14.png"),
  15: require("../../../../assets/Img/Neka_Pose15.png"),
};

export const nekaImage = (pose: NekaPose) => poses[pose];
