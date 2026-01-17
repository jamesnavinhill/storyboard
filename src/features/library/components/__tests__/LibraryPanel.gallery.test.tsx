import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { LibraryPanel } from "../LibraryPanel";
import * as projectService from "@/services/projectService";

// Mock the project service
vi.mock("@/services/projectService", () => ({
  listAssets: vi.fn(),
  updateAsset: vi.fn(),
  deleteAsset: vi.fn(),
}));

const mockProjects = [
  {
    id: "project-1",
    name: "Project One",
    description: "First project",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "project-2",
    name: "Project Two",
    description: "Second project",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockScenes = [
  { id: "scene-1", description: "Scene 1" },
  { id: "scene-2", description: "Scene 2" },
];

const mockAssetsProject1 = [
  {
    id: "asset-1",
    fileName: "image1.png",
    type: "image" as const,
    size: 1024000,
    url: "/uploads/asset-1",
    projectId: "project-1",
    sceneId: "scene-1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "asset-2",
    fileName: "video1.mp4",
    type: "video" as const,
    size: 2048000,
    url: "/uploads/asset-2",
    projectId: "project-1",
    sceneId: "scene-1",
    createdAt: new Date().toISOString(),
  },
];

const mockAssetsProject2 = [
  {
    id: "asset-3",
    fileName: "image2.png",
    type: "image" as const,
    size: 512000,
    url: "/uploads/asset-3",
    projectId: "project-2",
    sceneId: "scene-2",
    createdAt: new Date().toISOString(),
  },
];

describe("LibraryPanel - Gallery View Asset Independence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("3.1: Gallery view shows active project assets", async () => {
    // Setup: Mock listAssets to return project-1 assets
    vi.mocked(projectService.listAssets).mockResolvedValue(mockAssetsProject1);

    render(
      <LibraryPanel
        variant="full"
        activeTab="assets"
        onTabChange={vi.fn()}
        searchQuery=""
        onSearchChange={vi.fn()}
        viewMode="grid"
        onViewModeChange={vi.fn()}
        projects={mockProjects}
        scenes={mockScenes}
        activeProjectId="project-1"
        onSelectProject={vi.fn()}
      />
    );

    // Verify assets from active project are displayed
    await waitFor(() => {
      expect(projectService.listAssets).toHaveBeenCalledWith(
        "project-1",
        undefined
      );
    });

    await waitFor(() => {
      expect(screen.getByText("image1.png")).toBeInTheDocument();
      expect(screen.getByText("video1.mp4")).toBeInTheDocument();
    });

    // Check asset count matches (2 assets from project-1)
    const assetElements = screen.getAllByText(/\.(png|mp4)/);
    expect(assetElements).toHaveLength(2);
  });

  it("3.2: Sidebar navigation doesn't affect gallery (prop isolation)", async () => {
    // This test verifies that the gallery receives activeProjectId directly
    // and doesn't respond to sidebar-specific state changes
    vi.mocked(projectService.listAssets).mockResolvedValue(mockAssetsProject1);

    const { rerender } = render(
      <LibraryPanel
        variant="full"
        activeTab="assets"
        onTabChange={vi.fn()}
        searchQuery=""
        onSearchChange={vi.fn()}
        viewMode="grid"
        onViewModeChange={vi.fn()}
        projects={mockProjects}
        scenes={mockScenes}
        activeProjectId="project-1"
        onSelectProject={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("image1.png")).toBeInTheDocument();
    });

    const initialCallCount = vi.mocked(projectService.listAssets).mock.calls
      .length;

    // Simulate sidebar navigation by re-rendering with same activeProjectId
    // In the real app, sidebar navigation would NOT change activeProjectId
    rerender(
      <LibraryPanel
        variant="full"
        activeTab="assets"
        onTabChange={vi.fn()}
        searchQuery=""
        onSearchChange={vi.fn()}
        viewMode="grid"
        onViewModeChange={vi.fn()}
        projects={mockProjects}
        scenes={mockScenes}
        activeProjectId="project-1" // Same activeProjectId
        onSelectProject={vi.fn()}
      />
    );

    // Gallery content should remain unchanged - no additional API calls
    expect(vi.mocked(projectService.listAssets).mock.calls.length).toBe(
      initialCallCount
    );

    // Verify same assets are still displayed
    expect(screen.getByText("image1.png")).toBeInTheDocument();
    expect(screen.getByText("video1.mp4")).toBeInTheDocument();
  });

  it("3.3: Actual project selection updates gallery", async () => {
    // Setup: Mock different assets for different projects
    vi.mocked(projectService.listAssets)
      .mockResolvedValueOnce(mockAssetsProject1)
      .mockResolvedValueOnce(mockAssetsProject2);

    const { rerender } = render(
      <LibraryPanel
        variant="full"
        activeTab="assets"
        onTabChange={vi.fn()}
        searchQuery=""
        onSearchChange={vi.fn()}
        viewMode="grid"
        onViewModeChange={vi.fn()}
        projects={mockProjects}
        scenes={mockScenes}
        activeProjectId="project-1"
        onSelectProject={vi.fn()}
      />
    );

    // Verify initial project assets are loaded
    await waitFor(() => {
      expect(screen.getByText("image1.png")).toBeInTheDocument();
      expect(screen.getByText("video1.mp4")).toBeInTheDocument();
    });

    // Select a different project via activeProjectId change
    rerender(
      <LibraryPanel
        variant="full"
        activeTab="assets"
        onTabChange={vi.fn()}
        searchQuery=""
        onSearchChange={vi.fn()}
        viewMode="grid"
        onViewModeChange={vi.fn()}
        projects={mockProjects}
        scenes={mockScenes}
        activeProjectId="project-2" // Changed to project-2
        onSelectProject={vi.fn()}
      />
    );

    // Verify gallery view updates to show new project's assets
    await waitFor(() => {
      expect(projectService.listAssets).toHaveBeenCalledWith(
        "project-2",
        undefined
      );
    });

    await waitFor(() => {
      expect(screen.getByText("image2.png")).toBeInTheDocument();
    });

    // Confirm old assets are no longer displayed
    expect(screen.queryByText("image1.png")).not.toBeInTheDocument();
    expect(screen.queryByText("video1.mp4")).not.toBeInTheDocument();
  });

  it("3.4: Edge case - no active project (null activeProjectId)", async () => {
    render(
      <LibraryPanel
        variant="full"
        activeTab="assets"
        onTabChange={vi.fn()}
        searchQuery=""
        onSearchChange={vi.fn()}
        viewMode="grid"
        onViewModeChange={vi.fn()}
        projects={mockProjects}
        scenes={mockScenes}
        activeProjectId={null}
        onSelectProject={vi.fn()}
      />
    );

    // Verify empty state is displayed
    await waitFor(() => {
      expect(screen.getByText("No project selected")).toBeInTheDocument();
    });

    // Verify no API calls were made
    expect(projectService.listAssets).not.toHaveBeenCalled();
  });

  it("3.4: Edge case - empty project (no assets)", async () => {
    // Mock empty assets array
    vi.mocked(projectService.listAssets).mockResolvedValue([]);

    render(
      <LibraryPanel
        variant="full"
        activeTab="assets"
        onTabChange={vi.fn()}
        searchQuery=""
        onSearchChange={vi.fn()}
        viewMode="grid"
        onViewModeChange={vi.fn()}
        projects={mockProjects}
        scenes={mockScenes}
        activeProjectId="project-1"
        onSelectProject={vi.fn()}
      />
    );

    // Verify empty state displays correctly
    await waitFor(() => {
      expect(screen.getByText("No assets yet")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.getByText(
          "Assets will appear here as you generate images and videos"
        )
      ).toBeInTheDocument();
    });
  });

  it("3.4: Edge case - switching between projects with different asset counts", async () => {
    // Project 1 has 2 assets, Project 2 has 1 asset
    vi.mocked(projectService.listAssets)
      .mockResolvedValueOnce(mockAssetsProject1) // 2 assets
      .mockResolvedValueOnce(mockAssetsProject2); // 1 asset

    const { rerender } = render(
      <LibraryPanel
        variant="full"
        activeTab="assets"
        onTabChange={vi.fn()}
        searchQuery=""
        onSearchChange={vi.fn()}
        viewMode="grid"
        onViewModeChange={vi.fn()}
        projects={mockProjects}
        scenes={mockScenes}
        activeProjectId="project-1"
        onSelectProject={vi.fn()}
      />
    );

    // Verify project-1 assets (2 assets)
    await waitFor(() => {
      const assetElements = screen.getAllByText(/\.(png|mp4)/);
      expect(assetElements).toHaveLength(2);
    });

    // Switch to project-2
    rerender(
      <LibraryPanel
        variant="full"
        activeTab="assets"
        onTabChange={vi.fn()}
        searchQuery=""
        onSearchChange={vi.fn()}
        viewMode="grid"
        onViewModeChange={vi.fn()}
        projects={mockProjects}
        scenes={mockScenes}
        activeProjectId="project-2"
        onSelectProject={vi.fn()}
      />
    );

    // Verify project-2 assets (1 asset)
    await waitFor(() => {
      expect(screen.getByText("image2.png")).toBeInTheDocument();
    });

    await waitFor(() => {
      const assetElements = screen.getAllByText(/\.(png|mp4)/);
      expect(assetElements).toHaveLength(1);
    });
  });
});
