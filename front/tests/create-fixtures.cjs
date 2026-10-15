// Local, synthetic fixtures for the import/export and eight-item UI flows.
const fs = require("node:fs");
const path = require("node:path");
const m = require("../.test-build/model.js");
const { readBackup } = require("../.test-build/storage.js");
const out = path.join(__dirname, "fixtures");
fs.mkdirSync(out, { recursive: true });
const d = m.emptyData();
d.profile = { name: "Perfil de prueba", roles: "Diseño · Estudios" };
const start = m.localDay();
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const day = m.localDay(tomorrow);
const at = (h) => m.parseDateInput(`${day} ${h}:00`);
d.groups = [{ id: "qa-group", name: "QA Rutina", workspaceId: "general" }];
let result = d;
for (const [index, type] of m.TYPES.entries()) {
  const i = {
    ...m.newItem("general", type),
    id: `qa-${type.toLowerCase()}`,
    title: `QA ${type}`,
    description: `Ejemplo sintético para verificar ${type}.`,
    startDate: start,
  };
  if (["Evento", "Visita", "Meeting"].includes(type))
    i.scheduledAt = at({ Evento: "10", Visita: "14", Meeting: "15" }[type]);
  if (type === "Visita") {
    i.location = "Biblioteca";
    i.visitReason = "Retirar un libro";
  }
  if (type === "Meeting") {
    i.participants = "Equipo de prueba";
    i.agenda = "Revisar avances";
    i.location = "Sala 1";
    i.countsForScore = true;
    i.difficulty = 2;
  }
  if (type === "Deadline") {
    i.dueAt = at("18");
    i.dependencies = ["qa-tarea"];
    i.steps = [{ id: "qa-step", title: "Revisión final", done: false }];
    i.groupId = "qa-group";
  }
  if (type === "Tarea") {
    i.scheduledAt = at("12");
    i.groupId = "qa-group";
  }
  if (type === "Goal") {
    i.steps = [
      { id: "qa-hito1", title: "Primer hito", done: false },
      { id: "qa-hito2", title: "Segundo hito", done: false },
    ];
  }
  if (type === "Nota") {
    i.content = "Contenido extendido de la nota.";
    i.attachments = [
      {
        id: "qa-file",
        name: "ejemplo.txt",
        mime: "text/plain",
        data:
          "data:text/plain;base64," +
          Buffer.from("Adjunto de prueba de Nekal.").toString("base64"),
      },
    ];
  }
  if (type === "Idea") i.category = "Diseño";
  // Add all rows before validation, so forward references resolve.
  result.items.push(i);
}
readBackup(JSON.stringify(result));
fs.writeFileSync(
  path.join(out, "respaldo-v1.json"),
  JSON.stringify(result, null, 2),
);
fs.writeFileSync(
  path.join(out, "vacio-v1.json"),
  JSON.stringify(m.emptyData(), null, 2),
);
console.log("Created synthetic fixtures.");
