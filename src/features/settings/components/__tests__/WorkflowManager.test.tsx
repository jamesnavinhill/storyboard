import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkflowManager, type Workflow } from "../WorkflowManager";

// Mock fetch
global.fetch = vi.fn();

// Mock window.confirm
global.confirm = vi.fn();

const mockWorkflows: Workflow[] = [
  {
    id: "workflow-1",
    name: "Music Video Workflow",
    description: "Create engaging music video storyboards",
    thumbnail: null,
    category: "music-video",
    systemInstruction: "Generate cinematic music video scenes",
    artStyle: "Cinematic",
    examples: ["Example 1", "Example 2"],
    metadata: { duration: 180 },
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "workflow-2",
    name: "Commercial Workflow",
    description: "Product commercial storyboards",
    thumbnail: null,
    category: "commercial",
    systemInstruction: "Generate product-focused commercial scenes",
    artStyle: "Modern",
    examples: null,
    metadata: null,
    createdAt: "2025-01-02T00:00:00Z",
    updatedAt: "2025-01-02T00:00:00Z",
  },
  {
    id: "workflow-3",
    name: "Social Media Workflow",
    description: "Short-form social content",
    thumbnail: null,
    category: "social",
    systemInstruction: "Generate engaging social media scenes",
    artStyle: "Vibrant",
    examples: null,
    metadata: null,
    createdAt: "2025-01-03T00:00:00Z",
    updatedAt: "2025-01-03T00:00:00Z",
  },
];

describe("WorkflowManager", () => {
  const mockOnEdit = vi.fn();
  const mockOnCreate = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ workflows: mockWorkflows }),
    });
    (global.confirm as any).mockReturnValue(true);
  });

  it("renders workflow list", async () => {
    render(
      <WorkflowManager
        onEdit={mockOnEdit}
        onCreate={mockOnCreate}
        onDelete={mockOnDelete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Music Video Workflow")).toBeInTheDocument();
      expect(screen.getByText("Commercial Workflow")).toBeInTheDocument();
      expect(screen.getByText("Social Media Workflow")).toBeInTheDocument();
    });
  });

  it("displays Create button", async () => {
    render(
      <WorkflowManager
        onEdit={mockOnEdit}
        onCreate={mockOnCreate}
        onDelete={mockOnDelete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/create workflow/i)).toBeInTheDocument();
    });
  });

  it("displays Edit buttons for each workflow", async () => {
    render(
      <WorkflowManager
        onEdit={mockOnEdit}
        onCreate={mockOnCreate}
        onDelete={mockOnDelete}
      />
    );

    await waitFor(() => {
      const editButtons = screen.getAllByTitle(/edit workflow/i);
      expect(editButtons).toHaveLength(3);
    });
  });

  it("displays Delete buttons for each workflow", async () => {
    render(
      <WorkflowManager
        onEdit={mockOnEdit}
        onCreate={mockOnCreate}
        onDelete={mockOnDelete}
      />
    );

    await waitFor(() => {
      const deleteButtons = screen.getAllByTitle(/delete workflow/i);
      expect(deleteButtons).toHaveLength(3);
    });
  });

  it("calls onCreate when Create button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <WorkflowManager
        onEdit={mockOnEdit}
        onCreate={mockOnCreate}
        onDelete={mockOnDelete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/create workflow/i)).toBeInTheDocument();
    });

    const createButton = screen.getByText(/create workflow/i);
    await user.click(createButton);

    expect(mockOnCreate).toHaveBeenCalledTimes(1);
  });

  it("calls onEdit with workflow when Edit button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <WorkflowManager
        onEdit={mockOnEdit}
        onCreate={mockOnCreate}
        onDelete={mockOnDelete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Music Video Workflow")).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTitle(/edit workflow/i);
    await user.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "workflow-1",
        name: "Music Video Workflow",
      })
    );
  });

  it("calls API and onDelete when Delete button is clicked", async () => {
    const user = userEvent.setup();
    const deleteFetch = vi.fn().mockResolvedValue({ ok: true });
    (global.fetch as any).mockImplementation((url: string, options?: any) => {
      if (options?.method === "DELETE") {
        return deleteFetch(url, options);
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ workflows: mockWorkflows }),
      });
    });

    render(
      <WorkflowManager
        onEdit={mockOnEdit}
        onCreate={mockOnCreate}
        onDelete={mockOnDelete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Music Video Workflow")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle(/delete workflow/i);
    await user.click(deleteButtons[0]);

    expect(global.confirm).toHaveBeenCalled();
    expect(deleteFetch).toHaveBeenCalledWith(
      "/api/workflows/workflow-1",
      expect.objectContaining({ method: "DELETE" })
    );
    expect(mockOnDelete).toHaveBeenCalledWith("workflow-1");
  });

  it("does not delete when user cancels confirmation", async () => {
    const user = userEvent.setup();
    (global.confirm as any).mockReturnValue(false);
    const deleteFetch = vi.fn();
    (global.fetch as any).mockImplementation((url: string, options?: any) => {
      if (options?.method === "DELETE") {
        return deleteFetch(url, options);
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ workflows: mockWorkflows }),
      });
    });

    render(
      <WorkflowManager
        onEdit={mockOnEdit}
        onCreate={mockOnCreate}
        onDelete={mockOnDelete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Music Video Workflow")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle(/delete workflow/i);
    await user.click(deleteButtons[0]);

    expect(global.confirm).toHaveBeenCalled();
    expect(deleteFetch).not.toHaveBeenCalled();
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it("filters workflows by category", async () => {
    const user = userEvent.setup();

    render(
      <WorkflowManager
        onEdit={mockOnEdit}
        onCreate={mockOnCreate}
        onDelete={mockOnDelete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Music Video Workflow")).toBeInTheDocument();
    });

    // Click on "Commercial" category filter
    const commercialButton = screen.getByText("Commercial");
    await user.click(commercialButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("category=commercial")
      );
    });
  });

  it("searches workflows by query", async () => {
    const user = userEvent.setup();

    render(
      <WorkflowManager
        onEdit={mockOnEdit}
        onCreate={mockOnCreate}
        onDelete={mockOnDelete}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/search workflows/i)
      ).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search workflows/i);
    await user.type(searchInput, "music");

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("search=music")
      );
    });
  });

  it("displays category badges", async () => {
    render(
      <WorkflowManager
        onEdit={mockOnEdit}
        onCreate={mockOnCreate}
        onDelete={mockOnDelete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Music Video")).toBeInTheDocument();
      expect(screen.getByText("Commercial")).toBeInTheDocument();
      expect(screen.getByText("Social")).toBeInTheDocument();
    });
  });

  it("displays workflow descriptions", async () => {
    render(
      <WorkflowManager
        onEdit={mockOnEdit}
        onCreate={mockOnCreate}
        onDelete={mockOnDelete}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText("Create engaging music video storyboards")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Product commercial storyboards")
      ).toBeInTheDocument();
    });
  });

  it("displays art style when available", async () => {
    render(
      <WorkflowManager
        onEdit={mockOnEdit}
        onCreate={mockOnCreate}
        onDelete={mockOnDelete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Style: Cinematic/i)).toBeInTheDocument();
      expect(screen.getByText(/Style: Modern/i)).toBeInTheDocument();
    });
  });

  it("shows empty state when no workflows exist", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ workflows: [] }),
    });

    render(
      <WorkflowManager
        onEdit={mockOnEdit}
        onCreate={mockOnCreate}
        onDelete={mockOnDelete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/no workflows found/i)).toBeInTheDocument();
      expect(
        screen.getByText(/create your first workflow/i)
      ).toBeInTheDocument();
    });
  });

  it("handles fetch errors gracefully", async () => {
    (global.fetch as any).mockRejectedValue(new Error("Network error"));

    render(
      <WorkflowManager
        onEdit={mockOnEdit}
        onCreate={mockOnCreate}
        onDelete={mockOnDelete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it("shows retry button on error", async () => {
    (global.fetch as any).mockRejectedValue(new Error("Network error"));

    render(
      <WorkflowManager
        onEdit={mockOnEdit}
        onCreate={mockOnCreate}
        onDelete={mockOnDelete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/retry/i)).toBeInTheDocument();
    });
  });
});
