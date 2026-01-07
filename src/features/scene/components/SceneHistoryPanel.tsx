import React, { useMemo } from "react";
import type { Scene, SceneHistoryEntry } from "@/types";
import { Hourglass, Grid3x3, List, RefreshCw, X, Image } from "lucide-react";

type ViewMode = "grid" | "list";

interface SceneHistoryPanelProps {
  isOpen: boolean;
  scene: Scene | null;
  sceneNumber?: number | null;
  entries: SceneHistoryEntry[];
  isLoading: boolean;
  error: string | null;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onClose: () => void;
  onRefresh: () => void;
  onRestore: (historyId: string) => void;
  restoringEntryId: string | null;
}

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
  if (Number.isNaN(value)) {
    return "";
  }
  const diff = Date.now() - value;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) {
    return "just now";
  }
  if (diff < hour) {
    const minutes = Math.round(diff / minute);
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }
  if (diff < day) {
    const hours = Math.round(diff / hour);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  if (diff < day * 7) {
    const days = Math.round(diff / day);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }
  return formatAbsoluteTime(timestamp);
};

const renderPreview = (entry: SceneHistoryEntry): React.ReactNode => {
  if (entry.imageUrl) {
    return (
      <img
        src={entry.imageUrl}
        alt={entry.description}
        className="h-full w-full object-contain"
        loading="lazy"
      />
    );
  }
  if (entry.videoUrl) {
    return (
      <video
        src={entry.videoUrl}
        className="h-full w-full object-contain"
        muted
        loop
        playsInline
      />
    );
  }
  return (
    <div className="flex h-full w-full items-center justify-center bg-white/5 text-[11px] tracking-wide uppercase text-muted">
      <span>No preview</span>
    </div>
  );
};

export const SceneHistoryPanel: React.FC<SceneHistoryPanelProps> = ({
  isOpen,
  scene,
  sceneNumber,
  entries,
  isLoading,
  error,
  viewMode,
  onViewModeChange,
  onClose,
  onRefresh,
  onRestore,
  restoringEntryId,
}) => {
  const hasEntries = entries.length > 0;

  const headerDescription = useMemo(() => {
    if (!scene) {
      return "Select a scene to view earlier snapshots.";
    }
    if (!hasEntries) {
      return "Snapshots appear here after you generate or edit this scene.";
    }
    return "Restore earlier generations without leaving the storyboard.";
  }, [hasEntries, scene]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        aria-label="Close history drawer"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="relative z-50 flex h-full w-full max-w-[400px] flex-col border-l border-muted bg-background shadow-2xl sm:max-w-[420px]">
        <div className="flex items-start justify-between gap-3 border-b border-muted p-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted">
              <Hourglass className="h-4 w-4" />
              <span>Scene History</span>
            </div>
            <h2 className="mt-1 text-base font-semibold leading-snug line-clamp-2">
              {scene ? scene.description : "No scene selected"}
            </h2>
            {sceneNumber ? (
              <p className="text-xs text-muted">Scene {sceneNumber}</p>
            ) : null}
            <p className="mt-1 text-xs text-muted">{headerDescription}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`btn-base p-2 btn-ghost hover-primary transition-colors ${
                viewMode === "grid" ? "text-primary" : ""
              }`}
              aria-label="Show thumbnails"
              title="Show thumbnails"
              onClick={() => onViewModeChange("grid")}
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={`btn-base p-2 btn-ghost hover-primary transition-colors ${
                viewMode === "list" ? "text-primary" : ""
              }`}
              aria-label="Show list"
              title="Show list"
              onClick={() => onViewModeChange("list")}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="btn-base p-2 btn-ghost"
              onClick={onRefresh}
              disabled={isLoading}
              aria-label="Refresh history"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="btn-base p-2 btn-ghost"
              onClick={onClose}
              aria-label="Close history panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-muted">
              <Hourglass className="h-10 w-10 animate-pulse" />
              <p className="text-sm">Loading history…</p>
            </div>
          ) : error ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <Image className="h-10 w-10 text-destructive" />
              <p className="text-sm text-muted">{error}</p>
              <button
                type="button"
                className="btn-base btn-soft-primary px-3 py-1.5 text-sm"
                onClick={onRefresh}
              >
                Try again
              </button>
            </div>
          ) : !hasEntries ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted">
              <Hourglass className="h-12 w-12" />
              <p className="text-sm">
                No history yet. Generate or edit this scene to capture
                snapshots.
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid gap-3">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="overflow-hidden rounded-lg border border-muted bg-white/5"
                >
                  <div className="aspect-video w-full overflow-hidden">
                    {renderPreview(entry)}
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
                      onClick={() => onRestore(entry.id)}
                      disabled={Boolean(restoringEntryId)}
                    >
                      {restoringEntryId === entry.id ? "Restoring…" : "Restore"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 rounded-lg border border-muted bg-white/5 p-3"
                >
                  <div className="relative h-16 w-24 overflow-hidden rounded-md">
                    {renderPreview(entry)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span>{formatRelativeTime(entry.createdAt)}</span>
                      <span>{formatAbsoluteTime(entry.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm leading-snug text-foreground line-clamp-2">
                      {entry.description}
                    </p>
                    <button
                      type="button"
                      className="btn-base btn-soft-primary mt-2 px-3 py-1 text-xs"
                      onClick={() => onRestore(entry.id)}
                      disabled={Boolean(restoringEntryId)}
                    >
                      {restoringEntryId === entry.id ? "Restoring…" : "Restore"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-muted p-3 text-xs text-muted">
          Restore replaces the current scene content with the snapshot you pick.
        </div>
      </aside>
    </div>
  );
};
