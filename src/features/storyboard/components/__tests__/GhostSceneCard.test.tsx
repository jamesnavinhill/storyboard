import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GhostSceneCard } from "../GhostSceneCard";
import { ToastProvider } from "@/components/toast/ToastProvider";

// Helper to render with providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(<ToastProvider>{ui}</ToastProvider>);
};

describe("GhostSceneCard - Aspect Ratio Selection", () => {
  const mockOnCreateManual = vi.fn();
  const mockOnCreateAI = vi.fn();
  const mockOnUpdateScene = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnCreateManual.mockResolvedValue("new-scene-id");
  });

  it("should render 1:1 aspect ratio option", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <GhostSceneCard
        onCreateManual={mockOnCreateManual}
        onCreateAI={mockOnCreateAI}
        defaultAspectRatio="16:9"
        projectId="test-project"
        onUpdateScene={mockOnUpdateScene}
      />
    );

    // Expand the card
    const addButton = screen.getByRole("button", { name: /add new scene/i });
    await user.click(addButton);

    // Check aspect ratio dropdown
    await waitFor(() => {
      expect(screen.getByText("1:1 (Square)")).toBeInTheDocument();
    });
  });

  it("should handle 1:1 aspect ratio selection", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <GhostSceneCard
        onCreateManual={mockOnCreateManual}
        onCreateAI={mockOnCreateAI}
        defaultAspectRatio="16:9"
        projectId="test-project"
        onUpdateScene={mockOnUpdateScene}
      />
    );

    // Expand the card
    const addButton = screen.getByRole("button", { name: /add new scene/i });
    await user.click(addButton);

    // Enter description
    const textarea = screen.getByLabelText(/scene description/i);
    await user.type(textarea, "Test scene with square aspect ratio");

    // Select 1:1 aspect ratio
    const aspectRatioSelect = screen.getByTitle("Aspect ratio");
    await user.selectOptions(aspectRatioSelect, "1:1");

    // Submit
    const createButton = screen.getByRole("button", { name: /create scene/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(mockOnCreateManual).toHaveBeenCalledWith(
        "Test scene with square aspect ratio",
        "1:1"
      );
    });
  });

  it("should default to provided aspect ratio", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <GhostSceneCard
        onCreateManual={mockOnCreateManual}
        onCreateAI={mockOnCreateAI}
        defaultAspectRatio="1:1"
        projectId="test-project"
        onUpdateScene={mockOnUpdateScene}
      />
    );

    // Expand the card
    const addButton = screen.getByRole("button", { name: /add new scene/i });
    await user.click(addButton);

    // Check that 1:1 is selected by default
    const aspectRatioSelect = screen.getByTitle(
      "Aspect ratio"
    ) as HTMLSelectElement;
    expect(aspectRatioSelect.value).toBe("1:1");
  });

  it("should display all aspect ratio options", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <GhostSceneCard
        onCreateManual={mockOnCreateManual}
        onCreateAI={mockOnCreateAI}
        defaultAspectRatio="16:9"
        projectId="test-project"
        onUpdateScene={mockOnUpdateScene}
      />
    );

    // Expand the card
    const addButton = screen.getByRole("button", { name: /add new scene/i });
    await user.click(addButton);

    // Check all aspect ratio options are present
    await waitFor(() => {
      expect(screen.getByText("16:9 (Landscape)")).toBeInTheDocument();
      expect(screen.getByText("1:1 (Square)")).toBeInTheDocument();
      expect(screen.getByText("9:16 (Portrait)")).toBeInTheDocument();
    });
  });

  it("should create scene with selected aspect ratio", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <GhostSceneCard
        onCreateManual={mockOnCreateManual}
        onCreateAI={mockOnCreateAI}
        defaultAspectRatio="16:9"
        projectId="test-project"
        onUpdateScene={mockOnUpdateScene}
      />
    );

    // Expand the card
    const addButton = screen.getByRole("button", { name: /add new scene/i });
    await user.click(addButton);

    // Enter description
    const textarea = screen.getByLabelText(/scene description/i);
    await user.type(textarea, "Album cover concept");

    // Select 1:1 aspect ratio
    const aspectRatioSelect = screen.getByTitle("Aspect ratio");
    await user.selectOptions(aspectRatioSelect, "1:1");

    // Submit
    const createButton = screen.getByRole("button", { name: /create scene/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(mockOnCreateManual).toHaveBeenCalledWith(
        "Album cover concept",
        "1:1"
      );
    });
  });
});
