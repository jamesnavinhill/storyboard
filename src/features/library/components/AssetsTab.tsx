import React, { Suspense } from "react";
// Lazy-load AssetManager so asset gallery code isn't bundled up front
const AssetManager = React.lazy(() =>
  import("./AssetManager").then((m) => ({ default: m.AssetManager }))
);
import type { Scene } from "../../../types";

export interface AssetsTabProps {
  projectId: string | null;
  scenes: Array<{ id: string; description: string }>;
  viewMode: "grid" | "list";
  variant: "sidebar" | "full";
  searchQuery?: string;
  onOpenSceneHistory?: (sceneId: string) => void;
  onOpenManage?: (sceneId: string) => void;
  historySceneId?: string | null;
}

/**
 * AssetsTab component
 * Displays the assets (scenes) list in the library
 */
export const AssetsTab: React.FC<AssetsTabProps> = ({
  projectId,
  scenes,
  viewMode,
  variant,
  searchQuery,
  onOpenSceneHistory,
  onOpenManage,
  historySceneId,
}) => {
  const isSidebarVariant = variant === "sidebar";

  // AssetManager receives projectId directly from props with no transformation
  // AssetManager's useEffect will trigger on projectId changes to reload assets
  return (
    <Suspense
      fallback={
        <div className="p-3 text-xs text-foreground-muted">Loading assets…</div>
      }
    >
      <AssetManager
        projectId={projectId}
        scenes={scenes}
        onOpenSceneHistory={onOpenSceneHistory}
        onOpenManage={onOpenManage}
        historySceneId={historySceneId}
        mode={isSidebarVariant ? "embedded" : "embedded"}
        searchQuery={isSidebarVariant ? undefined : searchQuery}
        layoutMode={isSidebarVariant ? "list" : viewMode}
        cardVariant={isSidebarVariant ? "default" : "scene"}
        compactList={isSidebarVariant}
      />
    </Suspense>
  );
};
