/**
 * Feature Component: SceneCard (formerly DesktopSceneCard)
 *
 * This is a feature-specific component with business logic for the storyboard feature.
 * Feature components live in src/features/[feature]/components/ and can import from:
 * - UI primitives (@/ui/)
 * - Shared components (@/components/)
 * - Other components within the same feature (relative imports)
 *
 * Feature components CANNOT import from other features to maintain clear boundaries.
 */
import React, { useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Scene, SceneGroup, SceneTag } from "@/types";
import {
  Image,
  Film,
  Pencil,
  RefreshCw,
  Download,
  X,
  GripVertical,
  Hourglass,
  Settings,
  Trash,
  Copy,
} from "lucide-react";
import { Loader } from "@/components/Loader";
import { useToast } from "@/components/toast/useToast";
import { GroupBadge } from "@/features/scene/components/GroupBadge";
import { TagBadge } from "@/features/scene/components/TagBadge";

interface SceneCardProps {
  scene: Scene;
  onGenerateImage: (id: string) => void;
  onRegenerateDescription: (id: string) => void;
  onExportImage: (imageUrl: string, sceneDescription: string) => void;
  onToggleEdit: (id: string) => void;
  onToggleAnimate: (id: string) => void;
  onToggleExtend: (id: string) => void;
  /** Optional: allow parent to trigger an edit flow with a prompt */
  onEditImage?: (prompt: string) => void;
  /** Optional: allow parent to trigger video generation with a prompt */
  onGenerateVideo?: (prompt: string) => void;
  /** Optional: fetch a suggested prompt for video generation */
  onSuggestVideoPrompt?: () => Promise<string | null>;
  /** Optional: fetch a suggested prompt for image edit */
  onSuggestImageEditPrompt?: () => Promise<string | null>;
  availableGroups: SceneGroup[];
  availableTags: SceneTag[];
  onChangeGroup: (sceneId: string, groupId: string | null) => void;
  onAddTag: (sceneId: string, tagId: string) => void;
  onRemoveTag: (sceneId: string, tagId: string) => void;
  onOpenGroupManager: () => void;
  onOpenTagManager: () => void;
  onDuplicate: (sceneId: string) => void;
  onDelete: (sceneId: string) => void;
  onOpenHistory: (sceneId: string) => void;
  onOpenManage: (sceneId: string) => void;
  isDragEnabled: boolean;
  onStackGroup?: (groupId: string) => void;
}

interface MenuPosition {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

/**
 * Calculate context menu position with viewport boundary detection
 * Ensures menu stays visible near viewport edges
 */
const calculateMenuPosition = (
  triggerRect: DOMRect,
  menuHeight: number,
  menuWidth: number
): MenuPosition => {
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  const position: MenuPosition = {};
  const SPACING = 4; // Gap between trigger and menu

  // Vertical positioning
  const spaceBelow = viewport.height - triggerRect.bottom;
  const spaceAbove = triggerRect.top;

  if (spaceBelow >= menuHeight || spaceBelow >= spaceAbove) {
    // Position below trigger
    position.top = triggerRect.bottom + SPACING;
  } else {
    // Position above trigger
    position.bottom = viewport.height - triggerRect.top + SPACING;
  }

  // Horizontal positioning
  const spaceRight = viewport.width - triggerRect.right;
  const spaceLeft = triggerRect.left;

  if (spaceRight >= menuWidth) {
    // Position to the right of trigger
    position.left = triggerRect.right;
  } else if (spaceLeft >= menuWidth) {
    // Position to the left of trigger
    position.right = viewport.width - triggerRect.left;
  } else {
    // Not enough space on either side, align to right edge with padding
    position.right = 8;
  }

  return position;
};

const SceneCardComponent: React.FC<SceneCardProps> = ({
  scene,
  onGenerateImage,
  onRegenerateDescription,
  onExportImage,
  onToggleEdit,
  onToggleAnimate,
  onToggleExtend,
  availableGroups,
  availableTags,
  onChangeGroup,
  onAddTag,
  onRemoveTag,
  onOpenGroupManager,
  onOpenTagManager,
  onDuplicate,
  onDelete,
  onOpenHistory,
  onOpenManage,
  isDragEnabled,
  onStackGroup,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState(false);
  const [menuPosition, setMenuPosition] = React.useState<MenuPosition>({});
  const { show } = useToast();
  const menuButtonRef = React.useRef<HTMLButtonElement | null>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: scene.id, disabled: !isDragEnabled });

  const isGeneratingImage = scene.uiState.activity === "generating-image";
  const isEditingImage = scene.uiState.activity === "editing-image";
  const isGeneratingVideo = scene.uiState.activity === "generating-video";
  const isRegeneratingPrompt = scene.uiState.activity === "regenerating-prompt";
  const errorState = scene.uiState.lastError;

  // Controls should be visible when hovered or menu is open
  const shouldShowControls = isHovered || menuOpen;

  /**
   * Determine if video playback controls should be shown
   * Hide controls when any overlay is active (menu or details)
   * Show only on hover when no overlays are active
   */
  const shouldShowVideoControls = (): boolean => {
    // Hide video controls when any overlay is active
    if (menuOpen || showDetails) {
      return false;
    }
    // Show only on hover
    return isHovered;
  };

  let errorActionLabel: string | null = null;
  let errorActionHandler: (() => void) | null = null;
  if (errorState?.canRetry) {
    switch (errorState.kind) {
      case "image-generation":
        errorActionLabel = "Retry Image";
        errorActionHandler = () => onGenerateImage(scene.id);
        break;
      case "regenerate-description":
        errorActionLabel = "Retry Prompt";
        errorActionHandler = () => onRegenerateDescription(scene.id);
        break;
      case "asset-missing":
        if (scene.imageStatus === "missing") {
          errorActionLabel = "Generate Image";
          errorActionHandler = () => onGenerateImage(scene.id);
        } else if (scene.videoStatus === "missing") {
          errorActionLabel = "Animate Scene";
          errorActionHandler = () => onToggleAnimate(scene.id);
        }
        break;
      case "image-edit":
        errorActionLabel = "Open Edit Modal";
        errorActionHandler = () => onToggleEdit(scene.id);
        break;
      case "video-generation":
        errorActionLabel = "Open Animate Modal";
        errorActionHandler = () => onToggleAnimate(scene.id);
        break;
      default:
        break;
    }
  }

  const menuRef = React.useRef<HTMLDivElement | null>(null);

  const hasMedia = Boolean(scene.imageUrl || scene.videoUrl);
  const assignedGroup = useMemo(
    () =>
      availableGroups.find(
        (group) => group.id === (scene.groupId ?? scene.groupIds?.[0])
      ) ?? null,
    [availableGroups, scene.groupId, scene.groupIds]
  );
  const assignedTags = useMemo(
    () =>
      (scene.tagIds ?? [])
        .map((tagId) => availableTags.find((tag) => tag.id === tagId) ?? null)
        .filter((tag): tag is SceneTag => Boolean(tag)),
    [availableTags, scene.tagIds]
  );
  const unassignedTags = useMemo(
    () => availableTags.filter((tag) => !(scene.tagIds ?? []).includes(tag.id)),
    [availableTags, scene.tagIds]
  );

  // Compute visible badges for details panel (max 3, groups first then tags)
  const visibleBadges = useMemo(() => {
    const allBadges: Array<{
      type: "group" | "tag";
      data: SceneGroup | SceneTag;
    }> = [];

    // Add group badge first
    if (assignedGroup) {
      allBadges.push({ type: "group", data: assignedGroup });
    }

    // Add tag badges
    assignedTags.forEach((tag) => {
      allBadges.push({ type: "tag", data: tag });
    });

    const visible = allBadges.slice(0, 3);
    const remaining = allBadges.slice(3);

    // Build tooltip text for remaining badges
    let tooltipText = "";
    if (remaining.length > 0) {
      const remainingGroups = remaining
        .filter((b) => b.type === "group")
        .map((b) => b.data.name);
      const remainingTags = remaining
        .filter((b) => b.type === "tag")
        .map((b) => b.data.name);

      const parts: string[] = [];
      if (remainingGroups.length > 0) {
        parts.push(`Groups: ${remainingGroups.join(", ")}`);
      }
      if (remainingTags.length > 0) {
        parts.push(`Tags: ${remainingTags.join(", ")}`);
      }
      tooltipText = parts.join("; ");
    }

    return {
      visible,
      remaining: Math.max(0, allBadges.length - 3),
      tooltipText,
    };
  }, [assignedGroup, assignedTags]);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  // Emit toast when a new error occurs for this scene
  React.useEffect(() => {
    if (!errorState) return;
    const variant: "error" | "warning" | "info" | "success" = "error";
    const action =
      errorActionHandler && errorActionLabel
        ? { label: errorActionLabel, onClick: errorActionHandler }
        : undefined;
    const lines = [errorState.message];
    if (errorState.requestId) {
      lines.push(`Request ID: ${errorState.requestId}`);
    }
    const description = lines.join("\n");
    const docAction =
      !action && errorState.docLink && typeof window !== "undefined"
        ? {
            label: "View Docs",
            onClick: () => {
              try {
                window.open(errorState.docLink!, "_blank", "noopener");
              } catch {
                /* no-op */
              }
            },
          }
        : undefined;
    show({ description, variant, action: action ?? docAction });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorState?.occurredAt]);

  const cardStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={cardStyle}
      {...attributes}
      className={`scene-card group relative w-full max-w-full rounded-lg overflow-hidden ${
        scene.aspectRatio === "9:16" ? "aspect-portrait" : "aspect-video"
      } ${menuOpen ? "menu-open" : ""} ${showDetails ? "details-open" : ""}`}
      data-card-bg
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* media */}
      <div className="absolute inset-0 bg-white/5">
        {scene.videoUrl ? (
          <video
            src={scene.videoUrl}
            className="w-full h-full object-contain"
            controls={shouldShowVideoControls()}
            loop
            muted
            onPlay={() => {
              if (scene.uiState.autoplayPending) {
                try {
                  const ev = new CustomEvent("scene:clearAutoplayPending", {
                    detail: { sceneId: scene.id },
                  });
                  window.dispatchEvent(ev);
                } catch {
                  /* no-op */
                }
              }
            }}
            autoPlay={Boolean(scene.uiState.autoplayPending)}
          />
        ) : scene.imageUrl ? (
          <img
            src={scene.imageUrl}
            alt={scene.description}
            className="w-full h-full object-contain"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ backgroundColor: "var(--card-bg)" }}
          />
        )}
      </div>

      {/* loading */}
      {(isGeneratingImage ||
        isEditingImage ||
        isGeneratingVideo ||
        isRegeneratingPrompt) && (
        <div className="overlay-center overlay-dark flex-col gap-2">
          <Loader />
          <span className="text-white text-sm">
            {isGeneratingVideo
              ? "Animating..."
              : isEditingImage
              ? "Editing..."
              : isRegeneratingPrompt
              ? "Regenerating..."
              : "Generating..."}
          </span>
        </div>
      )}

      {/* initial generate */}
      {!hasMedia && !isGeneratingImage && !isRegeneratingPrompt && (
        <div className="overlay-center overlay-dark">
          <button
            type="button"
            onClick={() => onGenerateImage(scene.id)}
            className="btn-base btn-primary flex items-center px-4 py-2 font-semibold"
            aria-label="Generate image for scene"
          >
            <Image className="icon-md mr-2" />
            Generate
          </button>
        </div>
      )}

      {/* hover controls (top) */}
      <div
        className={`scene-card-controls absolute top-3 left-3 right-3 z-20 ${
          shouldShowControls ? "force-visible" : ""
        }`}
      >
        <div className="flex items-center gap-2">
          {isDragEnabled && (
            <button
              type="button"
              {...listeners}
              aria-label="Drag to reorder scene"
              className={`icon-btn-overlay p-2 touch-visible ${
                isDragging ? "cursor-grabbing" : "cursor-grab"
              }`}
            >
              <GripVertical className="icon-md" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowDetails((s) => !s)}
            aria-label={showDetails ? "Hide details" : "Show details"}
            className="icon-btn-overlay p-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon-md"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.5 12s4.5-7.5 9.5-7.5S21.5 12 21.5 12 17 19.5 12 19.5 2.5 12 2.5 12z"
              />
              <circle cx="12" cy="12" r="3" strokeWidth="1.5" />
            </svg>
          </button>

          {/* history icon removed per drawer plan; history accessible via Manage drawer */}
        </div>

        <div ref={menuRef} className="group/menu absolute top-0 right-0">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => {
              if (!menuOpen && menuButtonRef.current) {
                // Calculate position when opening menu
                const rect = menuButtonRef.current.getBoundingClientRect();
                const MENU_WIDTH = 192; // 48 * 4 = 192px (w-48)
                const MENU_HEIGHT = 400; // Approximate height
                const pos = calculateMenuPosition(
                  rect,
                  MENU_HEIGHT,
                  MENU_WIDTH
                );
                setMenuPosition(pos);
              }
              setMenuOpen((s) => !s);
            }}
            aria-label="More"
            className="icon-btn-overlay p-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon-md"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {menuOpen && (
            <div
              className="rounded-lg shadow-lg p-2 w-48"
              style={{
                position: "fixed",
                zIndex: "var(--z-dropdown)",
                backgroundColor: "var(--popover)",
                border: "1px solid var(--card-border)",
                top:
                  menuPosition.top !== undefined
                    ? `${menuPosition.top}px`
                    : undefined,
                bottom:
                  menuPosition.bottom !== undefined
                    ? `${menuPosition.bottom}px`
                    : undefined,
                left:
                  menuPosition.left !== undefined
                    ? `${menuPosition.left}px`
                    : undefined,
                right:
                  menuPosition.right !== undefined
                    ? `${menuPosition.right}px`
                    : undefined,
              }}
              role="menu"
            >
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onToggleEdit(scene.id);
                }}
                className="menu-item flex items-center"
                role="menuitem"
              >
                <Pencil className="icon-sm mr-2" /> Edit
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onToggleAnimate(scene.id);
                }}
                className="menu-item flex items-center"
                role="menuitem"
              >
                <Film className="icon-sm mr-2" /> Animate
              </button>

              {scene.videoUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onToggleExtend(scene.id);
                  }}
                  className="menu-item flex items-center"
                  role="menuitem"
                >
                  <Hourglass className="icon-sm mr-2" /> Extend
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenManage(scene.id);
                }}
                className="menu-item flex items-center"
                role="menuitem"
              >
                <Settings className="icon-sm mr-2" /> Manage
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onRegenerateDescription(scene.id);
                }}
                className="menu-item flex items-center"
                role="menuitem"
              >
                <RefreshCw className="icon-sm mr-2" /> Rerun Prompt
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onGenerateImage(scene.id);
                }}
                className="menu-item flex items-center"
                role="menuitem"
              >
                <RefreshCw className="icon-sm mr-2" /> Regenerate Image
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onExportImage(scene.imageUrl!, scene.description);
                }}
                disabled={!scene.imageUrl}
                className="menu-item flex items-center"
                role="menuitem"
              >
                <Download className="icon-sm mr-2" /> Export
              </button>

              <div className="divider-y" />

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDuplicate(scene.id);
                }}
                className="menu-item flex items-center"
                role="menuitem"
              >
                <Copy className="icon-sm mr-2" /> Duplicate Scene
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  // lightweight confirm for safety
                  const ok = window.confirm(
                    "Delete this scene? This cannot be undone."
                  );
                  if (ok) {
                    onDelete(scene.id);
                  }
                }}
                className="menu-item text-danger flex items-center"
                role="menuitem"
              >
                <Trash className="icon-sm mr-2" /> Delete Scene
              </button>

              {assignedGroup && onStackGroup && (
                <>
                  <div className="divider-y" />
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onStackGroup(assignedGroup.id);
                    }}
                    className="menu-item"
                    role="menuitem"
                  >
                    Stack Group
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* details (bottom) */}
      {showDetails && (
        <div className="absolute bottom-0 left-0 right-0 p-4 overlay-darker text-white z-10">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-uppercase-xs text-primary">
                  Scene {scene.id.substring(0, 4)}
                </p>
                {(visibleBadges.visible.length > 0 ||
                  visibleBadges.remaining > 0) && (
                  <div className="flex flex-wrap gap-1 items-start justify-end">
                    {visibleBadges.visible.map((badge, idx) =>
                      badge.type === "group" ? (
                        <GroupBadge
                          key={`group-${badge.data.id}`}
                          label={badge.data.name}
                          color={badge.data.color}
                        />
                      ) : (
                        <TagBadge
                          key={`tag-${badge.data.id}`}
                          label={badge.data.name}
                          color={badge.data.color}
                        />
                      )
                    )}
                    {visibleBadges.remaining > 0 && (
                      <span
                        className="inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-semibold bg-white/15 text-white"
                        title={visibleBadges.tooltipText}
                        aria-label={`${visibleBadges.remaining} more groups and tags`}
                      >
                        +{visibleBadges.remaining}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <p className="text-sm mt-1">{scene.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* bottom overlays removed per drawer plan */}

      {/* inline error banner removed in favor of toasts */}
    </div>
  );
};

export const SceneCard = React.memo(SceneCardComponent);
SceneCard.displayName = "SceneCard";
