import React, { Suspense } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  SunIcon,
  MoonIcon,
} from "../../../ui/icons";
// Lazy-load LibraryPanel so sidebar browsing logic doesn't inflate initial bundle
const LibraryPanel = React.lazy(() =>
  import("../../library/components/LibraryPanel").then((m) => ({
    default: m.LibraryPanel,
  }))
);
import { prefetch } from "@/utils/prefetch";
import type { ProjectSummary } from "../../../types/services";

export interface AppSidebarProps {
  // Layout state
  isSidebarCollapsed: boolean;
  onToggleSidebarCollapse: () => void;

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

  // Project state
  activeProjectId: string | null;
  sceneManagerSelectedSceneId: string | null;

  // Theme
  theme: "light" | "dark";

  // Handlers
  onToggleTheme: () => void;
  onCreateProject: () => void;
  onManageProject?: (projectId: string) => void | Promise<void>;
  onExportAllImages: () => void;
  onSelectProject: (projectId: string) => Promise<void>;
  onSetManagerTopTab: (
    tab: "library" | "details" | "groups-tags" | "history"
  ) => void;
  onRenameProject: (projectId: string, newName: string) => Promise<void>;
  onDeleteProject: (projectId: string) => void | Promise<void>;
  onExportProject: (projectId: string) => Promise<void>;
  onImportProject: (file: File) => Promise<void>;
  onOpenSceneHistory: (sceneId: string) => void;
  onOpenManage: (sceneId: string) => void;
  onOpenSettings: () => void;

  // Computed
  hasImagesToExport: boolean;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  isSidebarCollapsed,
  onToggleSidebarCollapse,
  library,
  activeProjectId,
  sceneManagerSelectedSceneId,
  theme,
  onToggleTheme,
  onCreateProject,
  onManageProject,
  onExportAllImages,
  onSelectProject,
  onSetManagerTopTab,
  onRenameProject,
  onDeleteProject,
  onExportProject,
  onImportProject,
  onOpenSceneHistory,
  onOpenManage,
  onOpenSettings,
  hasImagesToExport,
}) => {
  return (
    <aside
      className={`layout-sidebar ${
        isSidebarCollapsed ? "layout-sidebar--collapsed cursor-pointer" : ""
      }`}
      onClick={isSidebarCollapsed ? onToggleSidebarCollapse : undefined}
    >
      <div className="layout-sidebar-inner">
        {/* Header with title and collapse/expand button */}
        <div className="layout-sidebar-header px-3 py-2 border-b border-muted gap-0">
          {isSidebarCollapsed ? (
            <div className="flex items-center justify-center w-full p-2">
              <span className="text-lg font-semibold text-primary">SB</span>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={onToggleSidebarCollapse}
                className="btn-base btn-ghost p-1 rounded-md layout-sidebar-collapse"
                aria-label="Collapse sidebar"
              >
                <ChevronDoubleLeftIcon className="icon-md" />
              </button>
              <span className="text-lg font-semibold tracking-wide flex-1 text-center">
                StoryBoard
              </span>
            </>
          )}
        </div>
        {!isSidebarCollapsed && (
          <div className="flex-1 min-h-0">
            {/* Sidebar LibraryPanel: activeProjectId is used for display purposes only
                Sidebar navigation (clicking projects in collapsible list) does NOT change
                the app-level activeProjectId - only onSelectProject does that.
                This ensures sidebar browsing doesn't affect the gallery view. */}
            <Suspense
              fallback={
                <div className="p-2 text-xs text-foreground-muted">
                  Loading library…
                </div>
              }
            >
              <LibraryPanel
                variant="sidebar"
                activeTab={library.activeTab}
                onTabChange={library.setActiveTab}
                searchQuery={library.searchQuery}
                onSearchChange={library.setSearchQuery}
                viewMode={library.viewMode}
                onViewModeChange={library.setViewMode}
                projects={library.filteredProjects}
                scenes={library.filteredScenes}
                activeProjectId={activeProjectId}
                onSelectProject={(projectId) => {
                  onSelectProject(projectId);
                  onSetManagerTopTab("library");
                }}
                onCreateProject={onCreateProject}
                onManageProject={onManageProject}
                onRenameProject={onRenameProject}
                onDeleteProject={onDeleteProject}
                onExportProject={onExportProject}
                onImportProject={onImportProject}
                onOpenSceneHistory={onOpenSceneHistory}
                onOpenManage={onOpenManage}
                historySceneId={sceneManagerSelectedSceneId}
              />
            </Suspense>
          </div>
        )}

        {/* Bottom section with theme toggle and settings */}
        <div className="layout-sidebar-footer flex flex-col gap-3 px-3 py-3 mt-auto">
          <button
            type="button"
            onClick={onToggleTheme}
            className="btn-base btn-ghost sidebar-theme-button"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <MoonIcon className="icon-md" />
            ) : (
              <SunIcon className="icon-md" />
            )}
            <span className="sidebar-button-label">
              {theme === "light" ? "Dark theme" : "Light theme"}
            </span>
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            onMouseEnter={() =>
              prefetch(
                () =>
                  import("@/features/settings/components/EnhancedSettingsSheet")
              )
            }
            className="btn-base btn-ghost sidebar-theme-button"
            aria-label="Open settings"
          >
            <SettingsIcon className="icon-md" />
            <span className="sidebar-button-label">Settings</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
