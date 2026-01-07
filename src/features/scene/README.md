# Scene Feature

This feature module contains Scene management-related UI and logic.

## Structure

- **components/**: Presentational and container components for scene management
  - `SceneManageDrawer`: Main drawer for scene management (includes integrated group and tag management)
  - `SceneHistoryPanel`: Panel displaying scene history
  - `GroupBadge`: Badge component for displaying groups
  - `TagBadge`: Badge component for displaying tags
- **hooks/**: View-model hooks for scene management interactions

## Components

All scene management components have been migrated from `src/components/` to this feature module following the feature-first architecture pattern. Components use UI primitives from `@/ui/` (like Select, Badge) and shared components from `@/components/`.
