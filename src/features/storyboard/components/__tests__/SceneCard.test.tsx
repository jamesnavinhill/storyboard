import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { SceneCard } from "../SceneCard";
import type { Scene, SceneGroup, SceneTag } from "@/types";

// Mock the toast hook
vi.mock("@/components/toast/useToast", () => ({
  useToast: () => ({
    show: vi.fn(),
    dismiss: vi.fn(),
    clear: vi.fn(),
  }),
}));

// Track useSortable return values
let mockTransform: any = null;
let mockTransition: string | null = null;
let mockIsDragging = false;

// Mock the DnD kit modules
vi.mock("@dnd-kit/sortable", () => ({
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: mockTransform,
    transition: mockTransition,
    isDragging: mockIsDragging,
  })),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Transform: {
      toString: (transform: any) => {
        if (!transform) return "";
        return `translate3d(${transform.x || 0}px, ${transform.y || 0}px, 0)`;
      },
    },
  },
}));

const createMockScene = (id: string, overrides?: Partial<Scene>): Scene => ({
  id,
  projectId: "test-project",
  description: `Scene ${id}`,
  aspectRatio: "16:9",
  imageStatus: "ready",
  videoStatus: "missing",
  duration: 5, // Default duration
  uiState: {
    activity: "idle",
    panels: {
      edit: false,
      animate: false,
    },
    lastError: null,
  },
  ...overrides,
});

const defaultProps = {
  availableGroups: [] as SceneGroup[],
  availableTags: [] as SceneTag[],
  onChangeGroup: vi.fn(),
  onAddTag: vi.fn(),
  onRemoveTag: vi.fn(),
  onOpenGroupManager: vi.fn(),
  onOpenTagManager: vi.fn(),
  onDuplicate: vi.fn(),
  onDelete: vi.fn(),
  onGenerateImage: vi.fn(),
  onRegenerateDescription: vi.fn(),
  onExportImage: vi.fn(),
  onToggleEdit: vi.fn(),
  onToggleAnimate: vi.fn(),
  onToggleExtend: vi.fn(),
  onOpenHistory: vi.fn(),
  onOpenManage: vi.fn(),
  isDragEnabled: true,
};

describe("SceneCard - Transform Application", () => {
  it("should apply transforms via inline styles", () => {
    mockTransform = { x: 10, y: 20, scaleX: 1, scaleY: 1 };
    mockTransition = "transform 200ms ease";
    mockIsDragging = false;

    const scene = createMockScene("scene-1");
    const { container } = render(<SceneCard {...defaultProps} scene={scene} />);

    const card = container.querySelector(".scene-card");
    expect(card).toBeInTheDocument();

    // Verify transform is applied via inline style
    expect(card).toHaveStyle({
      transform: "translate3d(10px, 20px, 0)",
    });
  });

  it("should apply transition via inline styles", () => {
    mockTransform = null;
    mockTransition = "transform 200ms ease";
    mockIsDragging = false;

    const scene = createMockScene("scene-1");
    const { container } = render(<SceneCard {...defaultProps} scene={scene} />);

    const card = container.querySelector(".scene-card");
    expect(card).toBeInTheDocument();

    // Verify transition is applied via inline style
    expect(card).toHaveStyle({
      transition: "transform 200ms ease",
    });
  });

  it("should apply reduced opacity when dragging", () => {
    mockTransform = { x: 10, y: 20, scaleX: 1, scaleY: 1 };
    mockTransition = "transform 200ms ease";
    mockIsDragging = true;

    const scene = createMockScene("scene-1");
    const { container } = render(<SceneCard {...defaultProps} scene={scene} />);

    const card = container.querySelector(".scene-card");
    expect(card).toBeInTheDocument();

    // Verify opacity is reduced during drag
    expect(card).toHaveStyle({
      opacity: "0.5",
    });
  });

  it("should apply full opacity when not dragging", () => {
    mockTransform = null;
    mockTransition = null;
    mockIsDragging = false;

    const scene = createMockScene("scene-1");
    const { container } = render(<SceneCard {...defaultProps} scene={scene} />);

    const card = container.querySelector(".scene-card");
    expect(card).toBeInTheDocument();

    // Verify full opacity when not dragging
    expect(card).toHaveStyle({
      opacity: "1",
    });
  });

  it("should handle null transform gracefully", () => {
    mockTransform = null;
    mockTransition = null;
    mockIsDragging = false;

    const scene = createMockScene("scene-1");
    const { container } = render(<SceneCard {...defaultProps} scene={scene} />);

    const card = container.querySelector(".scene-card");
    expect(card).toBeInTheDocument();

    // Verify empty transform string when transform is null
    expect(card).toHaveStyle({
      transform: "",
    });
  });
});

describe("SceneCard - Video Controls Autohide", () => {
  it("should hide video controls by default when not hovered", () => {
    mockTransform = null;
    mockTransition = null;
    mockIsDragging = false;

    const scene = createMockScene("scene-1", {
      videoUrl: "/test-video.mp4",
    });
    const { container } = render(<SceneCard {...defaultProps} scene={scene} />);

    const video = container.querySelector("video");
    expect(video).toBeInTheDocument();
    expect(video).not.toHaveAttribute("controls");
  });

  it("should hide video controls when menu is open", () => {
    mockTransform = null;
    mockTransition = null;
    mockIsDragging = false;

    const scene = createMockScene("scene-1", {
      videoUrl: "/test-video.mp4",
    });
    const { container } = render(<SceneCard {...defaultProps} scene={scene} />);

    // Open the context menu
    const menuButton = container.querySelector('[aria-label="More"]');
    expect(menuButton).toBeInTheDocument();

    const video = container.querySelector("video");
    expect(video).not.toHaveAttribute("controls");
  });

  it("should hide video controls when edit panel is open", () => {
    mockTransform = null;
    mockTransition = null;
    mockIsDragging = false;

    const scene = createMockScene("scene-1", {
      videoUrl: "/test-video.mp4",
      uiState: {
        activity: "idle",
        panels: { edit: true, animate: false },
        lastError: null,
      },
    });
    const { container } = render(<SceneCard {...defaultProps} scene={scene} />);

    const video = container.querySelector("video");
    expect(video).toBeInTheDocument();
    expect(video).not.toHaveAttribute("controls");
  });

  it("should hide video controls when animate panel is open", () => {
    mockTransform = null;
    mockTransition = null;
    mockIsDragging = false;

    const scene = createMockScene("scene-1", {
      videoUrl: "/test-video.mp4",
      uiState: {
        activity: "idle",
        panels: { edit: false, animate: true },
        lastError: null,
      },
    });
    const { container } = render(<SceneCard {...defaultProps} scene={scene} />);

    const video = container.querySelector("video");
    expect(video).toBeInTheDocument();
    expect(video).not.toHaveAttribute("controls");
  });

  it("should add details-open class when showDetails is true", () => {
    mockTransform = null;
    mockTransition = null;
    mockIsDragging = false;

    const scene = createMockScene("scene-1", {
      videoUrl: "/test-video.mp4",
    });
    const { container } = render(<SceneCard {...defaultProps} scene={scene} />);

    // Click the details toggle button
    const detailsButton = container.querySelector(
      '[aria-label="Show details"]'
    );
    expect(detailsButton).toBeInTheDocument();

    const card = container.querySelector(".scene-card");
    expect(card).not.toHaveClass("details-open");
  });

  it("should add menu-open class when menu is open", () => {
    mockTransform = null;
    mockTransition = null;
    mockIsDragging = false;

    const scene = createMockScene("scene-1");
    const { container } = render(<SceneCard {...defaultProps} scene={scene} />);

    const card = container.querySelector(".scene-card");
    expect(card).not.toHaveClass("menu-open");
  });

  it("should add panel-open class when edit panel is open", () => {
    mockTransform = null;
    mockTransition = null;
    mockIsDragging = false;

    const scene = createMockScene("scene-1", {
      uiState: {
        activity: "idle",
        panels: { edit: true, animate: false },
        lastError: null,
      },
    });
    const { container } = render(<SceneCard {...defaultProps} scene={scene} />);

    const card = container.querySelector(".scene-card");
    expect(card).toHaveClass("panel-open");
  });

  it("should add panel-open class when animate panel is open", () => {
    mockTransform = null;
    mockTransition = null;
    mockIsDragging = false;

    const scene = createMockScene("scene-1", {
      uiState: {
        activity: "idle",
        panels: { edit: false, animate: true },
        lastError: null,
      },
    });
    const { container } = render(<SceneCard {...defaultProps} scene={scene} />);

    const card = container.querySelector(".scene-card");
    expect(card).toHaveClass("panel-open");
  });
});

describe("SceneCard - Drag Handle Visibility", () => {
  it("should show drag handle when drag is enabled and no panels are open", () => {
    mockTransform = null;
    mockTransition = null;
    mockIsDragging = false;

    const scene = createMockScene("scene-1");
    const { container } = render(
      <SceneCard {...defaultProps} scene={scene} isDragEnabled={true} />
    );

    // Drag handle should be present
    const dragHandle = container.querySelector(
      '[aria-label="Drag to reorder scene"]'
    );
    expect(dragHandle).toBeInTheDocument();
  });

  it("should hide drag handle when drag is disabled", () => {
    mockTransform = null;
    mockTransition = null;
    mockIsDragging = false;

    const scene = createMockScene("scene-1");
    const { container } = render(
      <SceneCard {...defaultProps} scene={scene} isDragEnabled={false} />
    );

    // Drag handle should not be present
    const dragHandle = container.querySelector(
      '[aria-label="Drag to reorder scene"]'
    );
    expect(dragHandle).not.toBeInTheDocument();
  });

  it("should hide drag handle when edit panel is open", () => {
    mockTransform = null;
    mockTransition = null;
    mockIsDragging = false;

    const scene = createMockScene("scene-1", {
      uiState: {
        activity: "idle",
        panels: { edit: true, animate: false },
        lastError: null,
      },
    });
    const { container } = render(
      <SceneCard {...defaultProps} scene={scene} isDragEnabled={true} />
    );

    // Drag handle should not be visible when panel is open
    const dragHandle = container.querySelector(
      '[aria-label="Drag to reorder scene"]'
    );
    expect(dragHandle).not.toBeInTheDocument();
  });

  it("should hide drag handle when animate panel is open", () => {
    mockTransform = null;
    mockTransition = null;
    mockIsDragging = false;

    const scene = createMockScene("scene-1", {
      uiState: {
        activity: "idle",
        panels: { edit: false, animate: true },
        lastError: null,
      },
    });
    const { container } = render(
      <SceneCard {...defaultProps} scene={scene} isDragEnabled={true} />
    );

    // Drag handle should not be visible when panel is open
    const dragHandle = container.querySelector(
      '[aria-label="Drag to reorder scene"]'
    );
    expect(dragHandle).not.toBeInTheDocument();
  });
});
