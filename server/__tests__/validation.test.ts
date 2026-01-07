import { describe, expect, it } from "vitest";
import {
  workflowCategorySchema,
  createScenesSchema,
  updateSceneSchema,
  aiGenerateImageSchema,
  aiGenerateVideoSchema,
} from "../validation";

describe("Validation Schemas", () => {
  describe("workflowCategorySchema", () => {
    it("accepts 'concept-art' as a valid category", () => {
      const result = workflowCategorySchema.safeParse("concept-art");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("concept-art");
      }
    });

    it("accepts all valid workflow categories", () => {
      const validCategories = [
        "music-video",
        "commercial",
        "social",
        "explainer",
        "custom",
        "concept-art",
      ];

      validCategories.forEach((category) => {
        const result = workflowCategorySchema.safeParse(category);
        expect(result.success).toBe(true);
      });
    });

    it("rejects invalid categories", () => {
      const invalidCategories = [
        "invalid-category",
        "music",
        "video",
        "",
        null,
        undefined,
        123,
        {},
        [],
      ];

      invalidCategories.forEach((category) => {
        const result = workflowCategorySchema.safeParse(category);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("Aspect Ratio Validation", () => {
    describe("createScenesSchema", () => {
      it("accepts '1:1' aspect ratio", () => {
        const result = createScenesSchema.safeParse({
          scenes: [
            {
              description: "Test scene",
              aspectRatio: "1:1",
            },
          ],
        });
        expect(result.success).toBe(true);
      });

      it("accepts all valid aspect ratios", () => {
        const validRatios = ["16:9", "9:16", "1:1"];

        validRatios.forEach((ratio) => {
          const result = createScenesSchema.safeParse({
            scenes: [
              {
                description: "Test scene",
                aspectRatio: ratio,
              },
            ],
          });
          expect(result.success).toBe(true);
        });
      });

      it("rejects invalid aspect ratios", () => {
        const invalidRatios = ["4:3", "21:9", "1:2", "", null, undefined];

        invalidRatios.forEach((ratio) => {
          const result = createScenesSchema.safeParse({
            scenes: [
              {
                description: "Test scene",
                aspectRatio: ratio,
              },
            ],
          });
          expect(result.success).toBe(false);
        });
      });
    });

    describe("updateSceneSchema", () => {
      it("accepts '1:1' aspect ratio", () => {
        const result = updateSceneSchema.safeParse({
          aspectRatio: "1:1",
        });
        expect(result.success).toBe(true);
      });

      it("accepts all valid aspect ratios", () => {
        const validRatios = ["16:9", "9:16", "1:1"];

        validRatios.forEach((ratio) => {
          const result = updateSceneSchema.safeParse({
            aspectRatio: ratio,
          });
          expect(result.success).toBe(true);
        });
      });

      it("rejects invalid aspect ratios", () => {
        const invalidRatios = ["4:3", "21:9", "1:2", ""];

        invalidRatios.forEach((ratio) => {
          const result = updateSceneSchema.safeParse({
            aspectRatio: ratio,
          });
          expect(result.success).toBe(false);
        });
      });
    });

    describe("aiGenerateImageSchema", () => {
      it("accepts '1:1' aspect ratio", () => {
        const result = aiGenerateImageSchema.safeParse({
          projectId: "test-project",
          sceneId: "test-scene",
          description: "Test description",
          aspectRatio: "1:1",
          imageModel: "imagen-4.0-generate-001",
          workflow: "music-video",
        });
        expect(result.success).toBe(true);
      });

      it("accepts all valid aspect ratios", () => {
        const validRatios = ["16:9", "9:16", "1:1"];

        validRatios.forEach((ratio) => {
          const result = aiGenerateImageSchema.safeParse({
            projectId: "test-project",
            sceneId: "test-scene",
            description: "Test description",
            aspectRatio: ratio,
            imageModel: "imagen-4.0-generate-001",
            workflow: "music-video",
          });
          expect(result.success).toBe(true);
        });
      });

      it("rejects invalid aspect ratios", () => {
        const invalidRatios = ["4:3", "21:9", "1:2", ""];

        invalidRatios.forEach((ratio) => {
          const result = aiGenerateImageSchema.safeParse({
            projectId: "test-project",
            sceneId: "test-scene",
            description: "Test description",
            aspectRatio: ratio,
            imageModel: "imagen-4.0-generate-001",
            workflow: "music-video",
          });
          expect(result.success).toBe(false);
        });
      });
    });

    describe("aiGenerateVideoSchema", () => {
      it("accepts '1:1' aspect ratio", () => {
        const result = aiGenerateVideoSchema.safeParse({
          projectId: "test-project",
          sceneId: "test-scene",
          prompt: "Test prompt",
          aspectRatio: "1:1",
        });
        expect(result.success).toBe(true);
      });

      it("accepts all valid aspect ratios", () => {
        const validRatios = ["16:9", "9:16", "1:1"];

        validRatios.forEach((ratio) => {
          const result = aiGenerateVideoSchema.safeParse({
            projectId: "test-project",
            sceneId: "test-scene",
            prompt: "Test prompt",
            aspectRatio: ratio,
          });
          expect(result.success).toBe(true);
        });
      });

      it("rejects invalid aspect ratios", () => {
        const invalidRatios = ["4:3", "21:9", "1:2", ""];

        invalidRatios.forEach((ratio) => {
          const result = aiGenerateVideoSchema.safeParse({
            projectId: "test-project",
            sceneId: "test-scene",
            prompt: "Test prompt",
            aspectRatio: ratio,
          });
          expect(result.success).toBe(false);
        });
      });
    });
  });
});
