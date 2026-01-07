# Design Document

## Overview

This design reorganizes the chat panel's top row controls by swapping the order of the Chat Mode Selector and Workflow Selector. The change is purely presentational and does not affect the underlying functionality of either component. The Chat Mode Selector will be positioned first (left-most), followed by the Workflow Selector, providing a more intuitive user flow where users first choose their interaction mode before selecting specific workflows.

## Architecture

### Component Hierarchy

```
ChatPanel
├── Top Row Controls (border-b container)
│   ├── ChatModeDropdown (first position)
│   └── AgentDropdown (second position)
├── Chat History Area
└── Input Composer
```

### Current Implementation

The current implementation in `ChatPanel.tsx` (lines ~460-470) renders the controls as:

```tsx
<div className="flex items-center gap-2">
  <AgentDropdown {...props} />
  <ChatModeDropdown {...props} />
</div>
```

### Proposed Implementation

The new implementation will simply swap the order:

```tsx
<div className="flex items-center gap-2">
  <ChatModeDropdown {...props} />
  <AgentDropdown {...props} />
</div>
```

## Components and Interfaces

### ChatModeDropdown Component

**Location:** `src/features/chat/components/ChatModeDropdown.tsx`

**Current Behavior:**
- Displays a dropdown with 4 chat modes: Simple Chat, Concept Development, Style Exploration, Agent Mode
- Shows selected mode with icon and label (label hidden on mobile)
- Provides descriptions for each mode in the dropdown menu
- Highlights selected mode with primary color

**Required Changes:**
- Reorder the `CHAT_MODE_OPTIONS` array to place Agent Mode first
- No other changes required

**Updated Options Order:**
```typescript
const CHAT_MODE_OPTIONS: ChatModeOption[] = [
  {
    key: "agent",
    label: "Agent Mode",
    description: "Workflow-based generation with file uploads",
    icon: Workflow,
  },
  {
    key: "simple",
    label: "Simple Chat",
    description: "General conversation and brainstorming",
    icon: MessageCircle,
  },
  {
    key: "concept",
    label: "Concept Development",
    description: "Develop and refine your video concept",
    icon: Lightbulb,
  },
  {
    key: "style",
    label: "Style Exploration",
    description: "Explore visual styles and aesthetics",
    icon: Palette,
  },
];
```

### AgentDropdown Component

**Location:** `src/features/chat/components/AgentDropdown.tsx`

**Current Behavior:**
- Displays workflow selection with category grouping
- Shows selected workflow and subtype in button label
- Fetches workflows and subtypes from API
- Provides "Manage Workflows" option at bottom

**Required Changes:**
- None - component remains functionally identical

### ChatPanel Component

**Location:** `src/features/chat/components/ChatPanel.tsx`

**Current Behavior:**
- Renders both dropdowns in top row
- Manages state for both chat mode and workflow selection
- Auto-switches chat mode when workflow is selected
- Auto-switches to chat view on mobile when mode changes

**Required Changes:**
- Swap the order of `<ChatModeDropdown>` and `<AgentDropdown>` in JSX
- No state management or logic changes required

## Data Models

No data model changes required. All existing interfaces and types remain unchanged:

- `ChatMode` type: `"simple" | "concept" | "style" | "agent"`
- `Workflow` interface: unchanged
- `WorkflowSubtype` interface: unchanged
- Component props: unchanged

## Error Handling

No new error handling required. Existing error handling for workflow fetching and selection remains in place.

## Testing Strategy

### Manual Testing

1. **Visual Verification**
   - Verify Chat Mode Selector appears first (left-most) in top row
   - Verify Workflow Selector appears second (right of Chat Mode Selector)
   - Verify spacing and alignment between selectors is consistent
   - Test on desktop and mobile viewports

2. **Functional Testing**
   - Verify Chat Mode Selector opens and closes correctly
   - Verify Agent Mode appears as first option in dropdown
   - Verify Workflow Selector opens and closes correctly
   - Verify workflow selection still auto-switches to Agent Mode
   - Verify clearing workflow still auto-switches to Simple Chat
   - Verify mobile view switching still works when mode changes

3. **Interaction Testing**
   - Click Chat Mode Selector → select different modes → verify behavior
   - Click Workflow Selector → select workflow → verify Agent Mode activates
   - Select workflow with subtype → verify display text updates
   - Click "Manage Workflows" → verify settings panel opens

### Automated Testing

Update existing test file `src/features/chat/components/__tests__/ChatPanel.test.tsx`:

1. **Rendering Tests**
   - Verify Chat Mode Selector renders before Workflow Selector in DOM order
   - Verify both selectors are present and visible

2. **Interaction Tests**
   - Verify mode selection updates state correctly
   - Verify workflow selection triggers mode change
   - Verify mobile view switching on mode change

## Implementation Notes

### CSS Considerations

- No CSS changes required
- Existing `gap-2` spacing between selectors is maintained
- Both components use identical button styling (`btn-base btn-ghost`)
- Responsive behavior (hiding labels on mobile) remains unchanged

### State Management

- No state management changes required
- Existing `chatMode` and `selectedWorkflowId` state variables remain unchanged
- Auto-switching logic in `useEffect` hooks remains unchanged

### Accessibility

- Both components maintain existing ARIA attributes
- Tab order will naturally follow visual order (Chat Mode → Workflow)
- Keyboard navigation remains unchanged

### Performance

- No performance impact
- Component render order change has negligible effect
- No additional API calls or state updates

## Design Decisions and Rationales

### Decision 1: Minimal Code Changes

**Rationale:** This is a simple reordering task that requires only two changes:
1. Swap JSX element order in ChatPanel
2. Reorder options array in ChatModeDropdown

Keeping changes minimal reduces risk and maintains existing functionality.

### Decision 2: Agent Mode First in Dropdown

**Rationale:** Placing Agent Mode first in the dropdown menu aligns with the user's request and emphasizes workflow-based generation as the primary feature. This matches the new visual hierarchy where mode selection comes before workflow selection.

### Decision 3: No State Logic Changes

**Rationale:** The existing auto-switching behavior (workflow selection → Agent Mode) is correct and should be preserved. The visual reordering doesn't require any changes to this logic.

### Decision 4: Preserve All Existing Functionality

**Rationale:** This is a UX polish task, not a feature change. All existing behaviors, including:
- Workflow fetching and display
- Mode switching
- Mobile view handling
- Placeholder text updates

...should remain exactly as they are.
