import { useCallback, useState } from "react";
import type { PresetStyle, Scene, Settings } from "../../../types";
import { useServices } from "../../../services/registry";
import { mapProviderErrorToMessage } from "../../../utils/errorMapper";

export interface StylePreview {
  description: string;
  styleDirection: string;
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

interface ProjectStateLike {
  activeProjectId: string | null;
  appendSceneRecords: (records: Array<any>) => void;
  updateProjectDocument?: (content: any) => void;
}

export interface UseStoryboardFlowOptions {
  projectState: ProjectStateLike;
  sessionOverrides?: Partial<Settings>;
}

export const useStoryboardFlow = (options: UseStoryboardFlowOptions) => {
  const { projectState } = options;
  const services = useServices();
  const [isGeneratingPreviews, setIsGeneratingPreviews] = useState(false);
  const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState(false);
  const [stylePreviews, setStylePreviews] = useState<StylePreview[]>([]);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState<
    number | null
  >(null);

  const generateStylePreviews = useCallback(
    async (concept: string, workflow: string): Promise<StylePreview[]> => {
      const projectId = projectState.activeProjectId;
      if (!projectId) {
        throw new Error("No active project");
      }

      setIsGeneratingPreviews(true);
      try {
        // Call the preview-styles endpoint
        const response = await fetch("/api/ai/preview-styles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            concept,
            workflow,
            entryPoint: "agent:style-preview",
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || "Failed to generate style previews");
        }

        const data = await response.json();
        const previews = data.previews || [];
        setStylePreviews(previews);
        return previews;
      } catch (error) {
        const mapped = mapProviderErrorToMessage(error);
        throw new Error(mapped.message);
      } finally {
        setIsGeneratingPreviews(false);
      }
    },
    [projectState.activeProjectId]
  );

  const generateEnhancedStoryboard = useCallback(
    async (
      concept: string,
      sceneCount: number,
      workflow: string,
      systemInstruction: string,
      selectedStyle?: StylePreview,
      aspectRatio: Scene["aspectRatio"] = "16:9"
    ): Promise<void> => {
      const projectId = projectState.activeProjectId;
      if (!projectId) {
        throw new Error("No active project");
      }

      setIsGeneratingStoryboard(true);
      try {
        // Call the enhanced storyboard endpoint
        const response = await fetch("/api/ai/storyboard/enhanced", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            concept,
            sceneCount,
            workflow,
            systemInstruction,
            selectedStyle: selectedStyle?.styleDirection,
            entryPoint: "agent:generate-enhanced",
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || "Failed to generate storyboard");
        }

        const data = await response.json();
        const scenes: EnhancedScene[] = data.scenes || [];

        // Persist scenes to database
        const payload = scenes.map((scene, index) => ({
          description: scene.description,
          aspectRatio,
          orderIndex: index,
          metadata: {
            imagePrompt: scene.imagePrompt,
            animationPrompt: scene.animationPrompt,
            duration: scene.metadata.duration,
            cameraMovement: scene.metadata.cameraMovement,
            lighting: scene.metadata.lighting,
            mood: scene.metadata.mood,
          },
        }));

        const persisted = await services.projectStorage.createScenes(
          projectId,
          payload
        );
        projectState.appendSceneRecords(persisted);

        // Update project document if handler exists
        if (projectState.updateProjectDocument) {
          const totalDuration = scenes.reduce(
            (sum, scene) => sum + scene.metadata.duration,
            0
          );
          projectState.updateProjectDocument({
            scenes: scenes.map((scene, index) => ({
              id: persisted[index].id,
              order: index,
              title: `Scene ${index + 1}`,
              description: scene.description,
              imagePrompt: scene.imagePrompt,
              animationPrompt: scene.animationPrompt,
              metadata: scene.metadata,
            })),
            metadata: {
              workflow,
              systemInstruction,
              selectedStyle: selectedStyle?.styleDirection,
              totalDuration,
            },
          });
        }

        // Clear previews after successful generation
        setStylePreviews([]);
        setSelectedPreviewIndex(null);
      } catch (error) {
        const mapped = mapProviderErrorToMessage(error);
        throw new Error(mapped.message);
      } finally {
        setIsGeneratingStoryboard(false);
      }
    },
    [projectState, services.projectStorage]
  );

  const selectStylePreview = useCallback((index: number) => {
    setSelectedPreviewIndex(index);
  }, []);

  const clearStylePreviews = useCallback(() => {
    setStylePreviews([]);
    setSelectedPreviewIndex(null);
  }, []);

  return {
    isGeneratingPreviews,
    isGeneratingStoryboard,
    stylePreviews,
    selectedPreviewIndex,
    generateStylePreviews,
    generateEnhancedStoryboard,
    selectStylePreview,
    clearStylePreviews,
  };
};
