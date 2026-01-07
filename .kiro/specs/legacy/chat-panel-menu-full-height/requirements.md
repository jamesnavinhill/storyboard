# Requirements Document

## Introduction

This feature addresses the visual layout of the template styles menu (StylePresetPicker) and settings menu (SettingsPanel) within the ChatPanel component. Currently, these menus have fixed maximum height constraints that prevent them from utilizing the full vertical space available in the chat panel. The goal is to modify these menus to extend from the bottom of the chat panel to cover the full available vertical space, improving the user experience by maximizing content visibility.

## Glossary

- **ChatPanel**: The main chat interface component that contains the message history, input area, and various control buttons.
- **StylePresetPicker**: A popover menu component that displays a grid of style preset thumbnails for users to select visual styles for their generated content.
- **SettingsPanel**: A popover menu component that displays various configuration options including scene count, aspect ratio, workflow type, and model selections.
- **Popover Menu**: An overlay UI element that appears above other content, typically anchored to a specific location on the screen.
- **Full Vertical Space**: The entire height available within the ChatPanel, from the top of the chat history area to the bottom of the input controls.

## Requirements

### Requirement 1

**User Story:** As a user, I want the style presets menu to cover the full vertical space of the chat panel, so that I can see more style options at once without scrolling as much. and to create a more cohesive layout and cleaner view.

#### Acceptance Criteria

1. WHEN the user opens the StylePresetPicker menu, THE StylePresetPicker SHALL extend from the bottom input area to the top of the ChatPanel.
2. THE StylePresetPicker SHALL maintain its scrollable content area for the style grid.
3. THE StylePresetPicker SHALL keep its "Done" button fixed at the bottom of the menu.
4. THE StylePresetPicker SHALL not exceed the boundaries of the ChatPanel container.

### Requirement 2

**User Story:** As a user, I want the settings menu to cover the full vertical space of the chat panel, so that I can view all available settings options without excessive scrolling. and to create a more cohesive layout and cleaner view.

#### Acceptance Criteria

1. WHEN the user opens the SettingsPanel menu, THE SettingsPanel SHALL extend from the bottom input area to the top of the ChatPanel.
2. THE SettingsPanel SHALL maintain its scrollable content area for all settings sections.
3. THE SettingsPanel SHALL keep its "Done" button fixed at the bottom of the menu.
4. THE SettingsPanel SHALL not exceed the boundaries of the ChatPanel container.

### Requirement 3

**User Story:** As a user, I want both menus to maintain their responsive behavior, so that the interface works correctly on different screen sizes.

#### Acceptance Criteria

1. THE StylePresetPicker SHALL maintain responsive padding and spacing on mobile and desktop viewports.
2. THE SettingsPanel SHALL maintain responsive padding and spacing on mobile and desktop viewports.
3. WHEN the viewport size changes, THE menus SHALL adjust their layout appropriately without breaking the full-height behavior.
