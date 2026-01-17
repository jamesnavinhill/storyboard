import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import Database from "better-sqlite3";
import request from "supertest";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { createApp } from "../../app";
import { runMigrations } from "../../migrations/runMigrations";
import type { AppConfig } from "../../config";

describe("Workflows and Templates API", () => {
  let db: Database.Database;
  let agent: ReturnType<typeof request>;
  let tempDir: string;
  let workflowId: string;
  let subtypeId: string;
  let templateId: string;

  const originalDbPath = process.env.DB_PATH;
  const originalDataDir = process.env.DATA_DIR;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "workflows-test-"));
    const dbPath = path.join(tempDir, "test.db");
    const dataDir = path.join(tempDir, "data");

    process.env.DB_PATH = dbPath;
    process.env.DATA_DIR = dataDir;

    fs.mkdirSync(dataDir, { recursive: true });

    db = new Database(dbPath);
    runMigrations(db);

    const config: AppConfig = {
      port: 0,
      dbPath,
      dataDir,
      corsOrigin: undefined,
      enableAiTelemetry: false,
      aiRateLimitWindowMs: 60000,
      aiRateLimitMaxRequests: 30,
      maxFileSizeMb: 100,
      filesApiEnabled: true,
      enableThinkingMode: false,
      enableContextCaching: true,
      defaultVideoModel: "veo-3.1-generate-001",
      enableStreaming: true,
    };

    const app = createApp(db, config);
    agent = request(app);
  });

  afterAll(() => {
    db.close();
    process.env.DB_PATH = originalDbPath;
    process.env.DATA_DIR = originalDataDir;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe("Workflows", () => {
    it("creates a workflow", async () => {
      const response = await agent
        .post("/api/workflows")
        .send({
          name: "Test Music Video",
          description: "A test workflow for music videos",
          category: "music-video",
          systemInstruction:
            "Create engaging music video scenes with dynamic camera movements",
          artStyle: "Cinematic",
          examples: ["Example 1", "Example 2"],
          metadata: { targetDuration: "3-5 minutes" },
        })
        .expect(201);

      workflowId = response.body.workflow.id;
      expect(workflowId).toBeTruthy();
      expect(response.body.workflow.name).toBe("Test Music Video");
      expect(response.body.workflow.category).toBe("music-video");
    });

    it("lists workflows", async () => {
      const response = await agent.get("/api/workflows").expect(200);
      expect(response.body.workflows.length).toBeGreaterThan(0);
      const testWorkflow = response.body.workflows.find(
        (w: { name: string }) => w.name === "Test Music Video"
      );
      expect(testWorkflow).toBeTruthy();
    });

    it("filters workflows by category", async () => {
      await agent
        .post("/api/workflows")
        .send({
          name: "Test Commercial",
          category: "commercial",
          systemInstruction: "Create product-focused commercial scenes",
        })
        .expect(201);

      const response = await agent
        .get("/api/workflows")
        .query({ category: "music-video" })
        .expect(200);

      expect(response.body.workflows.length).toBeGreaterThan(0);
      // All returned workflows should be music-video category
      response.body.workflows.forEach((w: { category: string }) => {
        expect(w.category).toBe("music-video");
      });
    });

    it("searches workflows by name", async () => {
      const response = await agent
        .get("/api/workflows")
        .query({ search: "music" })
        .expect(200);

      expect(response.body.workflows.length).toBeGreaterThan(0);
      expect(response.body.workflows[0].name).toContain("Music");
    });

    it("gets a specific workflow", async () => {
      const response = await agent
        .get(`/api/workflows/${workflowId}`)
        .expect(200);

      expect(response.body.workflow.id).toBe(workflowId);
      expect(response.body.workflow.name).toBe("Test Music Video");
    });

    it("updates a workflow", async () => {
      const response = await agent
        .put(`/api/workflows/${workflowId}`)
        .send({
          name: "Updated Music Video",
          description: "Updated description",
        })
        .expect(200);

      expect(response.body.workflow.name).toBe("Updated Music Video");
      expect(response.body.workflow.description).toBe("Updated description");
    });

    it("returns 404 for non-existent workflow", async () => {
      await agent.get("/api/workflows/non-existent-id").expect(404);
    });
  });

  describe("Workflow Subtypes", () => {
    it("creates a workflow subtype", async () => {
      const response = await agent
        .post(`/api/workflows/${workflowId}/subtypes`)
        .send({
          name: "Dark & Moody",
          description: "Dark and atmospheric style",
          instructionModifier: "Use dark tones and dramatic lighting",
        })
        .expect(201);

      subtypeId = response.body.subtype.id;
      expect(subtypeId).toBeTruthy();
      expect(response.body.subtype.name).toBe("Dark & Moody");
    });

    it("lists workflow subtypes", async () => {
      const response = await agent
        .get(`/api/workflows/${workflowId}/subtypes`)
        .expect(200);

      expect(response.body.subtypes).toHaveLength(1);
      expect(response.body.subtypes[0].name).toBe("Dark & Moody");
    });

    it("updates a workflow subtype", async () => {
      const response = await agent
        .put(`/api/subtypes/${subtypeId}`)
        .send({
          name: "Dark & Dramatic",
        })
        .expect(200);

      expect(response.body.subtype.name).toBe("Dark & Dramatic");
    });

    it("deletes a workflow subtype", async () => {
      await agent.delete(`/api/subtypes/${subtypeId}`).expect(200);

      const listResponse = await agent
        .get(`/api/workflows/${workflowId}/subtypes`)
        .expect(200);

      expect(listResponse.body.subtypes).toHaveLength(0);
    });

    it("returns 404 for subtypes of non-existent workflow", async () => {
      await agent.get("/api/workflows/non-existent-id/subtypes").expect(404);
    });
  });

  describe("Style Templates", () => {
    it("creates a style template", async () => {
      const response = await agent
        .post("/api/templates")
        .send({
          name: "Cinematic Film Look",
          description: "Professional cinematic style",
          category: ["music-video", "commercial"],
          stylePrompt:
            "Cinematic film look with anamorphic lens flares and color grading",
          tested: true,
          examples: ["Example scene 1", "Example scene 2"],
          metadata: { bestFor: ["dramatic scenes", "emotional moments"] },
        })
        .expect(201);

      templateId = response.body.template.id;
      expect(templateId).toBeTruthy();
      expect(response.body.template.name).toBe("Cinematic Film Look");
      expect(response.body.template.tested).toBe(true);
    });

    it("lists style templates", async () => {
      const response = await agent.get("/api/templates").expect(200);
      expect(response.body.templates.length).toBeGreaterThan(0);
      const testTemplate = response.body.templates.find(
        (t: { name: string }) => t.name === "Cinematic Film Look"
      );
      expect(testTemplate).toBeTruthy();
    });

    it("filters templates by category", async () => {
      await agent
        .post("/api/templates")
        .send({
          name: "Social Media Style",
          category: ["social"],
          stylePrompt: "Vibrant and energetic social media style",
        })
        .expect(201);

      const response = await agent
        .get("/api/templates")
        .query({ category: "music-video" })
        .expect(200);

      expect(response.body.templates).toHaveLength(1);
      expect(response.body.templates[0].name).toBe("Cinematic Film Look");
    });

    it("searches templates by name", async () => {
      const response = await agent
        .get("/api/templates")
        .query({ search: "cinematic" })
        .expect(200);

      expect(response.body.templates.length).toBeGreaterThan(0);
      expect(response.body.templates[0].name).toContain("Cinematic");
    });

    it("gets a specific template", async () => {
      const response = await agent
        .get(`/api/templates/${templateId}`)
        .expect(200);

      expect(response.body.template.id).toBe(templateId);
      expect(response.body.template.name).toBe("Cinematic Film Look");
    });

    it("updates a style template", async () => {
      const response = await agent
        .put(`/api/templates/${templateId}`)
        .send({
          name: "Updated Cinematic Look",
          tested: false,
        })
        .expect(200);

      expect(response.body.template.name).toBe("Updated Cinematic Look");
      expect(response.body.template.tested).toBe(false);
    });

    it("deletes a style template", async () => {
      await agent.delete(`/api/templates/${templateId}`).expect(200);

      await agent.get(`/api/templates/${templateId}`).expect(404);
    });

    it("returns 404 for non-existent template", async () => {
      await agent.get("/api/templates/non-existent-id").expect(404);
    });
  });

  describe("Workflow Deletion Cascade", () => {
    it("deletes workflow and cascades to subtypes", async () => {
      // Create a new workflow with subtypes
      const workflowResponse = await agent
        .post("/api/workflows")
        .send({
          name: "Cascade Test Workflow",
          category: "custom",
          systemInstruction: "Test instruction",
        })
        .expect(201);

      const testWorkflowId = workflowResponse.body.workflow.id;

      // Create subtypes
      await agent
        .post(`/api/workflows/${testWorkflowId}/subtypes`)
        .send({
          name: "Subtype 1",
          instructionModifier: "Modifier 1",
        })
        .expect(201);

      await agent
        .post(`/api/workflows/${testWorkflowId}/subtypes`)
        .send({
          name: "Subtype 2",
          instructionModifier: "Modifier 2",
        })
        .expect(201);

      // Verify subtypes exist
      const subtypesResponse = await agent
        .get(`/api/workflows/${testWorkflowId}/subtypes`)
        .expect(200);
      expect(subtypesResponse.body.subtypes).toHaveLength(2);

      // Delete workflow
      await agent.delete(`/api/workflows/${testWorkflowId}`).expect(200);

      // Verify workflow is deleted
      await agent.get(`/api/workflows/${testWorkflowId}`).expect(404);

      // Verify subtypes are also deleted (cascade)
      await agent.get(`/api/workflows/${testWorkflowId}/subtypes`).expect(404);
    });
  });

  describe("Concept Art Workflow", () => {
    let conceptArtWorkflowId: string;

    it("creates a concept art workflow", async () => {
      const response = await agent
        .post("/api/workflows")
        .send({
          name: "Concept Art",
          description: "Create compelling concept art for creative projects",
          category: "concept-art",
          systemInstruction:
            "You are an expert concept artist. Create scenes with strong composition and visual hierarchy.",
          artStyle: "Bold, iconic, compositionally strong",
          examples: ["Album covers", "Movie posters"],
          metadata: { recommendedAspectRatio: "1:1" },
        })
        .expect(201);

      conceptArtWorkflowId = response.body.workflow.id;
      expect(conceptArtWorkflowId).toBeTruthy();
      expect(response.body.workflow.name).toBe("Concept Art");
      expect(response.body.workflow.category).toBe("concept-art");
    });

    it("filters workflows by concept-art category", async () => {
      const response = await agent
        .get("/api/workflows")
        .query({ category: "concept-art" })
        .expect(200);

      expect(response.body.workflows.length).toBeGreaterThan(0);
      response.body.workflows.forEach((w: { category: string }) => {
        expect(w.category).toBe("concept-art");
      });
    });

    it("creates album art subtype for concept art workflow", async () => {
      const response = await agent
        .post(`/api/workflows/${conceptArtWorkflowId}/subtypes`)
        .send({
          name: "Album Art",
          description: "Specialized for album cover design",
          instructionModifier:
            "Focus on album cover design with space for typography",
        })
        .expect(201);

      expect(response.body.subtype.name).toBe("Album Art");
      expect(response.body.subtype.workflowId).toBe(conceptArtWorkflowId);
    });

    it("rejects invalid workflow category", async () => {
      const response = await agent
        .post("/api/workflows")
        .send({
          name: "Invalid Workflow",
          category: "invalid-category",
          systemInstruction: "Test instruction",
        })
        .expect(400);

      expect(response.body.error).toBeTruthy();
    });
  });

  describe("Scene Aspect Ratio", () => {
    let testProjectId: string;

    beforeAll(async () => {
      // Create a test project for scene tests
      const projectResponse = await agent
        .post("/api/projects")
        .send({
          name: "Aspect Ratio Test Project",
        })
        .expect(201);

      testProjectId = projectResponse.body.project.id;
    });

    it("creates scene with 1:1 aspect ratio", async () => {
      const response = await agent
        .post(`/api/projects/${testProjectId}/scenes`)
        .send({
          scenes: [
            {
              description: "Square format scene for album art",
              aspectRatio: "1:1",
              orderIndex: 0,
            },
          ],
        })
        .expect(201);

      expect(response.body.scenes).toHaveLength(1);
      expect(response.body.scenes[0].aspectRatio).toBe("1:1");
    });

    it("updates scene to 1:1 aspect ratio", async () => {
      // Create a scene with 16:9
      const createResponse = await agent
        .post(`/api/projects/${testProjectId}/scenes`)
        .send({
          scenes: [
            {
              description: "Test scene",
              aspectRatio: "16:9",
              orderIndex: 1,
            },
          ],
        })
        .expect(201);

      const sceneId = createResponse.body.scenes[0].id;

      // Update to 1:1
      const updateResponse = await agent
        .patch(`/api/projects/${testProjectId}/scenes/${sceneId}`)
        .send({
          aspectRatio: "1:1",
        })
        .expect(200);

      expect(updateResponse.body.scene.aspectRatio).toBe("1:1");
    });

    it("rejects invalid aspect ratio", async () => {
      const response = await agent
        .post(`/api/projects/${testProjectId}/scenes`)
        .send({
          scenes: [
            {
              description: "Invalid aspect ratio scene",
              aspectRatio: "4:3",
              orderIndex: 2,
            },
          ],
        })
        .expect(400);

      expect(response.body.error).toBeTruthy();
    });
  });
});
