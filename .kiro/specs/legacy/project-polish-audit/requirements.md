# Requirements Document

## Introduction

This document outlines the requirements for a comprehensive project polish phase focused on code quality, documentation consolidation, accessibility improvements, and preparation for the major API/model reconfiguration phase. The goal is to ensure all previous work is complete, remove technical debt, and establish a solid foundation for upcoming production-grade enhancements.

## Glossary

- **System**: The VibeBoard AI Music Video Storyboarder application
- **Feature Module**: Self-contained functionality organized under `src/features/`
- **Legacy Code**: Outdated or redundant code from previous implementations
- **Technical Debt**: Code quality issues that need addressing before major refactors
- **Accessibility**: ARIA attributes and semantic HTML for screen readers and assistive technologies
- **Module Boundary**: Import/export rules preventing circular dependencies between features

## Requirements

### Requirement 1: Code Quality and Type Safety

**User Story:** As a developer, I want the codebase to have zero TypeScript errors and follow strict typing rules, so that I can catch bugs early and maintain code quality.

#### Acceptance Criteria

1. WHEN the developer runs `npm run typecheck`, THE System SHALL complete with zero TypeScript errors
2. WHEN the developer runs `npm run typecheck:server`, THE System SHALL complete with zero TypeScript errors
3. THE System SHALL enable the `strict` compiler option in `tsconfig.json` to enforce strict type checking
4. THE System SHALL enable the `forceConsistentCasingInFileNames` compiler option to prevent cross-platform issues
5. THE System SHALL fix the existing type errors in `src/features/project/state/sceneStore.ts` related to `_services` and `activeProjectId` properties

### Requirement 2: Documentation Consolidation

**User Story:** As a developer, I want clear, up-to-date documentation that reflects the current state of the project, so that I can understand the architecture and make informed decisions.

#### Acceptance Criteria

1. THE System SHALL consolidate all phase completion logs from `docs/_legacy/` into a single historical reference document
2. THE System SHALL update `README.md` to reflect the current project status including Phase 7 completion
3. THE System SHALL update `docs/CONFIGURATION.md` to document all environment variables and configuration options currently in use
4. THE System SHALL create or update documentation for the AI telemetry and rate limiting features implemented in Phase 7
5. THE System SHALL remove or archive outdated documentation that no longer reflects current implementation
6. THE System SHALL ensure `plan.md` accurately reflects completed phases and remaining work

### Requirement 3: Accessibility Compliance

**User Story:** As a user with assistive technology, I want all interactive elements to have proper ARIA attributes and semantic HTML, so that I can navigate and use the application effectively.

#### Acceptance Criteria

1. THE System SHALL add appropriate ARIA labels to all buttons without visible text labels
2. THE System SHALL add ARIA roles to custom interactive components that don't use semantic HTML
3. THE System SHALL ensure all form inputs have associated labels or ARIA-labelledby attributes
4. THE System SHALL add ARIA-live regions for dynamic content updates like toast notifications
5. THE System SHALL ensure keyboard navigation works for all interactive elements
6. THE System SHALL add skip-to-content links for screen reader users

### Requirement 4: Style and CSS Cleanup

**User Story:** As a developer, I want consistent styling without inline styles or redundant CSS, so that the UI is maintainable and follows best practices.

#### Acceptance Criteria

1. THE System SHALL identify and remove all inline style attributes from TSX components
2. THE System SHALL consolidate duplicate CSS classes into reusable utility classes
3. THE System SHALL ensure all styling uses the established design system (border radius, colors, spacing)
4. THE System SHALL implement the planned radius system (< 0.3 for UI elements, 0.04-0.05 for images/scenes)
5. THE System SHALL unify icon styling to remove box borders and use color hover/active states

### Requirement 5: Legacy Code Removal

**User Story:** As a developer, I want all redundant and legacy code removed, so that the codebase is clean and maintainable.

#### Acceptance Criteria

1. THE System SHALL verify that old modal components (SceneGroupManager, SceneTagManager, SceneManageDrawer, LibraryControls) are completely removed
2. THE System SHALL remove any unused imports or dead code identified by static analysis
3. THE System SHALL remove commented-out code blocks that are no longer relevant
4. THE System SHALL verify no console.log statements remain in production code
5. THE System SHALL remove any temporary workarounds or TODO comments that have been addressed

### Requirement 6: Module Boundary Verification

**User Story:** As a developer, I want to ensure module boundaries are respected, so that the codebase remains maintainable and free of circular dependencies.

#### Acceptance Criteria

1. WHEN the developer runs `npx madge --circular --extensions ts,tsx src/`, THE System SHALL report zero circular dependencies
2. WHEN the developer runs `npx madge --circular --extensions ts,tsx server/`, THE System SHALL report zero circular dependencies
3. THE System SHALL verify that no feature modules import from other feature modules (except app-shell)
4. THE System SHALL verify that shared modules do not import from feature modules
5. THE System SHALL document any intentional exceptions to module boundary rules

### Requirement 7: API and Model Configuration Preparation

**User Story:** As a developer, I want a clear understanding of the current API implementation and gaps, so that I can plan the upcoming model reconfiguration phase.

#### Acceptance Criteria

1. THE System SHALL document all current Gemini API endpoints and their parameters
2. THE System SHALL identify gaps between current implementation and official Gemini API documentation
3. THE System SHALL document known issues with video models (ratio/parameter support)
4. THE System SHALL document known issues with Imagen 4 Fast and Imagen 3
5. THE System SHALL create a prioritized list of API improvements needed for production readiness
6. THE System SHALL document current workflow implementations and identify areas for enhancement

### Requirement 8: Testing Coverage Assessment

**User Story:** As a developer, I want to understand current testing coverage and gaps, so that I can ensure critical functionality is tested.

#### Acceptance Criteria

1. THE System SHALL document which API endpoints have smoke tests
2. THE System SHALL identify critical user flows that lack test coverage
3. THE System SHALL document which components have unit tests
4. THE System SHALL create a prioritized list of testing gaps to address
5. THE System SHALL verify that existing tests pass with `npm run test:api`

### Requirement 9: Build and Deployment Verification

**User Story:** As a developer, I want to ensure the application builds successfully and is ready for deployment, so that there are no surprises during production deployment.

#### Acceptance Criteria

1. WHEN the developer runs `npm run build:all`, THE System SHALL complete successfully without errors
2. THE System SHALL verify that all environment variables are documented in `.env.example`
3. THE System SHALL verify that the production build does not expose sensitive information
4. THE System SHALL verify that the Vite configuration does not inject API keys into the client bundle
5. THE System SHALL document the deployment process and requirements

### Requirement 10: Phase 4 Feature Verification

**User Story:** As a developer, I want to verify that all Phase 4 features are properly implemented and working, so that I can confirm the project management and asset management functionality is complete.

#### Acceptance Criteria

1. THE System SHALL verify that project management features (create, rename, delete, export, import) are accessible and functional through the LibraryPanel
2. THE System SHALL verify that asset management features (view, search, filter, manage) are accessible and functional through the LibraryPanel
3. THE System SHALL verify that drag-and-drop scene reordering is implemented in the StoryboardPanel
4. THE System SHALL verify that scene grouping and tagging UI components are integrated and functional
5. THE System SHALL verify that scene history viewing and restoration is accessible through the scene management interface
6. THE System SHALL document any Phase 4 features that are incomplete or need enhancement
