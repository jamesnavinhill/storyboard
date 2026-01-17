/**
 * Style Template Integration
 *
 * This service integrates style templates with AI generation:
 * - Appends style template prompt to all generations
 * - Tracks template usage in project document
 * - Allows per-generation template override
 * - Fetches templates from backend API
 */

export interface StyleTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  category: string[];
  stylePrompt: string;
  tested: boolean;
  examples?: string[];
  metadata: {
    bestFor?: string[];
    avoid?: string[];
    recommendedWith?: string[];
  };
}

/**
 * Fetch all style templates from backend
 */
export const fetchStyleTemplates = async (): Promise<StyleTemplate[]> => {
  const response = await fetch("/api/templates");

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw Object.assign(
      new Error(error.error || "Failed to fetch style templates"),
      {
        statusCode: response.status,
        requestId: error.requestId,
        errorCode: error.errorCode,
        retryable: error.retryable ?? true,
      }
    );
  }

  const data = await response.json();
  return data.templates || [];
};

/**
 * Fetch style template by ID
 */
export const fetchStyleTemplateById = async (
  templateId: string
): Promise<StyleTemplate | null> => {
  const response = await fetch(`/api/templates/${templateId}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw Object.assign(
      new Error(error.error || "Failed to fetch style template"),
      {
        statusCode: response.status,
        requestId: error.requestId,
        errorCode: error.errorCode,
        retryable: error.retryable ?? true,
      }
    );
  }

  const data = await response.json();
  return data.template || null;
};

/**
 * Apply style template to prompt
 */
export const applyStyleTemplate = (
  basePrompt: string,
  template: StyleTemplate | null
): string => {
  if (!template || !template.stylePrompt) {
    return basePrompt;
  }

  // Append style prompt to base prompt
  return `${basePrompt}\n\nStyle: ${template.stylePrompt}`;
};

/**
 * Generate image with style template
 */
export const generateImageWithTemplate = async (
  projectId: string,
  sceneId: string,
  description: string,
  aspectRatio: string,
  templateId: string | null,
  imageModel: string,
  workflow?: string,
  thinkingMode?: boolean
): Promise<any> => {
  let stylePrompt = "";

  if (templateId) {
    const template = await fetchStyleTemplateById(templateId);
    if (template) {
      stylePrompt = template.stylePrompt;
    }
  }

  const response = await fetch("/api/ai/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId,
      sceneId,
      description,
      aspectRatio,
      stylePrompts: stylePrompt ? [stylePrompt] : [],
      imageModel,
      workflow,
      thinkingMode,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw Object.assign(new Error(error.error || "Failed to generate image"), {
      statusCode: response.status,
      requestId: error.requestId,
      errorCode: error.errorCode,
      retryable: error.retryable ?? true,
    });
  }

  return response.json();
};

/**
 * Generate storyboard with style template
 */
export const generateStoryboardWithTemplate = async (
  concept: string,
  sceneCount: number,
  workflow: string,
  templateId: string | null,
  systemInstruction?: string
): Promise<any> => {
  let stylePrompt = "";

  if (templateId) {
    const template = await fetchStyleTemplateById(templateId);
    if (template) {
      stylePrompt = template.stylePrompt;
    }
  }

  const enhancedConcept = stylePrompt
    ? `${concept}\n\nStyle: ${stylePrompt}`
    : concept;

  const response = await fetch("/api/ai/storyboard/enhanced", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      concept: enhancedConcept,
      sceneCount,
      workflow,
      systemInstruction,
      styleTemplate: templateId || undefined,
      entryPoint: "agent:generate-enhanced",
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw Object.assign(
      new Error(error.error || "Failed to generate storyboard"),
      {
        statusCode: response.status,
        requestId: error.requestId,
        errorCode: error.errorCode,
        retryable: error.retryable ?? true,
      }
    );
  }

  return response.json();
};

/**
 * Track template usage in project document
 */
export const trackTemplateUsage = async (
  projectId: string,
  templateId: string,
  templateName: string
): Promise<void> => {
  // Fetch current document
  const docResponse = await fetch(`/api/projects/${projectId}/document`);

  if (!docResponse.ok && docResponse.status !== 404) {
    return; // Silently fail if document doesn't exist yet
  }

  let currentDoc: any = null;
  if (docResponse.ok) {
    const data = await docResponse.json();
    currentDoc = data.document;
  }

  // Update document with template usage
  const updatedContent = {
    ...(currentDoc?.content || {}),
    metadata: {
      ...(currentDoc?.content?.metadata || {}),
      styleTemplate: {
        id: templateId,
        name: templateName,
        appliedAt: new Date().toISOString(),
      },
    },
  };

  const updateResponse = await fetch(`/api/projects/${projectId}/document`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: updatedContent }),
  });

  if (!updateResponse.ok) {
    console.warn("Failed to track template usage in document");
  }
};

/**
 * Get template recommendations based on workflow
 */
export const getTemplateRecommendations = async (
  workflowCategory: string
): Promise<StyleTemplate[]> => {
  const templates = await fetchStyleTemplates();

  // Filter templates that match workflow category
  const matching = templates.filter((template) => {
    return template.category.some((cat) =>
      cat.toLowerCase().includes(workflowCategory.toLowerCase())
    );
  });

  // Prioritize tested templates
  const tested = matching.filter((t) => t.tested);
  const untested = matching.filter((t) => !t.tested);

  return [...tested, ...untested].slice(0, 5);
};

/**
 * Cache for style templates to avoid repeated API calls
 */
let templateCache: { templates: StyleTemplate[]; timestamp: number } | null =
  null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const getCachedStyleTemplates = async (): Promise<StyleTemplate[]> => {
  const now = Date.now();

  if (templateCache && now - templateCache.timestamp < CACHE_TTL) {
    return templateCache.templates;
  }

  const templates = await fetchStyleTemplates();
  templateCache = { templates, timestamp: now };

  return templates;
};

/**
 * Clear template cache (call after creating/updating/deleting templates)
 */
export const clearTemplateCache = (): void => {
  templateCache = null;
};

/**
 * Project-level template management
 */
export interface ProjectTemplateSettings {
  activeTemplateId: string | null;
  templateHistory: Array<{
    templateId: string;
    templateName: string;
    appliedAt: string;
  }>;
}

/**
 * Get project's active template
 */
export const getProjectActiveTemplate = async (
  projectId: string
): Promise<string | null> => {
  const response = await fetch(`/api/projects/${projectId}/document`);

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.document?.content?.metadata?.styleTemplate?.id || null;
};

/**
 * Set project's active template
 */
export const setProjectActiveTemplate = async (
  projectId: string,
  templateId: string | null
): Promise<void> => {
  if (!templateId) {
    return;
  }

  const template = await fetchStyleTemplateById(templateId);
  if (!template) {
    throw new Error("Template not found");
  }

  await trackTemplateUsage(projectId, templateId, template.name);
};
