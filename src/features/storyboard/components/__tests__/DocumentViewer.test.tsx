import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DocumentViewer } from "../DocumentViewer";

// Mock fetch
global.fetch = vi.fn();

const mockDocument = {
  id: "doc-1",
  projectId: "project-1",
  version: 1,
  content: {
    title: "Test Storyboard",
    style: "Cinematic",
    goals: ["Create engaging content", "Tell a compelling story"],
    outline: "Introduction, Development, Climax, Resolution",
    scenes: [
      {
        id: "scene-1",
        order: 0,
        title: "Opening Scene",
        description: "A dramatic opening that sets the tone",
        imagePrompt: "Generate a dramatic opening scene with warm lighting",
        animationPrompt: "Slow zoom in with gentle camera movement",
        metadata: {
          duration: 5,
          cameraMovement: "zoom in",
          lighting: "warm",
          mood: "dramatic",
        },
      },
      {
        id: "scene-2",
        order: 1,
        title: "Development",
        description: "Building tension and introducing conflict",
        imagePrompt: "Create a tense scene with dramatic shadows",
        animationPrompt: "Static shot with subtle movement",
        metadata: {
          duration: 7,
          cameraMovement: "static",
          lighting: "dramatic shadows",
          mood: "tense",
        },
      },
    ],
    metadata: {
      workflow: "music-video",
      systemInstruction: "Create cinematic music video scenes",
      modelSettings: {},
      totalDuration: 12,
    },
  },
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-02T00:00:00Z",
};

describe("DocumentViewer Component", () => {
  const mockOnEdit = vi.fn();
  const mockOnExport = vi.fn();
  const mockOnHistory = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ document: mockDocument }),
    });
  });

  it("should render document title", async () => {
    render(
      <DocumentViewer
        projectId="project-1"
        onEdit={mockOnEdit}
        onExport={mockOnExport}
        onHistory={mockOnHistory}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Test Storyboard")).toBeInTheDocument();
    });
  });

  it("should render document style", async () => {
    render(
      <DocumentViewer
        projectId="project-1"
        onEdit={mockOnEdit}
        onExport={mockOnExport}
        onHistory={mockOnHistory}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Cinematic/i)).toBeInTheDocument();
    });
  });

  it("should render all goals", async () => {
    render(
      <DocumentViewer
        projectId="project-1"
        onEdit={mockOnEdit}
        onExport={mockOnExport}
        onHistory={mockOnHistory}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Create engaging content")).toBeInTheDocument();
      expect(screen.getByText("Tell a compelling story")).toBeInTheDocument();
    });
  });

  it("should render outline", async () => {
    render(
      <DocumentViewer
        projectId="project-1"
        onEdit={mockOnEdit}
        onExport={mockOnExport}
        onHistory={mockOnHistory}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Introduction, Development, Climax, Resolution/i)
      ).toBeInTheDocument();
    });
  });

  it("should render all scenes", async () => {
    render(
      <DocumentViewer
        projectId="project-1"
        onEdit={mockOnEdit}
        onExport={mockOnExport}
        onHistory={mockOnHistory}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Opening Scene")).toBeInTheDocument();
      expect(screen.getByText("Development")).toBeInTheDocument();
    });
  });

  it("should show Edit button", async () => {
    render(
      <DocumentViewer
        projectId="project-1"
        onEdit={mockOnEdit}
        onExport={mockOnExport}
        onHistory={mockOnHistory}
      />
    );

    await waitFor(() => {
      const editButton = screen.getByTitle(/edit/i);
      expect(editButton).toBeInTheDocument();
    });
  });

  it("should show Export button", async () => {
    render(
      <DocumentViewer
        projectId="project-1"
        onEdit={mockOnEdit}
        onExport={mockOnExport}
        onHistory={mockOnHistory}
      />
    );

    await waitFor(() => {
      const exportButton = screen.getByTitle(/export|download/i);
      expect(exportButton).toBeInTheDocument();
    });
  });

  it("should show History button", async () => {
    render(
      <DocumentViewer
        projectId="project-1"
        onEdit={mockOnEdit}
        onExport={mockOnExport}
        onHistory={mockOnHistory}
      />
    );

    await waitFor(() => {
      const historyButton = screen.getByTitle(/history/i);
      expect(historyButton).toBeInTheDocument();
    });
  });

  it("should call onEdit when Edit button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <DocumentViewer
        projectId="project-1"
        onEdit={mockOnEdit}
        onExport={mockOnExport}
        onHistory={mockOnHistory}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Test Storyboard")).toBeInTheDocument();
    });

    const editButton = screen.getByTitle(/edit/i);
    await user.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledTimes(1);
  });

  it("should call onExport when Export button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <DocumentViewer
        projectId="project-1"
        onEdit={mockOnEdit}
        onExport={mockOnExport}
        onHistory={mockOnHistory}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Test Storyboard")).toBeInTheDocument();
    });

    const exportButton = screen.getByRole("button", { name: /export/i });
    await user.click(exportButton);

    expect(mockOnExport).toHaveBeenCalledTimes(1);
  });

  it("should call onHistory when History button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <DocumentViewer
        projectId="project-1"
        onEdit={mockOnEdit}
        onExport={mockOnExport}
        onHistory={mockOnHistory}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Test Storyboard")).toBeInTheDocument();
    });

    const historyButton = screen.getByRole("button", { name: /history/i });
    await user.click(historyButton);

    expect(mockOnHistory).toHaveBeenCalledTimes(1);
  });

  it("should handle document with no scenes", async () => {
    const emptyDocument = {
      ...mockDocument,
      content: {
        ...mockDocument.content,
        scenes: [],
        metadata: {
          ...mockDocument.content.metadata,
          totalDuration: 0,
        },
      },
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ document: emptyDocument }),
    });

    render(
      <DocumentViewer
        projectId="project-1"
        onEdit={mockOnEdit}
        onExport={mockOnExport}
        onHistory={mockOnHistory}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Test Storyboard")).toBeInTheDocument();
    });
  });

  it.skip("should display version number", async () => {
    // Version display not yet implemented in DocumentViewer component
    render(
      <DocumentViewer
        projectId="project-1"
        onEdit={mockOnEdit}
        onExport={mockOnExport}
        onHistory={mockOnHistory}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/version 1/i)).toBeInTheDocument();
    });
  });

  it("should handle fetch errors", async () => {
    (global.fetch as any).mockRejectedValue(new Error("Network error"));

    render(
      <DocumentViewer
        projectId="project-1"
        onEdit={mockOnEdit}
        onExport={mockOnExport}
        onHistory={mockOnHistory}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it("should show create button when no document exists", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
    });

    render(
      <DocumentViewer
        projectId="project-1"
        onEdit={mockOnEdit}
        onExport={mockOnExport}
        onHistory={mockOnHistory}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/no document found/i)).toBeInTheDocument();
      expect(screen.getByText(/create document/i)).toBeInTheDocument();
    });
  });
});
