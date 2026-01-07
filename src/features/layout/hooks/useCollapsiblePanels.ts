import { useState, useCallback } from "react";
import { LAYOUT_STORAGE_KEYS } from "../utils/layoutConstants";
import type { CollapsiblePanels } from "../types";

/**
 * Helper to load boolean from localStorage
 */
const loadStoredBoolean = (key: string, fallback: boolean): boolean => {
  if (typeof window === "undefined") {
    return fallback;
  }
  const stored = window.localStorage.getItem(key);
  return stored === "1";
};

/**
 * Hook to manage collapse states for all panels
 * Loads initial values from localStorage and provides toggle functions
 */
export const useCollapsiblePanels = (): CollapsiblePanels => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(() =>
    loadStoredBoolean(LAYOUT_STORAGE_KEYS.sidebarCollapsed, false)
  );

  const [isChatCollapsed, setChatCollapsed] = useState(() =>
    loadStoredBoolean(LAYOUT_STORAGE_KEYS.chatCollapsed, false)
  );

  const [isStoryboardCollapsed, setStoryboardCollapsed] = useState(() =>
    loadStoredBoolean(LAYOUT_STORAGE_KEYS.storyboardCollapsed, false)
  );

  const [isSceneManagerCollapsed, setSceneManagerCollapsed] = useState(() =>
    loadStoredBoolean(LAYOUT_STORAGE_KEYS.sceneManagerCollapsed, false)
  );

  const toggleSidebarCollapse = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const toggleChatCollapse = useCallback(() => {
    setChatCollapsed((prev) => !prev);
  }, []);

  const toggleStoryboardCollapse = useCallback(() => {
    setStoryboardCollapsed((prev) => !prev);
  }, []);

  const toggleSceneManagerCollapse = useCallback(() => {
    setSceneManagerCollapsed((prev) => !prev);
  }, []);

  return {
    isSidebarCollapsed,
    isChatCollapsed,
    isStoryboardCollapsed,
    isSceneManagerCollapsed,
    toggleSidebarCollapse,
    toggleChatCollapse,
    toggleStoryboardCollapse,
    toggleSceneManagerCollapse,
    setSidebarCollapsed,
    setChatCollapsed,
    setStoryboardCollapsed,
    setSceneManagerCollapsed,
  };
};
