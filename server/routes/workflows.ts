import { Router, type Request, type Response } from "express";
import { ZodError } from "zod";
import type { Database as SqliteDatabase } from "better-sqlite3";
import {
  createWorkflowSchema,
  updateWorkflowSchema,
  createWorkflowSubtypeSchema,
  updateWorkflowSubtypeSchema,
} from "../validation";
import * as workflowStore from "../stores/workflowStore";

export const createWorkflowsRouter = (db: SqliteDatabase) => {
  const router = Router();

  // GET /api/workflows - List all workflows with optional filters
  router.get("/", (req: Request, res: Response) => {
    try {
      const category = req.query.category as string | undefined;
      const search = req.query.search as string | undefined;

      const workflows = workflowStore.listWorkflows(db, { category, search });
      res.json({ workflows });
    } catch (error) {
      console.error("[workflows:list:error]", error);
      res.status(500).json({
        error: "Failed to list workflows",
        retryable: true,
      });
    }
  });

  // POST /api/workflows - Create a new workflow
  router.post("/", (req: Request, res: Response) => {
    try {
      const data = createWorkflowSchema.parse(req.body);
      const workflow = workflowStore.createWorkflow(db, data);
      res.status(201).json({ workflow });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: "Invalid request payload",
          details: error.flatten(),
          retryable: false,
        });
        return;
      }
      console.error("[workflows:create:error]", error);
      res.status(500).json({
        error: "Failed to create workflow",
        retryable: true,
      });
    }
  });

  // GET /api/workflows/:id - Get a specific workflow
  router.get("/:id", (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const workflow = workflowStore.getWorkflowById(db, id);

      if (!workflow) {
        res.status(404).json({
          error: "Workflow not found",
          retryable: false,
        });
        return;
      }

      res.json({ workflow });
    } catch (error) {
      console.error("[workflows:get:error]", error);
      res.status(500).json({
        error: "Failed to get workflow",
        retryable: true,
      });
    }
  });

  // PUT /api/workflows/:id - Update a workflow
  router.put("/:id", (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = updateWorkflowSchema.parse(req.body);
      const workflow = workflowStore.updateWorkflow(db, id, data);

      if (!workflow) {
        res.status(404).json({
          error: "Workflow not found",
          retryable: false,
        });
        return;
      }

      res.json({ workflow });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: "Invalid request payload",
          details: error.flatten(),
          retryable: false,
        });
        return;
      }
      console.error("[workflows:update:error]", error);
      res.status(500).json({
        error: "Failed to update workflow",
        retryable: true,
      });
    }
  });

  // DELETE /api/workflows/:id - Delete a workflow (cascade deletes subtypes)
  router.delete("/:id", (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = workflowStore.deleteWorkflow(db, id);

      if (!deleted) {
        res.status(404).json({
          error: "Workflow not found",
          retryable: false,
        });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      console.error("[workflows:delete:error]", error);
      res.status(500).json({
        error: "Failed to delete workflow",
        retryable: true,
      });
    }
  });

  // GET /api/workflows/:id/subtypes - List subtypes for a workflow
  router.get("/:id/subtypes", (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Verify workflow exists
      const workflow = workflowStore.getWorkflowById(db, id);
      if (!workflow) {
        res.status(404).json({
          error: "Workflow not found",
          retryable: false,
        });
        return;
      }

      const subtypes = workflowStore.listWorkflowSubtypes(db, id);
      res.json({ subtypes });
    } catch (error) {
      console.error("[workflows:subtypes:list:error]", error);
      res.status(500).json({
        error: "Failed to list workflow subtypes",
        retryable: true,
      });
    }
  });

  // POST /api/workflows/:id/subtypes - Create a new subtype
  router.post("/:id/subtypes", (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Verify workflow exists
      const workflow = workflowStore.getWorkflowById(db, id);
      if (!workflow) {
        res.status(404).json({
          error: "Workflow not found",
          retryable: false,
        });
        return;
      }

      const data = createWorkflowSubtypeSchema.parse(req.body);
      const subtype = workflowStore.createWorkflowSubtype(db, id, data);
      res.status(201).json({ subtype });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: "Invalid request payload",
          details: error.flatten(),
          retryable: false,
        });
        return;
      }
      console.error("[workflows:subtypes:create:error]", error);
      res.status(500).json({
        error: "Failed to create workflow subtype",
        retryable: true,
      });
    }
  });

  return router;
};

// Subtype routes (not nested under workflows)
export const createSubtypesRouter = (db: SqliteDatabase) => {
  const router = Router();

  // PUT /api/subtypes/:id - Update a subtype
  router.put("/:id", (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = updateWorkflowSubtypeSchema.parse(req.body);
      const subtype = workflowStore.updateWorkflowSubtype(db, id, data);

      if (!subtype) {
        res.status(404).json({
          error: "Workflow subtype not found",
          retryable: false,
        });
        return;
      }

      res.json({ subtype });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: "Invalid request payload",
          details: error.flatten(),
          retryable: false,
        });
        return;
      }
      console.error("[subtypes:update:error]", error);
      res.status(500).json({
        error: "Failed to update workflow subtype",
        retryable: true,
      });
    }
  });

  // DELETE /api/subtypes/:id - Delete a subtype
  router.delete("/:id", (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = workflowStore.deleteWorkflowSubtype(db, id);

      if (!deleted) {
        res.status(404).json({
          error: "Workflow subtype not found",
          retryable: false,
        });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      console.error("[subtypes:delete:error]", error);
      res.status(500).json({
        error: "Failed to delete workflow subtype",
        retryable: true,
      });
    }
  });

  return router;
};
