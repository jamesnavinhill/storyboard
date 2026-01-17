import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ChatMessage,
  PresetStyle,
  Scene,
  SceneErrorKind,
  Settings,
} from "../types";
import type { useProjectState } from "./useProjectState";

type UseProjectStateResult = ReturnType<typeof useProjectState>;
import { useServices } from "../services/registry";
import type { ImageAttachment } from "./useImageAttachment";
import {
  mapProviderErrorToMessage,
  type MappedError,
} from "../utils/errorMapper";

interface ChatSubmitArgs {
  text: string;
  image?: ImageAttachment | null;
  mode: "storyboard" | "chat";
  aspectRatio: Scene["aspectRatio"];
  selectedStyles: PresetStyle[];
  entryPoint: string;
}

interface EditImageArgs {
  sceneId: string;
  prompt: string;
}

interface GenerateVideoArgs {
  sceneId: string;
  prompt: string;
}

interface UseGenerationActionsOptions {
  projectState: UseProjectStateResult;
  sessionOverrides?: Partial<Settings>;
}

export interface UseGenerationActionsResult {
  isBusy: boolean;
  submitChat: (args: ChatSubmitArgs) => Promise<"storyboard" | "chat" | null>;
  generateImage: (sceneId: string, styles: PresetStyle[]) => Promise<void>;
  regenerateDescription: (sceneId: string) => Promise<void>;
  toggleEditPanel: (sceneId: string) => void;
  toggleAnimatePanel: (sceneId: string) => void;
  suggestVideoPrompt: (sceneId: string) => Promise<string | null>;
  suggestImageEditPrompt: (sceneId: string) => Promise<string | null>;
  editImage: (args: EditImageArgs) => Promise<void>;
  generateVideo: (args: GenerateVideoArgs) => Promise<void>;
}

const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";

const ENTRYPOINT_LABELS: Record<string, string> = {
  "agent:generate": "the Generate assistant",
  "agent:chat": "the Text assistant",
  "agent:guru": "the Gurus assistant",
};

const formatEntryPointLabel = (entryPoint?: string): string | null => {
  if (!entryPoint) {
    return null;
  }
  return ENTRYPOINT_LABELS[entryPoint] ?? entryPoint;
};

const mapErrorWithFallback = (
  error: unknown,
  fallback: string
): MappedError => {
  const mapped = mapProviderErrorToMessage(error);
  const message =
    mapped.message && mapped.message !== GENERIC_ERROR_MESSAGE
      ? mapped.message
      : fallback;
  return {
    ...mapped,
    message,
    retryable: typeof mapped.retryable === "boolean" ? mapped.retryable : true,
  };
};

export const useGenerationActions = (
  options: UseGenerationActionsOptions
): UseGenerationActionsResult => {
  const { projectState } = options;
  const { chatProvider, storyboardGenerator, mediaGenerator, projectStorage } =
    useServices();

  const [isBusy, setIsBusy] = useState(false);

  const scenesRef = useRef(projectState.scenes);
  const chatHistoryRef = useRef(projectState.chatHistory);
  const settingsRef = useRef(projectState.settings);
  const sessionOverridesRef = useRef(options.sessionOverrides ?? {});

  useEffect(() => {
    scenesRef.current = projectState.scenes;
  }, [projectState.scenes]);

  useEffect(() => {
    chatHistoryRef.current = projectState.chatHistory;
  }, [projectState.chatHistory]);

  useEffect(() => {
    settingsRef.current = projectState.settings;
  }, [projectState.settings]);

  useEffect(() => {
    sessionOverridesRef.current = options.sessionOverrides ?? {};
  }, [options.sessionOverrides]);

  const mergedSettings = useCallback((): Settings => {
    return {
      ...settingsRef.current,
      ...sessionOverridesRef.current,
    } as Settings;
  }, []);

  const clearSceneErrorByKind = useCallback(
    (sceneId: string, kind: SceneErrorKind) => {
      const scene = scenesRef.current.find((item) => item.id === sceneId);
      if (scene?.uiState.lastError?.kind === kind) {
        projectState.setSceneError(sceneId, null);
      }
    },
    [projectState]
  );

  const submitChat = useCallback(
    async ({
      text,
      image,
      mode,
      aspectRatio,
      selectedStyles,
      entryPoint,
    }: ChatSubmitArgs) => {
      const projectId = projectState.activeProjectId;
      const trimmed = text.trim();
      if (!trimmed || !projectId) {
        return null;
      }

      setIsBusy(true);

      const userMessage: ChatMessage = {
        role: "user",
        text: trimmed,
        image: image?.preview,
      };
      projectState.appendChatMessage(userMessage);

      const historyForModel: ChatMessage[] = [
        ...chatHistoryRef.current.map(({ role, text }) => ({ role, text })),
        { role: "user", text: trimmed, image: image?.preview },
      ];

      await projectStorage.appendChatMessage(projectId, {
        role: "user",
        text: trimmed,
      });

      try {
        if (mode === "storyboard") {
          const styleNames = selectedStyles.map((style) => style.name);
          const { scenes, modelResponse } =
            await storyboardGenerator.generateScenes({
              concept: trimmed,
              image: image
                ? { data: image.data, mimeType: image.mimeType }
                : undefined,
              styleNames,
              sceneCount: mergedSettings().sceneCount,
              workflow: mergedSettings().workflow,
              entryPoint,
              // Files will be added by the caller if needed
            });

          const startingOrder = scenesRef.current.length;
          const payload = scenes.map((scene, index) => ({
            description: scene.description,
            aspectRatio,
            orderIndex: startingOrder + index,
          }));
          const persisted = await projectStorage.createScenes(
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
            await projectStorage.appendChatMessage(projectId, {
              role: "model",
              text: modelResponse,
            });
          }

          return "storyboard";
        }

        const response = await chatProvider.generateResponse({
          prompt: trimmed,
          history: historyForModel,
          image: image
            ? { data: image.data, mimeType: image.mimeType }
            : undefined,
          chatModel: mergedSettings().chatModel,
          workflow: mergedSettings().workflow,
          entryPoint,
          // Files will be added by the caller if needed
        });

        const modelMessage: ChatMessage = { role: "model", text: response };
        projectState.appendChatMessage(modelMessage);
        await projectStorage.appendChatMessage(projectId, {
          role: "model",
          text: response,
        });
        return "chat";
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
          text: `Sorry, I ran into an issue${
            entryPointLabel ? ` with ${entryPointLabel}` : ""
          }: ${mapped.message}${requestSuffix}`,
        });
        return null;
      } finally {
        setIsBusy(false);
      }
    },
    [
      chatProvider,
      projectState,
      projectStorage,
      storyboardGenerator,
      mergedSettings,
    ]
  );

  const generateImage = useCallback(
    async (sceneId: string, styles: PresetStyle[]) => {
      const projectId = projectState.activeProjectId;
      if (!projectId) {
        return;
      }
      const scene = scenesRef.current.find((item) => item.id === sceneId);
      if (!scene || scene.uiState.activity !== "idle") {
        return;
      }
      projectState.setSceneActivity(sceneId, "generating-image");
      try {
        clearSceneErrorByKind(sceneId, "image-generation");
        const promptTexts = styles.map((style) => style.prompt);
        const updated = await mediaGenerator.generateImage({
          projectId,
          sceneId,
          description: scene.description,
          aspectRatio: scene.aspectRatio,
          stylePrompts: promptTexts,
          imageModel: mergedSettings().imageModel,
          workflow: mergedSettings().workflow,
        });
        projectState.updateSceneRecord(updated);
        clearSceneErrorByKind(sceneId, "image-generation");
      } catch (error) {
        const mapped = mapErrorWithFallback(
          error,
          "Image generation failed. Please adjust your prompt or try again."
        );
        if (mapped.requestId) {
          console.error("Failed to generate image", error, {
            requestId: mapped.requestId,
          });
        } else {
          console.error("Failed to generate image", error);
        }
        projectState.setSceneError(sceneId, {
          kind: "image-generation",
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
    },
    [clearSceneErrorByKind, mediaGenerator, projectState]
  );

  const regenerateDescription = useCallback(
    async (sceneId: string) => {
      const projectId = projectState.activeProjectId;
      if (!projectId) {
        return;
      }
      const scene = scenesRef.current.find((item) => item.id === sceneId);
      if (!scene || scene.uiState.activity !== "idle") {
        return;
      }
      projectState.setSceneActivity(sceneId, "regenerating-description");
      let hadError = false;
      try {
        clearSceneErrorByKind(sceneId, "regenerate-description");
        const description = await storyboardGenerator.regenerateDescription(
          scene.description
        );
        const updated = await projectStorage.updateScene(projectId, sceneId, {
          description,
          primaryImageAssetId: null,
          primaryVideoAssetId: null,
        });
        projectState.updateSceneRecord(updated);
      } catch (error) {
        hadError = true;
        const mapped = mapErrorWithFallback(
          error,
          "Regeneration failed. Please retry in a moment."
        );
        if (mapped.requestId) {
          console.error("Failed to regenerate description", error, {
            requestId: mapped.requestId,
          });
        } else {
          console.error("Failed to regenerate description", error);
        }
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
        clearSceneErrorByKind(sceneId, "regenerate-description");
      }
    },
    [clearSceneErrorByKind, projectState, projectStorage, storyboardGenerator]
  );

  const toggleEditPanel = useCallback(
    (sceneId: string) => {
      const scene = scenesRef.current.find((item) => item.id === sceneId);
      if (!scene || !scene.imageAssetId) {
        return;
      }
      projectState.toggleScenePanel(sceneId, "edit");
    },
    [projectState]
  );

  const toggleAnimatePanel = useCallback(
    (sceneId: string) => {
      const scene = scenesRef.current.find((item) => item.id === sceneId);
      if (!scene || !scene.imageAssetId) {
        return;
      }
      projectState.toggleScenePanel(sceneId, "animate");
    },
    [projectState]
  );

  const suggestImageEditPrompt = useCallback(
    async (sceneId: string) => {
      const scene = scenesRef.current.find((item) => item.id === sceneId);
      if (!scene) {
        return null;
      }
      try {
        return await mediaGenerator.suggestImageEditPrompt({
          projectId: scene.projectId ?? projectState.activeProjectId!,
          sceneId: scene.id,
        });
      } catch (error) {
        console.error("Failed to suggest image edit prompt", error);
        return null;
      }
    },
    [mediaGenerator]
  );

  const suggestVideoPrompt = useCallback(
    async (sceneId: string) => {
      const scene = scenesRef.current.find((item) => item.id === sceneId);
      if (!scene) {
        return null;
      }
      try {
        return await mediaGenerator.suggestVideoPrompt({
          projectId: scene.projectId ?? projectState.activeProjectId!,
          sceneId: scene.id,
        });
      } catch (error) {
        console.error("Failed to suggest video prompt", error);
        return null;
      }
    },
    [mediaGenerator]
  );

  const editImage = useCallback(
    async ({ sceneId, prompt }: EditImageArgs) => {
      const projectId = projectState.activeProjectId;
      if (!projectId) {
        return;
      }
      const scene = scenesRef.current.find((item) => item.id === sceneId);
      if (!scene) {
        return;
      }
      if (scene.uiState.activity !== "idle") {
        return;
      }
      projectState.setSceneActivity(sceneId, "editing-image");
      let shouldClosePanel = false;
      try {
        clearSceneErrorByKind(sceneId, "image-edit");
        const updated = await mediaGenerator.editImage({
          projectId,
          sceneId,
          prompt,
        });
        projectState.updateSceneRecord(updated);
        clearSceneErrorByKind(sceneId, "image-edit");
        shouldClosePanel = true;
      } catch (error) {
        const mapped = mapErrorWithFallback(
          error,
          "Image edit failed. Please refine your prompt and try again."
        );
        if (mapped.requestId) {
          console.error("Failed to edit image", error, {
            requestId: mapped.requestId,
          });
        } else {
          console.error("Failed to edit image", error);
        }
        projectState.setSceneError(sceneId, {
          kind: "image-edit",
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
      if (shouldClosePanel) {
        projectState.setScenePanelState(sceneId, "edit", false);
      }
    },
    [clearSceneErrorByKind, mediaGenerator, projectState]
  );

  const generateVideo = useCallback(
    async ({ sceneId, prompt }: GenerateVideoArgs) => {
      const projectId = projectState.activeProjectId;
      if (!projectId) {
        return;
      }
      const scene = scenesRef.current.find((item) => item.id === sceneId);
      if (!scene) {
        return;
      }
      if (scene.uiState.activity !== "idle") {
        return;
      }
      projectState.setSceneActivity(sceneId, "generating-video");
      let shouldClosePanel = false;
      try {
        clearSceneErrorByKind(sceneId, "video-generation");
        const updated = await mediaGenerator.generateVideo({
          projectId,
          sceneId,
          prompt,
          model: mergedSettings().videoModel,
          aspectRatio: scene.aspectRatio,
          resolution: mergedSettings().videoResolution,
        });
        projectState.updateSceneRecord(updated);
        clearSceneErrorByKind(sceneId, "video-generation");
        shouldClosePanel = true;
        // Respect settings: only set autoplay pending if configured
        if (mergedSettings().videoAutoplay === "on-generate") {
          projectState.setSceneUiState(sceneId, (state) => ({
            ...state,
            autoplayPending: true,
          }));
        }
      } catch (error) {
        const mapped = mapErrorWithFallback(
          error,
          "Video generation failed. Please wait a moment and retry."
        );
        if (mapped.requestId) {
          console.error("Failed to generate video", error, {
            requestId: mapped.requestId,
          });
        } else {
          console.error("Failed to generate video", error);
        }
        projectState.setSceneError(sceneId, {
          kind: "video-generation",
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
      if (shouldClosePanel) {
        projectState.setScenePanelState(sceneId, "animate", false);
      }
    },
    [clearSceneErrorByKind, mediaGenerator, projectState]
  );

  return useMemo(
    () => ({
      isBusy,
      submitChat,
      generateImage,
      regenerateDescription,
      toggleEditPanel,
      toggleAnimatePanel,
      suggestVideoPrompt,
      suggestImageEditPrompt,
      editImage,
      generateVideo,
    }),
    [
      isBusy,
      submitChat,
      generateImage,
      regenerateDescription,
      toggleEditPanel,
      toggleAnimatePanel,
      suggestVideoPrompt,
      suggestImageEditPrompt,
      editImage,
      generateVideo,
    ]
  );
};
