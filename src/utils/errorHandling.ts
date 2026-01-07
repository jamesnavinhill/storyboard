/**
 * Enhanced Error Handling Utilities
 *
 * Provides utilities for extracting request IDs, displaying error toasts,
 * implementing retry logic, and linking to documentation.
 *
 * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7
 */

import type { ToastAction } from "../components/toast/ToastProvider";

export interface EnhancedError extends Error {
  requestId?: string;
  retryable?: boolean;
  errorCode?: string;
  status?: number;
  entryPoint?: string;
}

/**
 * Error code documentation links
 */
export const ERROR_CODE_DOCS: Record<string, string> = {
  RATE_LIMITED: "https://ai.google.dev/gemini-api/docs/rate-limits",
  RATE_LIMIT_EXCEEDED: "https://ai.google.dev/gemini-api/docs/rate-limits",
  PROJECT_NOT_FOUND: "https://docs.vibeboard.app/errors#project-not-found",
  SCENE_NOT_FOUND: "https://docs.vibeboard.app/errors#scene-not-found",
  FILE_TOO_LARGE: "https://docs.vibeboard.app/errors#file-too-large",
  FILE_NOT_FOUND: "https://docs.vibeboard.app/errors#file-not-found",
  FILE_PROJECT_MISMATCH:
    "https://docs.vibeboard.app/errors#file-project-mismatch",
  UNSUPPORTED_FORMAT: "https://docs.vibeboard.app/errors#unsupported-format",
  UPLOAD_FAILED: "https://docs.vibeboard.app/errors#upload-failed",
  GEMINI_API_ERROR: "https://ai.google.dev/gemini-api/docs/troubleshooting",
  INVALID_MODEL: "https://ai.google.dev/gemini-api/docs/models",
  INVALID_PARAMETERS: "https://docs.vibeboard.app/errors#invalid-parameters",
  INVALID_EXPORT_FORMAT:
    "https://docs.vibeboard.app/errors#invalid-export-format",
  DOCUMENT_NOT_FOUND: "https://docs.vibeboard.app/errors#document-not-found",
  VERSION_NOT_FOUND: "https://docs.vibeboard.app/errors#version-not-found",
  EXPORT_FAILED: "https://docs.vibeboard.app/errors#export-failed",
  VALIDATION_FAILED: "https://docs.vibeboard.app/errors#validation-failed",
  SCENE_IMAGE_MISSING: "https://docs.vibeboard.app/errors#scene-image-missing",
  IMAGE_ASSET_NOT_FOUND:
    "https://docs.vibeboard.app/errors#image-asset-not-found",
};

/**
 * Extracts request ID from response headers
 */
export function extractRequestId(response: Response): string | undefined {
  return response.headers.get("x-request-id") || undefined;
}

/**
 * Extracts request ID from error object
 */
export function getRequestIdFromError(error: unknown): string | undefined {
  if (error && typeof error === "object") {
    const enhancedError = error as EnhancedError;
    return enhancedError.requestId;
  }
  return undefined;
}

/**
 * Gets documentation link for an error code
 */
export function getErrorDocLink(errorCode?: string): string | undefined {
  if (!errorCode) return undefined;
  return ERROR_CODE_DOCS[errorCode];
}

/**
 * Checks if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error && typeof error === "object") {
    const enhancedError = error as EnhancedError;
    if (typeof enhancedError.retryable === "boolean") {
      return enhancedError.retryable;
    }
    // Default: 5xx errors are retryable
    if (enhancedError.status && enhancedError.status >= 500) {
      return true;
    }
  }
  return false;
}

/**
 * Formats error message with request ID
 */
export function formatErrorMessage(
  message: string,
  requestId?: string
): string {
  if (requestId) {
    return `${message}\nRequest ID: ${requestId}`;
  }
  return message;
}

/**
 * Creates toast actions for error handling
 */
export function createErrorToastActions(
  error: unknown,
  onRetry?: () => void
): ToastAction[] {
  const actions: ToastAction[] = [];
  const enhancedError = error as EnhancedError;

  // Add retry action if error is retryable
  if (isRetryableError(error) && onRetry) {
    actions.push({
      label: "Retry",
      onClick: onRetry,
    });
  }

  // Add documentation link if available
  const docLink = getErrorDocLink(enhancedError.errorCode);
  if (docLink) {
    actions.push({
      label: "View Docs",
      onClick: () => window.open(docLink, "_blank"),
    });
  }

  return actions;
}

/**
 * Formats error for toast display
 */
export interface ErrorToastOptions {
  title?: string;
  description: string;
  requestId?: string;
  errorCode?: string;
  actions?: ToastAction[];
}

export function formatErrorForToast(
  error: unknown,
  onRetry?: () => void
): ErrorToastOptions {
  const enhancedError = error as EnhancedError;
  const message = enhancedError.message || "An error occurred";
  const requestId = getRequestIdFromError(error);
  const errorCode = enhancedError.errorCode;

  let description = message;
  if (requestId) {
    description += `\nRequest ID: ${requestId}`;
  }

  const actions = createErrorToastActions(error, onRetry);

  return {
    title: "Error",
    description,
    requestId,
    errorCode,
    actions: actions.length > 0 ? actions : undefined,
  };
}

/**
 * Retry logic with exponential backoff
 */
export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    shouldRetry = isRetryableError,
  } = options;

  let lastError: unknown;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if this is the last attempt
      if (attempt === maxAttempts) {
        break;
      }

      // Check if we should retry this error
      if (!shouldRetry(error, attempt)) {
        break;
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Increase delay for next attempt (exponential backoff)
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError;
}

/**
 * Parses error from fetch response
 */
export async function parseErrorFromResponse(
  response: Response
): Promise<EnhancedError> {
  const requestId = extractRequestId(response);

  let errorData: any = {};
  try {
    errorData = await response.json();
  } catch {
    // Response body is not JSON
  }

  const error = new Error(
    errorData.error ||
      errorData.message ||
      `Request failed with status ${response.status}`
  ) as EnhancedError;

  error.requestId = requestId || errorData.requestId;
  error.retryable = errorData.retryable ?? response.status >= 500;
  error.errorCode = errorData.errorCode;
  error.status = response.status;
  error.entryPoint = errorData.entryPoint;

  return error;
}

/**
 * Wraps a fetch call with error handling
 */
export async function fetchWithErrorHandling(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  try {
    const response = await fetch(input, init);

    if (!response.ok) {
      throw await parseErrorFromResponse(response);
    }

    return response;
  } catch (error) {
    // If it's already an EnhancedError, rethrow it
    if (error && typeof error === "object" && "requestId" in error) {
      throw error;
    }

    // Wrap other errors
    const enhancedError = new Error(
      error instanceof Error ? error.message : "Network request failed"
    ) as EnhancedError;
    enhancedError.retryable = true;
    throw enhancedError;
  }
}

/**
 * Creates a retry handler for a function
 */
export function createRetryHandler<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): () => Promise<T> {
  return () => retryWithBackoff(fn, options);
}
