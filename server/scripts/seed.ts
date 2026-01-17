#!/usr/bin/env node
import { db } from "../db";
import { runMigrations } from "../migrations/runMigrations";
import {
  appendChatMessage,
  createProject,
  createScenes,
} from "../stores/projectStore";

runMigrations(db);

const project = createProject(db, {
  name: "Sample Project",
  description: "Auto-generated sample project to verify persistence pipeline.",
});

createScenes(db, project.id, [
  {
    description: "Opening shot of the neon-lit city skyline at dusk.",
    aspectRatio: "16:9",
  },
  {
    description:
      "Protagonist walks through crowded market full of holographic displays.",
    aspectRatio: "16:9",
  },
]);

appendChatMessage(db, project.id, {
  role: "model",
  text: "Sample project seeded. Feel free to add more scenes!",
});

// eslint-disable-next-line no-console
console.log(`Seeded sample project with id ${project.id}`);
