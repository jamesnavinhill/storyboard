# Design Document

## Overview

This design enhances the group and tag management interface to provide a more compact, intuitive experience with better visual feedback. The improvements focus on three key areas:

1. **Collapsible Managers**: Groups and tags collapse by default to reduce visual clutter
2. **Clear Action Buttons**: Explicit "Done" buttons provide confidence that changes are saved
3. **Badge Visibility**: Group and tag assignments are surfaced directly on scene cards and in the manager panel

## Architecture

### Component Structure

The implementation involves modifications to existing components rather than creating new ones:

```
src/features/scene/components/
├── GroupsTagsInlineManagers.tsx    # Add collapse/expand state
├── SceneManageDrawer.tsx            # Add badge display in details
└── GroupBadge.tsx                   # Reuse existing badge component
└── TagBadge.tsx                     # Reuse existing badge component

src/features/storyboard/components/
└── SceneCard.tsx                    # Add badge display in details panel
```

### State Management

- **Collapse State**: Local component state in `GroupsInlineManager` and `TagsInlineManager`
- **Badge Data**: Derived from existing scene group/tag assignments (no new state needed)
- **Scene Assignments**: Existing Zustand store handles persistence

## Components and Interfaces

### 1. Enhanced GroupsInlineManager

**New Props:**
```typescript
interface GroupsInlineManagerProps {
  // ... existing props
  defaultCollapsed?: boolean; // Default: true
}
```

**New State:**
```typescript
const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
```

**Behavior:**
- Each group renders as a collapsible section
- Header shows: group name, color indicator, scene count, expand/collapse icon
- Clicking header toggles expansion
- When expanded: shows scene assignment checkboxes + "Done" button
- "Done" button collapses the section (assignments auto-save on checkbox change)

### 2. Enhanced TagsInlineManager

**New Props:**
```typescript
interface TagsInlineManagerProps {
  // ... existing props
  defaultCollapsed?: boolean; // Default: true
}
```

**New State:**
```typescript
const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());
```

**Behavior:**
- Same collapsible pattern as groups
- Header shows: tag name, color indicator, scene count, expand/collapse icon
- "Done" button to collapse after making selections
- **Key Difference from Groups**: Tag section remains expanded when checkboxes are toggled
  - Checkbox changes do NOT auto-collapse the section
  - Only the "Done" button or clicking the header collapses the section
  - This allows users to assign multiple scenes to a tag without reopening
  - Groups auto-collapse because scenes can only belong to one group (single-selection)
  - Tags support multi-selection, so the section stays open for convenience

### 3. SceneCard Badge Display

**Location:** Within the existing `showDetails` overlay section

**Layout:**
```
┌─────────────────────────────────────┐
│ Scene Details Overlay               │
│ ┌─────────────────────────────────┐ │
│ │ Scene ID    [Badges →]          │ │
│ │ Description text (full width)   │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Badge Rendering:**
- Display in top-right of details overlay
- Show first 3 badges (groups first, then tags)
- If more than 3 total, show "+N" counter badge
- Badges use existing `GroupBadge` and `TagBadge` components

**Layout Refinements:**
- Reduce vertical spacing below badges (reduce gap/padding)
- Position badges higher in their container to prevent pushing description text
- Account for group badge being slightly larger than tag badges
- Ensure description text maintains full width without wrapping changes
- Use `items-start` alignment to keep badges at top of flex container
- Minimize bottom margin/padding on badge container

### 4. Manager Panel Badge Display

**Location:** In the "Details" tab, below the description textarea

**Layout:**
```
Description
┌─────────────────────────────────────┐
│ [Textarea with scene description]   │
│ (auto-expands, no scrollbar)        │
└─────────────────────────────────────┘

Groups & Tags
[Group Badge] [Tag Badge] [Tag Badge]
```

**Badge Rendering:**
- New section between description and aspect ratio controls
- Label: "Groups & Tags"
- Flex-wrap layout for multiple badges
- Use existing badge components with `onRemove` handler

**Description Textarea:**
- Remove max-height constraint (previously 420px)
- Auto-expand to fit all content without scrollbars
- Use `hide-scrollbar` class to ensure no scrollbar appears
- Maintain smooth transitions during auto-sizing

## Data Models

No new data models required. The implementation uses existing types:

```typescript
// From @/types
interface Scene {
  groupId?: string | null;
  groupIds?: string[];
  tagIds?: string[];
  // ... other fields
}

interface SceneGroup {
  id: string;
  name: string;
  color?: string | null;
  sceneIds?: string[];
}

interface SceneTag {
  id: string;
  name: string;
  color?: string | null;
  sceneIds?: string[];
}
```

## UI/UX Design

### Collapsible Manager Pattern

**Collapsed State:**
```
┌─────────────────────────────────────┐
│ ▶ Group Name (Orange) • 4 scenes   │
└─────────────────────────────────────┘
```

**Expanded State:**
```
┌─────────────────────────────────────┐
│ ▼ Group Name (Orange) • 4 scenes   │
│                                     │
│ Assign Scenes                       │
│ ☑ Scene 1: Description...          │
│ ☐ Scene 2: Description...          │
│ ☑ Scene 3: Description...          │
│                                     │
│              [Done]                 │
└─────────────────────────────────────┘
```

### Badge Display Pattern

**Scene Card Details (Right-aligned):**
```
┌─────────────────────────────────────┐
│ Scene 1234        [Badge] [Badge] +2│
│ Description text...                 │
└─────────────────────────────────────┘
```

**Manager Panel Details:**
```
Description
[Textarea]

Groups & Tags
[Group Badge] [Tag Badge] [Tag Badge]

Aspect Ratio
[Select] [Export] [Save]
```

### Color Indicators

Use existing color palette from badge components:
- Orange (#f97316)
- Pink (#ec4899)
- Indigo (#6366f1)
- Emerald (#22c55e)
- Teal (#14b8a6)
- Sky (#0ea5e9)
- Amber (#facc15)
- Red (#ef4444)

## Error Handling

### Collapse/Expand Errors
- **Issue**: State desync if multiple users edit simultaneously
- **Handling**: Local UI state only; no server sync needed
- **Recovery**: Refresh manager panel to reset state

### Badge Rendering Errors
- **Issue**: Missing group/tag data for assigned IDs
- **Handling**: Filter out null badges, show only valid assignments
- **Recovery**: Graceful degradation (show no badge if data missing)

### Assignment Persistence Errors
- **Issue**: Checkbox changes fail to save
- **Handling**: Existing error handling in parent component
- **Recovery**: Toast notification + retry mechanism (already implemented)

## Testing Strategy

### Unit Tests

**GroupsInlineManager:**
- Renders collapsed by default
- Expands on header click
- Collapses on "Done" button click
- Shows correct scene count
- Displays color indicator

**TagsInlineManager:**
- Same test cases as GroupsInlineManager

**SceneCard:**
- Renders badges when groups/tags assigned
- Shows "+N" counter when > 3 badges
- Limits to 3 visible badges
- Handles missing badge data gracefully

**SceneManageDrawer:**
- Renders badges in details tab
- Shows groups before tags
- Handles badge removal
- Auto-sizes description textarea

### Integration Tests

**Manager Workflow:**
1. Open manager panel
2. Expand group section
3. Assign scenes via checkboxes
4. Click "Done"
5. Verify section collapses
6. Verify assignments persist

**Badge Display Workflow:**
1. Assign group to scene
2. Assign tags to scene
3. Open scene card details
4. Verify badges appear
5. Open manager panel
6. Verify badges appear in details tab

### Visual Regression Tests

- Collapsed manager state
- Expanded manager state
- Badge display in scene card
- Badge display in manager panel
- "+N" counter badge
- Long badge lists (wrapping)

## Layout Refinements

### Description Textarea Scrollbar Issue

**Problem:** The description textarea in the Manager Panel currently has a max-height constraint that triggers scrollbars, which doesn't match site standards.

**Solution:**
- Remove the max-height: 420px constraint
- Allow textarea to auto-expand to fit all content
- Ensure `hide-scrollbar` class is applied
- Use `autoSizeDescription` function to dynamically adjust height
- No scrollbar should appear regardless of content length

**CSS Changes:**
```css
/* Ensure textarea expands without scrollbar */
.form-textarea.hide-scrollbar {
  overflow: hidden; /* No scrollbar */
  resize: none;
  min-height: 60px; /* Minimum for usability */
  /* Remove max-height constraint */
}
```

### Badge Spacing in Details Panels

**Problem:** Group and tag badges in the scene card details panel are pushing the description text down and causing layout shifts. The badges need to fit better in the top row without altering the paragraph text.

**Current Layout Issues:**
- Too much vertical spacing below badges
- Description text gets pushed down
- Layout shifts when badges are present vs absent
- Group badges are slightly larger than tag badges, needs accounting

**Solution:**
- Reduce gap between badge container and description text
- Use tighter vertical spacing (gap-1 or gap-1.5 instead of gap-3)
- Position badges with `items-start` to keep them at top
- Reduce padding on badge container
- Ensure description text maintains consistent position

**CSS/Layout Changes:**
```tsx
// SceneCard details panel
<div className="flex justify-between items-start gap-2"> {/* Reduced from gap-3 */}
  <div className="flex-1 min-w-0">
    <p className="text-uppercase-xs text-primary">Scene {scene.id.substring(0, 4)}</p>
    <p className="text-sm mt-1">{scene.description}</p>
  </div>
  {badges && (
    <div className="flex flex-wrap gap-1.5 items-start justify-end max-w-[40%]">
      {/* Badges with reduced spacing */}
    </div>
  )}
</div>
```

**Key Adjustments:**
- Change outer gap from `gap-3` to `gap-2`
- Keep badge container gap at `gap-1.5` (already optimal)
- Add `max-w-[40%]` to badge container to prevent excessive width
- Ensure `items-start` alignment is maintained
- Description text should not wrap differently when badges are present

## Performance Considerations

### Rendering Optimization

**Badge Memoization:**

```typescript
const visibleBadges = useMemo(() => {
  const allBadges = [
    ...assignedGroups.map(g => ({ type: 'group', data: g })),
    ...assignedTags.map(t => ({ type: 'tag', data: t }))
  ];
  return allBadges.slice(0, 3);
}, [assignedGroups, assignedTags]);
```

**Collapse State:**

- Use `Set<string>` for O(1) lookup
- Avoid re-rendering collapsed sections

### Memory Impact

- Minimal: Only adds local UI state (Set of expanded IDs)
- Badge data already exists in scene objects
- No additional API calls required

## Accessibility

### Keyboard Navigation

- **Collapse/Expand**: Enter/Space on header
- **Done Button**: Tab to focus, Enter to activate
- **Badges**: Not interactive (display only)

### Screen Reader Support

```typescript
// Collapsible header
<button
  aria-expanded={isExpanded}
  aria-controls={`group-${group.id}-content`}
>
  {group.name} ({group.sceneIds?.length ?? 0} scenes)
</button>

// Collapsible content
<div
  id={`group-${group.id}-content`}
  role="region"
  aria-labelledby={`group-${group.id}-header`}
>
  {/* Scene checkboxes */}
</div>

// Badge counter
<span aria-label={`${remainingCount} more groups and tags`}>
  +{remainingCount}
</span>
```

### Focus Management

- Expanding a section does not steal focus
- "Done" button receives focus when section expands
- Collapsing returns focus to header button

## Migration Strategy

### Phase 1: Manager Enhancements
1. Add collapse/expand state to managers
2. Implement "Done" button
3. Test manager functionality

### Phase 2: Badge Display
1. Add badges to SceneCard details
2. Add badges to Manager Panel details
3. Implement "+N" counter logic

### Phase 3: Polish
1. Add animations for collapse/expand
2. Refine badge spacing and wrapping
3. Test across different screen sizes

### Rollback Plan

If issues arise:
1. Feature flag to disable collapsible managers
2. Hide badges in scene cards (no functional impact)
3. Revert to previous manager layout

## Dependencies

### Existing Components
- `GroupBadge` (src/features/scene/components/GroupBadge.tsx)
- `TagBadge` (src/features/scene/components/TagBadge.tsx)
- `GroupsInlineManager` (src/features/scene/components/GroupsTagsInlineManagers.tsx)
- `TagsInlineManager` (src/features/scene/components/GroupsTagsInlineManagers.tsx)
- `SceneCard` (src/features/storyboard/components/SceneCard.tsx)
- `SceneManageDrawer` (src/features/scene/components/SceneManageDrawer.tsx)

### External Libraries
- React (hooks: useState, useMemo)
- Lucide React (icons: ChevronRight, ChevronDown)

### CSS Utilities
- Existing utility classes from `src/styles/utilities.css`
- No new CSS required (use existing badge and button styles)

## Open Questions

1. **Animation Duration**: Should collapse/expand be instant or animated? (Recommendation: 200ms ease transition)
2. **Badge Tooltip**: Should "+N" counter show tooltip on hover? (Recommendation: Yes, with list of remaining items)
3. **Mobile Behavior**: Should managers be collapsed on mobile by default? (Recommendation: Yes, same as desktop)
4. **Badge Removal**: Should badges in scene card details be removable? (Recommendation: No, read-only; use manager panel for edits)
