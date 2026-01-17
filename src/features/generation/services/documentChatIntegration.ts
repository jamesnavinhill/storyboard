/**
 * Document-Chat Integration
 *
 * This service integrates the document system with chat:
 * - Adds "Add to document" button in chat interface
 * - Appends chat messages to document
 * - Tracks which messages are added
 * - Manages document chat history
 */

export interface ChatMessage {
  role: "user" | "model";
  text: string;
  timestamp?: string;
  addedToDocument?: boolean;
}

export interface DocumentChatMessage {
  timestamp: Date;
  role: "user" | "model";
  content: string;
  addedToDocument: boolean;
}

/**
 * Fetch project document
 */
export const fetchProjectDocument = async (projectId: string): Promise<any> => {
  const response = await fetch(`/api/projects/${projectId}/document`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw Object.assign(
      new Error(error.error || "Failed to fetch project document"),
      {
        statusCode: response.status,
        requestId: error.requestId,
        errorCode: error.errorCode,
        retryable: error.retryable ?? true,
      }
    );
  }

  const data = await response.json();
  return data.document || null;
};

/**
 * Update project document
 */
export const updateProjectDocument = async (
  projectId: string,
  content: any
): Promise<void> => {
  const response = await fetch(`/api/projects/${projectId}/document`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
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
 * Add chat message to document
 */
export const addChatMessageToDocument = async (
  projectId: string,
  message: ChatMessage
): Promise<void> => {
  // Fetch current document
  let document = await fetchProjectDocument(projectId);

  // Initialize document if it doesn't exist
  if (!document) {
    document = {
      content: {
        title: "Untitled Project",
        style: "",
        goals: [],
        outline: "",
        scenes: [],
        chatHistory: [],
        metadata: {
          workflow: "",
          systemInstruction: "",
          modelSettings: {},
          totalDuration: 0,
        },
      },
    };
  }

  // Ensure chatHistory array exists
  if (!document.content.chatHistory) {
    document.content.chatHistory = [];
  }

  // Add message to chat history
  const documentMessage: DocumentChatMessage = {
    timestamp: new Date(),
    role: message.role,
    content: message.text,
    addedToDocument: true,
  };

  document.content.chatHistory.push(documentMessage);

  // Update document
  await updateProjectDocument(projectId, document.content);
};

/**
 * Add multiple chat messages to document
 */
export const addChatMessagesToDocument = async (
  projectId: string,
  messages: ChatMessage[]
): Promise<void> => {
  // Fetch current document
  let document = await fetchProjectDocument(projectId);

  // Initialize document if it doesn't exist
  if (!document) {
    document = {
      content: {
        title: "Untitled Project",
        style: "",
        goals: [],
        outline: "",
        scenes: [],
        chatHistory: [],
        metadata: {
          workflow: "",
          systemInstruction: "",
          modelSettings: {},
          totalDuration: 0,
        },
      },
    };
  }

  // Ensure chatHistory array exists
  if (!document.content.chatHistory) {
    document.content.chatHistory = [];
  }

  // Add messages to chat history
  const documentMessages: DocumentChatMessage[] = messages.map((message) => ({
    timestamp: new Date(),
    role: message.role,
    content: message.text,
    addedToDocument: true,
  }));

  document.content.chatHistory.push(...documentMessages);

  // Update document
  await updateProjectDocument(projectId, document.content);
};

/**
 * Check if message is already in document
 */
export const isMessageInDocument = async (
  projectId: string,
  messageText: string,
  messageRole: "user" | "model"
): Promise<boolean> => {
  const document = await fetchProjectDocument(projectId);

  if (!document || !document.content.chatHistory) {
    return false;
  }

  return document.content.chatHistory.some(
    (msg: DocumentChatMessage) =>
      msg.content === messageText && msg.role === messageRole
  );
};

/**
 * Get document chat history
 */
export const getDocumentChatHistory = async (
  projectId: string
): Promise<DocumentChatMessage[]> => {
  const document = await fetchProjectDocument(projectId);

  if (!document || !document.content.chatHistory) {
    return [];
  }

  return document.content.chatHistory;
};

/**
 * Clear document chat history
 */
export const clearDocumentChatHistory = async (
  projectId: string
): Promise<void> => {
  const document = await fetchProjectDocument(projectId);

  if (!document) {
    return;
  }

  document.content.chatHistory = [];

  await updateProjectDocument(projectId, document.content);
};

/**
 * Export document chat history as markdown
 */
export const exportChatHistoryAsMarkdown = (
  chatHistory: DocumentChatMessage[]
): string => {
  if (chatHistory.length === 0) {
    return "# Chat History\n\nNo messages yet.";
  }

  let markdown = "# Chat History\n\n";

  chatHistory.forEach((message) => {
    const timestamp = new Date(message.timestamp).toLocaleString();
    const role = message.role === "user" ? "You" : "Assistant";
    markdown += `## ${role} (${timestamp})\n\n${message.content}\n\n---\n\n`;
  });

  return markdown;
};

/**
 * Smart section detection for chat messages
 * Determines which section of the document a message should be added to
 */
export const detectMessageSection = (
  messageText: string
): "goals" | "outline" | "scenes" | "chatHistory" => {
  const lowerText = messageText.toLowerCase();

  // Check for goal-related keywords
  if (
    lowerText.includes("goal") ||
    lowerText.includes("objective") ||
    lowerText.includes("aim") ||
    lowerText.includes("purpose")
  ) {
    return "goals";
  }

  // Check for outline-related keywords
  if (
    lowerText.includes("outline") ||
    lowerText.includes("structure") ||
    lowerText.includes("plan") ||
    lowerText.includes("overview")
  ) {
    return "outline";
  }

  // Check for scene-related keywords
  if (
    lowerText.includes("scene") ||
    lowerText.includes("shot") ||
    lowerText.includes("sequence")
  ) {
    return "scenes";
  }

  // Default to chat history
  return "chatHistory";
};

/**
 * Add message to specific document section
 */
export const addMessageToDocumentSection = async (
  projectId: string,
  message: ChatMessage,
  section: "goals" | "outline" | "scenes" | "chatHistory"
): Promise<void> => {
  let document = await fetchProjectDocument(projectId);

  // Initialize document if it doesn't exist
  if (!document) {
    document = {
      content: {
        title: "Untitled Project",
        style: "",
        goals: [],
        outline: "",
        scenes: [],
        chatHistory: [],
        metadata: {
          workflow: "",
          systemInstruction: "",
          modelSettings: {},
          totalDuration: 0,
        },
      },
    };
  }

  // Add message to appropriate section
  switch (section) {
    case "goals":
      if (!document.content.goals) {
        document.content.goals = [];
      }
      document.content.goals.push(message.text);
      break;

    case "outline":
      if (!document.content.outline) {
        document.content.outline = "";
      }
      document.content.outline += `\n\n${message.text}`;
      break;

    case "scenes":
      // For scenes, we'd need to parse the message and create scene objects
      // This is a simplified version
      if (!document.content.scenes) {
        document.content.scenes = [];
      }
      // Skip for now - scenes should be added through proper generation flow
      break;

    case "chatHistory":
    default:
      if (!document.content.chatHistory) {
        document.content.chatHistory = [];
      }
      document.content.chatHistory.push({
        timestamp: new Date(),
        role: message.role,
        content: message.text,
        addedToDocument: true,
      });
      break;
  }

  // Update document
  await updateProjectDocument(projectId, document.content);
};

/**
 * Batch operations for chat-document integration
 */
export interface ChatDocumentBatchOperation {
  addMessages: (projectId: string, messages: ChatMessage[]) => Promise<void>;
  removeMessages: (
    projectId: string,
    messageIndices: number[]
  ) => Promise<void>;
  updateMessage: (
    projectId: string,
    messageIndex: number,
    newContent: string
  ) => Promise<void>;
}

export const createChatDocumentBatchOperations =
  (): ChatDocumentBatchOperation => {
    return {
      addMessages: addChatMessagesToDocument,

      removeMessages: async (projectId: string, messageIndices: number[]) => {
        const document = await fetchProjectDocument(projectId);
        if (!document || !document.content.chatHistory) {
          return;
        }

        // Remove messages at specified indices
        document.content.chatHistory = document.content.chatHistory.filter(
          (_: any, index: number) => !messageIndices.includes(index)
        );

        await updateProjectDocument(projectId, document.content);
      },

      updateMessage: async (
        projectId: string,
        messageIndex: number,
        newContent: string
      ) => {
        const document = await fetchProjectDocument(projectId);
        if (!document || !document.content.chatHistory) {
          return;
        }

        if (
          messageIndex >= 0 &&
          messageIndex < document.content.chatHistory.length
        ) {
          document.content.chatHistory[messageIndex].content = newContent;
          await updateProjectDocument(projectId, document.content);
        }
      },
    };
  };
