import React, { useEffect } from "react";
import { idlePrefetch } from "@/utils/prefetch";
import { SceneManageDrawer } from "@/features/scene/components/SceneManageDrawer";
import { DeleteProjectDialog } from "@/features/project/components/DeleteProjectDialog";
import { ProjectManagerModal } from "@/features/library/components/ProjectManagerModal";
import { useTheme } from "../../hooks/useTheme";
import { PRESET_STYLES } from "../../config/presets";
import { MobileLayout } from "./components/MobileLayout";
import { DesktopLayout } from "./components/DesktopLayout";
import { AppSidebar } from "./components/AppSidebar";
import { SettingsSheet } from "./components/SettingsSheet";
import { useAppShellState } from "./hooks/useAppShellState";
import { useAppShellHandlers } from "./hooks/useAppShellHandlers";

const AppShell: React.FC = () => {
  // Single orchestration hook that manages all app state
  const appState = useAppShellState();
  const { theme, toggleTheme } = useTheme();

  // Extract all event handlers to separate hook
  const handlers = useAppShellHandlers(appState);

  // After first paint, warm common next-step chunks during idle time
  // Note: Only prefetch lazy-loaded components that aren't already imported
  useEffect(() => {
    idlePrefetch(
      () => import("@/features/settings/components/EnhancedSettingsSheet")
    );
    idlePrefetch(() => import("@/features/storyboard/components/DocumentTab"));
    // DesktopLayout and AppSidebar are statically imported, so no need to prefetch
  }, []);

  return (
    <div className="app-container h-screen overflow-hidden">
      {appState.layout.isMobileLayout ? (
        <MobileLayout
          projects={appState.project.projects}
          isProjectsLoading={appState.project.isProjectsLoading}
          activeProjectId={appState.project.activeProjectId}
          scenes={appState.project.scenes}
          filteredScenes={appState.computed.filteredScenes}
          groups={appState.project.groups}
          tags={appState.project.tags}
          activeGroupFilter={appState.project.activeGroupFilter}
          activeTagFilter={appState.project.activeTagFilter}
          chatHistory={appState.project.chatHistory}
          isBusy={appState.computed.isBusy}
          loadingText={appState.computed.loadingText}
          aspectRatio={appState.ui.aspectRatio}
          selectedStyles={appState.ui.selectedStyles}
          selectedTemplateIds={appState.ui.selectedTemplateIds}
          chatAgent={appState.ui.chatAgent}
          effectiveSettings={appState.session.effectiveSettings}
          mobileView={appState.ui.mobileView}
          currentView={appState.ui.currentView}
          library={appState.library}
          sceneManager={appState.scene.manager}
          theme={theme}
          onToggleTheme={toggleTheme}
          onSelectProject={appState.projectActions.selectProject}
          onCreateProject={handlers.handleCreateProject}
          onExportAllImages={handlers.handleExportAllImages}
          onSendMessage={handlers.handleChatSubmit}
          onSetAspectRatio={appState.ui.setAspectRatio}
          onSetSelectedStyles={appState.ui.setSelectedStyles}
          onSetSelectedTemplateIds={appState.ui.setSelectedTemplateIds}
          onAgentChange={handlers.handleAgentChange}
          onSessionSettingsChange={(partial) =>
            appState.session.setOverrides((prev) => ({ ...prev, ...partial }))
          }
          onSetMobileView={appState.ui.setMobileView}
          onSetCurrentView={appState.ui.setCurrentView}
          onSetManagerTopTab={appState.ui.setManagerTopTab}
          onGenerateImage={handlers.handleGenerateImage}
          onRegenerateDescription={handlers.handleRegenerateDescription}
          onExportImage={handlers.handleExportImage}
          onToggleEdit={handlers.handleToggleEdit}
          onToggleAnimate={handlers.handleToggleAnimate}
          onEditImage={handlers.handleEditImage}
          onGenerateVideo={handlers.handleGenerateVideo}
          onExtendVideo={handlers.handleExtendVideo}
          onSuggestVideoPrompt={handlers.handleSuggestVideoPrompt}
          onSuggestImageEditPrompt={handlers.handleSuggestImageEditPrompt}
          onChangeSceneGroup={handlers.handleSceneGroupChange}
          onAddSceneTag={handlers.handleAddSceneTag}
          onRemoveSceneTag={handlers.handleRemoveSceneTag}
          onOpenGroupManager={handlers.openGroupManagerDrawer}
          onOpenTagManager={handlers.openTagManagerDrawer}
          onDuplicateScene={handlers.handleDuplicateScene}
          onDeleteScene={handlers.handleDeleteScene}
          onOpenSceneHistory={handlers.handleOpenSceneHistory}
          onOpenManage={handlers.handleOpenManage}
          onSetGroupFilter={appState.project.setGroupFilter}
          onSetTagFilter={appState.project.setTagFilter}
          onRenameProject={appState.projectActions.renameProject}
          onDeleteProject={appState.projectActions.deleteProject}
          onExportProject={appState.projectActions.exportProject}
          onImportProject={appState.projectActions.importProject}
          onOpenGlobalSettings={(tab) => {
            if (tab) {
              appState.ui.setSettingsTab(tab);
            }
            appState.ui.setSettingsSheetOpen(true);
          }}
          hasImagesToExport={appState.computed.hasImagesToExport}
          filtersActive={appState.computed.filtersActive}
          presetStyles={PRESET_STYLES}
        />
      ) : (
        <DesktopLayout
          projects={appState.project.projects}
          activeProjectId={appState.project.activeProjectId}
          scenes={appState.project.scenes}
          filteredScenes={appState.computed.filteredScenes}
          groups={appState.project.groups}
          tags={appState.project.tags}
          activeGroupFilter={appState.project.activeGroupFilter}
          activeTagFilter={appState.project.activeTagFilter}
          chatHistory={appState.project.chatHistory}
          isBusy={appState.computed.isBusy}
          loadingText={appState.computed.loadingText}
          aspectRatio={appState.ui.aspectRatio}
          selectedStyles={appState.ui.selectedStyles}
          selectedTemplateIds={appState.ui.selectedTemplateIds}
          chatAgent={appState.ui.chatAgent}
          effectiveSettings={appState.session.effectiveSettings}
          mobileView={appState.ui.mobileView}
          currentView={appState.ui.currentView}
          library={appState.library}
          sceneManager={appState.scene.manager}
          layout={appState.layout}
          theme={theme}
          onToggleTheme={toggleTheme}
          onSendMessage={handlers.handleChatSubmit}
          onSetAspectRatio={appState.ui.setAspectRatio}
          onSetSelectedStyles={appState.ui.setSelectedStyles}
          onSetSelectedTemplateIds={appState.ui.setSelectedTemplateIds}
          onAgentChange={handlers.handleAgentChange}
          onSessionSettingsChange={(partial) =>
            appState.session.setOverrides((prev) => ({ ...prev, ...partial }))
          }
          onSetMobileView={appState.ui.setMobileView}
          onSetCurrentView={appState.ui.setCurrentView}
          onSetManagerTopTab={appState.ui.setManagerTopTab}
          onGenerateImage={handlers.handleGenerateImage}
          onRegenerateDescription={handlers.handleRegenerateDescription}
          onExportImage={handlers.handleExportImage}
          onToggleEdit={handlers.handleToggleEdit}
          onToggleAnimate={handlers.handleToggleAnimate}
          onEditImage={handlers.handleEditImage}
          onGenerateVideo={handlers.handleGenerateVideo}
          onExtendVideo={handlers.handleExtendVideo}
          onSuggestVideoPrompt={handlers.handleSuggestVideoPrompt}
          onSuggestImageEditPrompt={handlers.handleSuggestImageEditPrompt}
          onChangeSceneGroup={handlers.handleSceneGroupChange}
          onAddSceneTag={handlers.handleAddSceneTag}
          onRemoveSceneTag={handlers.handleRemoveSceneTag}
          onOpenGroupManager={handlers.openGroupManagerDrawer}
          onOpenTagManager={handlers.openTagManagerDrawer}
          onCreateGroup={appState.project.createGroup}
          onUpdateGroup={appState.project.updateGroup}
          onDeleteGroup={appState.project.deleteGroup}
          onAssignScenesToGroup={appState.project.assignScenesToGroup}
          onRemoveScenesFromGroup={appState.project.removeScenesFromGroup}
          onCreateTag={appState.project.createTag}
          onDeleteTag={appState.project.deleteTag}
          onAssignTagToScene={appState.project.assignTagsToScene}
          onRemoveTagFromScene={appState.project.removeTagsFromScene}
          onDuplicateScene={handlers.handleDuplicateScene}
          onDeleteScene={handlers.handleDeleteScene}
          onOpenSceneHistory={handlers.handleOpenSceneHistory}
          onOpenManage={handlers.handleOpenManage}
          onSetGroupFilter={appState.project.setGroupFilter}
          onSetTagFilter={appState.project.setTagFilter}
          onReorderScenes={handlers.handleReorderScenes}
          onCreateManualScene={handlers.handleCreateManualScene}
          onCreateAIScene={handlers.handleCreateAIScene}
          onSelectProject={appState.projectActions.selectProject}
          onRenameProject={appState.projectActions.renameProject}
          onDeleteProject={appState.projectActions.deleteProject}
          onExportProject={appState.projectActions.exportProject}
          onImportProject={appState.projectActions.importProject}
          onUpdateScene={handlers.handleUpdateScene}
          onUpdateProject={handlers.handleUpdateProject}
          onUpdateSettings={handlers.handleUpdateSettings}
          onOpenGlobalSettings={(tab) => {
            if (tab) {
              appState.ui.setSettingsTab(tab);
            }
            appState.ui.setSettingsSheetOpen(true);
          }}
          managerDrawerTab={handlers.managerDrawerTab}
          presetStyles={PRESET_STYLES}
          sidebarComponent={
            <AppSidebar
              isSidebarCollapsed={appState.layout.isSidebarCollapsed}
              onToggleSidebarCollapse={appState.layout.toggleSidebarCollapse}
              library={appState.library}
              activeProjectId={appState.project.activeProjectId}
              sceneManagerSelectedSceneId={
                appState.scene.manager.selectedSceneId
              }
              theme={theme}
              onToggleTheme={toggleTheme}
              onCreateProject={handlers.handleCreateProject}
              onManageProject={handlers.handleManageProject}
              onExportAllImages={handlers.handleExportAllImages}
              onSelectProject={appState.projectActions.selectProject}
              onSetManagerTopTab={appState.ui.setManagerTopTab}
              onRenameProject={appState.projectActions.renameProject}
              onDeleteProject={handlers.handleDeleteProjectWithConfirmation}
              onExportProject={appState.projectActions.exportProject}
              onImportProject={appState.projectActions.importProject}
              onOpenSceneHistory={handlers.handleOpenSceneHistory}
              onOpenManage={handlers.handleOpenManage}
              onOpenSettings={() => appState.ui.setSettingsSheetOpen(true)}
              hasImagesToExport={appState.computed.hasImagesToExport}
            />
          }
        />
      )}
      {appState.layout.isMobileLayout && (
        <SceneManageDrawer
          variant="drawer"
          isOpen={appState.scene.manager.selectedScene !== null}
          scene={appState.scene.manager.selectedScene}
          sceneNumber={appState.scene.manager.sceneNumber}
          groups={appState.project.groups}
          tags={appState.project.tags}
          scenes={appState.project.scenes}
          onClose={appState.scene.manager.closeManager}
          onUpdateScene={handlers.handleUpdateScene}
          onAssignGroup={(sceneId, groupId) =>
            handlers.handleSceneGroupChange(sceneId, groupId)
          }
          onAddTag={(sceneId, tagId) =>
            handlers.handleAddSceneTag(sceneId, tagId)
          }
          onRemoveTag={(sceneId, tagId) =>
            handlers.handleRemoveSceneTag(sceneId, tagId)
          }
          onOpenGroupManager={handlers.openGroupManagerDrawer}
          onOpenTagManager={handlers.openTagManagerDrawer}
          onExportImage={handlers.handleExportImage}
          onCreateGroup={appState.project.createGroup}
          onUpdateGroup={appState.project.updateGroup}
          onDeleteGroup={appState.project.deleteGroup}
          onAssignScenesToGroup={appState.project.assignScenesToGroup}
          onRemoveScenesFromGroup={appState.project.removeScenesFromGroup}
          onCreateTag={appState.project.createTag}
          onDeleteTag={appState.project.deleteTag}
          onAssignTagToScene={appState.project.assignTagsToScene}
          onRemoveTagFromScene={appState.project.removeTagsFromScene}
          defaultTab={handlers.managerDrawerTab}
          groupTagSubTab={appState.scene.manager.groupTagSubTab}
          onGroupTagSubTabChange={appState.scene.manager.setGroupTagSubTab}
          history={{
            entries: appState.scene.manager.historyEntries,
            isLoading: appState.scene.manager.isHistoryLoading,
            error: appState.scene.manager.historyError,
            onRefresh: appState.scene.manager.refreshHistory,
            onRestore: appState.scene.manager.restoreFromHistory,
            restoringEntryId: appState.scene.manager.restoringHistoryId,
          }}
        />
      )}
      <SettingsSheet
        appState={appState}
        theme={theme}
        onToggleTheme={toggleTheme}
        onApplySettingsChange={handlers.applySettingsChange}
      />
      <DeleteProjectDialog
        isOpen={handlers.deleteDialogState.isOpen}
        projectName={handlers.deleteDialogState.projectName}
        onConfirm={handlers.handleConfirmDelete}
        onCancel={handlers.handleCancelDelete}
      />
      <ProjectManagerModal
        mode={handlers.projectManagerState.mode}
        projectId={handlers.projectManagerState.projectId || undefined}
        initialData={handlers.projectManagerState.initialData}
        isOpen={handlers.projectManagerState.isOpen}
        onClose={handlers.handleCloseProjectManager}
        onSave={handlers.handleSaveProjectMetadata}
      />
    </div>
  );
};

export default AppShell;
