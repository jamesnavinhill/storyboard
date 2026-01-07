import path from "node:path";
import { config as loadEnv } from "dotenv";

// Load .env.local first, then fall back to .env
loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadEnv(); // Also load .env for any missing variables

export interface AppConfig {
  port: number;
  dbPath: string;
  dataDir: string;
  corsOrigin?: string;
  enableAiTelemetry: boolean;
  aiRateLimitWindowMs: number;
  aiRateLimitMaxRequests: number;
  maxFileSizeMb: number;
  filesApiEnabled: boolean;
  enableThinkingMode: boolean;
  enableContextCaching: boolean;
  defaultVideoModel: string;
  enableStreaming: boolean;
}

const defaultDataDir = path.resolve(process.cwd(), "data");

export const getConfig = (): AppConfig => {
  const port = Number(process.env.PORT ?? 4000);
  const dbPath = process.env.DB_PATH
    ? path.resolve(process.cwd(), process.env.DB_PATH)
    : path.join(defaultDataDir, "storyboard.db");
  const dataDir = process.env.DATA_DIR
    ? path.resolve(process.cwd(), process.env.DATA_DIR)
    : defaultDataDir;
  const enableAiTelemetry = process.env.ENABLE_AI_TELEMETRY === "true";
  const aiRateLimitWindowMs = Number(
    process.env.AI_RATE_LIMIT_WINDOW_MS ?? 60_000
  );
  const aiRateLimitMaxRequests = Number(
    process.env.AI_RATE_LIMIT_MAX_REQUESTS ?? 30
  );
  const maxFileSizeMb = Number(process.env.MAX_FILE_SIZE_MB ?? 100);
  const filesApiEnabled = process.env.FILES_API_ENABLED !== "false";
  const enableThinkingMode = process.env.ENABLE_THINKING_MODE === "true";
  const enableContextCaching = process.env.ENABLE_CONTEXT_CACHING !== "false";
  const defaultVideoModel =
    process.env.DEFAULT_VIDEO_MODEL ?? "veo-3.1-generate-001";
  const enableStreaming = process.env.ENABLE_STREAMING !== "false";

  return {
    port,
    dbPath,
    dataDir,
    corsOrigin: process.env.CORS_ORIGIN,
    enableAiTelemetry,
    aiRateLimitWindowMs:
      Number.isFinite(aiRateLimitWindowMs) && aiRateLimitWindowMs > 0
        ? aiRateLimitWindowMs
        : 60_000,
    aiRateLimitMaxRequests:
      Number.isFinite(aiRateLimitMaxRequests) && aiRateLimitMaxRequests > 0
        ? Math.floor(aiRateLimitMaxRequests)
        : 30,
    maxFileSizeMb:
      Number.isFinite(maxFileSizeMb) && maxFileSizeMb > 0 ? maxFileSizeMb : 100,
    filesApiEnabled,
    enableThinkingMode,
    enableContextCaching,
    defaultVideoModel,
    enableStreaming,
  };
};
