import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required"),
  description: z.string().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().optional(),
});

export const createScenesSchema = z.object({
  scenes: z
    .array(
      z.object({
        description: z.string().min(1, "Scene description is required"),
        aspectRatio: z.enum(["16:9", "9:16", "1:1"] as const),
        orderIndex: z.number().int().nonnegative().optional(),
        duration: z
          .number()
          .int()
          .positive()
          .min(1, "Duration must be at least 1 second")
          .max(60, "Duration cannot exceed 60 seconds")
          .optional(),
      })
    )
    .min(1, "At least one scene is required"),
});

export const workflowSchema = z.enum([
  "music-video",
  "product-commercial",
  "viral-social",
  "explainer-video",
] as const);

export const chatModelSchema = z.enum([
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-3-pro-image-preview",
] as const);

export const imageModelSchema = z.enum([
  "imagen-4.0-generate-001",
  "imagen-4.0-ultra-generate-001",
  "imagen-4.0-fast-generate-001",
  "imagen-3.0-generate-002",
  "gemini-2.5-flash-image",
  "gemini-3-pro-image-preview",
] as const);

export const videoModelSchema = z.enum([
  "veo-3.1-generate-preview",
  "veo-3.1-fast-generate-preview",
  "veo-3.0-generate-001",
  "veo-3.0-fast-generate-001",
  "veo-2.0-generate-001",
] as const);

export const videoAutoplaySchema = z.enum(["never", "on-generate"] as const);

const entryPointSchema = z
  .string()
  .trim()
  .min(1)
  .max(64, "Entry point identifier is too long");

export const updateSceneSchema = z
  .object({
    description: z.string().min(1).optional(),
    aspectRatio: z.enum(["16:9", "9:16", "1:1"] as const).optional(),
    orderIndex: z.number().int().nonnegative().optional(),
    primaryImageAssetId: z.string().min(1).nullable().optional(),
    primaryVideoAssetId: z.string().min(1).nullable().optional(),
    duration: z
      .number()
      .int()
      .positive()
      .min(1, "Duration must be at least 1 second")
      .max(60, "Duration cannot exceed 60 seconds")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const appendChatMessageSchema = z.object({
  role: z.enum(["user", "model"] as const),
  text: z.string().min(1, "Message text is required"),
  sceneId: z.string().optional(),
  imageAssetId: z.string().optional(),
});

export const createAssetSchema = z.object({
  projectId: z.string().min(1),
  sceneId: z.string().optional(),
  type: z.enum(["image", "video", "attachment"] as const),
  mimeType: z.string().min(1),
  fileName: z.string().optional(),
  data: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
});

export const updateAssetSchema = z
  .object({
    fileName: z.string().min(1).optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const upsertSettingsSchema = z.object({
  data: z
    .object({
      sceneCount: z.number().int().positive().max(20).optional(),
      chatModel: chatModelSchema.optional(),
      imageModel: imageModelSchema.optional(),
      videoModel: videoModelSchema.optional(),
      workflow: workflowSchema.optional(),
      videoAutoplay: videoAutoplaySchema.optional(),
      videoResolution: z.enum(["1080p", "720p"] as const).optional(),
    })
    .passthrough(),
});

export const aiChatSchema = z.object({
  prompt: z.string().min(1),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "model"] as const),
        text: z.string().min(1),
      })
    )
    .default([]),
  image: z
    .object({
      data: z.string().min(1),
      mimeType: z.string().min(1),
    })
    .optional(),
  chatModel: chatModelSchema,
  workflow: workflowSchema,
  thinkingMode: z.boolean().optional().default(false),
  entryPoint: entryPointSchema.optional(),
});

export const aiChatStreamSchema = z.object({
  prompt: z.string().min(1),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "model"] as const),
        text: z.string().min(1),
      })
    )
    .default([]),
  image: z
    .object({
      data: z.string().min(1),
      mimeType: z.string().min(1),
    })
    .optional(),
  chatModel: chatModelSchema,
  workflow: workflowSchema,
  thinkingMode: z.boolean().optional().default(false),
  entryPoint: entryPointSchema.optional(),
});

export const aiStoryboardSchema = z.object({
  concept: z.string().min(1),
  image: z
    .object({
      data: z.string().min(1),
      mimeType: z.string().min(1),
    })
    .optional(),
  styleNames: z.array(z.string()).default([]),
  templateIds: z.array(z.string()).default([]),
  sceneCount: z.number().int().positive().max(20),
  workflow: workflowSchema,
  entryPoint: entryPointSchema.optional(),
});

export const aiEnhancedStoryboardSchema = z.object({
  concept: z.string().min(1),
  sceneCount: z.number().int().positive().max(20),
  workflow: workflowSchema,
  systemInstruction: z.string().optional(),
  entryPoint: entryPointSchema.optional(),
});

export const aiPreviewStylesSchema = z.object({
  concept: z.string().min(1),
  workflow: workflowSchema,
  entryPoint: entryPointSchema.optional(),
});

export const aiRegenerateDescriptionSchema = z.object({
  description: z.string().min(1),
});

export const aiGenerateImageSchema = z.object({
  projectId: z.string().min(1),
  sceneId: z.string().min(1),
  description: z.string().min(1),
  aspectRatio: z.enum(["16:9", "9:16", "1:1"] as const),
  stylePrompts: z.array(z.string()).default([]),
  templateIds: z.array(z.string()).optional(),
  imageModel: imageModelSchema,
  workflow: workflowSchema,
  thinkingMode: z.boolean().optional().default(false),
});

export const aiEditImageSchema = z.object({
  projectId: z.string().min(1),
  sceneId: z.string().min(1),
  prompt: z.string().min(1),
});

export const aiImageEditPromptSchema = z.object({
  projectId: z.string().min(1),
  sceneId: z.string().min(1),
});

export const aiVideoPromptSchema = z.object({
  projectId: z.string().min(1),
  sceneId: z.string().min(1),
});

export const aiGenerateVideoSchema = z.object({
  projectId: z.string().min(1),
  sceneId: z.string().min(1),
  prompt: z.string().min(1),
  model: videoModelSchema.default("veo-3.1-generate-preview"),
  aspectRatio: z.enum(["16:9", "9:16", "1:1"] as const),
  resolution: z.enum(["1080p", "720p"] as const).optional(),
  duration: z.number().int().min(4).max(8).optional(),
  referenceImages: z
    .array(
      z.object({
        data: z.string(),
        mimeType: z.string(),
      })
    )
    .max(3)
    .optional(),
  lastFrame: z
    .object({
      data: z.string(),
      mimeType: z.string(),
    })
    .optional(),
});

export const aiExtendVideoSchema = z.object({
  projectId: z.string().min(1),
  sceneId: z.string().min(1),
  prompt: z.string().min(1),
  model: videoModelSchema.default("veo-3.1-generate-preview"),
  extensionCount: z.number().int().min(1).max(20).default(1),
});

export const reorderScenesSchema = z.object({
  sceneIds: z
    .array(z.string().min(1))
    .min(1, "At least one scene ID is required"),
});

export const createSceneGroupSchema = z.object({
  name: z.string().trim().min(1, "Group name is required"),
  color: z.string().optional(),
});

export const updateSceneGroupSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    color: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const addScenesToGroupSchema = z.object({
  sceneIds: z
    .array(z.string().min(1))
    .min(1, "At least one scene ID is required"),
});

export const createSceneTagSchema = z.object({
  name: z.string().trim().min(1, "Tag name is required"),
  color: z.string().optional(),
});

export const assignTagsSchema = z.object({
  tagIds: z.array(z.string().min(1)).min(1, "At least one tag ID is required"),
});

// Document validation schemas
export const documentSceneSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().nonnegative(),
  title: z.string(),
  description: z.string(),
  imagePrompt: z.string(),
  animationPrompt: z.string(),
  metadata: z.record(z.unknown()),
  generatedAssets: z.array(z.string()).optional(),
});

export const documentChatMessageSchema = z.object({
  timestamp: z.string(),
  role: z.enum(["user", "model"] as const),
  content: z.string(),
  addedToDocument: z.boolean(),
});

export const documentContentSchema = z.object({
  title: z.string(),
  style: z.string(),
  goals: z.array(z.string()),
  outline: z.string(),
  scenes: z.array(documentSceneSchema),
  chatHistory: z.array(documentChatMessageSchema).optional(),
  metadata: z.object({
    workflow: z.string(),
    systemInstruction: z.string(),
    modelSettings: z.record(z.unknown()),
    totalDuration: z.number().nonnegative(),
  }),
});

export const saveDocumentSchema = z.object({
  content: documentContentSchema,
});

export const exportDocumentSchema = z.object({
  format: z.enum(["markdown", "pdf", "json"] as const),
  includeAssets: z.boolean().default(false),
});

export const filePurposeSchema = z.enum([
  "style-reference",
  "character-reference",
  "audio-reference",
  "text-document",
  "general-reference",
] as const);

export const uploadFileSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  purpose: filePurposeSchema,
});

// Workflow validation schemas
export const workflowCategorySchema = z.enum([
  "music-video",
  "commercial",
  "social",
  "explainer",
  "custom",
  "concept-art",
] as const);

export const createWorkflowSchema = z.object({
  name: z.string().trim().min(1, "Workflow name is required"),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  category: workflowCategorySchema,
  systemInstruction: z.string().min(1, "System instruction is required"),
  artStyle: z.string().optional(),
  examples: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateWorkflowSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    description: z.string().optional(),
    thumbnail: z.string().optional(),
    category: workflowCategorySchema.optional(),
    systemInstruction: z.string().min(1).optional(),
    artStyle: z.string().optional(),
    examples: z.array(z.string()).optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const createWorkflowSubtypeSchema = z.object({
  name: z.string().trim().min(1, "Subtype name is required"),
  description: z.string().optional(),
  instructionModifier: z.string().min(1, "Instruction modifier is required"),
});

export const updateWorkflowSubtypeSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    description: z.string().optional(),
    instructionModifier: z.string().min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

// Style template validation schemas
export const createStyleTemplateSchema = z.object({
  name: z.string().trim().min(1, "Template name is required"),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  category: z.array(z.string()).optional(),
  stylePrompt: z.string().min(1, "Style prompt is required"),
  tested: z.boolean().optional().default(false),
  examples: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateStyleTemplateSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    description: z.string().optional(),
    thumbnail: z.string().optional(),
    category: z.array(z.string()).optional(),
    stylePrompt: z.string().min(1).optional(),
    tested: z.boolean().optional(),
    examples: z.array(z.string()).optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });
