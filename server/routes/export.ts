import express from "express";
import multer from "multer";
import type { UnifiedDatabase } from "../database";
import type { AppConfig } from "../config";
import { exportProject } from "../utils/projectExport";
import { importProject } from "../utils/projectImport";

// Configure multer for in-memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
});

export const createExportRouter = (
  db: UnifiedDatabase,
  config: AppConfig
): express.Router => {
  const router = express.Router();

  /**
   * GET /projects/:projectId/export
   * Export a project as a ZIP file
   */
  router.get("/projects/:projectId/export", async (req, res, next) => {
    try {
      const { projectId } = req.params;

      if (!projectId) {
        res.status(400).json({ error: "Project ID is required" });
        return;
      }

      // Get project name for filename
      const projectRow = await db.queryOne<{ name: string }>(
        "SELECT name FROM projects WHERE id = ?",
        [projectId]
      );

      if (!projectRow) {
        res.status(404).json({ error: "Project not found" });
        return;
      }

      const sanitizedName = projectRow.name
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `${sanitizedName}_${timestamp}.zip`;

      // Create archive
      const archive = await exportProject(db, config, projectId);

      // Set response headers
      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      // Handle archive errors
      archive.on("error", (err) => {
        console.error("Archive error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to create archive" });
        }
      });

      // Pipe archive to response
      archive.pipe(res);
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /projects/import
   * Import a project from a ZIP file
   */
  router.post(
    "/projects/import",
    upload.single("file"),
    async (req, res, next) => {
      try {
        if (!req.file) {
          res.status(400).json({ error: "No file uploaded" });
          return;
        }

        if (
          !req.file.mimetype.includes("zip") &&
          !req.file.mimetype.includes("octet-stream")
        ) {
          res.status(400).json({ error: "File must be a ZIP archive" });
          return;
        }

        // Import project
        const result = await importProject(db, config, req.file.buffer);

        res.status(201).json({
          success: true,
          project: {
            id: result.projectId,
            name: result.projectName,
          },
          summary: {
            scenes: result.sceneCount,
            assets: result.assetCount,
            chatMessages: result.chatMessageCount,
          },
        });
      } catch (error) {
        if (error instanceof Error) {
          if (
            error.message.includes("Invalid project archive") ||
            error.message.includes("Unsupported manifest version")
          ) {
            res.status(400).json({ error: error.message });
            return;
          }
        }
        next(error);
      }
    }
  );

  return router;
};
