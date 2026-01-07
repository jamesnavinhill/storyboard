import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { createApp } from "../../app";
import { getConfig } from "../../config";
import { runMigrations } from "../../migrations/runMigrations";

describe("Files API", () => {
  let db: Database.Database;
  let testDataDir: string;

  beforeEach(() => {
    // Create in-memory database for testing
    db = new Database(":memory:");
    runMigrations(db);

    // Create test data directory
    testDataDir = path.join(process.cwd(), "test-data-files");
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }

    // Create a test project
    db.prepare(
      `INSERT INTO projects (id, name, description) VALUES (?, ?, ?)`
    ).run("test-project-1", "Test Project", "Test Description");
  });

  afterEach(() => {
    db.close();

    // Clean up test data directory
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  describe("POST /api/files/upload", () => {
    it("should upload a small file with inline base64 encoding", async () => {
      const config = {
        ...getConfig(),
        dataDir: testDataDir,
        filesApiEnabled: false, // Force inline encoding for test
      };
      const app = createApp(db, config);

      // Create a small test file
      const testFilePath = path.join(testDataDir, "test-small.txt");
      fs.writeFileSync(testFilePath, "Hello, World!");

      const response = await request(app)
        .post("/api/files/upload")
        .field("projectId", "test-project-1")
        .field("purpose", "text-document")
        .attach("file", testFilePath);

      expect(response.status).toBe(201);
      expect(response.body.file).toBeDefined();
      expect(response.body.file.name).toMatch(/test-small/);
      expect(response.body.file.projectId).toBe("test-project-1");
      expect(response.body.file.purpose).toBe("text-document");
      expect(response.body.file.inlineData).toBeDefined();
      expect(response.body.file.uri).toBeUndefined();
      expect(response.body.requestId).toBeDefined();
    });

    it("should reject upload without file", async () => {
      const config = { ...getConfig(), dataDir: testDataDir };
      const app = createApp(db, config);

      const response = await request(app)
        .post("/api/files/upload")
        .field("projectId", "test-project-1")
        .field("purpose", "text-document");

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("No file provided");
      expect(response.body.errorCode).toBe("FILE_MISSING");
    });

    it("should reject upload with invalid purpose", async () => {
      const config = { ...getConfig(), dataDir: testDataDir };
      const app = createApp(db, config);

      const testFilePath = path.join(testDataDir, "test.txt");
      fs.writeFileSync(testFilePath, "Test");

      const response = await request(app)
        .post("/api/files/upload")
        .field("projectId", "test-project-1")
        .field("purpose", "invalid-purpose")
        .attach("file", testFilePath);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Invalid request payload");
      expect(response.body.errorCode).toBe("VALIDATION_FAILED");
    });

    it("should reject upload for non-existent project", async () => {
      const config = { ...getConfig(), dataDir: testDataDir };
      const app = createApp(db, config);

      const testFilePath = path.join(testDataDir, "test.txt");
      fs.writeFileSync(testFilePath, "Test");

      const response = await request(app)
        .post("/api/files/upload")
        .field("projectId", "non-existent-project")
        .field("purpose", "text-document")
        .attach("file", testFilePath);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain("Project not found");
      expect(response.body.errorCode).toBe("PROJECT_NOT_FOUND");
    });
  });

  describe("GET /api/files/:id", () => {
    it("should retrieve file details", async () => {
      const config = {
        ...getConfig(),
        dataDir: testDataDir,
        filesApiEnabled: false,
      };
      const app = createApp(db, config);

      // Upload a file first
      const testFilePath = path.join(testDataDir, "test.txt");
      fs.writeFileSync(testFilePath, "Test content");

      const uploadResponse = await request(app)
        .post("/api/files/upload")
        .field("projectId", "test-project-1")
        .field("purpose", "text-document")
        .attach("file", testFilePath);

      const fileId = uploadResponse.body.file.id;

      // Retrieve file details
      const response = await request(app).get(`/api/files/${fileId}`);

      expect(response.status).toBe(200);
      expect(response.body.file).toBeDefined();
      expect(response.body.file.id).toBe(fileId);
      expect(response.body.file.projectId).toBe("test-project-1");
    });

    it("should return 404 for non-existent file", async () => {
      const config = { ...getConfig(), dataDir: testDataDir };
      const app = createApp(db, config);

      const response = await request(app).get("/api/files/non-existent-id");

      expect(response.status).toBe(404);
      expect(response.body.error).toContain("File not found");
      expect(response.body.errorCode).toBe("FILE_NOT_FOUND");
    });
  });

  describe("PUT /api/files/:id", () => {
    it("should update file purpose", async () => {
      const config = {
        ...getConfig(),
        dataDir: testDataDir,
        filesApiEnabled: false,
      };
      const app = createApp(db, config);

      // Upload a file first
      const testFilePath = path.join(testDataDir, "test.txt");
      fs.writeFileSync(testFilePath, "Test content");

      const uploadResponse = await request(app)
        .post("/api/files/upload")
        .field("projectId", "test-project-1")
        .field("purpose", "text-document")
        .attach("file", testFilePath);

      const fileId = uploadResponse.body.file.id;

      // Update file purpose
      const response = await request(app)
        .put(`/api/files/${fileId}`)
        .send({ purpose: "style-reference" });

      expect(response.status).toBe(200);
      expect(response.body.file).toBeDefined();
      expect(response.body.file.id).toBe(fileId);
      expect(response.body.file.purpose).toBe("style-reference");

      // Verify the update persisted
      const getResponse = await request(app).get(`/api/files/${fileId}`);
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.file.purpose).toBe("style-reference");
    });

    it("should reject invalid file purpose", async () => {
      const config = {
        ...getConfig(),
        dataDir: testDataDir,
        filesApiEnabled: false,
      };
      const app = createApp(db, config);

      // Upload a file first
      const testFilePath = path.join(testDataDir, "test.txt");
      fs.writeFileSync(testFilePath, "Test content");

      const uploadResponse = await request(app)
        .post("/api/files/upload")
        .field("projectId", "test-project-1")
        .field("purpose", "text-document")
        .attach("file", testFilePath);

      const fileId = uploadResponse.body.file.id;

      // Try to update with invalid purpose
      const response = await request(app)
        .put(`/api/files/${fileId}`)
        .send({ purpose: "invalid-purpose" });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Invalid file purpose");
      expect(response.body.errorCode).toBe("VALIDATION_FAILED");
    });

    it("should return 404 for non-existent file", async () => {
      const config = { ...getConfig(), dataDir: testDataDir };
      const app = createApp(db, config);

      const response = await request(app)
        .put("/api/files/non-existent-id")
        .send({ purpose: "style-reference" });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain("File not found");
      expect(response.body.errorCode).toBe("FILE_NOT_FOUND");
    });
  });

  describe("DELETE /api/files/:id", () => {
    it("should delete a file", async () => {
      const config = {
        ...getConfig(),
        dataDir: testDataDir,
        filesApiEnabled: false,
      };
      const app = createApp(db, config);

      // Upload a file first
      const testFilePath = path.join(testDataDir, "test.txt");
      fs.writeFileSync(testFilePath, "Test content");

      const uploadResponse = await request(app)
        .post("/api/files/upload")
        .field("projectId", "test-project-1")
        .field("purpose", "text-document")
        .attach("file", testFilePath);

      const fileId = uploadResponse.body.file.id;

      // Delete the file
      const response = await request(app).delete(`/api/files/${fileId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify file is deleted
      const getResponse = await request(app).get(`/api/files/${fileId}`);
      expect(getResponse.status).toBe(404);
    });

    it("should return 404 when deleting non-existent file", async () => {
      const config = { ...getConfig(), dataDir: testDataDir };
      const app = createApp(db, config);

      const response = await request(app).delete("/api/files/non-existent-id");

      expect(response.status).toBe(404);
      expect(response.body.error).toContain("File not found");
    });
  });

  describe("File cleanup on project deletion", () => {
    it("should clean up uploaded files when project is deleted", async () => {
      const config = {
        ...getConfig(),
        dataDir: testDataDir,
        filesApiEnabled: false,
      };
      const app = createApp(db, config);

      // Upload a file
      const testFilePath = path.join(testDataDir, "test.txt");
      fs.writeFileSync(testFilePath, "Test content");

      const uploadResponse = await request(app)
        .post("/api/files/upload")
        .field("projectId", "test-project-1")
        .field("purpose", "text-document")
        .attach("file", testFilePath);

      const fileId = uploadResponse.body.file.id;

      // Verify file exists
      const getResponse = await request(app).get(`/api/files/${fileId}`);
      expect(getResponse.status).toBe(200);

      // Delete the project
      const deleteResponse = await request(app).delete(
        "/api/projects/test-project-1"
      );
      expect(deleteResponse.status).toBe(200);

      // Verify uploaded files directory is cleaned up
      const uploadsDir = path.join(
        testDataDir,
        "assets",
        "test-project-1",
        "uploads"
      );
      expect(fs.existsSync(uploadsDir)).toBe(false);

      // Verify file record is deleted from database
      const rows = db
        .prepare("SELECT * FROM uploaded_files WHERE id = ?")
        .all(fileId);
      expect(rows.length).toBe(0);
    });
  });
});
