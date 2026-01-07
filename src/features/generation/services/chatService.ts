import type { ChatMessage, Settings } from "../../../types";
import type { ServiceRegistry } from "../../../types/services";

export interface ChatRequest {
  prompt: string;
  history: ChatMessage[];
  image?: { data: string; mimeType: string };
  settings: Pick<Settings, "chatModel" | "workflow">;
  entryPoint?: string;
}

export const generateChatResponse = async (
  services: ServiceRegistry,
  req: ChatRequest
): Promise<string> => {
  const { chatProvider } = services;
  return chatProvider.generateResponse({
    prompt: req.prompt,
    history: req.history,
    image: req.image,
    chatModel: req.settings.chatModel,
    workflow: req.settings.workflow,
    entryPoint: req.entryPoint,
  });
};
