import React, { useEffect, useCallback } from "react";
import {
  LAYOUT_STORAGE_KEYS,
  SIDEBAR_MIN_WIDTH,
  SIDEBAR_MAX_WIDTH,
  CHAT_MIN_WIDTH,
  CHAT_MAX_WIDTH,
  SCENE_MANAGER_MIN_WIDTH,
  SCENE_MANAGER_MAX_WIDTH,
  STORYBOARD_MIN_WIDTH,
  SIDEBAR_COLLAPSED_WIDTH,
  SCENE_MANAGER_COLLAPSED_WIDTH,
  RESIZER_SIZE,
  DESKTOP_RESIZER_COUNT,
  clamp,
} from "../utils/layoutConstants";
import type { LayoutDimensions, CollapsiblePanels } from "../types";

const TOTAL_RESIZER_SPACE = RESIZER_SIZE * DESKTOP_RESIZER_COUNT;

interface UseLayoutPersistenceProps {
  dimensions: LayoutDimensions;
  collapse: CollapsiblePanels;
  layoutRef: React.RefObject<HTMLDivElement>;
  isMobileLayout: boolean;
}

/**
 * Hook to sync layout state with localStorage and ensure layout stays within bounds
 * Persists dimensions and collapse states, and recalculates on window resize
 */
export const useLayoutPersistence = ({
  dimensions,
  collapse,
  layoutRef,
  isMobileLayout,
}: UseLayoutPersistenceProps): void => {
  // Persist sidebar width
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(
        LAYOUT_STORAGE_KEYS.sidebarWidth,
        String(dimensions.sidebarWidth)
      );
    } catch {
      /* ignore */
    }
  }, [dimensions.sidebarWidth]);

  // Persist chat width
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(
        LAYOUT_STORAGE_KEYS.chatWidth,
        String(dimensions.chatWidth)
      );
    } catch {
      /* ignore */
    }
  }, [dimensions.chatWidth]);

  // Persist scene manager width
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(
        LAYOUT_STORAGE_KEYS.sceneManagerWidth,
        String(dimensions.sceneManagerWidth)
      );
    } catch {
      /* ignore */
    }
  }, [dimensions.sceneManagerWidth]);

  // Persist sidebar collapsed state
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(
        LAYOUT_STORAGE_KEYS.sidebarCollapsed,
        collapse.isSidebarCollapsed ? "1" : "0"
      );
    } catch {
      /* ignore */
    }
  }, [collapse.isSidebarCollapsed]);

  // Persist chat collapsed state
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(
        LAYOUT_STORAGE_KEYS.chatCollapsed,
        collapse.isChatCollapsed ? "1" : "0"
      );
    } catch {
      /* ignore */
    }
  }, [collapse.isChatCollapsed]);

  // Persist storyboard collapsed state
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(
        LAYOUT_STORAGE_KEYS.storyboardCollapsed,
        collapse.isStoryboardCollapsed ? "1" : "0"
      );
    } catch {
      /* ignore */
    }
  }, [collapse.isStoryboardCollapsed]);

  // When storyboard is expanded again, try to restore previous chat width
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!collapse.isStoryboardCollapsed) {
      try {
        const prev = window.localStorage.getItem(
          LAYOUT_STORAGE_KEYS.chatWidthBeforeStoryboard
        );
        if (prev) {
          const val = Number.parseFloat(prev);
          if (Number.isFinite(val)) {
            // Clamp to valid bounds considering storyboard is expanded now
            const containerWidth = layoutRef.current?.clientWidth ?? 0;
            if (containerWidth) {
              const maxChatWidth = Math.min(
                CHAT_MAX_WIDTH,
                containerWidth -
                  (collapse.isSidebarCollapsed
                    ? SIDEBAR_COLLAPSED_WIDTH
                    : SIDEBAR_MIN_WIDTH) -
                  STORYBOARD_MIN_WIDTH -
                  (collapse.isSceneManagerCollapsed
                    ? SCENE_MANAGER_COLLAPSED_WIDTH
                    : SCENE_MANAGER_MIN_WIDTH) -
                  TOTAL_RESIZER_SPACE
              );
              const clamped = clamp(val, CHAT_MIN_WIDTH, maxChatWidth);
              if (clamped !== dimensions.chatWidth) {
                dimensions.setChatWidth(clamped);
              }
            }
          }
          window.localStorage.removeItem(
            LAYOUT_STORAGE_KEYS.chatWidthBeforeStoryboard
          );
        }
      } catch {
        /* ignore */
      }
    }
  }, [
    collapse.isStoryboardCollapsed,
    collapse.isSidebarCollapsed,
    collapse.isSceneManagerCollapsed,
    dimensions,
    layoutRef,
  ]);

  // Persist scene manager collapsed state
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(
        LAYOUT_STORAGE_KEYS.sceneManagerCollapsed,
        collapse.isSceneManagerCollapsed ? "1" : "0"
      );
    } catch {
      /* ignore */
    }
  }, [collapse.isSceneManagerCollapsed]);

  // Ensure layout stays within bounds when panels expand/collapse
  const ensureLayoutWithinBounds = useCallback(() => {
    if (!layoutRef.current) {
      return;
    }
    const containerWidth = layoutRef.current.clientWidth;
    if (!containerWidth) {
      return;
    }

    // Ensure chat width is clamped to valid range
    if (!collapse.isChatCollapsed) {
      const maxChatWidth = Math.min(
        CHAT_MAX_WIDTH,
        containerWidth -
          (collapse.isSidebarCollapsed
            ? SIDEBAR_COLLAPSED_WIDTH
            : SIDEBAR_MIN_WIDTH) -
          (collapse.isStoryboardCollapsed ? 0 : STORYBOARD_MIN_WIDTH) -
          (collapse.isSceneManagerCollapsed
            ? SCENE_MANAGER_COLLAPSED_WIDTH
            : SCENE_MANAGER_MIN_WIDTH) -
          TOTAL_RESIZER_SPACE
      );
      const clampedChatWidth = clamp(
        dimensions.chatWidth,
        CHAT_MIN_WIDTH,
        maxChatWidth
      );
      if (clampedChatWidth !== dimensions.chatWidth) {
        dimensions.setChatWidth(clampedChatWidth);
      }
    }

    // Ensure sidebar fits within bounds if expanded
    if (!collapse.isSidebarCollapsed) {
      const maxSidebarWidth = Math.min(
        SIDEBAR_MAX_WIDTH,
        containerWidth -
          (collapse.isChatCollapsed ? 0 : CHAT_MIN_WIDTH) -
          (collapse.isStoryboardCollapsed ? 0 : STORYBOARD_MIN_WIDTH) -
          (collapse.isSceneManagerCollapsed
            ? SCENE_MANAGER_COLLAPSED_WIDTH
            : SCENE_MANAGER_MIN_WIDTH) -
          TOTAL_RESIZER_SPACE
      );
      const clampedSidebarWidth = clamp(
        dimensions.sidebarWidth,
        SIDEBAR_MIN_WIDTH,
        maxSidebarWidth
      );
      if (clampedSidebarWidth !== dimensions.sidebarWidth) {
        dimensions.setSidebarWidth(clampedSidebarWidth);
      }
    }

    // Ensure scene manager fits within bounds if expanded
    if (!collapse.isSceneManagerCollapsed) {
      const maxSceneManagerWidth = Math.min(
        SCENE_MANAGER_MAX_WIDTH,
        containerWidth -
          (collapse.isSidebarCollapsed
            ? SIDEBAR_COLLAPSED_WIDTH
            : SIDEBAR_MIN_WIDTH) -
          (collapse.isChatCollapsed ? 0 : CHAT_MIN_WIDTH) -
          (collapse.isStoryboardCollapsed ? 0 : STORYBOARD_MIN_WIDTH) -
          TOTAL_RESIZER_SPACE
      );
      const clampedSceneManagerWidth = clamp(
        dimensions.sceneManagerWidth,
        SCENE_MANAGER_MIN_WIDTH,
        maxSceneManagerWidth
      );
      if (clampedSceneManagerWidth !== dimensions.sceneManagerWidth) {
        dimensions.setSceneManagerWidth(clampedSceneManagerWidth);
      }
    }
  }, [
    collapse.isSidebarCollapsed,
    collapse.isSceneManagerCollapsed,
    collapse.isChatCollapsed,
    dimensions,
    layoutRef,
  ]);

  // Ensure layout within bounds when collapse states change
  useEffect(() => {
    if (!collapse.isSidebarCollapsed) {
      ensureLayoutWithinBounds();
    }
  }, [collapse.isSidebarCollapsed, ensureLayoutWithinBounds]);

  useEffect(() => {
    if (!collapse.isSceneManagerCollapsed) {
      ensureLayoutWithinBounds();
    }
  }, [collapse.isSceneManagerCollapsed, ensureLayoutWithinBounds]);

  // Ensure layout within bounds on mobile layout changes
  useEffect(() => {
    if (!isMobileLayout) {
      ensureLayoutWithinBounds();
    }
  }, [isMobileLayout, ensureLayoutWithinBounds]);

  // Set CSS custom properties for layout dimensions (override chat width when collapsed)
  useEffect(() => {
    if (!layoutRef.current) {
      return;
    }
    layoutRef.current.style.setProperty(
      "--layout-sidebar-width",
      `${dimensions.sidebarWidth}px`
    );
    layoutRef.current.style.setProperty(
      "--layout-sidebar-collapsed-width",
      `${SIDEBAR_COLLAPSED_WIDTH}px`
    );
    layoutRef.current.style.setProperty(
      "--layout-chat-width",
      `${collapse.isChatCollapsed ? 0 : dimensions.chatWidth}px`
    );
    layoutRef.current.style.setProperty(
      "--chat-fixed",
      `${dimensions.chatWidth}px`
    );
    layoutRef.current.style.setProperty(
      "--layout-scene-manager-width",
      `${dimensions.sceneManagerWidth}px`
    );
    layoutRef.current.style.setProperty(
      "--layout-scene-manager-collapsed-width",
      `${SCENE_MANAGER_COLLAPSED_WIDTH}px`
    );
  }, [
    dimensions.sidebarWidth,
    dimensions.chatWidth,
    dimensions.sceneManagerWidth,
    collapse.isChatCollapsed,
    layoutRef,
  ]);
};
