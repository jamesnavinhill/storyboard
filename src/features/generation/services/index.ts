/**
 * Generation Services Index
 *
 * Exports all generation-related services for easy import
 */

// Existing services
export * from "./storyboardService";
export * from "./chatService";
export * from "./mediaService";

// New integration services
export * from "./storyboardOrchestration";
export * from "./fileGenerationIntegration";
export * from "./workflowIntegration";
export * from "./styleTemplateIntegration";
export {
  fetchProjectDocument,
  addChatMessageToDocument,
  addChatMessagesToDocument,
  isMessageInDocument,
  getDocumentChatHistory,
  clearDocumentChatHistory,
  exportChatHistoryAsMarkdown,
  detectMessageSection,
  addMessageToDocumentSection,
  createChatDocumentBatchOperations,
  type ChatMessage,
  type DocumentChatMessage,
} from "./documentChatIntegration";
