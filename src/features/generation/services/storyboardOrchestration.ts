/**
 * Storyboard Generation Orchestration
 *
 * This service orchestrates the complete storyboard generation flow:
 * 1. Concept development (chat mode)
 * 2. Style preview generation (4 sample scenes)
 * 3. Style selection
 * 4. Full storyboard generation with selected style
 * 5. Document update with generated scenes
 */

import type { ServiceRegistry, SceneRecord } from "../../../types/services";
import type { Settings } from "../../../types";

export interface StylePreview {
  id: string;
  description: string;
  imagePrompt: string;
  styleMetadata: {
    name: string;
    description: string;
  };
}

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

/**
 * Generate 4 style preview scenes based on concept
 */
export const generateStylePreviews = async (
  concept: string,
  workflow: string
): Promise<StylePreview[]> => {
  const response = await fetch("/api/ai/preview-styles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      concept,
      workflow,
      entryPoint: "agent:preview-styles",
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw Object.assign(
      new Error(error.error || "Failed to generate style previews"),
      {
        statusCode: response.status,
        requestId: error.requestId,
        errorCode: error.errorCode,
        retryable: error.retryable ?? true,
      }
    );
  }

  const data = await response.json();
  return data.previews || [];
};

/**
 * Generate enhanced storyboard with metadata
 */
export const generateEnhancedStoryboard = async (
  concept: string,
  sceneCount: number,
  workflow: string,
  systemInstruction?: string,
  selectedStyle?: string
): Promise<EnhancedScene[]> => {
  const response = await fetch("/api/ai/storyboard/enhanced", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      concept,
      sceneCount,
      workflow,
      systemInstruction,
      selectedStyle,
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

  const data = await response.json();
  return data.scenes || [];
};

/**
 * Persist enhanced scenes to database
 */
export const persistEnhancedScenes = async (
  services: ServiceRegistry,
  projectId: string,
  scenes: EnhancedScene[],
  aspectRatio: SceneRecord["aspectRatio"]
): Promise<SceneRecord[]> => {
  const startingOrder = 0; // Could be passed as parameter if appending
  const payload = scenes.map((scene, index) => ({
    description: scene.description,
    aspectRatio,
    orderIndex: startingOrder + index,
    // Store enhanced metadata in scene metadata field
    metadata: {
      imagePrompt: scene.imagePrompt,
      animationPrompt: scene.animationPrompt,
      duration: scene.metadata.duration,
      cameraMovement: scene.metadata.cameraMovement,
      lighting: scene.metadata.lighting,
      mood: scene.metadata.mood,
    },
  }));

  return services.projectStorage.createScenes(projectId, payload);
};

/**
 * Update project document with generated scenes
 */
export const updateProjectDocument = async (
  projectId: string,
  scenes: EnhancedScene[],
  concept: string,
  selectedStyle?: string,
  workflow?: string
): Promise<void> => {
  const totalDuration = scenes.reduce(
    (sum, scene) => sum + scene.metadata.duration,
    0
  );

  const documentContent = {
    title: concept.split("\n")[0].substring(0, 100), // First line as title
    style: selectedStyle || "Default",
    goals: [concept],
    outline: concept,
    scenes: scenes.map((scene, index) => ({
      id: `scene-${index + 1}`,
      order: index + 1,
      title: `Scene ${index + 1}`,
      description: scene.description,
      imagePrompt: scene.imagePrompt,
      animationPrompt: scene.animationPrompt,
      metadata: scene.metadata,
    })),
    metadata: {
      workflow: workflow || "default",
      systemInstruction: "",
      modelSettings: {},
      totalDuration,
    },
  };

  const response = await fetch(`/api/projects/${projectId}/document`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: documentContent }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw Object.assign(
      new Error(error.error || "Failed to update project document"),
      {
        statusCode: response.status,
        requestId: error.requestId,
        errorCode: error.errorCode,
        retryable: error.retryable ?? true,
      }
    );
  }
};

/**
 * Complete orchestrated storyboard generation flow
 */
export interface StoryboardGenerationFlow {
  // Step 1: Generate style previews
  generatePreviews: (
    concept: string,
    workflow: string
  ) => Promise<StylePreview[]>;

  // Step 2: Generate full storyboard with selected style
  generateWithStyle: (
    concept: string,
    sceneCount: number,
    workflow: string,
    selectedStyleId: string,
    systemInstruction?: string
  ) => Promise<EnhancedScene[]>;

  // Step 3: Persist and update document
  persistAndDocument: (
    services: ServiceRegistry,
    projectId: string,
    scenes: EnhancedScene[],
    aspectRatio: SceneRecord["aspectRatio"],
    concept: string,
    selectedStyle?: string,
    workflow?: string
  ) => Promise<SceneRecord[]>;
}

export const createStoryboardGenerationFlow = (): StoryboardGenerationFlow => {
  return {
    generatePreviews: generateStylePreviews,

    generateWithStyle: async (
      concept,
      sceneCount,
      workflow,
      selectedStyleId,
      systemInstruction
    ) => {
      return generateEnhancedStoryboard(
        concept,
        sceneCount,
        workflow,
        systemInstruction,
        selectedStyleId
      );
    },

    persistAndDocument: async (
      services,
      projectId,
      scenes,
      aspectRatio,
      concept,
      selectedStyle,
      workflow
    ) => {
      // Persist scenes to database
      const persistedScenes = await persistEnhancedScenes(
        services,
        projectId,
        scenes,
        aspectRatio
      );

      // Update project document
      await updateProjectDocument(
        projectId,
        scenes,
        concept,
        selectedStyle,
        workflow
      );

      return persistedScenes;
    },
  };
};
