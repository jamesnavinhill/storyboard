import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FilePurposeSelector, type FilePurpose } from "../FilePurposeSelector";

describe("FilePurposeSelector", () => {
  const mockOnSelect = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultProps = {
    fileId: "test-file-id",
    fileName: "test-file.jpg",
    currentPurpose: "general-reference" as FilePurpose,
    onSelect: mockOnSelect,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("renders all file purpose types", () => {
    render(<FilePurposeSelector {...defaultProps} />);

    expect(screen.getByText("Style Reference")).toBeInTheDocument();
    expect(screen.getByText("Character Reference")).toBeInTheDocument();
    expect(screen.getByText("Audio Reference")).toBeInTheDocument();
    expect(screen.getByText("Text Document")).toBeInTheDocument();
    expect(screen.getByText("General Reference")).toBeInTheDocument();
  });

  it("allows selecting each purpose type without JSON errors", async () => {
    const purposes: FilePurpose[] = [
      "style-reference",
      "character-reference",
      "audio-reference",
      "text-document",
      "general-reference",
    ];

    for (const purpose of purposes) {
      const { unmount } = render(
        <FilePurposeSelector
          {...defaultProps}
          currentPurpose="general-reference"
        />
      );

      const purposeLabels: Record<FilePurpose, string> = {
        "style-reference": "Style Reference",
        "character-reference": "Character Reference",
        "audio-reference": "Audio Reference",
        "text-document": "Text Document",
        "general-reference": "General Reference",
      };

      const purposeButton = screen
        .getByText(purposeLabels[purpose])
        .closest("button");
      expect(purposeButton).toBeInTheDocument();

      if (purposeButton) {
        fireEvent.click(purposeButton);

        const saveButton = screen.getByRole("button", { name: /save/i });
        expect(saveButton).not.toBeDisabled();
      }

      unmount();
    }
  });

  it("successfully updates file purpose via API", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<FilePurposeSelector {...defaultProps} />);

    const styleRefButton = screen
      .getByText("Style Reference")
      .closest("button");
    if (styleRefButton) {
      fireEvent.click(styleRefButton);
    }

    const saveButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/files/test-file-id",
        expect.objectContaining({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ purpose: "style-reference" }),
        })
      );
    });

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith(
        "test-file-id",
        "style-reference"
      );
    });
  });

  it("handles API errors gracefully", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Failed to update" }),
    });

    render(<FilePurposeSelector {...defaultProps} />);

    const styleRefButton = screen
      .getByText("Style Reference")
      .closest("button");
    if (styleRefButton) {
      fireEvent.click(styleRefButton);
    }

    const saveButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to update/i)).toBeInTheDocument();
    });

    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  it("closes modal on cancel", () => {
    render(<FilePurposeSelector {...defaultProps} />);

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });
});
