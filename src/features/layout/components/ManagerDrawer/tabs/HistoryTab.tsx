import React from "react";
import type { Scene, SceneHistoryEntry } from "@/types";

export interface HistoryTabProps {
  selectedScene: Scene | null;
  viewMode: "grid" | "list";
  history: {
    entries: SceneHistoryEntry[];
    isLoading: boolean;
    error: string | null;
    onRefresh: () => void;
    onRestore: (historyId: string) => void | Promise<void>;
    restoringEntryId: string | null;
  };
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

export const HistoryTab: React.FC<HistoryTabProps> = ({
  selectedScene,
  viewMode,
  history,
}) => {
  if (!selectedScene) {
    return (
      <div className="h-full flex items-center justify-center text-muted">
        Select a scene to view history.
      </div>
    );
  }

  if (history.isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted p-8">
        <span className="text-sm">Loading history…</span>
      </div>
    );
  }

  if (history.error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center p-8">
        <p className="text-sm text-muted">{history.error}</p>
        <button
          type="button"
          className="btn-base btn-soft-primary px-3 py-1.5 text-sm"
          onClick={history.onRefresh}
        >
          Try again
        </button>
      </div>
    );
  }

  if (history.entries.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted p-8">
        <p className="text-sm">No history yet.</p>
      </div>
    );
  }

  if (viewMode === "grid") {
    return (
      <div className="flex flex-col gap-3">
        <div className="grid gap-3">
          {history.entries.map((entry) => (
            <div
              key={entry.id}
              className="overflow-hidden rounded-lg border border-muted bg-white/5"
            >
              <div className="aspect-video w-full overflow-hidden">
                {entry.imageUrl ? (
                  <img
                    src={entry.imageUrl}
                    alt={entry.description}
                    className="h-full w-full object-cover"
                  />
                ) : entry.videoUrl ? (
                  <video
                    src={entry.videoUrl}
                    className="h-full w-full object-cover"
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
                >
                  {history.restoringEntryId === entry.id
                    ? "Restoring…"
                    : "Restore"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {history.entries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-start gap-3 rounded-lg border border-muted bg-white/5 p-3"
        >
          <div className="relative h-16 w-24 overflow-hidden rounded-md">
            {entry.imageUrl ? (
              <img
                src={entry.imageUrl}
                alt={entry.description}
                className="h-full w-full object-cover"
              />
            ) : entry.videoUrl ? (
              <video
                src={entry.videoUrl}
                className="h-full w-full object-cover"
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
              onClick={() => history.onRestore(entry.id)}
              disabled={Boolean(history.restoringEntryId)}
            >
              {history.restoringEntryId === entry.id ? "Restoring…" : "Restore"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
