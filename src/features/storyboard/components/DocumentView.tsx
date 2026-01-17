import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Save, AlertCircle } from "lucide-react";
import type { Scene, SceneGroup, Settings } from "@/types";
import type { ProjectSummary } from "@/types/services";
import { useAutosave } from "@/hooks/useAutosave";

interface DocumentViewProps {
  projectId: string;
  project: ProjectSummary | null;
  scenes: Scene[];
  groups: SceneGroup[];
  settings: Settings;
  onUpdateScene: (
    sceneId: string,
    updates: Partial<{
      description: string;
      aspectRatio: "16:9" | "9:16" | "1:1";
    }>
  ) => Promise<void>;
  onUpdateProject: (updates: {
    name?: string;
    description?: string;
  }) => Promise<void>;
  onUpdateSettings: (updates: Partial<Settings>) => Promise<void>;
}

interface DocumentContent {
  projectName: string;
  projectDescription: string;
  workflow: string;
  sceneCount: number;
  scenes: Array<{
    id: string;
    order: number;
    description: string;
    groupName?: string;
  }>;
}

/**
 * DocumentView component displays project content in an editable text format
 * Shows project metadata, style information, and all scene prompts
 * Supports standard text editing operations (copy, paste, undo)
 */
export const DocumentView: React.FC<DocumentViewProps> = ({
  projectId,
  project,
  scenes,
  groups,
  settings,
  onUpdateScene,
  onUpdateProject,
  onUpdateSettings,
}) => {
  // Parse scenes into document content
  const initialContent = useMemo((): DocumentContent => {
    const sortedScenes = [...scenes].sort(
      (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
    );

    return {
      projectName: project?.name || "Untitled Project",
      projectDescription: project?.description || "",
      workflow: settings.workflow || "music-video",
      sceneCount: scenes.length,
      scenes: sortedScenes.map((scene, index) => {
        const group = groups.find((g) => g.id === scene.groupId);
        return {
          id: scene.id,
          order: index + 1,
          description: scene.description,
          groupName: group?.name,
        };
      }),
    };
  }, [project, scenes, groups, settings]);

  // Local editable content
  const [content, setContent] = useState<DocumentContent>(initialContent);
  const [hasEdits, setHasEdits] = useState(false);

  // Update local content when props change (but only if no unsaved edits)
  useEffect(() => {
    if (!hasEdits) {
      setContent(initialContent);
    }
  }, [initialContent, hasEdits]);

  // Convert content back to updates
  const saveChanges = useCallback(
    async (data: DocumentContent) => {
      try {
        // Update project metadata if changed
        if (
          data.projectName !== initialContent.projectName ||
          data.projectDescription !== initialContent.projectDescription
        ) {
          await onUpdateProject({
            name: data.projectName,
            description: data.projectDescription,
          });
        }

        // Update workflow if changed
        if (data.workflow !== initialContent.workflow) {
          await onUpdateSettings({
            workflow: data.workflow as Settings["workflow"],
          });
        }

        // Update scene descriptions if changed
        const updatePromises = data.scenes.map((sceneData, index) => {
          const originalScene = initialContent.scenes[index];
          if (
            originalScene &&
            sceneData.id === originalScene.id &&
            sceneData.description !== originalScene.description
          ) {
            return onUpdateScene(sceneData.id, {
              description: sceneData.description,
            });
          }
          return Promise.resolve();
        });

        await Promise.all(updatePromises);
        setHasEdits(false);
      } catch (error) {
        console.error("Failed to save document changes:", error);
        throw error;
      }
    },
    [initialContent, onUpdateProject, onUpdateSettings, onUpdateScene]
  );

  // Autosave hook
  const { isSaving, lastSaved, error, forceSave } = useAutosave({
    data: content,
    onSave: saveChanges,
    delay: 2000,
    enabled: hasEdits,
  });

  // Handle content changes
  const handleProjectNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setContent((prev) => ({ ...prev, projectName: e.target.value }));
      setHasEdits(true);
    },
    []
  );

  const handleProjectDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setContent((prev) => ({ ...prev, projectDescription: e.target.value }));
      setHasEdits(true);
    },
    []
  );

  const handleWorkflowChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setContent((prev) => ({ ...prev, workflow: e.target.value }));
      setHasEdits(true);
    },
    []
  );

  const handleSceneDescriptionChange = useCallback(
    (sceneId: string, newDescription: string) => {
      setContent((prev) => ({
        ...prev,
        scenes: prev.scenes.map((scene) =>
          scene.id === sceneId
            ? { ...scene, description: newDescription }
            : scene
        ),
      }));
      setHasEdits(true);
    },
    []
  );

  // Force save on unmount if there are pending changes
  useEffect(() => {
    return () => {
      if (hasEdits) {
        void forceSave();
      }
    };
  }, [hasEdits, forceSave]);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-muted">No project selected</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header with save indicator */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-muted">
        <h2 className="text-lg font-semibold">Document View</h2>
        <div className="flex items-center gap-2 text-sm">
          {isSaving && (
            <div className="flex items-center gap-2 text-muted">
              <Save className="w-4 h-4 animate-pulse" />
              <span>Saving...</span>
            </div>
          )}
          {!isSaving && lastSaved && (
            <div className="text-muted">
              Saved {new Date(lastSaved).toLocaleTimeString()}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span>Failed to save</span>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Project Metadata Section */}
          <section className="space-y-4">
            <h3 className="text-xl font-bold text-foreground border-b border-muted pb-2">
              Project Information
            </h3>
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="project-name"
                  className="block text-sm font-medium text-muted mb-1"
                >
                  Project Name
                </label>
                <input
                  id="project-name"
                  type="text"
                  value={content.projectName}
                  onChange={handleProjectNameChange}
                  className="w-full px-3 py-2 bg-card border border-muted rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <label
                  htmlFor="project-description"
                  className="block text-sm font-medium text-muted mb-1"
                >
                  Description
                </label>
                <textarea
                  id="project-description"
                  value={content.projectDescription}
                  onChange={handleProjectDescriptionChange}
                  rows={3}
                  className="w-full px-3 py-2 bg-card border border-muted rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                  placeholder="Enter project description"
                />
              </div>
            </div>
          </section>

          {/* Style Information Section */}
          <section className="space-y-4">
            <h3 className="text-xl font-bold text-foreground border-b border-muted pb-2">
              Style & Settings
            </h3>
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="workflow"
                  className="block text-sm font-medium text-muted mb-1"
                >
                  Workflow
                </label>
                <select
                  id="workflow"
                  value={content.workflow}
                  onChange={handleWorkflowChange}
                  className="w-full px-3 py-2 bg-card border border-muted rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="music-video">Music Video</option>
                  <option value="product-commercial">Product Commercial</option>
                  <option value="viral-social">Viral Social</option>
                  <option value="explainer-video">Explainer Video</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-sm font-medium text-muted mb-1">
                    Total Scenes
                  </span>
                  <div className="px-3 py-2 bg-muted/20 border border-muted rounded-md text-foreground">
                    {content.sceneCount}
                  </div>
                </div>
                <div>
                  <span className="block text-sm font-medium text-muted mb-1">
                    Image Model
                  </span>
                  <div className="px-3 py-2 bg-muted/20 border border-muted rounded-md text-foreground text-sm">
                    {settings.imageModel}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Scenes Section */}
          <section className="space-y-4">
            <h3 className="text-xl font-bold text-foreground border-b border-muted pb-2">
              Scenes ({content.scenes.length})
            </h3>
            <div className="space-y-6">
              {content.scenes.map((scene) => (
                <div
                  key={scene.id}
                  className="border border-muted rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground">
                      Scene {scene.order}
                    </h4>
                    {scene.groupName && (
                      <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                        {scene.groupName}
                      </span>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor={`scene-${scene.id}`}
                      className="block text-sm font-medium text-muted mb-1"
                    >
                      Description
                    </label>
                    <textarea
                      id={`scene-${scene.id}`}
                      value={scene.description}
                      onChange={(e) =>
                        handleSceneDescriptionChange(scene.id, e.target.value)
                      }
                      rows={4}
                      className="w-full px-3 py-2 bg-card border border-muted rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y font-mono text-sm"
                      placeholder="Enter scene description"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
