import { Select } from "@/ui/Select";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Scene, SceneGroup, SceneHistoryEntry, SceneTag } from "@/types";
import {
  X,
  Image,
  Hourglass,
  Grid3x3,
  List,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Badge } from "@/ui/Badge";
import {
  GroupsInlineManager,
  TagsInlineManager,
} from "./GroupsTagsInlineManagers";
import { GroupBadge } from "./GroupBadge";
import { TagBadge } from "./TagBadge";

type TabKey = "details" | "groups-tags" | "history";
type ViewMode = "grid" | "list";
type GroupTagSubTab = "groups" | "tags";

export interface SceneManageDrawerProps {
  // Render mode: fixed overlay drawer (default) or inline panel
  variant?: "drawer" | "panel";
  // For drawer variant: controls visibility. For panel variant: ignored.
  isOpen: boolean;
  scene: Scene | null;
  sceneNumber?: number | null;
  groups: SceneGroup[];
  tags: SceneTag[];
  // Close handler (used in drawer variant). Not used in panel variant.
  onClose: () => void;
  // Optional className to customize container styling in panel variant
  className?: string;
  // For panel variant: controls collapsed state
  isCollapsed?: boolean;
  // For panel variant: toggle collapse handler
  onToggleCollapse?: () => void;
  onUpdateScene: (
    sceneId: string,
    updates: Partial<Pick<Scene, "description" | "aspectRatio">>
  ) => Promise<void> | void;
  onAssignGroup: (sceneId: string, groupId: string | null) => void;
  onAddTag: (sceneId: string, tagId: string) => void;
  onRemoveTag: (sceneId: string, tagId: string) => void;
  onOpenGroupManager: (sceneId?: string | null) => void;
  onOpenTagManager: (sceneId?: string | null) => void;
  onExportImage: (imageUrl: string, description: string) => void;
  // Group CRUD operations
  onCreateGroup?: (payload: {
    name: string;
    color?: string | null;
  }) => Promise<void> | void;
  onUpdateGroup?: (
    groupId: string,
    updates: { name?: string; color?: string | null }
  ) => Promise<void> | void;
  onDeleteGroup?: (groupId: string) => Promise<void> | void;
  onAssignScenesToGroup?: (
    groupId: string,
    sceneIds: string[]
  ) => Promise<void> | void;
  onRemoveScenesFromGroup?: (
    groupId: string,
    sceneIds: string[]
  ) => Promise<void> | void;
  // Tag CRUD operations
  onCreateTag?: (payload: {
    name: string;
    color?: string | null;
  }) => Promise<void> | void;
  onDeleteTag?: (tagId: string) => Promise<void> | void;
  onAssignTagToScene?: (
    sceneId: string,
    tagIds: string[]
  ) => Promise<void> | void;
  onRemoveTagFromScene?: (
    sceneId: string,
    tagIds: string[]
  ) => Promise<void> | void;
  // All scenes for group/tag assignment
  scenes?: Scene[];
  history: {
    entries: SceneHistoryEntry[];
    isLoading: boolean;
    error: string | null;
    onRefresh: () => void;
    onRestore: (historyId: string) => void;
    restoringEntryId: string | null;
  };
  defaultTab?: TabKey;
  groupTagSubTab?: GroupTagSubTab;
  onGroupTagSubTabChange?: (next: GroupTagSubTab) => void;
}

interface ManagerTabContentProps {
  children: React.ReactNode;
  className?: string;
}

const ManagerTabContent: React.FC<ManagerTabContentProps> = ({
  children,
  className = "",
}) => {
  return (
    <div className={`manager-tab-content hide-scrollbar ${className}`}>
      {children}
    </div>
  );
};

const formatAbsoluteTime = (timestamp: string) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(new Date(timestamp));

const formatRelativeTime = (timestamp: string) => {
  const value = new Date(timestamp).getTime();
  if (Number.isNaN(value)) return "";
  const diff = Date.now() - value;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "just now";
  if (diff < hour) {
    const m = Math.round(diff / minute);
    return `${m} minute${m === 1 ? "" : "s"} ago`;
  }
  if (diff < day) {
    const h = Math.round(diff / hour);
    return `${h} hour${h === 1 ? "" : "s"} ago`;
  }
  if (diff < day * 7) {
    const d = Math.round(diff / day);
    return `${d} day${d === 1 ? "" : "s"} ago`;
  }
  return formatAbsoluteTime(timestamp);
};

const getModelFromAsset = (
  asset?: { metadata?: Record<string, unknown> | null } | null
): string | null => {
  if (!asset?.metadata) return null;
  const model = asset.metadata.model;
  return typeof model === "string" ? model : null;
};

export const SceneManageDrawer: React.FC<SceneManageDrawerProps> = ({
  variant = "drawer",
  isOpen,
  scene,
  sceneNumber,
  groups,
  tags,
  onClose,
  className,
  isCollapsed = false,
  onToggleCollapse,
  onUpdateScene,
  onAssignGroup,
  onAddTag,
  onRemoveTag,
  onOpenGroupManager,
  onOpenTagManager,
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
  scenes,
  history,
  defaultTab = "details",
  groupTagSubTab = "groups",
  onGroupTagSubTabChange,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [draftDescription, setDraftDescription] = useState<string>(
    scene?.description ?? ""
  );
  const [draftAspect, setDraftAspect] = useState<"16:9" | "9:16" | "1:1">(
    scene?.aspectRatio ?? "16:9"
  );
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const [activeGroupTagSubTab, setActiveGroupTagSubTab] =
    useState<GroupTagSubTab>(groupTagSubTab);
  const [expandedTagIds, setExpandedTagIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (variant === "drawer" && !isOpen) return;
    setDraftDescription(scene?.description ?? "");
    setDraftAspect(scene?.aspectRatio ?? "16:9");
  }, [variant, isOpen, scene?.id]);

  useEffect(() => {
    if (variant === "drawer" && !isOpen) return;
    setActiveTab(defaultTab);
  }, [defaultTab, variant, isOpen]);

  useEffect(() => {
    setActiveGroupTagSubTab(groupTagSubTab);
  }, [groupTagSubTab]);

  const autoSizeDescription = useCallback(() => {
    const el = descriptionRef.current;
    if (!el) return;
    // Reset height to auto to get accurate scrollHeight
    el.style.height = "auto";
    // Set height to match content without max-height constraint
    el.style.height = `${el.scrollHeight}px`;
    // Always hide overflow since textarea expands to fit content
    el.style.overflowY = "hidden";
    // Remove any max-height constraint
    el.style.maxHeight = "none";
  }, []);

  // Load history when switching to history tab with a scene selected
  useEffect(() => {
    if (
      (variant === "drawer" && !isOpen) ||
      activeTab !== "history" ||
      !scene?.id
    )
      return;
    history.onRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, isOpen, activeTab, scene?.id]);

  useEffect(() => {
    if (variant !== "drawer" || !isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [variant, isOpen, onClose]);

  useEffect(() => {
    if (variant === "drawer" && !isOpen) return;
    autoSizeDescription();
  }, [variant, autoSizeDescription, draftDescription, isOpen]);

  const assignedGroup = useMemo(() => {
    if (!scene) return null;
    const groupId = scene.groupId ?? scene.groupIds?.[0] ?? null;
    if (!groupId) return null;
    return groups.find((g) => g.id === groupId) ?? null;
  }, [scene, groups]);

  const assignedTags = useMemo(() => {
    if (!scene) return [] as SceneTag[];
    const ids = scene.tagIds ?? [];
    return ids
      .map((id) => tags.find((t) => t.id === id) ?? null)
      .filter((t): t is SceneTag => Boolean(t));
  }, [scene, tags]);

  const unassignedTags = useMemo(() => {
    if (!scene) return tags;
    const ids = new Set(scene.tagIds ?? []);
    return tags.filter((t) => !ids.has(t.id));
  }, [scene, tags]);

  const derivedTitle = useMemo(() => {
    if (!scene) return "";
    const base = scene.description?.trim() || "Untitled scene";
    const sentenceEnd = base.indexOf(".");
    const firstSentence = sentenceEnd > 0 ? base.slice(0, sentenceEnd) : base;
    return firstSentence.length > 60
      ? `${firstSentence.slice(0, 57)}…`
      : firstSentence;
  }, [scene?.id, scene?.description]);

  // For drawer variant, hide entirely when not open
  if (variant === "drawer" && !isOpen) return null;

  // Render container differently based on variant
  const Container: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (variant === "drawer") {
      return (
        <div className="pointer-events-none fixed inset-y-0 right-0 z-40 flex max-w-full">
          <aside
            className="pointer-events-auto panel-chat flex h-full w-full max-w-[440px] flex-col border-l border-muted shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Scene manager"
          >
            {children}
          </aside>
        </div>
      );
    }
    // panel variant (inline)
    if (isCollapsed) {
      return (
        <div
          className="flex h-full w-[72px] flex-col border-l border-muted bg-card cursor-pointer"
          aria-label="Scene manager (collapsed)"
          onClick={onToggleCollapse}
        >
          {/* Header with expand icon */}
          <div className="flex items-center justify-center px-3 py-2 border-b border-muted">
            <div className="p-2">
              <ChevronsLeft className="h-5 w-5 text-muted" />
            </div>
          </div>
          <div className="flex-1" />
        </div>
      );
    }
    return (
      <div
        className={
          className ??
          "panel-chat flex h-full w-full flex-col border-l border-muted"
        }
        aria-label="Scene manager"
      >
        {children}
      </div>
    );
  };

  return (
    <Container>
      <div className="manager-panel">
        <div className="manager-tab-navigation flex items-center justify-between px-3 border-b border-muted">
          <div className="flex items-center gap-2">
            <button
              className={`btn-base px-3 py-1.5 text-sm rounded-md btn-ghost hover-primary transition-colors ${
                activeTab === "details" ? "text-primary" : ""
              }`}
              onClick={() => setActiveTab("details")}
            >
              Details
            </button>
            <button
              className={`btn-base px-3 py-1.5 text-sm rounded-md btn-ghost hover-primary transition-colors ${
                activeTab === "groups-tags" ? "text-primary" : ""
              }`}
              onClick={() => setActiveTab("groups-tags")}
            >
              Tags
            </button>
            <button
              className={`btn-base px-3 py-1.5 text-sm rounded-md btn-ghost hover-primary transition-colors ${
                activeTab === "history" ? "text-primary" : ""
              }`}
              onClick={() => setActiveTab("history")}
            >
              History
            </button>
          </div>
          {variant === "drawer" ? (
            <button
              onClick={onClose}
              className="btn-base btn-ghost p-2 rounded-md"
              aria-label="Close scene manager"
            >
              <X className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={onToggleCollapse}
              className="btn-base btn-ghost p-2 rounded-md"
              aria-label="Collapse scene manager"
            >
              {/* When expanded on the right side, point chevrons right to indicate collapse toward the edge */}
              <ChevronsRight className="h-5 w-5" />
            </button>
          )}
        </div>

        {activeTab === "groups-tags" ? (
          <div className="px-3 py-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`btn-base px-3 py-1.5 text-xs rounded-md btn-ghost hover-primary transition-colors ${
                  activeGroupTagSubTab === "groups" ? "text-primary" : ""
                }`}
                onClick={() => {
                  setActiveGroupTagSubTab("groups");
                  onGroupTagSubTabChange?.("groups");
                }}
              >
                Groups
              </button>
              <button
                type="button"
                className={`btn-base px-3 py-1.5 text-xs rounded-md btn-ghost hover-primary transition-colors ${
                  activeGroupTagSubTab === "tags" ? "text-primary" : ""
                }`}
                onClick={() => {
                  setActiveGroupTagSubTab("tags");
                  onGroupTagSubTabChange?.("tags");
                }}
              >
                Tags
              </button>
            </div>
          </div>
        ) : null}

        <div className="manager-tab-container">
          {!scene ? (
            <div className="flex h-full items-center justify-center text-center text-sm text-muted">
              Choose a scene from the storyboard to make edits.
            </div>
          ) : activeTab === "details" ? (
            <ManagerTabContent>
              <div className="form-group">
                <label htmlFor="scene-title" className="form-label">
                  {sceneNumber ? `Scene ${sceneNumber}` : "Scene Title"}
                </label>
                <input
                  id="scene-title"
                  value={derivedTitle}
                  readOnly
                  className="form-input bg-white/5"
                  aria-label="Scene title"
                />
              </div>
              <div className="form-group">
                <div className="aspect-video w-full overflow-hidden rounded-lg bg-white/5">
                  {scene.videoUrl ? (
                    <video
                      src={scene.videoUrl}
                      className="h-full w-full object-contain"
                      muted
                      loop
                      controls
                    />
                  ) : scene.imageUrl ? (
                    <img
                      src={scene.imageUrl}
                      alt={scene.description}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted">
                      No preview
                    </div>
                  )}
                </div>
              </div>
              {(() => {
                const imageAsset = (scene as any).imageAsset;
                const videoAsset = (scene as any).videoAsset;
                const imageModel = getModelFromAsset(imageAsset);
                const videoModel = getModelFromAsset(videoAsset);

                if (!imageModel && !videoModel) return null;

                return (
                  <div className="text-xs text-muted px-1 py-1">
                    {imageModel && <div>Image: {imageModel}</div>}
                    {videoModel && <div>Video: {videoModel}</div>}
                  </div>
                );
              })()}
              <div className="form-group">
                <label htmlFor="scene-description" className="form-label">
                  Description
                </label>
                <textarea
                  id="scene-description"
                  ref={descriptionRef}
                  value={draftDescription}
                  onChange={(e) => setDraftDescription(e.target.value)}
                  className="form-textarea hide-scrollbar"
                  placeholder="Describe the scene..."
                  aria-label="Scene description"
                />
              </div>
              {(assignedGroup || assignedTags.length > 0) && (
                <div className="form-group">
                  <label className="form-label">Groups & Tags</label>
                  <div className="flex flex-wrap gap-2 max-h-[60px] overflow-y-auto hide-scrollbar">
                    {assignedGroup && (
                      <GroupBadge
                        label={assignedGroup.name}
                        color={assignedGroup.color}
                        onRemove={() => onAssignGroup(scene.id, null)}
                      />
                    )}
                    {assignedTags.map((tag) => (
                      <TagBadge
                        key={tag.id}
                        label={tag.name}
                        color={tag.color}
                        onRemove={() => onRemoveTag(scene.id, tag.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Aspect Ratio</label>
                <div className="flex items-center gap-2">
                  <Select
                    value={draftAspect}
                    onChange={(v) =>
                      setDraftAspect(v as "16:9" | "9:16" | "1:1")
                    }
                    options={[
                      { value: "16:9", label: "16:9" },
                      { value: "1:1", label: "1:1 (Square)" },
                      { value: "9:16", label: "9:16" },
                    ]}
                    ariaLabel="Select aspect ratio"
                    title="Select aspect ratio"
                    size="sm"
                  />
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!scene.imageUrl) return;
                        onExportImage(scene.imageUrl!, scene.description);
                      }}
                      disabled={!scene.imageUrl}
                      className="btn-base btn-soft-primary"
                      aria-label="Export scene image"
                    >
                      Export Image
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateScene(scene.id, {
                          description: draftDescription,
                          aspectRatio: draftAspect,
                        })
                      }
                      className="btn-base btn-soft-primary"
                      aria-label="Save scene changes"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </ManagerTabContent>
          ) : activeTab === "groups-tags" ? (
            <ManagerTabContent>
              {activeGroupTagSubTab === "groups" ? (
                onCreateGroup &&
                onUpdateGroup &&
                onDeleteGroup &&
                onAssignScenesToGroup &&
                onRemoveScenesFromGroup &&
                scenes ? (
                  <div className="manager-section">
                    <h3 className="manager-section-header">Groups</h3>
                    <GroupsInlineManager
                      groups={groups}
                      scenes={scenes}
                      onCreateGroup={onCreateGroup}
                      onUpdateGroup={onUpdateGroup}
                      onDeleteGroup={onDeleteGroup}
                      onAssignScenes={onAssignScenesToGroup}
                      onRemoveScenes={onRemoveScenesFromGroup}
                    />
                  </div>
                ) : (
                  <div className="manager-section">
                    <h3 className="manager-section-header">Groups</h3>
                    <div className="form-group">
                      <label className="form-label">Group</label>
                      <div className="input-group">
                        <Select
                          value={assignedGroup?.id ?? ""}
                          onChange={(val) =>
                            onAssignGroup(scene.id, val ? val : null)
                          }
                          options={[
                            { value: "", label: "No group" },
                            ...groups.map((g) => ({
                              value: g.id,
                              label: g.name,
                            })),
                          ]}
                          ariaLabel="Select group"
                          title="Select group"
                          size="sm"
                        />
                        <button
                          type="button"
                          onClick={() => onOpenGroupManager(scene?.id)}
                          className="btn-base btn-outline px-3 py-1.5 text-sm"
                          aria-label="Manage scene groups"
                        >
                          Manage Groups
                        </button>
                      </div>
                      <p className="form-help-text">
                        Assign a group to keep related scenes together and speed
                        up storyboard reviews.
                      </p>
                    </div>
                  </div>
                )
              ) : onCreateTag &&
                onDeleteTag &&
                onAssignTagToScene &&
                onRemoveTagFromScene &&
                scenes ? (
                <div className="manager-section">
                  <h3 className="manager-section-header">Tags</h3>
                  <TagsInlineManager
                    key="tags-inline-manager"
                    tags={tags}
                    scenes={scenes}
                    onCreateTag={onCreateTag}
                    onDeleteTag={onDeleteTag}
                    onAssignTag={onAssignTagToScene}
                    onRemoveTag={onRemoveTagFromScene}
                    expandedTagIds={expandedTagIds}
                    onExpandedTagIdsChange={setExpandedTagIds}
                  />
                </div>
              ) : (
                <div className="manager-section">
                  <h3 className="manager-section-header">Tags</h3>
                  <div className="form-group">
                    <label className="form-label">Tags</label>
                    {assignedTags.length === 0 ? (
                      <p className="text-sm text-muted mb-2">
                        No tags assigned
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {assignedTags.map((tag) => (
                          <Badge
                            key={tag.id}
                            color="primary"
                            variant="soft"
                            className="px-2 py-1"
                            onClose={() => onRemoveTag(scene.id, tag.id)}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="input-group">
                      <Select
                        value={""}
                        onChange={(val) => {
                          if (!val) return;
                          onAddTag(scene.id, val);
                        }}
                        options={[
                          { value: "", label: "Add tag…" },
                          ...unassignedTags.map((t) => ({
                            value: t.id,
                            label: t.name,
                          })),
                        ]}
                        ariaLabel="Add tag to scene"
                        title="Add tag to scene"
                        size="sm"
                      />
                      <button
                        type="button"
                        onClick={() => onOpenTagManager(scene?.id)}
                        className="btn-base btn-outline px-3 py-1.5 text-sm"
                        aria-label="Manage scene tags"
                      >
                        Manage Tags
                      </button>
                    </div>
                    <p className="form-help-text">
                      Tags make it easy to filter scenes for edits, approvals,
                      and exports.
                    </p>
                  </div>
                </div>
              )}
            </ManagerTabContent>
          ) : (
            <ManagerTabContent>
              <div className="manager-section">
                <div className="manager-section-header">
                  <div className="flex items-center justify-between">
                    <h3 className="manager-section-title">Scene History</h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className={`btn-base p-2 btn-ghost hover-primary transition-colors ${
                          viewMode === "grid" ? "text-primary" : ""
                        }`}
                        onClick={() => setViewMode("grid")}
                        aria-label="Show thumbnails"
                      >
                        <Grid3x3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className={`btn-base p-2 btn-ghost hover-primary transition-colors ${
                          viewMode === "list" ? "text-primary" : ""
                        }`}
                        onClick={() => setViewMode("list")}
                        aria-label="Show list"
                      >
                        <List className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {history.isLoading ? (
                <div className="empty-state">
                  <Hourglass className="h-10 w-10 animate-pulse" />
                  <p className="empty-state-text">Loading history…</p>
                </div>
              ) : history.error ? (
                <div className="empty-state">
                  <Image className="h-10 w-10 text-destructive" />
                  <p className="empty-state-text">{history.error}</p>
                  <button
                    type="button"
                    className="btn-base btn-soft-primary px-3 py-1.5 text-sm"
                    onClick={history.onRefresh}
                    aria-label="Retry loading scene history"
                  >
                    Try again
                  </button>
                </div>
              ) : history.entries.length === 0 ? (
                <div className="empty-state">
                  <Hourglass className="h-12 w-12" />
                  <p className="empty-state-text">No history yet</p>
                  <p className="empty-state-subtext">
                    Generate or edit this scene to capture snapshots.
                  </p>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {history.entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-lg overflow-hidden border border-muted bg-white/5"
                    >
                      <div className="aspect-video w-full overflow-hidden bg-white/5">
                        {entry.imageUrl ? (
                          <img
                            src={entry.imageUrl}
                            alt={entry.description}
                            className="h-full w-full object-contain"
                          />
                        ) : entry.videoUrl ? (
                          <video
                            src={entry.videoUrl}
                            className="h-full w-full object-contain"
                            muted
                            loop
                            playsInline
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-white/5 text-[11px] tracking-wide uppercase text-muted">
                            <span>No preview</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3 p-3">
                        <div className="flex items-center justify-between text-xs text-muted">
                          <span>{formatRelativeTime(entry.createdAt)}</span>
                          <span>{formatAbsoluteTime(entry.createdAt)}</span>
                        </div>
                        <p className="text-sm leading-snug text-foreground line-clamp-3">
                          {entry.description}
                        </p>
                        <button
                          type="button"
                          className="btn-base btn-soft-primary w-full py-1.5 text-sm"
                          onClick={() => history.onRestore(entry.id)}
                          disabled={Boolean(history.restoringEntryId)}
                          aria-label={`Restore scene to this version from ${formatRelativeTime(
                            entry.createdAt
                          )}`}
                        >
                          {history.restoringEntryId === entry.id
                            ? "Restoring…"
                            : "Restore"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="history-list">
                  {history.entries.map((entry) => (
                    <div key={entry.id} className="history-entry">
                      <div className="flex items-start gap-3">
                        <div className="relative h-16 w-24 overflow-hidden rounded-md">
                          {entry.imageUrl ? (
                            <img
                              src={entry.imageUrl}
                              alt={entry.description}
                              className="h-full w-full object-contain"
                            />
                          ) : entry.videoUrl ? (
                            <video
                              src={entry.videoUrl}
                              className="h-full w-full object-contain"
                              muted
                              loop
                              playsInline
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-white/5 text-[11px] tracking-wide uppercase text-muted">
                              <span>No preview</span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="history-entry-header">
                            <span className="history-action">
                              {formatRelativeTime(entry.createdAt)}
                            </span>
                            <span className="history-time">
                              {formatAbsoluteTime(entry.createdAt)}
                            </span>
                          </div>
                          <p className="history-details line-clamp-2">
                            {entry.description}
                          </p>
                          <button
                            type="button"
                            className="btn-base btn-soft-primary mt-2 px-3 py-1 text-xs"
                            onClick={() => history.onRestore(entry.id)}
                            disabled={Boolean(history.restoringEntryId)}
                            aria-label={`Restore scene to this version from ${formatRelativeTime(
                              entry.createdAt
                            )}`}
                          >
                            {history.restoringEntryId === entry.id
                              ? "Restoring…"
                              : "Restore"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ManagerTabContent>
          )}
        </div>
      </div>
    </Container>
  );
};
