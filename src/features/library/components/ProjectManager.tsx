import React, { useState, useCallback, useRef } from "react";
import type { ProjectSummary } from "@/types/services";
import {
  Search,
  Grid3x3,
  List,
  Upload,
  Folder,
  Pencil,
  Trash2,
  Download,
} from "lucide-react";
import { useSearchState } from "@/hooks/useSearchState";

interface ProjectManagerProps {
  projects: Project[];
  activeProjectId: string | null;
  viewMode: "gallery" | "drawer";
  layoutMode?: "grid" | "list";
  cardVariant?: "default" | "scene";
  // Compact list strips cards/actions and renders a simple list row (used in sidebar)
  compactList?: boolean;
  onSelectProject: (projectId: string) => void;
  onRenameProject?: (projectId: string, name: string) => Promise<void>;
  onDeleteProject?: (projectId: string) => void | Promise<void>;
  onExportProject?: (projectId: string) => Promise<void>;
  onImportProject?: (file: File) => Promise<void>;
}

interface Project extends ProjectSummary {
  sceneCount?: number;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  projects,
  activeProjectId,
  viewMode,
  layoutMode = "grid",
  cardVariant = "default",
  compactList = false,
  onSelectProject,
  onRenameProject,
  onDeleteProject,
  onExportProject,
  onImportProject,
}) => {
  const { query: searchQuery, setQuery: setSearchQuery } = useSearchState({
    storageKey: "vb:library:projects:search",
    initial: "",
  });
  const [listViewMode, setListViewMode] = useState<"grid" | "list">("grid");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredProjects =
    viewMode === "gallery"
      ? projects
      : projects.filter((project) =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const handleRename = useCallback(
    async (projectId: string) => {
      if (!editingName.trim() || !onRenameProject) {
        setEditingId(null);
        return;
      }
      await onRenameProject(projectId, editingName.trim());
      setEditingId(null);
    },
    [editingName, onRenameProject]
  );

  const handleDelete = useCallback(
    async (project: Project) => {
      if (!onDeleteProject) return;
      if (
        window.confirm(
          `Delete "${project.name}"? This action cannot be undone.`
        )
      ) {
        await onDeleteProject(project.id);
      }
    },
    [onDeleteProject]
  );

  const handleImport = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!onImportProject) return;
      const file = event.target.files?.[0];
      if (file) {
        await onImportProject(file);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [onImportProject]
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  // Gallery mode - just the grid of project cards (like storyboard)
  if (viewMode === "gallery") {
    const galleryProjects = filteredProjects;
    const renderCard = (project: Project) => {
      const isActive = project.id === activeProjectId;
      const baseClasses =
        cardVariant === "scene"
          ? "group relative aspect-[16/9] w-full bg-white/5 rounded-lg overflow-hidden cursor-pointer transition-colors"
          : "group relative aspect-[16/9] w-full max-w-full bg-white/5 rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md";
      const highlightClasses = isActive
        ? "border border-soft-primary bg-primary-soft"
        : "hover:bg-white/10 border border-transparent";

      return (
        <div
          key={project.id}
          className={`${baseClasses} ${highlightClasses}`}
          onClick={() => onSelectProject(project.id)}
        >
          <div className="absolute inset-0 flex flex-col justify-between p-4">
            <div>
              <h3 className="text-lg font-semibold truncate text-foreground">
                {project.name}
              </h3>
              {project.description && (
                <p className="text-sm text-muted mt-1 line-clamp-2">
                  {project.description}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-muted">
              <span>{formatDate(project.updatedAt)}</span>
              {project.sceneCount !== undefined && (
                <span>{project.sceneCount} scenes</span>
              )}
            </div>
          </div>

          {(onRenameProject || onExportProject || onDeleteProject) && (
            <div className="absolute top-3 right-3 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {onRenameProject && (
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setEditingId(project.id);
                    setEditingName(project.name);
                  }}
                  className="icon-btn-overlay p-2"
                  aria-label="Rename project"
                >
                  <Pencil className="icon-sm" />
                </button>
              )}
              {onExportProject && (
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onExportProject(project.id);
                  }}
                  className="icon-btn-overlay p-2"
                  aria-label="Export project"
                >
                  <Download className="icon-sm" />
                </button>
              )}
              {onDeleteProject && (
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDelete(project);
                  }}
                  className="icon-btn-overlay p-2"
                  aria-label="Delete project"
                >
                  <Trash2 className="icon-sm" />
                </button>
              )}
            </div>
          )}

          {editingId === project.id && (
            <div className="absolute inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-xs space-y-3">
                <input
                  type="text"
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                  className="w-full rounded-md border border-muted bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                  onClick={(event) => event.stopPropagation()}
                  placeholder="Project name"
                  aria-label="Project name"
                  title="Edit project name"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="btn-base btn-ghost px-3 py-1 text-sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      setEditingId(null);
                      setEditingName(project.name);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-base btn-soft-primary px-3 py-1 text-sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleRename(project.id);
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="p-2 md:p-3 lg:p-4">
        {galleryProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Folder className="w-16 h-16 mb-4" />
            <p className="text-lg">No projects yet</p>
          </div>
        ) : layoutMode === "list" ? (
          compactList ? (
            <div className="flex flex-col">
              {galleryProjects.map((project) => {
                const isActive = project.id === activeProjectId;
                return (
                  <button
                    key={project.id}
                    className={`flex items-center gap-2 text-left px-2 py-1 rounded-md hover:bg-white/5 border ${isActive
                        ? "border-soft-primary bg-primary-soft"
                        : "border-transparent"
                      }`}
                    onClick={() => onSelectProject(project.id)}
                    aria-label={`Open project ${project.name}`}
                  >
                    <Folder className="icon-sm" />
                    <span className="truncate text-sm">{project.name}</span>
                    {typeof project.sceneCount === "number" && (
                      <span className="ml-auto text-xs text-muted">
                        {project.sceneCount} scenes
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {galleryProjects.map((project) => {
                const isActive = project.id === activeProjectId;
                return (
                  <div
                    key={project.id}
                    className={`group flex flex-col gap-2 rounded-lg bg-white/5 p-4 transition-colors hover:bg-white/10 cursor-pointer border ${isActive
                        ? "border-soft-primary bg-primary-soft"
                        : "border-transparent"
                      }`}
                    onClick={() => onSelectProject(project.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold truncate">
                          {project.name}
                        </h3>
                        {project.description && (
                          <p className="mt-1 text-sm text-muted line-clamp-2">
                            {project.description}
                          </p>
                        )}
                      </div>
                      {(onRenameProject ||
                        onExportProject ||
                        onDeleteProject) && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onRenameProject && (
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setEditingId(project.id);
                                  setEditingName(project.name);
                                }}
                                className="icon-btn-overlay p-2"
                                aria-label="Rename project"
                              >
                                <Pencil className="icon-sm" />
                              </button>
                            )}
                            {onExportProject && (
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onExportProject(project.id);
                                }}
                                className="icon-btn-overlay p-2"
                                aria-label="Export project"
                              >
                                <Download className="icon-sm" />
                              </button>
                            )}
                            {onDeleteProject && (
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleDelete(project);
                                }}
                                className="icon-btn-overlay p-2"
                                aria-label="Delete project"
                              >
                                <Trash2 className="icon-sm" />
                              </button>
                            )}
                          </div>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                      <span>{formatDate(project.updatedAt)}</span>
                      {project.sceneCount !== undefined && (
                        <span>{project.sceneCount} scenes</span>
                      )}
                    </div>
                    {editingId === project.id && (
                      <div className="flex flex-col gap-2 rounded-md bg-black/50 p-3">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(event) =>
                            setEditingName(event.target.value)
                          }
                          onClick={(event) => event.stopPropagation()}
                          className="w-full rounded-md border border-muted bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                          autoFocus
                          placeholder="Project name"
                          aria-label="Project name"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="btn-base btn-ghost px-3 py-1 text-sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              setEditingId(null);
                              setEditingName(project.name);
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="btn-base btn-soft-primary px-3 py-1 text-sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleRename(project.id);
                            }}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="grid storyboard-grid gap-4 md:gap-6 lg:gap-8">
            {galleryProjects.map((project) => renderCard(project))}
          </div>
        )}
      </div>
    );
  }

  // Drawer mode - full controls with search, actions, etc.
  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 p-4 border-b border-muted">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-md text-muted-foreground" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setListViewMode("grid")}
              className={`btn-base p-2 btn-ghost hover-primary transition-colors ${listViewMode === "grid" ? "text-primary" : ""
                }`}
              aria-label="Grid view"
            >
              <Grid3x3 className="icon-md" />
            </button>
            <button
              onClick={() => setListViewMode("list")}
              className={`btn-base p-2 btn-ghost hover-primary transition-colors ${listViewMode === "list" ? "text-primary" : ""
                }`}
              aria-label="List view"
            >
              <List className="icon-md" />
            </button>
          </div>
          {onImportProject && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-base btn-soft-primary flex items-center px-3 py-2 text-sm ml-auto"
              >
                <Upload className="icon-md mr-2" />
                Import
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={handleImport}
                className="hidden"
                aria-label="Import project file"
              />
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Folder className="w-16 h-16 mb-4" />
            <p className="text-lg">
              {searchQuery ? "No projects found" : "No projects yet"}
            </p>
          </div>
        ) : listViewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-3">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className={`group relative bg-background border rounded-lg p-3 cursor-pointer transition-all hover:shadow-sm ${project.id === activeProjectId
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-muted"
                  }`}
                onClick={() => onSelectProject(project.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    {editingId === project.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => handleRename(project.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleRename(project.id);
                          } else if (e.key === "Escape") {
                            setEditingId(null);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        className="w-full px-2 py-1 text-sm font-semibold bg-background border border-muted rounded focus:outline-none focus:ring-2 focus:ring-ring"
                        aria-label="Edit project name"
                      />
                    ) : (
                      <h3 className="text-sm font-semibold truncate">
                        {project.name}
                      </h3>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onRenameProject && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(project.id);
                          setEditingName(project.name);
                        }}
                        className="icon-btn p-2"
                        aria-label="Rename"
                      >
                        <Pencil className="icon-sm" />
                      </button>
                    )}
                    {onExportProject && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onExportProject(project.id);
                        }}
                        className="icon-btn p-2"
                        aria-label="Export"
                      >
                        <Download className="icon-sm" />
                      </button>
                    )}
                    {onDeleteProject && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(project);
                        }}
                        className="icon-btn p-2 text-destructive hover:text-destructive"
                        aria-label="Delete"
                      >
                        <Trash2 className="icon-sm" />
                      </button>
                    )}
                  </div>
                </div>
                {project.description && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {project.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatDate(project.updatedAt)}</span>
                  {project.sceneCount !== undefined && (
                    <span>{project.sceneCount} scenes</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className={`group flex items-center justify-between bg-background border rounded-lg p-3 cursor-pointer transition-all hover:shadow-sm ${project.id === activeProjectId
                    ? "border-soft-primary bg-primary-soft"
                    : "border-transparent"
                  }`}
                onClick={() => onSelectProject(project.id)}
              >
                <div className="flex-1 min-w-0">
                  {editingId === project.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleRename(project.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleRename(project.id);
                        } else if (e.key === "Escape") {
                          setEditingId(null);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                      className="w-full px-2 py-1 text-sm font-semibold bg-background border border-muted rounded focus:outline-none focus:ring-2 focus:ring-ring"
                      aria-label="Edit project name"
                      placeholder="Project name"
                      title="Edit project name"
                    />
                  ) : (
                    <div>
                      <h3 className="text-sm font-semibold truncate">
                        {project.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{formatDate(project.updatedAt)}</span>
                        {project.sceneCount !== undefined && (
                          <span>{project.sceneCount} scenes</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onRenameProject && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(project.id);
                        setEditingName(project.name);
                      }}
                      className="icon-btn p-2"
                      aria-label="Rename"
                    >
                      <Pencil className="icon-sm" />
                    </button>
                  )}
                  {onExportProject && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onExportProject(project.id);
                      }}
                      className="icon-btn p-2"
                      aria-label="Export"
                    >
                      <Download className="icon-sm" />
                    </button>
                  )}
                  {onDeleteProject && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(project);
                      }}
                      className="icon-btn p-2 text-destructive hover:text-destructive"
                      aria-label="Delete"
                    >
                      <Trash2 className="icon-sm" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
