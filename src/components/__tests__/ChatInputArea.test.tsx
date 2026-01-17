import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChatInputArea } from "../ChatInputArea";
import { Sparkles } from "lucide-react";

describe("ChatInputArea", () => {
  it("renders with placeholder text", () => {
    const mockOnChange = vi.fn();
    const mockOnSubmit = vi.fn();

    render(
      <ChatInputArea
        value=""
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        placeholder="Test placeholder"
      />
    );

    const textarea = screen.getByPlaceholderText("Test placeholder");
    expect(textarea).toBeDefined();
  });

  it("calls onChange when text is entered", () => {
    const mockOnChange = vi.fn();
    const mockOnSubmit = vi.fn();

    render(
      <ChatInputArea value="" onChange={mockOnChange} onSubmit={mockOnSubmit} />
    );

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Hello" } });

    expect(mockOnChange).toHaveBeenCalledWith("Hello");
  });

  it("calls onSubmit when Enter is pressed", () => {
    const mockOnChange = vi.fn();
    const mockOnSubmit = vi.fn();

    render(
      <ChatInputArea
        value="Test message"
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
      />
    );

    const textarea = screen.getByRole("textbox");
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it("does not call onSubmit when Shift+Enter is pressed", () => {
    const mockOnChange = vi.fn();
    const mockOnSubmit = vi.fn();

    render(
      <ChatInputArea
        value="Test message"
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
      />
    );

    const textarea = screen.getByRole("textbox");
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("renders action buttons", () => {
    const mockOnChange = vi.fn();
    const mockOnSubmit = vi.fn();
    const mockAction = vi.fn();

    render(
      <ChatInputArea
        value=""
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        actions={[
          {
            icon: Sparkles,
            label: "AI Suggest",
            onClick: mockAction,
          },
        ]}
      />
    );

    const button = screen.getByLabelText("AI Suggest");
    expect(button).toBeDefined();

    fireEvent.click(button);
    expect(mockAction).toHaveBeenCalled();
  });

  it("renders file upload button when showFileUpload is true", () => {
    const mockOnChange = vi.fn();
    const mockOnSubmit = vi.fn();

    render(
      <ChatInputArea
        value=""
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        showFileUpload={true}
      />
    );

    const uploadButton = screen.getByLabelText("Attach file");
    expect(uploadButton).toBeDefined();
  });

  it("displays attached files with remove buttons", () => {
    const mockOnChange = vi.fn();
    const mockOnSubmit = vi.fn();
    const mockOnFileRemove = vi.fn();

    render(
      <ChatInputArea
        value=""
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        attachedFiles={[
          { id: "1", name: "test.jpg", preview: "data:image/jpeg;base64,..." },
        ]}
        onFileRemove={mockOnFileRemove}
      />
    );

    const removeButton = screen.getByLabelText("Remove test.jpg");
    expect(removeButton).toBeDefined();

    fireEvent.click(removeButton);
    expect(mockOnFileRemove).toHaveBeenCalledWith("1");
  });

  it("disables input when disabled prop is true", () => {
    const mockOnChange = vi.fn();
    const mockOnSubmit = vi.fn();

    render(
      <ChatInputArea
        value=""
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        disabled={true}
      />
    );

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveProperty("disabled", true);
  });
});
