import { useEffect, useMemo } from "react";
import type { ChatMessage, Settings } from "../../../types";
import { useServices } from "../../../services/registry";
import { useProjectStore, createProjectServices } from "./projectStore";

export interface UseProjectStateOptions {
  defaultSettings: Settings;
  welcomeMessage: ChatMessage;
}

// Compatibility hook: exposes the same API shape as the legacy useProjectState,
// but backed by the Zustand store. This lets AppShell keep its current usage.
export const useProjectState = (options: UseProjectStateOptions) => {
  const { projectStorage } = useServices();

  // Subscribe to all store values individually to ensure re-renders
  const projects = useProjectStore((s) => s.projects);
  const isProjectsLoading = useProjectStore((s) => s.isProjectsLoading);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const isProjectLoading = useProjectStore((s) => s.isProjectLoading);
  const scenes = useProjectStore((s) => s.scenes);
  const groups = useProjectStore((s) => s.groups);
  const tags = useProjectStore((s) => s.tags);
  const activeGroupFilter = useProjectStore((s) => s.activeGroupFilter);
  const activeTagFilter = useProjectStore((s) => s.activeTagFilter);
  const chatHistory = useProjectStore((s) => s.chatHistory);
  const settings = useProjectStore((s) => s.settings);
  const welcomeMessage = useProjectStore((s) => s.welcomeMessage);
  const defaultSettings = useProjectStore((s) => s.defaultSettings);
  const toasts = useProjectStore((s) => s.toasts);

  // Get methods from store (these don't change)
  const selectProject = useProjectStore((s) => s.selectProject);
  const createProject = useProjectStore((s) => s.createProject);
  const refreshActiveProject = useProjectStore((s) => s.refreshActiveProject);
  const updateSceneRecord = useProjectStore((s) => s.updateSceneRecord);
  const appendSceneRecords = useProjectStore((s) => s.appendSceneRecords);
  const setSceneUiState = useProjectStore((s) => s.setSceneUiState);
  const setSceneActivity = useProjectStore((s) => s.setSceneActivity);
  const setScenePanels = useProjectStore((s) => s.setScenePanels);
  const setScenePanelState = useProjectStore((s) => s.setScenePanelState);
  const toggleScenePanel = useProjectStore((s) => s.toggleScenePanel);
  const setSceneError = useProjectStore((s) => s.setSceneError);
  const resetSceneState = useProjectStore((s) => s.resetSceneState);
  const setSettings = useProjectStore((s) => s.setSettings);
  const appendChatMessage = useProjectStore((s) => s.appendChatMessage);
  const replaceChatHistory = useProjectStore((s) => s.replaceChatHistory);
  const renameProject = useProjectStore((s) => s.renameProject);
  const updateProject = useProjectStore((s) => s.updateProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const exportProject = useProjectStore((s) => s.exportProject);
  const importProject = useProjectStore((s) => s.importProject);
  const reorderScenes = useProjectStore((s) => s.reorderScenes);
  const deleteScene = useProjectStore((s) => s.deleteScene);
  const createGroup = useProjectStore((s) => s.createGroup);
  const updateGroup = useProjectStore((s) => s.updateGroup);
  const deleteGroup = useProjectStore((s) => s.deleteGroup);
  const assignScenesToGroup = useProjectStore((s) => s.assignScenesToGroup);
  const removeScenesFromGroup = useProjectStore((s) => s.removeScenesFromGroup);
  const createTag = useProjectStore((s) => s.createTag);
  const deleteTag = useProjectStore((s) => s.deleteTag);
  const assignTagsToScene = useProjectStore((s) => s.assignTagsToScene);
  const removeTagsFromScene = useProjectStore((s) => s.removeTagsFromScene);
  const loadSceneHistory = useProjectStore((s) => s.loadSceneHistory);
  const restoreSceneFromHistory = useProjectStore(
    (s) => s.restoreSceneFromHistory
  );
  const setGroupFilter = useProjectStore((s) => s.setGroupFilter);
  const setTagFilter = useProjectStore((s) => s.setTagFilter);
  const duplicateScene = useProjectStore((s) => s.duplicateScene);
  const createManualScene = useProjectStore((s) => s.createManualScene);
  const dequeueToast = useProjectStore((s) => s.dequeueToast);
  const _services = useProjectStore((s) => s._services);
  const init = useProjectStore((s) => s.init);

  useEffect(() => {
    // Avoid bootstrapping network-backed services in unit tests
    // import.meta.vitest is set by Vitest
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((import.meta as any).vitest) {
      return;
    }
    if (!_services) {
      void init(createProjectServices(projectStorage), {
        defaultSettings: options.defaultSettings,
        welcomeMessage: options.welcomeMessage,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectStorage]);

  return useMemo(
    () => ({
      projects,
      isProjectsLoading,
      activeProjectId,
      isProjectLoading,
      scenes,
      groups,
      tags,
      activeGroupFilter,
      activeTagFilter,
      chatHistory,
      settings,
      welcomeMessage,
      defaultSettings,
      selectProject,
      createProject,
      refreshActiveProject,
      updateSceneRecord,
      appendSceneRecords,
      setSceneUiState,
      setSceneActivity,
      setScenePanels,
      setScenePanelState,
      toggleScenePanel,
      setSceneError,
      resetSceneState,
      setSettings,
      appendChatMessage,
      replaceChatHistory,
      renameProject,
      updateProject,
      deleteProject,
      exportProject,
      importProject,
      reorderScenes,
      deleteScene,
      createGroup,
      updateGroup,
      deleteGroup,
      assignScenesToGroup,
      removeScenesFromGroup,
      createTag,
      deleteTag,
      assignTagsToScene,
      removeTagsFromScene,
      loadSceneHistory,
      restoreSceneFromHistory,
      setGroupFilter,
      setTagFilter,
      duplicateScene,
      createManualScene,
      __toasts: toasts,
      __dequeueToast: dequeueToast,
    }),
    [
      projects,
      isProjectsLoading,
      activeProjectId,
      isProjectLoading,
      scenes,
      groups,
      tags,
      activeGroupFilter,
      activeTagFilter,
      chatHistory,
      settings,
      welcomeMessage,
      defaultSettings,
      selectProject,
      createProject,
      refreshActiveProject,
      updateSceneRecord,
      appendSceneRecords,
      setSceneUiState,
      setSceneActivity,
      setScenePanels,
      setScenePanelState,
      toggleScenePanel,
      setSceneError,
      resetSceneState,
      setSettings,
      appendChatMessage,
      replaceChatHistory,
      renameProject,
      updateProject,
      deleteProject,
      exportProject,
      importProject,
      reorderScenes,
      deleteScene,
      createGroup,
      updateGroup,
      deleteGroup,
      assignScenesToGroup,
      removeScenesFromGroup,
      createTag,
      deleteTag,
      assignTagsToScene,
      removeTagsFromScene,
      loadSceneHistory,
      restoreSceneFromHistory,
      setGroupFilter,
      setTagFilter,
      duplicateScene,
      createManualScene,
      toasts,
      dequeueToast,
    ]
  );
};
