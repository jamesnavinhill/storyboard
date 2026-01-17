import React, { useRef, useState, useEffect, useCallback } from "react";
import { useLayoutDimensions } from "./useLayoutDimensions";
import { useCollapsiblePanels } from "./useCollapsiblePanels";
import { useResizablePanel } from "./useResizablePanel";
import { useLayoutPersistence } from "./useLayoutPersistence";
import {
  LAYOUT_BREAKPOINT,
  SIDEBAR_COLLAPSED_WIDTH,
  SCENE_MANAGER_COLLAPSED_WIDTH,
  RESIZER_SIZE,
  DESKTOP_RESIZER_COUNT,
} from "../utils/layoutConstants";
import type { PanelTarget, SpaceAllocation } from "../types";

const TOTAL_RESIZER_SPACE = RESIZER_SIZE * DESKTOP_RESIZER_COUNT;

export interface LayoutState {
  // Dimensions
  sidebarWidth: number;
  chatWidth: number;
  sceneManagerWidth: number;

  // Collapse states
  isSidebarCollapsed: boolean;
  isChatCollapsed: boolean;
  isStoryboardCollapsed: boolean;
  isSceneManagerCollapsed: boolean;

  // Responsive
  isMobileLayout: boolean;

  // Actions
  setSidebarWidth: (width: number) => void;
  setChatWidth: (width: number) => void;
  setSceneManagerWidth: (width: number) => void;
  toggleSidebarCollapse: () => void;
  toggleChatCollapse: () => void;
  toggleStoryboardCollapse: () => void;
  toggleSceneManagerCollapse: () => void;

  // Resize handlers
  startResize: (target: PanelTarget) => (e: React.PointerEvent<any>) => void;

  // Layout calculations
  calculateAvailableSpace: (containerWidth: number) => SpaceAllocation;

  // Layout ref
  layoutRef: React.RefObject<HTMLDivElement>;
}

/**
 * Main layout hook that composes all layout sub-hooks
 * Provides unified interface for layout state and actions
 */
export const useLayout = (): LayoutState => {
  const layoutRef = useRef<HTMLDivElement>(null!);

  // Responsive layout detection
  const [isMobileLayout, setIsMobileLayout] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.innerWidth < LAYOUT_BREAKPOINT;
  });

  // Compose sub-hooks
  const dimensions = useLayoutDimensions();
  const collapse = useCollapsiblePanels();
  const resize = useResizablePanel({
    dimensions,
    collapse,
    layoutRef,
    isMobileLayout,
  });

  // Persist layout state
  useLayoutPersistence({
    dimensions,
    collapse,
    layoutRef,
    isMobileLayout,
  });

  // Calculate available space for each panel
  const calculateAvailableSpace = useCallback(
    (containerWidth: number): SpaceAllocation => {
      // Calculate occupied space for left sidebar (collapsed or expanded)
      const sidebarSpace = collapse.isSidebarCollapsed
        ? SIDEBAR_COLLAPSED_WIDTH
        : dimensions.sidebarWidth;

      // Calculate occupied space for chat (collapsed or expanded)
      const chatSpace = collapse.isChatCollapsed ? 0 : dimensions.chatWidth;

      // Calculate occupied space for scene manager (collapsed or expanded)
      const sceneManagerSpace = collapse.isSceneManagerCollapsed
        ? SCENE_MANAGER_COLLAPSED_WIDTH
        : dimensions.sceneManagerWidth;

      // Calculate resizer space (chat divider only)
      const resizerSpace = TOTAL_RESIZER_SPACE;

      // Storyboard gets whatever space is left (flex-1 behavior)
      const storyboardSpace =
        containerWidth -
        sidebarSpace -
        chatSpace -
        sceneManagerSpace -
        resizerSpace;

      return {
        sidebarSpace,
        chatSpace,
        storyboardSpace,
        sceneManagerSpace,
        resizerSpace,
      };
    },
    [
      collapse.isSidebarCollapsed,
      collapse.isChatCollapsed,
      collapse.isSceneManagerCollapsed,
      dimensions.sidebarWidth,
      dimensions.chatWidth,
      dimensions.sceneManagerWidth,
    ]
  );

  // Handle window resize for responsive layout
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handleResize = () => {
      const nextIsMobile = window.innerWidth < LAYOUT_BREAKPOINT;
      setIsMobileLayout(nextIsMobile);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    // Dimensions
    sidebarWidth: dimensions.sidebarWidth,
    chatWidth: dimensions.chatWidth,
    sceneManagerWidth: dimensions.sceneManagerWidth,

    // Collapse states
    isSidebarCollapsed: collapse.isSidebarCollapsed,
    isChatCollapsed: collapse.isChatCollapsed,
    isStoryboardCollapsed: collapse.isStoryboardCollapsed,
    isSceneManagerCollapsed: collapse.isSceneManagerCollapsed,

    // Responsive
    isMobileLayout,

    // Actions
    setSidebarWidth: dimensions.setSidebarWidth,
    setChatWidth: dimensions.setChatWidth,
    setSceneManagerWidth: dimensions.setSceneManagerWidth,
    toggleSidebarCollapse: collapse.toggleSidebarCollapse,
    toggleChatCollapse: collapse.toggleChatCollapse,
    toggleStoryboardCollapse: collapse.toggleStoryboardCollapse,
    toggleSceneManagerCollapse: collapse.toggleSceneManagerCollapse,

    // Resize handlers
    startResize: resize.startResize,

    // Layout calculations
    calculateAvailableSpace,

    // Layout ref
    layoutRef,
  };
};
