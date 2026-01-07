# Implementation Plan

- [x] 1. Extract Layout Feature Module

  - Create the layout feature directory structure with hooks, components, and utilities for managing resizable panels
  - Extract all layout-related constants from `config/layout.ts` to `features/layout/utils/layoutConstants.ts`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 8.1, 8.2, 8.4, 8.5_

- [x] 1.1 Create layout dimension management hook

  - Write `useLayoutDimensions` hook to manage sidebar, chat, and scene manager widths
  - Extract dimension loading logic from AppShell into this hook
  - _Requirements: 2.1, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 1.2 Create collapsible panel management hook

  - Write `useCollapsiblePanels` hook to manage collapse states for all panels
  - Extract collapse/expand logic from AppShell into this hook
  - _Requirements: 2.2, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 1.3 Create resizable panel hook

  - Write `useResizablePanel` hook with resize handlers and pointer event logic
  - Extract all resize calculation logic from AppShell
  - _Requirements: 2.1, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 1.4 Create layout persistence hook

  - Write `useLayoutPersistence` hook to sync layout state with localStorage
  - Extract all localStorage operations from AppShell
  - _Requirements: 2.3, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 1.5 Create main layout hook

  - Write `useLayout` hook that composes all layout sub-hooks
  - Provide unified interface for layout state and actions
  - _Requirements: 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 1.6 Create reusable layout components

  - Write `ResizablePanel`, `PanelResizer`, and `CollapsiblePanel` components
  - Extract common layout UI patterns from AppShell
  - _Requirements: 2.1, 5.1, 5.2, 5.3, 5.4, 5.5, 8.4_

- [x] 1.7 Update AppShell to use layout feature

  - Replace inline layout logic with `useLayout` hook
  - Verify resize, collapse, and persistence work correctly
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 2. Extract Scene Management Hooks

  - Create scene feature hooks directory and extract scene-related event handlers
  - Group scene operations by responsibility (CRUD, history, manager state)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 8.1, 8.2, 8.5_

- [x] 2.1 Create scene actions hook

  - Write `useSceneActions` hook with all scene CRUD operations
  - Extract scene update, duplicate, create, export handlers from AppShell
  - Extract group/tag assignment handlers from AppShell
  - _Requirements: 4.1, 4.2, 4.5, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 2.2 Create scene history hook

  - Write `useSceneHistory` hook to manage history loading and restoration
  - Extract history state and handlers from AppShell
  - _Requirements: 4.1, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 2.3 Create scene manager hook

  - Write `useSceneManager` hook to manage drawer state and scene selection
  - Extract scene manager state (selected scene, tabs, etc.) from AppShell
  - Compose `useSceneHistory` within this hook
  - _Requirements: 4.1, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 2.4 Update AppShell to use scene hooks

  - Replace inline scene handlers with `useSceneActions` and `useSceneManager`
  - Verify all scene operations work correctly
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 3. Extract Project Actions Hook

  - Create project actions hook to group project-related handlers
  - Extract project CRUD operations from AppShell
  - _Requirements: 4.2, 4.5, 8.1, 8.2, 8.5_

- [x] 3.1 Create project actions hook

  - Write `useProjectActions` hook with project CRUD operations
  - Extract project create, rename, delete, export, import handlers from AppShell
  - _Requirements: 4.2, 4.5, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3.2 Update AppShell to use project actions

  - Replace inline project handlers with `useProjectActions`
  - Verify all project operations work correctly
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 4. Extract Library Feature

  - Create library feature components and hooks
  - Extract library panel rendering and state management from AppShell
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 8.1, 8.2, 8.4, 8.5_

- [x] 4.1 Create library state hook

  - Write `useLibraryState` hook to manage library UI state (tabs, search, view mode)
  - Extract library state management from AppShell
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
-

- [x] 4.2 Create library panel component

  - Write `LibraryPanel` component with toolbar and tab rendering
  - Extract `renderLibraryPanel` function from AppShell into this component
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 8.4_
-

- [x] 4.3 Create library sub-components

  - Write `LibraryToolbar`, `ProjectsTab`, and `AssetsTab` components
  - Extract inline library UI from AppShell
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 8.4_

- [x] 4.4 Update AppShell to use library components

  - Replace inline library rendering with `LibraryPanel` component
  - Verify library functionality works correctly
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 9.1, 9.2, 9.3, 9.4, 9.5_
- [x] 5. Create Mobile and Desktop Layout Components

- [x] 5. Create Mobile and Desktop Layout Components

  - Extract mobile and desktop layout rendering into separate components
  - Separate responsive layout concerns from AppShell
  - _Requirements: 5.2, 5.3, 5.4, 5.5, 8.1, 8.2, 8.4, 8.5_

- [x] 5.1 Create mobile layout component

  - Write `MobileLayout` component with mobile-specific rendering
  - Extract mobile layout JSX from AppShell
  - _Requirements: 5.2, 5.3, 5.4, 5.5, 8.4_

- [x] 5.2 Create desktop layout component

  - Write `DesktopLayout` component with desktop-specific rendering
  - Extract desktop layout JSX from AppShell
  - _Requirements: 5.3, 5.4, 5.5, 8.4_

- [-] 5.3 Create app sidebar component

  - Write `AppSidebar` component for desktop sidebar
  - Extract sidebar rendering from AppShell
  - _Requirements: 5.4, 5.5, 8.4_

- [x] 5.4 Update AppShell to use layout components

  - Replace inline layout rendering with `MobileLayout` and `DesktopLayout`
  - Verify both mobile and desktop layouts work correctly
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 9.1, 9.2, 9.3, 9.4, 9.5_
-

- [x] 6. Create App Shell State Orchestration Hook

  - Create main orchestration hook that composes all feature hooks
  - Provide unified state interface to AppShell
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 6.1 Create session overrides hook

  - Write `useSessionOverrides` hook for session-only settings
  - Extract session override state from AppShell
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 6.2 Create toast bridge utility

  - Write `useToastBridge` hook to bridge store toasts to UI
  - Extract toast bridging logic from AppShell
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 6.3 Create app shell state hook

  - Write `useAppShellState` hook that composes all feature hooks
  - Orchestrate project, layout, scene, library, chat, media, and UI state
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 6.4 Update AppShell to use orchestration hook

  - Replace all individual hooks with single `useAppShellState` call
  - Verify all features work together correctly
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 7. Refactor LeftManagerDrawer Component

  - Split LeftManagerDrawer into focused tab components
  - Extract tab management into dedicated hook
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 8.1, 8.2, 8.4, 8.5_

- [x] 7.1 Create drawer tabs hook

  - Write `useDrawerTabs` hook to manage tab state and persistence
  - Extract tab state management from LeftManagerDrawer
  - _Requirements: 6.2, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 7.2 Create drawer tab components

  - Write `LibraryTab`, `DetailsTab`, `GroupsTagsTab`, and `HistoryTab` components
  - Extract tab rendering from LeftManagerDrawer
  - _Requirements: 6.3, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 7.3 Update LeftManagerDrawer to use new structure

  - Replace inline tab rendering with tab components
  - Use `useDrawerTabs` hook for state management
  - Verify drawer functionality works correctly
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 8. Split Project Store into Domain Slices

  - Decompose large project store into focused domain slices
  - Create composable store architecture
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.5_

- [x] 8.1 Create scene store slice

  - Write `createSceneSlice` with scene-specific operations
  - Extract scene logic from main project store
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 8.2 Create group store slice
  - Write `createGroupSlice` with group-specific operations
  - Extract group logic from main project store
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 8.3 Create tag store slice

  - Write `createTagSlice` with tag-specific operations
  - Extract tag logic from main project store
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 8.4 Create chat store slice

  - Write `createChatSlice` with chat-specific operations
  - Extract chat logic from main project store
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 8.5 Create store utilities module

  - Write shared store utilities in `storeUtils.ts`
  - Extract common store patterns and helpers
  - _Requirements: 7.2, 7.3, 7.4, 7.5_

- [x] 8.6 Compose store slices in main store

  - Update main project store to compose all slices
  - Verify all store operations work correctly
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 9. Split Server Project Store

  - Apply same store splitting pattern to server-side store
  - Maintain consistency between client and server store architecture
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.5_

- [x] 9.1 Create server scene store slice

  - Write server-side scene store slice
  - Extract scene logic from server project store
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 9.2 Create server group store slice

  - Write server-side group store slice
  - Extract group logic from server project store
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 9.3 Create server tag store slice

  - Write server-side tag store slice
  - Extract tag logic from server project store
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 9.4 Create server store utilities

  - Write shared server store utilities
  - Extract common server store patterns
  - _Requirements: 7.2, 7.3, 7.4, 7.5_

- [x] 9.5 Compose server store slices

  - Update server project store to compose all slices
  - Verify all server store operations work correctly
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 10. Verify Module Boundaries and Dependencies

  - Audit all imports to ensure clean module boundaries
  - Document module architecture and import rules
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 10.1 Audit feature module imports

  - Check that features don't import from other features
  - Refactor any cross-feature imports to use shared modules
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 10.2 Audit shared module imports

  - Check that shared utilities don't import from features
  - Ensure clean dependency flow
  - _Requirements: 10.2, 10.3, 10.4_

- [x] 10.3 Check for circular dependencies

  - Run dependency analysis to detect circular imports
  - Refactor any circular dependencies found
  - _Requirements: 10.4, 10.5_

- [x] 10.4 Document module architecture

  - Write architecture documentation in README files
  - Document import rules and module boundaries
  - _Requirements: 10.5, 8.1, 8.2, 8.3, 8.4, 8.5_

- [-] 11. Final Verification and Cleanup

  - Verify all file size targets are met
  - Run full test suite and fix any issues
  - _Requirements: 1.1, 6.1, 7.1, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 11.1 Verify file size targets

  - Check that AppShell.tsx is under 300 lines
  - Check that LeftManagerDrawer/index.tsx is under 400 lines
  - Check that all hooks are under 200 lines
  - Check that all store files are under 500 lines
  - _Requirements: 1.1, 3.1, 6.1, 7.1_

- [x] 11.2 Run full test suite
  - Run all existing tests and verify they pass
  - Fix any test failures introduced by refactoring
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 11.3 Remove unused code
  - Delete any dead code or unused imports
  - Clean up temporary files and comments
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 11.4 Update documentation
  - Update component documentation to reflect new structure
  - Add JSDoc comments to new hooks and components
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
