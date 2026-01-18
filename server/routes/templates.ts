import { Router, type Request, type Response } from "express";
import { ZodError } from "zod";
import type { UnifiedDatabase } from "../database";
import {
  createStyleTemplateSchema,
  updateStyleTemplateSchema,
} from "../validation";
import * as templateStore from "../stores/templateStore";

export const createTemplatesRouter = (db: UnifiedDatabase) => {
  const router = Router();

  // GET /api/templates - List all style templates with optional filters
  router.get("/", async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string | undefined;
      const search = req.query.search as string | undefined;

      const templates = await templateStore.listStyleTemplates(db, { category, search });
      res.json({ templates });
    } catch (error) {
      console.error("[templates:list:error]", error);
      res.status(500).json({
        error: "Failed to list style templates",
        retryable: true,
      });
    }
  });

  // POST /api/templates - Create a new style template
  router.post("/", async (req: Request, res: Response) => {
    try {
      const data = createStyleTemplateSchema.parse(req.body);
      const template = await templateStore.createStyleTemplate(db, data);
      res.status(201).json({ template });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: "Invalid request payload",
          details: error.flatten(),
          retryable: false,
        });
        return;
      }
      console.error("[templates:create:error]", error);
      res.status(500).json({
        error: "Failed to create style template",
        retryable: true,
      });
    }
  });

  // GET /api/templates/:id - Get a specific style template
  router.get("/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const template = await templateStore.getStyleTemplateById(db, id);

      if (!template) {
        res.status(404).json({
          error: "Style template not found",
          retryable: false,
        });
        return;
      }

      res.json({ template });
    } catch (error) {
      console.error("[templates:get:error]", error);
      res.status(500).json({
        error: "Failed to get style template",
        retryable: true,
      });
    }
  });

  // PUT /api/templates/:id - Update a style template
  router.put("/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = updateStyleTemplateSchema.parse(req.body);
      const template = await templateStore.updateStyleTemplate(db, id, data);

      if (!template) {
        res.status(404).json({
          error: "Style template not found",
          retryable: false,
        });
        return;
      }

      res.json({ template });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: "Invalid request payload",
          details: error.flatten(),
          retryable: false,
        });
        return;
      }
      console.error("[templates:update:error]", error);
      res.status(500).json({
        error: "Failed to update style template",
        retryable: true,
      });
    }
  });

  // DELETE /api/templates/:id - Delete a style template
  router.delete("/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await templateStore.deleteStyleTemplate(db, id);

      if (!deleted) {
        res.status(404).json({
          error: "Style template not found",
          retryable: false,
        });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      console.error("[templates:delete:error]", error);
      res.status(500).json({
        error: "Failed to delete style template",
        retryable: true,
      });
    }
  });

  return router;
};
