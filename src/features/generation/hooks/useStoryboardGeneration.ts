import { useCallback, useMemo, useState } from "react";
import type {
  ChatMessage,
  PresetStyle,
  Scene,
  SceneErrorKind,
  Settings,
} from "../../../types";
import { useServices } from "../../../services/registry";
import {
  generateStoryboardScenes,
  persistGeneratedScenes,
  regenerateDescriptionAndPersist,
} from "../services/storyboardService";
import {
  mapProviderErrorToMessage,
  type MappedError,
} from "../../../utils/errorMapper";

interface ProjectStateLike {
  activeProjectId: string | null;
  scenes: Scene[];
  chatHistory: ChatMessage[];
  settings: Settings;
  appendChatMessage: (msg: ChatMessage) => void;
  appendSceneRecords: (records: Array<any>) => void;
  updateSceneRecord: (record: any) => void;
  setSceneActivity: (
    sceneId: string,
    activity: Scene["uiState"]["activity"]
  ) => void;
  resetSceneState: (sceneId: string) => void;
  setSceneError: (
    sceneId: string,
    error: {
      kind: SceneErrorKind;
      message: string;
      canRetry: boolean;
      occurredAt: number;
      requestId?: string;
      docLink?: string;
      errorCode?: string;
    } | null
  ) => void;
}

export interface UseStoryboardGenerationOptions {
  projectState: ProjectStateLike;
  sessionOverrides?: Partial<Settings>;
}

export const useStoryboardGeneration = (
  options: UseStoryboardGenerationOptions
) => {
  const { projectState } = options;
  const services = useServices();
  const [isBusy, setIsBusy] = useState(false);

  const mergedSettings = useCallback((): Settings => {
    return {
      ...projectState.settings,
      ...(options.sessionOverrides ?? {}),
    } as Settings;
  }, [projectState.settings, options.sessionOverrides]);

  const formatEntryPointLabel = (entryPoint?: string): string | null => {
    if (!entryPoint) return null;
    const map: Record<string, string> = {
      "agent:generate": "the Generate assistant",
      "agent:chat": "the Text assistant",
      "agent:guru": "the Gurus assistant",
    };
    return map[entryPoint] ?? entryPoint;
  };

  const mapErrorWithFallback = (
    error: unknown,
    fallback: string
  ): MappedError => {
    const mapped = mapProviderErrorToMessage(error);
    const message =
      mapped.message &&
        mapped.message !== "Something went wrong. Please try again."
        ? mapped.message
        : fallback;
    return {
      ...mapped,
      message,
      retryable:
        typeof mapped.retryable === "boolean" ? mapped.retryable : true,
    };
  };

  const submitConcept = useCallback(
    async (args: {
      text: string;
      image?: { data: string; mimeType: string; preview: string } | null;
      aspectRatio: Scene["aspectRatio"];
      selectedStyles: PresetStyle[];
      templateIds?: string[];
      entryPoint?: string;
    }): Promise<boolean> => {
      const projectId = projectState.activeProjectId;
      const trimmed = args.text.trim();
      if (!trimmed || !projectId) {
        return false;
      }
      setIsBusy(true);

      const userMessage: ChatMessage = {
        role: "user",
        text: trimmed,
        image: args.image?.preview,
      };
      projectState.appendChatMessage(userMessage);
      await services.projectStorage.appendChatMessage(projectId, {
        role: "user",
        text: trimmed,
      });

      try {
        const styleNames = args.selectedStyles.map((s) => s.name);
        const { scenes, modelResponse } = await generateStoryboardScenes(
          services,
          {
            concept: trimmed,
            image: args.image
              ? { data: args.image.data, mimeType: args.image.mimeType }
              : undefined,
            styleNames,
            templateIds: args.templateIds,
            settings: {
              sceneCount: mergedSettings().sceneCount,
              workflow: mergedSettings().workflow,
            },
            entryPoint: args.entryPoint,
          }
        );

        const startingOrder = projectState.scenes.length;
        const payload = scenes.map((scene, index) => ({
          description: scene.description,
          aspectRatio: args.aspectRatio,
          orderIndex: startingOrder + index,
        }));
        const persisted = await persistGeneratedScenes(
          services,
          projectId,
          payload
        );
        projectState.appendSceneRecords(persisted);

        if (modelResponse) {
          const modelMessage: ChatMessage = {
            role: "model",
            text: modelResponse,
          };
          projectState.appendChatMessage(modelMessage);
          await services.projectStorage.appendChatMessage(projectId, {
            role: "model",
            text: modelResponse,
          });
        }
        return true;
      } catch (error) {
        const mapped = mapErrorWithFallback(
          error,
          "I ran into an unexpected issue. Please try again."
        );
        const entryPointLabel = formatEntryPointLabel(mapped.entryPoint);
        const requestSuffix = mapped.requestId
          ? ` (Request ID: ${mapped.requestId})`
          : "";
        projectState.appendChatMessage({
          role: "model",
          text: `Sorry, I ran into an issue${entryPointLabel ? ` with ${entryPointLabel}` : ""
            }: ${mapped.message}${requestSuffix}`,
        });
        return false;
      } finally {
        setIsBusy(false);
      }
    },
    [projectState, services, mergedSettings]
  );

  const regenerateDescription = useCallback(
    async (sceneId: string): Promise<void> => {
      const projectId = projectState.activeProjectId;
      if (!projectId) return;
      const scene = projectState.scenes.find((s) => s.id === sceneId);
      if (!scene || scene.uiState.activity !== "idle") return;
      projectState.setSceneActivity(sceneId, "regenerating-prompt");
      let hadError = false;
      try {
        const updated = await regenerateDescriptionAndPersist(
          services,
          projectId,
          sceneId,
          scene.description
        );
        projectState.updateSceneRecord(updated);
      } catch (error) {
        hadError = true;
        const mapped = mapErrorWithFallback(
          error,
          "Regeneration failed. Please retry in a moment."
        );
        projectState.setSceneError(sceneId, {
          kind: "regenerate-description",
          message: mapped.message,
          canRetry: mapped.retryable ?? true,
          occurredAt: Date.now(),
          requestId: mapped.requestId,
          docLink: mapped.docLink,
          errorCode: mapped.errorCode,
        });
      } finally {
        projectState.resetSceneState(sceneId);
      }
      if (!hadError) {
        projectState.setSceneError(sceneId, null);
      }
    },
    [projectState, services]
  );

  return useMemo(
    () => ({ isBusy, submitConcept, regenerateDescription }),
    [isBusy, submitConcept, regenerateDescription]
  );
};
