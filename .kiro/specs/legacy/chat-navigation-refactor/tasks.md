# Implementation Plan

- [x] 1. Update ChatAgent type definition

  - Remove "guru" from ChatAgent type in `src/types.ts`
  - Update type to only include "generate" and "chat"
  - _Requirements: 1.4_
- [x] 2. Simplify ChatPanel header layout

- [x] 2. Simplify ChatPanel header layout

  - [x] 2.1 Remove agent buttons row from ChatPanel.tsx

    - Delete the entire agent buttons section (lines ~349-370)
    - Remove AGENT_OPTIONS constant (lines ~46-67)
    - _Requirements: 1.1, 5.4_
  
  - [ ] 2.2 Update header to single row layout
    - Remove `mb-2` class from header flex container
    - Ensure Agent and Chat dropdowns are left-aligned
    - _Requirements: 5.1, 5.2_
-

- [x] 3. Update upload zone logic

  - [x] 3.1 Change upload zone visibility condition

    - Replace `agent === "guru"` condition with Agent mode check
    - Use `selectedWorkflowId && projectId` or explicit mode prop
    - Ensure upload zone shows only in Agent mode with projectId
    - _Requirements: 3.1, 3.2_
  
  - [x] 3.2 Verify file thumbnail display in Agent mode

    - Ensure uploaded file thumbnails render correctly
    - Verify delete and purpose controls work
    - _Requirements: 3.3, 3.4, 3.5_
- [x] 4. Update placeholder text logic

- [x] 4. Update placeholder text logic

  - [x] 4.1 Replace AGENT_PLACEHOLDERS constant

    - Remove old AGENT_PLACEHOLDERS Record
    - Create getPlaceholder function that determines text based on mode and selected workflow
    - _Requirements: 2.5_
  
  - [ ] 4.2 Update composer to use new placeholder logic
    - Pass mode and selectedWorkflow to getPlaceholder
    - Display appropriate placeholder text
    - _Requirements: 2.5_

 [x] 5. Enhance AgentDropdown with collapsible categories

- [x] 5.1 Add category expansion state management
  - Add useState for expandedCategories Set
  - Initialize with first category expanded
  - _Requirements: 2.1, 2.2, 2.3_
  
- [x] 5.2 Implement category collapse/expand UI
  - Add click handlers for category headers
  - Display expand/collapse icons (▶/▼)
  - Toggle category visibility on click
  - _Requirements: 2.3_
  
- [x] 5.3 Update workflow rendering with nested structure
  - Group workflows by category
  - Render subtypes as nested items
  - Maintain selection highlighting
  - _Requirements: 2.4, 2.5, 6.3_

- [x] 6. Update dropdown behavior and styling

  - [x] 6.1 Ensure consistent dropdown close behavior

    - Verify click-outside closes dropdown
    - Verify selection closes dropdown
    - _Requirements: 6.1, 6.2_
  
  - [x] 6.2 Update dropdown trigger display

    - Show current selection in trigger button
    - Use consistent styling across dropdowns
    - _Requirements: 6.4, 6.5_

- [x] 7. Remove EnhancedChatPanel component

  - [x] 7.1 Delete EnhancedChatPanel.tsx file

    - Remove `src/features/chat/components/EnhancedChatPanel.tsx`
    - _Requirements: 4.3, 4.4_
  
  - [x] 7.2 Update component exports

    - Remove EnhancedChatPanel from `src/features/chat/components/index.ts`
    - Verify no broken imports
    - _Requirements: 4.3, 7.5_

- [x] 8. Update parent component integrations

  - [x] 8.1 Verify MobileLayout.tsx integration

    - Check ChatPanel usage and props
    - Test mode switching in mobile view
    - Verify responsive behavior
    - _Requirements: 5.5_
  
  - [x] 8.2 Verify DesktopLayout.tsx integration

    - Check ChatPanel usage and props
    - Test mode switching in desktop view
    - Verify layout behavior
    - _Requirements: 5.5_
-

- [x] 9. Verify and test complete implementation



  - [x] 9.1 Test navigation and mode switching

    - Verify Agent and Chat modes display correctly
    - Test switching between modes
    - Verify no "Gurus" option appears
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  

  - [ ] 9.2 Test workflow dropdown functionality
    - Verify categories are collapsible
    - Test category expansion/collapse
    - Verify workflow selection works
    - Verify nested subtypes display correctly
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  
  - [ ] 9.3 Test upload zone behavior
    - Verify upload zone shows in Agent mode with projectId
    - Verify upload zone hidden in Chat mode
    - Test file upload, thumbnail display, and controls

    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ] 9.4 Test header layout and styling
    - Verify single row header layout
    - Verify left-aligned mode dropdowns
    - Verify no agent buttons row
    - Test responsive behavior on mobile and desktop
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
