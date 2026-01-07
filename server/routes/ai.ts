import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { Router, type Request, type Response } from "express";
import { ZodError, type infer as ZodInfer } from "zod";
import type { Database as SqliteDatabase } from "better-sqlite3";
import type { AppConfig } from "../config";
import {
  aiChatSchema,
  aiChatStreamSchema,
  aiStoryboardSchema,
  aiEnhancedStoryboardSchema,
  aiPreviewStylesSchema,
  aiGenerateImageSchema,
  aiEditImageSchema,
  aiGenerateVideoSchema,
  aiExtendVideoSchema,
  aiRegenerateDescriptionSchema,
  aiImageEditPromptSchema,
  aiVideoPromptSchema,
} from "../validation";
import {
  generateChatResponse,
  streamChatResponse,
  generateStoryboardScenes,
  generateEnhancedStoryboard,
  generateStylePreviews,
  generateSceneImage,
  regenerateSceneDescription,
  editSceneImage,
  generateSceneVideo,
  extendSceneVideo,
  generateImageEditPrompt,
  generateVideoPrompt,
} from "../services/geminiClient";
import { VideoParameterValidationError } from "../services/videoModelCapabilities";
import { getProjectById, getSceneById } from "../stores/projectStore";
import { getAssetById } from "../stores/assetStore";
import { updateScene } from "../stores/sceneStore";
import { getStyleTemplateById } from "../stores/templateStore";
import { persistAssetBuffer } from "../utils/assetPersistence";
import { enrichSceneWithAssets } from "../utils/sceneEnrichment";
import {
  createAiTelemetryLogger,
  extractEndpoint,
  withRequestContext,
  type ApiRouteError,
} from "../utils/aiTelemetry";
import { createRateLimiter } from "../utils/rateLimiter";

type AiChatPayload = ZodInfer<typeof aiChatSchema>;
type AiChatStreamPayload = ZodInfer<typeof aiChatStreamSchema>;
type AiStoryboardPayload = ZodInfer<typeof aiStoryboardSchema>;
type AiEnhancedStoryboardPayload = ZodInfer<typeof aiEnhancedStoryboardSchema>;
type AiPreviewStylesPayload = ZodInfer<typeof aiPreviewStylesSchema>;
type AiRegeneratePayload = ZodInfer<typeof aiRegenerateDescriptionSchema>;
type AiGenerateImagePayload = ZodInfer<typeof aiGenerateImageSchema>;
type AiEditImagePayload = ZodInfer<typeof aiEditImageSchema>;
type AiImageEditPromptPayload = ZodInfer<typeof aiImageEditPromptSchema>;
type AiVideoPromptPayload = ZodInfer<typeof aiVideoPromptSchema>;
type AiGenerateVideoPayload = ZodInfer<typeof aiGenerateVideoSchema>;
type AiExtendVideoPayload = ZodInfer<typeof aiExtendVideoSchema>;

const requireProject = (db: SqliteDatabase, projectId: string) => {
  const project = getProjectById(db, projectId);
  if (!project) {
    throw Object.assign(new Error("Project not found"), {
      statusCode: 404,
      errorCode: "PROJECT_NOT_FOUND",
      retryable: false,
    });
  }
  return project;
};

const requireScene = (
  db: SqliteDatabase,
  projectId: string,
  sceneId: string
) => {
  const scene = getSceneById(db, projectId, sceneId);
  if (!scene) {
    throw Object.assign(new Error("Scene not found"), {
      statusCode: 404,
      errorCode: "SCENE_NOT_FOUND",
      retryable: false,
    });
  }
  return scene;
};

const readAssetBase64 = (
  filePath: string
): { base64: string; mimeType: string } => {
  const buffer = fs.readFileSync(filePath);
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  const mimeType =
    ext === "png"
      ? "image/png"
      : ext === "jpg" || ext === "jpeg"
        ? "image/jpeg"
        : ext === "webp"
          ? "image/webp"
          : ext === "gif"
            ? "image/gif"
            : ext === "mp4"
              ? "video/mp4"
              : ext === "webm"
                ? "video/webm"
                : "application/octet-stream";
  return { base64: buffer.toString("base64"), mimeType };
};

const extractProjectId = (body: unknown): string | undefined => {
  if (!body || typeof body !== "object") {
    return undefined;
  }
  const value = (body as Record<string, unknown>).projectId;
  return typeof value === "string" ? value : undefined;
};

const extractModel = (body: unknown): string | undefined => {
  if (!body || typeof body !== "object") {
    return undefined;
  }
  const source = body as Record<string, unknown>;
  for (const key of ["chatModel", "imageModel", "model"]) {
    const candidate = source[key];
    if (typeof candidate === "string") {
      return candidate;
    }
  }
  return undefined;
};

export const createAiRouter = (db: SqliteDatabase, config: AppConfig) => {
  const router = Router();
  const telemetry = createAiTelemetryLogger(config);
  const rateLimiter = createRateLimiter({
    windowMs: config.aiRateLimitWindowMs,
    maxRequests: config.aiRateLimitMaxRequests,
  });

  router.use((req, res, next) => {
    const state = rateLimiter.consume(req.ip ?? "unknown");
    res.setHeader("x-rate-limit-limit", String(config.aiRateLimitMaxRequests));
    res.setHeader("x-rate-limit-remaining", String(state.remaining));
    res.setHeader("x-rate-limit-reset", String(state.resetAt));

    if (state.ok) {
      return next();
    }

    const requestId = randomUUID();
    res.setHeader("x-request-id", requestId);
    const retryAfterSeconds = Math.max(1, Math.ceil(state.retryAfterMs / 1000));
    res.setHeader("Retry-After", String(retryAfterSeconds));

    telemetry.error({
      requestId,
      endpoint: extractEndpoint(req),
      status: 429,
      latencyMs: 0,
      geminiModel: extractModel(req.body),
      projectId: extractProjectId(req.body),
      retryable: true,
      errorCode: "RATE_LIMITED",
    });

    res.status(429).json({
      error: "AI rate limit exceeded. Try again shortly.",
      retryable: true,
      requestId,
      errorCode: "RATE_LIMITED",
    });
    return;
  });

  const handle = async <T>(
    req: Request,
    res: Response,
    endpoint: string,
    handler: (
      updateMeta: (meta: {
        geminiModel?: string;
        projectId?: string;
        prompt?: string;
        entryPoint?: string;
      }) => void
    ) => Promise<T>
  ): Promise<void> => {
    try {
      const result = await withRequestContext({
        req,
        res,
        endpoint,
        telemetry,
        handler,
      });
      res.json(result);
    } catch (error) {
      const apiError = error as ApiRouteError;
      let status =
        apiError.statusCode ?? (error instanceof ZodError ? 400 : 500);

      let retryable =
        typeof apiError.retryable === "boolean"
          ? apiError.retryable
          : status >= 500;
      let errorCode = apiError.errorCode;
      let message: string;
      let details: unknown;

      if (error instanceof VideoParameterValidationError) {
        // Handle video parameter validation errors with detailed messages
        status = 400;
        message = error.message;
        retryable = false;
        errorCode = error.errorCode;
      } else if (error instanceof ZodError) {
        message = "Invalid request payload";
        details = error.flatten();
        retryable = false;
        errorCode = errorCode ?? "VALIDATION_FAILED";
      } else {
        message =
          error instanceof Error && error.message
            ? error.message
            : "Internal server error";
      }

      const requestId =
        apiError.requestId ??
        (res.getHeader("x-request-id") as string | undefined) ??
        (() => {
          const generated = randomUUID();
          res.setHeader("x-request-id", generated);
          return generated;
        })();

      if (status >= 500) {
        console.error("[ai:error]", error);
      }

      const responseBody: Record<string, unknown> = {
        error: message,
        retryable,
        requestId,
      };
      if (errorCode) {
        responseBody.errorCode = errorCode;
      }
      if (details) {
        responseBody.details = details;
      }
      if (apiError.entryPoint) {
        responseBody.entryPoint = apiError.entryPoint;
      }

      res.status(status).json(responseBody);
    }
  };

  router.post("/chat", (req, res) => {
    void handle(req, res, "/api/ai/chat", async (setMeta) => {
      const data: AiChatPayload = aiChatSchema.parse(req.body);
      const entryPoint = data.entryPoint ?? "agent:chat";
      setMeta({
        geminiModel: data.chatModel,
        prompt: data.prompt,
        entryPoint,
      });

      const history = (data.history ?? []).map((entry) => ({
        role: entry.role,
        text: entry.text,
      }));
      const image = data.image
        ? { data: data.image.data, mimeType: data.image.mimeType }
        : undefined;
      const text = await generateChatResponse(
        data.prompt,
        history,
        image,
        data.chatModel,
        data.workflow,
        data.thinkingMode
      );
      return { text };
    });
  });

  router.post("/chat/stream", async (req, res) => {
    const requestId = randomUUID();
    const start = Date.now();
    res.setHeader("x-request-id", requestId);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    let data: AiChatStreamPayload;
    let geminiModel: string | undefined;
    let entryPoint: string | undefined;

    try {
      data = aiChatStreamSchema.parse(req.body);
      geminiModel = data.chatModel;
      entryPoint = data.entryPoint ?? "agent:chat";

      const history = (data.history ?? []).map((entry) => ({
        role: entry.role,
        text: entry.text,
      }));
      const image = data.image
        ? { data: data.image.data, mimeType: data.image.mimeType }
        : undefined;

      const stream = streamChatResponse(
        data.prompt,
        history,
        image,
        data.chatModel,
        data.workflow,
        data.thinkingMode
      );

      let connectionClosed = false;
      req.on("close", () => {
        connectionClosed = true;
      });

      for await (const chunk of stream) {
        if (connectionClosed) {
          break;
        }

        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }

      if (!connectionClosed) {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      }

      const latencyMs = Date.now() - start;
      telemetry.info({
        requestId,
        endpoint: "/api/ai/chat/stream",
        status: 200,
        latencyMs,
        geminiModel,
        entryPoint,
      });

      res.end();
    } catch (error) {
      const latencyMs = Date.now() - start;
      const apiError = error as ApiRouteError;
      let status =
        apiError.statusCode ?? (error instanceof ZodError ? 400 : 500);
      let retryable =
        typeof apiError.retryable === "boolean"
          ? apiError.retryable
          : status >= 500;
      let errorCode = apiError.errorCode;
      let message: string;

      if (error instanceof ZodError) {
        message = "Invalid request payload";
        retryable = false;
        errorCode = errorCode ?? "VALIDATION_FAILED";
      } else {
        message =
          error instanceof Error && error.message
            ? error.message
            : "Internal server error";
      }

      telemetry.error({
        requestId,
        endpoint: "/api/ai/chat/stream",
        status,
        latencyMs,
        geminiModel,
        entryPoint,
        retryable,
        errorCode,
      });

      if (status >= 500) {
        console.error("[ai:stream:error]", error);
      }

      const errorData = {
        error: message,
        retryable,
        requestId,
        errorCode,
      };

      res.write(`event: error\ndata: ${JSON.stringify(errorData)}\n\n`);
      res.end();
    }
  });

  router.post("/storyboard", (req, res) => {
    void handle(req, res, "/api/ai/storyboard", async (setMeta) => {
      const data: AiStoryboardPayload = aiStoryboardSchema.parse(req.body);
      const entryPoint = data.entryPoint ?? "agent:generate";
      setMeta({
        geminiModel: "gemini-2.5-flash",
        prompt: data.concept,
        entryPoint,
      });

      const image = data.image
        ? { data: data.image.data, mimeType: data.image.mimeType }
        : undefined;

      const templatePrompts: string[] = [];
      if (data.templateIds && data.templateIds.length > 0) {
        for (const id of data.templateIds) {
          try {
            const template = getStyleTemplateById(db, id);
            if (template && template.stylePrompt) {
              templatePrompts.push(template.stylePrompt);
            }
          } catch (error) {
            console.error(`Error fetching template ${id}:`, error);
          }
        }
      }

      return generateStoryboardScenes(
        data.concept,
        image,
        data.styleNames,
        templatePrompts,
        data.sceneCount,
        data.workflow
      );
    });
  });

  router.post("/storyboard/enhanced", (req, res) => {
    void handle(req, res, "/api/ai/storyboard/enhanced", async (setMeta) => {
      const data: AiEnhancedStoryboardPayload =
        aiEnhancedStoryboardSchema.parse(req.body);
      const entryPoint = data.entryPoint ?? "agent:generate-enhanced";
      setMeta({
        geminiModel: "gemini-2.5-flash",
        prompt: data.concept,
        entryPoint,
      });

      return generateEnhancedStoryboard(
        data.concept,
        data.sceneCount,
        data.workflow,
        data.systemInstruction
      );
    });
  });

  router.post("/preview-styles", (req, res) => {
    void handle(req, res, "/api/ai/preview-styles", async (setMeta) => {
      const data: AiPreviewStylesPayload = aiPreviewStylesSchema.parse(
        req.body
      );
      const entryPoint = data.entryPoint ?? "agent:preview-styles";
      setMeta({
        geminiModel: "gemini-2.5-flash",
        prompt: data.concept,
        entryPoint,
      });

      return generateStylePreviews(data.concept, data.workflow);
    });
  });

  router.post("/storyboard/regenerate", (req, res) => {
    void handle(req, res, "/api/ai/storyboard/regenerate", async (setMeta) => {
      const data: AiRegeneratePayload = aiRegenerateDescriptionSchema.parse(
        req.body
      );
      setMeta({ geminiModel: "gemini-2.5-flash", prompt: data.description });

      const description = await regenerateSceneDescription(data.description);
      return { description };
    });
  });

  router.post("/image", (req, res) => {
    void handle(req, res, "/api/ai/image", async (setMeta) => {
      const data: AiGenerateImagePayload = aiGenerateImageSchema.parse(
        req.body
      );

      // Fetch templates if templateIds provided
      const templateStylePrompts: string[] = [];
      if (data.templateIds && data.templateIds.length > 0) {
        for (const id of data.templateIds) {
          try {
            const template = getStyleTemplateById(db, id);
            if (template && template.stylePrompt) {
              templateStylePrompts.push(template.stylePrompt);
            } else if (!template) {
              console.warn(
                `Template ${id} not found, proceeding without style prompt`
              );
            }
          } catch (error) {
            console.error(`Error fetching template ${id}:`, error);
          }
        }
      }

      // Combine stylePrompts with template stylePrompts
      const allStylePrompts = [...data.stylePrompts, ...templateStylePrompts];

      setMeta({
        projectId: data.projectId,
        geminiModel: data.imageModel,
        prompt: data.description,
      });

      requireProject(db, data.projectId);
      const scene = requireScene(db, data.projectId, data.sceneId);

      const image = await generateSceneImage(
        data.description,
        data.aspectRatio,
        allStylePrompts,
        data.imageModel,
        data.workflow,
        data.thinkingMode
      );

      const buffer = Buffer.from(image.data, "base64");
      const { asset } = persistAssetBuffer({
        db,
        config,
        projectId: data.projectId,
        sceneId: data.sceneId,
        type: "image",
        mimeType: image.mimeType,
        buffer,
        metadata: {
          source: "ai-image",
          description: data.description,
          templateIds: data.templateIds,
        },
      });

      const updatedScene = requireScene(db, data.projectId, data.sceneId);
      const enriched = enrichSceneWithAssets(db, updatedScene);
      return {
        asset: { id: asset.id },
        url: enriched.imageUrl,
        scene: enriched,
      };
    });
  });

  router.post("/image/edit", (req, res) => {
    void handle(req, res, "/api/ai/image/edit", async (setMeta) => {
      const data: AiEditImagePayload = aiEditImageSchema.parse(req.body);
      setMeta({
        projectId: data.projectId,
        prompt: data.prompt,
        geminiModel: "gemini-2.5-flash-image",
      });

      requireProject(db, data.projectId);
      const scene = requireScene(db, data.projectId, data.sceneId);
      if (!scene.primaryImageAssetId) {
        throw Object.assign(new Error("Scene has no image to edit."), {
          statusCode: 400,
          errorCode: "SCENE_IMAGE_MISSING",
          retryable: false,
        });
      }
      const asset = getAssetById(db, scene.primaryImageAssetId);
      if (!asset) {
        throw Object.assign(new Error("Image asset not found."), {
          statusCode: 404,
          errorCode: "IMAGE_ASSET_NOT_FOUND",
          retryable: false,
        });
      }
      const { base64, mimeType } = readAssetBase64(asset.filePath);
      const edited = await editSceneImage(base64, mimeType, data.prompt);
      const buffer = Buffer.from(edited.data, "base64");
      const { asset: newAsset } = persistAssetBuffer({
        db,
        config,
        projectId: data.projectId,
        sceneId: data.sceneId,
        type: "image",
        mimeType: edited.mimeType,
        buffer,
        metadata: {
          source: "ai-image-edit",
          prompt: data.prompt,
          previousAssetId: asset.id,
        },
      });
      const updatedScene = requireScene(db, data.projectId, data.sceneId);
      const enriched = enrichSceneWithAssets(db, updatedScene);
      return {
        asset: { id: newAsset.id },
        url: enriched.imageUrl,
        scene: enriched,
      };
    });
  });

  router.post("/image/edit/prompt", (req, res) => {
    void handle(req, res, "/api/ai/image/edit/prompt", async (setMeta) => {
      const data: AiImageEditPromptPayload = aiImageEditPromptSchema.parse(
        req.body
      );
      setMeta({ projectId: data.projectId });

      requireProject(db, data.projectId);
      const scene = requireScene(db, data.projectId, data.sceneId);
      if (!scene.primaryImageAssetId) {
        throw Object.assign(new Error("Scene has no image to reference."), {
          statusCode: 400,
          errorCode: "SCENE_IMAGE_MISSING",
          retryable: false,
        });
      }
      const asset = getAssetById(db, scene.primaryImageAssetId);
      if (!asset) {
        throw Object.assign(new Error("Image asset not found."), {
          statusCode: 404,
          errorCode: "IMAGE_ASSET_NOT_FOUND",
          retryable: false,
        });
      }
      const { base64, mimeType } = readAssetBase64(asset.filePath);
      setMeta({
        prompt: scene.description,
        geminiModel: "gemini-2.5-flash-image",
      });
      const prompt = await generateImageEditPrompt(
        scene.description,
        base64,
        mimeType
      );
      return { prompt };
    });
  });

  router.post("/video/prompt", (req, res) => {
    void handle(req, res, "/api/ai/video/prompt", async (setMeta) => {
      const data: AiVideoPromptPayload = aiVideoPromptSchema.parse(req.body);
      setMeta({ projectId: data.projectId });

      requireProject(db, data.projectId);
      const scene = requireScene(db, data.projectId, data.sceneId);
      if (!scene.primaryImageAssetId) {
        throw Object.assign(new Error("Scene has no image to reference."), {
          statusCode: 400,
          errorCode: "SCENE_IMAGE_MISSING",
          retryable: false,
        });
      }
      const asset = getAssetById(db, scene.primaryImageAssetId);
      if (!asset) {
        throw Object.assign(new Error("Image asset not found."), {
          statusCode: 404,
          errorCode: "IMAGE_ASSET_NOT_FOUND",
          retryable: false,
        });
      }
      const { base64, mimeType } = readAssetBase64(asset.filePath);
      setMeta({ prompt: scene.description, geminiModel: "gemini-2.5-flash" });
      const prompt = await generateVideoPrompt(
        scene.description,
        base64,
        mimeType
      );
      return { prompt };
    });
  });

  router.post("/video", (req, res) => {
    void handle(req, res, "/api/ai/video", async (setMeta) => {
      const data: AiGenerateVideoPayload = aiGenerateVideoSchema.parse(
        req.body
      );
      setMeta({
        projectId: data.projectId,
        geminiModel: data.model,
        prompt: data.prompt,
      });

      requireProject(db, data.projectId);
      const scene = requireScene(db, data.projectId, data.sceneId);
      if (!scene.primaryImageAssetId) {
        throw Object.assign(
          new Error("Scene requires an image before generating video."),
          {
            statusCode: 400,
            errorCode: "SCENE_IMAGE_MISSING",
            retryable: false,
          }
        );
      }
      const asset = getAssetById(db, scene.primaryImageAssetId);
      if (!asset) {
        throw Object.assign(new Error("Image asset not found."), {
          statusCode: 404,
          errorCode: "IMAGE_ASSET_NOT_FOUND",
        });
      }
      const { base64, mimeType } = readAssetBase64(asset.filePath);
      const video = await generateSceneVideo(
        { data: base64, mimeType },
        data.prompt,
        data.model,
        data.aspectRatio,
        data.resolution,
        data.referenceImages,
        data.lastFrame,
        data.duration
      );
      const buffer = Buffer.from(video.data);
      const { asset: newAsset } = persistAssetBuffer({
        db,
        config,
        projectId: data.projectId,
        sceneId: data.sceneId,
        type: "video",
        mimeType: video.mimeType,
        buffer,
        metadata: {
          source: "ai-video",
          prompt: data.prompt,
          model: data.model,
          duration: data.duration,
          ...video.metadata,
        },
      });
      const updatedScene = requireScene(db, data.projectId, data.sceneId);
      const enriched = enrichSceneWithAssets(db, updatedScene);
      return {
        asset: { id: newAsset.id },
        url: enriched.videoUrl,
        scene: enriched,
      };
    });
  });

  router.post("/video/extend", (req, res) => {
    void handle(req, res, "/api/ai/video/extend", async (setMeta) => {
      const data: AiExtendVideoPayload = aiExtendVideoSchema.parse(req.body);
      setMeta({
        projectId: data.projectId,
        geminiModel: data.model,
        prompt: data.prompt,
      });

      requireProject(db, data.projectId);
      const scene = requireScene(db, data.projectId, data.sceneId);

      if (!scene.primaryVideoAssetId) {
        throw Object.assign(
          new Error("Scene requires a video before extending."),
          {
            statusCode: 400,
            errorCode: "SCENE_VIDEO_MISSING",
            retryable: false,
          }
        );
      }

      const asset = getAssetById(db, scene.primaryVideoAssetId);
      if (!asset) {
        throw Object.assign(new Error("Video asset not found."), {
          statusCode: 404,
          errorCode: "VIDEO_ASSET_NOT_FOUND",
        });
      }

      // Validate video length
      const videoDuration =
        typeof asset.metadata?.duration === "number"
          ? asset.metadata.duration
          : 0;
      const maxExtensions = Math.floor((141 - videoDuration) / 7);

      if (data.extensionCount > maxExtensions) {
        throw Object.assign(
          new Error(
            `Video can only be extended ${maxExtensions} more times (current: ${videoDuration}s, max: 141s)`
          ),
          {
            statusCode: 400,
            errorCode: "EXTENSION_LIMIT_EXCEEDED",
            retryable: false,
          }
        );
      }

      const { base64, mimeType } = readAssetBase64(asset.filePath);
      const extendedVideo = await extendSceneVideo(
        { data: base64, mimeType },
        data.prompt,
        data.model,
        scene.aspectRatio,
        data.extensionCount,
        videoDuration
      );

      const buffer = Buffer.from(extendedVideo.data);
      const newDuration = videoDuration + data.extensionCount * 7;
      const { asset: newAsset } = persistAssetBuffer({
        db,
        config,
        projectId: data.projectId,
        sceneId: data.sceneId,
        type: "video",
        mimeType: extendedVideo.mimeType,
        buffer,
        metadata: {
          source: "ai-video-extension",
          prompt: data.prompt,
          model: data.model,
          extendedFrom: asset.id,
          extensionCount: data.extensionCount,
          duration: newDuration,
        },
      });

      const updatedScene = requireScene(db, data.projectId, data.sceneId);
      const enriched = enrichSceneWithAssets(db, updatedScene);

      return {
        asset: { id: newAsset.id },
        url: enriched.videoUrl,
        scene: enriched,
      };
    });
  });

  router.post("/scenes/:sceneId/regenerate", (req, res) => {
    void handle(
      req,
      res,
      "/api/ai/scenes/:sceneId/regenerate",
      async (setMeta) => {
        const { sceneId } = req.params;
        const { projectId } = req.body;

        if (!projectId || typeof projectId !== "string") {
          throw Object.assign(new Error("Project ID is required"), {
            statusCode: 400,
            errorCode: "PROJECT_ID_REQUIRED",
            retryable: false,
          });
        }

        setMeta({
          projectId,
          geminiModel: "gemini-2.5-flash",
        });

        requireProject(db, projectId);
        const scene = requireScene(db, projectId, sceneId);

        // Regenerate the scene description using Gemini
        const newDescription = await regenerateSceneDescription(
          scene.description
        );

        // Update the scene with the new description and clear assets using the store
        const updatedScene = updateScene(db, projectId, sceneId, {
          description: newDescription,
          primaryImageAssetId: null,
          primaryVideoAssetId: null,
        });

        if (!updatedScene) {
          throw Object.assign(new Error("Failed to update scene"), {
            statusCode: 500,
            errorCode: "SCENE_UPDATE_FAILED",
            retryable: true,
          });
        }

        const enriched = enrichSceneWithAssets(db, updatedScene);

        return {
          scene: enriched,
          description: newDescription,
        };
      }
    );
  });

  return router;
};
