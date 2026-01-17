/**
 * File Upload Integration with Generation
 *
 * This service integrates uploaded files with AI generation requests:
 * - Passes uploaded files to generation requests
 * - Includes file purpose in generation context
 * - Handles Files API URIs vs inline data
 * - Enforces 10 file limit per generation
 */

import type { FilePurpose } from "../../chat/components/FilePurposeSelector";

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  purpose: FilePurpose;
  uri?: string; // Files API URI for large files
  inlineData?: string; // Base64 for small files
  thumbnail?: string;
}

export interface FileContext {
  files: UploadedFile[];
  purposeGroups: {
    styleReferences: UploadedFile[];
    characterReferences: UploadedFile[];
    audioReferences: UploadedFile[];
    textDocuments: UploadedFile[];
    generalReferences: UploadedFile[];
  };
}

/**
 * Group files by purpose for easier context building
 */
export const groupFilesByPurpose = (
  files: UploadedFile[]
): FileContext["purposeGroups"] => {
  return {
    styleReferences: files.filter((f) => f.purpose === "style-reference"),
    characterReferences: files.filter(
      (f) => f.purpose === "character-reference"
    ),
    audioReferences: files.filter((f) => f.purpose === "audio-reference"),
    textDocuments: files.filter((f) => f.purpose === "text-document"),
    generalReferences: files.filter((f) => f.purpose === "general-reference"),
  };
};

/**
 * Build file context for generation request
 */
export const buildFileContext = (files: UploadedFile[]): FileContext => {
  // Enforce 10 file limit
  const limitedFiles = files.slice(0, 10);

  return {
    files: limitedFiles,
    purposeGroups: groupFilesByPurpose(limitedFiles),
  };
};

/**
 * Format file context as text for AI prompt
 */
export const formatFileContextForPrompt = (context: FileContext): string => {
  if (context.files.length === 0) {
    return "";
  }

  const parts: string[] = [];

  if (context.purposeGroups.styleReferences.length > 0) {
    parts.push(
      `Style References (${
        context.purposeGroups.styleReferences.length
      }): ${context.purposeGroups.styleReferences
        .map((f) => f.name)
        .join(", ")}`
    );
  }

  if (context.purposeGroups.characterReferences.length > 0) {
    parts.push(
      `Character References (${
        context.purposeGroups.characterReferences.length
      }): ${context.purposeGroups.characterReferences
        .map((f) => f.name)
        .join(", ")}`
    );
  }

  if (context.purposeGroups.audioReferences.length > 0) {
    parts.push(
      `Audio References (${
        context.purposeGroups.audioReferences.length
      }): ${context.purposeGroups.audioReferences
        .map((f) => f.name)
        .join(", ")}`
    );
  }

  if (context.purposeGroups.textDocuments.length > 0) {
    parts.push(
      `Text Documents (${
        context.purposeGroups.textDocuments.length
      }): ${context.purposeGroups.textDocuments.map((f) => f.name).join(", ")}`
    );
  }

  if (context.purposeGroups.generalReferences.length > 0) {
    parts.push(
      `General References (${
        context.purposeGroups.generalReferences.length
      }): ${context.purposeGroups.generalReferences
        .map((f) => f.name)
        .join(", ")}`
    );
  }

  return parts.length > 0 ? `\n\nAttached Files:\n${parts.join("\n")}` : "";
};

/**
 * Prepare files for Gemini API request
 * Handles both Files API URIs and inline data
 */
export const prepareFilesForGeminiRequest = (
  files: UploadedFile[]
): Array<{ uri?: string; inlineData?: { data: string; mimeType: string } }> => {
  return files
    .map((file) => {
      if (file.uri) {
        // Large file uploaded via Files API
        return { uri: file.uri };
      } else if (file.inlineData) {
        // Small file as base64 inline data
        return {
          inlineData: {
            data: file.inlineData,
            mimeType: file.mimeType,
          },
        };
      }
      // Fallback: skip file if neither URI nor inline data
      return {};
    })
    .filter((f) => f.uri || f.inlineData);
};

/**
 * Enhanced storyboard generation with file context
 */
export const generateStoryboardWithFiles = async (
  concept: string,
  sceneCount: number,
  workflow: string,
  files: UploadedFile[],
  systemInstruction?: string
): Promise<any> => {
  const fileContext = buildFileContext(files);
  const filePromptAddition = formatFileContextForPrompt(fileContext);
  const enhancedConcept = concept + filePromptAddition;

  const geminiFiles = prepareFilesForGeminiRequest(fileContext.files);

  const response = await fetch("/api/ai/storyboard/enhanced", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      concept: enhancedConcept,
      sceneCount,
      workflow,
      systemInstruction,
      files: geminiFiles,
      entryPoint: "agent:generate-enhanced",
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw Object.assign(
      new Error(error.error || "Failed to generate storyboard"),
      {
        statusCode: response.status,
        requestId: error.requestId,
        errorCode: error.errorCode,
        retryable: error.retryable ?? true,
      }
    );
  }

  return response.json();
};

/**
 * Enhanced chat with file context
 */
export const generateChatWithFiles = async (
  prompt: string,
  history: Array<{ role: string; text: string }>,
  files: UploadedFile[],
  chatModel: string,
  workflow?: string,
  thinkingMode?: boolean
): Promise<string> => {
  const fileContext = buildFileContext(files);
  const filePromptAddition = formatFileContextForPrompt(fileContext);
  const enhancedPrompt = prompt + filePromptAddition;

  const geminiFiles = prepareFilesForGeminiRequest(fileContext.files);

  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: enhancedPrompt,
      history,
      files: geminiFiles,
      chatModel,
      workflow,
      thinkingMode,
      entryPoint: "agent:chat",
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw Object.assign(
      new Error(error.error || "Failed to generate chat response"),
      {
        statusCode: response.status,
        requestId: error.requestId,
        errorCode: error.errorCode,
        retryable: error.retryable ?? true,
      }
    );
  }

  const data = await response.json();
  return data.text || "";
};

/**
 * Validate file count before generation
 */
export const validateFileCount = (
  files: UploadedFile[]
): { valid: boolean; error?: string } => {
  if (files.length > 10) {
    return {
      valid: false,
      error: `Too many files attached (${files.length}). Maximum 10 files per generation.`,
    };
  }
  return { valid: true };
};
