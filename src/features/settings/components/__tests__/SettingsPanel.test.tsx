import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsPanel } from "../SettingsPanel";
import type { Settings } from "@/types";

describe("SettingsPanel - Aspect Ratio Selection", () => {
  const mockSettings: Settings = {
    sceneCount: 5,
    chatModel: "gemini-2.5-flash",
    imageModel: "imagen-4.0-generate-001",
    videoModel: "veo-3.1-generate-preview",
    workflow: "music-video",
    videoAutoplay: "on-generate",
    videoResolution: "1080p",
    videoDuration: 8,
  };

  const mockOnSettingsChange = vi.fn();
  const mockOnClose = vi.fn();
  const mockSetAspectRatio = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render 1:1 aspect ratio button", () => {
    render(
      <SettingsPanel
        settings={mockSettings}
        onSettingsChange={mockOnSettingsChange}
        onClose={mockOnClose}
        aspectRatio="16:9"
        setAspectRatio={mockSetAspectRatio}
      />
    );

    const button = screen.getByRole("button", {
      name: /set aspect ratio to 1:1/i,
    });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("1:1");
  });

  it("should handle 1:1 aspect ratio selection", async () => {
    const user = userEvent.setup();
    render(
      <SettingsPanel
        settings={mockSettings}
        onSettingsChange={mockOnSettingsChange}
        onClose={mockOnClose}
        aspectRatio="16:9"
        setAspectRatio={mockSetAspectRatio}
      />
    );

    const button = screen.getByRole("button", {
      name: /set aspect ratio to 1:1/i,
    });
    await user.click(button);

    expect(mockSetAspectRatio).toHaveBeenCalledWith("1:1");
  });

  it("should highlight selected aspect ratio", () => {
    render(
      <SettingsPanel
        settings={mockSettings}
        onSettingsChange={mockOnSettingsChange}
        onClose={mockOnClose}
        aspectRatio="1:1"
        setAspectRatio={mockSetAspectRatio}
      />
    );

    const button = screen.getByRole("button", {
      name: /set aspect ratio to 1:1/i,
    });
    expect(button).toHaveClass("btn-soft-primary");
  });

  it("should display all aspect ratio options", () => {
    render(
      <SettingsPanel
        settings={mockSettings}
        onSettingsChange={mockOnSettingsChange}
        onClose={mockOnClose}
        aspectRatio="16:9"
        setAspectRatio={mockSetAspectRatio}
      />
    );

    expect(
      screen.getByRole("button", { name: /set aspect ratio to 16:9/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /set aspect ratio to 1:1/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /set aspect ratio to 9:16/i })
    ).toBeInTheDocument();
  });

  it("should switch between aspect ratios", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <SettingsPanel
        settings={mockSettings}
        onSettingsChange={mockOnSettingsChange}
        onClose={mockOnClose}
        aspectRatio="16:9"
        setAspectRatio={mockSetAspectRatio}
      />
    );

    // Click 1:1
    const squareButton = screen.getByRole("button", {
      name: /set aspect ratio to 1:1/i,
    });
    await user.click(squareButton);
    expect(mockSetAspectRatio).toHaveBeenCalledWith("1:1");

    // Rerender with new aspect ratio
    rerender(
      <SettingsPanel
        settings={mockSettings}
        onSettingsChange={mockOnSettingsChange}
        onClose={mockOnClose}
        aspectRatio="1:1"
        setAspectRatio={mockSetAspectRatio}
      />
    );

    // Verify 1:1 is now highlighted
    expect(squareButton).toHaveClass("btn-soft-primary");

    // Click 9:16
    const portraitButton = screen.getByRole("button", {
      name: /set aspect ratio to 9:16/i,
    });
    await user.click(portraitButton);
    expect(mockSetAspectRatio).toHaveBeenCalledWith("9:16");
  });
});
