import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { Router, type Request, type Response } from "express";
import multer from "multer";
import { ZodError } from "zod";
import type { UnifiedDatabase } from "../database";
import type { AppConfig } from "../config";
import type { FilePurpose } from "../types";
import { uploadFileSchema, filePurposeSchema } from "../validation";
import {
  uploadFile,
  getFileById,
  deleteFile,
  updateFilePurpose,
} from "../services/fileUploadService";
import { getProjectById } from "../stores/projectStore";

export const createFilesRouter = (db: UnifiedDatabase, config: AppConfig) => {
  const router = Router();

  // Configure multer for disk storage with dynamic file size limit
  const upload = multer({
    dest: "uploads/",
    limits: {
      fileSize: config.maxFileSizeMb * 1024 * 1024,
    },
  });

  // POST /api/files/upload - Upload file with purpose
  router.post(
    "/upload",
    upload.single("file"),
    async (req: Request, res: Response) => {
      const requestId = randomUUID();
      res.setHeader("x-request-id", requestId);

      try {
        // Validate file exists
        if (!req.file) {
          return res.status(400).json({
            error: "No file provided",
            requestId,
            retryable: false,
            errorCode: "FILE_MISSING",
          });
        }

        // Validate request body
        const validationResult = uploadFileSchema.safeParse(req.body);
        if (!validationResult.success) {
          return res.status(400).json({
            error: "Invalid request payload",
            details: validationResult.error.flatten(),
            requestId,
            retryable: false,
            errorCode: "VALIDATION_FAILED",
          });
        }

        const { projectId, purpose } = validationResult.data;

        // Verify project exists
        const project = await getProjectById(db, projectId);
        if (!project) {
          return res.status(404).json({
            error: "Project not found",
            requestId,
            retryable: false,
            errorCode: "PROJECT_NOT_FOUND",
          });
        }

        // Upload file
        const uploadedFile = await uploadFile({
          db,
          config,
          projectId,
          purpose: purpose as FilePurpose,
          file: req.file,
        });

        // Clean up temporary file after successful upload
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.warn("[files:upload:cleanup-warning]", cleanupError);
          // Don't fail the request if cleanup fails
        }

        res.status(201).json({
          file: uploadedFile,
          requestId,
        });
      } catch (error) {
        console.error("[files:upload:error]", error);

        // Clean up temporary file on error
        if (req.file?.path) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (cleanupError) {
            console.warn("[files:upload:cleanup-error]", cleanupError);
          }
        }

        const status = error instanceof ZodError ? 400 : 500;
        const retryable = status >= 500;

        res.status(status).json({
          error:
            error instanceof Error ? error.message : "Failed to upload file",
          requestId,
          retryable,
          errorCode: "UPLOAD_FAILED",
        });
      }
    }
  );

  // GET /api/files/:id - Get file details
  router.get("/:id", async (req: Request, res: Response) => {
    const requestId = randomUUID();
    res.setHeader("x-request-id", requestId);

    try {
      const { id } = req.params;

      const file = await getFileById(db, id);
      if (!file) {
        return res.status(404).json({
          error: "File not found",
          requestId,
          retryable: false,
          errorCode: "FILE_NOT_FOUND",
        });
      }

      // Verify project ownership - ensure project exists
      const project = await getProjectById(db, file.projectId);
      if (!project) {
        return res.status(404).json({
          error: "Project not found",
          requestId,
          retryable: false,
          errorCode: "PROJECT_NOT_FOUND",
        });
      }

      res.json({
        file,
        requestId,
      });
    } catch (error) {
      console.error("[files:get:error]", error);

      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to retrieve file",
        requestId,
        retryable: true,
      });
    }
  });

  // PUT /api/files/:id - Update file purpose
  router.put("/:id", async (req: Request, res: Response) => {
    const requestId = randomUUID();
    res.setHeader("x-request-id", requestId);

    try {
      const { id } = req.params;

      // Validate request body
      const bodyValidation = filePurposeSchema.safeParse(req.body.purpose);
      if (!bodyValidation.success) {
        return res.status(400).json({
          error: "Invalid file purpose",
          details: bodyValidation.error.flatten(),
          requestId,
          retryable: false,
          errorCode: "VALIDATION_FAILED",
        });
      }

      const purpose = bodyValidation.data;

      // Get file to verify it exists and get project ID
      const file = await getFileById(db, id);
      if (!file) {
        return res.status(404).json({
          error: "File not found",
          requestId,
          retryable: false,
          errorCode: "FILE_NOT_FOUND",
        });
      }

      // Verify project exists
      const project = await getProjectById(db, file.projectId);
      if (!project) {
        return res.status(404).json({
          error: "Project not found",
          requestId,
          retryable: false,
          errorCode: "PROJECT_NOT_FOUND",
        });
      }

      // Update file purpose
      const updatedFile = await updateFilePurpose(db, id, file.projectId, purpose);

      res.json({
        file: updatedFile,
        requestId,
      });
    } catch (error) {
      console.error("[files:update:error]", error);

      const status =
        error instanceof Error && "statusCode" in error
          ? (error as any).statusCode
          : 500;
      const retryable = status >= 500;

      res.status(status).json({
        error: error instanceof Error ? error.message : "Failed to update file",
        requestId,
        retryable,
        errorCode: "UPDATE_FAILED",
      });
    }
  });

  // DELETE /api/files/:id - Delete file
  router.delete("/:id", async (req: Request, res: Response) => {
    const requestId = randomUUID();
    res.setHeader("x-request-id", requestId);

    try {
      const { id } = req.params;

      const file = await getFileById(db, id);
      if (!file) {
        return res.status(404).json({
          error: "File not found",
          requestId,
          retryable: false,
          errorCode: "FILE_NOT_FOUND",
        });
      }

      // Verify project ownership - ensure project exists
      const project = await getProjectById(db, file.projectId);
      if (!project) {
        return res.status(404).json({
          error: "Project not found",
          requestId,
          retryable: false,
          errorCode: "PROJECT_NOT_FOUND",
        });
      }

      await deleteFile(db, id, file.projectId);

      res.json({
        success: true,
        requestId,
      });
    } catch (error) {
      console.error("[files:delete:error]", error);

      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to delete file",
        requestId,
        retryable: true,
      });
    }
  });

  return router;
};
