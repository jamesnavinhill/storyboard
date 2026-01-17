import type { Settings } from "../../../types";
import type { ServiceRegistry, SceneRecord } from "../../../types/services";

export interface StoryboardConceptRequest {
  concept: string;
  image?: { data: string; mimeType: string };
  styleNames: string[];
  templateIds?: string[];
  settings: Pick<Settings, "sceneCount" | "workflow">;
  entryPoint?: string;
}

export const generateStoryboardScenes = async (
  services: ServiceRegistry,
  req: StoryboardConceptRequest
): Promise<{
  scenes: Array<{ description: string }>;
  modelResponse?: string;
}> => {
  const { storyboardGenerator } = services;
  const { scenes, modelResponse } = await storyboardGenerator.generateScenes({
    concept: req.concept,
    image: req.image,
    styleNames: req.styleNames,
    templateIds: req.templateIds,
    sceneCount: req.settings.sceneCount,
    workflow: req.settings.workflow,
    entryPoint: req.entryPoint,
  });
  return { scenes, modelResponse };
};

export const persistGeneratedScenes = async (
  services: ServiceRegistry,
  projectId: string,
  payload: Array<{
    description: string;
    aspectRatio: SceneRecord["aspectRatio"];
    orderIndex?: number;
  }>
): Promise<SceneRecord[]> => {
  return services.projectStorage.createScenes(projectId, payload);
};

export const regenerateDescriptionAndPersist = async (
  services: ServiceRegistry,
  projectId: string,
  sceneId: string,
  existingDescription: string
): Promise<SceneRecord> => {
  const { storyboardGenerator, projectStorage } = services;
  const description = await storyboardGenerator.regenerateDescription(
    existingDescription
  );
  return projectStorage.updateScene(projectId, sceneId, {
    description,
    primaryImageAssetId: null,
    primaryVideoAssetId: null,
  });
};
