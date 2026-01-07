# Implementation Plan

- [x] 1. Implement collapsible groups in GroupsInlineManager

  - Add local state to track expanded groups using Set<string>
  - Modify group rendering to show collapsible header with chevron icon
  - Display group name, color indicator, and scene count in header
  - Show scene assignment checkboxes only when expanded
  - Add "Done" button at bottom of expanded section to collapse
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Implement collapsible tags in TagsInlineManager

  - Add local state to track expanded tags using Set<string>
  - Modify tag rendering to show collapsible header with chevron icon
  - Display tag name, color indicator, and scene count in header
  - Show scene assignment checkboxes only when expanded
  - Add "Done" button at bottom of expanded section to collapse
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 3. Add "Done" button functionality to managers

  - Implement Done button click handler to collapse section
  - Ensure checkbox changes persist immediately (no pending state needed)
  - Style Done button consistently with existing button patterns
  - Position Done button at bottom of scene assignment list
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4. Add badge display to SceneCard details panel

  - Compute visible badges from scene's assigned groups and tags
  - Render badges in details overlay, top-right aligned
  - Limit display to first 3 badges (groups first, then tags)
  - Add "+N" counter badge when more than 3 total assignments
  - Use existing GroupBadge and TagBadge components
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5. Add badge display to Manager Panel details tab

  - Add "Groups & Tags" section below description textarea
  - Render group badges followed by tag badges
  - Use flex-wrap layout to handle multiple badges
  - Wire up onRemove handlers to existing remove functions
  - Ensure badges use consistent styling with scene card badges
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6. Enhance description textarea auto-sizing in Manager Panel

  - Verify existing autoSizeDescription function handles all cases
  - Remove max-height constraint to allow full content display
  - Ensure textarea expands naturally without scrollbars per site standards
  - Ensure hide-scrollbar class is applied to textarea
  - Test with various description lengths (short, medium, long)
  - Maintain smooth transitions without layout jumps
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 7. Add accessibility attributes to collapsible sections

  - Add aria-expanded to collapsible headers
  - Add aria-controls linking header to content region
  - Add role="region" to collapsible content areas
  - Add aria-label to "+N" counter badge
  - Ensure keyboard navigation works (Enter/Space to toggle)
  - _Requirements: 1.1, 1.2, 1.3, 3.4_

- [x] 8. Style and polish collapsible managers

  - Add chevron icons (ChevronRight/ChevronDown) from lucide-react
  - Add smooth collapse/expand transitions (200ms ease)
  - Style collapsed header to be clickable (hover states)
  - Ensure color indicators are visible in collapsed state
  - Test responsive behavior on mobile and tablet
  - _Requirements: 1.5, 2.1_

- [x] 9. Implement badge counter tooltip

  - Add tooltip component or use title attribute for "+N" badge
  - Display list of remaining group and tag names on hover
  - Format tooltip content clearly (e.g., "Groups: X, Y; Tags: A, B")
  - Ensure tooltip positioning works in scene card context
  - _Requirements: 3.4_

- [ ] 10. Refine badge layout spacing in SceneCard details panel









  - Reduce gap between badge container and description text from gap-3 to gap-2
  - Ensure items-start alignment is maintained for top positioning
  - Add max-w-[40%] constraint to badge container to prevent excessive width
  - Test layout with various badge combinations (0, 1, 2, 3+ badges)
  - Verify description text maintains full width without wrapping changes
  - Account for group badge being slightly larger than tag badges
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
- [x] 11. Fix Manager Panel description textarea scrollbar






- [ ] 11. Fix Manager Panel description textarea scrollbar


  - Remove max-height constraint from description textarea
  - Verify hide-scrollbar class is properly applied
  - Ensure autoSizeDescription function expands textarea to fit all content
  - Test with short, medium, and very long descriptions
  - Confirm no scrollbar appears regardless of content length
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 12. Update tag selection to remain expanded during multi-selection





  - Verify tag section does NOT collapse when checkboxes are toggled
  - Ensure only "Done" button or header click collapses tag section
  - Test assigning multiple scenes to a tag without reopening
  - Confirm group manager maintains current single-selection behavior
  - Document behavior difference between groups (auto-collapse) and tags (stay open)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 13. Write component tests for collapsible managers
  - Test GroupsInlineManager collapse/expand behavior
  - Test TagsInlineManager collapse/expand behavior
  - Test "Done" button functionality
  - Test scene count display accuracy
  - Test color indicator rendering
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2_

- [ ]* 14. Write component tests for badge display
  - Test SceneCard badge rendering with groups and tags
  - Test "+N" counter logic (shows when > 3 badges)
  - Test badge limit (max 3 visible)
  - Test Manager Panel badge display
  - Test badge removal in Manager Panel
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4_

- [ ]* 15. Write integration tests for manager workflow
  - Test full workflow: expand → assign → done → verify persistence
  - Test badge updates after assignment changes
  - Test manager state after scene selection changes
  - Test multiple groups/tags assignment flow
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 4.1_

- [ ]* 16. Write tests for layout refinements
  - Test SceneCard badge spacing with various badge counts
  - Test description text layout consistency
  - Test Manager Panel textarea auto-sizing without scrollbar
  - Verify no layout shifts when badges are added/removed
  - _Requirements: 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 6.5_
