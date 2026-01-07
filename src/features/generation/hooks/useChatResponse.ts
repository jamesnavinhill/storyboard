import { useCallback, useMemo, useState } from "react";
import type { ChatMessage, Settings } from "../../../types";
import { useServices } from "../../../services/registry";
import { generateChatResponse } from "../services/chatService";
import { mapProviderErrorToMessage } from "../../../utils/errorMapper";

interface SubmitArgs {
  text: string;
  image?: { data: string; mimeType: string; preview: string } | null;
  entryPoint?: string;
}

interface ProjectStateLike {
  activeProjectId: string | null;
  chatHistory: ChatMessage[];
  appendChatMessage: (msg: ChatMessage) => void;
  settings: Settings;
}

export interface UseChatResponseOptions {
  projectState: ProjectStateLike;
  sessionOverrides?: Partial<Settings>;
}

export const useChatResponse = (options: UseChatResponseOptions) => {
  const { projectState } = options;
  const services = useServices();
  const [isBusy, setIsBusy] = useState(false);

  const mergedSettings = useCallback((): Settings => {
    return {
      ...projectState.settings,
      ...(options.sessionOverrides ?? {}),
    } as Settings;
  }, [projectState.settings, options.sessionOverrides]);

  const submitChatMessage = useCallback(
    async ({ text, image, entryPoint }: SubmitArgs): Promise<boolean> => {
      const projectId = projectState.activeProjectId;
      const trimmed = text.trim();
      if (!trimmed || !projectId) {
        return false;
      }
      setIsBusy(true);

      const userMessage: ChatMessage = {
        role: "user",
        text: trimmed,
        image: image?.preview,
      };
      projectState.appendChatMessage(userMessage);
      await services.projectStorage.appendChatMessage(projectId, {
        role: "user",
        text: trimmed,
      });

      try {
        const response = await generateChatResponse(services, {
          prompt: trimmed,
          history: [
            ...projectState.chatHistory.map(({ role, text }) => ({
              role,
              text,
            })),
            { role: "user", text: trimmed, image: image?.preview },
          ],
          image: image
            ? { data: image.data, mimeType: image.mimeType }
            : undefined,
          settings: {
            chatModel: mergedSettings().chatModel,
            workflow: mergedSettings().workflow,
          },
          entryPoint,
        });

        const modelMessage: ChatMessage = { role: "model", text: response };
        projectState.appendChatMessage(modelMessage);
        await services.projectStorage.appendChatMessage(projectId, {
          role: "model",
          text: response,
        });
        return true;
      } catch (error) {
        const mapped = mapProviderErrorToMessage(error);
        const requestSuffix = mapped.requestId
          ? ` (Request ID: ${mapped.requestId})`
          : "";
        projectState.appendChatMessage({
          role: "model",
          text: `Sorry, I ran into an issue: ${mapped.message}${requestSuffix}`,
        });
        return false;
      } finally {
        setIsBusy(false);
      }
    },
    [projectState, services]
  );

  return useMemo(
    () => ({
      isBusy,
      submitChatMessage,
    }),
    [isBusy, submitChatMessage]
  );
};
