import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AgentDropdown } from "../AgentDropdown";

// Mock fetch globally
global.fetch = vi.fn();

describe("AgentDropdown - Workflow Selection", () => {
  const mockOnWorkflowSelect = vi.fn();
  const mockOnManageWorkflows = vi.fn();

  const mockWorkflows = [
    {
      id: "workflow_music_video",
      name: "Music Video",
      description: "Create music video storyboards",
      category: "music-video" as const,
      systemInstruction: "Test instruction",
    },
    {
      id: "workflow_concept_art",
      name: "Concept Art",
      description: "Create concept art storyboards",
      category: "concept-art" as const,
      systemInstruction: "Test instruction",
    },
  ];

  const mockSubtypes = [
    {
      id: "subtype_album_art",
      workflowId: "workflow_concept_art",
      name: "Album Art",
      description: "Album cover design",
      instructionModifier: "Focus on album art",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === "/api/workflows") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ workflows: mockWorkflows }),
        });
      }
      if (url.includes("/subtypes")) {
        const workflowId = url.split("/")[3];
        if (workflowId === "workflow_concept_art") {
          return Promise.resolve({
            ok: true,
            json: async () => ({ subtypes: mockSubtypes }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ subtypes: [] }),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });
  });

  it("should display concept art workflow in dropdown", async () => {
    const user = userEvent.setup();
    render(
      <AgentDropdown
        selectedWorkflowId={null}
        selectedSubtypeId={null}
        onWorkflowSelect={mockOnWorkflowSelect}
        onManageWorkflows={mockOnManageWorkflows}
      />
    );

    // Open dropdown
    const button = screen.getByRole("button", { name: /select workflow/i });
    await user.click(button);

    // Wait for workflows to load - check for category headers
    await waitFor(() => {
      const buttons = screen.getAllByRole("button");
      const conceptArtButton = buttons.find((b) =>
        b.textContent?.includes("Concept Art")
      );
      expect(conceptArtButton).toBeDefined();
    });
  });

  it("should handle concept art workflow selection", async () => {
    const user = userEvent.setup();
    render(
      <AgentDropdown
        selectedWorkflowId={null}
        selectedSubtypeId={null}
        onWorkflowSelect={mockOnWorkflowSelect}
        onManageWorkflows={mockOnManageWorkflows}
      />
    );

    // Open dropdown
    const button = screen.getByRole("button", { name: /select workflow/i });
    await user.click(button);

    // Wait for workflows to load
    await waitFor(() => {
      const buttons = screen.getAllByRole("button");
      const conceptArtButton = buttons.find(
        (b) =>
          b.textContent?.includes("Concept Art") && b.textContent?.includes("▶")
      );
      expect(conceptArtButton).toBeDefined();
    });

    // Find and click the Concept Art category button to expand it
    const buttons = screen.getAllByRole("button");
    const conceptArtCategoryButton = buttons.find(
      (b) =>
        b.textContent?.includes("Concept Art") && b.textContent?.includes("▶")
    );
    if (conceptArtCategoryButton) {
      await user.click(conceptArtCategoryButton);
    }

    // Now find and click the actual Concept Art workflow button
    await waitFor(() => {
      const workflowButtons = screen.getAllByRole("button");
      const conceptArtWorkflowButton = workflowButtons.find((b) => {
        const div = b.querySelector(".font-medium");
        return div?.textContent === "Concept Art";
      });
      expect(conceptArtWorkflowButton).toBeDefined();
    });

    const workflowButtons = screen.getAllByRole("button");
    const conceptArtWorkflowButton = workflowButtons.find((b) => {
      const div = b.querySelector(".font-medium");
      return div?.textContent === "Concept Art";
    });

    if (conceptArtWorkflowButton) {
      await user.click(conceptArtWorkflowButton);
    }

    await waitFor(() => {
      expect(mockOnWorkflowSelect).toHaveBeenCalledWith(
        "workflow_concept_art",
        null
      );
    });
  });

  it("should display selected concept art workflow", async () => {
    render(
      <AgentDropdown
        selectedWorkflowId="workflow_concept_art"
        selectedSubtypeId={null}
        onWorkflowSelect={mockOnWorkflowSelect}
        onManageWorkflows={mockOnManageWorkflows}
      />
    );

    // Wait for workflows to load
    await waitFor(() => {
      expect(screen.getByText("Concept Art")).toBeInTheDocument();
    });
  });

  it("should display album art subtype when available", async () => {
    const user = userEvent.setup();
    render(
      <AgentDropdown
        selectedWorkflowId={null}
        selectedSubtypeId={null}
        onWorkflowSelect={mockOnWorkflowSelect}
        onManageWorkflows={mockOnManageWorkflows}
      />
    );

    // Open dropdown
    const button = screen.getByRole("button", { name: /select workflow/i });
    await user.click(button);

    // Wait for workflows to load
    await waitFor(() => {
      expect(screen.getByText("Concept Art")).toBeInTheDocument();
    });

    // Expand Concept Art category
    const categoryButton = screen.getByText("Concept Art");
    await user.click(categoryButton);

    // Album Art subtype should be visible
    await waitFor(() => {
      expect(screen.getByText("Album Art")).toBeInTheDocument();
    });
  });

  it("should handle album art subtype selection", async () => {
    const user = userEvent.setup();
    render(
      <AgentDropdown
        selectedWorkflowId={null}
        selectedSubtypeId={null}
        onWorkflowSelect={mockOnWorkflowSelect}
        onManageWorkflows={mockOnManageWorkflows}
      />
    );

    // Open dropdown
    const button = screen.getByRole("button", { name: /select workflow/i });
    await user.click(button);

    // Wait for workflows to load
    await waitFor(() => {
      expect(screen.getByText("Concept Art")).toBeInTheDocument();
    });

    // Expand Concept Art category
    const categoryButton = screen.getByText("Concept Art");
    await user.click(categoryButton);

    // Click Album Art subtype
    await waitFor(() => {
      expect(screen.getByText("Album Art")).toBeInTheDocument();
    });

    const albumArtButton = screen.getByText("Album Art");
    await user.click(albumArtButton);

    await waitFor(() => {
      expect(mockOnWorkflowSelect).toHaveBeenCalledWith(
        "workflow_concept_art",
        "subtype_album_art"
      );
    });
  });

  it("should display selected subtype in button text", async () => {
    render(
      <AgentDropdown
        selectedWorkflowId="workflow_concept_art"
        selectedSubtypeId="subtype_album_art"
        onWorkflowSelect={mockOnWorkflowSelect}
        onManageWorkflows={mockOnManageWorkflows}
      />
    );

    // Wait for workflows to load
    await waitFor(() => {
      expect(screen.getByText(/Concept Art - Album Art/i)).toBeInTheDocument();
    });
  });
});
