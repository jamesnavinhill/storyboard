import path from "node:path";
import fs from "node:fs";
import express from "express";
import cors from "cors";
import type { Database as SqliteDatabase } from "better-sqlite3";
import type { AppConfig } from "./config";
import { createProjectsRouter } from "./routes/projects";
import { createAssetsRouter } from "./routes/assets";
import { createAiRouter } from "./routes/ai";
import { createExportRouter } from "./routes/export";
import { createFilesRouter } from "./routes/files";
import {
  createWorkflowsRouter,
  createSubtypesRouter,
} from "./routes/workflows";
import { createTemplatesRouter } from "./routes/templates";
import { errorHandler } from "./utils/errors";

export const createApp = (db: SqliteDatabase, config: AppConfig) => {
  const app = express();

  app.use(
    cors({
      origin: config.corsOrigin ?? true,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: false }));

  const assetsDir = path.join(config.dataDir, "assets");
  app.use("/api/assets/files", express.static(assetsDir));
  app.use("/api/projects", createProjectsRouter(db, config));
  app.use("/api/assets", createAssetsRouter(db, config));
  app.use("/api/ai", createAiRouter(db, config));
  app.use("/api/files", createFilesRouter(db, config));
  app.use("/api/workflows", createWorkflowsRouter(db));
  app.use("/api/subtypes", createSubtypesRouter(db));
  app.use("/api/templates", createTemplatesRouter(db));
  app.use("/api", createExportRouter(db, config));

  app.get("/api/health", (_req, res) => {
    const health: {
      status: "ok" | "degraded";
      timestamp: string;
      database: "connected" | "disconnected";
      diskSpace: "adequate" | "low" | "unknown";
    } = {
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      diskSpace: "unknown",
    };

    // Check database connectivity
    try {
      db.prepare("SELECT 1").get();
      health.database = "connected";
    } catch {
      health.database = "disconnected";
      health.status = "degraded";
    }

    // Check disk space (basic check - verify data dir is writable)
    try {
      const testFile = path.join(config.dataDir, ".health-check");
      fs.writeFileSync(testFile, "test", { flag: "w" });
      fs.unlinkSync(testFile);
      health.diskSpace = "adequate";
    } catch {
      health.diskSpace = "low";
      health.status = "degraded";
    }

    res.json(health);
  });

  // --- Static frontend (production) ---
  // Serve Vite build output from /dist with proper cache headers
  const distDir = path.resolve(process.cwd(), "dist");
  app.use(
    express.static(distDir, {
      setHeaders(res, filePath) {
        // Long-cache immutable assets
        if (
          filePath.includes(`${path.sep}assets${path.sep}`) ||
          /\.(?:js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp)$/i.test(
            filePath
          )
        ) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
        // HTML should not be cached so it can pick up new chunk names
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    })
  );

  // SPA fallback: send index.html for non-API routes
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(path.join(distDir, "index.html"));
  });

  // Standardized error handling middleware
  app.use(errorHandler);

  return app;
};

export type AppInstance = ReturnType<typeof createApp>;
