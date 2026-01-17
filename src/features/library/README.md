# Library Feature

This feature module contains Library-related UI and logic.

Structure:

- components/: presentational and container components for the library
  - `LibraryPanel`: Main library panel component with toolbar and tab rendering
  - `ProjectManager`: Component for managing projects (list, rename, delete, export)
  - `AssetManager`: Component for managing assets (browse, search, filter)
  - `AssetCard`: Card component for displaying individual assets
  - `DetailsEditor`: Component for editing project/scene details
  - `GroupsInlineManager`: Component for managing groups
  - `TagsInlineManager`: Component for managing tags
  - `ProjectDetails`: Component for displaying project details
- hooks/: view-model hooks for search/filter and interactions
  - `useLibraryState`: Main hook for managing library UI state (tabs, search, view modes)
  - `useLibrarySearchState`: Shared search state with debounce and localStorage persistence
- state/: store slices/selectors for library state (planned Stage 2)

## Hooks

### useLibraryState

Manages all library UI state including:

- Active tab (projects vs assets)
- Search query with localStorage persistence
- View mode for library panel (grid/list)
- Gallery view mode for main content area (grid/list)
- Filtered projects and scenes based on search query

**Usage:**

```typescript
const library = useLibraryState({
  projects: projectsList,
  scenes: scenesList,
});

// Access state
library.activeTab // "projects" | "assets"
library.searchQuery // current search string
library.viewMode // "grid" | "list"
library.galleryViewMode // "grid" | "list"
library.filteredProjects // filtered project list
library.filteredScenes // filtered scene list

// Update state
library.setActiveTab("assets");
library.setSearchQuery("my search");
library.setViewMode("list");
library.setGalleryViewMode("grid");
library.clearSearch();
```

## Components

### LibraryPanel

A reusable library panel component that displays projects or assets with toolbar controls.

**Features:**

- Two variants: "sidebar" (compact) and "full" (with all controls)
- Tab switching between projects and assets
- Search functionality (full variant only)
- View mode toggle (grid/list) (full variant only)
- Integrates with ProjectManager and AssetManager components

**Usage:**

```typescript
import { LibraryPanel } from "@/features/library";

<LibraryPanel
  variant="full" // or "sidebar"
  activeTab={library.activeTab}
  onTabChange={library.setActiveTab}
  searchQuery={library.searchQuery}
  onSearchChange={library.setSearchQuery}
  viewMode={library.viewMode}
  onViewModeChange={library.setViewMode}
  projects={projects}
  scenes={scenes}
  activeProjectId={activeProjectId}
  onSelectProject={handleSelectProject}
  onRenameProject={handleRenameProject}
  onDeleteProject={handleDeleteProject}
  onExportProject={handleExportProject}
  onImportProject={handleImportProject}
  onOpenSceneHistory={handleOpenSceneHistory}
  onOpenManage={handleOpenManage}
  historySceneId={selectedSceneId}
/>
```

**Props:**

- `variant`: "sidebar" | "full" - Determines layout and controls shown
- `activeTab`: "projects" | "assets" - Current active tab
- `onTabChange`: Callback when tab changes
- `searchQuery`: Current search query string
- `onSearchChange`: Callback when search query changes
- `viewMode`: "grid" | "list" - Current view mode
- `onViewModeChange`: Callback when view mode changes
- `projects`: Array of project summaries
- `scenes`: Array of scenes
- `activeProjectId`: Currently active project ID
- `onSelectProject`: Callback when project is selected
- `onRenameProject`: Optional callback for renaming projects
- `onDeleteProject`: Optional callback for deleting projects
- `onExportProject`: Optional callback for exporting projects
- `onImportProject`: Optional callback for importing projects
- `onOpenSceneHistory`: Optional callback for opening scene history
- `onOpenManage`: Optional callback for opening scene management
- `historySceneId`: Optional ID of scene with history open
```
