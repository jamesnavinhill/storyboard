import {
  GoogleGenAI,
  Type,
  Modality,
  HarmBlockThreshold,
  HarmCategory,
  type GenerateContentResponse,
} from "@google/genai";
import {
  validateResolution,
  validateReferenceImages,
  validateLastFrame,
  validateVideoExtension,
  getDefaultDuration,
  getDefaultResolution,
  getModelCapabilities,
} from "./videoModelCapabilities";
import { getUserApiKey } from "../utils/requestContext";

class GeminiApiKeyMissingError extends Error {
  public readonly statusCode = 503;
  public readonly errorCode = "GEMINI_API_KEY_MISSING";
  public readonly retryable = false;

  constructor() {
    super("GEMINI_API_KEY environment variable not set.");
    this.name = "GeminiApiKeyMissingError";
  }
}

/**
 * Parse Google API error responses and extract meaningful error messages
 * @param error - The error object from Google API
 * @param context - Additional context about the operation
 * @returns Enhanced error object with request ID and actionable messages
 */
const parseGoogleApiError = (
  error: any,
  context: {
    operation: string;
    model?: string;
    requestId?: string;
  }
): Error & {
  statusCode: number;
  errorCode: string;
  retryable: boolean;
  requestId?: string;
  suggestedAction?: string;
} => {
  // Extract error message from various possible locations
  let errorMessage = error.message || "Unknown error occurred";
  let statusCode = error.statusCode || error.status || 500;
  let errorCode = error.errorCode || error.code || "UNKNOWN_ERROR";
  const requestId =
    context.requestId || error.requestId || error.name || "unknown";

  // Parse Google API error structure
  if (error.error) {
    if (typeof error.error === "string") {
      errorMessage = error.error;
    } else if (error.error.message) {
      errorMessage = error.error.message;
      statusCode = error.error.status || error.error.code || statusCode;
    }
  }

  // Determine if error is retryable based on status code
  const retryable = statusCode >= 500 || statusCode === 429;

  // Provide actionable suggestions based on error patterns
  let suggestedAction: string | undefined;

  if (errorMessage.includes("resolution") || errorMessage.includes("1080p")) {
    suggestedAction =
      "Try using 720p resolution or ensure 1080p is paired with 8-second duration.";
  } else if (errorMessage.includes("duration")) {
    suggestedAction =
      "Ensure duration is compatible with resolution (1080p requires 8s).";
  } else if (
    errorMessage.includes("reference") ||
    errorMessage.includes("referenceImages")
  ) {
    suggestedAction =
      "Reference images require Veo 3.1 models and 16:9 aspect ratio with 8-second duration.";
  } else if (
    errorMessage.includes("extension") ||
    errorMessage.includes("extend")
  ) {
    suggestedAction =
      "Video extension is only supported on Veo 3.1 models. Try veo-3.1-generate-preview or veo-3.1-fast-generate-preview.";
  } else if (errorMessage.includes("personGeneration")) {
    suggestedAction =
      "The personGeneration parameter is required when using reference images or last frame interpolation.";
  } else if (errorMessage.includes("encoding")) {
    suggestedAction =
      "The encoding parameter is not supported by the video extension API. This has been automatically removed.";
  } else if (retryable) {
    suggestedAction =
      "This error may be temporary. Please try again in a few moments.";
  }

  // Build enhanced error message
  const enhancedMessage = [
    `${context.operation} failed: ${errorMessage}`,
    context.model ? `Model: ${context.model}` : null,
    `Request ID: ${requestId}`,
    suggestedAction ? `Suggestion: ${suggestedAction}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  return Object.assign(new Error(enhancedMessage), {
    statusCode,
    errorCode,
    retryable,
    requestId,
    suggestedAction,
  });
};

let cachedClient: GoogleGenAI | undefined;
let cachedApiKey: string | undefined;

/**
 * Get the server's fallback API key from environment
 */
const getServerApiKey = (): string | undefined => {
  return process.env.GEMINI_API_KEY?.trim();
};

/**
 * Ensure a Gemini client is available.
 * Checks for API key in this priority order:
 * 1. Explicit userApiKey parameter
 * 2. User API key from request context (from Authorization header)
 * 3. Server's fallback API key from environment
 *
 * @param userApiKey - Optional explicit user-provided API key (highest priority)
 */
const ensureClient = (userApiKey?: string): { client: GoogleGenAI; apiKey: string } => {
  // Check explicit parameter first
  let keyToUse = userApiKey?.trim();

  // If no explicit key, check request context (from Authorization header)
  if (!keyToUse) {
    const contextKey = getUserApiKey();
    if (contextKey) {
      keyToUse = contextKey;
    }
  }

  // If user provided a key (explicit or from context), create a fresh client
  if (keyToUse) {
    return {
      client: new GoogleGenAI({ apiKey: keyToUse }),
      apiKey: keyToUse,
    };
  }

  // Fall back to server's API key
  const apiKey = getServerApiKey();
  if (!apiKey) {
    throw new GeminiApiKeyMissingError();
  }

  // Use cached client if key hasn't changed
  if (!cachedClient || cachedApiKey !== apiKey) {
    cachedClient = new GoogleGenAI({ apiKey });
    cachedApiKey = apiKey;
  }

  return { client: cachedClient, apiKey };
};

/**
 * Create a client with a specific API key (for one-time use with user key)
 * This is useful when you need to verify a key or create a dedicated client.
 */
export const createClientWithKey = (apiKey: string): GoogleGenAI => {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) {
    throw new Error("API key cannot be empty");
  }
  return new GoogleGenAI({ apiKey: trimmedKey });
};

/**
 * Check if the server has a fallback API key configured
 */
export const hasServerApiKey = (): boolean => {
  return !!getServerApiKey();
};

const extractText = (response: GenerateContentResponse): string => {
  const text = response.text?.trim();
  if (!text) {
    throw new Error("Model response did not include text output.");
  }
  return text;
};

const pickInlineImage = (response: GenerateContentResponse) => {
  for (const candidate of response.candidates ?? []) {
    for (const part of candidate.content?.parts ?? []) {
      const mimeType = part.inlineData?.mimeType;
      const data = part.inlineData?.data;
      if (mimeType && data && mimeType.startsWith("image/")) {
        return { data, mimeType };
      }
    }
  }
  return undefined;
};

const storyboardSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      description: {
        type: Type.STRING,
        description:
          "A concise, visually descriptive scene for the storyboard.",
      },
    },
    required: ["description"],
  },
};

const WORKFLOWS = {
  "music-video": {
    name: "music videos",
    systemInstruction:
      "You are a creative director for artistic, abstract music videos. Based on the user's prompt, generate a list of distinct, evocative scenes. The scenes should be concise, visually descriptive, and align with an artsy, abstract, futuristic, and techy vibe.",
    artStyle:
      "Style: artsy, washed out aesthetic, warm muted colors, abstract, dreamy, ethereal, futuristic, technological, emotive, cinematic lighting, high detail, 4k.",
  },
  "product-commercial": {
    name: "product commercials",
    systemInstruction:
      "You are a director for high-end product commercials. Based on the user's prompt, generate scenes that are clean, modern, and visually appealing. Focus on highlighting the product's features and benefits in a sophisticated way.",
    artStyle:
      "Style: clean, modern, minimalist, bright studio lighting, sharp focus, high-end commercial photography, professional, polished, vibrant but controlled color palette, 4k.",
  },
  "viral-social": {
    name: "viral social videos",
    systemInstruction:
      "You are a content creator specializing in viral social media videos. Based on the user's prompt, generate scenes for a fast-paced, engaging, and trendy video (like for TikTok or Reels). Think quick cuts, bold visuals, and eye-catching moments.",
    artStyle:
      "Style: vibrant, high-energy, trendy, bold colors, dynamic angles, authentic, shot on a high-end smartphone aesthetic, engaging, direct-to-camera feel, 4k.",
  },
  "explainer-video": {
    name: "explainer videos",
    systemInstruction:
      "You are a creative lead for animated explainer videos. Based on the user's prompt, generate scenes that are clear, simple, and informative. Use concepts that can be easily translated to 2D animation with iconography and simplified characters.",
    artStyle:
      "Style: 2D flat animation, simple iconography, friendly characters, bright and approachable color palette, clean lines, minimalist, corporate-friendly, informative graphic style, 4k.",
  },
} as const;

export type WorkflowKey = keyof typeof WORKFLOWS;

export const generateChatResponse = async (
  prompt: string,
  history: Array<{ role: "user" | "model"; text: string }>,
  image: { data: string; mimeType: string } | undefined,
  chatModel: string,
  workflow: WorkflowKey,
  thinkingMode: boolean = false
): Promise<string> => {
  const { client } = ensureClient();
  const selectedWorkflow = WORKFLOWS[workflow];
  const systemInstruction = `You are a creative art director guru for StoryBoard, an AI music video storyboarder. Your role is to be a creative partner, helping users brainstorm and refine their ideas before they generate storyboard scenes. Guide them to formulate well-crafted, production-grade concepts and themes. Ask clarifying questions and offer evocative suggestions. The user is currently thinking about a project in the style of ${selectedWorkflow.name}. Tailor your creative advice to this use case. Engage in a natural, inspiring conversation.`;

  const contentParts: any[] = [{ text: prompt }];
  if (image) {
    contentParts.unshift({
      inlineData: { data: image.data, mimeType: image.mimeType },
    });
  }

  const formattedHistory = history.map((entry) => ({
    role: entry.role,
    parts: [{ text: entry.text }],
  }));

  const config: any = {
    systemInstruction,
  };

  if (thinkingMode) {
    config.thinkingConfig = { mode: "thinking" };
  }

  const response = await client.models.generateContent({
    model: chatModel,
    contents: formattedHistory.concat([{ role: "user", parts: contentParts }]),
    config,
  });

  return extractText(response);
};

export async function* streamChatResponse(
  prompt: string,
  history: Array<{ role: "user" | "model"; text: string }>,
  image: { data: string; mimeType: string } | undefined,
  chatModel: string,
  workflow: WorkflowKey,
  thinkingMode: boolean = false
): AsyncGenerator<string, void, unknown> {
  const { client } = ensureClient();
  const selectedWorkflow = WORKFLOWS[workflow];
  const systemInstruction = `You are a creative art director guru for StoryBoard, an AI music video storyboarder. Your role is to be a creative partner, helping users brainstorm and refine their ideas before they generate storyboard scenes. Guide them to formulate well-crafted, production-grade concepts and themes. Ask clarifying questions and offer evocative suggestions. The user is currently thinking about a project in the style of ${selectedWorkflow.name}. Tailor your creative advice to this use case. Engage in a natural, inspiring conversation.`;

  const contentParts: any[] = [{ text: prompt }];
  if (image) {
    contentParts.unshift({
      inlineData: { data: image.data, mimeType: image.mimeType },
    });
  }

  const formattedHistory = history.map((entry) => ({
    role: entry.role,
    parts: [{ text: entry.text }],
  }));

  const config: any = {
    systemInstruction,
  };

  if (thinkingMode) {
    config.thinkingConfig = { mode: "thinking" };
  }

  const stream = await client.models.generateContentStream({
    model: chatModel,
    contents: formattedHistory.concat([{ role: "user", parts: contentParts }]),
    config,
  });

  for await (const chunk of stream) {
    const text = chunk.text;
    if (text) {
      yield text;
    }
  }
}

export const generateStoryboardScenes = async (
  prompt: string,
  image: { data: string; mimeType: string } | undefined,
  styleNames: string[],
  templatePrompts: string[],
  sceneCount: number,
  workflow: WorkflowKey
): Promise<{
  scenes: Array<{ description: string }>;
  modelResponse: string;
}> => {
  const { client } = ensureClient();
  const selectedWorkflow = WORKFLOWS[workflow];
  const styleInstruction =
    styleNames.length > 0
      ? ` The user has also selected these style presets: ${styleNames.join(
        ", "
      )}.`
      : "";
  const templateInstruction =
    templatePrompts.length > 0
      ? ` The user has also selected these visual style templates: ${templatePrompts.join(
        " "
      )}.`
      : "";
  const systemInstruction = `${selectedWorkflow.systemInstruction} Generate exactly ${sceneCount} scenes. Influenced by the reference image if provided.${styleInstruction}${templateInstruction} Respond ONLY with the JSON array of objects as defined in the schema. Do not add any extra text, markdown, or explanations.`;

  const contentParts: any[] = [{ text: `User concept: "${prompt}"` }];
  if (image) {
    contentParts.unshift({ inlineData: image });
  }

  const response: GenerateContentResponse = await client.models.generateContent(
    {
      model: "gemini-2.5-flash",
      contents: { parts: contentParts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: storyboardSchema,
      },
    }
  );

  const jsonString = extractText(response);
  if (!jsonString.startsWith("[") || !jsonString.endsWith("]")) {
    throw new Error("Received an invalid JSON response from the model.");
  }

  const parsedScenes = JSON.parse(jsonString) as Array<{ description: string }>;
  const modelResponseText = `I've generated ${parsedScenes.length} scene ideas for your storyboard. Click the 'Generate' button on any card to bring it to life.`;

  return { scenes: parsedScenes, modelResponse: modelResponseText };
};

export const regenerateSceneDescription = async (
  existingDescription: string
): Promise<string> => {
  const { client } = ensureClient();
  const systemInstruction =
    "You are a creative director for artistic, abstract music videos. Your task is to revise a scene description. Make it more evocative, visually descriptive, and aligned with an artsy, abstract, futuristic, and techy vibe. Respond ONLY with the new, single, concise scene description text. Do not add any extra text, markdown, or explanations.";

  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      parts: [
        { text: `Revise this scene description: "${existingDescription}"` },
      ],
    },
    config: { systemInstruction },
  });

  return extractText(response);
};

const enhancedStoryboardSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      description: {
        type: Type.STRING,
        description:
          "A concise, visually descriptive scene for the storyboard.",
      },
      imagePrompt: {
        type: Type.STRING,
        description: "A detailed prompt for generating the scene image.",
      },
      animationPrompt: {
        type: Type.STRING,
        description: "A detailed prompt for animating the scene into video.",
      },
      metadata: {
        type: Type.OBJECT,
        properties: {
          duration: {
            type: Type.NUMBER,
            description: "Scene duration in seconds (typically 3-10 seconds).",
          },
          cameraMovement: {
            type: Type.STRING,
            description:
              "Camera movement description (e.g., 'slow pan left', 'zoom in', 'static').",
          },
          lighting: {
            type: Type.STRING,
            description:
              "Lighting description (e.g., 'warm golden hour', 'dramatic shadows', 'soft diffused').",
          },
          mood: {
            type: Type.STRING,
            description:
              "Overall mood or atmosphere (e.g., 'energetic', 'melancholic', 'mysterious').",
          },
        },
        required: ["duration"],
      },
    },
    required: ["description", "imagePrompt", "animationPrompt", "metadata"],
  },
};

export interface EnhancedScene {
  description: string;
  imagePrompt: string;
  animationPrompt: string;
  metadata: {
    duration: number;
    cameraMovement?: string;
    lighting?: string;
    mood?: string;
  };
}

export const generateEnhancedStoryboard = async (
  concept: string,
  sceneCount: number,
  workflow: WorkflowKey,
  systemInstruction?: string
): Promise<{
  scenes: EnhancedScene[];
  modelResponse: string;
}> => {
  const { client } = ensureClient();
  const selectedWorkflow = WORKFLOWS[workflow];

  const instruction =
    systemInstruction ||
    `${selectedWorkflow.systemInstruction} Generate exactly ${sceneCount} scenes with complete details for each scene including:
    - A concise, visually descriptive scene description
    - A detailed image generation prompt incorporating the art style: ${selectedWorkflow.artStyle}
    - An animation/video prompt describing camera movement and scene dynamics
    - Metadata including duration (in seconds), camera movement, lighting, and mood
    
    Ensure each scene builds on the previous one to create a cohesive storyboard. The animation prompts should describe subtle movements, camera motion, and atmospheric effects that bring each scene to life cinematically. Respond ONLY with the JSON array of objects as defined in the schema. Do not add any extra text, markdown, or explanations.`;

  const response: GenerateContentResponse = await client.models.generateContent(
    {
      model: "gemini-2.5-flash",
      contents: {
        parts: [{ text: `User concept: "${concept}"` }],
      },
      config: {
        systemInstruction: instruction,
        responseMimeType: "application/json",
        responseSchema: enhancedStoryboardSchema,
      },
    }
  );

  const jsonString = extractText(response);
  if (!jsonString.startsWith("[") || !jsonString.endsWith("]")) {
    throw new Error("Received an invalid JSON response from the model.");
  }

  const parsedScenes = JSON.parse(jsonString) as EnhancedScene[];
  const totalDuration = parsedScenes.reduce(
    (sum, scene) => sum + scene.metadata.duration,
    0
  );
  const modelResponseText = `I've generated ${parsedScenes.length} enhanced scenes for your storyboard with a total duration of ${totalDuration} seconds. Each scene includes image prompts, animation prompts, and detailed metadata.`;

  return { scenes: parsedScenes, modelResponse: modelResponseText };
};

export interface StylePreview {
  id: string;
  description: string;
  imagePrompt: string;
  styleDirection: string;
  metadata: {
    mood?: string;
    colorPalette?: string;
    visualStyle?: string;
  };
}

const stylePreviewSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      description: {
        type: Type.STRING,
        description:
          "A concise, visually descriptive scene representing this style direction.",
      },
      imagePrompt: {
        type: Type.STRING,
        description:
          "A detailed prompt for generating the scene image in this style.",
      },
      styleDirection: {
        type: Type.STRING,
        description:
          "A name for this style direction (e.g., 'Dark & Moody', 'Bright & Energetic').",
      },
      metadata: {
        type: Type.OBJECT,
        properties: {
          mood: {
            type: Type.STRING,
            description: "Overall mood or atmosphere of this style.",
          },
          colorPalette: {
            type: Type.STRING,
            description: "Description of the color palette used in this style.",
          },
          visualStyle: {
            type: Type.STRING,
            description: "Description of the visual aesthetic and techniques.",
          },
        },
      },
    },
    required: ["description", "imagePrompt", "styleDirection", "metadata"],
  },
};

export const generateStylePreviews = async (
  concept: string,
  workflow: WorkflowKey
): Promise<{
  previews: StylePreview[];
  modelResponse: string;
}> => {
  const { client } = ensureClient();
  const selectedWorkflow = WORKFLOWS[workflow];

  const systemInstruction = `${selectedWorkflow.systemInstruction} 
  
  Your task is to generate exactly 4 diverse style preview scenes that represent different visual directions for the user's concept. Each preview should showcase a distinct style approach while staying true to the concept and the ${selectedWorkflow.name} genre.
  
  The 4 style directions should be meaningfully different from each other, exploring variations in:
  - Mood and atmosphere (e.g., dark vs bright, energetic vs calm)
  - Color palette (e.g., warm vs cool, saturated vs muted)
  - Visual style (e.g., realistic vs stylized, minimal vs detailed)
  
  Base art style reference: ${selectedWorkflow.artStyle}
  
  For each preview, provide:
  - A scene description that represents this style direction
  - A detailed image generation prompt incorporating the specific style
  - A clear name for the style direction
  - Metadata describing the mood, color palette, and visual style
  
  Respond ONLY with the JSON array of exactly 4 objects as defined in the schema. Do not add any extra text, markdown, or explanations.`;

  const response: GenerateContentResponse = await client.models.generateContent(
    {
      model: "gemini-2.5-flash",
      contents: {
        parts: [{ text: `User concept: "${concept}"` }],
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: stylePreviewSchema,
      },
    }
  );

  const jsonString = extractText(response);
  if (!jsonString.startsWith("[") || !jsonString.endsWith("]")) {
    throw new Error("Received an invalid JSON response from the model.");
  }

  const parsedPreviews = JSON.parse(jsonString) as Array<{
    description: string;
    imagePrompt: string;
    styleDirection: string;
    metadata: {
      mood?: string;
      colorPalette?: string;
      visualStyle?: string;
    };
  }>;

  if (parsedPreviews.length !== 4) {
    throw new Error(
      `Expected exactly 4 style previews, but received ${parsedPreviews.length}.`
    );
  }

  // Add unique IDs to each preview
  const previewsWithIds: StylePreview[] = parsedPreviews.map(
    (preview, index) => ({
      id: `preview-${index + 1}`,
      ...preview,
    })
  );

  const modelResponseText = `I've generated 4 diverse style preview scenes for your concept. Each represents a different visual direction you can explore. Select your preferred style to generate the full storyboard.`;

  return { previews: previewsWithIds, modelResponse: modelResponseText };
};

export const generateSceneImage = async (
  description: string,
  aspectRatio: "16:9" | "9:16" | "1:1",
  stylePrompts: string[],
  imageModel: string,
  workflow: WorkflowKey,
  thinkingMode: boolean = false
): Promise<{ data: string; mimeType: string }> => {
  const { client } = ensureClient();
  const selectedWorkflow = WORKFLOWS[workflow];
  const fullPrompt = `${description}. ${selectedWorkflow.artStyle
    } ${stylePrompts.join(" ")}`.trim();

  if (
    imageModel === "gemini-2.5-flash-image" ||
    imageModel === "gemini-3-pro-image-preview"
  ) {
    const nanoPrompt = `${fullPrompt}. Generate a high-quality image in PNG format with a ${aspectRatio} aspect ratio.`;
    const config: any = {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    };

    // Note: Thinking mode is primarily for text generation models
    // Image generation models may not support it, but we accept the parameter
    // for API consistency and future compatibility
    if (thinkingMode) {
      config.thinkingConfig = { mode: "thinking" };
    }

    const response = await client.models.generateContent({
      model: imageModel,
      contents: { parts: [{ text: nanoPrompt }] },
      config,
    });

    const match = pickInlineImage(response);
    if (match) {
      return match;
    }
    const requestId = (response as any).name || "unknown";
    throw Object.assign(
      new Error(
        `Flash Image generation failed to return an image. Request ID: ${requestId}. The model may have blocked the request or failed to generate output.`
      ),
      {
        statusCode: 500,
        errorCode: "FLASH_IMAGE_NO_OUTPUT",
        retryable: true,
        requestId,
        suggestedAction:
          "Try simplifying your prompt or using a different image model.",
      }
    );
  }

  // Imagen models don't support thinking mode as they are pure image generation models
  // The thinkingMode parameter is accepted but not used for these models
  const response = await client.models.generateImages({
    model: imageModel,
    prompt: fullPrompt,
    config: {
      numberOfImages: 1,
      aspectRatio,
      outputMimeType: "image/png",
      includePeople: true,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    } as any,
  });

  const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
  if (!imageBytes) {
    const requestId = (response as any).name || "unknown";
    throw Object.assign(
      new Error(
        `Image generation failed or returned no images. Request ID: ${requestId}. This may indicate the generation was blocked by safety filters or failed to complete.`
      ),
      {
        statusCode: 500,
        errorCode: "IMAGE_GENERATION_NO_OUTPUT",
        retryable: true,
        requestId,
        suggestedAction:
          "Try modifying your prompt or adjusting safety settings.",
      }
    );
  }

  return { data: imageBytes, mimeType: "image/png" };
};

export const editSceneImage = async (
  base64ImageData: string,
  mimeType: string,
  prompt: string
): Promise<{ data: string; mimeType: string }> => {
  const { client } = ensureClient();
  const response = await client.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        { inlineData: { data: base64ImageData, mimeType } },
        { text: prompt },
      ],
    },
    config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
  });

  const match = pickInlineImage(response);
  if (match) {
    return match;
  }
  const requestId = (response as any).name || "unknown";
  throw Object.assign(
    new Error(
      `Image edit failed to return an image. Request ID: ${requestId}. The model may have blocked the request or failed to generate output.`
    ),
    {
      statusCode: 500,
      errorCode: "IMAGE_EDIT_NO_OUTPUT",
      retryable: true,
      requestId,
      suggestedAction:
        "Try modifying your edit prompt or using a different approach.",
    }
  );
};

export const generateVideoPrompt = async (
  description: string,
  imageBase64: string,
  mimeType: string
): Promise<string> => {
  const { client } = ensureClient();
  const systemInstruction =
    "You are a creative director specializing in animation. Based on the static image and its description, create a detailed, production-grade prompt for an AI video generation model (like VEO) to animate this scene. The prompt should describe the subtle movements, camera motion (e.g., slow pan, gentle zoom in), and atmospheric effects (e.g., shimmering light, drifting dust motes) that would bring the image to life beautifully and cinematically. The prompt should be a single, coherent paragraph. Respond ONLY with the prompt text.";

  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      parts: [
        { text: `Scene description: "${description}"` },
        { inlineData: { data: imageBase64, mimeType } },
      ],
    },
    config: { systemInstruction },
  });

  return extractText(response);
};

export const generateImageEditPrompt = async (
  description: string,
  imageBase64: string,
  mimeType: string
): Promise<string> => {
  const { client } = ensureClient();
  const systemInstruction =
    "You are a creative director specialized in writing concise, production-ready image edit prompts for an image-editing model. Based on the provided static image and its description, produce a succinct edit prompt that the edit model can follow (color grading, removal/addition of elements, style tweaks, lighting, crop, retouch, etc.). Respond ONLY with a single paragraph containing the suggested edit prompt.";

  const response = await client.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        { text: `Scene description: "${description}"` },
        { inlineData: { data: imageBase64, mimeType } },
      ],
    },
    config: { systemInstruction, responseModalities: [Modality.TEXT] },
  });

  return extractText(response);
};

/**
 * Generate a video from a static image using Google's Veo models
 *
 * @param image - Base64 encoded image data with mime type
 * @param prompt - Text prompt describing the desired animation
 * @param model - Veo model to use for generation
 * @param aspectRatio - Video aspect ratio (16:9 or 9:16)
 * @param resolution - Optional resolution (1080p or 720p). If not provided, uses model default
 * @param referenceImages - Optional array of reference images (max 3, Veo 3.1 only)
 * @param lastFrame - Optional last frame for interpolation (Veo 3.1 only)
 * @param duration - Optional duration in seconds (4-8). If not provided, uses intelligent default
 * @returns Promise with video data, mime type, and metadata
 */
export const generateSceneVideo = async (
  image: { data: string; mimeType: string },
  prompt: string,
  model: string,
  aspectRatio: "16:9" | "9:16" | "1:1",
  resolution?: "1080p" | "720p",
  referenceImages?: Array<{ data: string; mimeType: string }>,
  lastFrame?: { data: string; mimeType: string },
  duration?: number
): Promise<{ data: ArrayBuffer; mimeType: string; metadata?: any }> => {
  const { client, apiKey } = ensureClient();

  // Determine resolution based on model capabilities
  // Veo 2.0 does not support resolution parameter - omit it
  // Veo 3.0+ supports resolution parameter
  let finalResolution: "1080p" | "720p" | undefined;

  if (model === "veo-2.0-generate-001") {
    // Veo 2.0 does not support resolution parameter - omit it
    finalResolution = undefined;
  } else {
    // Use provided resolution or get default based on model and aspect ratio
    finalResolution = resolution ?? getDefaultResolution(model, aspectRatio);
  }

  // Determine duration using intelligent defaults
  const hasReferenceImages = referenceImages && referenceImages.length > 0;
  const hasLastFrame = !!lastFrame;
  const finalDuration =
    duration ??
    getDefaultDuration(
      model,
      finalResolution,
      hasReferenceImages,
      hasLastFrame
    );

  // Validate parameters against model capabilities
  validateResolution(model, finalResolution, aspectRatio, finalDuration);
  validateReferenceImages(model, referenceImages, aspectRatio);
  validateLastFrame(model, lastFrame, !!image);

  // Build configuration object
  const config: any = {
    numberOfVideos: 1,
    aspectRatio: aspectRatio,
    durationSeconds: finalDuration,
    quality: "hd",
    includePeople: true,
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ],
  };

  // Only add resolution parameter for models that support it
  if (finalResolution) {
    config.resolution = finalResolution;
  }

  // Add reference images if provided (Veo 3.1 only)
  // personGeneration parameter is required when using reference images
  if (hasReferenceImages) {
    config.referenceImages = referenceImages!.map((img) => ({
      imageBytes: img.data,
      mimeType: img.mimeType,
    }));
    config.personGeneration = "allow_adult";
  }

  // Add last frame if provided (for interpolation)
  // personGeneration parameter is required when using last frame
  if (hasLastFrame) {
    config.lastFrame = {
      imageBytes: lastFrame!.data,
      mimeType: lastFrame!.mimeType,
    };
    config.personGeneration = "allow_adult";
  }

  // Log all parameters before API call for debugging
  console.log(`[Video Generation] Starting generation with parameters:`, {
    model,
    aspectRatio,
    requestedResolution: resolution ?? "not specified",
    finalResolution: finalResolution ?? "not set (Veo 2.0)",
    requestedDuration: duration ?? "not specified",
    finalDuration,
    referenceImagesCount: referenceImages?.length ?? 0,
    hasLastFrame,
    personGeneration: config.personGeneration ?? "not set",
  });

  let operation;
  let requestId = "unknown";
  let mimeType: string;
  let buffer: ArrayBuffer;

  try {
    operation = await client.models.generateVideos({
      model,
      prompt,
      image: {
        imageBytes: image.data,
        mimeType: image.mimeType,
      },
      config,
    });

    requestId = operation.name || "unknown";

    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 10_000));
      operation = await client.operations.getVideosOperation({ operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw Object.assign(
        new Error(
          `Video generation did not return a download link. This may indicate the generation failed or timed out. Request ID: ${requestId}`
        ),
        {
          statusCode: 500,
          errorCode: "VIDEO_GENERATION_NO_DOWNLOAD_LINK",
          retryable: true,
          requestId,
        }
      );
    }

    const response = await fetch(`${downloadLink}&key=${apiKey}`);
    if (!response.ok) {
      throw Object.assign(
        new Error(
          `Failed to download video: ${response.statusText}. Request ID: ${requestId}`
        ),
        {
          statusCode: response.status,
          errorCode: "VIDEO_DOWNLOAD_FAILED",
          retryable: response.status >= 500,
          requestId,
        }
      );
    }

    mimeType = response.headers.get("content-type") ?? "video/mp4";
    buffer = await response.arrayBuffer();
  } catch (error: any) {
    // If error already has our enhanced format, re-throw it
    if (error.requestId) {
      throw error;
    }

    // Otherwise, parse and enhance the error
    throw parseGoogleApiError(error, {
      operation: "Video generation",
      model,
      requestId,
    });
  }

  // Log completion with final calculated values
  console.log(`[Video Generation] Completed successfully.`, {
    model,
    aspectRatio,
    finalResolution: finalResolution ?? "not set (Veo 2.0)",
    finalDuration,
    videoSize: `${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB`,
  });

  return {
    data: buffer,
    mimeType,
    metadata: {
      requestedAspectRatio: aspectRatio,
      requestedResolution: finalResolution,
      requestedDuration: finalDuration,
      model,
    },
  };
};

export const extendSceneVideo = async (
  video: { data: string; mimeType: string },
  prompt: string,
  model: string,
  aspectRatio: "16:9" | "9:16" | "1:1",
  extensionCount: number = 1,
  currentDuration: number = 0
): Promise<{ data: ArrayBuffer; mimeType: string }> => {
  const { client, apiKey } = ensureClient();

  // Validate video extension parameters against model capabilities
  validateVideoExtension(model, currentDuration, extensionCount);

  console.log(
    `[Video Extension] Starting extension with ${extensionCount} iteration(s), Model: ${model}, Aspect Ratio: ${aspectRatio}, Current Duration: ${currentDuration}s`
  );

  let currentVideo = video;

  // Extend the video multiple times if requested
  for (let i = 0; i < extensionCount; i++) {
    const extensionNumber = i + 1;
    console.log(
      `[Video Extension] Processing extension ${extensionNumber}/${extensionCount}`
    );

    // Build config - minimal parameters only
    const config: any = {
      aspectRatio: aspectRatio,
      resolution: "720p",
      durationSeconds: 8,
      personGeneration: "allow_all",
    };

    try {
      console.log(`[Video Extension] API call parameters:`, {
        model,
        promptLength: prompt.length,
        videoMimeType: currentVideo.mimeType,
        configKeys: Object.keys(config),
      });

      let operation = await client.models.generateVideos({
        model,
        prompt,
        video: {
          videoBytes: currentVideo.data,
          mimeType: currentVideo.mimeType,
        },
        config,
      });

      while (!operation.done) {
        await new Promise((resolve) => setTimeout(resolve, 10_000));
        operation = await client.operations.getVideosOperation({ operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) {
        const requestId = operation.name || "unknown";
        throw Object.assign(
          new Error(
            `Video extension ${extensionNumber}/${extensionCount} did not return a download link. Request ID: ${requestId}`
          ),
          {
            statusCode: 500,
            errorCode: "VIDEO_EXTENSION_NO_DOWNLOAD_LINK",
            retryable: true,
            requestId,
            extensionNumber,
          }
        );
      }

      const response = await fetch(`${downloadLink}&key=${apiKey}`);
      if (!response.ok) {
        throw Object.assign(
          new Error(
            `Failed to download extended video ${extensionNumber}/${extensionCount}: ${response.statusText}`
          ),
          {
            statusCode: response.status,
            errorCode: "VIDEO_EXTENSION_DOWNLOAD_FAILED",
            retryable: response.status >= 500,
            extensionNumber,
          }
        );
      }

      const mimeType = response.headers.get("content-type") ?? "video/mp4";
      const buffer = await response.arrayBuffer();

      // Use the extended video as input for the next extension
      currentVideo = {
        data: Buffer.from(buffer).toString("base64"),
        mimeType,
      };

      console.log(
        `[Video Extension] Completed extension ${extensionNumber}/${extensionCount}`
      );
    } catch (error: any) {
      // Enhance error messages with extension context and suggestions
      const errorMessage = error.message || "Video extension failed";
      const requestId = error.requestId || "unknown";

      console.error(
        `[Video Extension Error] Extension ${extensionNumber}/${extensionCount} failed`,
        {
          requestId,
          model,
          aspectRatio,
          currentDuration,
          extensionCount,
          error: error,
        }
      );

      // Check if model doesn't support extension and provide helpful suggestion
      const capabilities = getModelCapabilities(model);
      if (capabilities && !capabilities.supportsExtension) {
        throw Object.assign(
          new Error(
            `Extension ${extensionNumber}/${extensionCount} failed: Model ${model} does not support video extension. ` +
            `This feature is only available in Veo 3.1 models. ` +
            `Compatible models: veo-3.1-generate-preview, veo-3.1-fast-generate-preview. ` +
            `Request ID: ${requestId}`
          ),
          {
            statusCode: 400,
            errorCode: "VIDEO_EXTENSION_UNSUPPORTED_MODEL",
            retryable: false,
            requestId,
            extensionNumber,
            suggestedModels: [
              "veo-3.1-generate-preview",
              "veo-3.1-fast-generate-preview",
            ],
          }
        );
      }

      // Re-throw with enhanced context
      throw Object.assign(
        new Error(
          `Extension ${extensionNumber}/${extensionCount} failed: ${errorMessage}. Request ID: ${requestId}`
        ),
        {
          statusCode: error.statusCode || 500,
          errorCode: error.errorCode || "VIDEO_EXTENSION_FAILED",
          retryable: error.retryable ?? error.statusCode >= 500,
          requestId,
          extensionNumber,
        }
      );
    }
  }

  console.log(
    `[Video Extension] All ${extensionCount} extension(s) completed successfully`
  );

  // Return the final extended video
  return {
    data: Buffer.from(currentVideo.data, "base64").buffer as ArrayBuffer,
    mimeType: currentVideo.mimeType,
  };
};
