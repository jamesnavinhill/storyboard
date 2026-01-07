# Requirements Document

## Introduction

This feature converts the SceneManageDrawer from a fixed-width overlay drawer into a dedicated resizable panel that integrates with the existing three-column layout (sidebar, chat, storyboard). The scene manager will become the fourth resizable panel on the right side, mirroring the collapsible behavior of the left sidebar. Both sidebars will default to a collapsed minimal state, with the two center panels (chat and storyboard) splitting the remaining space. The scene manager will open automatically when users select assets from various entry points throughout the application.

## Glossary

- **SceneManageDrawer**: The current component that displays scene details, groups/tags, and history in a fixed-width overlay drawer
- **Layout System**: The four-column resizable layout consisting of left sidebar, chat panel, storyboard panel, and scene manager panel
- **Panel Variant**: The rendering mode of SceneManageDrawer (currently "drawer" or "panel")
- **Scene Manager Panel**: The new fourth resizable panel on the right side that will replace the drawer variant
- **Layout State**: The persisted width, visibility, and collapsed state of panels stored in localStorage
- **Resizer Handle**: The draggable divider between panels that allows width adjustment and collapse/expand actions
- **Collapsed State**: A minimal width state (72px) where a panel shows only icons or a thin divider
- **Left Sidebar**: The existing collapsible panel containing library, projects, and assets
- **Center Panels**: The chat panel and storyboard panel that occupy the main workspace

## Requirements

### Requirement 1

**User Story:** As a user, I want the scene manager to be a dedicated panel like the other panels, so that I can view and edit scene details while keeping the storyboard visible.

#### Acceptance Criteria

1. WHEN the user selects an asset from any entry point, THE Scene Manager Panel SHALL appear as a fourth column in the desktop layout
2. WHEN the Scene Manager Panel opens, THE Storyboard Panel SHALL resize to accommodate the new panel while maintaining its minimum width
3. WHEN the user closes the scene manager, THE Scene Manager Panel SHALL collapse to a minimal state and THE Storyboard Panel SHALL expand to fill the available space
4. WHERE the desktop layout is active, THE Scene Manager Panel SHALL integrate with the four-column layout without overlaying content
5. WHEN the application loads, THE Scene Manager Panel SHALL default to collapsed state

### Requirement 2

**User Story:** As a user, I want to resize the scene manager panel and collapse it when not needed, so that I can adjust how much space is dedicated to scene details versus the storyboard.

#### Acceptance Criteria

1. WHEN the Scene Manager Panel is expanded, THE System SHALL display a resizer handle between the storyboard and scene manager
2. WHEN the user drags the resizer handle toward the right edge, THE Scene Manager Panel width SHALL adjust in real-time
3. WHEN the user drags the resizer handle to within 40px of the collapsed width, THE Scene Manager Panel SHALL snap to collapsed state
4. WHEN the user drags the resizer handle from collapsed state toward the left, THE Scene Manager Panel SHALL expand to its last used width
5. THE Scene Manager Panel width SHALL be constrained between 320px minimum and 600px maximum when expanded
6. WHEN the Scene Manager Panel is collapsed, THE System SHALL display a 72px wide divider with the resizer handle visible
7. WHEN the user releases the resizer handle, THE System SHALL persist the Scene Manager Panel width and collapsed state to localStorage

### Requirement 3

**User Story:** As a user, I want both sidebars to default to collapsed state, so that I have maximum space for the main workspace when I start the application.

#### Acceptance Criteria

1. WHEN the application loads for the first time, THE Left Sidebar SHALL default to collapsed state
2. WHEN the application loads for the first time, THE Scene Manager Panel SHALL default to collapsed state
3. WHEN the application loads, THE Chat Panel and Storyboard Panel SHALL split the remaining space with their persisted widths
4. WHEN the user expands either sidebar, THE System SHALL persist the expanded state to localStorage
5. WHEN the user collapses either sidebar, THE System SHALL persist the collapsed state to localStorage

### Requirement 4

**User Story:** As a user, I want the scene manager to open automatically when I select an asset, so that I can immediately view and edit its details.

#### Acceptance Criteria

1. WHEN the user clicks on a scene card menu option that opens details, THE Scene Manager Panel SHALL expand and display that scene's details
2. WHEN the user selects an asset from the library sidebar list, THE Scene Manager Panel SHALL expand and display that asset's details
3. WHEN the user selects an asset from the asset manager, THE Scene Manager Panel SHALL expand and display that asset's details
4. WHEN the Scene Manager Panel is collapsed and a scene is selected, THE Panel SHALL expand to its last used width or default width of 440px
5. WHEN the Scene Manager Panel is already expanded and a different scene is selected, THE Panel SHALL remain expanded and update to show the new scene's details

### Requirement 5

**User Story:** As a user, I want the scene manager panel to remember its size and state, so that my preferred layout is maintained across sessions.

#### Acceptance Criteria

1. WHEN the user adjusts the Scene Manager Panel width, THE System SHALL store the width value in localStorage with key "vb:layout:sceneManagerWidth"
2. WHEN the user collapses or expands the Scene Manager Panel, THE System SHALL store the collapsed state in localStorage with key "vb:layout:sceneManagerCollapsed"
3. WHEN the application loads, THE System SHALL restore the Scene Manager Panel width and collapsed state from localStorage
4. IF no stored width exists, THEN THE System SHALL use a default width of 440px
5. WHEN the stored width is outside the valid range (320px-600px), THE System SHALL clamp the value to the minimum or maximum constraint

### Requirement 6

**User Story:** As a user on mobile, I want the scene manager to continue working as an overlay, so that the mobile experience remains optimized for smaller screens.

#### Acceptance Criteria

1. WHEN the viewport width is less than 1024px, THE Scene Manager Panel SHALL render as a fixed overlay drawer
2. WHEN the viewport width is 1024px or greater, THE Scene Manager Panel SHALL render as an integrated resizable panel
3. WHEN the user resizes the browser window across the 1024px breakpoint, THE Scene Manager Panel SHALL switch between drawer and panel modes
4. WHILE in mobile mode, THE Scene Manager Panel SHALL maintain all existing drawer functionality including the close button
5. WHEN switching from panel to drawer mode, THE System SHALL preserve the scene manager's open/closed state

### Requirement 7

**User Story:** As a user, I want all existing scene manager features to work identically in panel mode, so that I don't lose any functionality with the new layout.

#### Acceptance Criteria

1. WHEN the Scene Manager Panel is in panel mode, THE System SHALL display all tabs (Details, Groups & Tags, History) with identical functionality to drawer mode
2. WHEN the user interacts with scene details, groups, tags, or history, THE Scene Manager Panel SHALL perform the same operations as the drawer variant
3. WHEN the Scene Manager Panel is in expanded panel mode, THE System SHALL remove the close button from the header
4. WHEN the user clicks outside the Scene Manager Panel in panel mode, THE Panel SHALL remain open (unlike drawer behavior)
5. WHEN the user presses the Escape key in panel mode, THE Scene Manager Panel SHALL not close (unlike drawer behavior)

### Requirement 8

**User Story:** As a user, I want the center panels (chat and storyboard) to collapse to a minimal divider state, so that I can maximize space for other panels when needed.

#### Acceptance Criteria

1. WHEN the user drags the chat panel resizer handle to within 40px of zero width, THE Chat Panel SHALL collapse to show only a divider with the resizer handle
2. WHEN the user drags the storyboard panel resizer handle to within 40px of zero width, THE Storyboard Panel SHALL collapse to show only a divider with the resizer handle
3. WHEN a center panel is collapsed, THE System SHALL display a visible divider with the resizer handle to allow re-expansion
4. WHEN the user drags the resizer handle from a collapsed center panel, THE Panel SHALL expand to its last used width
5. WHEN a center panel is collapsed, THE System SHALL persist the collapsed state to localStorage

### Requirement 9

**User Story:** As a developer, I want the layout system to handle four panels with collapse states gracefully, so that the scene manager integrates cleanly with existing resize logic.

#### Acceptance Criteria

1. WHEN any panel is expanded or collapsed, THE Layout System SHALL calculate available space for all four panels (left sidebar, chat, storyboard, scene manager)
2. WHEN any panel is resized, THE Layout System SHALL ensure all expanded panels respect their minimum width constraints
3. WHEN the total required width exceeds the viewport, THE Layout System SHALL prioritize maintaining minimum widths for expanded panels
4. WHEN the Scene Manager Panel expands, THE Layout System SHALL reduce the Storyboard Panel width if necessary to accommodate the scene manager
5. WHEN the Scene Manager Panel collapses, THE Layout System SHALL expand the Storyboard Panel to fill the available space
