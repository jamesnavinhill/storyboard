import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  DndContext,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import type { Scene, SceneGroup, SceneTag } from "@/types";
import { Image } from "lucide-react";
import { SceneCard } from "./SceneCard";
import { GroupBadge } from "@/features/scene/components/GroupBadge";
import { TagBadge } from "@/features/scene/components/TagBadge";
import { GhostSceneCard } from "./GhostSceneCard";
import { StackedGroupCard } from "./StackedGroupCard";
import { SceneCardPreview } from "./SceneCardPreview";
import { EditModal } from "./EditModal";
import { AnimateModal } from "./AnimateModal";
import { ExtendModal } from "./ExtendModal";
import {
  getStackingPreference,
  setStackingPreference,
} from "@/utils/stackingPreferences";
import { useToast } from "@/components/toast/useToast";
import { listAssets } from "@/services/projectService";

interface StoryboardPanelProps {
  scenes: Scene[];
  totalSceneCount: number;
  groups: SceneGroup[];
  tags: SceneTag[];
  projectId?: string | null;
  onUpdateScene?: (
    sceneId: string,
    updates: Partial<
      { description: string; aspectRatio: "16:9" | "9:16" | "1:1" } & {
        primaryImageAssetId?: string | null;
        primaryVideoAssetId?: string | null;
      }
    >
  ) => Promise<void>;
  activeGroupFilter: string | null;
  activeTagFilter: string | null;
  onGroupFilterChange: (groupId: string | null) => void;
  onTagFilterChange: (tagId: string | null) => void;
  onOpenGroupManager: () => void;
  onOpenTagManager: () => void;
  onChangeSceneGroup: (sceneId: string, groupId: string | null) => void;
  onAddSceneTag: (sceneId: string, tagId: string) => void;
  onRemoveSceneTag: (sceneId: string, tagId: string) => void;
  onDuplicateScene: (sceneId: string) => void;
  onDeleteScene: (sceneId: string) => void;
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
    model: string
  ) => void;
  onSuggestVideoPrompt: (sceneId: string) => Promise<string | null>;
  onSuggestImageEditPrompt: (sceneId: string) => Promise<string | null>;
  onOpenSceneHistory: (sceneId: string) => void;
  onOpenManage: (sceneId: string) => void;
  onReorderScenes?: (sceneIds: string[]) => void;
  isReorderEnabled: boolean;
  allSceneIds: string[];
  onCreateManualScene: (
    description: string,
    aspectRatio: "16:9" | "9:16" | "1:1"
  ) => Promise<string>;
  onCreateAIScene: () => void;
  defaultAspectRatio: "16:9" | "9:16" | "1:1";
  currentSettings: import("@/types").Settings;
}

export const StoryboardPanel: React.FC<StoryboardPanelProps> = ({
  scenes,
  totalSceneCount,
  groups,
  tags,
  projectId,
  onUpdateScene,
  activeGroupFilter,
  activeTagFilter,
  onGroupFilterChange,
  onTagFilterChange,
  onOpenGroupManager,
  onOpenTagManager,
  onChangeSceneGroup,
  onAddSceneTag,
  onRemoveSceneTag,
  onDuplicateScene,
  onDeleteScene,
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
  onOpenSceneHistory,
  onOpenManage,
  onReorderScenes,
  isReorderEnabled,
  allSceneIds,
  onCreateManualScene,
  onCreateAIScene,
  defaultAspectRatio,
  currentSettings,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Track which groups are stacked/expanded
  const [stackedGroups, setStackedGroups] = useState<Set<string>>(new Set());

  // Track active drag ID for overlay
  const [activeId, setActiveId] = useState<string | null>(null);

  // Track drag announcement for screen readers
  const [dragAnnouncement, setDragAnnouncement] = useState<string>("");

  // Modal state management
  const [editModalScene, setEditModalScene] = useState<Scene | null>(null);
  const [animateModalScene, setAnimateModalScene] = useState<Scene | null>(
    null
  );
  const [extendModalScene, setExtendModalScene] = useState<Scene | null>(null);
  const [videoAssetMetadata, setVideoAssetMetadata] = useState<Record<
    string,
    unknown
  > | null>(null);

  // Toast for error notifications
  const { show: showToast } = useToast();

  // Fetch video asset metadata when ExtendModal opens
  useEffect(() => {
    if (!extendModalScene?.videoAssetId || !extendModalScene?.projectId) {
      setVideoAssetMetadata(null);
      return;
    }

    const fetchAssetMetadata = async () => {
      try {
        const assets = await listAssets(extendModalScene.projectId!, {
          sceneId: extendModalScene.id,
          type: "video",
        });
        const videoAsset = assets.find(
          (a) => a.id === extendModalScene.videoAssetId
        );
        if (videoAsset?.metadata) {
          setVideoAssetMetadata(videoAsset.metadata);
        } else {
          setVideoAssetMetadata(null);
        }
      } catch (error) {
        console.error("Failed to fetch video asset metadata:", error);
        setVideoAssetMetadata(null);
      }
    };

    void fetchAssetMetadata();
  }, [extendModalScene]);

  // Load stacking preferences from localStorage on mount
  useEffect(() => {
    if (scenes.length === 0) return;
    const projectId = scenes[0]?.projectId;
    if (!projectId) return;

    const stacked = new Set<string>();
    groups.forEach((group) => {
      if (getStackingPreference(projectId, group.id)) {
        stacked.add(group.id);
      }
    });
    setStackedGroups(stacked);
  }, [groups, scenes]);

  const toggleGroupStacking = useCallback(
    (groupId: string) => {
      const projectId = scenes[0]?.projectId;
      if (!projectId) return;

      setStackedGroups((prev) => {
        const next = new Set(prev);
        const willBeStacked = !next.has(groupId);
        if (willBeStacked) {
          next.add(groupId);
        } else {
          next.delete(groupId);
        }
        setStackingPreference(projectId, groupId, willBeStacked);
        return next;
      });
    },
    [scenes]
  );

  // Modal handlers
  const handleToggleEdit = useCallback(
    (sceneId: string) => {
      const scene = scenes.find((s) => s.id === sceneId);
      if (scene) {
        setEditModalScene(editModalScene?.id === sceneId ? null : scene);
      }
    },
    [scenes, editModalScene]
  );

  const handleToggleAnimate = useCallback(
    (sceneId: string) => {
      const scene = scenes.find((s) => s.id === sceneId);
      if (scene) {
        setAnimateModalScene(animateModalScene?.id === sceneId ? null : scene);
      }
    },
    [scenes, animateModalScene]
  );

  const handleToggleExtend = useCallback(
    (sceneId: string) => {
      const scene = scenes.find((s) => s.id === sceneId);
      if (scene) {
        setExtendModalScene(extendModalScene?.id === sceneId ? null : scene);
      }
    },
    [scenes, extendModalScene]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const sceneId = event.active.id as string;
      setActiveId(sceneId);

      // Announce drag start for screen readers
      const sceneIndex = scenes.findIndex((s) => s.id === sceneId);
      if (sceneIndex !== -1) {
        setDragAnnouncement(
          `Picked up scene ${sceneIndex + 1} of ${
            scenes.length
          }. Use arrow keys to move, Space or Enter to drop, Escape to cancel.`
        );
      }
    },
    [scenes]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      // No valid drop target - drag was cancelled or dropped outside
      if (!over || !onReorderScenes) {
        setDragAnnouncement("");
        return;
      }

      // No reorder needed if dropped on same position
      if (active.id === over.id) {
        const sceneIndex = scenes.findIndex((s) => s.id === active.id);
        setDragAnnouncement(
          `Scene ${sceneIndex + 1} dropped at same position.`
        );
        setTimeout(() => setDragAnnouncement(""), 2000);
        return;
      }

      const oldIndex = scenes.findIndex((scene) => scene.id === active.id);
      const newIndex = scenes.findIndex((scene) => scene.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedScenes: Scene[] = arrayMove(scenes, oldIndex, newIndex);
        const reorderedFilteredIds = reorderedScenes.map((scene) => scene.id);
        const filteredIds = scenes.map((scene) => scene.id);
        const filteredIdSet = new Set(filteredIds);

        let finalSceneIds: string[];
        if (allSceneIds.length === filteredIds.length) {
          finalSceneIds = reorderedFilteredIds;
        } else {
          let replacementIndex = 0;
          finalSceneIds = allSceneIds.map((id) => {
            if (filteredIdSet.has(id)) {
              const nextId = reorderedFilteredIds[replacementIndex];
              replacementIndex += 1;
              return nextId ?? id;
            }
            return id;
          });
        }

        // No need to make a request if order didn't change
        const orderUnchanged = finalSceneIds.every(
          (id, index) => id === allSceneIds[index]
        );
        if (orderUnchanged) {
          setDragAnnouncement("Scene order unchanged.");
          setTimeout(() => setDragAnnouncement(""), 2000);
          return;
        }

        // Announce the move for screen readers
        setDragAnnouncement(
          `Scene moved from position ${oldIndex + 1} to position ${
            newIndex + 1
          }.`
        );
        setTimeout(() => setDragAnnouncement(""), 2000);

        try {
          await onReorderScenes(finalSceneIds);
        } catch (error) {
          console.error("Failed to reorder scenes:", error);
          showToast({
            variant: "error",
            description: "Failed to reorder scenes. Please try again.",
          });
          setDragAnnouncement("Failed to reorder scenes. Please try again.");
          setTimeout(() => setDragAnnouncement(""), 3000);
          // Scene order will revert automatically on next render from parent state
        }
      }
    },
    [scenes, allSceneIds, onReorderScenes, showToast]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);

    // Announce cancellation for screen readers
    setDragAnnouncement("Drag cancelled. Scene returned to original position.");
    setTimeout(() => setDragAnnouncement(""), 2000);
  }, []);

  // Group scenes by their group assignment
  const scenesByGroup = useMemo(() => {
    const grouped = new Map<string | null, Scene[]>();
    scenes.forEach((scene) => {
      const groupId = scene.groupId ?? scene.groupIds?.[0] ?? null;
      if (!grouped.has(groupId)) {
        grouped.set(groupId, []);
      }
      grouped.get(groupId)!.push(scene);
    });
    return grouped;
  }, [scenes]);

  // Build render items (stacked groups or individual scenes)
  const renderItems = useMemo(() => {
    const items: Array<
      | { type: "scene"; scene: Scene }
      | { type: "stacked-group"; group: SceneGroup; scenes: Scene[] }
    > = [];

    // Process groups in order
    const sortedGroups = [...groups].sort(
      (a, b) => a.orderIndex - b.orderIndex
    );
    const processedScenes = new Set<string>();

    sortedGroups.forEach((group) => {
      const groupScenes = scenesByGroup.get(group.id) ?? [];
      if (groupScenes.length === 0) return;

      if (stackedGroups.has(group.id)) {
        // Render as stacked group
        items.push({ type: "stacked-group", group, scenes: groupScenes });
        groupScenes.forEach((s) => processedScenes.add(s.id));
      } else {
        // Render individual scenes
        groupScenes.forEach((scene) => {
          items.push({ type: "scene", scene });
          processedScenes.add(scene.id);
        });
      }
    });

    // Add ungrouped scenes
    const ungroupedScenes = scenesByGroup.get(null) ?? [];
    ungroupedScenes.forEach((scene) => {
      if (!processedScenes.has(scene.id)) {
        items.push({ type: "scene", scene });
      }
    });

    return items;
  }, [scenes, groups, scenesByGroup, stackedGroups]);

  // Filter sortable items to only include individual scene IDs (exclude stacked groups)
  const sortableSceneIds = useMemo(() => {
    return renderItems
      .filter((item) => item.type === "scene")
      .map((item) => item.scene.id);
  }, [renderItems]);

  const filtersActive = Boolean(activeGroupFilter || activeTagFilter);
  const selectedGroup = useMemo(
    () =>
      activeGroupFilter
        ? groups.find((g) => g.id === activeGroupFilter) ?? null
        : null,
    [activeGroupFilter, groups]
  );
  const selectedTag = useMemo(
    () =>
      activeTagFilter
        ? tags.find((t) => t.id === activeTagFilter) ?? null
        : null,
    [activeTagFilter, tags]
  );
  const emptyState = useMemo(() => {
    if (scenes.length > 0) {
      return null;
    }
    if (filtersActive && totalSceneCount > 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted p-8 text-center gap-3">
          <Image className="w-16 h-16 mb-1" />
          <h2 className="text-xl font-semibold">No Scenes Match Filters</h2>
          <p className="max-w-md">
            Adjust your group or tag filters to continue working with the
            storyboard.
          </p>
          <div className="flex items-center gap-2 mt-2">
            {selectedGroup && (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-muted px-3 py-1 text-xs bg-card-hover"
                onClick={() => onGroupFilterChange(null)}
                aria-label={`Clear group filter ${selectedGroup.name}`}
              >
                <span className="opacity-80">Group:</span>
                <span>{selectedGroup.name}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="h-4 w-4 opacity-80"
                >
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
            {selectedTag && (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-muted px-3 py-1 text-xs bg-card-hover"
                onClick={() => onTagFilterChange(null)}
                aria-label={`Clear tag filter ${selectedTag.name}`}
              >
                <span className="opacity-80">Tag:</span>
                <span>{selectedTag.name}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="h-4 w-4 opacity-80"
                >
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
            <button
              type="button"
              className="btn-base btn-soft-primary text-xs px-2 py-1"
              onClick={() => {
                if (activeGroupFilter) onGroupFilterChange(null);
                if (activeTagFilter) onTagFilterChange(null);
              }}
            >
              Clear filters
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="grid storyboard-grid gap-4 md:gap-6 lg:gap-8">
        <GhostSceneCard
          onCreateManual={onCreateManualScene}
          onCreateAI={onCreateAIScene}
          defaultAspectRatio={defaultAspectRatio}
          projectId={projectId}
          onUpdateScene={onUpdateScene}
        />
      </div>
    );
  }, [
    filtersActive,
    scenes.length,
    totalSceneCount,
    onCreateManualScene,
    onCreateAIScene,
    defaultAspectRatio,
    projectId,
    onUpdateScene,
  ]);

  if (emptyState) {
    return <div className="p-2 md:p-3 lg:p-4">{emptyState}</div>;
  }

  return (
    <div className="p-2 md:p-3 lg:p-4">
      {/* Active filter chips and clear control */}
      {filtersActive && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {selectedGroup && (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-muted px-3 py-1 text-xs bg-card-hover"
              onClick={() => onGroupFilterChange(null)}
              aria-label={`Clear group filter ${selectedGroup.name}`}
            >
              <span className="opacity-80">Group:</span>
              <span>{selectedGroup.name}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="h-4 w-4 opacity-80"
              >
                <path
                  d="M18 6L6 18M6 6l12 12"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
          {selectedTag && (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-muted px-3 py-1 text-xs bg-card-hover"
              onClick={() => onTagFilterChange(null)}
              aria-label={`Clear tag filter ${selectedTag.name}`}
            >
              <span className="opacity-80">Tag:</span>
              <span>{selectedTag.name}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="h-4 w-4 opacity-80"
              >
                <path
                  d="M18 6L6 18M6 6l12 12"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
          <button
            type="button"
            className="ml-auto btn-base btn-ghost text-xs px-2 py-1"
            onClick={() => {
              if (activeGroupFilter) onGroupFilterChange(null);
              if (activeTagFilter) onTagFilterChange(null);
            }}
            aria-label="Clear all filters"
          >
            Clear filters
          </button>
        </div>
      )}
      <div className="mb-3" />

      {/* ARIA live region for drag announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {dragAnnouncement}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext
          items={sortableSceneIds}
          strategy={rectSortingStrategy}
        >
          <div className="grid storyboard-grid gap-2 md:gap-3 lg:gap-4">
            {renderItems.map((item, index) => {
              if (item.type === "stacked-group") {
                return (
                  <StackedGroupCard
                    key={`stacked-${item.group.id}`}
                    group={item.group}
                    scenes={item.scenes}
                    onExpand={() => toggleGroupStacking(item.group.id)}
                  />
                );
              }
              // Disable drag for this specific card if a modal is open for it
              const cardDragEnabled =
                isReorderEnabled &&
                Boolean(onReorderScenes) &&
                editModalScene?.id !== item.scene.id &&
                animateModalScene?.id !== item.scene.id &&
                extendModalScene?.id !== item.scene.id;

              return (
                <SceneCard
                  key={item.scene.id}
                  scene={item.scene}
                  availableGroups={groups}
                  availableTags={tags}
                  onChangeGroup={onChangeSceneGroup}
                  onAddTag={onAddSceneTag}
                  onRemoveTag={onRemoveSceneTag}
                  onOpenGroupManager={onOpenGroupManager}
                  onOpenTagManager={onOpenTagManager}
                  onDuplicate={onDuplicateScene}
                  onDelete={onDeleteScene}
                  isDragEnabled={cardDragEnabled}
                  onGenerateImage={onGenerateImage}
                  onRegenerateDescription={onRegenerateDescription}
                  onExportImage={onExportImage}
                  onToggleEdit={handleToggleEdit}
                  onToggleAnimate={handleToggleAnimate}
                  onToggleExtend={handleToggleExtend}
                  onOpenHistory={onOpenSceneHistory}
                  onOpenManage={onOpenManage}
                  onStackGroup={toggleGroupStacking}
                />
              );
            })}
            <GhostSceneCard
              onCreateManual={onCreateManualScene}
              onCreateAI={onCreateAIScene}
              defaultAspectRatio={defaultAspectRatio}
              projectId={projectId}
              onUpdateScene={onUpdateScene}
            />
          </div>
        </SortableContext>

        <DragOverlay dropAnimation={null}>
          {activeId ? (
            <SceneCardPreview scene={scenes.find((s) => s.id === activeId)!} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Modals */}
      {editModalScene && (
        <EditModal
          scene={editModalScene}
          isOpen={true}
          onClose={() => setEditModalScene(null)}
          onSubmit={(sceneId, prompt) => {
            onEditImage(sceneId, prompt);
            setEditModalScene(null);
          }}
          onSuggestPrompt={onSuggestImageEditPrompt}
          isBusy={editModalScene.uiState.activity === "editing-image"}
        />
      )}

      {animateModalScene && (
        <AnimateModal
          scene={animateModalScene}
          isOpen={true}
          onClose={() => setAnimateModalScene(null)}
          onSubmit={(sceneId, prompt, options) => {
            // TODO: Handle file uploads for reference images and last frame
            // For now, just call the existing video generation with prompt
            // The full implementation will be done in later tasks
            onGenerateVideo(sceneId, prompt);
            setAnimateModalScene(null);
          }}
          onSuggestPrompt={onSuggestVideoPrompt}
          isBusy={animateModalScene.uiState.activity === "generating-video"}
          currentSettings={currentSettings}
        />
      )}

      {extendModalScene && (
        <ExtendModal
          scene={extendModalScene}
          isOpen={true}
          onClose={() => {
            setExtendModalScene(null);
            setVideoAssetMetadata(null);
          }}
          onSubmit={(sceneId, prompt, extensionCount, model) => {
            onExtendVideo(sceneId, prompt, extensionCount, model);
            setExtendModalScene(null);
            setVideoAssetMetadata(null);
          }}
          isBusy={extendModalScene.uiState.activity === "generating-video"}
          videoAssetMetadata={videoAssetMetadata}
        />
      )}
    </div>
  );
};
