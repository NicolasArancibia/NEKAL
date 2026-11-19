import type { RedCorreo } from "./bandeja";
import type { CorreoCompleto, Cuenta } from "./tipos";

// Correos de ejemplo para `nekalConexiones("correo")` (solo desarrollo, sin red).
type Ejemplo = Omit<
  CorreoCompleto,
  | "cuenta"
  | "proveedor"
  | "fecha"
  | "leido"
  | "para"
  | "responderA"
  | "idMensaje"
  | "referencias"
> & {
  horas: number;
  mas?: boolean;
};

const persona = (nombre: string, correo: string) => ({ nombre, correo });

const GOOGLE: Ejemplo[] = [
  {
    id: "ej-1",
    hilo: "h1",
    de: persona("Prof. Soto", "soto@universidad.cl"),
    asunto: "Entrega del informe de redes",
    extracto:
      "Les recuerdo que el informe se entrega este viernes antes de las 23:59.",
    texto:
      "Hola a todos:\n\nLes recuerdo que el informe de redes se entrega este viernes antes de las 23:59 por la plataforma.\n\nSaludos,\nProf. Soto",
    horas: 1,
  },
  {
    id: "ej-2",
    hilo: "h2",
    de: persona("Ana Pérez", "ana.perez@gmail.com"),
    asunto: "¿Nos juntamos el sábado?",
    extracto:
      "¿Te tinca juntarnos el sábado en la tarde para avanzar el trabajo de diseño?",
    texto:
      "Hola Sofi!\n\n¿Te tinca juntarnos el sábado en la tarde para avanzar el trabajo de diseño? Podría ser en la biblioteca a las 17:00 o en mi casa.\n\nAvísame!\nAna",
    horas: 2,
  },
  {
    id: "ej-3",
    hilo: "h3",
    de: persona("Universidad", "registro@universidad.cl"),
    asunto: "Inscripción de ramos 2027",
    extracto:
      "La inscripción de ramos para 2027 abre el 1 de diciembre a las 9:00.",
    texto:
      "Estimada estudiante:\n\nLa inscripción de ramos para 2027 abre el 1 de diciembre a las 9:00 en el portal.\n\nDirección de Registro",
    horas: 30,
  },
  {
    id: "ej-4",
    hilo: "h4",
    de: persona("Tienda", "ofertas@tienda.cl"),
    asunto: "¡30% en toda la tienda!",
    extracto: "Solo por hoy, descuentos en toda la tienda.",
    texto: "Solo por hoy, descuentos en toda la tienda.",
    horas: 5,
    mas: true,
  },
];

const OUTLOOK: Ejemplo[] = [
  {
    id: "ej-5",
    hilo: "h5",
    de: persona("Tomás Rivas", "tomas.rivas@empresa.cl"),
    asunto: "Minuta reunión de equipo",
    extracto: "Adjunto la minuta para la reunión de equipo de hoy a las 15:00.",
    texto:
      "Hola equipo:\n\nAdjunto la minuta para la reunión de hoy a las 15:00. Revisen el punto 3 antes, por favor.\n\nTomás",
    horas: 20,
  },
  {
    id: "ej-6",
    hilo: "h6",
    de: persona("Boletín", "noticias@boletin.cl"),
    asunto: "Las noticias de la semana",
    extracto: "Lo más leído de la semana.",
    texto: "Lo más leído de la semana.",
    horas: 40,
    mas: true,
  },
];

export function redCorreoEjemplo(cuenta: Cuenta): RedCorreo {
  const fuente = cuenta.proveedor === "google" ? GOOGLE : OUTLOOK;
  const leidos = new Set<string>();
  const completo = (e: Ejemplo, ahora: number): CorreoCompleto => {
    const { horas: _h, mas: _m, ...resto } = e;
    return {
      ...resto,
      proveedor: cuenta.proveedor,
      cuenta: cuenta.correo,
      fecha: new Date(ahora - e.horas * 3_600_000).toISOString(),
      leido: leidos.has(e.id),
      para: cuenta.correo,
      responderA: e.de,
      idMensaje: "",
      referencias: "",
    };
  };
  return {
    token: async () => "ejemplo",
    permiso: () => true,
    listar: async (_t, _c, ahora) => ({
      principales: fuente.filter((e) => !e.mas).map((e) => completo(e, ahora)),
      mas: fuente.filter((e) => e.mas).map((e) => completo(e, ahora)),
    }),
    abrir: async (_t, _c, id) => {
      const e = fuente.find((x) => x.id === id);
      if (!e) throw new Error("red: no existe");
      return completo(e, Date.now());
    },
    marcarLeido: async (_t, id) => {
      leidos.add(id);
    },
    responder: async (_t, original, texto) => {
      console.info("[ejemplo] respuesta a", original.asunto, texto);
    },
  };
}
