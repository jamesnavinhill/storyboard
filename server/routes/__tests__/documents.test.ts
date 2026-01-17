import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import Database from "better-sqlite3";
import { createApp } from "../../app";
import { getConfig } from "../../config";
import type { DocumentContent } from "../../stores/documentStore";

describe("Document Management API", () => {
  let db: Database.Database;
  let app: ReturnType<typeof createApp>;
  let testProjectId: string;

  beforeAll(() => {
    db = new Database(":memory:");
    db.pragma("foreign_keys = ON");

    // Create minimal schema
    db.exec(`
      CREATE TABLE projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE project_documents (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        UNIQUE(project_id, version)
      );

      CREATE INDEX idx_project_documents_project_id ON project_documents(project_id);
      CREATE INDEX idx_project_documents_project_version ON project_documents(project_id, version DESC);
    `);

    // Create test project
    const projectId = "test-project-123";
    db.prepare(
      "INSERT INTO projects (id, name, description) VALUES (?, ?, ?)"
    ).run(projectId, "Test Project", "Test Description");
    testProjectId = projectId;

    const config = getConfig();
    app = createApp(db, config);
  });

  afterAll(() => {
    db.close();
  });

  describe("PUT /api/projects/:projectId/document", () => {
    it("should create a new document version", async () => {
      const documentContent: DocumentContent = {
        title: "Test Storyboard",
        style: "Cinematic",
        goals: ["Create engaging content", "Tell a story"],
        outline: "Introduction, Development, Conclusion",
        scenes: [
          {
            id: "scene-1",
            order: 0,
            title: "Opening Scene",
            description: "A dramatic opening",
            imagePrompt: "Generate a dramatic opening scene",
            animationPrompt: "Slow zoom in",
            metadata: { duration: 5 },
          },
        ],
        metadata: {
          workflow: "music-video",
          systemInstruction: "Create a cinematic music video",
          modelSettings: {},
          totalDuration: 5,
        },
      };

      const response = await request(app)
        .put(`/api/projects/${testProjectId}/document`)
        .send({ content: documentContent })
        .expect(200);

      expect(response.body.document).toBeDefined();
      expect(response.body.document.version).toBe(1);
      expect(response.body.document.content.title).toBe("Test Storyboard");
    });

    it("should increment version on subsequent saves", async () => {
      const documentContent: DocumentContent = {
        title: "Updated Storyboard",
        style: "Cinematic",
        goals: ["Create engaging content"],
        outline: "Updated outline",
        scenes: [],
        metadata: {
          workflow: "music-video",
          systemInstruction: "Create a cinematic music video",
          modelSettings: {},
          totalDuration: 0,
        },
      };

      const response = await request(app)
        .put(`/api/projects/${testProjectId}/document`)
        .send({ content: documentContent })
        .expect(200);

      expect(response.body.document.version).toBe(2);
      expect(response.body.document.content.title).toBe("Updated Storyboard");
    });

    it("should return 404 for non-existent project", async () => {
      const documentContent: DocumentContent = {
        title: "Test",
        style: "Test",
        goals: [],
        outline: "",
        scenes: [],
        metadata: {
          workflow: "music-video",
          systemInstruction: "",
          modelSettings: {},
          totalDuration: 0,
        },
      };

      await request(app)
        .put("/api/projects/non-existent/document")
        .send({ content: documentContent })
        .expect(404);
    });
  });

  describe("GET /api/projects/:projectId/document", () => {
    it("should retrieve the latest document version", async () => {
      const response = await request(app)
        .get(`/api/projects/${testProjectId}/document`)
        .expect(200);

      expect(response.body.document).toBeDefined();
      expect(response.body.document.version).toBe(2);
      expect(response.body.document.content.title).toBe("Updated Storyboard");
    });

    it("should return 404 for non-existent project", async () => {
      await request(app).get("/api/projects/non-existent/document").expect(404);
    });
  });

  describe("GET /api/projects/:projectId/document/history", () => {
    it("should retrieve document version history", async () => {
      const response = await request(app)
        .get(`/api/projects/${testProjectId}/document/history`)
        .expect(200);

      expect(response.body.history).toBeDefined();
      expect(response.body.history.length).toBe(2);
      expect(response.body.history[0].version).toBe(2);
      expect(response.body.history[1].version).toBe(1);
    });

    it("should return 404 for non-existent project", async () => {
      await request(app)
        .get("/api/projects/non-existent/document/history")
        .expect(404);
    });
  });

  describe("POST /api/projects/:projectId/document/restore/:version", () => {
    it("should restore a previous version", async () => {
      const response = await request(app)
        .post(`/api/projects/${testProjectId}/document/restore/1`)
        .expect(200);

      expect(response.body.document).toBeDefined();
      expect(response.body.document.version).toBe(3);
      expect(response.body.document.content.title).toBe("Test Storyboard");
    });

    it("should return 404 for non-existent version", async () => {
      await request(app)
        .post(`/api/projects/${testProjectId}/document/restore/999`)
        .expect(404);
    });

    it("should return 400 for invalid version number", async () => {
      await request(app)
        .post(`/api/projects/${testProjectId}/document/restore/invalid`)
        .expect(400);
    });
  });

  describe("POST /api/projects/:projectId/document/export", () => {
    it("should export document as markdown", async () => {
      const response = await request(app)
        .post(`/api/projects/${testProjectId}/document/export`)
        .send({ format: "markdown", includeAssets: false })
        .expect(200);

      expect(response.headers["content-type"]).toContain("text/markdown");
      expect(response.headers["content-disposition"]).toContain(".md");
      expect(response.text).toContain("# Test Storyboard");
    });

    it("should export document as json", async () => {
      const response = await request(app)
        .post(`/api/projects/${testProjectId}/document/export`)
        .send({ format: "json", includeAssets: false })
        .expect(200);

      expect(response.headers["content-type"]).toContain("application/json");
      expect(response.headers["content-disposition"]).toContain(".json");
      const content = JSON.parse(response.text);
      expect(content.title).toBe("Test Storyboard");
    });

    it("should export document as pdf", async () => {
      const response = await request(app)
        .post(`/api/projects/${testProjectId}/document/export`)
        .send({ format: "pdf", includeAssets: false })
        .expect(200);

      expect(response.headers["content-type"]).toContain("application/pdf");
      expect(response.headers["content-disposition"]).toContain(".pdf");
    });

    it("should return 400 for unsupported format", async () => {
      await request(app)
        .post(`/api/projects/${testProjectId}/document/export`)
        .send({ format: "xml", includeAssets: false })
        .expect(400);
    });

    it("should return 404 for non-existent project", async () => {
      await request(app)
        .post("/api/projects/non-existent/document/export")
        .send({ format: "markdown", includeAssets: false })
        .expect(404);
    });
  });
});
