# Design Document

## Overview

This design refactors the existing ChatPanel component to simplify navigation from a three-agent system (Generate, Text, Gurus) to a two-mode system (Agent, Chat). The refactoring consolidates the navigation header, removes redundant code, and clarifies the separation between workflow-driven interactions and freeform chat.

## Current State Analysis

### Existing Components

**ChatPanel.tsx** (Currently Used):

- Props: Accepts `agent` prop of type `ChatAgent` ("generate" | "chat" | "guru")
- Header: Two rows
  - Row 1: AgentDropdown + ChatModeDropdown (left-aligned)
  - Row 2: Three agent buttons (Generate, Text, Gurus) - centered
- Upload Zone: Shows when `agent === "guru"` and `projectId` exists
- Settings: Located at bottom in composer area
- File Management: Has uploadedFiles state and file handling
- Used in: MobileLayout.tsx, DesktopLayout.tsx

**EnhancedChatPanel.tsx** (Not Currently Used):

- Props: Requires `projectId` (not optional), no `agent` prop
- Header: One row with AgentDropdown + ChatModeDropdown (left), Settings button (right)
- Upload Zone: Shows when `agent === "generate"`
- Settings: Has button in header (different from ChatPanel)
- File Management: Similar to ChatPanel
- Used in: Nowhere (dead code)

### Key Differences

1. ChatPanel has two-row header, EnhancedChatPanel has one-row header
2. ChatPanel shows upload in "guru" mode, EnhancedChatPanel shows in "generate" mode
3. ChatPanel has settings at bottom, EnhancedChatPanel has settings in header
4. EnhancedChatPanel is not actually used anywhere

## Target State

### Single Unified Component

**ChatPanel.tsx** (Modified):

- Remove the three agent buttons row (Generate, Text, Gurus)
- Keep single header row with Agent/Chat dropdowns only
- Remove "guru" from ChatAgent type
- Show upload zone when in "Agent" mode (workflow-based)
- Keep settings at bottom (no changes)
- Keep all existing file management functionality

## Architecture

### Component Structure (After Refactoring)

```
ChatPanel
├── Header (single row)
│   ├── AgentDropdown (shows workflows when clicked)
│   └── ChatModeDropdown (shows chat modes when clicked)
├── Content Area
│   ├── UploadDropzone (visible in Agent mode only)
│   ├── Message History
│   └── Mobile View Toggle
└── Input Area (bottom)
    ├── File Thumbnails (Agent mode only)
    ├── Style Presets
    ├── Message Composer
    └── Utility Controls (Settings, etc. - unchanged)
```

### Mode Determination

Instead of using the `agent` prop with three values, we'll use it to determine mode:

- **Agent Mode**: When user interacts with AgentDropdown (workflow-based)
- **Chat Mode**: When user interacts with ChatModeDropdown (freeform)

The `agent` prop will be simplified or replaced with a clearer mode indicator.

## Detailed Changes

### 1. Remove Agent Buttons Row

**Current Code (lines ~349-370 in ChatPanel.tsx)**:

```typescript
{/* Bottom row: Agent type buttons (centered) */}
<div className="flex items-center justify-center gap-1 flex-wrap">
  {AGENT_OPTIONS.map((option) => {
    const isActive = option.key === agent;
    const Icon = option.icon;
    return (
      <button
        key={option.key}
        type="button"
        onClick={() => onAgentChange(option.key)}
        // ... button content
      </button>
    );
  })}
</div>
```

**Action**: Delete this entire section

### 2. Simplify Header to Single Row

**Current Code (lines ~333-347 in ChatPanel.tsx)**:

```typescript
<div className="px-3 py-2 border-b border-muted">
  {/* Top row: Workflow and Chat Mode dropdowns (left-aligned) */}
  <div className="flex items-center gap-2 mb-2">
    <AgentDropdown ... />
    <ChatModeDropdown ... />
  </div>
  {/* Bottom row with buttons */}
</div>
```

**New Code**:

```typescript
<div className="px-3 py-2 border-b border-muted">
  <div className="flex items-center gap-2">
    <AgentDropdown ... />
    <ChatModeDropdown ... />
  </div>
</div>
```

**Action**: Remove `mb-2` class, remove second row div

### 3. Update Upload Zone Logic

**Current Code (line ~442 in ChatPanel.tsx)**:

```typescript
{agent === "guru" && projectId && (
  <div className="mb-3">
    <UploadDropzone ... />
  </div>
)}
```

**New Logic**: Show upload zone when in "Agent" mode

- Option A: Check if a workflow is selected: `selectedWorkflowId && projectId`
- Option B: Add explicit mode prop and check: `mode === 'agent' && projectId`

**Recommendation**: Option B is clearer

### 4. Update ChatAgent Type

**Current (in types.ts)**:

```typescript
export type ChatAgent = "generate" | "chat" | "guru";
```

**New**:

```typescript
export type ChatAgent = "generate" | "chat";
```

**Action**: Remove "guru" from type definition

### 5. Update AGENT_OPTIONS Constant

**Current (lines ~46-67 in ChatPanel.tsx)**:

```typescript
const AGENT_OPTIONS: Array<{...}> = [
  { key: "generate", label: "Generate", ... },
  { key: "chat", label: "Text", ... },
  { key: "guru", label: "Gurus", ... },
];
```

**Action**: Delete this entire constant (no longer needed)

### 6. Update AGENT_PLACEHOLDERS

**Current (lines ~69-73 in ChatPanel.tsx)**:

```typescript
const AGENT_PLACEHOLDERS: Record<ChatAgent, string> = {
  generate: "Describe your video concept to generate scenes...",
  chat: "Brainstorm your concept, ask for ideas...",
  guru: "Ask the Gurus for inspiration or creative direction...",
};
```

**New**: Determine placeholder based on mode

```typescript
const getPlaceholder = (mode: 'agent' | 'chat', selectedWorkflow?: string) => {
  if (mode === 'agent') {
    return selectedWorkflow 
      ? `Describe your ${selectedWorkflow} concept...`
      : "Select a workflow to get started...";
  }
  return "Brainstorm your concept, ask for ideas...";
};
```

### 7. Remove EnhancedChatPanel.tsx

**Action**: Delete the entire file since it's not used

### 8. Update Exports

**Current (src/features/chat/components/index.ts)**:

```typescript
export { ChatPanel } from "./ChatPanel";
export { EnhancedChatPanel } from "./EnhancedChatPanel";
```

**New**:

```typescript
export { ChatPanel } from "./ChatPanel";
```

**Action**: Remove EnhancedChatPanel export

## Props Changes

### Current ChatPanelProps

```typescript
interface ChatPanelProps {
  agent: ChatAgent;  // "generate" | "chat" | "guru"
  onAgentChange: (agent: ChatAgent) => void;
  projectId?: string | null;
  // ... other props
}
```

### Proposed ChatPanelProps

```typescript
interface ChatPanelProps {
  mode: 'agent' | 'chat';  // Clearer than "agent" prop
  onModeChange: (mode: 'agent' | 'chat') => void;
  projectId?: string | null;
  // ... other props unchanged
}
```

**Alternative**: Keep `agent` prop but remove "guru" value and use it to determine mode

## AgentDropdown Enhancement

The AgentDropdown already exists and fetches workflows. We need to enhance it with collapsible categories.

### Current Structure

- Flat list grouped by category
- All categories visible at once
- No collapse/expand functionality

### Target Structure

- Categories are collapsible
- Click category header to expand/collapse
- Remember expansion state during session
- Selected workflow remains highlighted

### Implementation

Add state for expanded categories:

```typescript
const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
  new Set(['music-video']) // Start with first category expanded
);
```

## Visual Design

### Header Layout

**Before**:

```
┌──────────────────────────────────────────────────┐
│ [Workflow ▼]  [Chat Mode ▼]                      │
│                                                  │
│     [✨ Generate]  [💬 Text]  [📄 Gurus]         │
└──────────────────────────────────────────────────┘
```

**After**:

```
┌──────────────────────────────────────────────────┐
│ [🤖 Agent ▼]  [💬 Chat ▼]                        │
└──────────────────────────────────────────────────┘
```

### Workflow Dropdown (Enhanced)

```
┌─────────────────────────────────────┐
│ ▼ Music Video                       │
│   ├─ Narrative Music Video          │
│   │   ├─ Story-driven               │
│   │   └─ Performance-based          │
│   └─ Lyric Video                    │
│                                     │
│ ▶ Product Commercial                │
│ ▶ Viral Social                      │
│ ▶ Explainer Video                   │
│ ▶ Custom                            │
│                                     │
│ ─────────────────────────────────   │
│ ⚙️ Manage Workflows                 │
└─────────────────────────────────────┘
```

## Migration Strategy

### Phase 1: Simplify ChatPanel

1. Remove agent buttons row
2. Remove `mb-2` from header
3. Update upload zone condition
4. Remove AGENT_OPTIONS constant
5. Update placeholder logic

### Phase 2: Update Types

1. Remove "guru" from ChatAgent type
2. Update all references to ChatAgent
3. Consider renaming to ChatMode for clarity

### Phase 3: Enhance AgentDropdown

1. Add collapsible category state
2. Add expand/collapse handlers
3. Update UI to show expand/collapse icons
4. Test category expansion behavior

### Phase 4: Cleanup

1. Delete EnhancedChatPanel.tsx
2. Update index.ts exports
3. Verify no broken imports
4. Update parent components if needed

### Phase 5: Parent Component Updates

1. Check MobileLayout.tsx usage
2. Check DesktopLayout.tsx usage
3. Update prop names if we change from `agent` to `mode`
4. Test mode switching behavior

## Testing Checklist

- [ ] Header shows only Agent and Chat dropdowns
- [ ] No agent buttons row visible
- [ ] Upload zone shows in Agent mode with projectId
- [ ] Upload zone hidden in Chat mode
- [ ] Settings remain at bottom (unchanged)
- [ ] Workflow dropdown has collapsible categories
- [ ] Category expansion state persists
- [ ] Selected workflow highlighted correctly
- [ ] Chat mode dropdown works unchanged
- [ ] Mobile layout works correctly
- [ ] Desktop layout works correctly
- [ ] No TypeScript errors
- [ ] No broken imports

## Files to Modify

1. `src/features/chat/components/ChatPanel.tsx` - Main changes
2. `src/features/chat/components/AgentDropdown.tsx` - Add collapsible categories
3. `src/features/chat/components/index.ts` - Remove EnhancedChatPanel export
4. `src/types.ts` - Update ChatAgent type
5. `src/features/app-shell/components/MobileLayout.tsx` - Verify usage
6. `src/features/app-shell/components/DesktopLayout.tsx` - Verify usage

## Files to Delete

1. `src/features/chat/components/EnhancedChatPanel.tsx` - Not used, redundant

## Risk Assessment

**Low Risk**:

- Removing agent buttons row (visual only)
- Deleting EnhancedChatPanel (not used)
- Updating type definitions

**Medium Risk**:

- Changing upload zone logic (need to test thoroughly)
- Updating parent component props (if we rename `agent` to `mode`)

**Mitigation**:

- Test upload functionality in both modes
- Verify parent components still work
- Check for any other components using ChatAgent type
