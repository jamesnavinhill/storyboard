import type { StateCreator } from "zustand";
import type { StyleTemplate } from "../../../types/gemini-enhancement";

// Template slice state interface
export interface TemplateSlice {
  templates: StyleTemplate[];
  isTemplatesLoading: boolean;
  templatesCache: Map<string, StyleTemplate>;
  lastTemplatesFetch: number | null;
  activeTemplatePerProject: Map<string, string>; // projectId -> templateId

  // Template CRUD operations
  fetchTemplates: (force?: boolean) => Promise<void>;
  createTemplate: (
    template: Omit<StyleTemplate, "id">
  ) => Promise<StyleTemplate>;
  updateTemplate: (
    id: string,
    updates: Partial<Omit<StyleTemplate, "id">>
  ) => Promise<StyleTemplate>;
  deleteTemplate: (id: string) => Promise<void>;
  getTemplateById: (id: string) => StyleTemplate | undefined;

  // Active template management
  setActiveTemplate: (projectId: string, templateId: string) => void;
  getActiveTemplate: (projectId: string) => string | undefined;
  clearActiveTemplate: (projectId: string) => void;

  // Cache management
  clearTemplatesCache: () => void;
}

// Cache duration: 5 minutes
const CACHE_DURATION_MS = 5 * 60 * 1000;

export const createTemplateSlice: StateCreator<
  TemplateSlice,
  [],
  [],
  TemplateSlice
> = (set, get) => ({
  templates: [],
  isTemplatesLoading: false,
  templatesCache: new Map(),
  lastTemplatesFetch: null,
  activeTemplatePerProject: new Map(),

  fetchTemplates: async (force = false) => {
    const state = get();
    const now = Date.now();

    // Use cache if available and not expired
    if (
      !force &&
      state.lastTemplatesFetch &&
      now - state.lastTemplatesFetch < CACHE_DURATION_MS &&
      state.templates.length > 0
    ) {
      return;
    }

    set({ isTemplatesLoading: true });
    try {
      const response = await fetch("/api/templates");
      if (!response.ok) {
        throw new Error(`Failed to fetch templates: ${response.statusText}`);
      }
      const data = await response.json();
      const templates: StyleTemplate[] = data.templates || [];

      // Update cache
      const cache = new Map<string, StyleTemplate>();
      templates.forEach((template) => cache.set(template.id, template));

      set({
        templates,
        templatesCache: cache,
        lastTemplatesFetch: now,
        isTemplatesLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch templates:", error);
      set({ isTemplatesLoading: false });
      throw error;
    }
  },

  createTemplate: async (template) => {
    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
      });

      if (!response.ok) {
        throw new Error(`Failed to create template: ${response.statusText}`);
      }

      const data = await response.json();
      const newTemplate: StyleTemplate = data.template;

      set((state) => ({
        templates: [newTemplate, ...state.templates],
        templatesCache: new Map(state.templatesCache).set(
          newTemplate.id,
          newTemplate
        ),
      }));

      return newTemplate;
    } catch (error) {
      console.error("Failed to create template:", error);
      throw error;
    }
  },

  updateTemplate: async (id, updates) => {
    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update template: ${response.statusText}`);
      }

      const data = await response.json();
      const updatedTemplate: StyleTemplate = data.template;

      set((state) => ({
        templates: state.templates.map((t) =>
          t.id === id ? updatedTemplate : t
        ),
        templatesCache: new Map(state.templatesCache).set(id, updatedTemplate),
      }));

      return updatedTemplate;
    } catch (error) {
      console.error("Failed to update template:", error);
      throw error;
    }
  },

  deleteTemplate: async (id) => {
    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete template: ${response.statusText}`);
      }

      set((state) => {
        const newCache = new Map(state.templatesCache);
        newCache.delete(id);

        // Clear active template if it was deleted
        const newActiveTemplates = new Map(state.activeTemplatePerProject);
        for (const [projectId, templateId] of newActiveTemplates.entries()) {
          if (templateId === id) {
            newActiveTemplates.delete(projectId);
          }
        }

        return {
          templates: state.templates.filter((t) => t.id !== id),
          templatesCache: newCache,
          activeTemplatePerProject: newActiveTemplates,
        };
      });
    } catch (error) {
      console.error("Failed to delete template:", error);
      throw error;
    }
  },

  getTemplateById: (id) => {
    const state = get();
    return (
      state.templatesCache.get(id) || state.templates.find((t) => t.id === id)
    );
  },

  setActiveTemplate: (projectId, templateId) => {
    set((state) => {
      const newActiveTemplates = new Map(state.activeTemplatePerProject);
      newActiveTemplates.set(projectId, templateId);
      return { activeTemplatePerProject: newActiveTemplates };
    });
  },

  getActiveTemplate: (projectId) => {
    const state = get();
    return state.activeTemplatePerProject.get(projectId);
  },

  clearActiveTemplate: (projectId) => {
    set((state) => {
      const newActiveTemplates = new Map(state.activeTemplatePerProject);
      newActiveTemplates.delete(projectId);
      return { activeTemplatePerProject: newActiveTemplates };
    });
  },

  clearTemplatesCache: () => {
    set({
      templatesCache: new Map(),
      lastTemplatesFetch: null,
    });
  },
});
