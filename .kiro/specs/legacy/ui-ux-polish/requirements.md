# UI/UX Polish Requirements

## Introduction

This specification addresses comprehensive user interface and user experience improvements across VibeBoard's main application areas: sidebar navigation, chat panel, main storyboard view, manager panel, and settings. The goal is to create a more polished, consistent, and usable interface by improving layout, spacing, component organization, and visual styling.

## Glossary

- **Sidebar**: Left navigation panel containing projects, assets, settings, and theme controls
- **Chat Panel**: Right panel for AI chat interaction with upload capabilities
- **Main Panel**: Central storyboard view with scene cards and navigation
- **Manager Panel**: Right panel for managing groups, tags, and scene details
- **Settings Sheet**: Modal overlay for application and workflow configuration
- **Collapsible**: UI element that can expand/collapse to show/hide content
- **Upload Zone**: Area in chat panel for file uploads with drag-and-drop support
- **Storyboard Card**: Visual card displaying scene information with media thumbnails
- **Theme**: Visual appearance mode (light or dark)

## Requirements

### Requirement 1: Reorganize Sidebar Project and Asset Structure

**User Story:** As a user, I want projects and assets organized hierarchically in the sidebar, so that I can easily browse my content without clutter.

#### Acceptance Criteria

1. THE Sidebar SHALL display the new project button directly under the header row
2. THE Sidebar SHALL display projects as collapsible items below the new project button
3. WHEN a project is expanded, THE Sidebar SHALL reveal associated assets in a list with thumbnails
4. THE Sidebar SHALL provide more breathing room between settings section and the bottom of page
5. THE Sidebar SHALL display only one dividing line between settings and theme controls
6. THE Sidebar SHALL remove the dividing line that previously appeared between theme and settings and replace with the one that appears above theme

### Requirement 2: Improve Chat Panel Layout and Upload Zone

**User Story:** As a user, I want the chat panel to be more space-efficient and intuitive, so that I can focus on conversation without unnecessary UI elements.

#### Acceptance Criteria

1. THE Chat Panel SHALL automatically switch to chat view when chat modes are selected
2. THE Chat Panel SHALL NOT keep the upload zone visible
3. THE Upload Zone SHALL use less vertical space by aligning icon and text horizontally
4. THE Upload Zone SHALL hide subtext and display it as a tooltip on hover
5. THE Chat Panel SHALL display the "Manage Workflows" button in the workflows menu
6. WHEN "Manage Workflows" is clicked, THE System SHALL navigate to the global settings sheet workflows panel

### Requirement 3: Enhance Main Panel Navigation and Layout

**User Story:** As a developer, I want the main panel navigation to be clearly organized, so that users can easily access controls and filters.

#### Acceptance Criteria

1. THE Main Panel SHALL left-align navigation icons
2. THE Main Panel SHALL right-align subtabs and filter icons on the same row
3. THE Storyboard View SHALL display a layout icon in the top row right-aligned section
4. THE Export Modal SHALL NOT use translucent styling, it should be the same bg consistent with site branding
5. THE History Modal SHALL NOT use translucent styling consistent with site branding, it should be the same bg consistent with site branding
6. THE Export Modal SHALL be fully usable with proper contrast and readability
7. THE History Modal SHALL be fully usable with proper contrast and readability

### Requirement 4: Simplify Manager Panel Interface

**User Story:** As a user, I want to manage groups and tags directly in the panel, so that I don't need to deal with additional modals or popouts.

#### Acceptance Criteria

1. THE Manager Panel SHALL be renamed from "Left" to a simpler, more descriptive name
2. THE Group Manager SHALL open directly in the manager panel without additional modals
3. THE Tag Manager SHALL open directly in the manager panel without additional modals
4. THE Manager Panel SHALL allow users to manage groups inline within the panel
5. THE Manager Panel SHALL update legacy styling for buttons to match the rest of the application
6. THE Manager Panel SHALL update legacy styling for icons to match the rest of the application
7. THE Manager Panel SHALL update legacy styling for dropdowns to match the rest of the application

### Requirement 5: Reorganize Settings Panel Structure

**User Story:** As a user, I want settings organized logically by category, so that I can find and configure options easily.

#### Acceptance Criteria

1. THE Settings Panel SHALL remove "model/workflow" settings from the bottom of the workflow panel
2. THE Settings Panel SHALL organize template badges in a cleaner, more readable layout
3. THE Settings Panel SHALL include all missing settings in the models section
4. THE Settings Panel SHALL include all missing settings in the app settings panel
5. THE Settings Panel SHALL ensure all configuration options are accessible and properly categorized

### Requirement 6: Fix Light Theme Storyboard Card Styling

**User Story:** As a user, I want storyboard cards to be readable in light theme, so that I can use the application comfortably in bright environments.

#### Acceptance Criteria

1. THE Storyboard Cards SHALL NOT display black bars in light theme
2. THE Media Cards SHALL NOT display black bars in light theme
3. THE Storyboard Cards SHALL adjust theme colors for proper contrast in light mode
4. THE Media Cards SHALL adjust theme colors for proper contrast in light mode
5. THE Storyboard Cards SHALL maintain visual consistency with the rest of the light theme
6. THE Media Cards SHALL maintain visual consistency with the rest of the light theme
