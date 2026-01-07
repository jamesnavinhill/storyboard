import React, { useState, useCallback } from "react";
import type { AssetEntity } from "@/services/projectService";
import { Pencil, Trash2, Download, Image, Film, File } from "lucide-react";

interface AssetCardProps {
  asset: AssetEntity;
  onRename: (assetId: string, fileName: string) => Promise<void>;
  onDelete: (assetId: string) => Promise<void>;
  onDownload: (asset: AssetEntity) => void;
  onClick?: (asset: AssetEntity) => void;
  variant?: "default" | "scene";
  layout?: "grid" | "list";
}

export const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  onRename,
  onDelete,
  onDownload,
  onClick,
  variant = "default",
  layout = "grid",
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState(asset.fileName);

  const handleRename = useCallback(async () => {
    if (!editingName.trim() || editingName === asset.fileName) {
      setIsEditing(false);
      return;
    }
    await onRename(asset.id, editingName.trim());
    setIsEditing(false);
  }, [editingName, asset.id, asset.fileName, onRename]);

  const handleDelete = useCallback(async () => {
    if (
      window.confirm(
        `Delete "${asset.fileName}"? This action cannot be undone.`
      )
    ) {
      await onDelete(asset.id);
    }
  }, [asset.id, asset.fileName, onDelete]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const getAssetIcon = () => {
    switch (asset.type) {
      case "image":
        return <Image className="w-8 h-8 text-primary" />;
      case "video":
        return <Film className="w-8 h-8 text-primary" />;
      case "attachment":
        return <File className="w-8 h-8 text-primary" />;
    }
  };

  const renderPreview = (thumbnailClass = "aspect-video") => (
    <div className={`thumbnail-preview ${thumbnailClass}`}>
      {asset.type === "image" && asset.url ? (
        <img
          src={asset.thumbnailUrl || asset.url}
          alt={asset.fileName}
          loading="lazy"
        />
      ) : asset.type === "video" && asset.thumbnailUrl ? (
        <img src={asset.thumbnailUrl} alt={asset.fileName} loading="lazy" />
      ) : (
        getAssetIcon()
      )}
    </div>
  );

  const actionButtons = (
    <div className="action-group" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => {
          setIsEditing(true);
          setEditingName(asset.fileName);
        }}
        className="icon-btn-overlay p-2"
        aria-label="Rename asset"
        title="Rename"
      >
        <Pencil className="icon-sm" />
      </button>
      <button
        type="button"
        onClick={() => onDownload(asset)}
        className="icon-btn-overlay p-2"
        aria-label="Download asset"
        title="Download"
      >
        <Download className="icon-sm" />
      </button>
      <button
        type="button"
        onClick={handleDelete}
        className="icon-btn-overlay p-2"
        aria-label="Delete asset"
        title="Delete"
      >
        <Trash2 className="icon-sm" />
      </button>
    </div>
  );

  if (layout === "list") {
    return (
      <div
        className="group flex items-center gap-4 rounded-lg bg-white/5 p-4 transition-colors hover:bg-white/10 cursor-pointer"
        onClick={() => onClick?.(asset)}
      >
        <div className="relative h-20 w-32 overflow-hidden rounded-md">
          {renderPreview("absolute inset-0")}
        </div>
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editingName}
              onChange={(event) => setEditingName(event.target.value)}
              onBlur={handleRename}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void handleRename();
                } else if (event.key === "Escape") {
                  setIsEditing(false);
                  setEditingName(asset.fileName);
                }
              }}
              className="w-full rounded-md border border-muted bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Asset file name"
              placeholder="Asset name"
              autoFocus
            />
          ) : (
            <h3
              className="text-sm font-semibold text-truncate text-foreground"
              title={asset.fileName}
            >
              {asset.fileName}
            </h3>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
            <span>{formatFileSize(asset.size)}</span>
            <span>{formatDate(asset.createdAt)}</span>
          </div>
          {asset.metadata && Object.keys(asset.metadata).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {Object.entries(asset.metadata)
                .filter(([key]) => key !== "thumbnailUrl")
                .slice(0, 3)
                .map(([key, value]) => (
                  <span
                    key={key}
                    className="metadata-badge"
                    title={`${key}: ${value}`}
                  >
                    {key}
                  </span>
                ))}
            </div>
          )}
        </div>
        <div className="hover-visible">{actionButtons}</div>
      </div>
    );
  }

  const sceneStyleClasses =
    "group relative flex h-full w-full flex-col overflow-hidden rounded-lg bg-white/5 transition-colors hover:bg-white/10 cursor-pointer";
  const defaultClasses =
    "group relative w-full bg-background border border-muted rounded-lg overflow-hidden transition-all hover:shadow-md cursor-pointer";

  return (
    <div
      className={variant === "scene" ? sceneStyleClasses : defaultClasses}
      onClick={() => onClick?.(asset)}
    >
      <div className="relative">
        {renderPreview("aspect-video")}
        {variant === "scene" ? (
          <div className="absolute top-3 right-3 z-20 hover-visible">
            {actionButtons}
          </div>
        ) : (
          <div className="overlay-center overlay-dark hover-visible">
            {actionButtons}
          </div>
        )}
      </div>
      <div className="p-3">
        {isEditing ? (
          <input
            type="text"
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void handleRename();
              } else if (e.key === "Escape") {
                setIsEditing(false);
                setEditingName(asset.fileName);
              }
            }}
            autoFocus
            aria-label="Asset file name"
            placeholder="Asset name"
            className="w-full px-2 py-1 text-sm font-semibold bg-black/30 border border-muted rounded focus:outline-none focus:ring-2 focus:ring-primary"
          />
        ) : (
          <h3
            className="text-sm font-semibold text-truncate text-foreground"
            title={asset.fileName}
          >
            {asset.fileName}
          </h3>
        )}
        <div className="flex items-center justify-between mt-2 text-xs text-muted">
          <span>{formatFileSize(asset.size)}</span>
          <span>{formatDate(asset.createdAt)}</span>
        </div>
        {asset.metadata && Object.keys(asset.metadata).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {Object.entries(asset.metadata)
              .filter(([key]) => key !== "thumbnailUrl")
              .slice(0, 3)
              .map(([key, value]) => (
                <span
                  key={key}
                  className="metadata-badge"
                  title={`${key}: ${value}`}
                >
                  {key}
                </span>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
