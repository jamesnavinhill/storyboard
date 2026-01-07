# Design Document: Fix Drag-and-Drop Scene Reordering

## Overview

This design addresses the critical issues in the storyboard's drag-and-drop implementation by replacing the incorrect vertical list strategy with a proper rectangular grid strategy, removing manual DOM manipulation, and adding professional drag feedback through overlays and improved collision detection.

The solution leverages @dnd-kit's built-in capabilities correctly, allowing the library to handle positioning and transforms while we focus on grid layout stability and user experience.

## Architecture

### Component Structure

```
StoryboardPanel (DnD Context Owner)
├── DndContext (collision detection, sensors)
│   ├── SortableContext (scene IDs, rect strategy)
│   │   └── Grid Container (.storyboard-grid)
│   │       ├── DesktopSceneCard (sortable, individual scenes)
│   │       ├── StackedGroupCard (non-sortable, grouped scenes)
│   │       └── GhostSceneCard (non-sortable, add new)
│   └── DragOverlay (visual feedback)
│       └── SceneCardPreview (dragged card clone)
```

### Data Flow

1. **Drag Start**: User grabs drag handle → `onDragStart` → Store active scene ID
2. **Drag Move**: User moves cursor → dnd-kit calculates transforms → Cards update via inline styles
3. **Drag End**: User releases → `onDragEnd` → Calculate new order → Call `onReorderScenes` → Update state
4. **Drag Cancel**: User presses ESC → dnd-kit reverts positions → Clear active ID

### Key Design Decisions

**Decision 1: Use `rectSortingStrategy`**
- **Rationale**: Grid layout requires 2D positioning calculations
- **Alternative Considered**: `verticalListSortingStrategy` (current, incorrect)
- **Trade-offs**: None - this is the correct strategy for grids

**Decision 2: Inline Style Transforms**
- **Rationale**: Let dnd-kit manage positioning through React's render cycle
- **Alternative Considered**: Manual `useEffect` DOM manipulation (current, causes bugs)
- **Trade-offs**: None - inline styles are more reliable and React-idiomatic

**Decision 3: Add Drag Overlay**
- **Rationale**: Professional UX, prevents layout shifts during drag
- **Alternative Considered**: No overlay (current, causes visual glitches)
- **Trade-offs**: Slight complexity increase, but standard dnd-kit pattern

**Decision 4: Fixed Column Breakpoints**
- **Rationale**: Stable grid structure for predictable drag behavior
- **Alternative Considered**: `auto-fill` (current, causes instability)
- **Trade-offs**: Less fluid responsive behavior, but more predictable UX

**Decision 5: Separate Sortable Context**
- **Rationale**: Only individual scenes should be sortable, not stacked groups
- **Alternative Considered**: All items in one context (current, causes confusion)
- **Trade-offs**: Requires filtering logic, but clearer separation of concerns

## Components and Interfaces

### StoryboardPanel (Modified)

**New State:**
```typescript
const [activeId, setActiveId] = useState<string | null>(null);
```

**New Handlers:**
```typescript
const handleDragStart = (event: DragStartEvent) => {
  setActiveId(event.active.id as string);
};

const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  setActiveId(null);
  
  if (!over || !onReorderScenes || active.id === over.id) return;
  
  const oldIndex = scenes.findIndex(s => s.id === active.id);
  const newIndex = scenes.findIndex(s => s.id === over.id);
  
  if (oldIndex !== -1 && newIndex !== -1) {
    const reordered = arrayMove(scenes, oldIndex, newIndex);
    onReorderScenes(reordered.map(s => s.id));
  }
};

const handleDragCancel = () => {
  setActiveId(null);
};
```

**Updated DnD Context:**
```typescript
import { rectSortingStrategy } from '@dnd-kit/sortable';
import { rectIntersection, DragOverlay } from '@dnd-kit/core';

// Filter to only sortable scene IDs (exclude stacked groups)
const sortableSceneIds = useMemo(() => {
  return renderItems
    .filter(item => item.type === 'scene')
    .map(item => item.scene.id);
}, [renderItems]);

<DndContext
  sensors={sensors}
  collisionDetection={rectIntersection}
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
  onDragCancel={handleDragCancel}
>
  <SortableContext items={sortableSceneIds} strategy={rectSortingStrategy}>
    <div className="grid storyboard-grid gap-4 md:gap-6 lg:gap-8">
      {/* render items */}
    </div>
  </SortableContext>
  
  <DragOverlay dropAnimation={null}>
    {activeId ? (
      <SceneCardPreview 
        scene={scenes.find(s => s.id === activeId)!} 
      />
    ) : null}
  </DragOverlay>
</DndContext>
```

### DesktopSceneCard (Modified)

**Remove Manual Transform Logic:**
```typescript
// DELETE this entire useEffect:
// React.useEffect(() => {
//   const node = dragNodeRef.current;
//   if (!node) return;
//   node.style.transform = CSS.Transform.toString(transform);
//   ...
// }, [transform, transition, isDragging, isDragEnabled]);
```

**Apply Transforms via Inline Styles:**
```typescript
const {
  attributes,
  listeners,
  setNodeRef,
  transform,
  transition,
  isDragging,
} = useSortable({ id: scene.id, disabled: !isDragEnabled });

return (
  <div
    ref={setNodeRef}
    style={{
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }}
    {...attributes}
    className="scene-card group relative aspect-[16/9] w-full max-w-full bg-white/5 rounded-lg overflow-hidden"
  >
    {/* Drag handle */}
    {iconsVisible && isDragEnabled && (
      <button
        {...listeners}
        aria-label="Drag to reorder"
        className="p-1 rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <DragHandleIcon className="h-5 w-5" />
      </button>
    )}
    
    {/* rest of card content */}
  </div>
);
```

### SceneCardPreview (New Component)

**Purpose:** Render a simplified preview of the scene card in the drag overlay.

```typescript
interface SceneCardPreviewProps {
  scene: Scene;
}

export const SceneCardPreview: React.FC<SceneCardPreviewProps> = ({ scene }) => {
  return (
    <div 
      className="scene-card relative aspect-[16/9] w-full max-w-[640px] bg-white/5 rounded-lg overflow-hidden shadow-2xl"
      style={{ width: '400px' }} // Fixed width for overlay
    >
      {scene.videoUrl ? (
        <video
          src={scene.videoUrl}
          className="w-full h-full object-cover pointer-events-none"
          muted
        />
      ) : scene.imageUrl ? (
        <img
          src={scene.imageUrl}
          alt={scene.description}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-black flex items-center justify-center">
          <PhotoIcon className="w-12 h-12 text-white/50" />
        </div>
      )}
      
      {/* Optional: Scene number badge */}
      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
        Scene {scene.id.substring(0, 4)}
      </div>
    </div>
  );
};
```

### CSS Grid Updates

**utilities.css - Stable Grid Layout:**
```css
/* Storyboard grid with fixed column breakpoints */
.storyboard-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1rem;
  justify-items: center;
}

@media (min-width: 768px) {
  .storyboard-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
}

@media (min-width: 1280px) {
  .storyboard-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }
}

@media (min-width: 1920px) {
  .storyboard-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Scene card sizing */
.scene-card {
  width: 100%;
  max-width: 640px;
  margin-left: auto;
  margin-right: auto;
}

/* Drag cursor states */
.cursor-grab {
  cursor: grab;
}

.cursor-grabbing {
  cursor: grabbing;
}

/* Drag overlay styling */
.dnd-overlay {
  z-index: 9999;
  pointer-events: none;
}
```

## Data Models

### DnD State

```typescript
interface DragState {
  activeId: string | null;  // ID of currently dragged scene
}

interface SortableSceneIds {
  ids: string[];  // Only individual scene IDs, no stacked groups
}
```

### Scene Positioning

```typescript
// Scenes maintain their order via orderIndex in database
// DnD operations update this order through onReorderScenes callback

interface SceneOrder {
  sceneId: string;
  orderIndex: number;
}
```

## Error Handling

### Drag State Management

**Scene Card Panels vs Manager Drawer:**
- **Scene Card Panels** (Edit/Animate): Overlay on individual scene cards - drag DISABLED for that specific card
- **Manager Drawer**: Left-side drawer for managing scene properties - drag ENABLED for all cards

The `isDragEnabled` prop in `DesktopSceneCard` is controlled by checking if that specific scene has panels open:
```typescript
// In StoryboardPanel or parent component
const isDragEnabled = !scene.uiState.panels.edit && !scene.uiState.panels.animate;
```

The manager drawer state does NOT affect drag functionality. Users can drag and reorder scenes while the manager drawer is open.

### Drag Operation Failures

**Scenario 1: Network Error During Reorder**
```typescript
const handleDragEnd = async (event: DragEndEvent) => {
  // ... calculate new order
  
  try {
    await onReorderScenes(newSceneIds);
  } catch (error) {
    console.error('Reorder failed:', error);
    showToast({
      variant: 'error',
      description: 'Failed to reorder scenes. Please try again.',
    });
    // State will revert automatically on next render
  }
};
```

**Scenario 2: Invalid Drop Target**
```typescript
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  
  if (!over) {
    // No valid drop target - dnd-kit will revert automatically
    return;
  }
  
  // ... proceed with reorder
};
```

**Scenario 3: Drag Interrupted**
```typescript
const handleDragCancel = () => {
  setActiveId(null);
  // dnd-kit automatically reverts positions
};
```

### Grid Layout Edge Cases

**Scenario 1: Single Scene**
- Grid displays single column
- Drag still works but has no effect (only one item)

**Scenario 2: Viewport Resize During Drag**
- Column count may change at breakpoint
- dnd-kit recalculates positions automatically
- Drag operation continues smoothly

**Scenario 3: Filter Applied During Drag**
- Should not happen (filters are separate UI)
- If it does, drag cancels and grid updates

## Testing Strategy

### Unit Tests

**Test 1: Sorting Strategy**
```typescript
describe('StoryboardPanel DnD', () => {
  it('should use rectSortingStrategy for grid layout', () => {
    const { container } = render(<StoryboardPanel {...props} />);
    const sortableContext = container.querySelector('[data-sortable-context]');
    expect(sortableContext).toHaveAttribute('data-strategy', 'rect');
  });
});
```

**Test 2: Transform Application**
```typescript
describe('DesktopSceneCard', () => {
  it('should apply transforms via inline styles', () => {
    const { container } = render(<DesktopSceneCard {...props} />);
    const card = container.querySelector('.scene-card');
    expect(card).toHaveStyle({ transform: 'translate3d(0, 0, 0)' });
  });
  
  it('should not use useEffect for transform manipulation', () => {
    // Verify no manual style manipulation in component code
    const source = DesktopSceneCard.toString();
    expect(source).not.toContain('node.style.transform');
  });
});
```

**Test 3: Drag Overlay**
```typescript
describe('DragOverlay', () => {
  it('should render preview when dragging', () => {
    const { getByTestId } = render(<StoryboardPanel {...props} />);
    
    // Simulate drag start
    fireEvent.dragStart(getByTestId('scene-card-1'));
    
    expect(getByTestId('drag-overlay')).toBeInTheDocument();
    expect(getByTestId('scene-preview-1')).toBeInTheDocument();
  });
  
  it('should hide preview when drag ends', () => {
    const { getByTestId, queryByTestId } = render(<StoryboardPanel {...props} />);
    
    fireEvent.dragStart(getByTestId('scene-card-1'));
    fireEvent.dragEnd(getByTestId('scene-card-1'));
    
    expect(queryByTestId('drag-overlay')).not.toBeInTheDocument();
  });
});
```

### Integration Tests

**Test 1: Reorder Scenes**
```typescript
it('should reorder scenes when dragged', async () => {
  const onReorderScenes = jest.fn();
  const { getByTestId } = render(
    <StoryboardPanel scenes={mockScenes} onReorderScenes={onReorderScenes} />
  );
  
  // Drag scene 1 to scene 3's position
  await dragAndDrop(getByTestId('scene-1'), getByTestId('scene-3'));
  
  expect(onReorderScenes).toHaveBeenCalledWith(['scene-2', 'scene-3', 'scene-1']);
});
```

**Test 2: Keyboard Reordering**
```typescript
it('should reorder scenes with keyboard', async () => {
  const onReorderScenes = jest.fn();
  const { getByLabelText } = render(
    <StoryboardPanel scenes={mockScenes} onReorderScenes={onReorderScenes} />
  );
  
  const dragHandle = getByLabelText('Drag to reorder');
  dragHandle.focus();
  
  fireEvent.keyDown(dragHandle, { key: 'ArrowDown' });
  
  expect(onReorderScenes).toHaveBeenCalled();
});
```

**Test 3: Stacked Groups**
```typescript
it('should not include stacked groups in sortable context', () => {
  const { container } = render(
    <StoryboardPanel 
      scenes={mockScenes} 
      groups={mockGroups}
      stackedGroups={new Set(['group-1'])}
    />
  );
  
  const sortableItems = container.querySelectorAll('[data-sortable-item]');
  const stackedGroup = container.querySelector('[data-stacked-group="group-1"]');
  
  expect(stackedGroup).not.toHaveAttribute('data-sortable-item');
  expect(sortableItems.length).toBe(mockScenes.length - groupedSceneCount);
});
```

### Manual Testing Scenarios

1. **Basic Drag**: Drag scene from position 1 to position 5
2. **Cross-Column Drag**: Drag scene from left column to right column
3. **Rapid Drags**: Perform 5 quick drag operations in succession
4. **Keyboard Drag**: Use arrow keys to reorder scenes
5. **Cancel Drag**: Press ESC during drag operation
6. **Resize During Drag**: Resize window while dragging
7. **Filter + Drag**: Apply filter, then drag filtered scenes
8. **Stacked Groups**: Verify stacked groups don't interfere with drag
9. **Panel Open**: Verify drag disabled when edit/animate panel open
10. **Network Failure**: Simulate API failure during reorder

### Performance Testing

**Metrics to Track:**
- Drag operation frame rate (target: 60fps)
- Time to complete reorder (target: <100ms)
- Memory usage during drag (target: no leaks)
- Render count during drag (target: minimal re-renders)

**Test with:**
- 10 scenes (baseline)
- 50 scenes (typical)
- 100 scenes (stress test)
- 200 scenes (extreme)

## Accessibility Considerations

### Keyboard Navigation

- Drag handles focusable via Tab key
- Arrow keys move scenes in grid order
- Space/Enter activates keyboard drag mode
- Escape cancels drag operation
- Focus returns to moved item after reorder

### Screen Reader Announcements

```typescript
// Add ARIA live region for announcements
<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
  {dragAnnouncement}
</div>

// Update announcement during drag
const dragAnnouncement = useMemo(() => {
  if (!activeId) return '';
  const scene = scenes.find(s => s.id === activeId);
  const position = scenes.findIndex(s => s.id === activeId) + 1;
  return `Dragging scene ${position} of ${scenes.length}. Use arrow keys to move, Enter to drop, Escape to cancel.`;
}, [activeId, scenes]);
```

### Visual Indicators

- High contrast drag handles
- Clear focus indicators
- Visible drop zones during drag
- Cursor changes (grab/grabbing)

## Migration Plan

### Phase 1: Core Fixes (Priority 1)
1. Replace `verticalListSortingStrategy` with `rectSortingStrategy`
2. Remove manual transform `useEffect` in `DesktopSceneCard`
3. Apply transforms via inline styles
4. Test basic drag operations

### Phase 2: Visual Enhancements (Priority 2)
1. Add `DragOverlay` component
2. Create `SceneCardPreview` component
3. Update collision detection to `rectIntersection`
4. Test drag overlay behavior

### Phase 3: Grid Stabilization (Priority 3)
1. Replace `auto-fill` with fixed breakpoints
2. Update CSS grid rules
3. Test responsive behavior
4. Verify no layout shifts during drag

### Phase 4: Advanced Features (Priority 4)
1. Filter sortable items (exclude stacked groups)
2. Add keyboard drag announcements
3. Implement error recovery
4. Performance optimization

### Rollback Plan

If issues arise:
1. Revert to previous commit
2. Disable drag functionality via feature flag
3. Display "Reordering temporarily disabled" message
4. Investigate and fix issues in development
5. Re-deploy with fixes

## Performance Considerations

### Optimization Strategies

**1. Memoization**
```typescript
const sortableSceneIds = useMemo(
  () => renderItems.filter(i => i.type === 'scene').map(i => i.scene.id),
  [renderItems]
);
```

**2. Virtualization (Future)**
For 100+ scenes, consider react-window or react-virtual:
```typescript
import { useVirtual } from 'react-virtual';

const virtualizer = useVirtual({
  size: scenes.length,
  parentRef: containerRef,
  estimateSize: useCallback(() => 300, []), // Estimated card height
});
```

**3. GPU Acceleration**
Already using CSS transforms (GPU-accelerated):
```css
.scene-card {
  transform: translate3d(0, 0, 0); /* Force GPU layer */
  will-change: transform; /* Hint to browser */
}
```

**4. Debounced Reorder API**
```typescript
const debouncedReorder = useMemo(
  () => debounce(onReorderScenes, 300),
  [onReorderScenes]
);
```

## Security Considerations

### Input Validation

- Validate scene IDs before reordering
- Ensure user has permission to reorder scenes
- Prevent reordering scenes from other projects

### API Security

```typescript
// Server-side validation
async function reorderScenes(projectId: string, sceneIds: string[], userId: string) {
  // Verify user owns project
  const project = await getProject(projectId);
  if (project.userId !== userId) {
    throw new UnauthorizedError();
  }
  
  // Verify all scene IDs belong to project
  const scenes = await getScenes(projectId);
  const validIds = new Set(scenes.map(s => s.id));
  const allValid = sceneIds.every(id => validIds.has(id));
  
  if (!allValid) {
    throw new BadRequestError('Invalid scene IDs');
  }
  
  // Proceed with reorder
  await updateSceneOrder(projectId, sceneIds);
}
```

## Future Enhancements

1. **Multi-Select Drag**: Drag multiple scenes at once
2. **Drag Between Projects**: Copy scenes to other projects
3. **Undo/Redo**: Revert reorder operations
4. **Drag Animations**: Custom spring animations for drops
5. **Touch Gestures**: Improved mobile drag experience
6. **Drag Constraints**: Prevent dragging to certain positions
7. **Batch Operations**: Reorder multiple scenes via keyboard shortcuts
