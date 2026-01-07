# Implementation Plan

- [x] 1. Move Select component to UI primitives

  - Move `src/components/ui/Select.tsx` to `src/ui/Select.tsx`
  - Update import in `src/components/SceneManageDrawer.tsx` from `./ui/Select` to `@/ui/Select`
  - Delete empty `src/components/ui/` directory
  - Verify TypeScript compilation succeeds
  - _Requirements: 1.1, 1.3, 4.1, 4.2, 4.3, 4.4, 4.5_
- [x] 2. Migrate storyboard feature components

- [x] 2. Migrate storyboard feature components

  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 2.1 Move and rename DesktopSceneCard to SceneCard

  - Move `src/components/DesktopSceneCard.tsx` to `src/features/storyboard/components/SceneCard.tsx`
  - Update component export: `export const DesktopSceneCard` → `export const SceneCard`
  - Update displayName: `DesktopSceneCard.displayName = "DesktopSceneCard"` → `SceneCard.displayName = "SceneCard"`
  - Update internal component name: `DesktopSceneCardComponent` → `SceneCardComponent`
  - Update interface name: `DesktopSceneCardProps` → `SceneCardProps`
  - Check if duplicate `src/components/SceneCard.tsx` exists and delete it if it's a duplicate
  - _Requirements: 2.1, 2.2, 2.3, 6.1, 6.2, 6.3_

- [x] 2.2 Move remaining storyboard card components

  - Move `src/components/GhostSceneCard.tsx` to `src/features/storyboard/components/GhostSceneCard.tsx`
  - Move `src/components/SceneCardPreview.tsx` to `src/features/storyboard/components/SceneCardPreview.tsx`
  - Move `src/components/StackedGroupCard.tsx` to `src/features/storyboard/components/StackedGroupCard.tsx`
  - Update imports within these files to use `@/ui/`, `@/components/`, and relative paths for same-feature components
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2.3 Move storyboard panel and edit components

  - Move `src/components/StoryboardPanel.tsx` to `src/features/storyboard/components/StoryboardPanel.tsx`
  - Move `src/components/SceneEditPanel.tsx` to `src/features/storyboard/components/SceneEditPanel.tsx`
  - Move `src/components/SceneAnimatePanel.tsx` to `src/features/storyboard/components/SceneAnimatePanel.tsx`
  - Move `src/components/StylePresetPicker.tsx` to `src/features/storyboard/components/StylePresetPicker.tsx`
  - Update imports in StoryboardPanel to reference SceneCard, GhostSceneCard, StackedGroupCard, SceneCardPreview from relative paths
  - Update imports in SceneCard to reference SceneEditPanel and SceneAnimatePanel from relative paths
  - Update all imports to use `@/ui/`, `@/components/`, and `@/types/` for external dependencies
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2_

- [x] 2.4 Move storyboard test files

  - Move `src/components/__tests__/DesktopSceneCard.test.tsx` to `src/features/storyboard/components/__tests__/SceneCard.test.tsx`
  - Move `src/components/__tests__/StoryboardPanel.drag.test.tsx` to `src/features/storyboard/components/__tests__/StoryboardPanel.drag.test.tsx`
  - Update test imports to reference `../SceneCard` instead of `../DesktopSceneCard`
  - Update test imports to use `@/features/storyboard/components/` for absolute imports
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2.5 Update external imports of storyboard components

  - Search for all files importing from `@/components/DesktopSceneCard`, `@/components/StoryboardPanel`, etc.
  - Update imports to `@/features/storyboard/components/SceneCard`, `@/features/storyboard/components/StoryboardPanel`, etc.
  - Verify TypeScript compilation succeeds
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.5, 7.1, 7.2, 7.3_
- [x] 3. Migrate scene management feature components

- [x] 3. Migrate scene management feature components

  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3.1 Move scene drawer and panel components

  - Move `src/components/SceneManageDrawer.tsx` to `src/features/scene/components/SceneManageDrawer.tsx`
  - Move `src/components/SceneHistoryPanel.tsx` to `src/features/scene/components/SceneHistoryPanel.tsx`
  - Update imports to use `@/ui/Select`, `@/ui/Badge`, `@/components/Loader`, etc.
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2_

- [x] 3.2 Move scene manager components

  - Move `src/components/SceneGroupManager.tsx` to `src/features/scene/components/SceneGroupManager.tsx`
  - Move `src/components/SceneTagManager.tsx` to `src/features/scene/components/SceneTagManager.tsx`
  - Update imports to use relative paths for GroupBadge and TagBadge (will be in same feature)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3.3 Move badge components

  - Move `src/components/GroupBadge.tsx` to `src/features/scene/components/GroupBadge.tsx`
  - Move `src/components/TagBadge.tsx` to `src/features/scene/components/TagBadge.tsx`
  - Update imports within these files if needed
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3.4 Move scene management test files

  - Move `src/components/__tests__/SceneGroupManager.test.tsx` to `src/features/scene/components/__tests__/SceneGroupManager.test.tsx`
  - Move `src/components/__tests__/SceneManageDrawer.collapse.test.tsx` to `src/features/scene/components/__tests__/SceneManageDrawer.collapse.test.tsx`
  - Update test imports to use relative paths and `@/features/scene/components/` for absolute imports
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3.5 Update external imports of scene management components

  - Search for all files importing GroupBadge, TagBadge, SceneManageDrawer, etc. from `@/components/`
  - Update imports to `@/features/scene/components/`
  - Verify TypeScript compilation succeeds
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.5, 7.1, 7.2, 7.3_

- [x] 4. Migrate library feature components

  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4.1 Move library manager components

  - Move `src/components/ProjectManager.tsx` to `src/features/library/components/ProjectManager.tsx`
  - Move `src/components/AssetManager.tsx` to `src/features/library/components/AssetManager.tsx`
  - Move `src/components/AssetCard.tsx` to `src/features/library/components/AssetCard.tsx`
  - Move `src/components/LibraryControls.tsx` to `src/features/library/components/LibraryControls.tsx`
  - Update imports to use `@/ui/`, `@/components/`, `@/hooks/`, `@/types/`, and relative paths for same-feature components
  - Verify no naming conflicts with existing library components (LibraryPanel, ProjectsTab, AssetsTab, etc.)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2_

- [x] 4.2 Move library test files

  - Move `src/components/__tests__/AssetManager.test.tsx` to `src/features/library/components/__tests__/AssetManager.test.tsx`
  - Move `src/components/__tests__/ProjectManager.test.tsx` to `src/features/library/components/__tests__/ProjectManager.test.tsx`
  - Update test imports to use relative paths and `@/features/library/components/` for absolute imports
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4.3 Update external imports of library components

  - Search for all files importing ProjectManager, AssetManager, etc. from `@/components/`
  - Update imports to `@/features/library/components/`
  - Verify TypeScript compilation succeeds
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.5, 7.1, 7.2, 7.3_

- [x] 5. Migrate chat, settings, and layout feature components

  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 5.1 Move chat panel component

  - Move `src/components/ChatPanel.tsx` to `src/features/chat/components/ChatPanel.tsx`
  - Update imports to use `@/ui/`, `@/components/`, `@/hooks/`, `@/types/`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2_

- [x] 5.2 Move settings panel component

  - Move `src/components/SettingsPanel.tsx` to `src/features/settings/components/SettingsPanel.tsx`
  - Update imports to use `@/ui/`, `@/components/`, `@/types/`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2_

- [x] 5.3 Move left manager drawer component

  - Move entire `src/components/LeftManagerDrawer/` directory to `src/features/layout/components/LeftManagerDrawer/`
  - Update imports in LeftManagerDrawer files to use `@/ui/`, `@/components/`, `@/types/`
  - Verify all subdirectories (hooks/, tabs/) are moved correctly
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2_

- [x] 5.4 Update external imports of chat, settings, and layout components

  - Search for all files importing ChatPanel, SettingsPanel, LeftManagerDrawer from `@/components/`
  - Update imports to `@/features/chat/components/`, `@/features/settings/components/`, `@/features/layout/components/`
  - Verify TypeScript compilation succeeds
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.5, 7.1, 7.2, 7.3_

- [x] 6. Final cleanup and verification

  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 6.1 Clean up empty directories

  - Verify `src/components/` only contains `Loader.tsx` and `toast/` directory
  - Delete empty `src/components/__tests__/` directory if it exists
  - Delete empty `src/components/ui/` directory if it exists
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 6.2 Run full TypeScript compilation check

  - Execute `npm run typecheck`
  - Fix any remaining import errors
  - Verify no TypeScript errors exist
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 6.3 Run all tests

  - Execute `npm run test`
  - Fix any failing tests
  - Verify all tests pass
  - _Requirements: 7.1, 7.2, 7.4_

- [x] 6.4 Verify component functionality

  - Manually test storyboard panel (scene cards, drag-drop, edit, generate, animate, export)
  - Manually test scene manager drawer (history, groups, tags, selects)
  - Manually test library (projects tab, assets tab, search, import, rename, delete)
  - Manually test chat panel
  - Manually test settings panel
  - Manually test left manager drawer (open/close, tabs)
  - Verify no console errors in browser
  - _Requirements: 7.1, 7.2, 7.5_

- [x] 6.5 Document the new structure

  - Add inline comments in key files explaining the organizational pattern
  - Verify feature README files are up to date
  - Ensure `src/features/README.md` accurately reflects the new structure
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
