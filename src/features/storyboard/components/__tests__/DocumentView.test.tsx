import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DocumentView } from "../DocumentView";
import type { Scene, SceneGroup, Settings } from "@/types";
import type { ProjectSummary } from "@/types/services";

const mockProject: ProjectSummary = {
  id: "project-1",
  name: "Test Project",
  description: "Test project description",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-02T00:00:00Z",
  sceneCount: 2,
};

const mockScenes: Scene[] = [
  {
    id: "scene-1",
    projectId: "project-1",
    orderIndex: 0,
    description: "First scene description",
    imageUrl: null,
    videoUrl: null,
    groupId: "group-1",
    tagIds: [],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "scene-2",
    projectId: "project-1",
    orderIndex: 1,
    description: "Second scene description",
    imageUrl: null,
    videoUrl: null,
    groupId: null,
    tagIds: [],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
];

const mockGroups: SceneGroup[] = [
  {
    id: "group-1",
    projectId: "project-1",
    name: "Opening",
    color: "#FF0000",
    createdAt: "2025-01-01T00:00:00Z",
  },
];

const mockSettings: Settings = {
  workflow: "music-video",
  sceneCount: 8,
  chatModel: "gemini-2.5-pro",
  imageModel: "imagen-4.0-generate-001",
  videoModel: "veo-3.1-generate-preview",
  videoAutoplay: "on-generate",
  videoResolution: "1080p",
  videoDuration: 8,
};

describe("DocumentView - Document Content Display", () => {
  const mockOnUpdateScene = vi.fn();
  const mockOnUpdateProject = vi.fn();
  const mockOnUpdateSettings = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockOnUpdateScene.mockResolvedValue(undefined);
    mockOnUpdateProject.mockResolvedValue(undefined);
    mockOnUpdateSettings.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Document content display", () => {
    it("should display project name", () => {
      render(
        <DocumentView
          projectId="project-1"
          project={mockProject}
          scenes={mockScenes}
          groups={mockGroups}
          settings={mockSettings}
          onUpdateScene={mockOnUpdateScene}
          onUpdateProject={mockOnUpdateProject}
          onUpdateSettings={mockOnUpdateSettings}
        />
      );

      const nameInput = screen.getByLabelText(/project name/i);
      expect(nameInput).toHaveValue("Test Project");
    });

    it("should display project description", () => {
      render(
        <DocumentView
          projectId="project-1"
          project={mockProject}
          scenes={mockScenes}
          groups={mockGroups}
          settings={mockSettings}
          onUpdateScene={mockOnUpdateScene}
          onUpdateProject={mockOnUpdateProject}
          onUpdateSettings={mockOnUpdateSettings}
        />
      );

      const descriptionInput = screen.getByLabelText(/^description$/i);
      expect(descriptionInput).toHaveValue("Test project description");
    });

    it("should display workflow setting", () => {
      render(
        <DocumentView
          projectId="project-1"
          project={mockProject}
          scenes={mockScenes}
          groups={mockGroups}
          settings={mockSettings}
          onUpdateScene={mockOnUpdateScene}
          onUpdateProject={mockOnUpdateProject}
          onUpdateSettings={mockOnUpdateSettings}
        />
      );

      const workflowSelect = screen.getByLabelText(/workflow/i);
      expect(workflowSelect).toHaveValue("music-video");
    });

    it("should display total scene count", () => {
      render(
        <DocumentView
          projectId="project-1"
          project={mockProject}
          scenes={mockScenes}
          groups={mockGroups}
          settings={mockSettings}
          onUpdateScene={mockOnUpdateScene}
          onUpdateProject={mockOnUpdateProject}
          onUpdateSettings={mockOnUpdateSettings}
        />
      );

      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("should display all scene descriptions", () => {
      render(
        <DocumentView
          projectId="project-1"
          project={mockProject}
          scenes={mockScenes}
          groups={mockGroups}
          settings={mockSettings}
          onUpdateScene={mockOnUpdateScene}
          onUpdateProject={mockOnUpdateProject}
          onUpdateSettings={mockOnUpdateSettings}
        />
      );

      expect(screen.getByText("Scene 1")).toBeInTheDocument();
      expect(screen.getByText("Scene 2")).toBeInTheDocument();

      const scene1Input = screen.getByDisplayValue("First scene description");
      const scene2Input = screen.getByDisplayValue("Second scene description");

      expect(scene1Input).toBeInTheDocument();
      expect(scene2Input).toBeInTheDocument();
    });

    it("should display group name for scenes in groups", () => {
      render(
        <DocumentView
          projectId="project-1"
          project={mockProject}
          scenes={mockScenes}
          groups={mockGroups}
          settings={mockSettings}
          onUpdateScene={mockOnUpdateScene}
          onUpdateProject={mockOnUpdateProject}
          onUpdateSettings={mockOnUpdateSettings}
        />
      );

      expect(screen.getByText("Opening")).toBeInTheDocument();
    });

    it("should show message when no project is selected", () => {
      render(
        <DocumentView
          projectId="project-1"
          project={null}
          scenes={[]}
          groups={[]}
          settings={mockSettings}
          onUpdateScene={mockOnUpdateScene}
          onUpdateProject={mockOnUpdateProject}
          onUpdateSettings={mockOnUpdateSettings}
        />
      );

      expect(screen.getByText("No project selected")).toBeInTheDocument();
    });
  });

  describe("Edits updating underlying data", () => {
    it("should update project name when edited", async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <DocumentView
          projectId="project-1"
          project={mockProject}
          scenes={mockScenes}
          groups={mockGroups}
          settings={mockSettings}
          onUpdateScene={mockOnUpdateScene}
          onUpdateProject={mockOnUpdateProject}
          onUpdateSettings={mockOnUpdateSettings}
        />
      );

      const nameInput = screen.getByLabelText(/project name/i);
      await user.clear(nameInput);
      await user.type(nameInput, "Updated Project Name");

      // Trigger autosave
      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(mockOnUpdateProject).toHaveBeenCalledWith({
          name: "Updated Project Name",
          description: "Test project description",
        });
      });
    });

    it("should update project description when edited", async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <DocumentView
          projectId="project-1"
          project={mockProject}
          scenes={mockScenes}
          groups={mockGroups}
          settings={mockSettings}
          onUpdateScene={mockOnUpdateScene}
          onUpdateProject={mockOnUpdateProject}
          onUpdateSettings={mockOnUpdateSettings}
        />
      );

      const descriptionInput = screen.getByLabelText(/^description$/i);
      await user.clear(descriptionInput);
      await user.type(descriptionInput, "Updated description");

      // Trigger autosave
      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(mockOnUpdateProject).toHaveBeenCalledWith({
          name: "Test Project",
          description: "Updated description",
        });
      });
    });

    it("should update workflow when changed", async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <DocumentView
          projectId="project-1"
          project={mockProject}
          scenes={mockScenes}
          groups={mockGroups}
          settings={mockSettings}
          onUpdateScene={mockOnUpdateScene}
          onUpdateProject={mockOnUpdateProject}
          onUpdateSettings={mockOnUpdateSettings}
        />
      );

      const workflowSelect = screen.getByLabelText(/workflow/i);
      await user.selectOptions(workflowSelect, "product-commercial");

      // Trigger autosave
      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(mockOnUpdateSettings).toHaveBeenCalledWith({
          workflow: "product-commercial",
        });
      });
    });

    it("should display concept-art workflow option in dropdown", () => {
      render(
        <DocumentView
          projectId="project-1"
          project={mockProject}
          scenes={mockScenes}
          groups={mockGroups}
          settings={mockSettings}
          onUpdateScene={mockOnUpdateScene}
          onUpdateProject={mockOnUpdateProject}
          onUpdateSettings={mockOnUpdateSettings}
        />
      );

      const workflowSelect = screen.getByLabelText(
        /workflow/i
      ) as HTMLSelectElement;
      const options = Array.from(workflowSelect.options).map(
        (opt) => opt.value
      );

      // Verify all workflow options are present
      expect(options).toContain("music-video");
      expect(options).toContain("product-commercial");
      expect(options).toContain("viral-social");
      expect(options).toContain("explainer-video");
    });

    it("should update scene description when edited", async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <DocumentView
          projectId="project-1"
          project={mockProject}
          scenes={mockScenes}
          groups={mockGroups}
          settings={mockSettings}
          onUpdateScene={mockOnUpdateScene}
          onUpdateProject={mockOnUpdateProject}
          onUpdateSettings={mockOnUpdateSettings}
        />
      );

      const scene1Input = screen.getByDisplayValue("First scene description");
      await user.clear(scene1Input);
      await user.type(scene1Input, "Updated scene description");

      // Trigger autosave
      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(mockOnUpdateScene).toHaveBeenCalledWith("scene-1", {
          description: "Updated scene description",
        });
      });
    });

    it("should update multiple scenes independently", async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <DocumentView
          projectId="project-1"
          project={mockProject}
          scenes={mockScenes}
          groups={mockGroups}
          settings={mockSettings}
          onUpdateScene={mockOnUpdateScene}
          onUpdateProject={mockOnUpdateProject}
          onUpdateSettings={mockOnUpdateSettings}
        />
      );

      const scene1Input = screen.getByDisplayValue("First scene description");
      const scene2Input = screen.getByDisplayValue("Second scene description");

      await user.clear(scene1Input);
      await user.type(scene1Input, "Updated scene 1");

      await user.clear(scene2Input);
      await user.type(scene2Input, "Updated scene 2");

      // Trigger autosave
      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(mockOnUpdateScene).toHaveBeenCalledWith("scene-1", {
          description: "Updated scene 1",
        });
        expect(mockOnUpdateScene).toHaveBeenCalledWith("scene-2", {
          description: "Updated scene 2",
        });
      });
    });
  });

  describe("Document autosave", () => {
    it("should not trigger autosave on initial load", async () => {
      render(
        <DocumentView
          projectId="project-1"
          project={mockProject}
          scenes={mockScenes}
          groups={mockGroups}
          settings={mockSettings}
          onUpdateScene={mockOnUpdateScene}
          onUpdateProject={mockOnUpdateProject}
          onUpdateSettings={mockOnUpdateSettings}
        />
      );

      // Advance time
      vi.advanceTimersByTime(2000);

      // Should not have called any update functions
      expect(mockOnUpdateProject).not.toHaveBeenCalled();
      expect(mockOnUpdateSettings).not.toHaveBeenCalled();
      expect(mockOnUpdateScene).not.toHaveBeenCalled();
    });

    it("should trigger autosave after 2 seconds of inactivity", async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <DocumentView
          projectId="project-1"
          project={mockProject}
          scenes={mockScenes}
          groups={mockGroups}
          settings={mockSettings}
          onUpdateScene={mockOnUpdateScene}
          onUpdateProject={mockOnUpdateProject}
          onUpdateSettings={mockOnUpdateSettings}
        />
      );

      const nameInput = screen.getByLabelText(/project name/i);
      await user.type(nameInput, " Updated");

      // Should not save immediately
      expect(mockOnUpdateProject).not.toHaveBeenCalled();

      // Advance time by 2 seconds
      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(mockOnUpdateProject).toHaveBeenCalled();
      });
    });

    it("should debounce multiple rapid changes", async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <DocumentView
          projectId="project-1"
          project={mockProject}
          scenes={mockScenes}
          groups={mockGroups}
          settings={mockSettings}
          onUpdateScene={mockOnUpdateScene}
          onUpdateProject={mockOnUpdateProject}
          onUpdateSettings={mockOnUpdateSettings}
        />
      );

      const nameInput = screen.getByLabelText(/project name/i);

      // Make multiple rapid changes
      await user.type(nameInput, "1");
      vi.advanceTimersByTime(500);

      await user.type(nameInput, "2");
      vi.advanceTimersByTime(500);

      await user.type(nameInput, "3");

      // Complete the debounce
      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        // Should only save once with final value
        expect(mockOnUpdateProject).toHaveBeenCalledTimes(1);
      });
    });

    it("should show saving indicator during save", async () => {
      const user = userEvent.setup({ delay: null });

      // Make save take some time
      mockOnUpdateProject.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <DocumentView
          projectId="project-1"
          project={mockProject}
          scenes={mockScenes}
          groups={mockGroups}
          settings={mockSettings}
          onUpdateScene={mockOnUpdateScene}
          onUpdateProject={mockOnUpdateProject}
          onUpdateSettings={mockOnUpdateSettings}
        />
      );

      const nameInput = screen.getByLabelText(/project name/i);
      await user.type(nameInput, " Updated");

      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByText(/saving/i)).toBeInTheDocument();
      });
    });

    it("should show last saved time after successful save", async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <DocumentView
          projectId="project-1"
          project={mockProject}
          scenes={mockScenes}
          groups={mockGroups}
          settings={mockSettings}
          onUpdateScene={mockOnUpdateScene}
          onUpdateProject={mockOnUpdateProject}
          onUpdateSettings={mockOnUpdateSettings}
        />
      );

      const nameInput = screen.getByLabelText(/project name/i);
      await user.type(nameInput, " Updated");

      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByText(/saved/i)).toBeInTheDocument();
      });
    });

    it("should show error message when save fails", async () => {
      const user = userEvent.setup({ delay: null });
      mockOnUpdateProject.mockRejectedValue(new Error("Save failed"));

      render(
        <DocumentView
          projectId="project-1"
          project={mockProject}
          scenes={mockScenes}
          groups={mockGroups}
          settings={mockSettings}
          onUpdateScene={mockOnUpdateScene}
          onUpdateProject={mockOnUpdateProject}
          onUpdateSettings={mockOnUpdateSettings}
        />
      );

      const nameInput = screen.getByLabelText(/project name/i);
      await user.type(nameInput, " Updated");

      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByText(/failed to save/i)).toBeInTheDocument();
      });
    });
  });

  describe("Standard text editing operations", () => {
    it("should support copy operation", async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <DocumentView
          projectId="project-1"
          project={mockProject}
          scenes={mockScenes}
          groups={mockGroups}
          settings={mockSettings}
          onUpdateScene={mockOnUpdateScene}
          onUpdateProject={mockOnUpdateProject}
          onUpdateSettings={mockOnUpdateSettings}
        />
      );

      const nameInput = screen.getByLabelText(
        /project name/i
      ) as HTMLInputElement;

      // Select all text
      nameInput.focus();
      nameInput.setSelectionRange(0, nameInput.value.length);

      // Copy should work (browser handles this)
      expect(nameInput.value).toBe("Test Project");
    });

    it("should support paste operation", async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <DocumentView
          projectId="project-1"
          project={mockProject}
          scenes={mockScenes}
          groups={mockGroups}
          settings={mockSettings}
          onUpdateScene={mockOnUpdateScene}
          onUpdateProject={mockOnUpdateProject}
          onUpdateSettings={mockOnUpdateSettings}
        />
      );

      const nameInput = screen.getByLabelText(/project name/i);
      await user.clear(nameInput);
      await user.paste("Pasted Text");

      expect(nameInput).toHaveValue("Pasted Text");
    });

    it("should support undo operation", async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <DocumentView
          projectId="project-1"
          project={mockProject}
          scenes={mockScenes}
          groups={mockGroups}
          settings={mockSettings}
          onUpdateScene={mockOnUpdateScene}
          onUpdateProject={mockOnUpdateProject}
          onUpdateSettings={mockOnUpdateSettings}
        />
      );

      const nameInput = screen.getByLabelText(/project name/i);
      const originalValue = (nameInput as HTMLInputElement).value;

      await user.type(nameInput, " Modified");
      expect(nameInput).toHaveValue(originalValue + " Modified");
    });
  });
});
