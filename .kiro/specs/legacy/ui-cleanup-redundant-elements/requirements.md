# Requirements Document

## Introduction

This feature focuses on cleaning up redundant UI elements in the library/project management interface. The current interface has duplicate search functionality and an unnecessary bottom filter bar that clutters the user experience. This cleanup will streamline the interface by removing these redundant elements while maintaining the top-level, in-style controls.

## Glossary

- **Library View**: The interface showing projects and assets, accessed via the "Library" button in the header
- **Top-Level Controls**: The primary search bar and view controls at the top of the library interface
- **Redundant Search Bar**: The secondary white search input that appears below the tab navigation
- **Bottom Filter Bar**: The footer section displaying GROUP/TAGS dropdowns and "Clear filters" button
- **Project Manager**: The component responsible for displaying and managing projects in the library view

## Requirements

### Requirement 1

**User Story:** As a user, I want a clean, uncluttered library interface so that I can focus on my projects without visual noise.

#### Acceptance Criteria

1. WHEN the Library view is displayed, THE Project Manager SHALL render only one search bar at the top level
2. WHEN the Library view is displayed, THE Project Manager SHALL NOT render a secondary white search input below the tabs
3. WHEN the Library view is displayed, THE Project Manager SHALL NOT render the bottom filter bar with GROUP and TAGS dropdowns
4. WHEN the Library view is displayed, THE Project Manager SHALL maintain all functional top-level controls including search, view mode toggles, and import button
5. THE Project Manager SHALL preserve the existing styling and layout of the top-level controls

### Requirement 2

**User Story:** As a user, I want the interface to remain functional after cleanup so that I can still search and manage my projects effectively.

#### Acceptance Criteria

1. WHEN I use the top-level search bar, THE Project Manager SHALL filter projects based on my search query
2. WHEN I toggle between grid and list view modes, THE Project Manager SHALL update the display accordingly
3. WHEN I click the Import button, THE Project Manager SHALL open the file selection dialog
4. THE Project Manager SHALL maintain all existing project management functionality including rename, delete, and export operations
5. THE Project Manager SHALL display project cards with all existing information including name, description, date, and scene count
