import React from "react";
import type { PanelTarget } from "../types";

interface PanelResizerProps {
  target: PanelTarget;
  onResize: (
    target: PanelTarget
  ) => (event: React.PointerEvent<HTMLDivElement>) => void;
}

/**
 * Reusable panel resizer component
 * Provides a draggable divider between panels
 */
export const PanelResizer: React.FC<PanelResizerProps> = ({
  target,
  onResize,
}) => {
  return (
    <div
      className="layout-resizer"
      onPointerDown={onResize(target)}
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize ${target} panel`}
    />
  );
};
