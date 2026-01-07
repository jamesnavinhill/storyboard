# Post-Refactor Cleanup Requirements

## Introduction

This specification defines cleanup tasks following the Gemini API Enhancement refactor. The codebase has accumulated naming inconsistencies, redundant files, and organizational issues that need to be addressed to maintain code quality and developer experience.

## Glossary

- **Type File**: TypeScript file containing type definitions and interfaces
- **Component**: React component file
- **Test Directory**: Directory containing test files, conventionally named `__tests__`
- **Module Boundary**: Architectural constraint preventing cross-feature imports
- **Drawer Component**: UI component that slides in from the side of the screen

## Requirements

### Requirement 1: Remove Enhancement Suffix from Type Files

**User Story:** As a developer, I want type files named concisely without unnecessary suffixes, so that imports are clean and maintainable.

#### Acceptance Criteria

1. THE System SHALL rename `src/types/gemini-enhancement.ts` to `src/types/gemini.ts`
2. THE System SHALL update all imports from `gemini-enhancement` to `gemini`
3. THE System SHALL verify no references to the old filename remain in the codebase

### Requirement 2: Remove Positional Prefix from ManagerDrawer

**User Story:** As a developer, I want component names that describe function not position, so that names remain accurate if layout changes.

#### Acceptance Criteria

1. THE System SHALL rename `LeftManagerDrawer` directory to `ManagerDrawer`
2. THE System SHALL rename `LeftManagerDrawer.tsx` to `ManagerDrawer.tsx`
3. THE System SHALL update all imports and references to use `ManagerDrawer`
4. THE System SHALL verify component functionality remains unchanged

### Requirement 3: Verify ManagerDrawer Location

**User Story:** As a developer, I want components organized according to architectural patterns, so that the codebase structure is consistent.

#### Acceptance Criteria

1. THE System SHALL verify `ManagerDrawer` location in `features/layout/components` aligns with project structure
2. THE System SHALL document rationale if location is appropriate
3. THE System SHALL recommend relocation if location violates module boundaries

### Requirement 4: Consolidate ChatPanel Files

**User Story:** As a developer, I want a single ChatPanel component in use, so that there is no confusion about which file to modify.

#### Acceptance Criteria

1. THE System SHALL identify which ChatPanel file is actively used in the application. ChatPanel or EnhancedChatPanel.
2. THE System SHALL remove or archive the unused ChatPanel file and normalize the name
3. THE System SHALL verify all imports reference the correct ChatPanel
4. THE System SHALL document the purpose of the active ChatPanel

### Requirement 5: Understand Test Failures

**User Story:** As a developer, I want to understand why tests are failing, so that I can make informed decisions about fixes.

#### Acceptance Criteria

1. THE System SHALL analyze current test failures and identify root causes
2. THE System SHALL document which failures are due to incomplete mocks
3. THE System SHALL document which failures are due to API changes
4. THE System SHALL document which failures require breaking changes to fix
5. THE System SHALL provide recommendations for each failure category

### Requirement 6: Consolidate Test Directories

**User Story:** As a developer, I want test files organized in minimal directories, so that test structure is simple and discoverable.

#### Acceptance Criteria

1. THE System SHALL analyze current test directory structure
2. THE System SHALL evaluate feasibility of consolidating to 1-2 test directories
3. THE System SHALL document benefits and drawbacks of consolidation
4. THE System SHALL recommend optimal test organization strategy
5. IF consolidation is feasible, THE System SHALL implement the new structure

### Requirement 7: Maintain Lean Documentation

**User Story:** As a developer, I want documentation that is focused and relevant, so that I can find information quickly.

#### Acceptance Criteria

1. THE System SHALL avoid creating new comprehensive documentation files
2. THE System SHALL update existing documentation only when necessary
3. THE System SHALL keep documentation changes minimal and targeted
4. THE System SHALL defer major documentation overhaul until after cleanup

### Requirement 8: Update Gemini Enhancement Tasks

**User Story:** As a developer, I want the enhancement spec tasks to reflect cleanup completion, so that project status is accurate.

#### Acceptance Criteria

1. THE System SHALL update task 4 in test-cleanup tasks.md
2. THE System SHALL update task 5 in test-cleanup tasks.md
3. THE System SHALL mark completed cleanup tasks as done
4. THE System SHALL document any remaining work items
