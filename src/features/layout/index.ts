// Layout feature module exports

// Hooks
export { useLayout } from "./hooks/useLayout";
export { useLayoutDimensions } from "./hooks/useLayoutDimensions";
export { useCollapsiblePanels } from "./hooks/useCollapsiblePanels";
export { useResizablePanel } from "./hooks/useResizablePanel";
export { useLayoutPersistence } from "./hooks/useLayoutPersistence";

// Components
export { ResizablePanel } from "./components/ResizablePanel";
export { PanelResizer } from "./components/PanelResizer";
export { CollapsiblePanel } from "./components/CollapsiblePanel";

// Types
export type {
  PanelTarget,
  SpaceAllocation,
  LayoutDimensions,
  CollapsiblePanels,
} from "./types";
export type { LayoutState } from "./hooks/useLayout";

// Constants
export * from "./utils/layoutConstants";
