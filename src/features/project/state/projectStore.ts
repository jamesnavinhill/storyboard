import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { ChatMessage, Settings } from "../../../types";
import type { ProjectSummary } from "../../../types/services";
import {
  createProjectServices,
  type ProjectServices,
} from "../services/projectServices";
import { createSceneSlice, type SceneSlice, createScene } from "./sceneStore";
import { createGroupSlice, type GroupSlice } from "./groupStore";
import { createTagSlice, type TagSlice } from "./tagStore";
import {
  createChatSlice,
  type ChatSlice,
  createChatMessage,
} from "./chatStore";
import { normalizeSettings, validateFilter } from "./storeUtils";

export type ToastEvent = {
  id: number;
  type: "success" | "error" | "info";
  message: string;
};

export interface ProjectStoreState
  extends SceneSlice,
    GroupSlice,
    TagSlice,
    ChatSlice {
  // Services
  _services: ProjectServices | null;

  // Base state
  projects: ProjectSummary[];
  isProjectsLoading: boolean;
  activeProjectId: string | null;
  isProjectLoading: boolean;

  // Notifications
  toasts: ToastEvent[];

  // Core actions
  init: (
    services: ProjectServices,
    opts: { defaultSettings: Settings; welcomeMessage: ChatMessage }
  ) => Promise<void>;
  bootstrap: () => Promise<void>;
  selectProject: (projectId: string) => Promise<void>;
  createProject: (name?: string) => Promise<ProjectSummary>;
  refreshActiveProject: () => Promise<void>;
  renameProject: (projectId: string, name: string) => Promise<void>;
  updateProject: (
    projectId: string,
    updates: { name?: string; description?: string }
  ) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  exportProject: (projectId: string) => Promise<void>;
  importProject: (file: File) => Promise<void>;

  // Toasts
  enqueueToast: (t: Omit<ToastEvent, "id">) => void;
  dequeueToast: (id: number) => void;
}

export const useProjectStore = create<ProjectStoreState>()(
  devtools((set, get, ...rest) => ({
    // Compose all slices
    ...createSceneSlice(set, get, ...rest),
    ...createGroupSlice(set, get, ...rest),
    ...createTagSlice(set, get, ...rest),
    ...createChatSlice(set, get, ...rest),

    // Core state
    _services: null,
    projects: [],
    isProjectsLoading: true,
    activeProjectId: null,
    isProjectLoading: false,
    toasts: [],

    enqueueToast: (t) =>
      set((s) => ({ toasts: [...s.toasts, { ...t, id: Date.now() }] })),
    dequeueToast: (id) =>
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

    init: async (services, opts) => {
      set({
        _services: services,
        defaultSettings: opts.defaultSettings,
        welcomeMessage: opts.welcomeMessage,
      });
      // Initialize chat history with welcome if empty
      set((s) => ({
        chatHistory: s.chatHistory.length
          ? s.chatHistory
          : [opts.welcomeMessage],
      }));
      await get().bootstrap();
    },

    bootstrap: async () => {
      const services = get()._services;
      if (!services) return;
      set({ isProjectsLoading: true });
      try {
        const list = await services.listProjects();
        if (list.length === 0) {
          const project = await services.createProject({
            name: "Untitled Project",
          });
          await services.upsertSettings(project.id, get().defaultSettings);
          await services.appendChatMessage(project.id, {
            role: "model",
            text: get().welcomeMessage.text,
          });
          set({
            projects: [project],
            activeProjectId: project.id,
            isProjectsLoading: false,
          });
          await get().refreshActiveProject();
          return;
        }
        set({
          projects: list,
          activeProjectId: list[0].id,
          isProjectsLoading: false,
        });
        await get().refreshActiveProject();
      } catch (e) {
        console.error("Failed to load projects", e);
        set({ projects: [], activeProjectId: null, isProjectsLoading: false });
      }
    },

    selectProject: async (projectId) => {
      set({ activeProjectId: projectId });
      await get().refreshActiveProject();
    },

    refreshActiveProject: async () => {
      const services = get()._services;
      const activeProjectId = get().activeProjectId;
      if (!services || !activeProjectId) return;
      set({ isProjectLoading: true });
      try {
        const detail = await services.getProjectDetail(activeProjectId, [
          "scenes",
          "chat",
          "settings",
          "groups",
          "tags",
        ]);
        const loadedScenes = (detail.scenes ?? [])
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map(createScene);
        const loadedChat = (detail.chat ?? []).map(createChatMessage);
        const nextGroups = detail.groups ?? [];
        const nextTags = detail.tags ?? [];
        const normalizedSettings = detail.settings
          ? normalizeSettings(detail.settings.data, get().defaultSettings)
          : get().defaultSettings;

        // Validate filters against loaded groups/tags
        const nextGroupFilter = validateFilter(
          get().activeGroupFilter,
          nextGroups
        );
        const nextTagFilter = validateFilter(get().activeTagFilter, nextTags);

        set((prev) => ({
          scenes: loadedScenes,
          chatHistory:
            loadedChat.length > 0 ? loadedChat : [prev.welcomeMessage],
          groups: nextGroups.map((g) => ({
            ...g,
            sceneIds: Array.from(new Set(g.sceneIds ?? [])),
          })),
          tags: nextTags.map((t) => ({ ...t, sceneIds: t.sceneIds ?? [] })),
          activeGroupFilter: nextGroupFilter,
          activeTagFilter: nextTagFilter,
          settings: normalizedSettings,
        }));
      } catch (e) {
        console.error("Failed to load project", e);
        set((s) => ({
          scenes: [],
          groups: [],
          tags: [],
          activeGroupFilter: null,
          activeTagFilter: null,
          chatHistory: [s.welcomeMessage],
          settings: s.defaultSettings,
        }));
      } finally {
        set({ isProjectLoading: false });
      }
    },

    createProject: async (name) => {
      const services = get()._services;
      if (!services) throw new Error("Services not initialized");
      const payloadName =
        name?.trim() || `Project ${get().projects.length + 1}`;
      const project = await services.createProject({ name: payloadName });
      await services.upsertSettings(project.id, get().defaultSettings);
      await services.appendChatMessage(project.id, {
        role: "model",
        text: get().welcomeMessage.text,
      });
      set((s) => ({
        projects: [project, ...s.projects],
        activeProjectId: project.id,
      }));
      return project;
    },

    renameProject: async (projectId, name) => {
      const services = get()._services;
      if (!services) return;
      const updated = await services.updateProject(projectId, { name });
      set((s) => ({
        projects: s.projects.map((p) => (p.id === projectId ? updated : p)),
      }));
    },

    updateProject: async (projectId, updates) => {
      const services = get()._services;
      if (!services) return;
      const updated = await services.updateProject(projectId, updates);
      set((s) => ({
        projects: s.projects.map((p) => (p.id === projectId ? updated : p)),
      }));
    },

    deleteProject: async (projectId) => {
      const services = get()._services;
      if (!services) return;
      const result = await services.deleteProject(projectId);
      set((s) => {
        const filtered = s.projects.filter((p) => p.id !== projectId);
        const nextActive =
          result.nextProject?.id ?? result.replacementProject?.id ?? null;
        return {
          projects: result.replacementProject
            ? [result.replacementProject, ...filtered]
            : filtered,
          activeProjectId: nextActive,
        };
      });
    },

    exportProject: async (projectId) => {
      const services = get()._services;
      if (!services) return;
      const blob = await services.exportProject(projectId);
      const project = get().projects.find((p) => p.id === projectId);
      const fileName = project
        ? `${project.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.zip`
        : "project-export.zip";
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },

    importProject: async (file) => {
      const services = get()._services;
      if (!services) return;
      const imported = await services.importProject(file);
      set((s) => ({
        projects: [imported, ...s.projects],
        activeProjectId: imported.id,
      }));
    },
  }))
);

// React hook wrapper to initialize services from ServiceRegistry
export { createProjectServices };
