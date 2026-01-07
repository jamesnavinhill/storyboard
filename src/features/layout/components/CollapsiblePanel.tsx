import React from "react";
import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from "../../../ui/icons";

interface CollapsiblePanelProps {
  children: React.ReactNode;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  position?: "left" | "right";
  className?: string;
}

/**
 * Reusable collapsible panel component
 * Provides a panel with a collapse/expand button
 */
export const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
  children,
  isCollapsed,
  onToggleCollapse,
  position = "left",
  className = "",
}) => {
  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleCollapse}
          className="btn-base btn-ghost p-2 rounded-md"
          aria-label={isCollapsed ? "Expand panel" : "Collapse panel"}
        >
          {position === "left" ? (
            isCollapsed ? (
              <ChevronDoubleRightIcon className="icon-md" />
            ) : (
              <ChevronDoubleLeftIcon className="icon-md" />
            )
          ) : isCollapsed ? (
            <ChevronDoubleLeftIcon className="icon-md" />
          ) : (
            <ChevronDoubleRightIcon className="icon-md" />
          )}
        </button>
        {!isCollapsed && children}
      </div>
    </div>
  );
};
