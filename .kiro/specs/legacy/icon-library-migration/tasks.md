# Implementation Plan

- [x] 1. Install lucide-react dependency

  - Add lucide-react to package.json dependencies
  - Run package manager install command
  - Verify installation in node_modules
  - _Requirements: 1.1_

- [x] 2. Replace icon imports in AppShell.tsx



  - Update all icon imports from custom components to lucide-react
  - Map custom icon names to lucide-react equivalents (SparklesIcon → Sparkles, ArchiveBoxArrowDownIcon → ArchiveRestore, etc.)
  - Update icon component usages in JSX to use new names
  - _Requirements: 2.1, 2.2, 2.3, 3.2_
- [x] 3. Replace icon imports in SceneManageDrawer.tsx




- [ ] 3. Replace icon imports in SceneManageDrawer.tsx

  - Update all icon imports from custom components to lucide-react
  - Map custom icon names to lucide-react equivalents (XIcon → X, PhotoIcon → Image, etc.)
  - Update icon component usages in JSX
- [x] 4. Replace icon imports in ProjectManager.tsx




- [ ] 4. Replace icon imports in ProjectManager.tsx

- [ ] 4. Replace icon imports in ProjectManager.tsx

  - Update all icon imports from custom components to lucide-react
  - Map custom icon names to lucide-react equivalents (MagnifyingGlassIcon → Search, GridIcon → Grid3x3, etc.)
  - Update icon component usages in JSX
  - _Requirements: 2.1, 2.2, 2.3, 3.2_
-

- [x] 5. Replace icon imports in SceneCard.tsx




  - Update all icon imports from custom components to lucide-react
  - Map custom icon names to lucide-react equivalents (RefreshIcon → RefreshCw, DownloadIcon → Download, etc.)
  - Update icon component usages in JSX
  - _Requirements: 2.1, 2.2, 2.3, 3.2_
-

- [x] 6. Replace icon imports in ChatPanel.tsx




  - Update all icon imports from custom components to lucide-react
  - Map custom icon names to lucide-react equivalents (SendIcon → Send, PaperclipIcon → Paperclip, etc.)
  - Update icon component usages in JSX
  - _Requirements: 2.1, 2.2, 2.3, 3.2_

- [x] 7. Replace icon imports in remaining component files




  - Update StoryboardPanel.tsx icon imports and usages
  - Update SceneHistoryPanel.tsx icon imports and usages
  - Update SceneCardPreview.tsx icon imports and usages
  - Update LibraryControls.tsx icon imports and usages
  - Update LeftManagerDrawer.tsx icon imports and usages
  - Update GhostSceneCard.tsx icon imports and usages
  - _Requirements: 2.1, 2.2, 2.3, 3.2_

- [x] 8. Handle inline icon definitions





  - Search for inline icon component definitions (ChevronDoubleLeftIcon, PlusIcon in GhostSceneCard)
  - Replace with lucide-react imports where applicable
  - Remove inline SVG definitions
  - _Requirements: 2.1, 2.2, 4.3_
- [x] 9. Remove custom icon component files




- [ ] 9. Remove custom icon component files

  - Delete all 25 icon component files from src/components/icons/ directory
  - Verify no remaining imports reference deleted files
  - Remove the icons directory if empty
  - _Requirements: 1.2, 2.4_
- [x] 10. Verify build and type checking





- [ ] 10. Verify build and type checking

  - Run TypeScript type checking to ensure no errors
  - Run build process to verify successful compilation
  - Check for any console warnings or errors
  - _Requirements: 2.4, 4.4_

- [ ] 11. Perform visual regression testing
  - Open application in browser
  - Navigate through all major UI sections (app shell, scene drawer, project manager, chat panel)
  - Verify all icons render with correct appearance and sizing
  - Test icon interactions (hover states, click handlers)
  - _Requirements: 3.1, 3.2, 3.3_
