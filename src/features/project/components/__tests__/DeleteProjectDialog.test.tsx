import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteProjectDialog } from "../DeleteProjectDialog";

describe("DeleteProjectDialog - Deletion Confirmation", () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Dialog appearance", () => {
    it("should not render when isOpen is false", () => {
      const { container } = render(
        <DeleteProjectDialog
          isOpen={false}
          projectName="Test Project"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it("should render when isOpen is true", () => {
      render(
        <DeleteProjectDialog
          isOpen={true}
          projectName="Test Project"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText("Delete Project")).toBeInTheDocument();
    });

    it("should display project name in confirmation message", () => {
      render(
        <DeleteProjectDialog
          isOpen={true}
          projectName="My Important Project"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText("My Important Project")).toBeInTheDocument();
    });

    it("should show warning icon", () => {
      render(
        <DeleteProjectDialog
          isOpen={true}
          projectName="Test Project"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // AlertTriangle icon should be present
      const icon = screen.getByRole("dialog").querySelector(".text-danger");
      expect(icon).toBeInTheDocument();
    });
  });

  describe("Warning message", () => {
    it("should display warning about permanent deletion", () => {
      render(
        <DeleteProjectDialog
          isOpen={true}
          projectName="Test Project"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(
        screen.getByText(/this will permanently delete the project/i)
      ).toBeInTheDocument();
    });

    it("should mention that scenes will be deleted", () => {
      render(
        <DeleteProjectDialog
          isOpen={true}
          projectName="Test Project"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/scenes/i)).toBeInTheDocument();
    });

    it("should mention that images will be deleted", () => {
      render(
        <DeleteProjectDialog
          isOpen={true}
          projectName="Test Project"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/images/i)).toBeInTheDocument();
    });

    it("should mention that videos will be deleted", () => {
      render(
        <DeleteProjectDialog
          isOpen={true}
          projectName="Test Project"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/videos/i)).toBeInTheDocument();
    });

    it("should state that action cannot be undone", () => {
      render(
        <DeleteProjectDialog
          isOpen={true}
          projectName="Test Project"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
    });
  });

  describe("User interactions", () => {
    it("should call onConfirm when Delete button is clicked", async () => {
      const user = userEvent.setup();

      render(
        <DeleteProjectDialog
          isOpen={true}
          projectName="Test Project"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const deleteButton = screen.getByRole("button", { name: /^delete$/i });
      await user.click(deleteButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it("should call onCancel when Cancel button is clicked", async () => {
      const user = userEvent.setup();

      render(
        <DeleteProjectDialog
          isOpen={true}
          projectName="Test Project"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it("should call onCancel when X button is clicked", async () => {
      const user = userEvent.setup();

      render(
        <DeleteProjectDialog
          isOpen={true}
          projectName="Test Project"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const closeButton = screen.getByLabelText(/close dialog/i);
      await user.click(closeButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it("should not call onConfirm when Cancel is clicked", async () => {
      const user = userEvent.setup();

      render(
        <DeleteProjectDialog
          isOpen={true}
          projectName="Test Project"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it("should not call onCancel when Delete is clicked", async () => {
      const user = userEvent.setup();

      render(
        <DeleteProjectDialog
          isOpen={true}
          projectName="Test Project"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const deleteButton = screen.getByRole("button", { name: /^delete$/i });
      await user.click(deleteButton);

      expect(mockOnCancel).not.toHaveBeenCalled();
    });
  });

  describe("Modal behavior", () => {
    it("should have role dialog", () => {
      render(
        <DeleteProjectDialog
          isOpen={true}
          projectName="Test Project"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("should have aria-modal attribute", () => {
      render(
        <DeleteProjectDialog
          isOpen={true}
          projectName="Test Project"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
    });

    it("should have aria-labelledby pointing to title", () => {
      render(
        <DeleteProjectDialog
          isOpen={true}
          projectName="Test Project"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-labelledby", "delete-dialog-title");
    });
  });

  describe("Button states", () => {
    it("should have Delete button with danger styling", () => {
      render(
        <DeleteProjectDialog
          isOpen={true}
          projectName="Test Project"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const deleteButton = screen.getByRole("button", { name: /^delete$/i });
      expect(deleteButton).toHaveClass("btn-danger");
    });

    it("should have both Cancel and Delete buttons", () => {
      render(
        <DeleteProjectDialog
          isOpen={true}
          projectName="Test Project"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(
        screen.getByRole("button", { name: /cancel/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /^delete$/i })
      ).toBeInTheDocument();
    });
  });
});
