/**
 * Document Export Utility
 *
 * Provides helpers for exporting project documents in multiple formats.
 * Handles file download and format-specific processing.
 *
 * Requirements: 9.6, 9.7, 9.8
 */

export type ExportFormat = "markdown" | "pdf" | "json";

export interface ExportOptions {
  projectId: string;
  format: ExportFormat;
  includeAssets?: boolean;
}

export interface ExportResponse {
  blob: Blob;
  filename: string;
  mimeType: string;
}

/**
 * Exports a project document in the specified format
 */
export async function exportDocument(
  options: ExportOptions
): Promise<ExportResponse> {
  const { projectId, format, includeAssets = false } = options;

  const url = `/api/projects/${projectId}/document/export`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      format,
      includeAssets,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.error || "Export failed");
    Object.assign(error, {
      status: response.status,
      requestId: errorData.requestId,
      retryable: errorData.retryable,
      errorCode: errorData.errorCode,
    });
    throw error;
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get("Content-Disposition");
  const mimeType =
    response.headers.get("Content-Type") || "application/octet-stream";

  // Extract filename from Content-Disposition header
  let filename = `project-${projectId}.${format}`;
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
    if (filenameMatch) {
      filename = filenameMatch[1];
    }
  }

  return {
    blob,
    filename,
    mimeType,
  };
}

/**
 * Downloads a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Exports and downloads a document in one step
 */
export async function exportAndDownload(options: ExportOptions): Promise<void> {
  const { blob, filename } = await exportDocument(options);
  downloadBlob(blob, filename);
}

/**
 * Gets the MIME type for an export format
 */
export function getExportMimeType(format: ExportFormat): string {
  switch (format) {
    case "markdown":
      return "text/markdown";
    case "pdf":
      return "application/pdf";
    case "json":
      return "application/json";
    default:
      return "application/octet-stream";
  }
}

/**
 * Gets the file extension for an export format
 */
export function getExportExtension(format: ExportFormat): string {
  switch (format) {
    case "markdown":
      return "md";
    case "pdf":
      return "pdf";
    case "json":
      return "json";
    default:
      return "txt";
  }
}

/**
 * Validates export options
 */
export function validateExportOptions(options: ExportOptions): {
  valid: boolean;
  error?: string;
} {
  if (!options.projectId) {
    return {
      valid: false,
      error: "Project ID is required",
    };
  }

  const validFormats: ExportFormat[] = ["markdown", "pdf", "json"];
  if (!validFormats.includes(options.format)) {
    return {
      valid: false,
      error: `Invalid format. Must be one of: ${validFormats.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Exports multiple documents in batch
 */
export async function exportMultipleDocuments(
  exports: ExportOptions[]
): Promise<ExportResponse[]> {
  const results: ExportResponse[] = [];

  for (const options of exports) {
    const result = await exportDocument(options);
    results.push(result);
  }

  return results;
}

/**
 * Creates a preview of the export without downloading
 */
export async function previewExport(options: ExportOptions): Promise<string> {
  const { blob, mimeType } = await exportDocument(options);

  // For text-based formats, return the content as string
  if (mimeType.startsWith("text/") || mimeType === "application/json") {
    return await blob.text();
  }

  // For binary formats, return a data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read blob"));
    reader.readAsDataURL(blob);
  });
}
