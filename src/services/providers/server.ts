import { z } from "zod";
import type {
  ChatProvider,
  StoryboardGenerator,
  MediaGenerator,
  ChatGenerationRequest,
  StoryboardGenerationRequest,
  GenerateImageRequest,
  EditImageRequest,
  GenerateVideoRequest,
  ExtendVideoRequest,
} from "../../types/services";
import { sceneEntitySchema } from "../projectService";
import type { SceneRecord } from "../../types/services";
import { getGeminiApiKey } from "../../stores/apiKeyStore";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

/**
 * Convert a File object to a base64 string
 * @param file - The file to convert
 * @returns Promise resolving to base64 string (without data URL prefix)
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${file.name}`));
    };
    reader.readAsDataURL(file);
  });
}

export class ApiRequestError extends Error {
  public readonly status: number;
  public readonly requestId?: string;
  public readonly retryable: boolean;
  public readonly payload?: unknown;
  public readonly errorCode?: string;
  public readonly entryPoint?: string;

  constructor(
    message: string,
    options: {
      status: number;
      requestId?: string;
      retryable: boolean;
      payload?: unknown;
      errorCode?: string;
      entryPoint?: string;
    }
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = options.status;
    this.requestId = options.requestId;
    this.retryable = options.retryable;
    this.payload = options.payload;
    this.errorCode = options.errorCode;
    this.entryPoint = options.entryPoint;
  }
}

const jsonRequest = async <Schema extends z.ZodTypeAny>(
  path: string,
  options: RequestInit,
  schema: Schema
): Promise<z.infer<Schema>> => {
  // Build headers with optional Authorization
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> ?? {}),
  };

  // Add Authorization header if user has provided an API key
  const apiKey = getGeminiApiKey();
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const requestId = response.headers.get("x-request-id") ?? undefined;

  if (!response.ok) {
    const payload = await response.json().catch(() => undefined);
    const errorValue =
      payload && typeof payload === "object"
        ? (payload as Record<string, unknown>).error
        : undefined;
    const message =
      typeof errorValue === "string"
        ? errorValue
        : response.statusText || "Request failed";
    const retryableValue =
      payload && typeof payload === "object"
        ? (payload as Record<string, unknown>).retryable
        : undefined;
    const errorCodeValue =
      payload && typeof payload === "object"
        ? (payload as Record<string, unknown>).errorCode
        : undefined;
    const entryPointValue =
      payload && typeof payload === "object"
        ? (payload as Record<string, unknown>).entryPoint
        : undefined;
    const retryable =
      typeof retryableValue === "boolean"
        ? retryableValue
        : response.status >= 500;
    throw new ApiRequestError(message, {
      status: response.status,
      requestId,
      retryable,
      payload,
      errorCode:
        typeof errorCodeValue === "string" ? errorCodeValue : undefined,
      entryPoint:
        typeof entryPointValue === "string" ? entryPointValue : undefined,
    });
  }

  const body = (await response.json()) as unknown;
  return schema.parse(body);
};

const chatResponseSchema = z.object({ text: z.string() });
const storyboardResponseSchema = z.object({
  scenes: z.array(z.object({ description: z.string() })),
  modelResponse: z.string(),
});
const regenerateResponseSchema = z.object({ description: z.string() });
const promptResponseSchema = z.object({ prompt: z.string() });
const sceneMutationResponseSchema = z.object({
  asset: z.object({ id: z.string() }),
  url: z.string().nullable().optional(),
  scene: sceneEntitySchema,
});
const stylePreviewsResponseSchema = z.object({
  previews: z.array(
    z.object({
      description: z.string(),
      styleDirection: z.string(),
    })
  ),
});
const enhancedStoryboardResponseSchema = z.object({
  scenes: z.array(
    z.object({
      description: z.string(),
      imagePrompt: z.string(),
      animationPrompt: z.string(),
      metadata: z.object({
        duration: z.number(),
        cameraMovement: z.string().optional(),
        lighting: z.string().optional(),
        mood: z.string().optional(),
      }),
    })
  ),
});

export const serverChatProvider: ChatProvider = {
  async generateResponse(request: ChatGenerationRequest) {
    const result = await jsonRequest(
      "/ai/chat",
      {
        method: "POST",
        body: JSON.stringify({
          prompt: request.prompt,
          history: request.history.map(({ role, text }) => ({ role, text })),
          image: request.image,
          chatModel: request.chatModel,
          workflow: request.workflow,
          entryPoint: request.entryPoint,
          files: request.files,
        }),
      },
      chatResponseSchema
    );
    return result.text;
  },
};

export const serverStoryboardGenerator: StoryboardGenerator = {
  async generateScenes(request: StoryboardGenerationRequest) {
    const result = await jsonRequest(
      "/ai/storyboard",
      {
        method: "POST",
        body: JSON.stringify({
          concept: request.concept,
          image: request.image,
          styleNames: request.styleNames,
          sceneCount: request.sceneCount,
          workflow: request.workflow,
          entryPoint: request.entryPoint,
          files: request.files,
        }),
      },
      storyboardResponseSchema
    );
    return result as {
      scenes: Array<{ description: string }>;
      modelResponse: string;
    };
  },
  async regenerateDescription(existingDescription: string) {
    const result = await jsonRequest(
      "/ai/storyboard/regenerate",
      {
        method: "POST",
        body: JSON.stringify({ description: existingDescription }),
      },
      regenerateResponseSchema
    );
    return result.description;
  },
  async generateStylePreviews(request) {
    const result = await jsonRequest(
      "/ai/preview-styles",
      {
        method: "POST",
        body: JSON.stringify({
          concept: request.concept,
          workflow: request.workflow,
          entryPoint: request.entryPoint,
        }),
      },
      stylePreviewsResponseSchema
    );
    return result.previews;
  },
  async generateEnhancedStoryboard(request) {
    const result = await jsonRequest(
      "/ai/storyboard/enhanced",
      {
        method: "POST",
        body: JSON.stringify({
          concept: request.concept,
          sceneCount: request.sceneCount,
          workflow: request.workflow,
          systemInstruction: request.systemInstruction,
          selectedStyle: request.selectedStyle,
          entryPoint: request.entryPoint,
        }),
      },
      enhancedStoryboardResponseSchema
    );
    return result.scenes;
  },
};

export const serverMediaGenerator: MediaGenerator = {
  async generateImage(request: GenerateImageRequest) {
    const result = await jsonRequest(
      "/ai/image",
      {
        method: "POST",
        body: JSON.stringify({
          projectId: request.projectId,
          sceneId: request.sceneId,
          description: request.description,
          aspectRatio: request.aspectRatio,
          stylePrompts: request.stylePrompts,
          imageModel: request.imageModel,
          workflow: request.workflow,
          templateId: request.templateId,
          files: request.files,
        }),
      },
      sceneMutationResponseSchema
    );
    return result.scene as SceneRecord;
  },
  async editImage(request: EditImageRequest) {
    const result = await jsonRequest(
      "/ai/image/edit",
      {
        method: "POST",
        body: JSON.stringify({
          projectId: request.projectId,
          sceneId: request.sceneId,
          prompt: request.prompt,
        }),
      },
      sceneMutationResponseSchema
    );
    return result.scene as SceneRecord;
  },
  async suggestVideoPrompt({ projectId, sceneId }) {
    const result = await jsonRequest(
      "/ai/video/prompt",
      {
        method: "POST",
        body: JSON.stringify({ projectId, sceneId }),
      },
      promptResponseSchema
    );
    return result.prompt;
  },
  async suggestImageEditPrompt({ projectId, sceneId }) {
    const result = await jsonRequest(
      "/ai/image/edit/prompt",
      {
        method: "POST",
        body: JSON.stringify({ projectId, sceneId }),
      },
      promptResponseSchema
    );
    return result.prompt;
  },
  async generateVideo(request: GenerateVideoRequest) {
    // Convert reference images to base64 if provided
    const referenceImages = request.referenceImages
      ? await Promise.all(
        request.referenceImages.map(async (file) => ({
          data: await fileToBase64(file),
          mimeType: file.type,
        }))
      )
      : undefined;

    // Convert last frame to base64 if provided
    const lastFrame = request.lastFrame
      ? {
        data: await fileToBase64(request.lastFrame),
        mimeType: request.lastFrame.type,
      }
      : undefined;

    const result = await jsonRequest(
      "/ai/video",
      {
        method: "POST",
        body: JSON.stringify({
          projectId: request.projectId,
          sceneId: request.sceneId,
          prompt: request.prompt,
          model: request.model,
          aspectRatio: request.aspectRatio,
          resolution: request.resolution,
          duration: request.duration,
          referenceImages,
          lastFrame,
        }),
        signal: AbortSignal.timeout(300_000), // 5 minute timeout
      },
      sceneMutationResponseSchema
    );
    return result.scene as SceneRecord;
  },
  async extendVideo(request: ExtendVideoRequest) {
    const result = await jsonRequest(
      "/ai/video/extend",
      {
        method: "POST",
        body: JSON.stringify({
          projectId: request.projectId,
          sceneId: request.sceneId,
          prompt: request.prompt,
          model: request.model,
          extensionCount: request.extensionCount,
        }),
      },
      sceneMutationResponseSchema
    );
    return result.scene as SceneRecord;
  },
};
