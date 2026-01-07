import React, { useCallback, useRef } from "react";
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
import type { PanelTarget, LayoutDimensions, CollapsiblePanels } from "../types";

const COLLAPSE_THRESHOLD = 40;
const TOTAL_RESIZER_SPACE = RESIZER_SIZE * DESKTOP_RESIZER_COUNT;

interface UseResizablePanelProps {
  dimensions: LayoutDimensions;
  collapse: CollapsiblePanels;
  layoutRef: React.RefObject<HTMLDivElement>;
  isMobileLayout: boolean;
}

interface ResizablePanel {
  startResize: (target: PanelTarget) => (event: React.PointerEvent<any>) => void;
}

/**
 * Hook to manage resizable panel logic with pointer events
 * Handles resize calculations and collapse threshold detection
 */
export const useResizablePanel = ({
  dimensions,
  collapse,
  layoutRef,
  isMobileLayout,
}: UseResizablePanelProps): ResizablePanel => {
  // Use refs to track current widths during resize
  const sidebarWidthRef = useRef(dimensions.sidebarWidth);
  const chatWidthRef = useRef(dimensions.chatWidth);
  const sceneManagerWidthRef = useRef(dimensions.sceneManagerWidth);

  // Update refs when dimensions change
  sidebarWidthRef.current = dimensions.sidebarWidth;
  chatWidthRef.current = dimensions.chatWidth;
  sceneManagerWidthRef.current = dimensions.sceneManagerWidth;

  const handleChatResize = useCallback(
    (delta: number, initialWidth: number) => {
      const newWidth = initialWidth + delta;

      // Check for collapse threshold
      if (newWidth < COLLAPSE_THRESHOLD) {
        collapse.setChatCollapsed(true);
        return;
      }

      const containerWidth = layoutRef.current?.clientWidth ?? 0;
      const sidebarForChat = collapse.isSidebarCollapsed
        ? SIDEBAR_COLLAPSED_WIDTH
        : sidebarWidthRef.current;
      const sceneManagerForChat = collapse.isSceneManagerCollapsed
        ? SCENE_MANAGER_COLLAPSED_WIDTH
        : sceneManagerWidthRef.current;

      // If storyboard is currently expanded, detect if we're dragging far enough to collapse it
      const storyboardSpaceIfApplied =
        containerWidth -
        sidebarForChat -
        newWidth -
        sceneManagerForChat -
        TOTAL_RESIZER_SPACE;

      if (
        !collapse.isStoryboardCollapsed &&
        storyboardSpaceIfApplied < COLLAPSE_THRESHOLD
      ) {
        // Save current chat width so we can restore when expanding storyboard later
        try {
          window.localStorage.setItem(
            LAYOUT_STORAGE_KEYS.chatWidthBeforeStoryboard,
            String(chatWidthRef.current)
          );
        } catch {
          /* ignore */
        }
        // Collapse storyboard and expand chat to fill remaining width
        collapse.setStoryboardCollapsed(true);
        const expandedChatWidth = Math.max(
          CHAT_MIN_WIDTH,
          containerWidth -
            sidebarForChat -
            sceneManagerForChat -
            TOTAL_RESIZER_SPACE
        );
        chatWidthRef.current = expandedChatWidth;
        dimensions.setChatWidth(expandedChatWidth);
        return;
      }

      // If storyboard is collapsed and user drags left to create space, auto-expand storyboard
      if (
        collapse.isStoryboardCollapsed &&
        storyboardSpaceIfApplied >= STORYBOARD_MIN_WIDTH
      ) {
        collapse.setStoryboardCollapsed(false);
      }

      // Normal resize with constraints (respect storyboard min width only when storyboard is expanded)
      const storyboardReserve = collapse.isStoryboardCollapsed
        ? 0
        : STORYBOARD_MIN_WIDTH;
      const chatSpace =
        containerWidth -
        sidebarForChat -
        storyboardReserve -
        sceneManagerForChat -
        TOTAL_RESIZER_SPACE;
      const maxChatBySpace = Math.max(
        CHAT_MIN_WIDTH,
        Math.min(CHAT_MAX_WIDTH, chatSpace)
      );
      const clampedWidth = clamp(newWidth, CHAT_MIN_WIDTH, maxChatBySpace);
      chatWidthRef.current = clampedWidth;
      dimensions.setChatWidth(clampedWidth);
    },
    [
      collapse.isSidebarCollapsed,
      collapse.isSceneManagerCollapsed,
      collapse.isStoryboardCollapsed,
      collapse.setChatCollapsed,
      collapse.setStoryboardCollapsed,
      dimensions,
      layoutRef,
    ]
  );

  const handleSceneManagerResize = useCallback(
    (delta: number, initialWidth: number) => {
      // Delta is negative when dragging left (expanding scene manager)
      const newWidth = initialWidth - delta; // Invert delta for right-side panel

      // Check for collapse threshold
      if (
        newWidth < SCENE_MANAGER_MIN_WIDTH &&
        Math.abs(newWidth - SCENE_MANAGER_COLLAPSED_WIDTH) < COLLAPSE_THRESHOLD
      ) {
        collapse.setSceneManagerCollapsed(true);
        return;
      }

      // Normal resize with constraints
      const containerWidth = layoutRef.current?.clientWidth ?? 0;
      const sidebarForSceneManager = collapse.isSidebarCollapsed
        ? SIDEBAR_COLLAPSED_WIDTH
        : sidebarWidthRef.current;
      const sceneManagerSpace =
        containerWidth -
        sidebarForSceneManager -
        chatWidthRef.current -
        STORYBOARD_MIN_WIDTH -
        TOTAL_RESIZER_SPACE;
      const maxSceneManagerBySpace = Math.max(
        SCENE_MANAGER_MIN_WIDTH,
        Math.min(SCENE_MANAGER_MAX_WIDTH, sceneManagerSpace)
      );
      const clampedWidth = clamp(
        newWidth,
        SCENE_MANAGER_MIN_WIDTH,
        maxSceneManagerBySpace
      );
      sceneManagerWidthRef.current = clampedWidth;
      dimensions.setSceneManagerWidth(clampedWidth);
    },
    [
      collapse.isSidebarCollapsed,
      collapse.setSceneManagerCollapsed,
      dimensions,
      layoutRef,
    ]
  );

  const startResize = useCallback(
    (target: PanelTarget) => (event: React.PointerEvent<any>) => {
      if (isMobileLayout) {
        return;
      }
      // Prevent resize if target is collapsed (except for expansion)
      if (target === "sidebar" && collapse.isSidebarCollapsed) {
        return;
      }
      if (target === "sceneManager" && collapse.isSceneManagerCollapsed) {
        return;
      }
      const containerWidth = layoutRef.current?.clientWidth ?? 0;
      if (!containerWidth) {
        return;
      }
      event.preventDefault();
      const resizerElement = event.currentTarget;
      resizerElement.setAttribute("data-glow-state", "active");
      const startX = event.clientX;
      const initialSidebar = sidebarWidthRef.current;
      const initialChat = chatWidthRef.current;
      const initialSceneManager = sceneManagerWidthRef.current;

      const onMove = (moveEvent: PointerEvent) => {
        const delta = moveEvent.clientX - startX;

        switch (target) {
          case "sidebar": {
            const sceneManagerForSidebar = collapse.isSceneManagerCollapsed
              ? SCENE_MANAGER_COLLAPSED_WIDTH
              : sceneManagerWidthRef.current;
            const sidebarSpace =
              containerWidth -
              initialChat -
              STORYBOARD_MIN_WIDTH -
              sceneManagerForSidebar -
              TOTAL_RESIZER_SPACE;
            const maxSidebarBySpace = Math.max(
              SIDEBAR_MIN_WIDTH,
              Math.min(SIDEBAR_MAX_WIDTH, sidebarSpace)
            );
            const next = clamp(
              initialSidebar + delta,
              SIDEBAR_MIN_WIDTH,
              maxSidebarBySpace
            );
            sidebarWidthRef.current = next;
            dimensions.setSidebarWidth(next);
            break;
          }
          case "chat":
            handleChatResize(delta, initialChat);
            break;
          case "sceneManager":
            handleSceneManagerResize(delta, initialSceneManager);
            break;
        }
      };

      const cleanup = () => {
        resizerElement.removeAttribute("data-glow-state");
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", cleanup);
        window.removeEventListener("pointercancel", cleanup);
        try {
          if (target === "sidebar") {
            window.localStorage.setItem(
              LAYOUT_STORAGE_KEYS.sidebarWidth,
              String(sidebarWidthRef.current)
            );
          } else if (target === "chat") {
            window.localStorage.setItem(
              LAYOUT_STORAGE_KEYS.chatWidth,
              String(chatWidthRef.current)
            );
            window.localStorage.setItem(
              LAYOUT_STORAGE_KEYS.chatCollapsed,
              collapse.isChatCollapsed ? "1" : "0"
            );
          } else if (target === "sceneManager") {
            window.localStorage.setItem(
              LAYOUT_STORAGE_KEYS.sceneManagerWidth,
              String(sceneManagerWidthRef.current)
            );
            window.localStorage.setItem(
              LAYOUT_STORAGE_KEYS.sceneManagerCollapsed,
              collapse.isSceneManagerCollapsed ? "1" : "0"
            );
          } else if (target === "chat") {
            // Also persist storyboard collapsed state since chat drag can toggle it
            window.localStorage.setItem(
              LAYOUT_STORAGE_KEYS.storyboardCollapsed,
              collapse.isStoryboardCollapsed ? "1" : "0"
            );
          }
        } catch {
          /* ignore */
        }
      };

      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", cleanup);
      window.addEventListener("pointercancel", cleanup);
    },
    [
      isMobileLayout,
      collapse.isSidebarCollapsed,
      collapse.isSceneManagerCollapsed,
      collapse.isChatCollapsed,
      dimensions,
      handleChatResize,
      handleSceneManagerResize,
      layoutRef,
    ]
  );

  return {
    startResize,
  };
};
