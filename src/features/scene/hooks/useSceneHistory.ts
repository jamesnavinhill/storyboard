import { useState, useCallback, useEffect } from "react";
import { useToast } from "../../../components/toast/useToast";
import type { SceneHistoryEntry } from "../../../types";

const formatHistoryTimestamp = (timestamp: string) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(new Date(timestamp));

export interface SceneHistoryState {
  entries: SceneHistoryEntry[];
  isLoading: boolean;
  error: string | null;
  restoringEntryId: string | null;
  refresh: () => Promise<void>;
  restore: (historyId: string) => Promise<void>;
  clear: () => void;
}

export interface UseSceneHistoryOptions {
  sceneId: string | null;
  loadSceneHistory: (sceneId: string) => Promise<SceneHistoryEntry[]>;
  restoreSceneFromHistory: (
    sceneId: string,
    historyId: string
  ) => Promise<void>;
}

export const useSceneHistory = (
  options: UseSceneHistoryOptions
): SceneHistoryState => {
  const { sceneId, loadSceneHistory, restoreSceneFromHistory } = options;
  const { show: showToast } = useToast();

  const [entries, setEntries] = useState<SceneHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoringEntryId, setRestoringEntryId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!sceneId) return;
    setIsLoading(true);
    setError(null);
    try {
      const historyEntries = await loadSceneHistory(sceneId);
      setEntries(historyEntries);
    } catch (error) {
      console.error("Failed to load scene history", error);
      setError(
        "We couldn't load the history for this scene. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [loadSceneHistory, sceneId]);

  const restore = useCallback(
    async (historyId: string) => {
      if (!sceneId) return;
      setRestoringEntryId(historyId);
      try {
        await restoreSceneFromHistory(sceneId, historyId);
        const entry = entries.find((e) => e.id === historyId);
        showToast({
          variant: "success",
          description: `Scene restored${
            entry ? ` (${formatHistoryTimestamp(entry.createdAt)})` : ""
          }`,
        });
        await refresh();
      } catch (error) {
        console.error("Failed to restore scene history", error);
        showToast({
          variant: "error",
          description: "We couldn't restore that snapshot. Please try again.",
        });
      } finally {
        setRestoringEntryId(null);
      }
    },
    [sceneId, entries, refresh, showToast, restoreSceneFromHistory]
  );

  const clear = useCallback(() => {
    setEntries([]);
    setError(null);
    setRestoringEntryId(null);
  }, []);

  // Clear history when scene changes
  useEffect(() => {
    setEntries([]);
    setError(null);
    setRestoringEntryId(null);
  }, [sceneId]);

  return {
    entries,
    isLoading,
    error,
    restoringEntryId,
    refresh,
    restore,
    clear,
  };
};
