import React, { useState, Suspense } from "react";
import {
  Image,
  Folder,
  FileText,
  Grid3x3,
  List,
  Edit,
  Download,
  History,
} from "lucide-react";
// Lazy-load heavy ChatPanel to split initial bundle
const ChatPanel = React.lazy(() =>
  import("@/features/chat/components/ChatPanel").then((m) => ({
    default: m.ChatPanel,
  }))
);
import { StoryboardPanel } from "@/features/storyboard/components/StoryboardPanel";
// Lazy-load document and library views; these can be heavy and are not needed at first paint
const DocumentTab = React.lazy(() =>
  import("@/features/storyboard/components/DocumentTab").then((m) => ({
    default: m.DocumentTab,
  }))
);
const DocumentView = React.lazy(() =>
  import("@/features/storyboard/components/DocumentView").then((m) => ({
    default: m.DocumentView,
  }))
);
const ProjectManager = React.lazy(() =>
  import("@/features/library/components/ProjectManager").then((m) => ({
    default: m.ProjectManager,
  }))
);
const AssetManager = React.lazy(() =>
  import("@/features/library/components/AssetManager").then((m) => ({
    default: m.AssetManager,
  }))
);
import { SceneManageDrawer } from "@/features/scene/components/SceneManageDrawer";
import { ErrorBoundary } from "@/ui/ErrorBoundary";
import { prefetch } from "@/utils/prefetch";
import type {
  ChatAgent,
  ChatMessage,
  PresetStyle,
  Scene,
  SceneGroup,
  SceneTag,
  Settings,
} from "../../../types";
import type { ProjectSummary } from "../../../types/services";

export interface DesktopLayoutProps {
  // Project state
  projects: ProjectSummary[];
  activeProjectId: string | null;
  scenes: Scene[];
  filteredScenes: Scene[];
  groups: SceneGroup[];
  tags: SceneTag[];
  activeGroupFilter: string | null;
  activeTagFilter: string | null;

  // Chat state
  chatHistory: ChatMessage[];
  isBusy: boolean;
  loadingText: string;
  aspectRatio: "16:9" | "9:16" | "1:1";
  selectedStyles: PresetStyle[];
  selectedTemplateIds: string[];
  chatAgent: ChatAgent;
  effectiveSettings: Settings;
  mobileView: "chat" | "storyboard";
  currentView: "storyboard" | "library" | "document";

  // Library state
  library: {
    activeTab: "projects" | "assets" | "document";
    setActiveTab: (tab: "projects" | "assets" | "document") => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    viewMode: "grid" | "list";
    setViewMode: (mode: "grid" | "list") => void;
    galleryViewMode: "grid" | "list";
    setGalleryViewMode: (mode: "grid" | "list") => void;
    storyboardViewMode: "grid" | "list";
    setStoryboardViewMode: (mode: "grid" | "list") => void;
    filteredProjects: ProjectSummary[];
    filteredScenes: Array<{ id: string; description: string }>;
  };

  // Scene manager state
  sceneManager: {
    selectedScene: Scene | null;
    sceneNumber: number | null;
    selectedSceneId: string | null;
    groupTagSubTab: "groups" | "tags";
    setGroupTagSubTab: (tab: "groups" | "tags") => void;
    closeManager: () => void;
    historyEntries: any[];
    isHistoryLoading: boolean;
    historyError: string | null;
    refreshHistory: () => void;
    restoreFromHistory: (historyId: string) => Promise<void>;
    restoringHistoryId: string | null;
  };

  // Layout state
  layout: {
    layoutRef: React.RefObject<HTMLDivElement>;
    isSidebarCollapsed: boolean;
    isChatCollapsed: boolean;
    isStoryboardCollapsed: boolean;
    isSceneManagerCollapsed: boolean;
    toggleSidebarCollapse: () => void;
    toggleChatCollapse: () => void;
    toggleStoryboardCollapse: () => void;
    toggleSceneManagerCollapse: () => void;
    startResize: (
      target: "sidebar" | "chat" | "sceneManager"
    ) => (e: React.PointerEvent) => void;
    isMobileLayout: boolean;
  };

  // Theme
  theme: "light" | "dark";

  // Handlers
  onToggleTheme: () => void;
  onSendMessage: (
    userInput: string,
    image?: { data: string; mimeType: string; preview: string }
  ) => Promise<void>;
  onSetAspectRatio: (ratio: "16:9" | "9:16" | "1:1") => void;
  onSetSelectedStyles: (styles: PresetStyle[]) => void;
  onSetSelectedTemplateIds: (templateIds: string[]) => void;
  onAgentChange: (agent: ChatAgent) => void;
  onSessionSettingsChange: (partial: Partial<Settings>) => void;
  onSetMobileView: (view: "chat" | "storyboard") => void;
  onSetCurrentView: (view: "storyboard" | "library" | "document") => void;
  onSetManagerTopTab: (
    tab: "library" | "details" | "groups-tags" | "history"
  ) => void;
  onGenerateImage: (sceneId: string) => void;
  onRegenerateDescription: (sceneId: string) => void;
  onExportImage: (imageUrl: string, sceneDescription: string) => void;
  onToggleEdit: (sceneId: string) => void;
  onToggleAnimate: (sceneId: string) => void;
  onEditImage: (sceneId: string, prompt: string) => void;
  onGenerateVideo: (sceneId: string, prompt: string) => void;
  onExtendVideo: (
    sceneId: string,
    prompt: string,
    extensionCount: number,
    model?: string
  ) => void;
  onSuggestVideoPrompt: (sceneId: string) => Promise<string | null>;
  onSuggestImageEditPrompt: (sceneId: string) => Promise<string | null>;
  onChangeSceneGroup: (sceneId: string, groupId: string | null) => void;
  onAddSceneTag: (sceneId: string, tagId: string) => void;
  onRemoveSceneTag: (sceneId: string, tagId: string) => void;
  onOpenGroupManager: (sceneId?: string | null) => void;
  onOpenTagManager: (sceneId?: string | null) => void;
  onCreateGroup: (payload: {
    name: string;
    color?: string | null;
  }) => Promise<void>;
  onUpdateGroup: (
    groupId: string,
    updates: { name?: string; color?: string | null }
  ) => Promise<void>;
  onDeleteGroup: (groupId: string) => Promise<void>;
  onAssignScenesToGroup: (groupId: string, sceneIds: string[]) => Promise<void>;
  onRemoveScenesFromGroup: (
    groupId: string,
    sceneIds: string[]
  ) => Promise<void>;
  onCreateTag: (payload: {
    name: string;
    color?: string | null;
  }) => Promise<void>;
  onDeleteTag: (tagId: string) => Promise<void>;
  onAssignTagToScene: (sceneId: string, tagIds: string[]) => Promise<void>;
  onRemoveTagFromScene: (sceneId: string, tagIds: string[]) => Promise<void>;
  onDuplicateScene: (sceneId: string) => void;
  onDeleteScene: (sceneId: string) => void;
  onOpenSceneHistory: (sceneId: string) => void;
  onOpenManage: (sceneId: string) => void;
  onSetGroupFilter: (groupId: string | null) => void;
  onSetTagFilter: (tagId: string | null) => void;
  onReorderScenes: (sceneIds: string[]) => void;
  onCreateManualScene: (
    description: string,
    aspectRatio: "16:9" | "9:16" | "1:1"
  ) => Promise<string>;
  onCreateAIScene: () => void;
  onSelectProject: (projectId: string) => Promise<void>;
  onRenameProject: (projectId: string, newName: string) => Promise<void>;
  onDeleteProject: (projectId: string) => Promise<void>;
  onExportProject: (projectId: string) => Promise<void>;
  onImportProject: (file: File) => Promise<void>;
  onUpdateScene: (
    sceneId: string,
    updates: Partial<
      { description: string; aspectRatio: "16:9" | "9:16" | "1:1" } & {
        primaryImageAssetId?: string | null;
        primaryVideoAssetId?: string | null;
      }
    >
  ) => Promise<void>;
  onUpdateProject: (updates: {
    name?: string;
    description?: string;
  }) => Promise<void>;
  onUpdateSettings: (updates: Partial<Settings>) => Promise<void>;
  onOpenGlobalSettings?: (
    tab?: "workflow" | "templates" | "models" | "app"
  ) => void;

  // Computed
  managerDrawerTab: "details" | "groups-tags" | "history";
  presetStyles: PresetStyle[];

  // Sidebar component
  sidebarComponent: React.ReactNode;
}

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({
  // activeProjectId comes from appState.project.activeProjectId (app-level state)
  // This is the source of truth for which project is currently active
  projects,
  activeProjectId,
  scenes,
  filteredScenes,
  groups,
  tags,
  activeGroupFilter,
  activeTagFilter,
  chatHistory,
  isBusy,
  loadingText,
  aspectRatio,
  selectedStyles,
  selectedTemplateIds,
  chatAgent,
  effectiveSettings,
  mobileView,
  currentView,
  library,
  sceneManager,
  layout,
  onSendMessage,
  onSetAspectRatio,
  onSetSelectedStyles,
  onSetSelectedTemplateIds,
  onAgentChange,
  onSessionSettingsChange,
  onSetMobileView,
  onSetCurrentView,
  onSetManagerTopTab,
  onGenerateImage,
  onRegenerateDescription,
  onExportImage,
  onToggleEdit,
  onToggleAnimate,
  onEditImage,
  onGenerateVideo,
  onExtendVideo,
  onSuggestVideoPrompt,
  onSuggestImageEditPrompt,
  onChangeSceneGroup,
  onAddSceneTag,
  onRemoveSceneTag,
  onOpenGroupManager,
  onOpenTagManager,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onAssignScenesToGroup,
  onRemoveScenesFromGroup,
  onCreateTag,
  onDeleteTag,
  onAssignTagToScene,
  onRemoveTagFromScene,
  onDuplicateScene,
  onDeleteScene,
  onOpenSceneHistory,
  onOpenManage,
  onSetGroupFilter,
  onSetTagFilter,
  onReorderScenes,
  onCreateManualScene,
  onCreateAIScene,
  onSelectProject,
  onRenameProject,
  onDeleteProject,
  onExportProject,
  onImportProject,
  onUpdateScene,
  onUpdateProject,
  onUpdateSettings,
  onOpenGlobalSettings,
  managerDrawerTab,
  presetStyles,
  sidebarComponent,
}) => {
  // Document action handlers - trigger clicks on DocumentTab buttons
  const handleDocumentEdit = () => {
    const editBtn = document.getElementById("document-edit-trigger");
    if (editBtn) {
      editBtn.click();
    }
  };

  const handleDocumentExport = () => {
    const exportBtn = document.getElementById("document-export-trigger");
    if (exportBtn) {
      exportBtn.click();
    }
  };

  const handleDocumentHistory = () => {
    const historyBtn = document.getElementById("document-history-trigger");
    if (historyBtn) {
      historyBtn.click();
    }
  };

  return (
    <div
      ref={layout.layoutRef}
      className="layout-desktop flex h-full overflow-hidden"
    >
      {/* Sidebar */}
      {sidebarComponent}

      {/* Chat Panel */}
      <section
        className={`layout-chat panel-chat ${layout.isChatCollapsed ? "layout-chat--collapsed" : ""
          }`}
      >
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="p-3 text-xs text-foreground-muted">
                Loading chat…
              </div>
            }
          >
            <ChatPanel
              chatHistory={chatHistory}
              isLoading={isBusy}
              loadingText={loadingText}
              onSendMessage={onSendMessage}
              aspectRatio={aspectRatio}
              setAspectRatio={onSetAspectRatio}
              presetStyles={presetStyles}
              selectedStyles={selectedStyles}
              setSelectedStyles={onSetSelectedStyles}
              selectedTemplateIds={selectedTemplateIds}
              setSelectedTemplateIds={onSetSelectedTemplateIds}
              agent={chatAgent}
              onAgentChange={onAgentChange}
              effectiveSettings={effectiveSettings}
              onSessionSettingsChange={onSessionSettingsChange}
              mobileView={mobileView}
              setMobileView={onSetMobileView}
              projectId={activeProjectId}
              onOpenGlobalSettings={onOpenGlobalSettings}
            />
          </Suspense>
        </ErrorBoundary>
      </section>

      {/* Chat Resizer */}
      <div
        className="layout-resizer"
        onPointerDown={layout.startResize("chat")}
        onClick={() => {
          // If a side is fully collapsed, clicking the handle reopens it
          if (layout.isChatCollapsed) {
            layout.toggleChatCollapse();
            return;
          }
          if (layout.isStoryboardCollapsed) {
            layout.toggleStoryboardCollapse();
            return;
          }
        }}
        role="separator"
        aria-orientation="vertical"
        aria-label={
          layout.isChatCollapsed || layout.isStoryboardCollapsed
            ? "Expand panels"
            : "Resize chat and storyboard panels"
        }
      />

      {/* Main Content Area */}
      <section
        className={`layout-main flex-1 overflow-hidden ${layout.isStoryboardCollapsed ? "layout-main--collapsed" : ""
          }`}
      >
        <div className="layout-main-scroll no-scrollbar">
          {/* Top toolbar with storyboard/gallery/document navigation and layout icons */}
          <div className="flex items-center justify-between gap-3 px-3 py-2">
            {/* Left section: Navigation icons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSetCurrentView("storyboard")}
                className={`btn-base p-2 rounded-md btn-ghost hover-primary transition-colors ${currentView === "storyboard" ? "text-primary" : ""
                  }`}
                aria-current={currentView === "storyboard" ? "page" : undefined}
                aria-label="Show storyboard"
                title="Storyboard"
              >
                <Image className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onSetCurrentView("library");
                  onSetManagerTopTab("library");
                  // Ensure the main gallery shows assets for the active project
                  library.setActiveTab("assets");
                }}
                onMouseEnter={() => {
                  prefetch(
                    () => import("@/features/library/components/ProjectManager")
                  );
                  prefetch(
                    () => import("@/features/library/components/AssetManager")
                  );
                }}
                className={`btn-base p-2 rounded-md btn-ghost hover-primary transition-colors ${currentView === "library" ? "text-primary" : ""
                  }`}
                aria-current={currentView === "library" ? "page" : undefined}
                aria-label="Show gallery"
                title="Gallery"
              >
                <Folder className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => onSetCurrentView("document")}
                onMouseEnter={() =>
                  prefetch(
                    () => import("@/features/storyboard/components/DocumentTab")
                  )
                }
                className={`btn-base p-2 rounded-md btn-ghost hover-primary transition-colors ${currentView === "document" ? "text-primary" : ""
                  }`}
                aria-current={currentView === "document" ? "page" : undefined}
                aria-label="Show document"
                title="Document"
              >
                <FileText className="h-5 w-5" />
              </button>
            </div>

            {/* Right section: Subtabs, filters, layout toggle */}
            <div className="flex items-center gap-1">
              {currentView === "storyboard" && (
                <>
                  <button
                    className={`btn-base p-2 rounded-md btn-ghost hover-primary transition-colors ${library.storyboardViewMode === "grid"
                        ? "text-primary"
                        : ""
                      }`}
                    onClick={() => library.setStoryboardViewMode("grid")}
                    aria-label="Grid view"
                    title="Grid view"
                  >
                    <Grid3x3 className="h-5 w-5" />
                  </button>
                  <button
                    className={`btn-base p-2 rounded-md btn-ghost hover-primary transition-colors ${library.storyboardViewMode === "list"
                        ? "text-primary"
                        : ""
                      }`}
                    onClick={() => library.setStoryboardViewMode("list")}
                    aria-label="List view"
                    title="List view"
                  >
                    <List className="h-5 w-5" />
                  </button>
                </>
              )}
              {currentView === "library" && (
                <>
                  <button
                    className={`btn-base p-2 rounded-md btn-ghost hover-primary transition-colors ${library.galleryViewMode === "grid" ? "text-primary" : ""
                      }`}
                    onClick={() => library.setGalleryViewMode("grid")}
                    aria-label="Grid view"
                    title="Grid view"
                  >
                    <Grid3x3 className="h-5 w-5" />
                  </button>
                  <button
                    className={`btn-base p-2 rounded-md btn-ghost hover-primary transition-colors ${library.galleryViewMode === "list" ? "text-primary" : ""
                      }`}
                    onClick={() => library.setGalleryViewMode("list")}
                    aria-label="List view"
                    title="List view"
                  >
                    <List className="h-5 w-5" />
                  </button>
                </>
              )}
              {currentView === "document" && activeProjectId && (
                <>
                  <button
                    type="button"
                    className="btn-base p-2 rounded-md btn-ghost hover-primary transition-colors"
                    onClick={handleDocumentEdit}
                    aria-label="Edit document"
                    title="Edit"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    className="btn-base p-2 rounded-md btn-ghost hover-primary transition-colors"
                    onClick={handleDocumentExport}
                    aria-label="Export document"
                    title="Export"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    className="btn-base p-2 rounded-md btn-ghost hover-primary transition-colors"
                    onClick={handleDocumentHistory}
                    aria-label="View document history"
                    title="History"
                  >
                    <History className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Content based on current view */}
          {currentView === "document" ? (
            <ErrorBoundary>
              <Suspense
                fallback={
                  <div className="p-3 text-xs text-foreground-muted">
                    Loading document…
                  </div>
                }
              >
                <DocumentView
                  projectId={activeProjectId || ""}
                  project={
                    projects.find((p) => p.id === activeProjectId) || null
                  }
                  scenes={scenes}
                  groups={groups}
                  settings={effectiveSettings}
                  onUpdateScene={onUpdateScene}
                  onUpdateProject={onUpdateProject}
                  onUpdateSettings={onUpdateSettings}
                />
              </Suspense>
            </ErrorBoundary>
          ) : currentView === "library" ? (
            library.activeTab === "document" ? (
              <ErrorBoundary>
                <Suspense
                  fallback={
                    <div className="p-3 text-xs text-foreground-muted">
                      Loading document…
                    </div>
                  }
                >
                  <DocumentTab projectId={activeProjectId || ""} />
                </Suspense>
              </ErrorBoundary>
            ) : (
              <div className="p-2 md:p-3 lg:p-4">
                {library.activeTab === "projects" ? (
                  <ErrorBoundary>
                    <Suspense
                      fallback={
                        <div className="p-3 text-xs text-foreground-muted">
                          Loading projects…
                        </div>
                      }
                    >
                      <ProjectManager
                        projects={library.filteredProjects}
                        activeProjectId={activeProjectId}
                        viewMode="gallery"
                        layoutMode={library.galleryViewMode}
                        cardVariant="scene"
                        onSelectProject={onSelectProject}
                        onRenameProject={onRenameProject}
                        onDeleteProject={onDeleteProject}
                        onExportProject={onExportProject}
                        onImportProject={onImportProject}
                      />
                    </Suspense>
                  </ErrorBoundary>
                ) : (
                  // Gallery view: Pass activeProjectId from app-level state (appState.project.activeProjectId)
                  // This ensures the gallery always shows assets from the active project,
                  // independent of sidebar navigation state
                  <ErrorBoundary>
                    <Suspense
                      fallback={
                        <div className="p-3 text-xs text-foreground-muted">
                          Loading gallery…
                        </div>
                      }
                    >
                      <AssetManager
                        projectId={activeProjectId}
                        scenes={scenes}
                        onOpenSceneHistory={onOpenSceneHistory}
                        onOpenManage={onOpenManage}
                        historySceneId={sceneManager.selectedSceneId}
                        mode="embedded"
                        layoutMode={library.galleryViewMode}
                        cardVariant="scene"
                      />
                    </Suspense>
                  </ErrorBoundary>
                )}
              </div>
            )
          ) : (
            <StoryboardPanel
              scenes={filteredScenes}
              totalSceneCount={scenes.length}
              groups={groups}
              tags={tags}
              projectId={activeProjectId}
              onUpdateScene={onUpdateScene}
              activeGroupFilter={activeGroupFilter}
              activeTagFilter={activeTagFilter}
              onGroupFilterChange={onSetGroupFilter}
              onTagFilterChange={onSetTagFilter}
              onOpenGroupManager={onOpenGroupManager}
              onOpenTagManager={onOpenTagManager}
              onChangeSceneGroup={onChangeSceneGroup}
              onAddSceneTag={onAddSceneTag}
              onRemoveSceneTag={onRemoveSceneTag}
              onDuplicateScene={onDuplicateScene}
              onDeleteScene={onDeleteScene}
              onGenerateImage={onGenerateImage}
              onRegenerateDescription={onRegenerateDescription}
              onExportImage={onExportImage}
              onToggleEdit={onToggleEdit}
              onToggleAnimate={onToggleAnimate}
              onEditImage={onEditImage}
              onGenerateVideo={onGenerateVideo}
              onExtendVideo={onExtendVideo}
              onSuggestVideoPrompt={onSuggestVideoPrompt}
              onSuggestImageEditPrompt={onSuggestImageEditPrompt}
              onOpenSceneHistory={onOpenSceneHistory}
              onOpenManage={onOpenManage}
              onReorderScenes={onReorderScenes}
              isReorderEnabled={true}
              allSceneIds={scenes.map((scene) => scene.id)}
              onCreateManualScene={onCreateManualScene}
              onCreateAIScene={onCreateAIScene}
              defaultAspectRatio={aspectRatio}
              currentSettings={effectiveSettings}
            />
          )}
        </div>
      </section>

      {/* Scene Manager Panel */}
      {!layout.isMobileLayout && (
        <aside
          className={`layout-scene-manager flex h-full flex-col ${layout.isSceneManagerCollapsed
              ? "layout-scene-manager--collapsed"
              : ""
            }`}
        >
          <SceneManageDrawer
            variant="panel"
            isOpen={true}
            scene={sceneManager.selectedScene}
            sceneNumber={sceneManager.sceneNumber}
            groups={groups}
            tags={tags}
            scenes={scenes}
            onClose={sceneManager.closeManager}
            isCollapsed={layout.isSceneManagerCollapsed}
            onToggleCollapse={layout.toggleSceneManagerCollapse}
            onUpdateScene={onUpdateScene}
            onAssignGroup={(sceneId, groupId) =>
              onChangeSceneGroup(sceneId, groupId)
            }
            onAddTag={(sceneId, tagId) => onAddSceneTag(sceneId, tagId)}
            onRemoveTag={(sceneId, tagId) => onRemoveSceneTag(sceneId, tagId)}
            onOpenGroupManager={onOpenGroupManager}
            onOpenTagManager={onOpenTagManager}
            onExportImage={onExportImage}
            onCreateGroup={onCreateGroup}
            onUpdateGroup={onUpdateGroup}
            onDeleteGroup={onDeleteGroup}
            onAssignScenesToGroup={onAssignScenesToGroup}
            onRemoveScenesFromGroup={onRemoveScenesFromGroup}
            onCreateTag={onCreateTag}
            onDeleteTag={onDeleteTag}
            onAssignTagToScene={onAssignTagToScene}
            onRemoveTagFromScene={onRemoveTagFromScene}
            defaultTab={managerDrawerTab}
            groupTagSubTab={sceneManager.groupTagSubTab}
            onGroupTagSubTabChange={sceneManager.setGroupTagSubTab}
            history={{
              entries: sceneManager.historyEntries,
              isLoading: sceneManager.isHistoryLoading,
              error: sceneManager.historyError,
              onRefresh: sceneManager.refreshHistory,
              onRestore: sceneManager.restoreFromHistory,
              restoringEntryId: sceneManager.restoringHistoryId,
            }}
          />
        </aside>
      )}
    </div>
  );
};
