// Layout-specific types

export type PanelTarget = "sidebar" | "chat" | "sceneManager";

export interface SpaceAllocation {
  sidebarSpace: number;
  chatSpace: number;
  storyboardSpace: number;
  sceneManagerSpace: number;
  resizerSpace: number;
}

export interface LayoutDimensions {
  sidebarWidth: number;
  chatWidth: number;
  sceneManagerWidth: number;
  setSidebarWidth: (width: number) => void;
  setChatWidth: (width: number) => void;
  setSceneManagerWidth: (width: number) => void;
}

export interface CollapsiblePanels {
  isSidebarCollapsed: boolean;
  isChatCollapsed: boolean;
  isStoryboardCollapsed: boolean;
  isSceneManagerCollapsed: boolean;
  toggleSidebarCollapse: () => void;
  toggleChatCollapse: () => void;
  toggleStoryboardCollapse: () => void;
  toggleSceneManagerCollapse: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setChatCollapsed: (collapsed: boolean) => void;
  setStoryboardCollapsed: (collapsed: boolean) => void;
  setSceneManagerCollapsed: (collapsed: boolean) => void;
}
