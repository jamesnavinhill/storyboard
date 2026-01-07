import React from "react";
import type { Scene, SceneGroup } from "@/types";
import { GroupBadge } from "@/features/scene/components/GroupBadge";

interface StackedGroupCardProps {
  group: SceneGroup;
  scenes: Scene[];
  onExpand: () => void;
}

const StackedGroupCardComponent: React.FC<StackedGroupCardProps> = ({
  group,
  scenes,
  onExpand,
}) => {
  const firstScene = scenes[0];
  const sceneCount = scenes.length;

  return (
    <div
      className={`group relative ${
        firstScene?.aspectRatio === "9:16" ? "aspect-portrait" : "aspect-video"
      } w-full max-w-full rounded-lg overflow-hidden cursor-pointer transition-colors`}
      style={{
        backgroundColor: "var(--card-bg)",
        border: "1px solid var(--card-border)",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.backgroundColor = "var(--card-hover-bg)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.backgroundColor = "var(--card-bg)")
      }
      onClick={onExpand}
    >
      {/* Preview image from first scene */}
      <div className="absolute inset-0 bg-white/5">
        {firstScene?.videoUrl ? (
          <video
            src={firstScene.videoUrl}
            className="w-full h-full object-contain pointer-events-none"
            muted
          />
        ) : firstScene?.imageUrl ? (
          <img
            src={firstScene.imageUrl}
            alt={group.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ backgroundColor: "var(--card-bg)" }}
          />
        )}
      </div>

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* Stacked indicator (layered cards effect) */}
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        <div
          className="w-12 h-2 rounded-sm transform translate-x-1"
          style={{ backgroundColor: "var(--muted)" }}
        />
        <div
          className="w-12 h-2 rounded-sm transform translate-x-0.5"
          style={{ backgroundColor: "var(--muted)", opacity: 0.8 }}
        />
        <div
          className="w-12 h-2 rounded-sm"
          style={{ backgroundColor: "var(--muted)", opacity: 0.6 }}
        />
      </div>

      {/* Group info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GroupBadge label={group.name} color={group.color ?? undefined} />
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {sceneCount} {sceneCount === 1 ? "scene" : "scenes"}
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onExpand();
            }}
            className="rounded-md px-3 py-1.5 text-xs transition-colors"
            style={{
              border: "1px solid var(--border)",
              backgroundColor: "var(--popover)",
              color: "var(--text-primary)",
            }}
            aria-label={`Expand ${group.name}`}
          >
            Expand
          </button>
        </div>
      </div>

      {/* Hover overlay */}
      <div
        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: "var(--accent)" }}
      >
        <div
          className="text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          Click to expand group
        </div>
      </div>
    </div>
  );
};

export const StackedGroupCard = React.memo(StackedGroupCardComponent);
StackedGroupCard.displayName = "StackedGroupCard";
