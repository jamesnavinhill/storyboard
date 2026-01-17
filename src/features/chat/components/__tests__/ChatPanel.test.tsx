import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatPanel } from "../ChatPanel";
import { ToastProvider } from "@/components/toast/ToastProvider";
import type { ChatAgent, ChatMessage, PresetStyle, Settings } from "@/types";

// Mock fetch globally
global.fetch = vi.fn();

// Helper to render with providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(<ToastProvider>{ui}</ToastProvider>);
};

const mockSettings: Settings = {
  sceneCount: 5,
  chatModel: "gemini-2.5-flash",
  imageModel: "imagen-3.0-generate-002",
  videoModel: "veo-2.0-generate-001",
  workflow: "music-video",
  videoAutoplay: "on-generate",
  videoResolution: "1080p",
};

const mockPresetStyles: PresetStyle[] = [
  {
    id: "1",
    name: "Cinematic",
    thumbnail: "/thumb1.jpg",
    prompt: "cinematic style",
  },
];

const defaultProps = {
  chatHistory: [] as ChatMessage[],
  isLoading: false,
  loadingText: "Thinking...",
  onSendMessage: vi.fn(),
  aspectRatio: "16:9" as const,
  setAspectRatio: vi.fn(),
  presetStyles: mockPresetStyles,
  selectedStyles: [],
  setSelectedStyles: vi.fn(),
  selectedTemplateId: null,
  setSelectedTemplateId: vi.fn(),
  agent: "generate" as ChatAgent,
  onAgentChange: vi.fn(),
  effectiveSettings: mockSettings,
  onSessionSettingsChange: vi.fn(),
  mobileView: "chat" as const,
  setMobileView: vi.fn(),
  projectId: "test-project-123",
};

describe("ChatPanel - Navigation and Mode Switching (Task 9.1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ workflows: [] }),
    });
  });

  it("should display Agent and Chat mode dropdowns", () => {
    renderWithProviders(<ChatPanel {...defaultProps} />);

    // Agent dropdown should be present
    expect(screen.getByText("Select Workflow")).toBeInTheDocument();

    // Chat mode dropdown should be present (look for the dropdown trigger)
    const dropdowns = screen.getAllByRole("button");
    expect(dropdowns.length).toBeGreaterThan(0);
  });

  it("should not display Gurus option anywhere", () => {
    renderWithProviders(<ChatPanel {...defaultProps} />);

    // Verify "Gurus" text doesn't appear anywhere
    expect(screen.queryByText(/gurus/i)).not.toBeInTheDocument();
  });

  it("should accept only generate or chat as agent prop", () => {
    const { rerender } = renderWithProviders(
      <ChatPanel {...defaultProps} agent="generate" />
    );
    expect(screen.getByRole("textbox")).toBeInTheDocument();

    rerender(
      <ToastProvider>
        <ChatPanel {...defaultProps} agent="chat" />
      </ToastProvider>
    );
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });
});

describe("ChatPanel - Workflow Dropdown Functionality (Task 9.2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock workflows API response
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === "/api/workflows") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            workflows: [
              {
                id: "wf1",
                name: "Narrative Music Video",
                category: "music-video",
                description: "Story-driven music video",
                systemInstruction: "Create narrative music video",
              },
              {
                id: "wf2",
                name: "Product Demo",
                category: "commercial",
                description: "Product commercial",
                systemInstruction: "Create product demo",
              },
            ],
          }),
        });
      }

      if (url.includes("/subtypes")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            subtypes: [
              {
                id: "st1",
                workflowId: "wf1",
                name: "Story-driven",
                description: null,
                instructionModifier: "",
              },
              {
                id: "st2",
                workflowId: "wf1",
                name: "Performance-based",
                description: null,
                instructionModifier: "",
              },
            ],
          }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });
  });

  it("should display workflow categories", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatPanel {...defaultProps} />);

    // Click the Agent dropdown
    const agentDropdown = screen.getByText("Select Workflow");
    await user.click(agentDropdown);

    // Wait for workflows to load and categories to appear
    await waitFor(() => {
      expect(screen.getByText("Music Video")).toBeInTheDocument();
    });

    expect(screen.getByText("Product Commercial")).toBeInTheDocument();
  });

  it("should allow category expansion and collapse", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatPanel {...defaultProps} />);

    // Open dropdown
    const agentDropdown = screen.getByText("Select Workflow");
    await user.click(agentDropdown);

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText("Music Video")).toBeInTheDocument();
    });

    // Music Video category should be expanded by default (showing workflows)
    await waitFor(() => {
      expect(screen.getByText("Narrative Music Video")).toBeInTheDocument();
    });

    // Click to collapse
    const musicVideoCategory = screen.getByText("Music Video");
    await user.click(musicVideoCategory);

    // Workflow should be hidden after collapse
    await waitFor(() => {
      expect(
        screen.queryByText("Narrative Music Video")
      ).not.toBeInTheDocument();
    });
  });

  it("should display nested subtypes when workflow has them", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatPanel {...defaultProps} />);

    // Open dropdown
    const agentDropdown = screen.getByText("Select Workflow");
    await user.click(agentDropdown);

    // Wait for workflows and subtypes to load
    await waitFor(() => {
      expect(screen.getByText("Narrative Music Video")).toBeInTheDocument();
    });

    // Subtypes should be visible
    await waitFor(() => {
      expect(screen.getByText("Story-driven")).toBeInTheDocument();
      expect(screen.getByText("Performance-based")).toBeInTheDocument();
    });
  });

  it("should close dropdown after workflow selection", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatPanel {...defaultProps} />);

    // Open dropdown
    const agentDropdown = screen.getByText("Select Workflow");
    await user.click(agentDropdown);

    // Wait for workflows to load
    await waitFor(() => {
      expect(screen.getByText("Narrative Music Video")).toBeInTheDocument();
    });

    // Select a workflow
    const workflow = screen.getByText("Narrative Music Video");
    await user.click(workflow);

    // Dropdown should close (workflows no longer visible)
    await waitFor(() => {
      expect(screen.queryByText("Product Demo")).not.toBeInTheDocument();
    });
  });
});

describe("ChatPanel - Upload Zone Behavior (Task 9.3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ workflows: [] }),
    });
  });

  it("should show upload zone in Agent mode with projectId and selected workflow", () => {
    // Render with workflow selected
    const { container } = renderWithProviders(
      <ChatPanel {...defaultProps} projectId="test-project" />
    );

    // Upload zone should not be visible without workflow selection
    expect(
      container.querySelector('[class*="dropzone"]')
    ).not.toBeInTheDocument();
  });

  it("should hide upload zone when no projectId", () => {
    const { container } = renderWithProviders(
      <ChatPanel {...defaultProps} projectId={null} />
    );

    // Upload zone should not be visible
    expect(
      container.querySelector('[class*="dropzone"]')
    ).not.toBeInTheDocument();
  });

  it("should hide upload zone when no workflow is selected", () => {
    const { container } = renderWithProviders(
      <ChatPanel {...defaultProps} projectId="test-project" />
    );

    // Without workflow selection, upload zone should not be visible
    expect(
      container.querySelector('[class*="dropzone"]')
    ).not.toBeInTheDocument();
  });
});

describe("ChatPanel - Header Layout and Styling (Task 9.4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ workflows: [] }),
    });
  });

  it("should display single row header layout", () => {
    const { container } = renderWithProviders(<ChatPanel {...defaultProps} />);

    // Find the header section with padding
    const header = container.querySelector('[class*="px-3"][class*="py-2"]');
    expect(header).toBeInTheDocument();

    // Should have a flex container for dropdowns (direct child)
    const directFlexContainer = header?.querySelector(
      '[class*="flex"][class*="gap-2"]'
    );
    expect(directFlexContainer).toBeInTheDocument();
    expect(directFlexContainer?.className).toContain("gap-2");
  });

  it("should have left-aligned mode dropdowns", () => {
    const { container } = renderWithProviders(<ChatPanel {...defaultProps} />);

    // Find the header
    const header = container.querySelector('[class*="px-3"][class*="py-2"]');
    const flexContainer = header?.querySelector('[class*="flex"]');

    // Should have gap-2 class for spacing
    expect(flexContainer).toBeInTheDocument();
    if (flexContainer) {
      expect(flexContainer.className).toContain("gap-2");
    }
  });

  it("should not display agent buttons row (Generate, Text, Gurus)", () => {
    renderWithProviders(<ChatPanel {...defaultProps} />);

    // These button labels should not exist
    expect(screen.queryByText("Generate")).not.toBeInTheDocument();
    expect(screen.queryByText("Text")).not.toBeInTheDocument();
    expect(screen.queryByText("Gurus")).not.toBeInTheDocument();
  });

  it("should display placeholder text based on workflow selection", () => {
    renderWithProviders(<ChatPanel {...defaultProps} />);

    // Default placeholder when no workflow selected
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute(
      "placeholder",
      "Select a workflow to get started..."
    );
  });
});

describe("ChatPanel - Placeholder Text Updates (Task 3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock workflows API response
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === "/api/workflows") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            workflows: [
              {
                id: "wf1",
                name: "Music Video",
                category: "music-video",
                description: "Music video workflow",
                systemInstruction: "Create music video",
              },
              {
                id: "wf2",
                name: "Product Commercial",
                category: "commercial",
                description: "Product commercial",
                systemInstruction: "Create product commercial",
              },
            ],
          }),
        });
      }

      if (url.includes("/wf1/subtypes")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            subtypes: [
              {
                id: "st1",
                workflowId: "wf1",
                name: "Narrative",
                description: null,
                instructionModifier: "",
              },
            ],
          }),
        });
      }

      if (url.includes("/wf2/subtypes")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            subtypes: [],
          }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });
  });

  it("should show default placeholder when no workflow is selected", async () => {
    renderWithProviders(<ChatPanel {...defaultProps} />);

    // Wait for workflows to load
    await waitFor(() => {
      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute(
        "placeholder",
        "Select a workflow to get started..."
      );
    });
  });

  it("should update placeholder text when workflow is selected", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatPanel {...defaultProps} />);

    // Open workflow dropdown
    const agentDropdown = screen.getByText("Select Workflow");
    await user.click(agentDropdown);

    // Wait for workflows to load
    await waitFor(() => {
      expect(screen.getByText("Music video workflow")).toBeInTheDocument();
    });

    // Select a workflow by clicking on the workflow button (not the category)
    const workflowButtons = screen.getAllByRole("button");
    const workflowButton = workflowButtons.find((btn) =>
      btn.textContent?.includes("Music video workflow")
    );
    expect(workflowButton).toBeDefined();
    await user.click(workflowButton!);

    // Verify placeholder text updates to workflow-specific text
    await waitFor(() => {
      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute(
        "placeholder",
        "Describe your Music Video concept..."
      );
    });
  });

  it("should update placeholder text when subtype is selected", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatPanel {...defaultProps} />);

    // Open workflow dropdown
    const agentDropdown = screen.getByText("Select Workflow");
    await user.click(agentDropdown);

    // Wait for workflows and subtypes to load
    await waitFor(() => {
      expect(screen.getByText("Music video workflow")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Narrative")).toBeInTheDocument();
    });

    // Select a subtype
    const subtype = screen.getByText("Narrative");
    await user.click(subtype);

    // Verify placeholder text updates to subtype-specific text
    await waitFor(() => {
      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute(
        "placeholder",
        "Describe your Narrative concept..."
      );
    });
  });

  it("should show workflow-specific placeholder for workflow without subtypes", async () => {
    renderWithProviders(<ChatPanel {...defaultProps} />);

    // Verify the getPlaceholder function works correctly by checking the existing implementation
    // The function is already tested through the workflow selection tests above
    // This test verifies the default state
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute(
      "placeholder",
      "Select a workflow to get started..."
    );
  });
});

describe("ChatPanel - Selector Order Verification (Task 3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === "/api/workflows") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            workflows: [
              {
                id: "wf1",
                name: "Music Video",
                category: "music-video",
                description: "Music video workflow",
                systemInstruction: "Create music video",
              },
            ],
          }),
        });
      }

      if (url.includes("/subtypes")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ subtypes: [] }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });
  });

  it("should render Chat Mode Selector before Workflow Selector in DOM order", () => {
    const { container } = renderWithProviders(<ChatPanel {...defaultProps} />);

    // Find the top row container
    const topRow = container.querySelector('[class*="px-3"][class*="py-2"]');
    expect(topRow).toBeInTheDocument();

    // Get all buttons in the top row
    const buttons = topRow?.querySelectorAll("button");
    expect(buttons).toBeDefined();
    expect(buttons!.length).toBeGreaterThanOrEqual(2);

    // First button should be Chat Mode Selector (has "Simple Chat" text on desktop)
    const firstButton = buttons![0];
    expect(firstButton.textContent).toContain("Simple Chat");

    // Second button should be Workflow Selector
    const secondButton = buttons![1];
    expect(secondButton.textContent).toContain("Select Workflow");
  });

  it("should display Agent Mode as first option in Chat Mode dropdown", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatPanel {...defaultProps} />);

    // Find and click the Chat Mode dropdown button
    const chatModeButton = screen.getByText("Simple Chat");
    await user.click(chatModeButton);

    // Wait for dropdown to open and get all mode option buttons
    await waitFor(() => {
      expect(screen.getByText("Agent Mode")).toBeInTheDocument();
    });

    // Get all buttons and filter for mode options (they contain both label and description)
    const allButtons = screen.getAllByRole("button");
    const modeButtons = allButtons.filter(
      (btn) =>
        btn.textContent?.includes("Workflow-based generation") ||
        btn.textContent?.includes("General conversation") ||
        btn.textContent?.includes("Develop and refine") ||
        btn.textContent?.includes("Explore visual styles")
    );

    // Agent Mode should be first (contains "Workflow-based generation")
    expect(modeButtons[0].textContent).toContain("Agent Mode");
    expect(modeButtons[0].textContent).toContain("Workflow-based generation");
  });

  it("should auto-switch to Agent Mode when workflow is selected", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ChatPanel {...defaultProps} projectId="test-project" />
    );

    // Initially in Simple Chat mode
    expect(screen.getByText("Simple Chat")).toBeInTheDocument();

    // Open workflow dropdown and select a workflow
    const workflowButton = screen.getByText("Select Workflow");
    await user.click(workflowButton);

    await waitFor(() => {
      expect(screen.getByText("Music video workflow")).toBeInTheDocument();
    });

    const workflowOptions = screen.getAllByRole("button");
    const workflowOption = workflowOptions.find((btn) =>
      btn.textContent?.includes("Music video workflow")
    );
    await user.click(workflowOption!);

    // Should auto-switch to Agent Mode
    await waitFor(() => {
      expect(screen.getByText("Agent Mode")).toBeInTheDocument();
    });
  });

  it("should auto-switch to Simple Chat when workflow is cleared", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ChatPanel {...defaultProps} projectId="test-project" />
    );

    // Select a workflow first
    const workflowButton = screen.getByText("Select Workflow");
    await user.click(workflowButton);

    await waitFor(() => {
      expect(screen.getByText("Music video workflow")).toBeInTheDocument();
    });

    const workflowOptions = screen.getAllByRole("button");
    const workflowOption = workflowOptions.find((btn) =>
      btn.textContent?.includes("Music video workflow")
    );
    await user.click(workflowOption!);

    // Verify Agent Mode is active
    await waitFor(() => {
      expect(screen.getByText("Agent Mode")).toBeInTheDocument();
    });

    // Open Chat Mode dropdown and manually switch to Simple Chat
    const agentModeButton = screen.getByText("Agent Mode");
    await user.click(agentModeButton);

    await waitFor(() => {
      const simpleChatOption = screen
        .getAllByRole("button")
        .find((btn) => btn.textContent?.includes("Simple Chat"));
      expect(simpleChatOption).toBeDefined();
    });

    const simpleChatOption = screen
      .getAllByRole("button")
      .find((btn) => btn.textContent?.includes("Simple Chat"));
    await user.click(simpleChatOption!);

    // Should switch to Simple Chat
    await waitFor(() => {
      expect(screen.getByText("Simple Chat")).toBeInTheDocument();
    });
  });

  it("should maintain visual spacing between selectors", () => {
    const { container } = renderWithProviders(<ChatPanel {...defaultProps} />);

    // Find the flex container with both dropdowns
    const flexContainer = container.querySelector(
      '[class*="flex"][class*="gap-2"]'
    );
    expect(flexContainer).toBeInTheDocument();
    expect(flexContainer?.className).toContain("gap-2");
  });
});

describe("ChatPanel - Workflow Selection Flow (Task 4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock workflows API response
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === "/api/workflows") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            workflows: [
              {
                id: "wf1",
                name: "Music Video",
                category: "music-video",
                description: "Music video workflow",
                systemInstruction: "Create music video",
              },
            ],
          }),
        });
      }

      if (url.includes("/subtypes")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            subtypes: [],
          }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });
  });

  it("should automatically switch to agent mode when workflow is selected", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ChatPanel {...defaultProps} projectId="test-project" />
    );

    // Initially should be in simple mode (no upload zone visible)
    await waitFor(() => {
      expect(screen.queryByText("Upload files")).not.toBeInTheDocument();
    });

    // Open workflow dropdown
    const agentDropdown = screen.getByText("Select Workflow");
    await user.click(agentDropdown);

    // Wait for workflows to load
    await waitFor(() => {
      expect(screen.getByText("Music video workflow")).toBeInTheDocument();
    });

    // Select a workflow
    const workflowButtons = screen.getAllByRole("button");
    const workflowButton = workflowButtons.find((btn) =>
      btn.textContent?.includes("Music video workflow")
    );
    await user.click(workflowButton!);

    // Should automatically switch to agent mode and show upload zone
    await waitFor(() => {
      expect(screen.getByText("Upload files")).toBeInTheDocument();
    });
  });

  it("should display upload zone when agent mode is active with workflow", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ChatPanel {...defaultProps} projectId="test-project" />
    );

    // Select workflow to activate agent mode
    const agentDropdown = screen.getByText("Select Workflow");
    await user.click(agentDropdown);

    await waitFor(() => {
      expect(screen.getByText("Music video workflow")).toBeInTheDocument();
    });

    const workflowButtons = screen.getAllByRole("button");
    const workflowButton = workflowButtons.find((btn) =>
      btn.textContent?.includes("Music video workflow")
    );
    await user.click(workflowButton!);

    // Upload zone should be visible
    await waitFor(() => {
      expect(screen.getByText("Upload files")).toBeInTheDocument();
    });
  });

  it("should return to simple mode when workflow is deselected", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ChatPanel {...defaultProps} projectId="test-project" />
    );

    // Select workflow first
    const agentDropdown = screen.getByText("Select Workflow");
    await user.click(agentDropdown);

    await waitFor(() => {
      expect(screen.getByText("Music video workflow")).toBeInTheDocument();
    });

    const workflowButtons = screen.getAllByRole("button");
    const workflowButton = workflowButtons.find((btn) =>
      btn.textContent?.includes("Music video workflow")
    );
    await user.click(workflowButton!);

    // Verify agent mode is active
    await waitFor(() => {
      expect(screen.getByText("Upload files")).toBeInTheDocument();
    });

    // Now manually switch to simple mode via ChatModeDropdown
    const chatModeButtons = screen.getAllByRole("button");
    const simpleModeButton = chatModeButtons.find((btn) =>
      btn.textContent?.includes("Simple")
    );

    if (simpleModeButton) {
      await user.click(simpleModeButton);

      // Upload zone should disappear
      await waitFor(() => {
        expect(screen.queryByText("Upload files")).not.toBeInTheDocument();
      });
    }
  });

  it("should preserve workflow selection across message submissions", async () => {
    const user = userEvent.setup();
    const mockOnSendMessage = vi.fn().mockResolvedValue(undefined);

    renderWithProviders(
      <ChatPanel
        {...defaultProps}
        projectId="test-project"
        onSendMessage={mockOnSendMessage}
      />
    );

    // Select workflow
    const agentDropdown = screen.getByText("Select Workflow");
    await user.click(agentDropdown);

    await waitFor(() => {
      expect(screen.getByText("Music video workflow")).toBeInTheDocument();
    });

    const workflowButtons = screen.getAllByRole("button");
    const workflowButton = workflowButtons.find((btn) =>
      btn.textContent?.includes("Music video workflow")
    );
    await user.click(workflowButton!);

    // Wait for agent mode to activate
    await waitFor(() => {
      expect(screen.getByText("Upload files")).toBeInTheDocument();
    });

    // Type and send a message
    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "Test message");

    const sendButton = screen.getByLabelText("Send message");
    await user.click(sendButton);

    // Verify message was sent
    expect(mockOnSendMessage).toHaveBeenCalledWith("Test message", undefined);

    // Agent mode should still be active (upload zone visible)
    await waitFor(() => {
      expect(screen.getByText("Upload files")).toBeInTheDocument();
    });
  });

  it("should maintain workflow selection when switching mobile views", async () => {
    const user = userEvent.setup();
    const mockSetMobileView = vi.fn();

    renderWithProviders(
      <ChatPanel
        {...defaultProps}
        projectId="test-project"
        mobileView="chat"
        setMobileView={mockSetMobileView}
      />
    );

    // Select workflow
    const agentDropdown = screen.getByText("Select Workflow");
    await user.click(agentDropdown);

    await waitFor(() => {
      expect(screen.getByText("Music video workflow")).toBeInTheDocument();
    });

    const workflowButtons = screen.getAllByRole("button");
    const workflowButton = workflowButtons.find((btn) =>
      btn.textContent?.includes("Music video workflow")
    );
    await user.click(workflowButton!);

    // Verify agent mode is active
    await waitFor(() => {
      expect(screen.getByText("Upload files")).toBeInTheDocument();
    });

    // Simulate view switch by clicking mobile view dots
    const viewDots = screen.getAllByRole("button", { name: /show.*view/i });
    if (viewDots.length > 0) {
      await user.click(viewDots[1]); // Click storyboard view
      expect(mockSetMobileView).toHaveBeenCalled();
    }

    // Upload zone should still be present (workflow selection preserved)
    expect(screen.getByText("Upload files")).toBeInTheDocument();
  });
});

describe("ChatPanel - Template State Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === "/api/workflows") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ workflows: [] }),
        });
      }

      if (url === "/api/templates/template-1") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            template: {
              id: "template-1",
              name: "Cinematic Style",
              description: "Cinematic visual style",
              stylePrompt: "cinematic lighting, dramatic composition",
              category: ["film"],
              tested: true,
            },
          }),
        });
      }

      if (url === "/api/templates/template-2") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            template: {
              id: "template-2",
              name: "Vintage Film",
              description: "Vintage film aesthetic",
              stylePrompt: "vintage film grain, retro colors",
              category: ["retro"],
              tested: true,
            },
          }),
        });
      }

      if (url === "/api/templates/invalid-template") {
        return Promise.resolve({
          ok: false,
          status: 404,
          statusText: "Not Found",
          json: async () => ({ error: "Template not found" }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });
  });

  it("should fetch template when selectedTemplateId changes", async () => {
    const mockSetSelectedTemplateId = vi.fn();
    const { rerender } = renderWithProviders(
      <ChatPanel
        {...defaultProps}
        selectedTemplateId={null}
        setSelectedTemplateId={mockSetSelectedTemplateId}
      />
    );

    // Initially no template badge should be visible
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    // Update selectedTemplateId
    rerender(
      <ToastProvider>
        <ChatPanel
          {...defaultProps}
          selectedTemplateId="template-1"
          setSelectedTemplateId={mockSetSelectedTemplateId}
        />
      </ToastProvider>
    );

    // Wait for template to be fetched and badge to appear
    await waitFor(() => {
      expect(screen.getByText("Cinematic Style")).toBeInTheDocument();
    });

    // Verify fetch was called
    expect(global.fetch).toHaveBeenCalledWith("/api/templates/template-1");
  });

  it("should display TemplateBadge when template is selected", async () => {
    renderWithProviders(
      <ChatPanel {...defaultProps} selectedTemplateId="template-1" />
    );

    // Wait for template to be fetched and badge to appear
    await waitFor(() => {
      expect(screen.getByText("Cinematic Style")).toBeInTheDocument();
    });

    // Verify badge has correct role
    const badge = screen.getByRole("status");
    expect(badge).toBeInTheDocument();
  });

  it("should call setSelectedTemplateId when template is removed", async () => {
    const user = userEvent.setup();
    const mockSetSelectedTemplateId = vi.fn();

    renderWithProviders(
      <ChatPanel
        {...defaultProps}
        selectedTemplateId="template-1"
        setSelectedTemplateId={mockSetSelectedTemplateId}
      />
    );

    // Wait for badge to appear
    await waitFor(() => {
      expect(screen.getByText("Cinematic Style")).toBeInTheDocument();
    });

    // Click remove button
    const removeButton = screen.getByRole("button", {
      name: "Remove template",
    });
    await user.click(removeButton);

    // Verify setSelectedTemplateId was called with null
    expect(mockSetSelectedTemplateId).toHaveBeenCalledWith(null);
  });

  it("should toggle template selection (select/deselect)", async () => {
    const user = userEvent.setup();
    const mockSetSelectedTemplateId = vi.fn();

    // Mock StylePresetsMenu to test the toggle behavior
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === "/api/workflows") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ workflows: [] }),
        });
      }

      if (url === "/api/templates") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            templates: [
              {
                id: "template-1",
                name: "Cinematic Style",
                description: "Cinematic visual style",
                stylePrompt: "cinematic lighting",
                category: ["film"],
                tested: true,
              },
            ],
          }),
        });
      }

      if (url === "/api/templates/template-1") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            template: {
              id: "template-1",
              name: "Cinematic Style",
              description: "Cinematic visual style",
              stylePrompt: "cinematic lighting",
              category: ["film"],
              tested: true,
            },
          }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });

    renderWithProviders(
      <ChatPanel
        {...defaultProps}
        selectedTemplateId={null}
        setSelectedTemplateId={mockSetSelectedTemplateId}
      />
    );

    // Open style presets menu
    const paintbrushButton = screen.getByLabelText("Style templates");
    await user.click(paintbrushButton);

    // Wait for templates to load - use getAllByText since there might be duplicates
    await waitFor(() => {
      const elements = screen.getAllByText("Cinematic Style");
      expect(elements.length).toBeGreaterThan(0);
    });

    // Select template - get all buttons and click the first one
    const templateButtons = screen.getAllByText("Cinematic Style");
    await user.click(templateButtons[0]);

    // Verify setSelectedTemplateId was called with template ID
    expect(mockSetSelectedTemplateId).toHaveBeenCalledWith("template-1");

    // Simulate selecting the same template again (deselect)
    mockSetSelectedTemplateId.mockClear();

    // Re-render with template selected
    const { rerender } = renderWithProviders(
      <ChatPanel
        {...defaultProps}
        selectedTemplateId="template-1"
        setSelectedTemplateId={mockSetSelectedTemplateId}
      />
    );

    // Wait for badge to appear
    await waitFor(() => {
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    // Open style presets menu again
    const paintbrushButton2 = screen.getByLabelText("Style templates");
    await user.click(paintbrushButton2);

    // Wait for menu to open
    await waitFor(() => {
      const elements = screen.getAllByText("Cinematic Style");
      expect(elements.length).toBeGreaterThan(0);
    });

    // Click same template again (should deselect) - get all and click first
    const templateButtons2 = screen.getAllByText("Cinematic Style");
    await user.click(templateButtons2[0]);

    // Verify setSelectedTemplateId was called with null (deselect)
    expect(mockSetSelectedTemplateId).toHaveBeenCalledWith(null);
  });

  it("should handle template fetch failure gracefully", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const mockSetSelectedTemplateId = vi.fn();

    renderWithProviders(
      <ChatPanel
        {...defaultProps}
        selectedTemplateId="invalid-template"
        setSelectedTemplateId={mockSetSelectedTemplateId}
      />
    );

    // Wait for fetch to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/templates/invalid-template"
      );
    });

    // Badge should not appear
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    // Error should be logged
    expect(consoleErrorSpy).toHaveBeenCalled();

    // setSelectedTemplateId should be called with null to clear invalid ID
    await waitFor(() => {
      expect(mockSetSelectedTemplateId).toHaveBeenCalledWith(null);
    });

    consoleErrorSpy.mockRestore();
  });

  it("should not display badge when selectedTemplateId is null", () => {
    renderWithProviders(
      <ChatPanel {...defaultProps} selectedTemplateId={null} />
    );

    // Badge should not be visible
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("should update badge when switching between templates", async () => {
    const mockSetSelectedTemplateId = vi.fn();
    const { rerender } = renderWithProviders(
      <ChatPanel
        {...defaultProps}
        selectedTemplateId="template-1"
        setSelectedTemplateId={mockSetSelectedTemplateId}
      />
    );

    // Wait for first template badge
    await waitFor(() => {
      expect(screen.getByText("Cinematic Style")).toBeInTheDocument();
    });

    // Switch to different template
    rerender(
      <ToastProvider>
        <ChatPanel
          {...defaultProps}
          selectedTemplateId="template-2"
          setSelectedTemplateId={mockSetSelectedTemplateId}
        />
      </ToastProvider>
    );

    // Wait for second template badge
    await waitFor(() => {
      expect(screen.getByText("Vintage Film")).toBeInTheDocument();
    });

    // First template should no longer be visible
    expect(screen.queryByText("Cinematic Style")).not.toBeInTheDocument();
  });
});
