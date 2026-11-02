import {
  AppData,
  Group,
  Item,
  ItemType,
  localDay,
  newGroup,
  newItem,
  saveItem,
  Step,
  Workspace,
} from "./model";

// Datos de ejemplo de dos semanas (trabajo, universidad, vida personal y casa)
// para probar la app como una persona real. Solo agrega lo que falta: los ids
// son fijos, así que correrlo otra vez no duplica nada (misma referencia).
// Se usa desde desarrollo (useDemo); nunca borra ni cambia lo existente.

type Cosa = Partial<Item> & {
  id: string;
  type: ItemType;
  title: string;
  workspaceId: string;
};

const pasos = (hechos: number, ...titulos: string[]): Step[] =>
  titulos.map((title, k) => ({ id: `p${k}`, title, done: k < hechos }));

export function sembrarDemo(d: AppData, now: number): AppData {
  const base = new Date(now);
  const en = (dias: number, h = 9, min = 0) =>
    new Date(
      base.getFullYear(),
      base.getMonth(),
      base.getDate() + dias,
      h,
      min,
    ).toISOString();
  const diaSemana = (dias: number) =>
    new Date(
      base.getFullYear(),
      base.getMonth(),
      base.getDate() + dias,
    ).getDay();
  // Próximo día de la semana `dow` (0 = domingo) desde mañana.
  const proximo = (dow: number) => (dow - diaSemana(0) + 7) % 7 || 7;
  const hoy = localDay(base);

  const T =
    d.workspaces.find((w) => w.name.trim().toLowerCase() === "trabajo")?.id ??
    "demo-trabajo";
  const U = "demo-universidad",
    P = "demo-personal",
    C = "demo-casa",
    G = "general";
  const mesas: Workspace[] = [
    { id: T, name: "Trabajo", color: "#7546EC" },
    { id: U, name: "Universidad", color: "#2E9E6B" },
    { id: P, name: "Personal", color: "#D9693C" },
    { id: C, name: "Casa", color: "#948BA6" },
  ];
  const g = (
    id: string,
    name: string,
    ws: string,
    extra: Partial<Group> = {},
  ) => ({
    ...newGroup(name, ws, extra),
    id,
  });
  const grupos: Group[] = [
    g("demo-lanzamiento", "Lanzamiento", T),
    g("demo-diseno", "Diseño", T, { parentId: "demo-lanzamiento" }),
    g("demo-operacion", "Operación", T),
    g("demo-tesis", "Tesis", U),
    g("demo-cap2", "Capítulo 2", U, { parentId: "demo-tesis" }),
    g("demo-calculo", "Cálculo", U),
    g("demo-salud", "Salud", P),
    g("demo-r-manana", "Mañana", P, { repeat: "diario", repeatStart: hoy }),
    g("demo-r-gym", "Gimnasio", P, {
      parentId: "demo-salud",
      repeat: "dias",
      repeatDays: [1, 3, 5],
      repeatStart: hoy,
    }),
    g("demo-r-casa", "Orden de la casa", C, {
      repeat: "semanal",
      repeatStart: hoy,
    }),
  ];
  const lunes = proximo(1);
  const clases: Cosa[] = Array.from({ length: 13 }, (_, k) => k + 1)
    .filter((k) => [2, 4].includes(diaSemana(k)))
    .map((k) => ({
      id: `demo-clase-${localDay(new Date(en(k)))}`,
      workspaceId: U,
      groupId: "demo-calculo",
      type: "Evento",
      title: "Clase de Cálculo",
      scheduledAt: en(k, 9),
      duration: 90,
      location: "Sala B-204",
    }));
  // En orden: las dependencias van después de lo que esperan.
  const cosas: Cosa[] = [
    {
      id: "demo-luz",
      workspaceId: G,
      type: "Deadline",
      title: "Pagar la luz",
      dueAt: en(3, 18),
      priority: "urgente",
    },
    {
      id: "demo-mama",
      workspaceId: G,
      type: "Tarea",
      title: "Llamar a mamá",
      scheduledAt: en(1, 19, 30),
      duration: 20,
    },
    {
      id: "demo-regalo",
      workspaceId: G,
      type: "Idea",
      title: "Regalo para Sofía",
      category: "Personal",
    },
    {
      id: "demo-compras",
      workspaceId: G,
      type: "Nota",
      title: "Lista de compras",
      content: "Pan, leche, fruta y café.",
    },
    {
      id: "demo-banco",
      workspaceId: G,
      type: "Tarea",
      title: "Revisar la cuenta del banco",
      scheduledAt: en(-1, 10),
      duration: 20,
      status: "completado",
    },

    {
      id: "demo-sync-1",
      workspaceId: T,
      type: "Meeting",
      title: "Reunión de equipo",
      scheduledAt: en(lunes, 10),
      duration: 45,
      agenda: "Avance de la semana y bloqueos.",
    },
    {
      id: "demo-sync-2",
      workspaceId: T,
      type: "Meeting",
      title: "Reunión de equipo",
      scheduledAt: en(lunes + 7, 10),
      duration: 45,
      agenda: "Preparar la entrega.",
    },
    {
      id: "demo-propuesta",
      workspaceId: T,
      groupId: "demo-diseno",
      type: "Tarea",
      title: "Diseñar propuesta",
      dueAt: en(2, 17),
      duration: 90,
      steps: pasos(1, "Referencias", "Bocetos", "Revisión"),
    },
    {
      id: "demo-maqueta",
      workspaceId: T,
      groupId: "demo-diseno",
      type: "Tarea",
      title: "Maqueta de la app",
      dueAt: en(5, 17),
      duration: 120,
      dependencies: ["demo-propuesta"],
    },
    {
      id: "demo-lanzar",
      workspaceId: T,
      groupId: "demo-lanzamiento",
      type: "Goal",
      title: "Lanzar la versión 2",
      dueAt: en(12, 18),
      duration: 60,
      steps: pasos(
        1,
        "Diseño listo",
        "Pruebas",
        "Publicar",
        "Avisar a clientes",
      ),
    },
    {
      id: "demo-entrega",
      workspaceId: T,
      groupId: "demo-lanzamiento",
      type: "Deadline",
      title: "Entrega final al cliente",
      dueAt: en(11, 12),
      priority: "urgente",
      dependencies: ["demo-maqueta"],
    },
    {
      id: "demo-presentacion",
      workspaceId: T,
      groupId: "demo-lanzamiento",
      type: "Evento",
      title: "Presentación al cliente",
      scheduledAt: en(11, 15),
      duration: 60,
      difficulty: 2,
      countsForScore: true,
    },
    {
      id: "demo-informe",
      workspaceId: T,
      groupId: "demo-operacion",
      type: "Tarea",
      title: "Informe semanal",
      scheduledAt: en(5, 16),
      duration: 45,
    },
    {
      id: "demo-facturas",
      workspaceId: T,
      groupId: "demo-operacion",
      type: "Tarea",
      title: "Ordenar facturas",
      duration: 60,
      status: "en curso",
    },
    {
      id: "demo-correos",
      workspaceId: T,
      type: "Tarea",
      title: "Responder correos pendientes",
      scheduledAt: en(-2, 9),
      duration: 30,
      status: "completado",
    },
    {
      id: "demo-automatizar",
      workspaceId: T,
      type: "Idea",
      title: "Automatizar los reportes",
    },

    ...clases,
    {
      id: "demo-avance",
      workspaceId: U,
      groupId: "demo-tesis",
      type: "Tarea",
      title: "Enviar avance a la profesora",
      scheduledAt: en(0, 20),
      duration: 30,
    },
    {
      id: "demo-guia",
      workspaceId: U,
      groupId: "demo-tesis",
      type: "Meeting",
      title: "Reunión con la profesora guía",
      scheduledAt: en(3, 11),
      duration: 30,
      participants: "Profesora guía",
    },
    {
      id: "demo-biblioteca",
      workspaceId: U,
      groupId: "demo-tesis",
      type: "Visita",
      title: "Biblioteca central",
      scheduledAt: en(3, 15),
      duration: 90,
      location: "Biblioteca central",
    },
    {
      id: "demo-paper",
      workspaceId: U,
      groupId: "demo-cap2",
      type: "Tarea",
      title: "Leer paper de visualización",
      dueAt: en(2, 22),
      duration: 60,
    },
    {
      id: "demo-marco",
      workspaceId: U,
      groupId: "demo-cap2",
      type: "Tarea",
      title: "Escribir marco teórico",
      dueAt: en(6, 22),
      duration: 180,
      dependencies: ["demo-paper"],
      steps: pasos(0, "Esquema", "Borrador", "Citas"),
    },
    {
      id: "demo-cap2-entrega",
      workspaceId: U,
      groupId: "demo-tesis",
      type: "Deadline",
      title: "Entregar capítulo 2",
      dueAt: en(10, 23),
      priority: "urgente",
      dependencies: ["demo-marco"],
    },
    {
      id: "demo-tema",
      workspaceId: U,
      groupId: "demo-tesis",
      type: "Idea",
      title: "Tema para el capítulo 3",
    },
    {
      id: "demo-guia5",
      workspaceId: U,
      groupId: "demo-calculo",
      type: "Tarea",
      title: "Guía de ejercicios 5",
      dueAt: en(6, 20),
      duration: 120,
      steps: pasos(
        2,
        "Ejercicio 1",
        "Ejercicio 2",
        "Ejercicio 3",
        "Ejercicio 4",
        "Ejercicio 5",
      ),
    },
    {
      id: "demo-prueba",
      workspaceId: U,
      groupId: "demo-calculo",
      type: "Deadline",
      title: "Prueba de Cálculo",
      dueAt: en(13, 9),
      priority: "urgente",
    },
    {
      id: "demo-apuntes",
      workspaceId: U,
      groupId: "demo-calculo",
      type: "Nota",
      title: "Apuntes de derivadas",
      content: "Regla de la cadena y ejemplos de clase.",
    },
    {
      id: "demo-guia4",
      workspaceId: U,
      groupId: "demo-calculo",
      type: "Tarea",
      title: "Guía de ejercicios 4",
      scheduledAt: en(-3, 18),
      duration: 90,
      status: "completado",
    },

    {
      id: "demo-estirar",
      workspaceId: P,
      groupId: "demo-r-manana",
      type: "Tarea",
      title: "Estirar 10 minutos",
      scheduledAt: en(0, 7, 30),
      duration: 10,
    },
    {
      id: "demo-desayuno",
      workspaceId: P,
      groupId: "demo-r-manana",
      type: "Tarea",
      title: "Desayuno y agua",
      scheduledAt: en(0, 8),
      duration: 15,
    },
    {
      id: "demo-gym",
      workspaceId: P,
      groupId: "demo-r-gym",
      type: "Evento",
      title: "Gimnasio",
      scheduledAt: en(0, 19),
      duration: 60,
    },
    {
      id: "demo-dentista",
      workspaceId: P,
      groupId: "demo-salud",
      type: "Visita",
      title: "Dentista",
      scheduledAt: en(4, 17, 30),
      duration: 45,
      location: "Clínica dental",
    },
    {
      id: "demo-caminar",
      workspaceId: P,
      groupId: "demo-salud",
      type: "Tarea",
      title: "Caminar 30 minutos",
      scheduledAt: en(-1, 18),
      duration: 30,
      status: "completado",
    },
    {
      id: "demo-cumple",
      workspaceId: P,
      type: "Evento",
      title: "Cumpleaños de Sofía",
      scheduledAt: en(6, 20),
      duration: 180,
    },
    {
      id: "demo-libros",
      workspaceId: P,
      type: "Goal",
      title: "Leer 2 libros este mes",
      dueAt: en(13, 22),
      duration: 60,
      steps: pasos(1, "Primer libro", "Segundo libro"),
    },
    {
      id: "demo-viaje",
      workspaceId: P,
      type: "Idea",
      title: "Viaje a Pucón en verano",
    },
    {
      id: "demo-recetas",
      workspaceId: P,
      type: "Nota",
      title: "Recetas para la semana",
      content: "Lentejas, tallarines con verduras y pollo al horno.",
    },

    {
      id: "demo-bano",
      workspaceId: C,
      groupId: "demo-r-casa",
      type: "Tarea",
      title: "Limpiar el baño",
      scheduledAt: en(0, 11),
      duration: 30,
    },
    {
      id: "demo-ropa",
      workspaceId: C,
      groupId: "demo-r-casa",
      type: "Tarea",
      title: "Lavar la ropa",
      scheduledAt: en(0, 12),
      duration: 45,
    },
    {
      id: "demo-super",
      workspaceId: C,
      type: "Tarea",
      title: "Compras del supermercado",
      scheduledAt: en(5, 18),
      duration: 60,
    },
    {
      id: "demo-plantas",
      workspaceId: C,
      type: "Tarea",
      title: "Regar las plantas",
      scheduledAt: en(2, 9),
      duration: 10,
    },
    {
      id: "demo-arriendo",
      workspaceId: C,
      type: "Deadline",
      title: "Pagar el arriendo",
      dueAt: en(12, 12),
      priority: "urgente",
    },
    {
      id: "demo-closet",
      workspaceId: C,
      type: "Idea",
      title: "Ordenar el clóset por temporada",
    },
  ];

  // Lo que se quedó sin hacer (spec H2): pendientes que se pasaron hace 3–40
  // días, para ver el círculo, la hoja y la pregunta de Neka con datos reales.
  const pasadas = [
    "Devolver el libro",
    "Llamar al banco",
    "Cambiar la ampolleta",
    "Pedir hora al doctor",
    "Responder a Camila",
    "Ordenar el escritorio",
    "Renovar el seguro",
    "Comprar un regalo",
    "Revisar el correo viejo",
    "Actualizar el currículum",
  ];
  const atrasadas: Cosa[] = [
    {
      id: "demo-atr-pasaporte",
      workspaceId: G,
      type: "Deadline",
      title: "Renovar el pasaporte",
      dueAt: en(-5, 18),
      priority: "urgente",
    },
    {
      id: "demo-atr-formulario",
      workspaceId: U,
      type: "Tarea",
      title: "Entregar el formulario de beca",
      dueAt: en(-4, 17),
      duration: 30,
    },
    ...Array.from({ length: 32 }, (_, k) => ({
      id: `demo-atr-${k}`,
      workspaceId: [P, C, T, U][k % 4],
      type: "Tarea" as ItemType,
      title: `${pasadas[k % pasadas.length]}${k >= pasadas.length ? ` (${Math.floor(k / pasadas.length) + 1})` : ""}`,
      scheduledAt: en(-(3 + ((k * 7) % 38)), 10 + (k % 6)),
      duration: 20,
    })),
  ];
  cosas.push(...atrasadas);

  let out = d;
  const faltan = <T extends { id: string }>(
    lista: T[],
    hay: { id: string }[],
  ) => lista.filter((x) => !hay.some((y) => y.id === x.id));
  const mesasNuevas = faltan(mesas, out.workspaces);
  if (mesasNuevas.length)
    out = { ...out, workspaces: [...out.workspaces, ...mesasNuevas] };
  const gruposNuevos = faltan(grupos, out.groups);
  if (gruposNuevos.length)
    out = { ...out, groups: [...out.groups, ...gruposNuevos] };
  for (const c of faltan(cosas, out.items)) {
    const fecha = c.scheduledAt || c.dueAt || "";
    const dia = fecha ? localDay(new Date(fecha)) : hoy;
    const x =
      Math.max(
        -1,
        ...out.items
          .filter(
            (i) =>
              !i.deletedAt &&
              i.workspaceId === c.workspaceId &&
              i.groupId === (c.groupId ?? ""),
          )
          .map((i) => i.x),
      ) + 1;
    out = saveItem(
      out,
      {
        ...newItem(c.workspaceId, c.type),
        ...c,
        startDate: dia < hoy ? dia : hoy,
        createdAt: new Date(now).toISOString(),
        x,
        y: 0,
      },
      now,
    );
  }
  return out;
}
