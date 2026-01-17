import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  generateChatResponse,
  streamChatResponse,
  generateEnhancedStoryboard,
  generateStylePreviews,
  generateSceneImage,
  editSceneImage,
  generateSceneVideo,
  generateImageEditPrompt,
  generateVideoPrompt,
} from "../geminiClient";

// Mock the @google/genai module
const mockGenerateContent = vi.fn();
const mockGenerateContentStream = vi.fn();
const mockGenerateImages = vi.fn();
const mockGenerateVideos = vi.fn();

vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: vi.fn(() => ({
      models: {
        generateContent: mockGenerateContent,
        generateContentStream: mockGenerateContentStream,
        generateImages: mockGenerateImages,
        generateVideos: mockGenerateVideos,
      },
    })),
    Type: {
      STRING: "string",
      ARRAY: "array",
      OBJECT: "object",
    },
    Modality: {
      TEXT: "text",
      IMAGE: "image",
    },
    HarmBlockThreshold: {
      BLOCK_NONE: "BLOCK_NONE",
    },
    HarmCategory: {
      HARM_CATEGORY_HARASSMENT: "HARM_CATEGORY_HARASSMENT",
      HARM_CATEGORY_HATE_SPEECH: "HARM_CATEGORY_HATE_SPEECH",
      HARM_CATEGORY_SEXUALLY_EXPLICIT: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      HARM_CATEGORY_DANGEROUS_CONTENT: "HARM_CATEGORY_DANGEROUS_CONTENT",
    },
  };
});

describe("Gemini Client Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set API key for tests
    process.env.GEMINI_API_KEY = "test-api-key";
  });

  describe("generateChatResponse", () => {
    it("should generate a chat response", async () => {
      const mockResponse = {
        text: "This is a test response",
        candidates: [
          {
            content: {
              parts: [{ text: "This is a test response" }],
            },
          },
        ],
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await generateChatResponse(
        "Hello",
        [],
        undefined,
        "gemini-2.5-flash",
        "music-video",
        false
      );

      expect(result).toBe("This is a test response");
      expect(mockGenerateContent).toHaveBeenCalled();
    });

    it("should throw error when API key is missing", async () => {
      delete process.env.GEMINI_API_KEY;

      await expect(
        generateChatResponse(
          "Hello",
          [],
          undefined,
          "gemini-2.5-flash",
          "music-video",
          false
        )
      ).rejects.toThrow("GEMINI_API_KEY environment variable not set");
    });
  });

  describe("streamChatResponse", () => {
    it("should stream chat response chunks", async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { text: "Hello " };
          yield { text: "world" };
        },
      };

      mockGenerateContentStream.mockResolvedValue(mockStream);

      const chunks: string[] = [];
      for await (const chunk of streamChatResponse(
        "Hello",
        [],
        undefined,
        "gemini-2.5-pro",
        "music-video",
        false
      )) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(["Hello ", "world"]);
      expect(mockGenerateContentStream).toHaveBeenCalled();
    });
  });

  describe("generateEnhancedStoryboard", () => {
    it("should generate enhanced storyboard with metadata", async () => {
      const scenesData = {
        scenes: [
          {
            description: "Opening scene",
            imagePrompt: "A dramatic opening",
            animationPrompt: "Slow zoom in",
            metadata: {
              duration: 5,
              cameraMovement: "zoom",
              lighting: "dramatic",
              mood: "intense",
            },
          },
        ],
      };

      const mockResponse = {
        text: JSON.stringify(scenesData),
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(scenesData) }],
            },
          },
        ],
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await generateEnhancedStoryboard(
        "A music video concept",
        3,
        "music-video",
        "Create engaging scenes"
      );

      expect(result.scenes).toHaveLength(1);
      expect(result.scenes[0]).toHaveProperty("description");
      expect(result.scenes[0]).toHaveProperty("imagePrompt");
      expect(result.scenes[0]).toHaveProperty("animationPrompt");
      expect(result.scenes[0]).toHaveProperty("metadata");
      expect(result.scenes[0].metadata).toHaveProperty("duration");
      expect(mockGenerateContent).toHaveBeenCalled();
    });
  });

  describe("generateStylePreviews", () => {
    it("should generate exactly 4 style preview scenes", async () => {
      const previewsData = {
        previews: [
          {
            id: "preview-1",
            description: "Dark and moody",
            imagePrompt: "Dark scene",
            styleDirection: "Dark & Moody",
            metadata: { mood: "mysterious" },
          },
          {
            id: "preview-2",
            description: "Bright and energetic",
            imagePrompt: "Bright scene",
            styleDirection: "Bright & Energetic",
            metadata: { mood: "uplifting" },
          },
          {
            id: "preview-3",
            description: "Minimalist",
            imagePrompt: "Clean scene",
            styleDirection: "Minimalist",
            metadata: { mood: "calm" },
          },
          {
            id: "preview-4",
            description: "Abstract",
            imagePrompt: "Abstract scene",
            styleDirection: "Abstract",
            metadata: { mood: "intriguing" },
          },
        ],
      };

      const mockResponse = {
        text: JSON.stringify(previewsData),
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(previewsData) }],
            },
          },
        ],
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await generateStylePreviews(
        "Urban exploration",
        "music-video"
      );

      expect(result.previews).toHaveLength(4);
      expect(result.previews[0]).toHaveProperty("styleDirection");
      expect(result.previews[0]).toHaveProperty("metadata");
      expect(mockGenerateContent).toHaveBeenCalled();
    });
  });

  describe("generateSceneImage", () => {
    it("should generate scene image with base64 data", async () => {
      const mockImageData = Buffer.from("fake-image-data").toString("base64");
      const mockResponse = {
        images: [
          {
            base64Data: mockImageData,
            mimeType: "image/png",
          },
        ],
      };

      mockGenerateImages.mockResolvedValue(mockResponse);

      const result = await generateSceneImage(
        "A dramatic scene",
        "16:9",
        ["cinematic"],
        "imagen-4.0-generate-001",
        "music-video",
        false
      );

      expect(result.data).toBe(mockImageData);
      expect(result.mimeType).toBe("image/png");
      expect(mockGenerateImages).toHaveBeenCalled();
    });
  });

  describe("editSceneImage", () => {
    it("should edit an existing image", async () => {
      const mockEditedData =
        Buffer.from("edited-image-data").toString("base64");
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    data: mockEditedData,
                    mimeType: "image/png",
                  },
                },
              ],
            },
          },
        ],
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const originalImage = Buffer.from("original-image").toString("base64");
      const result = await editSceneImage(
        originalImage,
        "image/png",
        "Add warmer lighting"
      );

      expect(result.data).toBe(mockEditedData);
      expect(result.mimeType).toBe("image/png");
      expect(mockGenerateContent).toHaveBeenCalled();
    });
  });

  describe("generateSceneVideo", () => {
    it("should generate video from image", async () => {
      const mockVideoData = Buffer.from("mock-video-data").toString("base64");
      const mockResponse = {
        video: {
          base64Data: mockVideoData,
          mimeType: "video/mp4",
        },
      };

      mockGenerateVideos.mockResolvedValue(mockResponse);

      const imageData = Buffer.from("image-data").toString("base64");
      const result = await generateSceneVideo(
        { data: imageData, mimeType: "image/png" },
        "Animate with slow pan",
        "veo-3.1-generate-001",
        "16:9",
        "1080p"
      );

      expect(result.data).toBeDefined();
      expect(result.mimeType).toBe("video/mp4");
      expect(mockGenerateVideos).toHaveBeenCalled();
    });
  });

  describe("generateImageEditPrompt", () => {
    it("should generate edit prompt suggestion", async () => {
      const mockResponse = {
        text: "Apply warmer lighting for a sunset vibe",
        candidates: [
          {
            content: {
              parts: [{ text: "Apply warmer lighting for a sunset vibe" }],
            },
          },
        ],
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const imageData = Buffer.from("image-data").toString("base64");
      const result = await generateImageEditPrompt(
        "A sunset scene",
        imageData,
        "image/png"
      );

      expect(result).toBe("Apply warmer lighting for a sunset vibe");
      expect(mockGenerateContent).toHaveBeenCalled();
    });
  });

  describe("generateVideoPrompt", () => {
    it("should generate video animation prompt", async () => {
      const mockResponse = {
        text: "Add a slow dolly-in with drifting particles",
        candidates: [
          {
            content: {
              parts: [{ text: "Add a slow dolly-in with drifting particles" }],
            },
          },
        ],
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const imageData = Buffer.from("image-data").toString("base64");
      const result = await generateVideoPrompt(
        "A cityscape scene",
        imageData,
        "image/png"
      );

      expect(result).toBe("Add a slow dolly-in with drifting particles");
      expect(mockGenerateContent).toHaveBeenCalled();
    });
  });
});
