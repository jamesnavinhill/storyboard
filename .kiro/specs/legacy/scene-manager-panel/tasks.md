# Implementation Plan

- [x] 1. Add scene manager panel state management to App.tsx

  - Add state variables for scene manager width and collapse state
  - Add state variables for center panel collapse states (chat, storyboard)
  - Update LAYOUT_STORAGE_KEYS constant with new keys
  - Add constants for scene manager dimensions (min, max, collapsed width)
  - Add refs for scene manager width tracking
  - Initialize default collapsed state for scene manager (true)
  - _Requirements: 1.5, 3.1, 3.2, 5.1, 5.2_

- [x] 2. Implement scene manager panel layout structure

  - [x] 2.1 Add scene manager panel to desktop layout JSX

    - Insert scene manager panel as fourth column after storyboard
    - Add resizer handle between storyboard and scene manager
    - Apply conditional rendering based on mobile/desktop layout
    - Use existing `panel-chat` class for styling consistency
    - _Requirements: 1.1, 1.4, 6.2_
  
  - [x] 2.2 Update SceneManageDrawer component for panel variant

    - Add `isCollapsed` and `onToggleCollapse` props to interface
    - Update Container component to handle collapsed panel state
    - Add collapsed state rendering with 72px width and expand button
    - Remove close button when in panel mode and expanded
    - Reuse existing `bg-card` class for collapsed state
    - Reuse existing `btn-base btn-ghost` classes for collapse toggle
    - _Requirements: 1.1, 2.6, 7.3, 7.4, 7.5_
  
  - [x] 2.3 Wire scene manager panel to App.tsx state

    - Pass scene manager state props to SceneManageDrawer
    - Connect collapse toggle handler
    - Ensure panel variant is used for desktop, drawer for mobile
    - _Requirements: 1.4, 6.1, 6.2_

- [x] 3. Implement scene manager resize and collapse logic

  - [x] 3.1 Add scene manager resize handler

    - Create `handleSceneManagerResize` function with collapse threshold detection
    - Implement snap-to-collapsed when dragging within 40px of collapsed width
    - Add width constraints (320px-600px) for expanded state
    - Invert delta calculation for right-side panel (drag left = expand)
    - _Requirements: 2.2, 2.3, 2.5, 2.7_
  
  - [x] 3.2 Update startResize function for scene manager

    - Add "sceneManager" as a valid resize target
    - Add check to prevent resize when scene manager is collapsed
    - Add scene manager case to switch statement in onMove handler
    - Update onUp handler to persist scene manager width
    - _Requirements: 2.1, 2.7_
  
  - [x] 3.3 Implement expansion from collapsed state

    - Add `handleExpandFromCollapsed` function for scene manager
    - Restore last used width when expanding from collapsed
    - Update collapse toggle handler to call expansion function
    - _Requirements: 2.4, 5.5_
  
  - [x] 3.4 Add center panel collapse logic

    - Create `handleChatResize` with collapse threshold (40px from zero)
    - Create `handleStoryboardResize` with collapse threshold
    - Implement collapsed state rendering (divider only with resizer handle)
    - Add expansion handlers for center panels
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 4. Update layout space calculation for four panels

  - [x] 4.1 Create calculateAvailableSpace function

    - Calculate occupied space for left sidebar (collapsed or expanded)
    - Calculate occupied space for scene manager (collapsed or expanded)
    - Calculate resizer space (3 resizers for 4 panels)
    - Return available center space for chat and storyboard
    - _Requirements: 9.1, 9.2_
  
  - [x] 4.2 Update ensureLayoutWithinBounds function

    - Use calculateAvailableSpace to determine center panel space
    - Ensure chat and storyboard fit within available center space
    - Prioritize storyboard minimum width (480px) when space is tight
    - Handle collapsed panel states in calculations
    - _Requirements: 9.3, 9.4, 9.5_
  
  - [x] 4.3 Add CSS custom properties for scene manager

    - Add `--layout-scene-manager-width` variable
    - Add `--layout-scene-manager-collapsed-width` variable
    - Update useEffect to set CSS properties when scene manager width changes
    - _Requirements: 1.1, 2.6_

- [x] 5. Implement auto-expand on scene selection

  - [x] 5.1 Update openSceneManager function

    - Add check for isSceneManagerCollapsed state
    - Auto-expand scene manager when collapsed and scene is selected
    - Preserve existing tab and sub-tab navigation logic
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [x] 5.2 Verify all scene selection entry points

    - Test opening from storyboard scene card menus
    - Test opening from library sidebar asset list
    - Test opening from asset manager
    - Ensure all entry points call openSceneManager correctly
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 6. Implement state persistence for scene manager

  - [x] 6.1 Add localStorage persistence for scene manager width

    - Save scene manager width on resize end
    - Load scene manager width on app initialization
    - Use loadStoredDimension helper with proper constraints
    - _Requirements: 5.1, 5.3, 5.4, 5.5_
  
  - [x] 6.2 Add localStorage persistence for collapse states

    - Save scene manager collapsed state when toggled
    - Save center panel collapsed states when toggled
    - Load all collapse states on app initialization
    - Default scene manager to collapsed (true) on first load
    - _Requirements: 3.4, 3.5, 5.2, 8.5_

- [x] 7. Update mobile layout to preserve drawer behavior

  - [x] 7.1 Ensure mobile breakpoint detection works correctly

    - Verify isMobileLayout state updates on window resize
    - Test switching between mobile and desktop at 1024px breakpoint
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [x] 7.2 Preserve drawer variant for mobile

    - Ensure SceneManageDrawer uses "drawer" variant when isMobileLayout is true
    - Maintain close button and overlay behavior in mobile mode
    - Preserve Escape key handler in mobile mode
    - _Requirements: 6.4, 6.5_
-

- [x] 8. Polish and finalize layout behavior

  - [x] 8.1 Set default collapsed states

    - Ensure left sidebar defaults to collapsed on first load
    - Ensure scene manager defaults to collapsed on first load
    - Ensure center panels default to expanded on first load
    - _Requirements: 1.5, 3.1, 3.2_
  
  - [x] 8.2 Add resizer handle styling

    - Verify resizer handles match existing style
    - Ensure handles are visible and accessible
    - Test drag interactions for all resizers
    - _Requirements: 2.1, 8.3_
  
  - [x] 8.3 Test responsive layout behavior

    - Test layout with various window sizes
    - Test all combinations of collapsed/expanded panels
    - Verify minimum width constraints are enforced
    - Test layout recalculation on window resize
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [x] 8.4 Verify no style regressions

    - Confirm scene manager uses existing `panel-chat` class
    - Confirm collapsed state uses existing `bg-card` class
    - Confirm buttons use existing `btn-base btn-ghost` classes
    - Verify no new colors or backgrounds were added
    - Run visual regression tests if available
    - _Requirements: All (style preservation)_
