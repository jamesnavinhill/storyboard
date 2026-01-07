# Layout Feature

This feature module contains Layout-related UI and logic.

## Structure

- **components/**: Layout components for application structure
  - `ManagerDrawer/`: Drawer component for management panel
    - `ManagerDrawer.tsx`: Main drawer component
    - `hooks/useDrawerTabs.ts`: Hook for managing drawer tabs
    - `tabs/`: Tab components (DetailsTab, GroupsTagsTab, HistoryTab, LibraryTab)
- **hooks/**: View-model hooks for layout behaviors (resizable panels, collapse/expand)
- **utils/**: Layout utilities for panel management

## Components

All layout components have been migrated from `src/components/` to this feature module following the feature-first architecture pattern. The layout feature manages the resizable panel system, collapse/expand functionality, and persistence of layout state.
