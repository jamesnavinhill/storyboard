# Requirements Document

## Introduction

This feature consolidates the component library structure to eliminate redundancy and establish clear organizational patterns. Currently, UI components are scattered across `src/ui` and `src/components/ui`, creating confusion about where components should live and leading to inconsistent import patterns. This consolidation will create a single, well-organized component structure that distinguishes between reusable UI primitives and feature-specific components.

## Glossary

- **UI Primitives**: Reusable, generic UI components that have no business logic or feature-specific dependencies (e.g., Badge, Select, ToggleButton)
- **Feature Components**: Components that contain business logic, state management, or are specific to application features (e.g., SceneCard, ProjectManager, StoryboardPanel)
- **Component Library**: The organized collection of all UI components in the application
- **Import Path**: The file path used to import a component (e.g., `@/ui/Badge` or `./ui/Select`)
- **Lucide Icons**: The icon library used throughout the application (lucide-react package)
- **Custom Icons**: Application-specific icon components defined in `src/ui/icons.tsx`

## Requirements

### Requirement 1

**User Story:** As a developer, I want a single, clear location for UI primitive components so that I know where to find and add reusable UI elements.

#### Acceptance Criteria

1. THE Component Library SHALL maintain all UI primitive components in the `src/ui` directory
2. THE Component Library SHALL NOT contain any UI primitive components in `src/components/ui`
3. WHEN a developer needs a reusable UI component, THE Component Library SHALL provide it from `src/ui` with the import path `@/ui/[ComponentName]`
4. THE Component Library SHALL organize UI primitives as individual files named after the component (e.g., `Badge.tsx`, `Select.tsx`)
5. THE Component Library SHALL maintain the existing Badge, ListCard, ToggleButton, and icons components in `src/ui`

### Requirement 2

**User Story:** As a developer, I want all feature-specific components in a dedicated location so that I can easily distinguish between reusable primitives and application-specific logic.

#### Acceptance Criteria

1. THE Component Library SHALL maintain all feature components directly in `src/components`
2. THE Component Library SHALL NOT nest feature components in subdirectories unless they are tightly coupled sub-components
3. WHEN a feature component needs a UI primitive, THE Component Library SHALL allow imports from `@/ui/[ComponentName]`
4. THE Component Library SHALL maintain existing feature components including SceneCard, ProjectManager, StoryboardPanel, and all other components currently in `src/components`
5. THE Component Library SHALL preserve all component functionality during reorganization

### Requirement 3

**User Story:** As a developer, I want consistent import patterns throughout the codebase so that I can quickly understand component dependencies.

#### Acceptance Criteria

1. WHEN importing a UI primitive, THE Component Library SHALL use the pattern `import { ComponentName } from "@/ui/ComponentName"`
2. WHEN importing a feature component, THE Component Library SHALL use the pattern `import { ComponentName } from "@/components/ComponentName"`
3. WHEN importing icons from lucide-react, THE Component Library SHALL use named imports (e.g., `import { Search, Grid3x3 } from "lucide-react"`)
4. WHEN importing custom icons, THE Component Library SHALL use the pattern `import { IconName } from "@/ui/icons"`
5. THE Component Library SHALL update all existing imports to follow these patterns

### Requirement 4

**User Story:** As a developer, I want the Select component moved to the correct location so that it follows the same pattern as other UI primitives.

#### Acceptance Criteria

1. THE Component Library SHALL move the Select component from `src/components/ui/Select.tsx` to `src/ui/Select.tsx`
2. THE Component Library SHALL update the import in SceneManageDrawer from `./ui/Select` to `@/ui/Select`
3. THE Component Library SHALL remove the empty `src/components/ui` directory after moving Select
4. THE Component Library SHALL preserve all Select component functionality and styling
5. THE Component Library SHALL maintain the Select component's TypeScript types and interfaces

### Requirement 5

**User Story:** As a developer, I want clear documentation of the component organization pattern so that future development follows the established structure.

#### Acceptance Criteria

1. THE Component Library SHALL provide inline comments in key files explaining the organizational pattern
2. THE Component Library SHALL ensure the `src/ui` directory contains only UI primitives with no feature-specific logic
3. THE Component Library SHALL ensure the `src/components` directory contains only feature components
4. THE Component Library SHALL maintain a flat structure in both directories to avoid unnecessary nesting
5. THE Component Library SHALL preserve all existing component exports and public APIs

### Requirement 6

**User Story:** As a developer, I want consistent file naming conventions across all components so that the codebase follows a predictable pattern.

#### Acceptance Criteria

1. THE Component Library SHALL use PascalCase for all component file names (e.g., `SceneCard.tsx`, `ProjectManager.tsx`)
2. THE Component Library SHALL remove unnecessary prefixes from file names (e.g., "Left", "Desktop") unless they distinguish between multiple variants
3. THE Component Library SHALL ensure file names match the primary exported component name
4. THE Component Library SHALL rename files that don't follow the standard naming convention
5. THE Component Library SHALL update all imports after renaming files to maintain functionality

### Requirement 7

**User Story:** As a developer, I want all components to continue working after reorganization so that the application remains functional.

#### Acceptance Criteria

1. WHEN the reorganization is complete, THE Component Library SHALL ensure all components render correctly
2. WHEN the reorganization is complete, THE Component Library SHALL ensure all component interactions function as before
3. WHEN the reorganization is complete, THE Component Library SHALL ensure no TypeScript compilation errors exist
4. WHEN the reorganization is complete, THE Component Library SHALL ensure all existing tests pass
5. THE Component Library SHALL verify that SceneManageDrawer correctly imports and uses both Select and Badge components
