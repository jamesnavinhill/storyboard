import { useCallback, useEffect, useMemo, useState } from "react";

export type LibraryTab = "projects" | "assets" | "document";
export type ViewMode = "grid" | "list";

import type { ProjectSummary } from "@/types/services";

export interface LibraryStateOptions {
  projects?: ProjectSummary[];
  scenes?: Array<{ id: string; description: string }>;
}

export interface LibraryState {
  // Tab state
  activeTab: LibraryTab;
  setActiveTab: (tab: LibraryTab) => void;

  // Search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;

  // View mode for library panel (sidebar/full)
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // View mode for gallery (main content area)
  galleryViewMode: ViewMode;
  setGalleryViewMode: (mode: ViewMode) => void;

  // View mode for storyboard (main content area)
  storyboardViewMode: ViewMode;
  setStoryboardViewMode: (mode: ViewMode) => void;

  // Filtered data
  filteredProjects: ProjectSummary[];
  filteredScenes: Array<{ id: string; description: string }>;
}

/**
 * Hook to manage library UI state (tabs, search, view modes)
 * Extracts library state management from AppShell
 */
export function useLibraryState(
  options: LibraryStateOptions = {}
): LibraryState {
  const { projects = [], scenes = [] } = options;

  // Library tab state (projects vs assets)
  const [activeTab, setActiveTab] = useState<LibraryTab>(() => {
    if (typeof window === "undefined") {
      // Default to assets so the main gallery shows project assets by default
      return "assets";
    }
    const stored = window.localStorage.getItem("vb:lmd:libSub");
    if (stored === "assets") return "assets";
    if (stored === "document") return "document";
    // No stored preference: default to assets
    return "assets";
  });

  // Search query
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return window.localStorage.getItem("vb:lmd:search") ?? "";
  });

  // View mode for library panel (sidebar/full variant)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") {
      return "grid";
    }
    const stored = window.localStorage.getItem("vb:lmd:view");
    return stored === "list" ? "list" : "grid";
  });

  // Gallery view mode (main content area, decoupled from sidebar)
  const [galleryViewMode, setGalleryViewMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") {
      return "grid";
    }
    const stored = window.localStorage.getItem("vb:gallery:view");
    return stored === "list" ? "list" : "grid";
  });

  // Storyboard view mode (main content area)
  const [storyboardViewMode, setStoryboardViewMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") {
      return "grid";
    }
    const stored = window.localStorage.getItem("vb:storyboard:view");
    return stored === "list" ? "list" : "grid";
  });

  // Persist activeTab to localStorage
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem("vb:lmd:libSub", activeTab);
    } catch {}
  }, [activeTab]);

  // Persist searchQuery to localStorage
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem("vb:lmd:search", searchQuery);
    } catch {}
  }, [searchQuery]);

  // Persist viewMode to localStorage
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem("vb:lmd:view", viewMode);
    } catch {}
  }, [viewMode]);

  // Persist galleryViewMode to localStorage
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem("vb:gallery:view", galleryViewMode);
    } catch {}
  }, [galleryViewMode]);

  // Persist storyboardViewMode to localStorage
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem("vb:storyboard:view", storyboardViewMode);
    } catch {}
  }, [storyboardViewMode]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  // Filter projects based on search query
  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return projects;
    }
    return projects.filter((project) => {
      const name = project.name.toLowerCase();
      const description = project.description?.toLowerCase() ?? "";
      return name.includes(query) || description.includes(query);
    });
  }, [projects, searchQuery]);

  // Filter scenes based on search query
  const filteredScenes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return scenes;
    }
    return scenes.filter((scene) => {
      const description = scene.description.toLowerCase();
      return description.includes(query);
    });
  }, [scenes, searchQuery]);

  return {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    clearSearch,
    viewMode,
    setViewMode,
    galleryViewMode,
    setGalleryViewMode,
    storyboardViewMode,
    setStoryboardViewMode,
    filteredProjects,
    filteredScenes,
  };
}
