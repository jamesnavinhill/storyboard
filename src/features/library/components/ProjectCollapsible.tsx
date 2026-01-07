import React, { useState, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  Image,
  Film,
  File,
} from "lucide-react";
import type { ProjectSummary } from "../../../types/services";
import { ProjectContextMenu } from "./ProjectContextMenu";

export interface ProjectCollapsibleProps {
  project: ProjectSummary & { sceneCount?: number };
  isActive: boolean;
  scenes: Array<{
    id: string;
    description: string;
    imageUrl?: string;
    videoUrl?: string;
  }>;
  onSelectProject: (projectId: string) => void;
  onSelectScene?: (sceneId: string) => void;
  onManageProject?: (projectId: string) => void | Promise<void>;
  onDeleteProject?: (projectId: string) => void | Promise<void>;
}

/**
 * ProjectCollapsible component
 * Displays a collapsible project item with expand/collapse functionality
 * Shows asset count badge and renders asset list with thumbnails when expanded
 */
export const ProjectCollapsible: React.FC<ProjectCollapsibleProps> = ({
  project,
  isActive,
  scenes,
  onSelectProject,
  onSelectScene,
  onManageProject,
  onDeleteProject,
}) => {
  // Load expand/collapse state from localStorage
  const storageKey = `vb:project:${project.id}:expanded`;
  const [isExpanded, setIsExpanded] = useState(() => {
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : false;
  });

  // Persist expand/collapse state to localStorage
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(isExpanded));
  }, [isExpanded, storageKey]);

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleProjectClick = () => {
    onSelectProject(project.id);
  };

  const handleSceneClick = (e: React.MouseEvent, sceneId: string) => {
    e.stopPropagation();
    if (onSelectScene) {
      onSelectScene(sceneId);
    }
  };

  const assetCount = project.sceneCount ?? scenes.length;

  return (
    <div className="flex flex-col">
      {/* Project header */}
      <div
        className={`flex items-center gap-2 text-left px-2 py-1.5 rounded-md border transition-colors ${isActive
          ? "border-soft-primary"
          : "border-transparent"
          }`}
      >
        {/* Expand/collapse icon */}
        <button
          type="button"
          className="flex-shrink-0 p-0.5 hover:bg-white/10 rounded transition-colors"
          onClick={handleToggleExpand}
          aria-label={isExpanded ? "Collapse project" : "Expand project"}
        >
          {isExpanded ? (
            <ChevronDown className="icon-sm" />
          ) : (
            <ChevronRight className="icon-sm" />
          )}
        </button>

        {/* Project selector button - contains icon and name */}
        <button
          type="button"
          className="flex items-center gap-2 flex-1 min-w-0 rounded hover:bg-white/5 transition-colors"
          onClick={handleProjectClick}
          aria-label={`Open project ${project.name}`}
        >
          <Folder className="icon-sm flex-shrink-0" />
          <span className="truncate text-sm flex-1 text-left">{project.name}</span>
        </button>

        {/* Asset count badge */}
        {assetCount > 0 && (
          <span className="flex-shrink-0 text-xs text-muted bg-white/10 px-1.5 py-0.5 rounded">
            {assetCount}
          </span>
        )}

        {/* Context menu */}
        {(onManageProject || onDeleteProject) && (
          <ProjectContextMenu
            projectId={project.id}
            projectName={project.name}
            onManage={onManageProject || (() => { })}
            onDelete={onDeleteProject || (() => { })}
          />
        )}
      </div>

      {/* Asset list (shown when expanded) */}
      {isExpanded && scenes.length > 0 && (
        <div className="ml-6 mt-1 flex flex-col gap-1">
          {scenes.map((scene) => {
            const hasImage = !!scene.imageUrl;
            const hasVideo = !!scene.videoUrl;
            const AssetIcon = hasVideo ? Film : hasImage ? Image : File;

            return (
              <button
                key={scene.id}
                type="button"
                className="flex items-center gap-2 text-left px-2 py-1 rounded-md hover:bg-white/5 border border-transparent transition-colors"
                onClick={(e) => handleSceneClick(e, scene.id)}
                aria-label={`View scene: ${scene.description}`}
              >
                {/* Thumbnail or icon */}
                <div className="flex-shrink-0 w-8 h-8 rounded overflow-hidden bg-white/5 flex items-center justify-center">
                  {scene.imageUrl ? (
                    <img
                      src={scene.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <AssetIcon className="icon-xs text-muted" />
                  )}
                </div>

                {/* Scene description */}
                <span className="truncate text-xs text-muted flex-1">
                  {scene.description}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
