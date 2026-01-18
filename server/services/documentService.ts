import fs from "node:fs";
import path from "node:path";
import type { UnifiedDatabase } from "../database";
import type { AppConfig } from "../config";
import {
  getDocument,
  saveDocument as saveDocumentStore,
  getDocumentHistory as getDocumentHistoryStore,
  getDocumentVersion,
  restoreDocumentVersion as restoreDocumentVersionStore,
  type ProjectDocument,
  type DocumentContent,
} from "../stores/documentStore";
import { getProjectById } from "../stores/projectStore";

/**
 * Validates document content structure
 */
const validateDocumentContent = (content: unknown): DocumentContent => {
  if (!content || typeof content !== "object") {
    throw Object.assign(
      new Error("Invalid document content: must be an object"),
      {
        statusCode: 400,
        errorCode: "INVALID_DOCUMENT_CONTENT",
        retryable: false,
      }
    );
  }

  const doc = content as Record<string, unknown>;

  // Validate required fields
  if (typeof doc.title !== "string") {
    throw Object.assign(
      new Error("Invalid document content: title must be a string"),
      {
        statusCode: 400,
        errorCode: "INVALID_DOCUMENT_CONTENT",
        retryable: false,
      }
    );
  }

  if (typeof doc.style !== "string") {
    throw Object.assign(
      new Error("Invalid document content: style must be a string"),
      {
        statusCode: 400,
        errorCode: "INVALID_DOCUMENT_CONTENT",
        retryable: false,
      }
    );
  }

  if (!Array.isArray(doc.goals)) {
    throw Object.assign(
      new Error("Invalid document content: goals must be an array"),
      {
        statusCode: 400,
        errorCode: "INVALID_DOCUMENT_CONTENT",
        retryable: false,
      }
    );
  }

  if (typeof doc.outline !== "string") {
    throw Object.assign(
      new Error("Invalid document content: outline must be a string"),
      {
        statusCode: 400,
        errorCode: "INVALID_DOCUMENT_CONTENT",
        retryable: false,
      }
    );
  }

  if (!Array.isArray(doc.scenes)) {
    throw Object.assign(
      new Error("Invalid document content: scenes must be an array"),
      {
        statusCode: 400,
        errorCode: "INVALID_DOCUMENT_CONTENT",
        retryable: false,
      }
    );
  }

  if (!doc.metadata || typeof doc.metadata !== "object") {
    throw Object.assign(
      new Error("Invalid document content: metadata must be an object"),
      {
        statusCode: 400,
        errorCode: "INVALID_DOCUMENT_CONTENT",
        retryable: false,
      }
    );
  }

  return content as DocumentContent;
};

/**
 * Verifies that a project exists
 */
const verifyProjectExists = async (db: UnifiedDatabase, projectId: string): Promise<void> => {
  const project = await getProjectById(db, projectId);
  if (!project) {
    throw Object.assign(new Error("Project not found"), {
      statusCode: 404,
      errorCode: "PROJECT_NOT_FOUND",
      retryable: false,
    });
  }
};

/**
 * Gets the latest document for a project
 */
export const getProjectDocument = async (
  db: UnifiedDatabase,
  projectId: string
): Promise<ProjectDocument | null> => {
  await verifyProjectExists(db, projectId);
  return await getDocument(db, projectId);
};

/**
 * Saves a new version of a document with validation
 * Automatically increments version and prunes old versions (keeps last 10)
 */
export const saveProjectDocument = async (
  db: UnifiedDatabase,
  projectId: string,
  content: unknown
): Promise<ProjectDocument> => {
  await verifyProjectExists(db, projectId);
  const validatedContent = validateDocumentContent(content);
  return await saveDocumentStore(db, projectId, validatedContent);
};

/**
 * Gets document history (all versions) for a project
 */
export const getProjectDocumentHistory = async (
  db: UnifiedDatabase,
  projectId: string,
  limit: number = 10
): Promise<ProjectDocument[]> => {
  await verifyProjectExists(db, projectId);
  return await getDocumentHistoryStore(db, projectId, limit);
};

/**
 * Restores a previous document version by creating a new version with the old content
 */
export const restoreProjectDocumentVersion = async (
  db: UnifiedDatabase,
  projectId: string,
  version: number
): Promise<ProjectDocument | null> => {
  await verifyProjectExists(db, projectId);

  // Verify the version exists
  const oldVersion = await getDocumentVersion(db, projectId, version);
  if (!oldVersion) {
    throw Object.assign(new Error("Document version not found"), {
      statusCode: 404,
      errorCode: "VERSION_NOT_FOUND",
      retryable: false,
    });
  }

  return await restoreDocumentVersionStore(db, projectId, version);
};

/**
 * Generates diff metadata between two document versions
 * Returns a summary of changes
 */
export const generateVersionDiff = (
  oldDoc: ProjectDocument,
  newDoc: ProjectDocument
): {
  titleChanged: boolean;
  styleChanged: boolean;
  goalsChanged: boolean;
  outlineChanged: boolean;
  scenesAdded: number;
  scenesRemoved: number;
  scenesModified: number;
  metadataChanged: boolean;
} => {
  const oldContent = oldDoc.content;
  const newContent = newDoc.content;

  // Track scene changes
  const oldSceneIds = new Set(oldContent.scenes.map((s) => s.id));
  const newSceneIds = new Set(newContent.scenes.map((s) => s.id));

  const scenesAdded = newContent.scenes.filter(
    (s) => !oldSceneIds.has(s.id)
  ).length;
  const scenesRemoved = oldContent.scenes.filter(
    (s) => !newSceneIds.has(s.id)
  ).length;

  // Count modified scenes (scenes that exist in both but have different content)
  let scenesModified = 0;
  for (const newScene of newContent.scenes) {
    const oldScene = oldContent.scenes.find((s) => s.id === newScene.id);
    if (oldScene) {
      const sceneChanged =
        oldScene.title !== newScene.title ||
        oldScene.description !== newScene.description ||
        oldScene.imagePrompt !== newScene.imagePrompt ||
        oldScene.animationPrompt !== newScene.animationPrompt ||
        oldScene.order !== newScene.order;

      if (sceneChanged) {
        scenesModified++;
      }
    }
  }

  return {
    titleChanged: oldContent.title !== newContent.title,
    styleChanged: oldContent.style !== newContent.style,
    goalsChanged:
      JSON.stringify(oldContent.goals) !== JSON.stringify(newContent.goals),
    outlineChanged: oldContent.outline !== newContent.outline,
    scenesAdded,
    scenesRemoved,
    scenesModified,
    metadataChanged:
      JSON.stringify(oldContent.metadata) !==
      JSON.stringify(newContent.metadata),
  };
};

/**
 * Exports a document to Markdown format
 */
const exportToMarkdown = (
  doc: ProjectDocument,
  includeAssets: boolean
): string => {
  const { content } = doc;
  let markdown = "";

  // Title
  markdown += `# ${content.title}\n\n`;

  // Style
  markdown += `## Style\n\n${content.style}\n\n`;

  // Goals
  markdown += `## Goals\n\n`;
  for (const goal of content.goals) {
    markdown += `- ${goal}\n`;
  }
  markdown += "\n";

  // Outline
  markdown += `## Outline\n\n${content.outline}\n\n`;

  // Metadata
  markdown += `## Metadata\n\n`;
  markdown += `- **Workflow**: ${content.metadata.workflow}\n`;
  markdown += `- **Total Duration**: ${content.metadata.totalDuration}s\n`;
  markdown += `- **System Instruction**: ${content.metadata.systemInstruction}\n\n`;

  // Scenes
  markdown += `## Scenes\n\n`;
  for (const scene of content.scenes) {
    markdown += `### Scene ${scene.order}: ${scene.title}\n\n`;
    markdown += `**Description**: ${scene.description}\n\n`;
    markdown += `**Image Prompt**:\n\`\`\`\n${scene.imagePrompt}\n\`\`\`\n\n`;
    markdown += `**Animation Prompt**:\n\`\`\`\n${scene.animationPrompt}\n\`\`\`\n\n`;

    if (
      includeAssets &&
      scene.generatedAssets &&
      scene.generatedAssets.length > 0
    ) {
      markdown += `**Generated Assets**:\n`;
      for (const asset of scene.generatedAssets) {
        markdown += `- ${asset}\n`;
      }
      markdown += "\n";
    }

    if (scene.metadata && Object.keys(scene.metadata).length > 0) {
      markdown += `**Metadata**: ${JSON.stringify(
        scene.metadata,
        null,
        2
      )}\n\n`;
    }

    markdown += "---\n\n";
  }

  // Chat History (if present)
  if (content.chatHistory && content.chatHistory.length > 0) {
    markdown += `## Chat History\n\n`;
    for (const msg of content.chatHistory) {
      markdown += `**${msg.role}** (${msg.timestamp}):\n${msg.content}\n\n`;
    }
  }

  return markdown;
};

/**
 * Exports a document to JSON format
 */
const exportToJson = (doc: ProjectDocument, includeAssets: boolean): string => {
  if (!includeAssets) {
    // Remove asset references and return just the content
    const contentCopy = JSON.parse(JSON.stringify(doc.content));
    for (const scene of contentCopy.scenes) {
      delete scene.generatedAssets;
    }
    return JSON.stringify(contentCopy, null, 2);
  }

  // Return just the content with assets
  return JSON.stringify(doc.content, null, 2);
};

/**
 * Exports a document to PDF format
 * Note: This is a placeholder implementation that generates a text-based PDF
 * In a production environment, you would use a library like pdfkit or puppeteer
 */
const exportToPdf = (doc: ProjectDocument, includeAssets: boolean): Buffer => {
  // For now, we'll create a simple text representation
  // In production, use a proper PDF library
  const markdown = exportToMarkdown(doc, includeAssets);
  const pdfContent = `PDF Export\n\n${markdown}`;
  return Buffer.from(pdfContent, "utf-8");
};

export type ExportFormat = "markdown" | "pdf" | "json";

/**
 * Exports a project document in the specified format
 */
export const exportProjectDocument = async (
  db: UnifiedDatabase,
  projectId: string,
  format: ExportFormat,
  includeAssets: boolean = false
): Promise<{ buffer: Buffer; mimeType: string; filename: string }> => {
  await verifyProjectExists(db, projectId);

  const doc = await getDocument(db, projectId);
  if (!doc) {
    throw Object.assign(new Error("Document not found"), {
      statusCode: 404,
      errorCode: "DOCUMENT_NOT_FOUND",
      retryable: false,
    });
  }

  let buffer: Buffer;
  let mimeType: string;
  let extension: string;

  switch (format) {
    case "markdown":
      buffer = Buffer.from(exportToMarkdown(doc, includeAssets), "utf-8");
      mimeType = "text/markdown";
      extension = "md";
      break;

    case "pdf":
      buffer = exportToPdf(doc, includeAssets);
      mimeType = "application/pdf";
      extension = "pdf";
      break;

    case "json":
      buffer = Buffer.from(exportToJson(doc, includeAssets), "utf-8");
      mimeType = "application/json";
      extension = "json";
      break;

    default:
      throw Object.assign(new Error(`Unsupported export format: ${format}`), {
        statusCode: 400,
        errorCode: "INVALID_EXPORT_FORMAT",
        retryable: false,
      });
  }

  const sanitizedTitle = doc.content.title
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();

  const filename = `${sanitizedTitle}-v${doc.version}.${extension}`;

  return { buffer, mimeType, filename };
};
