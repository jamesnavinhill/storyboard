# Requirements Document

## Introduction

This feature addresses the gallery view behavior in the library panel. Currently, when users switch between projects in the library manager (sidebar), the gallery view (full library panel showing assets) filters its contents based on the selected project. Users expect the gallery view to always display all assets from the active project, independent of their navigation in the library manager sidebar.

## Glossary

- **Gallery View**: The full-screen library panel view that displays assets in grid or list layout, accessed via the assets tab
- **Library Manager**: The sidebar component that shows the collapsible project list and allows project navigation
- **Active Project**: The currently selected project in the application state that determines which project's data is displayed
- **Asset Manager**: The component responsible for displaying and managing assets (images, videos, attachments)
- **Library Panel**: The container component that can render in either "sidebar" or "full" variant modes

## Requirements

### Requirement 1

**User Story:** As a user viewing the gallery, I want to see all assets from my active project, so that I can browse and manage my media without being affected by sidebar navigation

#### Acceptance Criteria

1. WHEN the user opens the gallery view (assets tab in full library panel), THE Asset Manager SHALL display all assets from the active project
2. WHEN the user navigates between projects in the library manager sidebar, THE Asset Manager in gallery view SHALL continue displaying assets from the active project
3. WHEN the user changes the active project, THE Asset Manager SHALL update to display assets from the newly selected active project
4. THE Asset Manager SHALL filter assets based only on the active project ID, not on any library panel selection state

### Requirement 2

**User Story:** As a user, I want the library manager sidebar and gallery view to operate independently, so that I can navigate projects in the sidebar without disrupting my gallery browsing

#### Acceptance Criteria

1. THE Library Panel component SHALL pass the active project ID to the Asset Manager when rendering in full variant mode
2. THE Library Panel component SHALL NOT pass any sidebar-specific navigation state to the Asset Manager in gallery view
3. WHEN rendering the assets tab in full variant, THE Library Panel SHALL ensure the Asset Manager receives the active project ID from app-level state
4. THE Asset Manager in gallery view SHALL respond only to changes in the active project ID, not to sidebar navigation events

### Requirement 3

**User Story:** As a user, I want consistent asset filtering behavior, so that the gallery view always reflects my current working project

#### Acceptance Criteria

1. THE Asset Manager SHALL load assets using the projectId prop provided to it
2. WHEN the projectId prop changes, THE Asset Manager SHALL reload assets for the new project
3. THE Asset Manager SHALL maintain its internal filter state (type, search) independent of project selection
4. THE Asset Manager SHALL display an empty state message when no active project exists
