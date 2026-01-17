// Types for Gemini API Enhancement features
// Based on design document: .kiro/specs/gemini-api-enhancement/design.md

export type WorkflowCategory =
  | "music-video"
  | "commercial"
  | "social"
  | "explainer"
  | "custom"
  | "concept-art";

export type FilePurpose =
  | "style-reference"
  | "character-reference"
  | "audio-reference"
  | "text-document"
  | "general-reference";

export interface WorkflowSubtype {
  id: string;
  workflowId: string;
  name: string;
  description: string;
  instructionModifier: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  category: WorkflowCategory;
  subtypes: WorkflowSubtype[];
  systemInstruction: string;
  artStyle: string;
  examples?: string[];
  metadata: {
    targetDuration?: string;
    typicalSceneCount?: number;
    recommendedModels?: {
      text?: string;
      image?: string;
      video?: string;
    };
  };
}

export interface StyleTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  category: string[];
  stylePrompt: string;
  tested: boolean;
  examples?: string[];
  metadata: {
    bestFor?: string[];
    avoid?: string[];
    recommendedWith?: string[];
  };
}

export interface DocumentScene {
  id: string;
  order: number;
  title: string;
  description: string;
  imagePrompt: string;
  animationPrompt: string;
  metadata: Record<string, any>;
  generatedAssets?: string[];
}

export interface DocumentChatMessage {
  timestamp: Date;
  role: "user" | "model";
  content: string;
  addedToDocument: boolean;
}

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
    modelSettings: Record<string, any>;
    totalDuration: number;
  };
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  version: number;
  content: DocumentContent;
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadedFile {
  id: string;
  projectId: string;
  name: string;
  size: number;
  mimeType: string;
  purpose: FilePurpose;
  uri?: string;
  inlineData?: string;
  thumbnail?: string;
  uploadedAt: Date;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number; // 0-100
  status: "uploading" | "complete" | "error";
  error?: string;
}
