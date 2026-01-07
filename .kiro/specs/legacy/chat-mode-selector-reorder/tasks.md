# Implementation Plan

- [x] 1. Reorder chat mode options in ChatModeDropdown





  - Update the `CHAT_MODE_OPTIONS` array in `src/features/chat/components/ChatModeDropdown.tsx` to place Agent Mode as the first option
  - Move the "agent" mode object from fourth position to first position in the array
  - Verify all other options (simple, concept, style) maintain their relative order
  - _Requirements: 1.3_



- [x] 2. Swap selector order in ChatPanel top row

  - Locate the top row controls section in `src/features/chat/components/ChatPanel.tsx` (around line 460-470)
  - Swap the JSX order so `<ChatModeDropdown>` renders before `<AgentDropdown>`
  - Ensure the `gap-2` spacing class remains on the parent container


  - Verify no other changes are made to props or surrounding code
  - _Requirements: 1.1, 1.2, 1.4_

- [x] 3. Verify functionality and visual appearance



  - Test that Chat Mode Selector appears first (left-most) in the top row
  - Test that Workflow Selector appears second (right of Chat Mode Selector)
  - Test that Agent Mode appears as the first option in the Chat Mode dropdown menu
  - Test that selecting a workflow still auto-switches to Agent Mode
  - Test that clearing a workflow still auto-switches to Simple Chat
  - Test responsive behavior on mobile viewports
  - Test keyboard navigation follows the new visual order
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_
