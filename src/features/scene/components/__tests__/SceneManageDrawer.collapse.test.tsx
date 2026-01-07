import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SceneManageDrawer } from "../SceneManageDrawer";

const baseProps = {
  variant: "panel" as const,
  isOpen: true,
  scene: null,
  groups: [],
  tags: [],
  onClose: vi.fn(),
  onUpdateScene: vi.fn(),
  onAssignGroup: vi.fn(),
  onAddTag: vi.fn(),
  onRemoveTag: vi.fn(),
  onOpenGroupManager: vi.fn(),
  onOpenTagManager: vi.fn(),
  onExportImage: vi.fn(),
  history: {
    entries: [],
    isLoading: false,
    error: null as string | null,
    onRefresh: vi.fn(),
    onRestore: vi.fn(),
    restoringEntryId: null as string | null,
  },
};

describe("SceneManageDrawer (panel collapse)", () => {
  it("calls onToggleCollapse and shows collapsed UI", () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <SceneManageDrawer
        {...baseProps}
        isCollapsed={false}
        onToggleCollapse={onToggle}
      />
    );

    const collapseBtn = screen.getByLabelText("Collapse scene manager");
    fireEvent.click(collapseBtn);
    expect(onToggle).toHaveBeenCalled();

    rerender(
      <SceneManageDrawer
        {...baseProps}
        isCollapsed={true}
        onToggleCollapse={onToggle}
      />
    );
    expect(screen.getByLabelText("Expand scene manager")).toBeInTheDocument();
  });
});
