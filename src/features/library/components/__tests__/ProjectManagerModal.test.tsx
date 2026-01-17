import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectManagerModal } from "../ProjectManagerModal";

describe("ProjectManagerModal - Project Management Flows", () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSave.mockResolvedValue(undefined);
  });

  describe("Modal appearance and basic functionality", () => {
    it("should not render when isOpen is false", () => {
      const { container } = render(
        <ProjectManagerModal
          mode="create"
          isOpen={false}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it("should render when isOpen is true", () => {
      render(
        <ProjectManagerModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText("New Project")).toBeInTheDocument();
    });

    it("should show 'New Project' title in create mode", () => {
      render(
        <ProjectManagerModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText("New Project")).toBeInTheDocument();
    });

    it("should show 'Manage Project' title in edit mode", () => {
      render(
        <ProjectManagerModal
          mode="edit"
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText("Manage Project")).toBeInTheDocument();
    });
  });

  describe("Create mode functionality", () => {
    it("should render empty form fields in create mode", () => {
      render(
        <ProjectManagerModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = screen.getByLabelText(/project name/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      expect(nameInput).toHaveValue("");
      expect(descriptionInput).toHaveValue("");
    });

    it("should allow entering project name", async () => {
      const user = userEvent.setup();

      render(
        <ProjectManagerModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = screen.getByLabelText(/project name/i);
      await user.type(nameInput, "My New Project");

      expect(nameInput).toHaveValue("My New Project");
    });

    it("should allow entering project description", async () => {
      const user = userEvent.setup();

      render(
        <ProjectManagerModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const descriptionInput = screen.getByLabelText(/description/i);
      await user.type(descriptionInput, "This is a test project");

      expect(descriptionInput).toHaveValue("This is a test project");
    });

    it("should call onSave with form data when Create button is clicked", async () => {
      const user = userEvent.setup();

      render(
        <ProjectManagerModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = screen.getByLabelText(/project name/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const createButton = screen.getByRole("button", { name: /create/i });

      await user.type(nameInput, "Test Project");
      await user.type(descriptionInput, "Test Description");
      await user.click(createButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          name: "Test Project",
          description: "Test Description",
          image: undefined,
        });
      });
    });

    it("should call onClose when Cancel button is clicked", async () => {
      const user = userEvent.setup();

      render(
        <ProjectManagerModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should call onClose when X button is clicked", async () => {
      const user = userEvent.setup();

      render(
        <ProjectManagerModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const closeButton = screen.getByLabelText(/close/i);
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("Edit mode functionality", () => {
    it("should populate form with initial data in edit mode", () => {
      render(
        <ProjectManagerModal
          mode="edit"
          isOpen={true}
          initialData={{
            name: "Existing Project",
            description: "Existing Description",
          }}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = screen.getByLabelText(/project name/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      expect(nameInput).toHaveValue("Existing Project");
      expect(descriptionInput).toHaveValue("Existing Description");
    });

    it("should show Save button in edit mode", () => {
      render(
        <ProjectManagerModal
          mode="edit"
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(
        screen.getByRole("button", { name: /^save$/i })
      ).toBeInTheDocument();
    });

    it("should allow editing existing project data", async () => {
      const user = userEvent.setup();

      render(
        <ProjectManagerModal
          mode="edit"
          isOpen={true}
          initialData={{
            name: "Old Name",
            description: "Old Description",
          }}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = screen.getByLabelText(/project name/i);
      await user.clear(nameInput);
      await user.type(nameInput, "New Name");

      expect(nameInput).toHaveValue("New Name");
    });

    it("should call onSave with updated data when Save button is clicked", async () => {
      const user = userEvent.setup();

      render(
        <ProjectManagerModal
          mode="edit"
          isOpen={true}
          initialData={{
            name: "Old Name",
            description: "Old Description",
          }}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = screen.getByLabelText(/project name/i);
      const saveButton = screen.getByRole("button", { name: /^save$/i });

      await user.clear(nameInput);
      await user.type(nameInput, "Updated Name");
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          name: "Updated Name",
          description: "Old Description",
          image: undefined,
        });
      });
    });
  });

  describe("Image upload functionality", () => {
    it("should show image upload area", () => {
      render(
        <ProjectManagerModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(
        screen.getByLabelText(/upload project image/i)
      ).toBeInTheDocument();
    });

    it("should display existing image in edit mode", () => {
      render(
        <ProjectManagerModal
          mode="edit"
          isOpen={true}
          initialData={{
            imageUrl: "https://example.com/image.jpg",
          }}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const image = screen.getByAltText(/project preview/i);
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute("src", "https://example.com/image.jpg");
    });
  });

  describe("Optional fields", () => {
    it("should mark name field as optional", () => {
      render(
        <ProjectManagerModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(
        screen.getByText(/project name \(optional\)/i)
      ).toBeInTheDocument();
    });

    it("should mark description field as optional", () => {
      render(
        <ProjectManagerModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText(/description \(optional\)/i)).toBeInTheDocument();
    });

    it("should mark image field as optional", () => {
      render(
        <ProjectManagerModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(
        screen.getByText(/project image \(optional\)/i)
      ).toBeInTheDocument();
    });

    it("should allow saving with empty fields", async () => {
      const user = userEvent.setup();

      render(
        <ProjectManagerModal
          mode="create"
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const createButton = screen.getByRole("button", { name: /create/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          name: undefined,
          description: undefined,
          image: undefined,
        });
      });
    });
  });
});
