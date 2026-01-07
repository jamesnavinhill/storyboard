import path from "node:path";
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
    res.json({ status: "ok", timestamp: new Date().toISOString() });
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use(
    (
      err: unknown,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      const payload = {
        error:
          err instanceof Error
            ? { message: err.message, stack: err.stack }
            : { message: String(err) },
        method: req.method,
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
      };
      // eslint-disable-next-line no-console
      console.error("[server:error]", payload);
      if (res.headersSent) {
        return next(err);
      }
      res.status(500).json({ error: "Internal server error" });
    }
  );

  return app;
};

export type AppInstance = ReturnType<typeof createApp>;
