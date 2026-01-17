import { createHash, randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import pino, { stdTimeFunctions, type Logger } from "pino";
import { ZodError } from "zod";
import type { AppConfig } from "../config";

export interface AiTelemetryPayload {
  requestId: string;
  endpoint: string;
  status: number;
  latencyMs: number;
  geminiModel?: string;
  projectId?: string;
  retryable?: boolean;
  errorCode?: string;
  promptHash?: string;
  entryPoint?: string;
}

export interface AiTelemetryLogger {
  info(payload: AiTelemetryPayload): void;
  error(payload: AiTelemetryPayload): void;
}

const noopLogger: AiTelemetryLogger = {
  info: () => undefined,
  error: () => undefined,
};

export const createAiTelemetryLogger = (
  config: AppConfig
): AiTelemetryLogger => {
  if (!config.enableAiTelemetry) {
    return noopLogger;
  }

  const logger: Logger = pino({
    level: process.env.AI_TELEMETRY_LEVEL ?? "info",
    base: undefined,
    name: "ai-telemetry",
    timestamp: stdTimeFunctions.isoTime,
  });

  const emit = (level: "info" | "error", payload: AiTelemetryPayload) => {
    logger[level]({ eventType: "ai-request", ...payload });
  };

  return {
    info: (payload) => emit("info", payload),
    error: (payload) => emit("error", payload),
  };
};

interface ContextMeta {
  geminiModel?: string;
  projectId?: string;
  prompt?: string;
  entryPoint?: string;
}

export type UpdateContextMeta = (meta: Partial<ContextMeta>) => void;

export interface WithRequestContextOptions<T> {
  req: Request;
  res: Response;
  endpoint: string;
  telemetry: AiTelemetryLogger;
  handler: (updateMeta: UpdateContextMeta) => Promise<T>;
  metricsHook?: (payload: AiTelemetryPayload) => void;
}

export interface ApiRouteError extends Error {
  statusCode?: number;
  retryable?: boolean;
  errorCode?: string;
  requestId?: string;
  promptHash?: string;
  entryPoint?: string;
}

const hashPrompt = (value: string): string =>
  createHash("sha256").update(value).digest("hex").slice(0, 16);

const nowMs = () => Number(process.hrtime.bigint() / BigInt(1_000_000));

export const withRequestContext = async <T>(
  options: WithRequestContextOptions<T>
): Promise<T> => {
  const { req, res, endpoint, telemetry, handler, metricsHook } = options;
  const requestId = randomUUID();
  const start = nowMs();
  res.setHeader("x-request-id", requestId);
  res.locals.requestId = requestId;

  const meta: ContextMeta = {};
  const updateMeta: UpdateContextMeta = (partial) => {
    Object.assign(meta, partial);
  };

  try {
    const result = await handler(updateMeta);
    const latencyMs = Math.max(0, nowMs() - start);
    const payload: AiTelemetryPayload = {
      requestId,
      endpoint,
      status: res.statusCode || 200,
      latencyMs,
      geminiModel: meta.geminiModel,
      projectId: meta.projectId,
      entryPoint: meta.entryPoint,
    };
    telemetry.info(payload);
    metricsHook?.(payload);
    return result;
  } catch (unknownError) {
    const error = unknownError as ApiRouteError;
    const latencyMs = Math.max(0, nowMs() - start);

    let status = error.statusCode;
    if (!status) {
      status = unknownError instanceof ZodError ? 400 : 500;
    }

    const retryable =
      typeof error.retryable === "boolean" ? error.retryable : status >= 500;

    const errorCode =
      error.errorCode ??
      (unknownError instanceof ZodError ? "VALIDATION_FAILED" : undefined);

    const promptHashValue = meta.prompt ? hashPrompt(meta.prompt) : undefined;

    const payload: AiTelemetryPayload = {
      requestId,
      endpoint,
      status,
      latencyMs,
      geminiModel: meta.geminiModel,
      projectId: meta.projectId,
      retryable,
      errorCode,
      promptHash: promptHashValue,
      entryPoint: meta.entryPoint,
    };

    telemetry.error(payload);
    metricsHook?.(payload);

    res.statusCode = status;

    error.statusCode = status;
    error.retryable = retryable;
    error.errorCode = errorCode;
    error.requestId = requestId;
    error.promptHash = promptHashValue;
    error.entryPoint = meta.entryPoint;

    throw unknownError;
  }
};

export const extractEndpoint = (req: Request): string =>
  `${req.baseUrl ?? ""}${req.path ?? ""}`;
