import { Select } from "@/ui/Select";
import React, { useState, useEffect, useCallback } from "react";
import type { Scene } from "@/types";
import type { AssetEntity } from "@/services/projectService";
import {
  listAssets,
  updateAsset,
  deleteAsset,
} from "@/services/projectService";
import { AssetCard } from "./AssetCard";
import { Image, Film, File, Folder, Hourglass } from "lucide-react";

interface AssetManagerProps {
  projectId: string | null;
  scenes: Array<{ id: string; description: string }>;
  onAssetDeleted?: () => void;
  onOpenSceneHistory?: (sceneId: string) => void;
  onOpenManage?: (sceneId: string) => void;
  historySceneId?: string | null;
  // Embedded mode removes internal headers/filters; searchQuery filters by filename
  mode?: "standalone" | "embedded";
  searchQuery?: string;
  layoutMode?: "grid" | "list";
  cardVariant?: "default" | "scene";
  // Compact list strips the card chrome and shows a simple row; used in sidebar
  compactList?: boolean;
}

export const AssetManager: React.FC<AssetManagerProps> = ({
  projectId,
  scenes,
  onAssetDeleted,
  onOpenSceneHistory,
  onOpenManage,
  historySceneId,
  mode = "standalone",
  searchQuery,
  layoutMode = "grid",
  cardVariant = "default",
  compactList = false,
}) => {
  const [assets, setAssets] = useState<AssetEntity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState<
    "all" | "image" | "video" | "attachment"
  >("all");
  const [selectedSceneId, setSelectedSceneId] = useState<string>("");

  const loadAssets = useCallback(async () => {
    if (!projectId) return;

    setIsLoading(true);
    try {
      const filters = filterType !== "all" ? { type: filterType } : undefined;
      const fetchedAssets = await listAssets(projectId, filters);
      setAssets(fetchedAssets);
    } catch (error) {
      console.error("Failed to load assets:", error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, filterType]);

  useEffect(() => {
    void loadAssets();
  }, [loadAssets]);

  useEffect(() => {
    if (scenes.length === 0) {
      setSelectedSceneId("");
      return;
    }
    setSelectedSceneId((previous) => {
      if (
        historySceneId &&
        scenes.some((scene) => scene.id === historySceneId)
      ) {
        return historySceneId;
      }
      if (previous && scenes.some((scene) => scene.id === previous)) {
        return previous;
      }
      return scenes[0].id;
    });
  }, [historySceneId, scenes]);

  const handleRename = useCallback(
    async (assetId: string, fileName: string) => {
      try {
        const updatedAsset = await updateAsset(assetId, { fileName });
        setAssets((prev) =>
          prev.map((asset) => (asset.id === assetId ? updatedAsset : asset))
        );
      } catch (error) {
        console.error("Failed to rename asset:", error);
        alert("Failed to rename asset. Please try again.");
      }
    },
    []
  );

  const handleDelete = useCallback(
    async (assetId: string) => {
      try {
        await deleteAsset(assetId);
        setAssets((prev) => prev.filter((asset) => asset.id !== assetId));
        onAssetDeleted?.();
      } catch (error) {
        console.error("Failed to delete asset:", error);
        alert("Failed to delete asset. Please try again.");
      }
    },
    [onAssetDeleted]
  );

  const handleDownload = useCallback((asset: AssetEntity) => {
    if (!asset.url) return;

    const link = document.createElement("a");
    link.href = asset.url;
    link.download = asset.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleOpenHistory = useCallback(() => {
    if (!onOpenSceneHistory || !selectedSceneId) {
      return;
    }
    onOpenSceneHistory(selectedSceneId);
  }, [onOpenSceneHistory, selectedSceneId]);

  if (!projectId) {
    return (
      <div className="empty-state">
        <Folder className="empty-state-icon" />
        <p className="text-lg">No project selected</p>
      </div>
    );
  }

  const filteredAssets = assets.filter((a) =>
    searchQuery
      ? a.fileName.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );
  const imageCount = assets.filter((a) => a.type === "image").length;
  const videoCount = assets.filter((a) => a.type === "video").length;
  const attachmentCount = assets.filter((a) => a.type === "attachment").length;

  return (
    <div className="flex flex-col h-full">
      {/* Filter Tabs (hidden in embedded mode) */}
      {mode === "standalone" && (
        <div className="border-b border-muted">
          <div className="flex items-center gap-2 p-4">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`btn-base filter-btn ${
                filterType === "all" ? "btn-soft-primary" : "btn-ghost"
              }`}
              aria-label={`Show all assets (${assets.length})`}
              aria-pressed={filterType === "all"}
            >
              <Folder className="icon-sm" />
              All ({assets.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("image")}
              className={`btn-base filter-btn ${
                filterType === "image" ? "btn-soft-primary" : "btn-ghost"
              }`}
              aria-label={`Show images only (${imageCount})`}
              aria-pressed={filterType === "image"}
            >
              <Image className="icon-sm" />
              Images ({imageCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("video")}
              className={`btn-base filter-btn ${
                filterType === "video" ? "btn-soft-primary" : "btn-ghost"
              }`}
              aria-label={`Show videos only (${videoCount})`}
              aria-pressed={filterType === "video"}
            >
              <Film className="icon-sm" />
              Videos ({videoCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("attachment")}
              className={`btn-base filter-btn ${
                filterType === "attachment" ? "btn-soft-primary" : "btn-ghost"
              }`}
              aria-label={`Show attachments only (${attachmentCount})`}
              aria-pressed={filterType === "attachment"}
            >
              <File className="icon-sm" />
              Attachments ({attachmentCount})
            </button>
          </div>

          {onOpenSceneHistory && (
            <div className="flex flex-col gap-2 px-4 pb-4">
              <span className="text-xs uppercase tracking-wide text-muted">
                Scene history
              </span>
              {scenes.length === 0 ? (
                <p className="text-xs text-muted">
                  Generate a scene to enable history access.
                </p>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <Select
                    value={selectedSceneId || null}
                    onChange={(v) => setSelectedSceneId(v)}
                    options={scenes.map((scene, index) => {
                      const label =
                        scene.description?.trim() || "Untitled scene";
                      const truncated =
                        label.length > 60 ? `${label.slice(0, 60)}…` : label;
                      return {
                        value: scene.id,
                        label: `Scene ${index + 1} · ${truncated}`,
                      };
                    })}
                    ariaLabel="Select scene for history"
                    title="Select scene for history"
                    className="w-full"
                  />
                  <button
                    type="button"
                    className="btn-base btn-soft-primary flex items-center justify-center gap-2 px-3 py-2 text-sm"
                    onClick={handleOpenHistory}
                    disabled={!selectedSceneId}
                    aria-label="Open scene history"
                  >
                    <Hourglass className="icon-sm" />
                    <span className="hidden sm:inline">View history</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-2 md:p-3 lg:p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">Loading assets...</div>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="empty-state">
            <Folder className="empty-state-icon" />
            <p className="text-lg">
              {filterType === "all"
                ? "No assets yet"
                : `No ${filterType}s found`}
            </p>
            <p className="text-sm mt-2">
              Assets will appear here as you generate images and videos
            </p>
          </div>
        ) : layoutMode === "list" ? (
          compactList ? (
            <div className="flex flex-col">
              {filteredAssets.map((asset) => (
                <button
                  type="button"
                  key={asset.id}
                  className="menu-item flex items-center gap-2"
                  onClick={() => {
                    if (asset.sceneId && onOpenManage) {
                      onOpenManage(asset.sceneId);
                    }
                  }}
                  title={asset.fileName}
                  aria-label={`Open ${asset.fileName} (${(
                    asset.size /
                    (1024 * 1024)
                  ).toFixed(1)} MB)`}
                >
                  {asset.type === "image" ? (
                    <Image className="icon-sm" />
                  ) : asset.type === "video" ? (
                    <Film className="icon-sm" />
                  ) : (
                    <File className="icon-sm" />
                  )}
                  <span className="text-truncate text-sm flex-1">
                    {asset.fileName}
                  </span>
                  <span className="text-xs text-muted">
                    {(asset.size / (1024 * 1024)).toFixed(1)} MB
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAssets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onRename={handleRename}
                  onDelete={handleDelete}
                  onDownload={handleDownload}
                  onClick={(asset) => {
                    if (asset.sceneId && onOpenManage) {
                      onOpenManage(asset.sceneId);
                    }
                  }}
                  layout="list"
                  variant={cardVariant}
                />
              ))}
            </div>
          )
        ) : (
          <div className="grid storyboard-grid gap-2 md:gap-3 lg:gap-4">
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className={cardVariant === "scene" ? "aspect-[16/9]" : ""}
              >
                <AssetCard
                  asset={asset}
                  onRename={handleRename}
                  onDelete={handleDelete}
                  onDownload={handleDownload}
                  onClick={(asset) => {
                    if (asset.sceneId && onOpenManage) {
                      onOpenManage(asset.sceneId);
                    }
                  }}
                  variant={cardVariant}
                  layout="grid"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
