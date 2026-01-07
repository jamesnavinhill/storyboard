# Requirements Document

## Introduction

This feature enhances the group and tag management interface in the StoryBoard application to improve usability and provide better visual feedback when organizing scenes. The improvements focus on making the managers more compact by default, providing clear save/done actions, and surfacing group/tag assignments directly on scene cards and in the manager panel details.

## Glossary

- **Group Manager**: The interface component that allows users to create, edit, delete, and assign groups to scenes
- **Tag Manager**: The interface component that allows users to create, delete, and assign tags to scenes
- **Scene Card**: The visual card component representing a single scene in the storyboard grid
- **Manager Panel**: The right-side panel (SceneManageDrawer) that displays scene details, groups/tags, and history
- **Badge**: A small visual indicator showing group or tag assignment with optional color coding
- **Details Panel**: The section within a scene card that displays scene information when toggled visible
- **Collapsible Section**: A UI section that can be expanded or collapsed to show/hide content

## Requirements

### Requirement 1

**User Story:** As a user managing groups and tags, I want the managers to be collapsed by default, so that I can see the interface without being overwhelmed by long lists of scenes.

#### Acceptance Criteria

1. WHEN the Manager Panel displays the Groups tab, THE Group Manager SHALL render in a collapsed state by default
2. WHEN the Manager Panel displays the Tags tab, THE Tag Manager SHALL render in a collapsed state by default
3. WHEN a user clicks on a collapsed manager section, THE Manager SHALL expand to show the full scene assignment interface
4. WHEN a user clicks on an expanded manager section header, THE Manager SHALL collapse to hide the scene assignment interface
5. WHILE a manager section is collapsed, THE Manager SHALL display a summary showing the group/tag name, color indicator, and scene count

### Requirement 2

**User Story:** As a user assigning scenes to groups or tags, I want a clear save or done button, so that I can be confident my selections have been registered.

#### Acceptance Criteria

1. WHEN a user expands a group or tag section in the manager, THE Manager SHALL display a "Done" button at the bottom of the scene assignment list
2. WHEN a user clicks the "Done" button, THE Manager SHALL collapse the section and persist all scene assignments
3. WHEN a user makes changes to scene assignments, THE Manager SHALL enable the "Done" button to indicate pending changes
4. WHEN a user collapses a section without clicking "Done", THE Manager SHALL still persist all checkbox changes made
5. WHILE the manager is in edit mode for a group name or color, THE Manager SHALL display "Save" and "Cancel" buttons as currently implemented

### Requirement 3

**User Story:** As a user viewing a scene card, I want to see which groups and tags are assigned to it, so that I can quickly understand scene organization without opening additional panels.

#### Acceptance Criteria

1. WHEN a Scene Card has an assigned group, THE Scene Card SHALL display a group badge in the details panel top row, right-aligned
2. WHEN a Scene Card has assigned tags, THE Scene Card SHALL display tag badges in the details panel top row, right-aligned
3. WHEN a Scene Card has more than three badges total, THE Scene Card SHALL display the first three badges followed by a "+N" counter badge
4. WHEN a user hovers over the "+N" counter badge, THE Scene Card SHALL display a tooltip showing all remaining group and tag names
5. WHILE the details panel is visible on a Scene Card, THE Scene Card SHALL show badges without requiring additional user interaction

### Requirement 4

**User Story:** As a user viewing scene details in the Manager Panel, I want to see group and tag badges displayed prominently, so that I can quickly identify scene categorization.

#### Acceptance Criteria

1. WHEN the Manager Panel displays scene details, THE Manager Panel SHALL show group badges below the scene description
2. WHEN the Manager Panel displays scene details, THE Manager Panel SHALL show tag badges below the scene description
3. WHEN a scene has both groups and tags assigned, THE Manager Panel SHALL display groups first, followed by tags
4. WHEN the Manager Panel displays badges, THE Manager Panel SHALL use the same badge components as the Scene Card for visual consistency
5. WHILE viewing the details tab, THE Manager Panel SHALL display badges in a flex-wrap layout to accommodate multiple items

### Requirement 5

**User Story:** As a user editing scene descriptions in the Manager Panel, I want the description textarea to expand naturally to fit the content, so that I can read and edit text without scrollbars per site standards.

#### Acceptance Criteria

1. WHEN the Manager Panel displays a scene description, THE Manager Panel SHALL render a textarea that auto-expands to fit all content without scrollbars
2. WHEN a user types in the description textarea, THE Manager Panel SHALL dynamically adjust the textarea height to accommodate new lines
3. WHEN the Manager Panel loads a scene with any length description, THE Manager Panel SHALL automatically size the textarea to show all content without truncation
4. WHILE the textarea is auto-sizing, THE Manager Panel SHALL maintain smooth visual transitions without layout jumps
5. WHEN the description content is displayed, THE Manager Panel SHALL not impose a maximum height constraint that triggers scrollbars

### Requirement 6

**User Story:** As a user viewing badges in scene card and manager panel details, I want the badges to fit naturally in the top row without affecting the description text layout, so that the interface remains consistent and readable.

#### Acceptance Criteria

1. WHEN badges are displayed in the Scene Card details panel, THE Scene Card SHALL position badges in the top row with reduced vertical spacing below them
2. WHEN badges are displayed alongside the scene description, THE Scene Card SHALL ensure the description text maintains full width without layout shifts
3. WHEN group and tag badges have different sizes, THE Scene Card SHALL account for the larger group badge size in the layout spacing
4. WHEN badges are rendered in the details panel, THE Scene Card SHALL reduce padding and spacing below badges to prevent description text from being pushed down
5. WHILE displaying badges and description text together, THE Scene Card SHALL maintain consistent layout without the description text wrapping or shifting unexpectedly

### Requirement 7

**User Story:** As a user assigning multiple tags to scenes, I want the tag section to remain expanded after each selection, so that I can add multiple scenes to a tag without reopening the section each time.

#### Acceptance Criteria

1. WHEN a user checks a scene checkbox in an expanded tag section, THE Tag Manager SHALL keep the tag section expanded
2. WHEN a user unchecks a scene checkbox in an expanded tag section, THE Tag Manager SHALL keep the tag section expanded
3. WHEN a user clicks the "Done" button in a tag section, THE Tag Manager SHALL collapse the tag section
4. WHEN a user assigns multiple scenes to a tag, THE Tag Manager SHALL maintain the expanded state throughout all selections
5. WHILE the group manager maintains single-selection behavior with auto-collapse, THE Tag Manager SHALL support multi-selection behavior without auto-collapse
