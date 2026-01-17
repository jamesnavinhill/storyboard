import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";

/**
 * Standardized API error response format
 */
export interface APIError {
    error: string;
    errorCode: string;
    requestId: string;
    retryable: boolean;
    details?: object;
}

/**
 * Custom application error class with standardized properties
 */
export class AppError extends Error {
    constructor(
        message: string,
        public statusCode: number = 500,
        public errorCode: string = "INTERNAL_ERROR",
        public retryable: boolean = false,
        public details?: object
    ) {
        super(message);
        this.name = "AppError";
    }
}

/**
 * Common error codes for the API
 */
export const ErrorCodes = {
    // 4xx Client Errors
    BAD_REQUEST: "BAD_REQUEST",
    VALIDATION_ERROR: "VALIDATION_ERROR",
    NOT_FOUND: "NOT_FOUND",
    UNAUTHORIZED: "UNAUTHORIZED",
    FORBIDDEN: "FORBIDDEN",
    CONFLICT: "CONFLICT",
    RATE_LIMITED: "RATE_LIMITED",

    // 5xx Server Errors
    INTERNAL_ERROR: "INTERNAL_ERROR",
    DATABASE_ERROR: "DATABASE_ERROR",
    AI_SERVICE_ERROR: "AI_SERVICE_ERROR",
    EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
} as const;

/**
 * Factory functions for common error types
 */
export const Errors = {
    badRequest: (message: string, details?: object) =>
        new AppError(message, 400, ErrorCodes.BAD_REQUEST, false, details),

    validationError: (message: string, details?: object) =>
        new AppError(message, 400, ErrorCodes.VALIDATION_ERROR, false, details),

    notFound: (resource: string) =>
        new AppError(`${resource} not found`, 404, ErrorCodes.NOT_FOUND, false),

    unauthorized: (message = "Unauthorized") =>
        new AppError(message, 401, ErrorCodes.UNAUTHORIZED, false),

    forbidden: (message = "Forbidden") =>
        new AppError(message, 403, ErrorCodes.FORBIDDEN, false),

    conflict: (message: string) =>
        new AppError(message, 409, ErrorCodes.CONFLICT, false),

    rateLimited: (retryAfterMs?: number) =>
        new AppError(
            "Too many requests, please try again later",
            429,
            ErrorCodes.RATE_LIMITED,
            true,
            retryAfterMs ? { retryAfterMs } : undefined
        ),

    internal: (message = "Internal server error") =>
        new AppError(message, 500, ErrorCodes.INTERNAL_ERROR, true),

    database: (message: string) =>
        new AppError(message, 500, ErrorCodes.DATABASE_ERROR, true),

    aiService: (message: string, retryable = true) =>
        new AppError(message, 502, ErrorCodes.AI_SERVICE_ERROR, retryable),

    externalService: (message: string, retryable = true) =>
        new AppError(message, 502, ErrorCodes.EXTERNAL_SERVICE_ERROR, retryable),
};

/**
 * Formats an error into a standardized API error response
 */
export function formatApiError(err: unknown, requestId: string): APIError {
    if (err instanceof AppError) {
        return {
            error: err.message,
            errorCode: err.errorCode,
            requestId,
            retryable: err.retryable,
            details: err.details,
        };
    }

    // Handle Zod validation errors
    if (err && typeof err === "object" && "issues" in err) {
        return {
            error: "Validation failed",
            errorCode: ErrorCodes.VALIDATION_ERROR,
            requestId,
            retryable: false,
            details: { issues: (err as { issues: unknown }).issues },
        };
    }

    // Generic error fallback
    return {
        error: err instanceof Error ? err.message : "Internal server error",
        errorCode: ErrorCodes.INTERNAL_ERROR,
        requestId,
        retryable: true,
    };
}

/**
 * Express error handling middleware
 * Converts all errors to standardized API error format
 */
export function errorHandler(
    err: unknown,
    req: Request,
    res: Response,
    _next: NextFunction
): void {
    const requestId = (req.headers["x-request-id"] as string) || randomUUID();

    const apiError = formatApiError(err, requestId);

    // Determine status code
    const statusCode = err instanceof AppError ? err.statusCode : 500;

    // Log the error
    const payload = {
        ...apiError,
        method: req.method,
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
        stack: err instanceof Error ? err.stack : undefined,
    };

    // eslint-disable-next-line no-console
    console.error("[server:error]", payload);

    if (res.headersSent) {
        return;
    }

    res.status(statusCode).json(apiError);
}
