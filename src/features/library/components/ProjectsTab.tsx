import React, { Suspense } from "react";
import { Plus } from "lucide-react";
// Lazy-load ProjectManager so full library UI doesn't eagerly load
const ProjectManager = React.lazy(() =>
  import("./ProjectManager").then((m) => ({ default: m.ProjectManager }))
);
import { ProjectCollapsible } from "./ProjectCollapsible";
import type { ProjectSummary } from "../../../types/services";

export interface ProjectsTabProps {
  projects: ProjectSummary[];
  activeProjectId: string | null;
  viewMode: "grid" | "list";
  variant: "sidebar" | "full";
  scenes?: Array<{
    id: string;
    description: string;
    imageUrl?: string;
    videoUrl?: string;
    projectId?: string;
  }>;
  onSelectProject: (projectId: string) => void;
  onCreateProject?: () => void;
  onManageProject?: (projectId: string) => void | Promise<void>;
  onRenameProject?: (projectId: string, name: string) => Promise<void>;
  onDeleteProject?: (projectId: string) => void | Promise<void>;
  onExportProject?: (projectId: string) => Promise<void>;
  onImportProject?: (file: File) => Promise<void>;
  onOpenManage?: (sceneId: string) => void;
}

/**
 * ProjectsTab component
 * Displays the projects list in the library
 * In sidebar variant, shows collapsible projects with inline assets
 */
export const ProjectsTab: React.FC<ProjectsTabProps> = ({
  projects,
  activeProjectId,
  viewMode,
  variant,
  scenes = [],
  onSelectProject,
  onCreateProject,
  onManageProject,
  onRenameProject,
  onDeleteProject,
  onExportProject,
  onImportProject,
  onOpenManage,
}) => {
  const isSidebarVariant = variant === "sidebar";

  // For sidebar variant, use collapsible mode
  if (isSidebarVariant) {
    // Group scenes by project
    const scenesByProject = scenes.reduce((acc, scene) => {
      const projectId = scene.projectId || activeProjectId;
      if (projectId) {
        if (!acc[projectId]) {
          acc[projectId] = [];
        }
        acc[projectId].push(scene);
      }
      return acc;
    }, {} as Record<string, typeof scenes>);

    // Calculate scene count for each project
    const projectsWithCount = projects.map((project) => ({
      ...project,
      sceneCount: scenesByProject[project.id]?.length || 0,
    }));

    return (
      <div className="flex flex-col h-full">
        {/* New Project button at top */}
        {onCreateProject && (
          <div className="px-2 pt-2 pb-2">
            <button
              type="button"
              onClick={onCreateProject}
              className="w-full btn-base btn-soft-primary flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md"
              aria-label="Create new project"
            >
              <Plus className="icon-sm" />
              <span>New Project</span>
            </button>
          </div>
        )}

        {/* Collapsible projects list */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-2 py-1">
          <div className="flex flex-col gap-1">
            {projectsWithCount.map((project) => (
              <ProjectCollapsible
                key={project.id}
                project={project}
                isActive={project.id === activeProjectId}
                scenes={scenesByProject[project.id] || []}
                onSelectProject={onSelectProject}
                onSelectScene={onOpenManage}
                onManageProject={onManageProject}
                onDeleteProject={onDeleteProject}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // For full variant, use the existing ProjectManager
  return (
    <Suspense
      fallback={
        <div className="p-3 text-xs text-foreground-muted">
          Loading projects…
        </div>
      }
    >
      <ProjectManager
        projects={projects}
        activeProjectId={activeProjectId}
        viewMode="gallery"
        layoutMode={viewMode}
        cardVariant="scene"
        compactList={false}
        onSelectProject={onSelectProject}
        onRenameProject={onRenameProject}
        onDeleteProject={onDeleteProject}
        onExportProject={onExportProject}
        onImportProject={onImportProject}
      />
    </Suspense>
  );
};
