import { useMemo } from "react";
import { useApp } from "./AppContext";
import { useAmigos } from "./AmigosContext";
import { localDay, totalPoints } from "./model";
import { useNow } from "./useNow";
import { Desde, desdeElDia1 } from "./progreso/desde";
import {
  Dia,
  Rachas,
  historial,
  inicioHistoria,
  puntosSemana,
  rachas,
  semanas12,
} from "./progreso/dias";
import { Hechos, hechosDe } from "./progreso/logros";
import { RatingMesa, ratings } from "./progreso/mesas";
import { Nivel, nivelDe } from "./progreso/nivel";

export type Progreso = {
  hoy: string;
  puntos: number;
  nivel: Nivel;
  semanas12: Dia[];
  rachas: Rachas;
  puntosSemana: number;
  desde: Desde;
  mesas: RatingMesa[];
  hechos: Hechos;
};

// Todo el progreso (spec E §9). Se recalcula cuando cambian los datos o el día.
export function useProgreso(): Progreso {
  const { data } = useApp();
  const { cuantos } = useAmigos();
  const now = useNow();
  const hoy = localDay(new Date(now));
  return useMemo(() => {
    const puntos = totalPoints(data);
    const desde = desdeElDia1(data, now);
    return {
      hoy,
      puntos,
      nivel: nivelDe(puntos),
      semanas12: semanas12(data, now),
      rachas: rachas(historial(data, inicioHistoria(data, now), hoy)),
      puntosSemana: puntosSemana(data, now),
      desde,
      mesas: ratings(data, now),
      hechos: hechosDe(data, now, cuantos),
    };
  }, [data, hoy, cuantos]);
}
