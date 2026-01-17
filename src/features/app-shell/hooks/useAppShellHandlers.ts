import { useCallback, useMemo, useState } from "react";
import type { AppShellState } from "./useAppShellState";

/**
 * Custom hook that provides all event handlers for AppShell
 * Extracted to reduce AppShell component size
 */
export const useAppShellHandlers = (appState: AppShellState) => {
  // Delete project dialog state
  const [deleteDialogState, setDeleteDialogState] = useState<{
    isOpen: boolean;
    projectId: string | null;
    projectName: string;
  }>({
    isOpen: false,
    projectId: null,
    projectName: "",
  });

  // Project manager modal state
  const [projectManagerState, setProjectManagerState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    projectId: string | null;
    initialData?: {
      name?: string;
      description?: string;
      imageUrl?: string;
    };
  }>({
    isOpen: false,
    mode: "create",
    projectId: null,
    initialData: undefined,
  });
  const openGroupManagerDrawer = useCallback(
    (sceneId?: string | null) => {
      const targetSceneId =
        sceneId ??
        appState.scene.manager.selectedSceneId ??
        appState.project.scenes[0]?.id ??
        null;
      if (!targetSceneId) {
        return;
      }
      appState.scene.manager.openManager(targetSceneId, {
        tab: "groups-tags",
        groupTagSubTab: "groups",
      });
    },
    [appState.scene.manager, appState.project.scenes]
  );

  const openTagManagerDrawer = useCallback(
    (sceneId?: string | null) => {
      const targetSceneId =
        sceneId ??
        appState.scene.manager.selectedSceneId ??
        appState.project.scenes[0]?.id ??
        null;
      if (!targetSceneId) {
        return;
      }
      appState.scene.manager.openManager(targetSceneId, {
        tab: "groups-tags",
        groupTagSubTab: "tags",
      });
    },
    [appState.scene.manager, appState.project.scenes]
  );

  const handleAgentChange = useCallback(
    (nextAgent: typeof appState.ui.chatAgent) => {
      appState.ui.setChatAgent(nextAgent);
      appState.ui.setMobileView("chat");
    },
    [appState.ui]
  );

  const handleChatSubmit = useCallback(
    async (
      userInput: string,
      image?: { data: string; mimeType: string; preview: string }
    ) => {
      const activeMode: "storyboard" | "chat" =
        appState.ui.chatAgent === "generate" ? "storyboard" : "chat";
      const entryPoint = `agent:${appState.ui.chatAgent}`;
      if (activeMode === "storyboard") {
        const ok = await appState.generation.storyboard.submitConcept({
          text: userInput,
          image,
          aspectRatio: appState.ui.aspectRatio,
          selectedStyles: appState.ui.selectedStyles,
          templateIds: appState.ui.selectedTemplateIds,
          entryPoint,
        });
        if (ok) appState.ui.setMobileView("storyboard");
      } else {
        const ok = await appState.generation.chat.submitChatMessage({
          text: userInput,
          image,
          entryPoint,
        });
        if (ok) appState.ui.setMobileView("chat");
      }
    },
    [appState.generation.chat, appState.generation.storyboard, appState.ui]
  );

  const handleGenerateImage = useCallback(
    (sceneId: string) => {
      void appState.generation.media.generateImage(
        sceneId,
        appState.ui.selectedStyles,
        appState.ui.selectedTemplateIds
      );
    },
    [
      appState.generation.media,
      appState.ui.selectedStyles,
      appState.ui.selectedTemplateIds,
    ]
  );

  const handleRegenerateDescription = useCallback(
    (sceneId: string) => {
      void appState.generation.storyboard.regenerateDescription(sceneId);
    },
    [appState.generation.storyboard]
  );

  const handleToggleEdit = useCallback(
    (sceneId: string) => {
      appState.generation.media.toggleEditPanel(sceneId);
    },
    [appState.generation.media]
  );

  const handleToggleAnimate = useCallback(
    (sceneId: string) => {
      appState.generation.media.toggleAnimatePanel(sceneId);
    },
    [appState.generation.media]
  );

  const handleEditImage = useCallback(
    (sceneId: string, prompt: string) => {
      void appState.generation.media.editImage({ sceneId, prompt });
    },
    [appState.generation.media]
  );

  const handleGenerateVideo = useCallback(
    (sceneId: string, prompt: string) => {
      void appState.generation.media.generateVideo({ sceneId, prompt });
    },
    [appState.generation.media]
  );

  const handleExtendVideo = useCallback(
    (
      sceneId: string,
      prompt: string,
      extensionCount: number,
      model?: string
    ) => {
      const chosenModel =
        model ?? appState.session.effectiveSettings.videoModel;
      void appState.generation.media.extendVideo({
        sceneId,
        prompt,
        extensionCount,
        model: chosenModel as import("../../../types").VideoModel,
      });
    },
    [appState.generation.media, appState.session.effectiveSettings.videoModel]
  );

  const handleSuggestVideoPrompt = useCallback(
    (sceneId: string) => appState.generation.media.suggestVideoPrompt(sceneId),
    [appState.generation.media]
  );

  const handleSuggestImageEditPrompt = useCallback(
    (sceneId: string) =>
      appState.generation.media.suggestImageEditPrompt(sceneId),
    [appState.generation.media]
  );

  const handleExportImage = useCallback(
    (imageUrl: string, sceneDescription: string) => {
      appState.scene.actions.exportImage(imageUrl, sceneDescription);
    },
    [appState.scene.actions]
  );

  const handleExportAllImages = useCallback(() => {
    appState.scene.actions.exportAllImages(appState.project.scenes);
  }, [appState.scene.actions, appState.project.scenes]);

  const handleReorderScenes = useCallback(
    (sceneIds: string[]) => {
      void appState.scene.actions.reorderScenes(sceneIds);
    },
    [appState.scene.actions]
  );

  const handleSceneGroupChange = useCallback(
    (sceneId: string, nextGroupId: string | null) => {
      void appState.scene.actions.assignGroup(sceneId, nextGroupId);
    },
    [appState.scene.actions]
  );

  const handleAddSceneTag = useCallback(
    (sceneId: string, tagId: string) => {
      void appState.scene.actions.addTag(sceneId, tagId);
    },
    [appState.scene.actions]
  );

  const handleRemoveSceneTag = useCallback(
    (sceneId: string, tagId: string) => {
      void appState.scene.actions.removeTag(sceneId, tagId);
    },
    [appState.scene.actions]
  );

  const handleDuplicateScene = useCallback(
    (sceneId: string) => {
      void appState.scene.actions.duplicateScene(sceneId);
    },
    [appState.scene.actions]
  );

  const handleDeleteScene = useCallback(
    (sceneId: string) => {
      void appState.scene.actions.deleteScene(sceneId);
    },
    [appState.scene.actions]
  );

  const handleCreateManualScene = useCallback(
    (description: string, aspectRatio: "16:9" | "9:16" | "1:1") => {
      return appState.scene.actions.createManualScene(description, aspectRatio);
    },
    [appState.scene.actions]
  );

  const handleCreateAIScene = useCallback(() => {
    // Switch to chat mode to use the existing storyboard generation flow
    appState.ui.setChatAgent("generate");
    appState.ui.setMobileView("chat");
  }, [appState.ui]);

  const handleUpdateScene = useCallback(
    async (
      sceneId: string,
      updates: Partial<
        { description: string; aspectRatio: "16:9" | "9:16" | "1:1" } & {
          primaryImageAssetId?: string | null;
          primaryVideoAssetId?: string | null;
        }
      >
    ) => {
      await appState.scene.actions.updateScene(sceneId, updates);
    },
    [appState.scene.actions]
  );

  const handleOpenSceneHistory = useCallback(
    (sceneId: string) => {
      if (!sceneId) return;
      appState.scene.manager.openManager(sceneId, { tab: "history" });
    },
    [appState.scene.manager]
  );

  const handleOpenManage = useCallback(
    (sceneId: string) => {
      if (!sceneId) return;
      appState.scene.manager.openManager(sceneId, { tab: "details" });
    },
    [appState.scene.manager]
  );

  const applySettingsChange = useCallback(
    (next: Partial<typeof appState.project.settings>) => {
      console.log("[applySettingsChange] Called with:", next);
      console.log(
        "[applySettingsChange] Current settings:",
        appState.project.settings
      );
      void appState.project.setSettings((prev) => {
        const updated = { ...prev, ...next };
        console.log("[applySettingsChange] Updated settings:", updated);
        return updated;
      });
    },
    [appState.project]
  );

  const handleUpdateProject = useCallback(
    async (updates: { name?: string; description?: string }) => {
      if (!appState.project.activeProjectId) return;
      await appState.project.updateProject(
        appState.project.activeProjectId,
        updates
      );
    },
    [appState.project]
  );

  const handleUpdateSettings = useCallback(
    async (updates: Partial<typeof appState.project.settings>) => {
      await appState.project.setSettings((prev) => ({ ...prev, ...updates }));
    },
    [appState.project]
  );

  const handleCreateProject = useCallback(() => {
    // Open project manager modal in create mode
    setProjectManagerState({
      isOpen: true,
      mode: "create",
      projectId: null,
      initialData: undefined,
    });
  }, []);

  const handleManageProject = useCallback(
    (projectId: string) => {
      // Find project data
      const project = appState.project.projects.find((p) => p.id === projectId);
      if (!project) return;

      // Open project manager modal in edit mode with existing data
      setProjectManagerState({
        isOpen: true,
        mode: "edit",
        projectId,
        initialData: {
          name: project.name,
          description: project.description || undefined,
          imageUrl: undefined, // TODO: Add imageUrl to ProjectSummary type if needed
        },
      });
    },
    [appState.project.projects]
  );

  const handleCloseProjectManager = useCallback(() => {
    setProjectManagerState({
      isOpen: false,
      mode: "create",
      projectId: null,
      initialData: undefined,
    });
  }, []);

  const handleSaveProjectMetadata = useCallback(
    async (data: { name?: string; description?: string; image?: File }) => {
      try {
        if (projectManagerState.mode === "create") {
          // Create new project
          await appState.projectActions.createProject(data.name);
          handleCloseProjectManager();
        } else if (projectManagerState.projectId) {
          // Update existing project
          const updates: { name?: string; description?: string } = {};
          if (data.name !== undefined) updates.name = data.name;
          if (data.description !== undefined)
            updates.description = data.description;

          // TODO: Handle image upload when backend supports it
          if (data.image) {
            console.log("Image upload not yet implemented:", data.image.name);
          }

          // Update project metadata if provided
          const projectUpdates: { name?: string; description?: string } = {};
          if (updates.name !== undefined) {
            projectUpdates.name = updates.name;
          }
          if (updates.description !== undefined) {
            projectUpdates.description = updates.description;
          }
          if (Object.keys(projectUpdates).length > 0) {
            await appState.project.updateProject(
              projectManagerState.projectId,
              projectUpdates
            );
          }
        }
      } catch (error) {
        console.error("Failed to save project metadata:", error);
        throw error;
      }
    },
    [
      projectManagerState.mode,
      projectManagerState.projectId,
      appState.projectActions,
      appState.project,
      handleCloseProjectManager,
    ]
  );

  const handleDeleteProjectWithConfirmation = useCallback(
    (projectId: string) => {
      const project = appState.project.projects.find((p) => p.id === projectId);
      if (!project) return;

      // Open the deletion confirmation dialog
      setDeleteDialogState({
        isOpen: true,
        projectId,
        projectName: project.name,
      });
    },
    [appState.project.projects]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteDialogState.projectId) return;

    try {
      await appState.projectActions.deleteProject(deleteDialogState.projectId);
      // Close dialog on success
      setDeleteDialogState({
        isOpen: false,
        projectId: null,
        projectName: "",
      });
      // Show success message via console (toast system not implemented yet)
      console.log("Project deleted successfully");
    } catch (error) {
      // Handle deletion errors gracefully
      console.error("Failed to delete project:", error);
      // Close dialog even on error to allow user to retry
      setDeleteDialogState({
        isOpen: false,
        projectId: null,
        projectName: "",
      });
    }
  }, [deleteDialogState.projectId, appState.projectActions]);

  const handleCancelDelete = useCallback(() => {
    // Close dialog without making changes
    setDeleteDialogState({
      isOpen: false,
      projectId: null,
      projectName: "",
    });
  }, []);

  const managerDrawerTab = useMemo(() => {
    return appState.ui.managerTopTab === "library"
      ? "details"
      : appState.ui.managerTopTab;
  }, [appState.ui.managerTopTab]);

  return {
    openGroupManagerDrawer,
    openTagManagerDrawer,
    handleAgentChange,
    handleChatSubmit,
    handleGenerateImage,
    handleRegenerateDescription,
    handleToggleEdit,
    handleToggleAnimate,
    handleEditImage,
    handleGenerateVideo,
    handleExtendVideo,
    handleSuggestVideoPrompt,
    handleSuggestImageEditPrompt,
    handleExportImage,
    handleExportAllImages,
    handleReorderScenes,
    handleSceneGroupChange,
    handleAddSceneTag,
    handleRemoveSceneTag,
    handleDuplicateScene,
    handleDeleteScene,
    handleCreateManualScene,
    handleCreateAIScene,
    handleUpdateScene,
    handleOpenSceneHistory,
    handleOpenManage,
    applySettingsChange,
    handleUpdateProject,
    handleUpdateSettings,
    handleCreateProject,
    handleManageProject,
    handleDeleteProjectWithConfirmation,
    handleConfirmDelete,
    handleCancelDelete,
    handleCloseProjectManager,
    handleSaveProjectMetadata,
    deleteDialogState,
    projectManagerState,
    managerDrawerTab,
  };
};
