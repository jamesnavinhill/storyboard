import type { StateCreator } from "zustand";
import type {
  ProjectDocument,
  DocumentContent,
} from "../../../types/gemini-enhancement";

// Document slice state interface
export interface DocumentSlice {
  currentDocument: ProjectDocument | null;
  documentVersions: ProjectDocument[];
  isDocumentLoading: boolean;
  isDocumentSaving: boolean;
  documentDirty: boolean;
  autoSaveTimer: number | null;

  // Document CRUD operations
  fetchDocument: (projectId: string) => Promise<void>;
  saveDocument: (projectId: string, content: DocumentContent) => Promise<void>;
  updateDocumentContent: (content: Partial<DocumentContent>) => void;
  markDocumentDirty: () => void;
  markDocumentClean: () => void;

  // Version management
  fetchDocumentHistory: (projectId: string, limit?: number) => Promise<void>;
  restoreDocumentVersion: (projectId: string, version: number) => Promise<void>;

  // Auto-save logic
  startAutoSave: (projectId: string, intervalMs?: number) => void;
  stopAutoSave: () => void;
  triggerAutoSave: (projectId: string) => Promise<void>;

  // Export
  exportDocument: (
    projectId: string,
    format: "markdown" | "pdf" | "json",
    includeAssets: boolean
  ) => Promise<void>;

  // Clear state
  clearDocument: () => void;
}

// Default auto-save interval: 30 seconds
const DEFAULT_AUTO_SAVE_INTERVAL_MS = 30 * 1000;

export const createDocumentSlice: StateCreator<
  DocumentSlice,
  [],
  [],
  DocumentSlice
> = (set, get) => ({
  currentDocument: null,
  documentVersions: [],
  isDocumentLoading: false,
  isDocumentSaving: false,
  documentDirty: false,
  autoSaveTimer: null,

  fetchDocument: async (projectId) => {
    set({ isDocumentLoading: true });
    try {
      const response = await fetch(`/api/projects/${projectId}/document`);
      if (!response.ok) {
        if (response.status === 404) {
          // No document exists yet
          set({
            currentDocument: null,
            isDocumentLoading: false,
          });
          return;
        }
        throw new Error(`Failed to fetch document: ${response.statusText}`);
      }
      const data = await response.json();
      const document: ProjectDocument = data.document;

      set({
        currentDocument: document,
        documentDirty: false,
        isDocumentLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch document:", error);
      set({ isDocumentLoading: false });
      throw error;
    }
  },

  saveDocument: async (projectId, content) => {
    set({ isDocumentSaving: true });
    try {
      const response = await fetch(`/api/projects/${projectId}/document`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save document: ${response.statusText}`);
      }

      const data = await response.json();
      const document: ProjectDocument = data.document;

      set({
        currentDocument: document,
        documentDirty: false,
        isDocumentSaving: false,
      });
    } catch (error) {
      console.error("Failed to save document:", error);
      set({ isDocumentSaving: false });
      throw error;
    }
  },

  updateDocumentContent: (content) => {
    set((state) => {
      if (!state.currentDocument) return state;

      return {
        currentDocument: {
          ...state.currentDocument,
          content: {
            ...state.currentDocument.content,
            ...content,
          },
        },
        documentDirty: true,
      };
    });
  },

  markDocumentDirty: () => {
    set({ documentDirty: true });
  },

  markDocumentClean: () => {
    set({ documentDirty: false });
  },

  fetchDocumentHistory: async (projectId, limit = 10) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/document/history?limit=${limit}`
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch document history: ${response.statusText}`
        );
      }
      const data = await response.json();
      const versions: ProjectDocument[] = data.versions || [];

      set({ documentVersions: versions });
    } catch (error) {
      console.error("Failed to fetch document history:", error);
      throw error;
    }
  },

  restoreDocumentVersion: async (projectId, version) => {
    set({ isDocumentLoading: true });
    try {
      const response = await fetch(
        `/api/projects/${projectId}/document/restore/${version}`,
        { method: "POST" }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to restore document version: ${response.statusText}`
        );
      }

      const data = await response.json();
      const document: ProjectDocument = data.document;

      set({
        currentDocument: document,
        documentDirty: false,
        isDocumentLoading: false,
      });
    } catch (error) {
      console.error("Failed to restore document version:", error);
      set({ isDocumentLoading: false });
      throw error;
    }
  },

  startAutoSave: (projectId, intervalMs = DEFAULT_AUTO_SAVE_INTERVAL_MS) => {
    // Clear existing timer
    const state = get();
    if (state.autoSaveTimer !== null) {
      window.clearInterval(state.autoSaveTimer);
    }

    // Start new timer
    const timer = window.setInterval(() => {
      void get().triggerAutoSave(projectId);
    }, intervalMs);

    set({ autoSaveTimer: timer });
  },

  stopAutoSave: () => {
    const state = get();
    if (state.autoSaveTimer !== null) {
      window.clearInterval(state.autoSaveTimer);
      set({ autoSaveTimer: null });
    }
  },

  triggerAutoSave: async (projectId) => {
    const state = get();

    // Only save if document is dirty and not currently saving
    if (
      !state.documentDirty ||
      state.isDocumentSaving ||
      !state.currentDocument
    ) {
      return;
    }

    try {
      await get().saveDocument(projectId, state.currentDocument.content);
    } catch (error) {
      console.error("Auto-save failed:", error);
      // Don't throw - auto-save failures should be silent
    }
  },

  exportDocument: async (projectId, format, includeAssets) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/document/export`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ format, includeAssets }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to export document: ${response.statusText}`);
      }

      // Download the file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Determine file extension
      const extension =
        format === "markdown" ? "md" : format === "pdf" ? "pdf" : "json";
      link.download = `document-${projectId}.${extension}`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export document:", error);
      throw error;
    }
  },

  clearDocument: () => {
    const state = get();
    if (state.autoSaveTimer !== null) {
      window.clearInterval(state.autoSaveTimer);
    }

    set({
      currentDocument: null,
      documentVersions: [],
      documentDirty: false,
      autoSaveTimer: null,
    });
  },
});
