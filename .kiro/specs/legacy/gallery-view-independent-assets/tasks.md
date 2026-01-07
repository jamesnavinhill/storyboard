# Implementation Plan

- [x] 1. Audit current prop flow and identify the issue






- [x] 1.1 Read DesktopLayout component to trace activeProjectId prop source

  - Verify where activeProjectId comes from in props
  - Check if it's correctly sourced from appState.project.activeProjectId
  - Document any intermediate prop transformations
  - _Requirements: 1.3, 2.3_


- [x] 1.2 Read AppSidebar component to understand sidebar navigation behavior

  - Check if sidebar maintains separate selection state
  - Verify sidebar doesn't modify app-level activeProjectId
  - Identify any event handlers that might affect project selection
  - _Requirements: 2.2, 2.4_


- [x] 1.3 Test current behavior to confirm the issue

  - Open gallery view and note which project's assets are shown
  - Navigate in sidebar and observe if gallery content changes
  - Document the incorrect behavior
  - _Requirements: 1.1, 1.2_

- [x] 2. Fix prop flow to ensure gallery uses app-level activeProjectId





- [x] 2.1 Update DesktopLayout to pass correct activeProjectId to gallery LibraryPanel


  - Ensure the LibraryPanel with variant="full" receives activeProjectId from props
  - Verify props come from appState.project.activeProjectId
  - Add comments documenting the correct prop source
  - _Requirements: 2.1, 2.3_

- [x] 2.2 Verify AppSidebar passes activeProjectId correctly to sidebar LibraryPanel


  - Ensure sidebar LibraryPanel receives activeProjectId for display purposes only
  - Confirm sidebar navigation doesn't trigger project selection
  - Add comments clarifying sidebar vs gallery behavior
  - _Requirements: 2.2, 2.4_


- [x] 2.3 Verify LibraryPanel correctly passes projectId to AssetsTab

  - Confirm AssetsTab receives projectId from LibraryPanel's activeProjectId prop
  - Ensure no intermediate state transformations
  - Verify prop flow is direct and unmodified
  - _Requirements: 1.4, 3.1_

- [x] 2.4 Verify AssetsTab correctly passes projectId to AssetManager


  - Confirm AssetManager receives projectId from AssetsTab
  - Ensure AssetManager's useEffect triggers on projectId changes
  - Verify no additional filtering or transformation
  - _Requirements: 3.1, 3.2_

-

- [x] 3. Verify the fix and test all scenarios




- [x] 3.1 Test gallery view shows active project assets

  - Open gallery view (assets tab in full library panel)
  - Verify assets from active project are displayed
  - Check asset count matches project's actual assets
  - _Requirements: 1.1, 3.1_


- [x] 3.2 Test sidebar navigation doesn't affect gallery

  - With gallery view open, navigate in sidebar
  - Click different projects in sidebar collapsible list
  - Verify gallery content remains unchanged
  - Confirm only active project assets are shown
  - _Requirements: 1.2, 2.4_



- [x] 3.3 Test actual project selection updates gallery

  - Select a different project via onSelectProject
  - Verify gallery view updates to show new project's assets
  - Confirm asset reload occurs
  - Check that correct project's assets are displayed
  - _Requirements: 1.3, 3.2_




- [ ] 3.4 Test edge cases
  - Test with no active project (null activeProjectId)
  - Test switching between projects with different asset counts
  - Test with empty projects (no assets)
  - Verify empty states display correctly
  - _Requirements: 3.3, 3.4_
