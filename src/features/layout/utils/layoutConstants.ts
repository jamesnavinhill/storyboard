// Layout constants and localStorage keys used across the app shell

export const LAYOUT_STORAGE_KEYS = {
  sidebarWidth: "vb:layout:sidebarWidth",
  chatWidth: "vb:layout:chatWidth",
  sidebarCollapsed: "vb:layout:sidebarCollapsed",
  sceneManagerWidth: "vb:layout:sceneManagerWidth",
  sceneManagerCollapsed: "vb:layout:sceneManagerCollapsed",
  chatCollapsed: "vb:layout:chatCollapsed",
  storyboardCollapsed: "vb:layout:storyboardCollapsed",
  chatWidthBeforeStoryboard: "vb:layout:chatWidthBeforeStoryboard",
} as const;

export const SIDEBAR_MIN_WIDTH = 240;
export const SIDEBAR_MAX_WIDTH = 420;
export const CHAT_MIN_WIDTH = 320;
export const CHAT_MAX_WIDTH = 720;
export const STORYBOARD_MIN_WIDTH = 480;
export const SIDEBAR_COLLAPSED_WIDTH = 72;
export const SCENE_MANAGER_MIN_WIDTH = 320;
export const SCENE_MANAGER_MAX_WIDTH = 600;
export const SCENE_MANAGER_COLLAPSED_WIDTH = 72;
export const RESIZER_SIZE = 10;
// Number of interactive resizers present in the desktop layout. Update if layout structure changes.
export const DESKTOP_RESIZER_COUNT = 1;
export const LAYOUT_BREAKPOINT = 1024;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const loadStoredDimension = (
  key: string,
  fallback: number,
  min: number,
  max: number
) => {
  if (typeof window === "undefined") {
    return fallback;
  }
  const stored = window.localStorage.getItem(key);
  if (!stored) {
    return fallback;
  }
  const parsed = Number.parseFloat(stored);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return clamp(parsed, min, max);
};
