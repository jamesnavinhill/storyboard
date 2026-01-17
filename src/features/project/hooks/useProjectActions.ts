import { useCallback } from "react";
import type { ProjectSummary } from "../../../types/services";

export interface ProjectActions {
  // CRUD operations
  createProject: (name?: string) => Promise<ProjectSummary>;
  renameProject: (projectId: string, name: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  
  // Import/Export
  exportProject: (projectId: string) => Promise<void>;
  importProject: (file: File) => Promise<void>;
  
  // Project selection
  selectProject: (projectId: string) => Promise<void>;
}

export interface UseProjectActionsOptions {
  createProject: (name?: string) => Promise<ProjectSummary>;
  renameProject: (projectId: string, name: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  exportProject: (projectId: string) => Promise<void>;
  importProject: (file: File) => Promise<void>;
  selectProject: (projectId: string) => Promise<void>;
  projectsLength: number;
  onProjectCreated?: () => void;
  onProjectSelected?: () => void;
}

/**
 * Hook that provides project CRUD operations and import/export functionality.
 * Extracts project-related handlers from AppShell to follow single-responsibility principle.
 */
export const useProjectActions = (
  options: UseProjectActionsOptions
): ProjectActions => {
  const {
    createProject: createProjectFn,
    renameProject: renameProjectFn,
    deleteProject: deleteProjectFn,
    exportProject: exportProjectFn,
    importProject: importProjectFn,
    selectProject: selectProjectFn,
    projectsLength,
    onProjectCreated,
    onProjectSelected,
  } = options;

  const handleStartNewProject = useCallback(async (name?: string): Promise<ProjectSummary> => {
    if (
      !window.confirm(
        "Start a new project? Your current storyboard and chat history will remain saved, and a new project will be created."
      )
    ) {
      throw new Error("Project creation cancelled");
    }
    try {
      const suggestedName = `Project ${projectsLength + 1}`;
      const inputName = name ?? window
        .prompt("Name your project", suggestedName)
        ?.trim();
      const projectName =
        inputName && inputName.length > 0 ? inputName : suggestedName;
      const project = await createProjectFn(projectName);
      onProjectCreated?.();
      return project;
    } catch (error) {
      console.error("Failed to create project", error);
      throw error;
    }
  }, [createProjectFn, projectsLength, onProjectCreated]);

  const selectProject = useCallback(
    async (projectId: string) => {
      await selectProjectFn(projectId);
      onProjectSelected?.();
    },
    [selectProjectFn, onProjectSelected]
  );

  const renameProject = useCallback(
    async (projectId: string, name: string) => {
      await renameProjectFn(projectId, name);
    },
    [renameProjectFn]
  );

  const deleteProject = useCallback(
    async (projectId: string) => {
      await deleteProjectFn(projectId);
    },
    [deleteProjectFn]
  );

  const exportProject = useCallback(
    async (projectId: string) => {
      await exportProjectFn(projectId);
    },
    [exportProjectFn]
  );

  const importProject = useCallback(
    async (file: File) => {
      await importProjectFn(file);
    },
    [importProjectFn]
  );

  return {
    createProject: handleStartNewProject,
    renameProject,
    deleteProject,
    exportProject,
    importProject,
    selectProject,
  };
};
