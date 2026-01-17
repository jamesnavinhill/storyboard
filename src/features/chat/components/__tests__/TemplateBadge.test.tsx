import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TemplateBadge } from "../TemplateBadge";

describe("TemplateBadge Component", () => {
  it("should render with template name", () => {
    const mockOnRemove = vi.fn();
    render(
      <TemplateBadge templateName="Cinematic Style" onRemove={mockOnRemove} />
    );

    expect(screen.getByText("Cinematic Style")).toBeInTheDocument();
  });

  it("should call onRemove when X button is clicked", async () => {
    const user = userEvent.setup();
    const mockOnRemove = vi.fn();

    render(
      <TemplateBadge templateName="Vintage Film" onRemove={mockOnRemove} />
    );

    const removeButton = screen.getByRole("button", {
      name: "Remove template",
    });
    await user.click(removeButton);

    expect(mockOnRemove).toHaveBeenCalledTimes(1);
  });

  it("should apply correct styling classes", () => {
    const mockOnRemove = vi.fn();
    const { container } = render(
      <TemplateBadge templateName="Test Template" onRemove={mockOnRemove} />
    );

    const badge = container.querySelector('[role="status"]');
    expect(badge).toBeInTheDocument();
    expect(badge?.className).toContain("bg-pink-500/20");
    expect(badge?.className).toContain("border-pink-500/40");
    expect(badge?.className).toContain("text-pink-300");
    expect(badge?.className).toContain("rounded-full");
  });

  it("should have proper accessibility attributes", () => {
    const mockOnRemove = vi.fn();
    render(
      <TemplateBadge
        templateName="Accessible Template"
        onRemove={mockOnRemove}
      />
    );

    const badge = screen.getByRole("status");
    expect(badge).toHaveAttribute(
      "aria-label",
      "Selected template: Accessible Template"
    );

    const removeButton = screen.getByRole("button", {
      name: "Remove template",
    });
    expect(removeButton).toHaveAttribute("title", "Remove template");
  });

  it("should truncate long template names", () => {
    const mockOnRemove = vi.fn();
    const longName = "Very Long Template Name That Should Be Truncated";
    const { container } = render(
      <TemplateBadge templateName={longName} onRemove={mockOnRemove} />
    );

    const textSpan = container.querySelector("span.truncate");
    expect(textSpan).toBeInTheDocument();
    expect(textSpan?.className).toContain("max-w-[120px]");
    expect(textSpan?.textContent).toBe(longName);
  });

  it("should render X icon in remove button", () => {
    const mockOnRemove = vi.fn();
    render(
      <TemplateBadge templateName="Test Template" onRemove={mockOnRemove} />
    );

    const removeButton = screen.getByRole("button", {
      name: "Remove template",
    });
    const icon = removeButton.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });
});
