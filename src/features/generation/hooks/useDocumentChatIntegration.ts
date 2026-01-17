import { useCallback, useState } from "react";
import type { ChatMessage } from "../../../types";

export interface DocumentChatMessage extends ChatMessage {
  id: string;
  addedToDocument: boolean;
  timestamp: Date;
}

export interface UseDocumentChatIntegrationOptions {
  projectId?: string | null;
}

export const useDocumentChatIntegration = (
  options: UseDocumentChatIntegrationOptions = {}
) => {
  const { projectId } = options;
  const [messagesAddedToDocument, setMessagesAddedToDocument] = useState<
    Set<string>
  >(new Set());

  const addMessageToDocument = useCallback(
    async (messageId: string, message: ChatMessage): Promise<boolean> => {
      if (!projectId) {
        console.error("No active project");
        return false;
      }

      try {
        const response = await fetch(
          `/api/projects/${projectId}/document/add-message`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              messageId,
              role: message.role,
              content: message.text,
              timestamp: new Date().toISOString(),
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to add message to document");
        }

        setMessagesAddedToDocument((prev) => new Set(prev).add(messageId));
        return true;
      } catch (error) {
        console.error("Failed to add message to document:", error);
        return false;
      }
    },
    [projectId]
  );

  const removeMessageFromDocument = useCallback(
    async (messageId: string): Promise<boolean> => {
      if (!projectId) {
        console.error("No active project");
        return false;
      }

      try {
        const response = await fetch(
          `/api/projects/${projectId}/document/remove-message`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ messageId }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to remove message from document");
        }

        setMessagesAddedToDocument((prev) => {
          const next = new Set(prev);
          next.delete(messageId);
          return next;
        });
        return true;
      } catch (error) {
        console.error("Failed to remove message from document:", error);
        return false;
      }
    },
    [projectId]
  );

  const isMessageInDocument = useCallback(
    (messageId: string): boolean => {
      return messagesAddedToDocument.has(messageId);
    },
    [messagesAddedToDocument]
  );

  const clearDocumentMessages = useCallback(() => {
    setMessagesAddedToDocument(new Set());
  }, []);

  const enrichChatHistory = useCallback(
    (messages: ChatMessage[]): DocumentChatMessage[] => {
      return messages.map((msg, index) => ({
        ...msg,
        id: `msg-${index}`,
        addedToDocument: messagesAddedToDocument.has(`msg-${index}`),
        timestamp: new Date(),
      }));
    },
    [messagesAddedToDocument]
  );

  return {
    addMessageToDocument,
    removeMessageFromDocument,
    isMessageInDocument,
    clearDocumentMessages,
    enrichChatHistory,
    documentMessageCount: messagesAddedToDocument.size,
  };
};
