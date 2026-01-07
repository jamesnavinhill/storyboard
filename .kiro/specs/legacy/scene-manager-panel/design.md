# Design Document

## Overview

This design transforms the SceneManageDrawer from a fixed overlay into a fourth resizable panel that mirrors the left sidebar's collapsible behavior. The layout will support four panels: left sidebar (library), chat, storyboard, and scene manager (right sidebar). Both sidebars default to collapsed (72px), with center panels splitting the remaining space. The scene manager expands automatically when users select assets, and all panels support drag-to-collapse/expand interactions.

## Architecture

### Layout Structure

The four-panel layout follows this hierarchy:

```,
┌─────────────────────────────────────────────────────────────────┐
│  App Container (100vw × 100vh)                                  │
│  ┌──────┬───┬──────────┬───┬──────────┬───┬──────────┐         │
│  │ Left │ R │   Chat   │ R │Storyboard│ R │  Scene   │         │
│  │Sidebar│ e │  Panel   │ e │  Panel   │ e │ Manager  │         │
│  │      │ s │          │ s │          │ s │  Panel   │         │
│  │ 72px │ i │  420px   │ i │  flex-1  │ i │  72px    │         │
│  │(coll)│ z │          │ z │          │ z │ (coll)   │         │
│  │      │ e │          │ e │          │ e │          │         │
│  │      │ r │          │ r │          │ r │          │         │
│  └──────┴───┴──────────┴───┴──────────┴───┴──────────┘         │
└─────────────────────────────────────────────────────────────────┘

Default state: Both sidebars collapsed, center panels split remaining space
```

### Panel States

Each panel can be in one of two states:

1. **Expanded**: Full width with content visible
   - Left Sidebar: 240-420px (default 288px)
   - Chat Panel: 320-720px (default 420px)
   - Storyboard Panel: 480px minimum, flex-grows
   - Scene Manager: 320-600px (default 440px)

2. **Collapsed**: Minimal width showing only divider/handle
   - Left Sidebar: 72px (icon strip)
   - Chat Panel: Divider only (resizer handle visible)
   - Storyboard Panel: Divider only (resizer handle visible)
   - Scene Manager: 72px (icon strip or divider)

### Collapse Behavior

**Sidebar Collapse (Left & Scene Manager)**:

- Drag resizer to within 40px of collapsed width → snap to collapsed
- Drag from collapsed state → expand to last used width
- Collapsed state shows 72px strip with expand affordance
- Persists collapsed state to localStorage

**Center Panel Collapse (Chat & Storyboard)**:

- Drag resizer to within 40px of zero width → collapse to divider only
- Collapsed state shows only resizer handle (no content)
- Drag from collapsed divider → expand to last used width
- Persists collapsed state to localStorage

## Components and Interfaces

### 1. Layout State Management

**New State Variables** (add to App.tsx):

```typescript
// Scene Manager Panel state
const [sceneManagerWidth, setSceneManagerWidth] = useState(() =>
  loadStoredDimension(
    "vb:layout:sceneManagerWidth",
    440,
    SCENE_MANAGER_MIN_WIDTH,
    SCENE_MANAGER_MAX_WIDTH
  )
);

const [isSceneManagerCollapsed, setSceneManagerCollapsed] = useState(() => {
  if (typeof window === "undefined") return true; // Default collapsed
  return window.localStorage.getItem("vb:layout:sceneManagerCollapsed") !== "0";
});

// Center panel collapse states
const [isChatCollapsed, setChat Collapsed] = useState(() => {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem("vb:layout:chatCollapsed") === "1";
});

const [isStoryboardCollapsed, setStoryboardCollapsed] = useState(() => {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem("vb:layout:storyboardCollapsed") === "1";
});
```

**Constants** (add to App.tsx):

```typescript
const SCENE_MANAGER_MIN_WIDTH = 320;
const SCENE_MANAGER_MAX_WIDTH = 600;
const SCENE_MANAGER_COLLAPSED_WIDTH = 72;
const COLLAPSE_THRESHOLD = 40; // px from target to trigger snap
```

**Storage Keys** (update LAYOUT_STORAGE_KEYS):

```typescript
const LAYOUT_STORAGE_KEYS = {
  sidebarWidth: "vb:layout:sidebarWidth",
  chatWidth: "vb:layout:chatWidth",
  sceneManagerWidth: "vb:layout:sceneManagerWidth",
  sidebarCollapsed: "vb:layout:sidebarCollapsed",
  chatCollapsed: "vb:layout:chatCollapsed",
  storyboardCollapsed: "vb:layout:storyboardCollapsed",
  sceneManagerCollapsed: "vb:layout:sceneManagerCollapsed",
} as const;
```

### 2. SceneManageDrawer Component Updates

**Props Changes**:

```typescript
export interface SceneManageDrawerProps {
  // Existing props remain unchanged
  variant?: "drawer" | "panel";
  isOpen: boolean;
  scene: Scene | null;
  // ... other existing props

  // New props for panel variant
  isCollapsed?: boolean; // For panel variant
  onToggleCollapse?: () => void; // For panel variant
  className?: string;
}
```

**Rendering Logic**:

```typescript
const Container: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (variant === "drawer") {
    // Existing drawer rendering (mobile)
    return (
      <div className="pointer-events-none fixed inset-y-0 right-0 z-40 flex max-w-full">
        <aside className="pointer-events-auto panel-chat flex h-full w-full max-w-[440px] flex-col border-l border-border shadow-2xl">
          {children}
        </aside>
      </div>
    );
  }

  // Panel variant (desktop)
  if (isCollapsed) {
    return (
      <div className="scene-manager-collapsed flex h-full w-[72px] flex-col items-center justify-center border-l border-border bg-card">
        <button
          onClick={onToggleCollapse}
          className="btn-base btn-ghost p-2"
          aria-label="Expand scene manager"
        >
          <ChevronDoubleLeftIcon className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div className={className ?? "panel-chat flex h-full w-full flex-col border-l border-border"}>
      {children}
    </div>
  );
};
```

### 3. Resize Logic Updates

**Enhanced startResize Function**:

```typescript
const startResize = useCallback(
  (target: "sidebar" | "chat" | "storyboard" | "sceneManager") =>
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (isMobileLayout) return;
      
      // Prevent resize if target is collapsed (except for expansion)
      if (target === "sidebar" && isSidebarCollapsed) return;
      if (target === "sceneManager" && isSceneManagerCollapsed) return;

      const containerWidth = layoutRef.current?.clientWidth ?? 0;
      if (!containerWidth) return;

      event.preventDefault();
      const startX = event.clientX;
      
      // Store initial widths
      const initialSidebar = sidebarWidthRef.current;
      const initialChat = chatWidthRef.current;
      const initialSceneManager = sceneManagerWidthRef.current;

      const onMove = (moveEvent: PointerEvent) => {
        const delta = moveEvent.clientX - startX;

        switch (target) {
          case "sidebar":
            handleSidebarResize(delta, initialSidebar, containerWidth);
            break;
          case "chat":
            handleChatResize(delta, initialChat, containerWidth);
            break;
          case "storyboard":
            handleStoryboardResize(delta, containerWidth);
            break;
          case "sceneManager":
            handleSceneManagerResize(delta, initialSceneManager, containerWidth);
            break;
        }
      };

      const onUp = () => {
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        persistLayoutState(target);
      };

      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
  [isMobileLayout, isSidebarCollapsed, isSceneManagerCollapsed]
);
```

**Collapse Detection Helpers**:

```typescript
const handleChatResize = (delta: number, initialWidth: number, containerWidth: number) => {
  const newWidth = initialWidth + delta;
  
  // Check for collapse threshold
  if (newWidth < COLLAPSE_THRESHOLD) {
    setChat Collapsed(true);
    return;
  }
  
  // Normal resize with constraints
  const maxWidth = calculateMaxChatWidth(containerWidth);
  const clampedWidth = clamp(newWidth, CHAT_MIN_WIDTH, maxWidth);
  chatWidthRef.current = clampedWidth;
  setChatWidth(clampedWidth);
};

const handleSceneManagerResize = (delta: number, initialWidth: number, containerWidth: number) => {
  // Delta is negative when dragging left (expanding), positive when dragging right (collapsing)
  const newWidth = initialWidth - delta; // Invert delta for right-side panel
  
  // Check for collapse threshold
  if (newWidth < SCENE_MANAGER_MIN_WIDTH && 
      Math.abs(newWidth - SCENE_MANAGER_COLLAPSED_WIDTH) < COLLAPSE_THRESHOLD) {
    setSceneManagerCollapsed(true);
    return;
  }
  
  // Normal resize with constraints
  const maxWidth = calculateMaxSceneManagerWidth(containerWidth);
  const clampedWidth = clamp(newWidth, SCENE_MANAGER_MIN_WIDTH, maxWidth);
  sceneManagerWidthRef.current = clampedWidth;
  setSceneManagerWidth(clampedWidth);
};
```

**Expansion from Collapsed State**:

```typescript
const handleExpandFromCollapsed = (target: "sidebar" | "chat" | "storyboard" | "sceneManager") => {
  switch (target) {
    case "sidebar":
      setSidebarCollapsed(false);
      // Width will be restored from ref
      break;
    case "chat":
      setChatCollapsed(false);
      break;
    case "storyboard":
      setStoryboardCollapsed(false);
      break;
    case "sceneManager":
      setSceneManagerCollapsed(false);
      break;
  }
};
```

### 4. Auto-Open Scene Manager

**Update openSceneManager Function**:

```typescript
const openSceneManager = useCallback(
  (
    sceneId: string,
    options?: { tab?: SceneManagerTab; groupTagSubTab?: GroupTagTab }
  ) => {
    setManageSceneId(sceneId);
    
    // Auto-expand scene manager if collapsed
    if (isSceneManagerCollapsed) {
      setSceneManagerCollapsed(false);
    }
    
    if (options?.tab) {
      setManagerTopTab(options.tab);
    } else {
      setManagerTopTab((prev) => (prev === "library" ? "details" : prev));
    }
    
    if (options?.groupTagSubTab) {
      setGroupTagSubTab(options.groupTagSubTab);
    }
  },
  [isSceneManagerCollapsed]
);
```

### 5. Layout Calculation

**Space Allocation Logic**:

```typescript
const calculateAvailableSpace = (containerWidth: number) => {
  // Calculate occupied space
  const leftSidebarSpace = isSidebarCollapsed 
    ? SIDEBAR_COLLAPSED_WIDTH 
    : sidebarWidthRef.current;
  
  const sceneManagerSpace = isSceneManagerCollapsed 
    ? SCENE_MANAGER_COLLAPSED_WIDTH 
    : sceneManagerWidthRef.current;
  
  const resizerSpace = RESIZER_SIZE * 3; // 3 resizers between 4 panels
  
  // Available space for center panels
  const centerSpace = containerWidth - leftSidebarSpace - sceneManagerSpace - resizerSpace;
  
  return {
    leftSidebarSpace,
    sceneManagerSpace,
    centerSpace,
    resizerSpace,
  };
};

const ensureLayoutWithinBounds = useCallback(() => {
  if (!layoutRef.current) return;
  
  const containerWidth = layoutRef.current.clientWidth;
  if (!containerWidth) return;
  
  const { centerSpace } = calculateAvailableSpace(containerWidth);
  
  // Ensure center panels fit within available space
  if (!isChatCollapsed && !isStoryboardCollapsed) {
    const chatSpace = Math.max(CHAT_MIN_WIDTH, chatWidthRef.current);
    const storyboardSpace = Math.max(STORYBOARD_MIN_WIDTH, centerSpace - chatSpace - RESIZER_SIZE);
    
    if (chatSpace + storyboardSpace + RESIZER_SIZE > centerSpace) {
      // Reduce chat width to fit
      const newChatWidth = centerSpace - STORYBOARD_MIN_WIDTH - RESIZER_SIZE;
      if (newChatWidth >= CHAT_MIN_WIDTH) {
        chatWidthRef.current = newChatWidth;
        setChatWidth(newChatWidth);
      }
    }
  }
}, [isSidebarCollapsed, isSceneManagerCollapsed, isChatCollapsed, isStoryboardCollapsed]);
```

## Data Models

### Layout State Interface

```typescript
interface LayoutState {
  // Panel widths (when expanded)
  sidebarWidth: number;
  chatWidth: number;
  sceneManagerWidth: number;
  
  // Collapse states
  isSidebarCollapsed: boolean;
  isChatCollapsed: boolean;
  isStoryboardCollapsed: boolean;
  isSceneManagerCollapsed: boolean;
  
  // Active scene for manager
  manageSceneId: string | null;
}
```

### CSS Custom Properties

```css
:root {
  --layout-sidebar-width: 288px;
  --layout-sidebar-collapsed-width: 72px;
  --layout-chat-width: 420px;
  --layout-scene-manager-width: 440px;
  --layout-scene-manager-collapsed-width: 72px;
  --layout-resizer-size: 10px;
}
```

## Error Handling

### Constraint Violations

1. **Insufficient Space**: If total minimum widths exceed viewport, prioritize:
   - Storyboard minimum (480px)
   - Chat minimum (320px)
   - Collapse sidebars automatically if needed

2. **Invalid Stored Values**: Clamp to valid ranges on load:

   ```typescript
   const loadStoredDimension = (key: string, fallback: number, min: number, max: number) => {
     const stored = window.localStorage.getItem(key);
     if (!stored) return fallback;
     const parsed = Number.parseFloat(stored);
     if (!Number.isFinite(parsed)) return fallback;
     return clamp(parsed, min, max);
   };
   ```

3. **Resize Conflicts**: Prevent simultaneous resizes:

   ```typescript
   let activeResizeTarget: string | null = null;
   
   const startResize = (target: string) => {
     if (activeResizeTarget) return; // Block if already resizing
     activeResizeTarget = target;
     // ... resize logic
   };
   ```

## Testing Strategy

### Unit Tests

1. **Collapse Detection**:
   - Test threshold detection (40px)
   - Test snap-to-collapsed behavior
   - Test expansion from collapsed state

2. **Layout Calculations**:
   - Test space allocation with various collapse states
   - Test constraint enforcement
   - Test minimum width priorities

3. **State Persistence**:
   - Test localStorage save/load
   - Test default values
   - Test invalid value handling

### Integration Tests

1. **Panel Interactions**:
   - Test drag-to-collapse for all panels
   - Test drag-to-expand from collapsed
   - Test auto-expand on scene selection

2. **Responsive Behavior**:
   - Test mobile/desktop mode switching
   - Test layout recalculation on resize
   - Test panel state preservation across breakpoints

3. **Scene Manager Workflows**:
   - Test opening from storyboard cards
   - Test opening from library sidebar
   - Test opening from asset manager
   - Test tab navigation while expanded/collapsed

### Visual Regression Tests

1. **Layout States**:
   - All panels expanded
   - Both sidebars collapsed (default)
   - Various combinations of collapsed panels
   - Mobile drawer mode

2. **Transitions**:
   - Collapse animations
   - Expand animations
   - Resize handle interactions

## Implementation Notes

### Phase 1: State Management

- Add scene manager width/collapse state
- Add center panel collapse states
- Update storage keys and persistence logic

### Phase 2: SceneManageDrawer Updates

- Add collapsed rendering mode
- Add panel variant styling
- Remove close button in panel mode
- Add collapse toggle button

### Phase 3: Resize Logic

- Implement collapse threshold detection
- Add scene manager resize handler
- Update space calculation for 4 panels
- Add expansion from collapsed handlers

### Phase 4: Auto-Open Integration

- Update openSceneManager to auto-expand
- Wire up all entry points (cards, library, assets)
- Test scene selection workflows

### Phase 5: Default State & Polish

- Set sidebars to collapsed by default
- Add CSS transitions for collapse/expand
- Test responsive behavior
- Update mobile drawer mode

### Phase 6: Testing & Documentation

- Write unit tests for collapse logic
- Write integration tests for workflows
- Update layout documentation
- Capture visual regression baselines

## Styling Guidelines

### Critical: No Style Regressions

**IMPORTANT**: This feature is purely a layout restructuring. All existing styles, colors, backgrounds, and visual treatments must be preserved exactly as they are.

**Style Preservation Rules**:

1. **Reuse Existing Classes**: Use only existing CSS classes from the codebase
   - `panel-chat` for panel backgrounds
   - `border-border` for dividers
   - `btn-base`, `btn-ghost` for buttons
   - Existing layout utility classes

2. **No New Colors**: Do not introduce any new color values
   - Use existing CSS custom properties
   - Maintain current background colors
   - Keep existing border colors

3. **No New Backgrounds**: Maintain existing background treatments
   - Scene manager uses same `panel-chat` background as chat panel
   - Collapsed states use same `bg-card` as existing collapsed sidebar
   - No gradients, shadows, or new visual effects

4. **Minimal New CSS**: Only add CSS for:
   - Layout positioning (flexbox, widths)
   - Collapse/expand transitions (if needed, keep subtle)
   - Resizer handle positioning

5. **Reference Existing Patterns**:
   - Collapsed sidebar styling → apply same to collapsed scene manager
   - Chat panel styling → apply same to expanded scene manager
   - Existing resizer handles → reuse for new resizers

**Example of Correct Approach**:

```typescript
// GOOD: Reusing existing classes
<div className="panel-chat flex h-full w-full flex-col border-l border-border">

// BAD: Adding new custom styles
<div className="scene-manager-custom-bg shadow-xl rounded-lg">
```

### Visual Consistency Checklist

Before implementation, verify:

- [ ] Scene manager panel uses existing `panel-chat` class
- [ ] Collapsed state uses existing `bg-card` class
- [ ] Buttons use existing `btn-base` and `btn-ghost` classes
- [ ] Borders use existing `border-border` class
- [ ] No new color values added to CSS
- [ ] No new background treatments added
- [ ] Resizer handles match existing style
- [ ] Transitions (if any) are subtle and match existing patterns

 I

### Phase 1: State Management ! 2

- Add scene manager width/collapse state
- Add center panel collapse states
- Update storage keys and persistence logic
- **Style Note**: No visual changes, state only

### Phase 2: SceneManageDrawer Updates 1

- Add collapsed rendering mode using existing `bg-card` class
- Update panel variant to use existing `panel-chat` class
- Remove close button in panel mode (structural change only)
- Add collapse toggle button using existing `btn-base btn-ghost` classes
- **Style Note**: Reuse all existing component styles, no new CSS

### Phase 3: Resize Logic 2

- Implement collapse threshold detection (logic only)
- Add scene manager resize handler (reuse existing resize patterns)
- Update space calculation for 4 panels (logic only)
- Add expansion from collapsed handlers (logic only)
- **Style Note**: No visual changes, behavior only

### Phase 4: Auto-Open Integration 2

- Update openSceneManager to auto-expand (logic only)
- Wire up all entry points (cards, library, assets)
- Test scene selection workflows
- **Style Note**: No visual changes

### Phase 5: Default State & Polish 2

- Set sidebars to collapsed by default (state change only)
- Add CSS transitions ONLY if needed, keep minimal and subtle
- Test responsive behavior
- Update mobile drawer mode (preserve existing drawer styles)
- **Style Note**: Minimal CSS additions, preserve all existing styles

### Phase 6: Testing & Documentation 2

- Write unit tests for collapse logic
- Write integration tests for workflows
- Update layout documentation
- Capture visual regression baselines to ensure no style changes
- **Style Note**: Verify no visual regressions in tests
