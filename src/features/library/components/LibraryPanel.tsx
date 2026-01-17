import React from "react";
import { LibraryToolbar } from "./LibraryToolbar";
import { ProjectsTab } from "./ProjectsTab";
import { AssetsTab } from "./AssetsTab";
import type { ProjectSummary } from "../../../types/services";
import type { Scene } from "../../../types";

export interface LibraryPanelProps {
  // Variant determines the layout and controls shown
  variant: "sidebar" | "full";

  // Library state
  activeTab: "projects" | "assets" | "document";
  onTabChange: (tab: "projects" | "assets" | "document") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;

  // Data
  projects: ProjectSummary[];
  scenes: Array<{ id: string; description: string }>;
  activeProjectId: string | null;

  // Project actions
  onSelectProject: (projectId: string) => void;
  onCreateProject?: () => void;
  onManageProject?: (projectId: string) => void | Promise<void>;
  onRenameProject?: (projectId: string, name: string) => Promise<void>;
  onDeleteProject?: (projectId: string) => void | Promise<void>;
  onExportProject?: (projectId: string) => Promise<void>;
  onImportProject?: (file: File) => Promise<void>;

  // Asset actions
  onOpenSceneHistory?: (sceneId: string) => void;
  onOpenManage?: (sceneId: string) => void;
  historySceneId?: string | null;
}

/**
 * LibraryPanel component with toolbar and tab rendering
 * Extracted from AppShell's renderLibraryPanel function
 */
export const LibraryPanel: React.FC<LibraryPanelProps> = ({
  variant,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  projects,
  scenes,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onManageProject,
  onRenameProject,
  onDeleteProject,
  onExportProject,
  onImportProject,
  onOpenSceneHistory,
  onOpenManage,
  historySceneId,
}) => {
  const isSidebarVariant = variant === "sidebar";

  const containerClasses = isSidebarVariant
    ? "flex h-full flex-col overflow-hidden"
    : "library-surface flex h-full flex-col overflow-hidden";

  return (
    <div className={containerClasses}>
      {/* Toolbar with tab selection, search, and view controls (only for full variant) */}
      {!isSidebarVariant && (
        <LibraryToolbar
          variant={variant}
          activeTab={activeTab}
          onTabChange={onTabChange}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
        />
      )}

      {/* Content area */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Sidebar variant always shows projects in collapsible mode */}
        {isSidebarVariant ? (
          <ProjectsTab
            projects={projects}
            activeProjectId={activeProjectId}
            viewMode={viewMode}
            variant={variant}
            scenes={scenes}
            onSelectProject={onSelectProject}
            onCreateProject={onCreateProject}
            onManageProject={onManageProject}
            onRenameProject={onRenameProject}
            onDeleteProject={onDeleteProject}
            onExportProject={onExportProject}
            onImportProject={onImportProject}
            onOpenManage={onOpenManage}
          />
        ) : activeTab === "projects" ? (
          <ProjectsTab
            projects={projects}
            activeProjectId={activeProjectId}
            viewMode={viewMode}
            variant={variant}
            scenes={scenes}
            onSelectProject={onSelectProject}
            onCreateProject={onCreateProject}
            onManageProject={onManageProject}
            onRenameProject={onRenameProject}
            onDeleteProject={onDeleteProject}
            onExportProject={onExportProject}
            onImportProject={onImportProject}
            onOpenManage={onOpenManage}
          />
        ) : (
          // AssetsTab receives projectId directly from activeProjectId prop
          // No intermediate state transformations - direct prop flow ensures
          // gallery view always reflects the app-level active project
          <AssetsTab
            projectId={activeProjectId}
            scenes={scenes}
            viewMode={viewMode}
            variant={variant}
            searchQuery={searchQuery}
            onOpenSceneHistory={onOpenSceneHistory}
            onOpenManage={onOpenManage}
            historySceneId={historySceneId}
          />
        )}
      </div>
    </div>
  );
};
