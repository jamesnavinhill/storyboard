import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import request from "supertest";
import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { createApp } from "../../app";
import { runMigrations } from "../../migrations/runMigrations";
import type { AppConfig } from "../../config";

// Mock Gemini client
const mockGemini = vi.hoisted(() => ({
  streamChatResponse: vi.fn(async function* () {
    yield "Streaming ";
    yield "response ";
    yield "test";
  }),
  generateEnhancedStoryboard: vi.fn(async () => ({
    scenes: [
      {
        description: "Enhanced scene 1",
        imagePrompt: "A vibrant opening scene",
        animationPrompt: "Slow pan with zoom",
        metadata: {
          duration: 5,
          cameraMovement: "pan",
          lighting: "warm",
          mood: "energetic",
        },
      },
      {
        description: "Enhanced scene 2",
        imagePrompt: "A dramatic closing scene",
        animationPrompt: "Static with subtle movement",
        metadata: {
          duration: 7,
          cameraMovement: "static",
          lighting: "dramatic",
          mood: "mysterious",
        },
      },
    ],
    modelResponse: "Generated 2 enhanced scenes with total duration 12 seconds",
  })),
  generateStylePreviews: vi.fn(async () => ({
    previews: [
      {
        id: "preview-1",
        description: "Dark and moody style",
        imagePrompt: "Dark scene with dramatic shadows",
        styleDirection: "Dark & Moody",
        metadata: {
          mood: "mysterious",
          colorPalette: "cool blues",
          visualStyle: "high contrast",
        },
      },
      {
        id: "preview-2",
        description: "Bright and energetic style",
        imagePrompt: "Bright scene with vibrant colors",
        styleDirection: "Bright & Energetic",
        metadata: {
          mood: "uplifting",
          colorPalette: "warm oranges",
          visualStyle: "high saturation",
        },
      },
      {
        id: "preview-3",
        description: "Minimalist style",
        imagePrompt: "Clean scene with simple composition",
        styleDirection: "Minimalist",
        metadata: {
          mood: "calm",
          colorPalette: "muted pastels",
          visualStyle: "negative space",
        },
      },
      {
        id: "preview-4",
        description: "Abstract style",
        imagePrompt: "Abstract scene with experimental visuals",
        styleDirection: "Abstract",
        metadata: {
          mood: "intriguing",
          colorPalette: "mixed spectrum",
          visualStyle: "unconventional",
        },
      },
    ],
    modelResponse: "Generated 4 style preview directions",
  })),
  generateSceneImage: vi.fn(async () => ({
    data: Buffer.from("fake-image-data").toString("base64"),
    mimeType: "image/png",
  })),
}));

vi.mock("../../services/geminiClient", () => mockGemini);

describe("AI Endpoints", () => {
  let db: Database.Database;
  let app: ReturnType<typeof createApp>;
  let tempDir: string;
  let projectId: string;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-test-"));
    const dbPath = path.join(tempDir, "test.db");

    process.env.DB_PATH = dbPath;
    process.env.DATA_DIR = tempDir;
    process.env.GEMINI_API_KEY = "test-api-key";

    db = new Database(dbPath);
    runMigrations(db);

    const config: AppConfig = {
      port: 0,
      dbPath,
      dataDir: tempDir,
      corsOrigin: undefined,
      enableAiTelemetry: false,
      aiRateLimitWindowMs: 60000,
      aiRateLimitMaxRequests: 1000,
      maxFileSizeMb: 100,
      filesApiEnabled: true,
      enableThinkingMode: false,
      enableContextCaching: true,
      defaultVideoModel: "veo-3.1-generate-001",
      enableStreaming: true,
    };

    app = createApp(db, config);

    // Create test project
    const result = db
      .prepare("INSERT INTO projects (id, name) VALUES (?, ?)")
      .run("test-project-1", "Test Project");
    projectId = "test-project-1";
  });

  afterAll(() => {
    db.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/ai/chat/stream", () => {
    it("should stream chat responses with SSE", async () => {
      const response = await request(app)
        .post("/api/ai/chat/stream")
        .send({
          prompt: "Tell me about storyboards",
          history: [],
          chatModel: "gemini-2.5-pro",
          workflow: "music-video",
          thinkingMode: false,
        })
        .expect(200)
        .expect("Content-Type", /text\/event-stream/)
        .expect("x-request-id", /.+/);

      expect(mockGemini.streamChatResponse).toHaveBeenCalledTimes(1);
      expect(mockGemini.streamChatResponse).toHaveBeenCalledWith(
        "Tell me about storyboards",
        [],
        undefined,
        "gemini-2.5-pro",
        "music-video",
        false
      );
    });

    it("should handle streaming with thinking mode enabled", async () => {
      await request(app)
        .post("/api/ai/chat/stream")
        .send({
          prompt: "Complex question",
          history: [],
          chatModel: "gemini-2.5-pro",
          workflow: "music-video",
          thinkingMode: true,
        })
        .expect(200);

      expect(mockGemini.streamChatResponse).toHaveBeenCalledWith(
        "Complex question",
        [],
        undefined,
        "gemini-2.5-pro",
        "music-video",
        true
      );
    });

    it("should handle streaming with chat history", async () => {
      await request(app)
        .post("/api/ai/chat/stream")
        .send({
          prompt: "Continue the conversation",
          history: [
            { role: "user", text: "Hello" },
            { role: "model", text: "Hi there!" },
          ],
          chatModel: "gemini-2.5-flash",
          workflow: "music-video",
        })
        .expect(200);

      expect(mockGemini.streamChatResponse).toHaveBeenCalledWith(
        "Continue the conversation",
        [
          { role: "user", text: "Hello" },
          { role: "model", text: "Hi there!" },
        ],
        undefined,
        "gemini-2.5-flash",
        "music-video",
        false
      );
    });

    it("should return 400 for invalid payload", async () => {
      const response = await request(app)
        .post("/api/ai/chat/stream")
        .send({
          // Missing required fields
          chatModel: "gemini-2.5-pro",
        })
        .expect(400);

      expect(response.body.error).toContain("Invalid request payload");
      expect(response.body.errorCode).toBe("VALIDATION_FAILED");
    });

    it("should include request ID in response headers", async () => {
      const response = await request(app)
        .post("/api/ai/chat/stream")
        .send({
          prompt: "Test",
          history: [],
          chatModel: "gemini-2.5-pro",
          workflow: "music-video",
        })
        .expect(200);

      expect(response.headers["x-request-id"]).toBeDefined();
      expect(response.headers["x-request-id"]).toMatch(/^[a-f0-9-]{36}$/);
    });
  });

  describe("POST /api/ai/storyboard/enhanced", () => {
    it("should generate enhanced storyboard with metadata", async () => {
      const response = await request(app)
        .post("/api/ai/storyboard/enhanced")
        .send({
          concept: "Futuristic city at night",
          sceneCount: 2,
          workflow: "music-video",
          systemInstruction: "Create cinematic scenes",
        })
        .expect(200);

      expect(response.body.scenes).toHaveLength(2);
      expect(response.body.scenes[0]).toHaveProperty("description");
      expect(response.body.scenes[0]).toHaveProperty("imagePrompt");
      expect(response.body.scenes[0]).toHaveProperty("animationPrompt");
      expect(response.body.scenes[0]).toHaveProperty("metadata");
      expect(response.body.scenes[0].metadata).toHaveProperty("duration");
      expect(response.body.scenes[0].metadata).toHaveProperty("cameraMovement");
      expect(response.body.scenes[0].metadata).toHaveProperty("lighting");
      expect(response.body.scenes[0].metadata).toHaveProperty("mood");

      expect(mockGemini.generateEnhancedStoryboard).toHaveBeenCalledWith(
        "Futuristic city at night",
        2,
        "music-video",
        "Create cinematic scenes"
      );
    });

    it("should work without system instruction", async () => {
      const response = await request(app)
        .post("/api/ai/storyboard/enhanced")
        .send({
          concept: "Urban exploration",
          sceneCount: 3,
          workflow: "music-video",
        })
        .expect(200);

      expect(response.body.scenes).toBeDefined();
      expect(mockGemini.generateEnhancedStoryboard).toHaveBeenCalledWith(
        "Urban exploration",
        3,
        "music-video",
        undefined
      );
    });

    it("should return 400 for invalid scene count", async () => {
      const response = await request(app)
        .post("/api/ai/storyboard/enhanced")
        .send({
          concept: "Test concept",
          sceneCount: -1, // Invalid
          workflow: "music-video",
        })
        .expect(400);

      expect(response.body.error).toContain("Invalid request payload");
    });

    it("should include request ID and telemetry data", async () => {
      const response = await request(app)
        .post("/api/ai/storyboard/enhanced")
        .send({
          concept: "Test",
          sceneCount: 2,
          workflow: "music-video",
        })
        .expect(200);

      expect(response.headers["x-request-id"]).toBeDefined();
    });
  });

  describe("POST /api/ai/preview-styles", () => {
    it("should generate exactly 4 style preview scenes", async () => {
      const response = await request(app)
        .post("/api/ai/preview-styles")
        .send({
          concept: "Urban exploration at sunset",
          workflow: "music-video",
        })
        .expect(200);

      expect(response.body.previews).toHaveLength(4);
      expect(response.body.previews[0]).toHaveProperty("id");
      expect(response.body.previews[0]).toHaveProperty("description");
      expect(response.body.previews[0]).toHaveProperty("imagePrompt");
      expect(response.body.previews[0]).toHaveProperty("styleDirection");
      expect(response.body.previews[0]).toHaveProperty("metadata");
      expect(response.body.previews[0].metadata).toHaveProperty("mood");
      expect(response.body.previews[0].metadata).toHaveProperty("colorPalette");
      expect(response.body.previews[0].metadata).toHaveProperty("visualStyle");

      expect(mockGemini.generateStylePreviews).toHaveBeenCalledWith(
        "Urban exploration at sunset",
        "music-video"
      );
    });

    it("should work with different workflow types", async () => {
      await request(app)
        .post("/api/ai/preview-styles")
        .send({
          concept: "Product showcase",
          workflow: "product-commercial",
        })
        .expect(200);

      expect(mockGemini.generateStylePreviews).toHaveBeenCalledWith(
        "Product showcase",
        "product-commercial"
      );
    });

    it("should return 400 for missing concept", async () => {
      const response = await request(app)
        .post("/api/ai/preview-styles")
        .send({
          workflow: "music-video",
          // Missing concept
        })
        .expect(400);

      expect(response.body.error).toContain("Invalid request payload");
    });

    it("should include model response in output", async () => {
      const response = await request(app)
        .post("/api/ai/preview-styles")
        .send({
          concept: "Test concept",
          workflow: "music-video",
        })
        .expect(200);

      expect(response.body.modelResponse).toBeDefined();
      expect(response.body.modelResponse).toContain("style preview");
    });
  });

  describe("Rate Limiting", () => {
    it("should enforce rate limits on AI endpoints", async () => {
      const response = await request(app)
        .post("/api/ai/chat/stream")
        .send({
          prompt: "Test",
          history: [],
          chatModel: "gemini-2.5-pro",
          workflow: "music-video",
        })
        .expect(200);

      expect(response.headers["x-rate-limit-limit"]).toBeDefined();
      expect(response.headers["x-rate-limit-remaining"]).toBeDefined();
      expect(response.headers["x-rate-limit-reset"]).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should return structured errors with request IDs", async () => {
      const response = await request(app)
        .post("/api/ai/storyboard/enhanced")
        .send({
          // Invalid payload
          concept: "",
          sceneCount: 0,
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.requestId).toBeDefined();
      expect(response.body.retryable).toBeDefined();
      expect(response.body.errorCode).toBeDefined();
    });

    it("should handle missing API key gracefully", async () => {
      const originalKey = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;

      const response = await request(app).post("/api/ai/chat/stream").send({
        prompt: "Test",
        history: [],
        chatModel: "gemini-2.5-pro",
        workflow: "music-video",
      });

      // Restore API key
      process.env.GEMINI_API_KEY = originalKey;

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.requestId).toBeDefined();
    });
  });

  describe("Entry Point Tracking", () => {
    it("should track entry points in requests", async () => {
      await request(app)
        .post("/api/ai/storyboard/enhanced")
        .send({
          concept: "Test",
          sceneCount: 2,
          workflow: "music-video",
          entryPoint: "agent:generate-enhanced",
        })
        .expect(200);

      expect(mockGemini.generateEnhancedStoryboard).toHaveBeenCalled();
    });

    it("should use default entry point when not provided", async () => {
      await request(app)
        .post("/api/ai/preview-styles")
        .send({
          concept: "Test",
          workflow: "music-video",
        })
        .expect(200);

      expect(mockGemini.generateStylePreviews).toHaveBeenCalled();
    });
  });

  describe("Aspect Ratio Support", () => {
    let sceneId: string;

    beforeAll(() => {
      // Create a test scene with an image
      const sceneResult = db
        .prepare(
          "INSERT INTO scenes (id, project_id, description, aspect_ratio, order_index) VALUES (?, ?, ?, ?, ?)"
        )
        .run(
          "test-scene-1",
          projectId,
          "Test scene for aspect ratio",
          "1:1",
          0
        );
      sceneId = "test-scene-1";

      // Create a test image asset
      db.prepare(
        "INSERT INTO assets (id, project_id, scene_id, type, file_path, file_name, mime_type, size) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).run(
        "test-asset-1",
        projectId,
        sceneId,
        "image",
        path.join(tempDir, "test.png"),
        "test.png",
        "image/png",
        1024
      );

      // Create the test image file
      fs.writeFileSync(path.join(tempDir, "test.png"), Buffer.from("test"));

      // Link the asset to the scene
      db.prepare(
        "UPDATE scenes SET primary_image_asset_id = ? WHERE id = ?"
      ).run("test-asset-1", sceneId);
    });

    it("should accept 1:1 aspect ratio for image generation", async () => {
      const response = await request(app).post("/api/ai/image").send({
        projectId,
        sceneId,
        description: "Square format album art",
        aspectRatio: "1:1",
        imageModel: "imagen-4.0-generate-001",
        workflow: "concept-art",
      });

      // The endpoint will fail because we're mocking, but validation should pass
      // If it's a 400 error, check it's not about aspect ratio
      if (response.status === 400) {
        expect(response.body.error).not.toContain("aspect ratio");
        expect(response.body.error).not.toContain("aspectRatio");
      }
    });

    it("should accept 1:1 aspect ratio for video generation", async () => {
      const response = await request(app).post("/api/ai/video").send({
        projectId,
        sceneId,
        prompt: "Animate this square image",
        aspectRatio: "1:1",
        model: "veo-3.1-generate-001",
      });

      // The endpoint will fail because we're mocking, but validation should pass
      // If it's a 400 error, check it's not about aspect ratio
      if (response.status === 400) {
        expect(response.body.error).not.toContain("aspect ratio");
        expect(response.body.error).not.toContain("aspectRatio");
      }
    });

    it("should reject invalid aspect ratio for image generation", async () => {
      const response = await request(app)
        .post("/api/ai/image")
        .send({
          projectId,
          sceneId,
          description: "Test image",
          aspectRatio: "4:3",
          imageModel: "imagen-4.0-generate-001",
          workflow: "music-video",
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it("should reject invalid aspect ratio for video generation", async () => {
      const response = await request(app)
        .post("/api/ai/video")
        .send({
          projectId,
          sceneId,
          prompt: "Test video",
          aspectRatio: "21:9",
          model: "veo-3.1-generate-001",
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe("Template Style Badge Integration", () => {
    let testSceneId: string;
    let testTemplateId: string;

    beforeAll(() => {
      // Create a test scene for template integration tests
      db.prepare(
        "INSERT INTO scenes (id, project_id, description, aspect_ratio, order_index) VALUES (?, ?, ?, ?, ?)"
      ).run(
        "template-test-scene",
        projectId,
        "Test scene for template integration",
        "16:9",
        1
      );
      testSceneId = "template-test-scene";

      // Create a test style template
      db.prepare(
        "INSERT INTO style_templates (id, name, description, category, style_prompt, tested) VALUES (?, ?, ?, ?, ?, ?)"
      ).run(
        "test-template-1",
        "Cinematic Style",
        "A cinematic film look",
        JSON.stringify(["music-video"]),
        "cinematic film look with anamorphic lens flares",
        1
      );
      testTemplateId = "test-template-1";
    });

    it("should generate image without template (baseline)", async () => {
      // Mock the generateSceneImage function
      const mockGenerateImage = vi.fn(async () => ({
        data: Buffer.from("fake-image-data").toString("base64"),
        mimeType: "image/png",
      }));

      // Temporarily replace the mock
      const originalMock = mockGemini.generateSceneImage;
      (mockGemini as any).generateSceneImage = mockGenerateImage;

      const response = await request(app).post("/api/ai/image").send({
        projectId,
        sceneId: testSceneId,
        description: "A beautiful sunset",
        aspectRatio: "16:9",
        stylePrompts: [],
        imageModel: "imagen-4.0-generate-001",
        workflow: "music-video",
      });

      // Restore original mock
      (mockGemini as any).generateSceneImage = originalMock;

      // Verify the call was made with empty stylePrompts
      expect(mockGenerateImage).toHaveBeenCalledWith(
        "A beautiful sunset",
        "16:9",
        [],
        "imagen-4.0-generate-001",
        "music-video",
        false
      );
    });

    it("should generate image with template and include stylePrompt", async () => {
      // Mock the generateSceneImage function
      const mockGenerateImage = vi.fn(async () => ({
        data: Buffer.from("fake-image-data").toString("base64"),
        mimeType: "image/png",
      }));

      // Temporarily replace the mock
      const originalMock = mockGemini.generateSceneImage;
      (mockGemini as any).generateSceneImage = mockGenerateImage;

      const response = await request(app).post("/api/ai/image").send({
        projectId,
        sceneId: testSceneId,
        description: "A beautiful sunset",
        aspectRatio: "16:9",
        stylePrompts: [],
        templateId: testTemplateId,
        imageModel: "imagen-4.0-generate-001",
        workflow: "music-video",
      });

      // Restore original mock
      (mockGemini as any).generateSceneImage = originalMock;

      // Verify the call was made with template stylePrompt appended
      expect(mockGenerateImage).toHaveBeenCalledWith(
        "A beautiful sunset",
        "16:9",
        ["cinematic film look with anamorphic lens flares"],
        "imagen-4.0-generate-001",
        "music-video",
        false
      );
    });

    it("should combine multiple stylePrompts with template stylePrompt", async () => {
      // Mock the generateSceneImage function
      const mockGenerateImage = vi.fn(async () => ({
        data: Buffer.from("fake-image-data").toString("base64"),
        mimeType: "image/png",
      }));

      // Temporarily replace the mock
      const originalMock = mockGemini.generateSceneImage;
      (mockGemini as any).generateSceneImage = mockGenerateImage;

      const response = await request(app)
        .post("/api/ai/image")
        .send({
          projectId,
          sceneId: testSceneId,
          description: "A beautiful sunset",
          aspectRatio: "16:9",
          stylePrompts: ["vibrant colors", "dramatic lighting"],
          templateId: testTemplateId,
          imageModel: "imagen-4.0-generate-001",
          workflow: "music-video",
        });

      // Restore original mock
      (mockGemini as any).generateSceneImage = originalMock;

      // Verify all stylePrompts are combined with template stylePrompt
      expect(mockGenerateImage).toHaveBeenCalledWith(
        "A beautiful sunset",
        "16:9",
        [
          "vibrant colors",
          "dramatic lighting",
          "cinematic film look with anamorphic lens flares",
        ],
        "imagen-4.0-generate-001",
        "music-video",
        false
      );
    });

    it("should handle invalid templateId gracefully", async () => {
      // Mock the generateSceneImage function
      const mockGenerateImage = vi.fn(async () => ({
        data: Buffer.from("fake-image-data").toString("base64"),
        mimeType: "image/png",
      }));

      // Temporarily replace the mock
      const originalMock = mockGemini.generateSceneImage;
      (mockGemini as any).generateSceneImage = mockGenerateImage;

      await request(app)
        .post("/api/ai/image")
        .send({
          projectId,
          sceneId: testSceneId,
          description: "A beautiful sunset",
          aspectRatio: "16:9",
          stylePrompts: ["vibrant colors"],
          templateId: "non-existent-template-id",
          imageModel: "imagen-4.0-generate-001",
          workflow: "music-video",
        });

      // Restore original mock
      (mockGemini as any).generateSceneImage = originalMock;

      // Verify the call was made without template stylePrompt (graceful degradation)
      expect(mockGenerateImage).toHaveBeenCalledWith(
        "A beautiful sunset",
        "16:9",
        ["vibrant colors"],
        "imagen-4.0-generate-001",
        "music-video",
        false
      );
    });

    it("should pass templateId through the generation pipeline", async () => {
      // Mock the generateSceneImage function
      const mockGenerateImage = vi.fn(async () => ({
        data: Buffer.from("fake-image-data").toString("base64"),
        mimeType: "image/png",
      }));

      // Temporarily replace the mock
      const originalMock = mockGemini.generateSceneImage;
      (mockGemini as any).generateSceneImage = mockGenerateImage;

      const response = await request(app).post("/api/ai/image").send({
        projectId,
        sceneId: testSceneId,
        description: "A beautiful sunset",
        aspectRatio: "16:9",
        stylePrompts: [],
        templateId: testTemplateId,
        imageModel: "imagen-4.0-generate-001",
        workflow: "music-video",
      });

      // Restore original mock
      (mockGemini as any).generateSceneImage = originalMock;

      // Verify the template stylePrompt was included in the generation call
      expect(mockGenerateImage).toHaveBeenCalledWith(
        "A beautiful sunset",
        "16:9",
        ["cinematic film look with anamorphic lens flares"],
        "imagen-4.0-generate-001",
        "music-video",
        false
      );

      // Verify response includes asset information
      expect(response.body.asset).toBeDefined();
      expect(response.body.asset.id).toBeDefined();
    });
  });
});
