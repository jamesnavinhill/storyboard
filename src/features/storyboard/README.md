# Storyboard Feature

This feature module contains Storyboard-related UI and logic.

## Structure

- **components/**: Presentational and container components for storyboard
  - `SceneCard`: Main scene card component (formerly DesktopSceneCard)
  - `GhostSceneCard`: Placeholder card for drag-and-drop operations
  - `SceneCardPreview`: Preview-only variant of scene card
  - `StackedGroupCard`: Grouped scene card variant
  - `StoryboardPanel`: Main storyboard panel with drag-and-drop
  - `SceneEditPanel`: Panel for editing scene descriptions
  - `SceneAnimatePanel`: Panel for animating scenes
  - `StylePresetPicker`: Component for selecting style presets
- **hooks/**: View-model hooks for storyboard interactions
- **state/**: Store slices/selectors for storyboard-specific state

## Components

All storyboard components have been migrated from `src/components/` to this feature module following the feature-first architecture pattern. Components use UI primitives from `@/ui/` and shared components from `@/components/`.
