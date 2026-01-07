# Post-Refactor Cleanup Requirements

## Introduction

Following the Gemini API Enhancement refactor, this specification addresses naming inconsistencies, unused components, and test organization issues that accumulated during development. The goal is production-grade code quality through systematic cleanup.

## Glossary

- **Type File**: TypeScript file containing type definitions and interfaces
- **Component**: React component file (.tsx)
- **Enhanced Component**: Component with additional features (workflows, file uploads, chat modes)
- **Test Directory**: Directory containing test files, named `__tests__`
- **Module Boundary**: Architectural constraint preventing cross-feature imports

## Requirements

### Requirement 1: Rename Type File

**User Story:** As a developer, I want type files named concisely, so that imports are clean and maintainable.

#### Acceptance Criteria

1. THE System SHALL rename `src/types/gemini-enhancement.ts` to `src/types/gemini.ts`
2. THE System SHALL update all 4 imports in store files
3. THE System SHALL verify TypeScript compilation succeeds
4. THE System SHALL verify no references to old filename remain

### Requirement 2: Rename ManagerDrawer Component

**User Story:** As a developer, I want component names that describe function not position, so that names remain accurate if layout changes.

#### Acceptance Criteria

1. THE System SHALL rename `LeftManagerDrawer` directory to `ManagerDrawer`
2. THE System SHALL rename `LeftManagerDrawer.tsx` to `ManagerDrawer.tsx`
3. THE System SHALL update component exports and type names
4. THE System SHALL update all imports in DesktopLayout and MobileLayout
5. THE System SHALL verify UI functionality remains unchanged

### Requirement 3: Verify ManagerDrawer Location

**User Story:** As a developer, I want to confirm component organization follows architectural patterns, so that structure is consistent.

#### Acceptance Criteria

1. THE System SHALL verify `ManagerDrawer` location in `features/layout/components` is appropriate
2. THE System SHALL document that location aligns with feature-first architecture
3. THE System SHALL confirm no relocation is needed

### Requirement 4: Investigate ChatPanel Components

**User Story:** As a developer, I want to understand the ChatPanel implementation, and if there is room for confusion about which component to use or modify, then we need to consider best options. if both are needed then rename enhance to a more logial name - like AgentChatPanel

#### Acceptance Criteria

1. THE System SHALL identify that EnhancedChatPanel has additional features (AgentDropdown, ChatModeDropdown, UploadDropzone, FileThumb, FilePurposeSelector)
2. THE System SHALL identify that EnhancedChatPanel is NOT currently used in the application
3. THE System SHALL identify that ChatPanel is the active implementation bc im lazy and ddint finish my previosu tasks
4. THE System SHALL determine whether EnhancedChatPanel features should be kept and the file renamed the match its purpose AgentChatPanel
5. THE System SHALL rename EnhancedChatPanel to AgentChatPanel (if thats what it is intened to be) and document integration plan

### Requirement 5: Evaluate Test Directory Consolidation

**User Story:** As a developer, I want to understand test organization options, so that I can decide on optimal structure.

#### Acceptance Criteria

1. THE System SHALL count actual test directories (currently 11 in src, 2 in server)
2. THE System SHALL analyze current feature-based organization
3. THE System SHALL evaluate consolidation to 1-2 directories
4. THE System SHALL document pros/cons of current vs consolidated structure
5. THE System SHALL recommend optimal approach based on feature-first architecture
6. IF consolidation recommended, THE System SHALL implement new structure

### Requirement 6: Document Test Failures

**User Story:** As a developer, I want to understand why tests are failing, so that I can make informed decisions about fixes.

#### Acceptance Criteria

1. THE System SHALL run full test suite and capture results
2. THE System SHALL categorize failures by root cause
3. THE System SHALL document which failures are due to incomplete mocks
4. THE System SHALL document which failures are due to API changes
5. THE System SHALL estimate fix effort for each category
6. THE System SHALL provide recommendations without implementing fixes

### Requirement 7: Documentation Updates

**User Story:** As a developer, I want documentation updates to be minimal and targeted, so that major documentation overhaul can happen later.

#### Acceptance Criteria

1. THE System SHALL NOT create new comprehensive documentation files
2. THE System SHALL update only files directly affected by cleanup
3. THE System SHALL keep all documentation changes concise
4. THE System SHALL defer major documentation work until after cleanup

### Requirement 8: Update Test Cleanup Tasks

**User Story:** As a developer, I want the test-cleanup spec updated to reflect actual completion status, so that project tracking is accurate.

#### Acceptance Criteria

1. THE System SHALL FINISH tasks 4 in test-cleanup tasks.md
2. THE System SHALL FINISH tasks 5 in test-cleanup tasks.md
3. THE System SHALL mark completed items as done
4. THE System SHALL document any remaining work
