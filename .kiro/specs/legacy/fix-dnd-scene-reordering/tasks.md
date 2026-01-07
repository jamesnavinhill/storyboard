# Implementation Plan: Fix Drag-and-Drop Scene Reordering

## Overview

This implementation plan breaks down the drag-and-drop fixes into discrete, testable tasks. Each task builds on previous work and can be verified independently. The plan prioritizes core functionality first, then adds polish and enhancements.

---

## Tasks

- [x] 1. Fix core DnD strategy and transform application

  - Replace `verticalListSortingStrategy` with `rectSortingStrategy` in `StoryboardPanel.tsx`
  - Remove manual transform `useEffect` from `DesktopSceneCard.tsx`
  - Apply transforms via inline styles in `DesktopSceneCard.tsx`
  - Update collision detection from `closestCenter` to `rectIntersection`
  - Verify basic drag-and-drop works correctly in grid layout
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 2. Add drag overlay for visual feedback

  - Create `SceneCardPreview.tsx` component for drag overlay
  - Add `activeId` state to `StoryboardPanel.tsx`
  - Implement `handleDragStart` to set active scene ID
  - Implement `handleDragCancel` to clear active scene ID
  - Add `DragOverlay` component to `StoryboardPanel.tsx` render
  - Update `handleDragEnd` to clear active ID after drop
  - Apply reduced opacity to original card during drag
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
- [x] 3. Stabilize grid layout with fixed breakpoints

- [x] 3. Stabilize grid layout with fixed breakpoints

  - Update `.storyboard-grid` CSS to use fixed column counts at breakpoints
  - Remove `auto-fill` and replace with explicit column counts
  - Add responsive breakpoints for 1, 2, 3, and 4 columns
  - Ensure scene cards maintain max-width constraint
  - Test grid stability during drag operations
  - Verify no layout shifts when dragging across columns
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 4. Filter sortable items to exclude stacked groups

  - Create `sortableSceneIds` computed value in `StoryboardPanel.tsx`
  - Filter `renderItems` to only include individual scene IDs
  - Update `SortableContext` items prop to use filtered IDs
  - Verify stacked groups are not draggable
  - Verify individual scenes remain draggable when groups are stacked
  - Test toggling groups between stacked and expanded states
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
-

- [x] 5. Improve drag handle UX and cursor states

  - Add `cursor-grab` class to drag handle button
  - Add `cursor-grabbing` class during active drag
  - Ensure drag handle only appears on hover (desktop)
  - Ensure drag handle always visible on touch devices
  - Update drag handle ARIA label for clarity
  - _Requirements: 3.5, 7.1_

- [x] 6. Implement keyboard drag accessibility

  - Verify `KeyboardSensor` is configured with `sortableKeyboardCoordinates`
  - Test arrow key navigation for reordering scenes
  - Test Space/Enter to activate keyboard drag mode
  - Test Escape to cancel drag operation
  - Add ARIA live region for drag announcements
  - Update announcements during keyboard drag operations
  --_Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 7. Handle drag state with scene card panels and filters

- [x] 7. Handle drag state with scene card panels and filters

  - Verify drag is disabled for a scene card when its edit panel is open
  - Verify drag is disabled for a scene card when its animate panel is open
  - Verify drag handles hidden on cards with panels open
  - Verify drag re-enabled when scene card panels close
  - Verify drag remains enabled when manager drawer is open
  - Test drag operations with active group filters
  - Test drag operations with active tag filters
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 8. Add error handling and recovery

  - Wrap `onReorderScenes` call in try-catch block
  - Display error toast if reorder API call fails
  - Verify scene order reverts on error
  - Test drag cancellation (ESC key)
  - Test drag outside storyboard area
  - Verify clean state recovery after errors
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
-

- [x] 9. Add performance optimizations

  - Memoize `sortableSceneIds` calculation
  - Memoize `renderItems` calculation
  - Add `React.memo` to `DesktopSceneCard` component
  - Add `React.memo` to `SceneCardPreview` component
  - Profile drag performance with 50+ scenes
  - Optimize re-renders during drag operations
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
-

- [x] 10. Write unit tests for DnD components



  - Test `rectSortingStrategy` is used in `StoryboardPanel`
  - Test transforms applied via inline styles in `DesktopSceneCard`
  - Test drag overlay renders during drag
  - Test drag overlay hides after drag ends
  - Test sortable items exclude stacked groups
  - Test drag disabled when panels open
  - _Requirements: All_
- [x] 11. Write integration tests for reordering




- [x] 11. Write integration tests for reordering

  - Test drag scene from position 1 to position 5
  - Test drag scene across columns
  - Test keyboard reordering with arrow keys
  - Test drag cancellation with ESC key
  - Test reorder with active filters
  - Test error recovery when API fails
  - _Requirements: All_

- [ ] 12. Perform manual testing and QA

  - Test basic drag operations in all browsers
  - Test responsive behavior at all breakpoints
  - Test keyboard accessibility with screen reader
  - Test rapid successive drag operations
  - Test drag with 100+ scenes (performance)
  - Test edge cases (single scene, empty grid, etc.)
  - _Requirements: All_

---

## Notes

- Tasks 1-4 are **critical** and must be completed for basic functionality
- Tasks 5-8 are **important** for production-ready UX
- Tasks 9-12 are **optional** but recommended for quality and maintainability
- Each task should be tested independently before moving to the next
- Commit after each completed task for easy rollback if needed
- Reference the audit report (`dnd-audit.md`) for technical details
- Reference requirements and design docs for acceptance criteria

---

## Estimated Timeline

- **Task 1**: 30-45 minutes (core fixes)
- **Task 2**: 30-45 minutes (drag overlay)
- **Task 3**: 20-30 minutes (grid CSS)
- **Task 4**: 20-30 minutes (filter sortable items)
- **Task 5**: 15-20 minutes (cursor states)
- **Task 6**: 30-45 minutes (keyboard accessibility)
- **Task 7**: 20-30 minutes (panel/filter handling)
- **Task 8**: 20-30 minutes (error handling)
- **Task 9**: 30-45 minutes (performance)
- **Task 10**: 1-2 hours (unit tests)
- **Task 11**: 1-2 hours (integration tests)
- **Task 12**: 1-2 hours (manual QA)

**Total Core (Tasks 1-8)**: ~3-4 hours  
**Total with Optional (Tasks 1-12)**: ~7-10 hours

---

## Success Criteria

After completing all tasks, the drag-and-drop feature should:

✅ Snap cleanly to grid positions without horizontal drift  
✅ Work correctly in multi-column layouts  
✅ Display professional drag overlay feedback  
✅ Maintain stable grid layout during drag operations  
✅ Support keyboard accessibility  
✅ Handle errors gracefully  
✅ Perform smoothly with 50+ scenes  
✅ Pass all unit and integration tests  
✅ Work across all major browsers  
✅ Be accessible to screen reader users
