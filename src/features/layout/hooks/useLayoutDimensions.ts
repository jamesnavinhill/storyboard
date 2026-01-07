import { useState } from "react";
import {
  LAYOUT_STORAGE_KEYS,
  SIDEBAR_MIN_WIDTH,
  SIDEBAR_MAX_WIDTH,
  CHAT_MIN_WIDTH,
  CHAT_MAX_WIDTH,
  SCENE_MANAGER_MIN_WIDTH,
  SCENE_MANAGER_MAX_WIDTH,
  loadStoredDimension,
} from "../utils/layoutConstants";
import type { LayoutDimensions } from "../types";

/**
 * Hook to manage layout panel dimensions (sidebar, chat, scene manager widths)
 * Loads initial values from localStorage and provides setters
 */
export const useLayoutDimensions = (): LayoutDimensions => {
  const [sidebarWidth, setSidebarWidth] = useState(() =>
    loadStoredDimension(
      LAYOUT_STORAGE_KEYS.sidebarWidth,
      288,
      SIDEBAR_MIN_WIDTH,
      SIDEBAR_MAX_WIDTH
    )
  );

  const [chatWidth, setChatWidth] = useState(() =>
    loadStoredDimension(
      LAYOUT_STORAGE_KEYS.chatWidth,
      420,
      CHAT_MIN_WIDTH,
      CHAT_MAX_WIDTH
    )
  );

  const [sceneManagerWidth, setSceneManagerWidth] = useState(() =>
    loadStoredDimension(
      LAYOUT_STORAGE_KEYS.sceneManagerWidth,
      440,
      SCENE_MANAGER_MIN_WIDTH,
      SCENE_MANAGER_MAX_WIDTH
    )
  );

  return {
    sidebarWidth,
    chatWidth,
    sceneManagerWidth,
    setSidebarWidth,
    setChatWidth,
    setSceneManagerWidth,
  };
};
