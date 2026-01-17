import { Select } from "@/ui/Select";
import React, { useMemo, useState } from "react";
import type { Scene, SceneGroup, SceneHistoryEntry, SceneTag } from "@/types";
import type { ProjectSummary } from "@/types/services";
import { BookOpen, Folder, Grid3x3, Image, List, Search } from "lucide-react";
import { useDrawerTabs } from "./hooks/useDrawerTabs";
import type { TopTab, LibrarySubTab, GTSubTab } from "./hooks/useDrawerTabs";
import { LibraryTab } from "./tabs/LibraryTab.tsx";
import { DetailsTab } from "./tabs/DetailsTab.tsx";
import { GroupsTagsTab } from "./tabs/GroupsTagsTab.tsx";
import { HistoryTab } from "./tabs/HistoryTab.tsx";

type ViewMode = "grid" | "list";

export interface ManagerDrawerProps {
  // Data
  projects: (ProjectSummary & { sceneCount?: number })[];
  activeProjectId: string | null;
  scenes: Scene[];
  groups: SceneGroup[];
  tags: SceneTag[];

  // Project actions
  onSelectProject: (projectId: string) => void;
  onRenameProject?: (projectId: string, name: string) => Promise<void>;
  onDeleteProject?: (projectId: string) => Promise<void>;
  onExportProject?: (projectId: string) => Promise<void>;
  onImportProject?: (file: File) => Promise<void>;

  // Scene actions
  selectedSceneId: string | null;
  onSelectScene?: (sceneId: string | null) => void;
  onUpdateScene: (
    sceneId: string,
    updates: Partial<Pick<Scene, "description" | "aspectRatio">>
  ) => Promise<void> | void;
  onAssignGroup: (
    sceneId: string,
    groupId: string | null
  ) => void | Promise<void>;
  onAddTag: (sceneId: string, tagId: string) => void | Promise<void>;
  onRemoveTag: (sceneId: string, tagId: string) => void | Promise<void>;
  onExportImage: (imageUrl: string, description: string) => void;

  // Groups CRUD
  onCreateGroup: (payload: {
    name: string;
    color?: string | null;
  }) => Promise<void> | void;
  onUpdateGroup: (
    groupId: string,
    updates: { name?: string; color?: string | null }
  ) => Promise<void> | void;
  onDeleteGroup: (groupId: string) => Promise<void> | void;
  onAssignScenesToGroup: (
    groupId: string,
    sceneIds: string[]
  ) => Promise<void> | void;
  onRemoveScenesFromGroup: (
    groupId: string,
    sceneIds: string[]
  ) => Promise<void> | void;

  // Tags CRUD
  onCreateTag: (payload: {
    name: string;
    color?: string | null;
  }) => Promise<void> | void;
  onDeleteTag: (tagId: string) => Promise<void> | void;
  onAssignTagToScene: (
    sceneId: string,
    tagIds: string[]
  ) => Promise<void> | void;
  onRemoveTagFromScene: (
    sceneId: string,
    tagIds: string[]
  ) => Promise<void> | void;

  // History
  history: {
    entries: SceneHistoryEntry[];
    isLoading: boolean;
    error: string | null;
    onRefresh: () => void;
    onRestore: (historyId: string) => void | Promise<void>;
    restoringEntryId: string | null;
  };

  // Drawer state
  defaultTopTab?: TopTab;
  defaultLibrarySubTab?: LibrarySubTab;
  defaultGTSubTab?: GTSubTab;

  // Library state sync
  librarySubTab?: LibrarySubTab;
  onLibrarySubTabChange?: (subTab: LibrarySubTab) => void;
  librarySearch?: string;
  onLibrarySearchChange?: (value: string) => void;
  libraryViewMode?: ViewMode;
  onLibraryViewModeChange?: (mode: ViewMode) => void;
}

export const ManagerDrawer: React.FC<ManagerDrawerProps> = ({
  projects,
  activeProjectId,
  scenes,
  groups,
  tags,
  onSelectProject,
  selectedSceneId,
  onSelectScene,
  onUpdateScene,
  onExportImage,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onAssignScenesToGroup,
  onRemoveScenesFromGroup,
  onCreateTag,
  onDeleteTag,
  onAssignTagToScene,
  onRemoveTagFromScene,
  history,
  defaultTopTab = "library",
  defaultLibrarySubTab = "projects",
  defaultGTSubTab = "groups",
  librarySubTab: controlledLibrarySubTab,
  onLibrarySubTabChange,
  librarySearch: controlledLibrarySearch,
  onLibrarySearchChange,
  libraryViewMode: controlledViewMode,
  onLibraryViewModeChange,
}) => {
  // Use the drawer tabs hook for tab state management
  const tabs = useDrawerTabs({
    defaultTopTab: defaultTopTab as TopTab,
    defaultLibrarySubTab: defaultLibrarySubTab as LibrarySubTab,
    defaultGTSubTab: defaultGTSubTab as GTSubTab,
    librarySubTab: controlledLibrarySubTab,
    onLibrarySubTabChange,
    librarySearch: controlledLibrarySearch,
    onLibrarySearchChange,
  });

  const [viewModeState, setViewModeState] = useState<ViewMode>("grid");
  const viewMode = controlledViewMode ?? viewModeState;

  const handleSetViewMode = (next: ViewMode) => {
    setViewModeState(next);
    if (tabs.topTab === "library") {
      onLibraryViewModeChange?.(next);
    }
  };

  const selectedScene = useMemo(
    () => scenes.find((s) => s.id === selectedSceneId) ?? null,
    [scenes, selectedSceneId]
  );

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? null,
    [projects, activeProjectId]
  );

  return (
    <div className="absolute left-0 top-0 bottom-0 panel-chat flex flex-col z-40 w-chat-fixed shadow-xl">
      {/* Header with Logo and Project Selector */}
      <div className="flex flex-col items-center gap-3 px-4 pt-4 pb-3 border-b border-muted">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold tracking-wide">
            Storyboard
          </span>
        </div>
        <div className="w-full">
          <Select
            value={activeProjectId ?? null}
            onChange={(val) => onSelectProject(val ?? "")}
            options={projects.map((p) => ({
              value: p.id,
              label: p.name,
            }))}
            ariaLabel="Select project"
            title="Select project"
            size="sm"
            className="select-surface-card rounded w-full"
          />
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <button
          className={`btn-base px-3 py-1.5 text-sm rounded-md btn-ghost hover-primary transition-colors ${
            tabs.topTab === "library" ? "text-primary" : ""
          }`}
          onClick={() => tabs.setTopTab("library")}
        >
          Library
        </button>
        <button
          className={`btn-base px-3 py-1.5 text-sm rounded-md btn-ghost hover-primary transition-colors ${
            tabs.topTab === "details" ? "text-primary" : ""
          }`}
          onClick={() => tabs.setTopTab("details")}
        >
          Details
        </button>
        <button
          className={`btn-base px-3 py-1.5 text-sm rounded-md btn-ghost hover-primary transition-colors ${
            tabs.topTab === "groups-tags" ? "text-primary" : ""
          }`}
          onClick={() => tabs.setTopTab("groups-tags")}
        >
          Tags
        </button>
        <button
          className={`btn-base px-3 py-1.5 text-sm rounded-md btn-ghost hover-primary transition-colors ${
            tabs.topTab === "history" ? "text-primary" : ""
          }`}
          onClick={() => tabs.setTopTab("history")}
        >
          History
        </button>
      </div>

      {/* Sub-tabs row when applicable */}
      {tabs.topTab === "library" && (
        <div className="flex items-center justify-between px-4 pb-3">
          <div className="flex items-center gap-2">
            <button
              className={`btn-base px-3 py-1.5 text-xs rounded-md btn-ghost hover-primary transition-colors ${
                tabs.librarySubTab === "projects" ? "text-primary" : ""
              }`}
              onClick={() => tabs.setLibrarySubTab("projects")}
            >
              <Folder className="h-4 w-4 mr-1 inline" /> Projects
            </button>
            <button
              className={`btn-base px-3 py-1.5 text-xs rounded-md btn-ghost hover-primary transition-colors ${
                tabs.librarySubTab === "assets" ? "text-primary" : ""
              }`}
              onClick={() => tabs.setLibrarySubTab("assets")}
            >
              <Image className="h-4 w-4 mr-1 inline" /> Assets
            </button>
          </div>
        </div>
      )}

      {tabs.topTab === "groups-tags" && (
        <div className="flex items-center justify-between px-4 pb-3">
          <div className="flex items-center gap-2">
            <button
              className={`btn-base px-3 py-1.5 text-xs rounded-md btn-ghost hover-primary transition-colors ${
                tabs.gtSubTab === "groups" ? "text-primary" : ""
              }`}
              onClick={() => tabs.setGTSubTab("groups")}
            >
              Groups
            </button>
            <button
              className={`btn-base px-3 py-1.5 text-xs rounded-md btn-ghost hover-primary transition-colors ${
                tabs.gtSubTab === "tags" ? "text-primary" : ""
              }`}
              onClick={() => tabs.setGTSubTab("tags")}
            >
              Tags
            </button>
          </div>
        </div>
      )}

      {/* Search Row */}
      {tabs.topTab !== "details" && (
        <div className="flex items-center gap-2 px-4 pb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              value={tabs.search}
              onChange={(e) => tabs.setSearch(e.target.value)}
              placeholder={
                tabs.topTab === "library"
                  ? tabs.librarySubTab === "projects"
                    ? "Search projects…"
                    : "Search assets…"
                  : tabs.topTab === "groups-tags"
                  ? tabs.gtSubTab === "groups"
                    ? "Search groups…"
                    : "Search tags…"
                  : "Search…"
              }
              className="input-base w-full pl-9 pr-3 py-1.5 text-sm"
              aria-label="Search"
            />
          </div>
          {/* Only History shows grid/list controls in the search row */}
          {tabs.topTab === "history" && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                className={`btn-base p-2 rounded-md btn-ghost hover-primary transition-colors ${
                  viewMode === "grid" ? "text-primary" : ""
                }`}
                onClick={() => handleSetViewMode("grid")}
                aria-label="Grid view"
                title="Grid view"
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={`btn-base p-2 rounded-md btn-ghost hover-primary transition-colors ${
                  viewMode === "list" ? "text-primary" : ""
                }`}
                onClick={() => handleSetViewMode("list")}
                aria-label="List view"
                title="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4 pt-2">
        {tabs.topTab === "library" && (
          <LibraryTab
            librarySubTab={tabs.librarySubTab}
            search={tabs.search}
            projects={projects}
            activeProjectId={activeProjectId}
            scenes={scenes}
            onSelectProject={onSelectProject}
            onSelectScene={onSelectScene}
            onSwitchToDetails={() => tabs.setTopTab("details")}
          />
        )}

        {tabs.topTab === "details" && (
          <DetailsTab
            selectedScene={selectedScene}
            selectedProject={selectedProject}
            scenes={scenes}
            onUpdateScene={onUpdateScene}
            onExportImage={onExportImage}
          />
        )}

        {tabs.topTab === "groups-tags" && (
          <GroupsTagsTab
            gtSubTab={tabs.gtSubTab}
            search={tabs.search}
            groups={groups}
            tags={tags}
            scenes={scenes}
            onCreateGroup={onCreateGroup}
            onUpdateGroup={onUpdateGroup}
            onDeleteGroup={onDeleteGroup}
            onAssignScenesToGroup={onAssignScenesToGroup}
            onRemoveScenesFromGroup={onRemoveScenesFromGroup}
            onCreateTag={onCreateTag}
            onDeleteTag={onDeleteTag}
            onAssignTagToScene={onAssignTagToScene}
            onRemoveTagFromScene={onRemoveTagFromScene}
          />
        )}

        {tabs.topTab === "history" && (
          <HistoryTab
            selectedScene={selectedScene}
            viewMode={viewMode}
            history={history}
          />
        )}
      </div>
    </div>
  );
};
