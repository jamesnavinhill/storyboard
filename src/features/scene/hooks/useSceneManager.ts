import { useState, useCallback, useMemo } from "react";
import { useSceneHistory } from "./useSceneHistory";
import type { Scene, SceneGroup, SceneTag, SceneHistoryEntry } from "../../../types";

export type SceneManagerTab = "details" | "groups-tags" | "history";
export type GroupTagTab = "groups" | "tags";

export interface SceneManagerState {
  // Selection
  selectedSceneId: string | null;
  selectedScene: Scene | null;
  sceneNumber: number | null;

  // Drawer state
  isManagerOpen: boolean;
  activeTab: SceneManagerTab;
  groupTagSubTab: GroupTagTab;

  // History
  historyEntries: SceneHistoryEntry[];
  isHistoryLoading: boolean;
  historyError: string | null;
  restoringHistoryId: string | null;

  // Actions
  openManager: (
    sceneId: string,
    options?: { tab?: SceneManagerTab; groupTagSubTab?: GroupTagTab }
  ) => void;
  closeManager: () => void;
  setActiveTab: (tab: SceneManagerTab) => void;
  setGroupTagSubTab: (tab: GroupTagTab) => void;
  refreshHistory: () => Promise<void>;
  restoreFromHistory: (historyId: string) => Promise<void>;
}

export interface UseSceneManagerOptions {
  scenes: Scene[];
  loadSceneHistory: (sceneId: string) => Promise<SceneHistoryEntry[]>;
  restoreSceneFromHistory: (
    sceneId: string,
    historyId: string
  ) => Promise<void>;
  isSceneManagerCollapsed: boolean;
  toggleSceneManagerCollapse: () => void;
}

export const useSceneManager = (
  options: UseSceneManagerOptions
): SceneManagerState => {
  const {
    scenes,
    loadSceneHistory,
    restoreSceneFromHistory,
    isSceneManagerCollapsed,
    toggleSceneManagerCollapse,
  } = options;

  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SceneManagerTab>("details");
  const [groupTagSubTab, setGroupTagSubTab] = useState<GroupTagTab>("groups");

  // Use dedicated history hook
  const history = useSceneHistory({
    sceneId: selectedSceneId,
    loadSceneHistory,
    restoreSceneFromHistory,
  });

  const openManager = useCallback(
    (
      sceneId: string,
      options?: { tab?: SceneManagerTab; groupTagSubTab?: GroupTagTab }
    ) => {
      setSelectedSceneId(sceneId);

      // Auto-expand scene manager if collapsed
      if (isSceneManagerCollapsed) {
        toggleSceneManagerCollapse();
      }

      if (options?.tab) {
        setActiveTab(options.tab);
      } else {
        // If currently on library tab, switch to details
        setActiveTab((prev) => (prev === "details" ? prev : "details"));
      }

      if (options?.groupTagSubTab) {
        setGroupTagSubTab(options.groupTagSubTab);
      }
    },
    [isSceneManagerCollapsed, toggleSceneManagerCollapse]
  );

  const closeManager = useCallback(() => {
    setSelectedSceneId(null);
    history.clear();
  }, [history]);

  // Compute derived state
  const selectedScene = useMemo(
    () => scenes.find((s) => s.id === selectedSceneId) ?? null,
    [scenes, selectedSceneId]
  );

  const sceneNumber = useMemo(() => {
    if (!selectedSceneId) return null;
    const index = scenes.findIndex((s) => s.id === selectedSceneId);
    return index >= 0 ? index + 1 : null;
  }, [selectedSceneId, scenes]);

  return {
    selectedSceneId,
    selectedScene,
    sceneNumber,
    isManagerOpen: selectedSceneId !== null,
    activeTab,
    groupTagSubTab,
    historyEntries: history.entries,
    isHistoryLoading: history.isLoading,
    historyError: history.error,
    restoringHistoryId: history.restoringEntryId,
    openManager,
    closeManager,
    setActiveTab,
    setGroupTagSubTab,
    refreshHistory: history.refresh,
    restoreFromHistory: history.restore,
  };
};
