import type { StateCreator } from "zustand";
import type {
  Workflow,
  WorkflowSubtype,
} from "../../../types/gemini-enhancement";

// Workflow slice state interface
export interface WorkflowSlice {
  workflows: Workflow[];
  isWorkflowsLoading: boolean;
  workflowsCache: Map<string, Workflow>;
  lastWorkflowsFetch: number | null;

  // Workflow CRUD operations
  fetchWorkflows: (force?: boolean) => Promise<void>;
  createWorkflow: (
    workflow: Omit<Workflow, "id" | "subtypes">
  ) => Promise<Workflow>;
  updateWorkflow: (
    id: string,
    updates: Partial<Omit<Workflow, "id" | "subtypes">>
  ) => Promise<Workflow>;
  deleteWorkflow: (id: string) => Promise<void>;
  getWorkflowById: (id: string) => Workflow | undefined;

  // Subtype management
  fetchSubtypes: (workflowId: string) => Promise<WorkflowSubtype[]>;
  createSubtype: (
    workflowId: string,
    subtype: Omit<WorkflowSubtype, "id" | "workflowId">
  ) => Promise<WorkflowSubtype>;
  updateSubtype: (
    id: string,
    updates: Partial<Omit<WorkflowSubtype, "id" | "workflowId">>
  ) => Promise<WorkflowSubtype>;
  deleteSubtype: (id: string) => Promise<void>;

  // Cache management
  clearWorkflowsCache: () => void;
}

// Cache duration: 5 minutes
const CACHE_DURATION_MS = 5 * 60 * 1000;

export const createWorkflowSlice: StateCreator<
  WorkflowSlice,
  [],
  [],
  WorkflowSlice
> = (set, get) => ({
  workflows: [],
  isWorkflowsLoading: false,
  workflowsCache: new Map(),
  lastWorkflowsFetch: null,

  fetchWorkflows: async (force = false) => {
    const state = get();
    const now = Date.now();

    // Use cache if available and not expired
    if (
      !force &&
      state.lastWorkflowsFetch &&
      now - state.lastWorkflowsFetch < CACHE_DURATION_MS &&
      state.workflows.length > 0
    ) {
      return;
    }

    set({ isWorkflowsLoading: true });
    try {
      const response = await fetch("/api/workflows");
      if (!response.ok) {
        throw new Error(`Failed to fetch workflows: ${response.statusText}`);
      }
      const data = await response.json();
      const workflows: Workflow[] = data.workflows || [];

      // Update cache
      const cache = new Map<string, Workflow>();
      workflows.forEach((workflow) => cache.set(workflow.id, workflow));

      set({
        workflows,
        workflowsCache: cache,
        lastWorkflowsFetch: now,
        isWorkflowsLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch workflows:", error);
      set({ isWorkflowsLoading: false });
      throw error;
    }
  },

  createWorkflow: async (workflow) => {
    try {
      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workflow),
      });

      if (!response.ok) {
        throw new Error(`Failed to create workflow: ${response.statusText}`);
      }

      const data = await response.json();
      const newWorkflow: Workflow = data.workflow;

      set((state) => ({
        workflows: [newWorkflow, ...state.workflows],
        workflowsCache: new Map(state.workflowsCache).set(
          newWorkflow.id,
          newWorkflow
        ),
      }));

      return newWorkflow;
    } catch (error) {
      console.error("Failed to create workflow:", error);
      throw error;
    }
  },

  updateWorkflow: async (id, updates) => {
    try {
      const response = await fetch(`/api/workflows/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update workflow: ${response.statusText}`);
      }

      const data = await response.json();
      const updatedWorkflow: Workflow = data.workflow;

      set((state) => ({
        workflows: state.workflows.map((w) =>
          w.id === id ? updatedWorkflow : w
        ),
        workflowsCache: new Map(state.workflowsCache).set(id, updatedWorkflow),
      }));

      return updatedWorkflow;
    } catch (error) {
      console.error("Failed to update workflow:", error);
      throw error;
    }
  },

  deleteWorkflow: async (id) => {
    try {
      const response = await fetch(`/api/workflows/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete workflow: ${response.statusText}`);
      }

      set((state) => {
        const newCache = new Map(state.workflowsCache);
        newCache.delete(id);
        return {
          workflows: state.workflows.filter((w) => w.id !== id),
          workflowsCache: newCache,
        };
      });
    } catch (error) {
      console.error("Failed to delete workflow:", error);
      throw error;
    }
  },

  getWorkflowById: (id) => {
    const state = get();
    return (
      state.workflowsCache.get(id) || state.workflows.find((w) => w.id === id)
    );
  },

  fetchSubtypes: async (workflowId) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/subtypes`);
      if (!response.ok) {
        throw new Error(`Failed to fetch subtypes: ${response.statusText}`);
      }
      const data = await response.json();
      return data.subtypes || [];
    } catch (error) {
      console.error("Failed to fetch subtypes:", error);
      throw error;
    }
  },

  createSubtype: async (workflowId, subtype) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/subtypes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subtype),
      });

      if (!response.ok) {
        throw new Error(`Failed to create subtype: ${response.statusText}`);
      }

      const data = await response.json();
      const newSubtype: WorkflowSubtype = data.subtype;

      // Update the workflow in state to include the new subtype
      set((state) => ({
        workflows: state.workflows.map((w) =>
          w.id === workflowId
            ? { ...w, subtypes: [...w.subtypes, newSubtype] }
            : w
        ),
      }));

      // Refresh cache for this workflow
      await get().fetchWorkflows(true);

      return newSubtype;
    } catch (error) {
      console.error("Failed to create subtype:", error);
      throw error;
    }
  },

  updateSubtype: async (id, updates) => {
    try {
      const response = await fetch(`/api/subtypes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update subtype: ${response.statusText}`);
      }

      const data = await response.json();
      const updatedSubtype: WorkflowSubtype = data.subtype;

      // Update the workflow in state
      set((state) => ({
        workflows: state.workflows.map((w) =>
          w.id === updatedSubtype.workflowId
            ? {
                ...w,
                subtypes: w.subtypes.map((s) =>
                  s.id === id ? updatedSubtype : s
                ),
              }
            : w
        ),
      }));

      return updatedSubtype;
    } catch (error) {
      console.error("Failed to update subtype:", error);
      throw error;
    }
  },

  deleteSubtype: async (id) => {
    try {
      const response = await fetch(`/api/subtypes/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete subtype: ${response.statusText}`);
      }

      // Remove subtype from all workflows
      set((state) => ({
        workflows: state.workflows.map((w) => ({
          ...w,
          subtypes: w.subtypes.filter((s) => s.id !== id),
        })),
      }));
    } catch (error) {
      console.error("Failed to delete subtype:", error);
      throw error;
    }
  },

  clearWorkflowsCache: () => {
    set({
      workflowsCache: new Map(),
      lastWorkflowsFetch: null,
    });
  },
});
