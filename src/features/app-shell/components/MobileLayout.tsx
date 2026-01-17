import React, { Suspense } from "react";
import {
  Sparkles,
  ArchiveRestore,
  FilePlus,
  Image,
  Folder,
} from "lucide-react";
import { Select } from "@/ui/Select";
// Lazy-load heavy ChatPanel to split initial bundle
const ChatPanel = React.lazy(() =>
  import("@/features/chat/components/ChatPanel").then((m) => ({
    default: m.ChatPanel,
  }))
);
import { SceneCard } from "@/features/storyboard/components/SceneCard";
// Lazy-load library panel used in mobile view when switching to library
const LibraryPanel = React.lazy(() =>
  import("../../library/components/LibraryPanel").then((m) => ({
    default: m.LibraryPanel,
  }))
);
import { ErrorBoundary } from "@/ui/ErrorBoundary";
import { prefetch } from "@/utils/prefetch";
import { SunIcon, MoonIcon } from "../../../ui/icons";
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

export interface MobileLayoutProps {
  // Project state
  projects: ProjectSummary[];
  isProjectsLoading: boolean;
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
    filteredProjects: ProjectSummary[];
    filteredScenes: Array<{ id: string; description: string }>;
  };

  // Scene manager state
  sceneManager: {
    selectedSceneId: string | null;
  };

  // Theme
  theme: "light" | "dark";

  // Handlers
  onToggleTheme: () => void;
  onSelectProject: (projectId: string) => Promise<void>;
  onCreateProject: () => void;
  onExportAllImages: () => void;
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
  onOpenGroupManager: (sceneId?: string) => void;
  onOpenTagManager: (sceneId?: string) => void;
  onDuplicateScene: (sceneId: string) => void;
  onDeleteScene: (sceneId: string) => void;
  onOpenSceneHistory: (sceneId: string) => void;
  onOpenManage: (sceneId: string) => void;
  onSetGroupFilter: (groupId: string | null) => void;
  onSetTagFilter: (tagId: string | null) => void;
  onRenameProject: (projectId: string, newName: string) => Promise<void>;
  onDeleteProject: (projectId: string) => Promise<void>;
  onExportProject: (projectId: string) => Promise<void>;
  onImportProject: (file: File) => Promise<void>;
  onOpenGlobalSettings?: (
    tab?: "workflow" | "templates" | "models" | "app"
  ) => void;

  // Computed
  hasImagesToExport: boolean;
  filtersActive: boolean;
  presetStyles: PresetStyle[];
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  projects,
  isProjectsLoading,
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
  theme,
  onToggleTheme,
  onSelectProject,
  onCreateProject,
  onExportAllImages,
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
  onDuplicateScene,
  onDeleteScene,
  onOpenSceneHistory,
  onOpenManage,
  onSetGroupFilter,
  onSetTagFilter,
  onRenameProject,
  onDeleteProject,
  onExportProject,
  onImportProject,
  onOpenGlobalSettings,
  hasImagesToExport,
  filtersActive,
  presetStyles,
}) => {
  return (
    <div className="flex h-full flex-col">
      <header className="p-4 border-b app-header flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-primary" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
            <h1 className="text-xl font-semibold tracking-wide">StoryBoard</h1>
            <div className="flex items-center gap-2">
              <label className="text-xs uppercase tracking-wide text-muted">
                Project
              </label>
              {isProjectsLoading ? (
                <span className="text-sm text-muted">Loading…</span>
              ) : (
                <Select
                  value={activeProjectId ?? null}
                  onChange={(val) => onSelectProject(val)}
                  options={projects.map((p) => ({
                    value: p.id,
                    label: p.name,
                  }))}
                  ariaLabel="Select project"
                  title="Select project"
                  size="sm"
                  className="select-surface-card rounded"
                />
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSetCurrentView("storyboard")}
              className={`btn-base px-3 py-1.5 text-sm btn-ghost hover-primary transition-colors ${currentView === "storyboard" ? "text-primary" : ""
                }`}
              aria-current={currentView === "storyboard" ? "page" : undefined}
              aria-label="Show storyboard"
              title="Storyboard"
            >
              <Image className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">Storyboard</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onSetCurrentView("library");
                onSetManagerTopTab("library");
                // Ensure gallery shows assets from the active project
                library.setActiveTab("assets");
              }}
              onMouseEnter={() =>
                prefetch(() => import("../../library/components/LibraryPanel"))
              }
              className={`btn-base px-3 py-1.5 text-sm btn-ghost hover-primary transition-colors ${currentView === "library" ? "text-primary" : ""
                }`}
              aria-current={currentView === "library" ? "page" : undefined}
              aria-label="Show gallery"
              title="Gallery"
            >
              <Folder className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">Gallery</span>
            </button>
          </div>
          <button
            onClick={onCreateProject}
            className="btn-base btn-soft-primary flex items-center px-3 py-1.5 text-sm"
            aria-label="Start a new project"
            title="New Project"
          >
            <FilePlus className="w-5 h-5 md:mr-2" />
            <span className="hidden md:inline">New Project</span>
          </button>
          <button
            onClick={onExportAllImages}
            disabled={!hasImagesToExport}
            className="btn-base btn-soft-primary flex items-center px-3 py-1.5 text-sm"
            aria-label="Export all generated images"
            title="Export All Images"
          >
            <ArchiveRestore className="w-5 h-5 md:mr-2" />
            <span className="hidden md:inline">Export All</span>
          </button>
          <button
            onClick={onToggleTheme}
            className="btn-base btn-ghost p-2"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <MoonIcon className="w-5 h-5" />
            ) : (
              <SunIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-hidden app-main">
        <div className="panel-chat flex flex-col shrink-0 h-full min-h-0">
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
              >
                {currentView === "library" ? (
                  <div className="panel-storyboard h-full w-full overflow-hidden">
                    <Suspense
                      fallback={
                        <div className="p-3 text-xs text-foreground-muted">
                          Loading library…
                        </div>
                      }
                    >
                      <LibraryPanel
                        variant="full"
                        activeTab={library.activeTab}
                        onTabChange={library.setActiveTab}
                        searchQuery={library.searchQuery}
                        onSearchChange={library.setSearchQuery}
                        viewMode={library.viewMode}
                        onViewModeChange={library.setViewMode}
                        projects={library.filteredProjects}
                        scenes={library.filteredScenes}
                        activeProjectId={activeProjectId}
                        onSelectProject={onSelectProject}
                        onRenameProject={onRenameProject}
                        onDeleteProject={onDeleteProject}
                        onExportProject={onExportProject}
                        onImportProject={onImportProject}
                        onOpenSceneHistory={onOpenSceneHistory}
                        onOpenManage={onOpenManage}
                        historySceneId={sceneManager.selectedSceneId}
                      />
                    </Suspense>
                  </div>
                ) : (
                  <div className="panel-storyboard h-full w-full overflow-y-auto no-scrollbar min-h-0">
                    <div className="p-4">
                      {filtersActive && filteredScenes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-muted">
                          <Image className="h-12 w-12" />
                          <p>No scenes match your current filters.</p>
                          <button
                            type="button"
                            onClick={() => {
                              onSetGroupFilter(null);
                              onSetTagFilter(null);
                            }}
                            className="rounded-md border border-muted px-3 py-1.5 text-sm text-muted hover:bg-white/5"
                          >
                            Clear Filters
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {filteredScenes.map((scene, index) => (
                            <SceneCard
                              key={scene.id}
                              scene={scene}
                              onGenerateImage={() => onGenerateImage(scene.id)}
                              onRegenerateDescription={() =>
                                onRegenerateDescription(scene.id)
                              }
                              onExportImage={onExportImage}
                              onToggleEdit={() => onToggleEdit(scene.id)}
                              onToggleAnimate={() => onToggleAnimate(scene.id)}
                              onToggleExtend={() => {
                                /* extend flow not available in mobile card menu */
                              }}
                              onEditImage={(prompt) =>
                                onEditImage(scene.id, prompt)
                              }
                              onGenerateVideo={(prompt) =>
                                onGenerateVideo(scene.id, prompt)
                              }
                              onSuggestVideoPrompt={() =>
                                onSuggestVideoPrompt(scene.id)
                              }
                              onSuggestImageEditPrompt={() =>
                                onSuggestImageEditPrompt(scene.id)
                              }
                              availableGroups={groups}
                              availableTags={tags}
                              onChangeGroup={(groupId) =>
                                onChangeSceneGroup(scene.id, groupId)
                              }
                              onAddTag={(tagId) =>
                                onAddSceneTag(scene.id, tagId)
                              }
                              onRemoveTag={(tagId) =>
                                onRemoveSceneTag(scene.id, tagId)
                              }
                              onOpenGroupManager={() =>
                                onOpenGroupManager(scene.id)
                              }
                              onOpenTagManager={() =>
                                onOpenTagManager(scene.id)
                              }
                              onDuplicate={() => onDuplicateScene(scene.id)}
                              onDelete={() => onDeleteScene(scene.id)}
                              onOpenHistory={() => onOpenSceneHistory(scene.id)}
                              onOpenManage={() => onOpenManage(scene.id)}
                              isDragEnabled={false}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </ChatPanel>
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
};
