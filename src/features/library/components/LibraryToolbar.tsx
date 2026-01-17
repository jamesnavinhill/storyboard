import React from "react";
import { Search, Folder, Image, FileText, Grid3x3, List } from "lucide-react";

export interface LibraryToolbarProps {
  variant: "sidebar" | "full";
  activeTab: "projects" | "assets" | "document";
  onTabChange: (tab: "projects" | "assets" | "document") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
}

/**
 * LibraryToolbar component
 * Provides tab selection, search, and view mode controls for the library
 */
export const LibraryToolbar: React.FC<LibraryToolbarProps> = ({
  variant,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
}) => {
  const isSidebarVariant = variant === "sidebar";

  const toolbarClasses = isSidebarVariant
    ? "border-b border-muted px-3 py-2"
    : "library-toolbar border-b border-muted px-3 py-2";

  const tabButtonClasses = (tab: "projects" | "assets" | "document") =>
    `btn-base px-3 py-1.5 text-sm rounded-md font-medium btn-ghost hover-primary transition-colors ${
      activeTab === tab ? "text-primary" : ""
    }`;

  const viewToggleButtonClasses = (mode: "grid" | "list") =>
    `btn-base p-2 rounded-md btn-ghost hover-primary transition-colors ${
      viewMode === mode ? "text-primary" : ""
    }`;

  return (
    <div className={toolbarClasses}>
      {!isSidebarVariant ? (
        <div className="library-toolbar-row">
          <div className="library-tabs">
            <button
              type="button"
              className={tabButtonClasses("projects")}
              onClick={() => onTabChange("projects")}
            >
              <Folder className="icon-sm" />
              <span className="library-tab-label">Projects</span>
            </button>
            <button
              type="button"
              className={tabButtonClasses("assets")}
              onClick={() => onTabChange("assets")}
            >
              <Image className="icon-sm" />
              <span className="library-tab-label">Assets</span>
            </button>
            <button
              type="button"
              className={tabButtonClasses("document")}
              onClick={() => onTabChange("document")}
            >
              <FileText className="icon-sm" />
              <span className="library-tab-label">Document</span>
            </button>
          </div>
          <div className="library-view-toggle">
            <button
              type="button"
              className={viewToggleButtonClasses("grid")}
              onClick={() => onViewModeChange("grid")}
              aria-label="Grid view"
            >
              <Grid3x3 className="icon-sm" />
            </button>
            <button
              type="button"
              className={viewToggleButtonClasses("list")}
              onClick={() => onViewModeChange("list")}
              aria-label="List view"
            >
              <List className="icon-sm" />
            </button>
          </div>
        </div>
      ) : null}
      {!isSidebarVariant && (
        <div className="library-controls">
          <div className="library-search">
            <Search className="library-search-icon" />
            <input
              className="input-base library-search-input"
              placeholder="Search"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onSearchChange(e.target.value)
              }
              aria-label="Search library"
            />
          </div>
        </div>
      )}
    </div>
  );
};
