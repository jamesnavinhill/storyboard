# Implementation Plan

- [x] 1. Create shared utilities for persistence and autosave
  - [ ] 1.1 Create localStorage utility with safe access helpers
    - Write `src/utils/localStorage.ts` with `safeGet`, `safeSet`, and `safeRemove` functions
    - Add error handling for quota exceeded and unavailable scenarios
    - Add TypeScript types for storage keys
    - _Requirements: 2.1, 2.2, 2.5, 2.6_

  - [ ] 1.2 Create debounce utility for autosave
    - Write `src/utils/debounce.ts` with configurable delay
    - Support immediate execution option
    - Add cleanup on unmount
    - _Requirements: 2.1, 2.2, 8.1, 8.4, 11.2_

  - [ ] 1.3 Create reusable autosave hook
    - Write `src/hooks/useAutosave.ts` with debounced save logic
    - Track saving state, last saved time, and errors
    - Support force save on demand
    - Prevent save on initial load (only after edits)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 2. Implement default layout configuration
  - [ ] 2.1 Update layout initialization with proper defaults
    - Modify `src/features/layout/hooks/useLayout.ts` to set default values
    - Set sidebar width to 280px, not collapsed
    - Set chat width to 400px (30% of 1920px), not collapsed
    - Set scene manager to collapsed by default
    - Ensure defaults only apply when no persisted values exist
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 2.2 Set default chat agent and view modes
    - Modify `src/features/app-shell/hooks/useAppShellState.ts` initialization
    - Set `chatAgent` default to "generate" (Agent Mode)
    - Set `currentView` default to "storyboard" (Storyboard View)
    - Ensure defaults only apply on first load
    - _Requirements: 1.4, 1.5_

- [x] 3. Implement UI state persistence
  - [ ] 3.1 Add persistence for chat agent selection
    - Update `useAppShellState.ts` to persist `chatAgent` to localStorage
    - Load persisted value on initialization
    - Use storage key `vb:ui:chatAgent`
    - Add 500ms debounce to prevent excessive writes
    - _Requirements: 2.3, 2.6_

  - [ ] 3.2 Add persistence for current view
    - Update `useAppShellState.ts` to persist `currentView` to localStorage
    - Load persisted value on initialization
    - Use storage key `vb:ui:currentView`
    - Add 500ms debounce to prevent excessive writes
    - _Requirements: 2.4, 2.6_

  - [ ] 3.3 Add persistence for aspect ratio
    - Update `useAppShellState.ts` to persist `aspectRatio` to localStorage
    - Load persisted value on initialization
    - Use storage key `vb:ui:aspectRatio`
    - Add 500ms debounce to prevent excessive writes
    - _Requirements: 2.6_

  - [ ] 3.4 Verify layout state persistence
    - Confirm `useLayoutPersistence.ts` persists panel dimensions within 500ms
    - Confirm collapse states persist within 500ms
    - Verify all layout state restores on app reload
    - _Requirements: 2.1, 2.2, 2.5_

- [x] 4. Implement global settings persistence
  - [ ] 4.1 Add localStorage persistence to settings store
    - Modify `src/features/settings/state/settingsStore.ts` to persist to localStorage
    - Use storage key `vb:settings:global`
    - Persist changes within 500ms of modification
    - Load persisted settings on store initialization
    - _Requirements: 3.1, 3.2_

  - [ ] 4.2 Fix settings panel styling conflicts
    - Review `src/features/settings/components/EnhancedSettingsSheet.tsx` for style conflicts
    - Ensure model settings display without overlapping styles
    - Ensure app settings display without overlapping styles
    - Test all settings tabs render correctly
    - _Requirements: 3.3, 3.4_

  - [ ] 4.3 Ensure settings include all required fields
    - Verify settings store includes model selection (chat, image, video)
    - Verify settings store includes temperature and other AI parameters
    - Verify settings store includes app preferences (autoplay, resolution, duration)
    - _Requirements: 3.5_

- [x] 5. Implement session settings override system
  - [ ] 5.1 Enhance session override hook
    - Review `src/features/app-shell/hooks/useSessionOverrides.ts`
    - Ensure overrides are stored in component state (not localStorage)
    - Add clear overrides function
    - Add hasOverrides computed property
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6_

  - [ ] 5.2 Implement settings priority resolution
    - Update effective settings calculation in `useAppShellState.ts`
    - Ensure priority: session overrides > global settings > defaults
    - Verify session overrides apply correctly in all panels
    - _Requirements: 4.5_

  - [ ] 5.3 Add visual indicators for active overrides
    - Add UI indicators in settings panels when session overrides are active
    - Show badge or highlight on overridden settings
    - Add "Reset to Global" button for overridden settings
    - _Requirements: 4.5_

- [x] 6. Implement project context menu
  - [ ] 6.1 Create project context menu component
    - Create `src/features/library/components/ProjectContextMenu.tsx`
    - Add hover state detection for project items
    - Display three-dot icon on hover, hide when not hovering
    - Implement dropdown menu with "Manage" and "Delete" options
    - Match styling of scene card context menus
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 6.2 Wire up context menu actions
    - Connect "Manage" option to open project manager modal
    - Connect "Delete" option to trigger deletion confirmation
    - Update `ProjectsTab.tsx` to include context menu for each project
    - _Requirements: 5.5_

- [x] 7. Implement project deletion confirmation


  - [x] 7.1 Create deletion confirmation dialog

    - Create `src/features/project/components/DeleteProjectDialog.tsx`
    - Display warning message about permanent data loss
    - Show project name in dialog
    - Include "Delete" and "Cancel" buttons
    - Use modal pattern to block other interactions
    - _Requirements: 6.1, 6.2, 6.3, 6.5_

  - [x] 7.2 Wire up deletion flow

    - Update `useProjectActions.ts` to show confirmation before deletion
    - Only proceed with deletion after explicit confirmation
    - Close dialog on cancel without making changes
    - Show success toast after successful deletion
    - Handle deletion errors gracefully
    - _Requirements: 6.4, 6.5_

- [x] 8. Implement project manager modal



  - [x] 8.1 Create project manager modal component


    - Create `src/features/library/components/ProjectManagerModal.tsx`
    - Support "create" and "edit" modes
    - Include optional name field
    - Include optional description field
    - Include optional image upload field with preview
    - Match styling of existing modals (export modal)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 8.2 Implement autosave for project metadata


    - Integrate `useAutosave` hook in project manager modal
    - Wait for user inactivity before triggering autosave
    - Save pending changes when modal closes
    - Don't trigger autosave on initial modal open
    - Show visual feedback during save (spinner or "Saving..." text)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 8.3 Wire up project manager modal


    - Connect "New Project" button to open modal in create mode
    - Connect context menu "Manage" to open modal in edit mode
    - Update `useProjectActions.ts` to handle modal open/close
    - Pass project data to modal in edit mode


    - _Requirements: 7.1, 7.2_

- [x] 9. Convert gallery controls to icon-only


  - [x] 9.1 Update storyboard toolbar to icon-only


    - Modify `src/features/storyboard/components/StoryboardToolbar.tsx`
    - Remove text labels from all buttons
    - Keep only icons visible (20-24px size)
    - Add `aria-label` attributes for accessibility
    - Add tooltips on hover to indicate function
    - _Requirements: 9.1, 9.4, 9.5_

  - [x] 9.2 Update gallery toolbar to icon-only


    - Modify gallery view toolbar component
    - Remove text labels from all buttons
    - Keep only icons visible
    - Add `aria-label` attributes for accessibility
    - Add tooltips on hover
    - _Requirements: 9.2, 9.4, 9.5_

  - [x] 9.3 Update document view toolbar to icon-only


    - Modify document view toolbar component
    - Remove text labels from all buttons
    - Keep only icons visible
    - Add `aria-label` attributes for accessibility
    - Add tooltips on hover
    - _Requirements: 9.3, 9.4, 9.5_

- [x] 10. Implement document view editor




  - [x] 10.1 Create document view component


    - Create `src/features/storyboard/components/DocumentView.tsx`
    - Display text editor interface
    - Show all scene prompts in editable format
    - Show style information in editable format
    - Show project metadata in editable format
    - Support standard text editing operations (copy, paste, undo)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.7_

  - [x] 10.2 Wire up document view data updates


    - Connect editor changes to update scene data
    - Connect editor changes to update project metadata
    - Parse edited content and update correct records
    - Replace unpopulated collapsible sections for style and metadata
    - _Requirements: 10.5, 10.6_

  - [x] 10.3 Implement document view autosave


    - Integrate `useAutosave` hook in document view
    - Set 2-second inactivity delay before triggering save
    - Don't trigger autosave on initial render
    - Save pending changes when navigating away from document view
    - Show visual indicator during save operation
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 10.4 Add document view to navigation


    - Update view switcher to include document view option
    - Ensure document view is accessible from main navigation
    - Persist document view selection to localStorage
    - _Requirements: 10.1_

- [x] 11. Write integration tests *Check if test already exist before creating_



  - [x] 11.1 Test layout initialization and persistence


    - Write tests for default layout values on first load
    - Write tests for layout state restoration from localStorage
    - Write tests for invalid persisted values falling back to defaults
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.5_

  - [x] 11.2 Test UI state persistence


    - Write tests for chat agent persistence
    - Write tests for current view persistence
    - Write tests for aspect ratio persistence
    - Write tests for debouncing behavior
    - _Requirements: 2.3, 2.4, 2.6_

  - [x] 11.3 Test settings management


    - Write tests for global settings persistence
    - Write tests for session overrides not persisting
    - Write tests for settings priority resolution
    - _Requirements: 3.1, 3.2, 4.1, 4.5, 4.6_

  - [x] 11.4 Test autosave behavior


    - Write tests for autosave triggering after inactivity
    - Write tests for autosave on navigation away
    - Write tests for no autosave on initial load
    - Write tests for autosave error handling
    - _Requirements: 8.1, 8.2, 8.3, 11.1, 11.2, 11.3_

  - [x] 11.5 Test project management flows


    - Write tests for project context menu appearance
    - Write tests for deletion confirmation dialog
    - Write tests for project manager modal in create/edit modes
    - _Requirements: 5.1, 5.2, 5.5, 6.1, 6.4, 7.1, 7.2_

  - [x] 11.6 Test document view


    - Write tests for document content display
    - Write tests for edits updating underlying data
    - Write tests for document autosave
    - _Requirements: 10.2, 10.3, 10.4, 10.5, 11.2, 11.3_

- [x] 12. Apply hidden scrollbar styling to key interface areas






  - [x] 12.1 Create hide-scrollbar utility class

    - Add `.hide-scrollbar` class to `src/styles/utilities.css`
    - Include browser-specific rules for Chrome, Firefox, Safari, Edge, and IE11
    - Test cross-browser compatibility
    - _Requirements: 12.6_

  - [x] 12.2 Apply hidden scrollbar to DocumentView


    - Add `hide-scrollbar` class to the scrollable content area in `DocumentView.tsx`
    - Verify scroll functionality remains intact
    - Test with keyboard navigation (arrow keys, Page Up/Down)
    - _Requirements: 12.1_

  - [x] 12.3 Apply hidden scrollbar to ChatInputArea


    - Add `hide-scrollbar` class to the textarea composer in `ChatInputArea.tsx`
    - Verify auto-resize behavior still works correctly
    - Test with various content lengths
    - _Requirements: 12.2_

  - [x] 12.4 Apply hidden scrollbar to edit/animate/extend panels *still showing in edit panel from the scenecard context menu edit modal -others are hidden as requested







    - Identify scrollable areas in edit, animate, and extend modal components
    - Add `hide-scrollbar` class to scrollable content areas
    - Verify scroll functionality in all three panel types
    - _Requirements: 12.3, 12.4, 12.5_
