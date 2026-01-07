# Requirements Document

## Introduction

The application has grown to contain several monolithic files exceeding 1000-2000 lines, making the codebase difficult to maintain, test, and reason about. The primary offender is `AppShell.tsx` at 2035 lines, which combines layout management, state orchestration, event handling, and UI rendering. This refactor aims to decompose these large files into focused, maintainable modules following single-responsibility principles.

## Glossary

- **AppShell**: The main application container component responsible for layout and orchestration
- **Layout System**: The resizable panel system managing sidebar, chat, storyboard, and scene manager panels
- **State Hook**: A custom React hook that encapsulates state logic and returns state and actions
- **Feature Module**: A self-contained directory containing related components, hooks, and utilities
- **Composition**: The pattern of building complex components from smaller, focused components
- **Single Responsibility Principle (SRP)**: Each module should have one reason to change

## Requirements

### Requirement 1

**User Story:** As a developer, I want the AppShell component to be under 300 lines, so that I can understand the application structure at a glance

#### Acceptance Criteria

1. WHEN THE AppShell component is viewed, THE System SHALL contain fewer than 300 lines of code
2. WHEN THE AppShell component is analyzed, THE System SHALL delegate layout logic to dedicated layout components
3. WHEN THE AppShell component is analyzed, THE System SHALL delegate state management to custom hooks
4. WHEN THE AppShell component is analyzed, THE System SHALL delegate event handlers to feature-specific hooks
5. THE AppShell component SHALL serve only as a composition layer connecting features together

### Requirement 2

**User Story:** As a developer, I want layout management separated from business logic, so that I can modify layout behavior without affecting application features

#### Acceptance Criteria

1. THE System SHALL extract all resizable panel logic into a dedicated layout feature module
2. THE System SHALL extract all collapse/expand logic into dedicated layout hooks
3. THE System SHALL extract all layout persistence logic into a dedicated storage utility
4. WHEN layout dimensions change, THE System SHALL update layout state without affecting feature state
5. THE System SHALL provide layout state through a dedicated `useLayout` hook

### Requirement 3

**User Story:** As a developer, I want state management hooks to be under 200 lines each, so that each hook has a clear, focused responsibility

#### Acceptance Criteria

1. WHEN any state management hook is viewed, THE System SHALL contain fewer than 200 lines of code
2. THE System SHALL split complex hooks into multiple focused hooks by domain
3. THE System SHALL extract shared state logic into composable utility hooks
4. WHEN a hook manages multiple concerns, THE System SHALL decompose it into separate hooks
5. THE System SHALL ensure each hook has a single, well-defined purpose

### Requirement 4

**User Story:** As a developer, I want event handlers grouped by feature domain, so that I can find and modify related functionality easily

#### Acceptance Criteria

1. THE System SHALL group scene-related handlers into a `useSceneActions` hook
2. THE System SHALL group project-related handlers into a `useProjectActions` hook
3. THE System SHALL group media generation handlers into a `useMediaActions` hook
4. THE System SHALL group layout-related handlers into a `useLayoutActions` hook
5. WHEN a feature requires new handlers, THE System SHALL add them to the appropriate feature hook

### Requirement 5

**User Story:** As a developer, I want UI rendering logic separated into focused components, so that I can modify UI sections independently

#### Acceptance Criteria

1. THE System SHALL extract the library panel rendering into a dedicated `LibraryPanel` component
2. THE System SHALL extract the mobile layout into a dedicated `MobileLayout` component
3. THE System SHALL extract the desktop layout into a dedicated `DesktopLayout` component
4. THE System SHALL extract the sidebar into a dedicated `AppSidebar` component
5. WHEN any layout section is modified, THE System SHALL not require changes to other layout sections

### Requirement 6

**User Story:** As a developer, I want the LeftManagerDrawer component to be under 400 lines, so that it remains maintainable and testable

#### Acceptance Criteria

1. WHEN THE LeftManagerDrawer component is viewed, THE System SHALL contain fewer than 400 lines of code
2. THE System SHALL extract tab management logic into a dedicated hook
3. THE System SHALL extract each tab panel into a separate component
4. THE System SHALL extract shared drawer UI patterns into reusable components
5. THE System SHALL delegate data fetching and mutations to feature hooks

### Requirement 7

**User Story:** As a developer, I want store files to be under 500 lines, so that state management logic is focused and testable

#### Acceptance Criteria

1. WHEN any store file is viewed, THE System SHALL contain fewer than 500 lines of code
2. THE System SHALL split large stores into domain-specific store modules
3. THE System SHALL extract shared store utilities into separate utility files
4. THE System SHALL separate store actions from store state definitions
5. THE System SHALL ensure each store module manages a single domain

### Requirement 8

**User Story:** As a developer, I want consistent file organization, so that I can quickly locate related code

#### Acceptance Criteria

1. THE System SHALL organize code by feature in dedicated feature directories
2. WHEN a feature directory exists, THE System SHALL contain components, hooks, and utilities for that feature
3. THE System SHALL place shared utilities in a common utilities directory
4. THE System SHALL place shared UI components in a common components directory
5. THE System SHALL follow a consistent directory structure across all features

### Requirement 9

**User Story:** As a developer, I want to refactor without breaking existing functionality, so that the application remains stable during the refactor

#### Acceptance Criteria

1. THE System SHALL maintain all existing functionality during refactoring
2. THE System SHALL preserve all existing component interfaces and props
3. THE System SHALL maintain backward compatibility with existing code
4. WHEN refactoring is complete, THE System SHALL pass all existing tests
5. THE System SHALL not introduce new bugs or regressions

### Requirement 10

**User Story:** As a developer, I want clear boundaries between modules, so that I can understand dependencies and avoid circular imports

#### Acceptance Criteria

1. THE System SHALL ensure feature modules do not import from other feature modules
2. THE System SHALL ensure shared utilities do not import from features
3. THE System SHALL ensure components import only from their feature or shared modules
4. WHEN a circular dependency is detected, THE System SHALL refactor to remove it
5. THE System SHALL document module boundaries and import rules
