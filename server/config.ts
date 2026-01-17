import path from "node:path";
import { config as loadEnv } from "dotenv";
import { z } from "zod";

// Load .env.local first, then fall back to .env
loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadEnv(); // Also load .env for any missing variables

// Zod schema for environment variable validation
const EnvSchema = z.object({
  PORT: z.coerce.number().min(1).max(65535).optional(),
  DB_PATH: z.string().optional(),
  DATA_DIR: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
  ENABLE_AI_TELEMETRY: z.enum(["true", "false"]).optional(),
  AI_RATE_LIMIT_WINDOW_MS: z.coerce.number().min(1000).optional(),
  AI_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().min(1).optional(),
  MAX_FILE_SIZE_MB: z.coerce.number().min(1).optional(),
  FILES_API_ENABLED: z.enum(["true", "false"]).optional(),
  ENABLE_THINKING_MODE: z.enum(["true", "false"]).optional(),
  ENABLE_CONTEXT_CACHING: z.enum(["true", "false"]).optional(),
  DEFAULT_VIDEO_MODEL: z.string().optional(),
  ENABLE_STREAMING: z.enum(["true", "false"]).optional(),
});

// Validate environment variables at startup
const envResult = EnvSchema.safeParse(process.env);
if (!envResult.success) {
  console.error("❌ Environment Configuration Error:");
  console.error(envResult.error.format());
  process.exit(1);
}

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
  const env = envResult.data;

  const port = env.PORT ?? 4000;
  const dbPath = env.DB_PATH
    ? path.resolve(process.cwd(), env.DB_PATH)
    : path.join(defaultDataDir, "storyboard.db");
  const dataDir = env.DATA_DIR
    ? path.resolve(process.cwd(), env.DATA_DIR)
    : defaultDataDir;
  const enableAiTelemetry = env.ENABLE_AI_TELEMETRY === "true";
  const aiRateLimitWindowMs = env.AI_RATE_LIMIT_WINDOW_MS ?? 60_000;
  const aiRateLimitMaxRequests = env.AI_RATE_LIMIT_MAX_REQUESTS ?? 30;
  const maxFileSizeMb = env.MAX_FILE_SIZE_MB ?? 100;
  const filesApiEnabled = env.FILES_API_ENABLED !== "false";
  const enableThinkingMode = env.ENABLE_THINKING_MODE === "true";
  const enableContextCaching = env.ENABLE_CONTEXT_CACHING !== "false";
  const defaultVideoModel = env.DEFAULT_VIDEO_MODEL ?? "veo-3.1-generate-001";
  const enableStreaming = env.ENABLE_STREAMING !== "false";

  return {
    port,
    dbPath,
    dataDir,
    corsOrigin: env.CORS_ORIGIN,
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
