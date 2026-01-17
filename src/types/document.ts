export interface DocumentContent {
  title: string;
  style: string;
  goals: string[];
  outline: string;
  scenes: DocumentScene[];
  chatHistory?: DocumentChatMessage[];
  metadata: {
    workflow: string;
    systemInstruction: string;
    modelSettings: Record<string, unknown>;
    totalDuration: number;
  };
}

export interface DocumentScene {
  id: string;
  order: number;
  title: string;
  description: string;
  imagePrompt: string;
  animationPrompt: string;
  metadata: Record<string, unknown>;
  generatedAssets?: string[];
}

export interface DocumentChatMessage {
  timestamp: string;
  role: "user" | "model";
  content: string;
  addedToDocument: boolean;
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  version: number;
  content: DocumentContent;
  createdAt: string;
  updatedAt: string;
}

export type ExportFormat = "markdown" | "pdf" | "json";
