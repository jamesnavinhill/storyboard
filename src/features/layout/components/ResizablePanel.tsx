import React from "react";

interface ResizablePanelProps {
  children: React.ReactNode;
  className?: string;
  isCollapsed?: boolean;
  position?: "left" | "right";
}

/**
 * Reusable resizable panel component
 * Wraps content in a panel that can be resized and collapsed
 */
export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  children,
  className = "",
  isCollapsed = false,
  position = "left",
}) => {
  const collapsedClass = isCollapsed
    ? position === "left"
      ? "layout-sidebar--collapsed"
      : "layout-scene-manager--collapsed"
    : "";

  return (
    <aside className={`${className} ${collapsedClass}`.trim()}>
      {children}
    </aside>
  );
};
