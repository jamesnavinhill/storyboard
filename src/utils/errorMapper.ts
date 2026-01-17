import { ApiRequestError } from "../services/providers/server";
import { ERROR_CODE_DOCS } from "./errorHandling";

export interface MappedError {
  message: string;
  docLink?: string;
  requestId?: string;
  retryable?: boolean;
  errorCode?: string;
  entryPoint?: string;
}

export const mapProviderErrorToMessage = (error: unknown): MappedError => {
  const fallback: MappedError = {
    message: "Something went wrong. Please try again.",
    retryable: true,
  };
  if (!error) return fallback;

  // Handle network-esque errors
  if (typeof window !== "undefined" && "navigator" in window) {
    // If offline
    if (!navigator.onLine) {
      return {
        message: "Network problem. Check connection and try again.",
        retryable: true,
      };
    }
  }

  let mapped: MappedError;
  let rawMessage: string;

  if (error instanceof ApiRequestError) {
    rawMessage = error.message ?? fallback.message;
    mapped = {
      message: rawMessage || fallback.message,
      docLink: error.errorCode ? ERROR_CODE_DOCS[error.errorCode] : undefined,
      requestId: error.requestId,
      retryable: error.retryable,
      errorCode: error.errorCode,
      entryPoint: error.entryPoint,
    };
  } else if (error instanceof Error) {
    rawMessage = error.message ?? fallback.message;
    mapped = {
      message: rawMessage || fallback.message,
      retryable: fallback.retryable,
    };
  } else {
    rawMessage = String(error);
    mapped = {
      message: rawMessage || fallback.message,
      retryable: fallback.retryable,
    };
  }

  const errMsg = rawMessage.toLowerCase();

  if (
    mapped.errorCode === "RATE_LIMITED" ||
    mapped.errorCode === "RATE_LIMIT_EXCEEDED"
  ) {
    mapped.message = "You've hit your API quota. Check billing or retry later.";
    mapped.docLink = ERROR_CODE_DOCS.RATE_LIMITED;
    mapped.retryable = true;
    return mapped;
  }

  // Gemini API 429 / RESOURCE_EXHAUSTED patterns
  if (
    errMsg.includes("resource_exhausted") ||
    errMsg.includes("quota") ||
    errMsg.includes("429")
  ) {
    mapped.message = "You've hit your API quota. Check billing or retry later.";
    mapped.docLink = ERROR_CODE_DOCS.RATE_LIMITED;
    mapped.retryable = true;
    mapped.errorCode = mapped.errorCode ?? "RATE_LIMITED";
    return mapped;
  }

  // generic network timeouts
  if (
    errMsg.includes("network") ||
    errMsg.includes("fetch") ||
    errMsg.includes("timeout")
  ) {
    mapped.message = "Network problem. Check connection and try again.";
    mapped.retryable = true;
    return mapped;
  }

  if (!mapped.message) {
    mapped.message = fallback.message;
  }

  if (typeof mapped.retryable === "undefined") {
    mapped.retryable = fallback.retryable;
  }

  return mapped;
};
