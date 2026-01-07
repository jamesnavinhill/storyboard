# Design Document

## Overview

This design simplifies the resizable panel layout by removing the resizer between the storyboard/gallery and scene manager panels. The scene manager will have a fixed width when expanded and will be controlled via a collapse/expand toggle button. The storyboard panel will automatically fill the remaining space, creating a more predictable and natural layout behavior.

## Architecture

### Current Layout Structure (4 panels, 4 resizers - PROBLEM!)
```
[Sidebar] <resizer> [Chat] <resizer> [Storyboard] <resizer-1> <resizer-2> [SceneManager]
```

**The Issue:** There are currently TWO resizers between the storyboard and scene manager:
1. `startResize("storyboard")` - resizes storyboard from the right edge
2. `startResize("sceneManager")` - resizes scene manager from the left edge

This creates redundant, conflicting resize handlers that cause strange behavior.

### New Layout Structure (4 panels, 3 resizers - FIXED)
```
[Sidebar] <resizer> [Chat] <resizer> [Storyboard (flex-1)] <resizer> [SceneManager]
```

**The Fix:** Remove ONE of the redundant resizers between storyboard and scene manager. Keep only the scene manager resizer, which will resize the scene manager from its left edge. The storyboard will automatically fill remaining space using `flex-1`.

## Components and Interfaces

### Modified Components

#### 1. App.tsx Layout Section

**Changes to state and refs:**
- Remove `handleStoryboardResize` function (no longer needed)
- Remove the `startResize("storyboard")` case from the resize handler
- Remove the redundant resizer JSX element between storyboard and scene manager
- Simplify `ensureLayoutWithinBounds` to not calculate storyboard width
- Update `calculateAvailableSpace` to treat storyboard as flexible
- Keep `handleSceneManagerResize` - this is the ONE resizer we need between storyboard and scene manager

**Changes to JSX structure:**
```tsx
// REMOVE this redundant resizer (around line 2164):
<div
  className="layout-resizer"
  onPointerDown={startResize("storyboard")}
  role="separator"
  aria-orientation="vertical"
  aria-label="Resize storyboard column"
/>

// KEEP these resizers:
// 1. After sidebar - startResize("sidebar")
// 2. After chat - startResize("chat")
// 3. Before scene manager - startResize("sceneManager")

// Result: 3 resizers total, 1 between storyboard and scene manager (not 2!)
```

**Layout calculation logic:**
```typescript
// Simplified space calculation
const calculateAvailableSpace = () => {
  const containerWidth = layoutRef.current?.clientWidth ?? 0;
  
  // Fixed widths
  const sidebarSpace = isSidebarCollapsed 
    ? SIDEBAR_COLLAPSED_WIDTH 
    : sidebarWidth;
  const chatSpace = isChatCollapsed 
    ? 0 
    : chatWidth;
  const sceneManagerSpace = isSceneManagerCollapsed 
    ? SCENE_MANAGER_COLLAPSED_WIDTH 
    : sceneManagerWidth;
  
  // Resizers (3 total: after sidebar, after chat, before scene manager)
  const resizerSpace = RESIZER_SIZE * 3;
  
  // Storyboard gets whatever is left
  const storyboardSpace = containerWidth 
    - sidebarSpace 
    - chatSpace 
    - sceneManagerSpace 
    - resizerSpace;
  
  return {
    sidebarSpace,
    chatSpace,
    storyboardSpace,
    sceneManagerSpace,
  };
};
```

#### 2. CSS Updates

**No CSS changes needed:**
The resizer styles are generic and applied via the `layout-resizer` class. We're just removing one redundant resizer element from the JSX.

**Update storyboard panel styles:**
```css
.layout-main {
  flex: 1; /* Automatically fill available space */
  min-width: 480px; /* Maintain minimum width */
  overflow: hidden;
}
```

**Scene manager panel styles:**
```css
.panel-scene-manager {
  width: var(--layout-scene-manager-width);
  flex-shrink: 0; /* Don't shrink */
  transition: width 0.2s ease-out; /* Smooth collapse/expand */
}

.panel-scene-manager--collapsed {
  width: var(--layout-scene-manager-collapsed-width);
}
```

## Data Models

No data model changes required. The existing state management for panel widths and collapsed states remains the same.

## Error Handling

### Layout Constraint Violations

**Scenario:** Window becomes too narrow to fit all panels at minimum widths

**Handling:**
1. First collapse scene manager if expanded
2. Then collapse chat if still insufficient space
3. Finally collapse sidebar if still insufficient space
4. If window is narrower than mobile breakpoint (1024px), switch to mobile layout

**Implementation:**
```typescript
const ensureLayoutWithinBounds = () => {
  const containerWidth = layoutRef.current?.clientWidth ?? 0;
  
  // Calculate minimum required width
  const minRequired = 
    (isSidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_MIN_WIDTH) +
    (isChatCollapsed ? 0 : CHAT_MIN_WIDTH) +
    STORYBOARD_MIN_WIDTH +
    (isSceneManagerCollapsed ? SCENE_MANAGER_COLLAPSED_WIDTH : SCENE_MANAGER_MIN_WIDTH) +
    RESIZER_SIZE * 2;
  
  if (containerWidth < minRequired) {
    // Auto-collapse panels in priority order
    if (!isSceneManagerCollapsed) {
      setSceneManagerCollapsed(true);
      return;
    }
    if (!isChatCollapsed) {
      setChatCollapsed(true);
      return;
    }
    if (!isSidebarCollapsed) {
      setSidebarCollapsed(true);
      return;
    }
  }
  
  // Clamp panel widths to available space
  const { chatSpace, sceneManagerSpace } = calculateAvailableSpace();
  
  if (!isChatCollapsed && chatWidth > chatSpace) {
    setChatWidth(Math.max(CHAT_MIN_WIDTH, chatSpace));
  }
  
  if (!isSceneManagerCollapsed && sceneManagerWidth > sceneManagerSpace) {
    setSceneManagerWidth(Math.max(SCENE_MANAGER_MIN_WIDTH, sceneManagerSpace));
  }
};
```

### Resize Conflicts

**Scenario:** User drags chat resizer to a width that would violate storyboard minimum

**Handling:**
- Clamp chat width to ensure storyboard maintains STORYBOARD_MIN_WIDTH (480px)
- Provide visual feedback when limit is reached (cursor change, subtle animation)

## Testing Strategy

### Manual Testing Checklist

1. **Resizer Count Verification**
   - Verify exactly 3 resizers exist (after sidebar, after chat, before scene manager)
   - Verify only ONE resizer between storyboard and scene manager (not two)
   - Verify storyboard automatically fills available space
   - Drag the scene manager resizer left/right and verify smooth, predictable behavior

2. **Scene Manager Toggle**
   - Click collapse button → scene manager collapses to 72px
   - Click expand button → scene manager expands to last width
   - Verify smooth animation during transition
   - Verify state persists across page refresh

3. **Responsive Behavior**
   - Gradually resize window smaller → panels collapse in order
   - Gradually resize window larger → panels expand in order
   - Verify no layout jumps or visual glitches
   - Verify minimum widths are respected

4. **Edge Cases**
   - Start with very narrow window → verify mobile layout
   - Expand to desktop width → verify panels restore correctly
   - Collapse all panels → verify layout remains stable
   - Rapidly toggle scene manager → verify no race conditions

### Browser Testing

Test in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Performance Testing

- Monitor layout recalculation performance during window resize
- Verify no memory leaks from resize event listeners
- Check smooth 60fps animation during collapse/expand transitions
