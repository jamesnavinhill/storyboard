import type { Settings, Scene } from "../../../types";
import type { ServiceRegistry, SceneRecord } from "../../../types/services";

export const generateImageForScene = async (
  services: ServiceRegistry,
  input: {
    projectId: string;
    sceneId: string;
    description: string;
    aspectRatio: Scene["aspectRatio"];
    stylePrompts: string[];
    settings: Pick<Settings, "imageModel" | "workflow">;
    templateIds?: string[];
  }
): Promise<SceneRecord> => {
  const { mediaGenerator } = services;
  return mediaGenerator.generateImage({
    projectId: input.projectId,
    sceneId: input.sceneId,
    description: input.description,
    aspectRatio: input.aspectRatio,
    stylePrompts: input.stylePrompts,
    imageModel: input.settings.imageModel,
    workflow: input.settings.workflow,
    templateId: input.templateIds?.[0],
  });
};

export const editImageForScene = async (
  services: ServiceRegistry,
  input: { projectId: string; sceneId: string; prompt: string }
): Promise<SceneRecord> => {
  return services.mediaGenerator.editImage(input);
};

export const generateVideoForScene = async (
  services: ServiceRegistry,
  input: {
    projectId: string;
    sceneId: string;
    prompt: string;
    model: Settings["videoModel"];
    aspectRatio: Scene["aspectRatio"];
  }
): Promise<SceneRecord> => {
  return services.mediaGenerator.generateVideo(input);
};

export const suggestVideoPrompt = async (
  services: ServiceRegistry,
  input: { projectId: string; sceneId: string }
): Promise<string> => {
  return services.mediaGenerator.suggestVideoPrompt(input);
};

export const suggestImageEditPrompt = async (
  services: ServiceRegistry,
  input: { projectId: string; sceneId: string }
): Promise<string> => {
  return services.mediaGenerator.suggestImageEditPrompt(input);
};

export const extendVideoForScene = async (
  services: ServiceRegistry,
  input: {
    projectId: string;
    sceneId: string;
    prompt: string;
    model: Settings["videoModel"];
    extensionCount: number;
  }
): Promise<SceneRecord> => {
  return services.mediaGenerator.extendVideo(input);
};
