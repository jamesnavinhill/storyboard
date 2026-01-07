# Design Document

## Overview

The gallery view currently displays assets filtered by the `projectId` prop passed to `AssetsTab`, which comes from `LibraryPanel`. The issue is that `LibraryPanel` receives its `activeProjectId` from the parent component, and this value can be influenced by sidebar navigation state rather than the true app-level active project.

The solution is to ensure that when `LibraryPanel` renders in "full" variant (gallery view), it always receives the app-level `activeProjectId` from `AppShellState`, not any temporary navigation state from the sidebar.

## Architecture

### Current Flow (Problematic)

```
AppShell
  └─> DesktopLayout
      ├─> AppSidebar (sidebar variant)
      │   └─> LibraryPanel (variant="sidebar")
      │       └─> ProjectsTab (shows collapsible projects)
      │
      └─> Main Content Area
          └─> LibraryPanel (variant="full", activeProjectId from props)
              └─> AssetsTab (receives projectId)
                  └─> AssetManager (loads assets for projectId)
```

The problem: Both `LibraryPanel` instances receive the same `activeProjectId` prop, which can be affected by sidebar interactions.

### Proposed Flow (Fixed)

```
AppShell (appState.project.activeProjectId)
  └─> DesktopLayout
      ├─> AppSidebar (sidebar variant)
      │   └─> LibraryPanel (variant="sidebar", activeProjectId for display only)
      │       └─> ProjectsTab (shows collapsible projects)
      │
      └─> Main Content Area
          └─> LibraryPanel (variant="full", activeProjectId from appState.project)
              └─> AssetsTab (receives activeProjectId)
                  └─> AssetManager (loads assets for activeProjectId)
```

The fix: Gallery view `LibraryPanel` always receives `appState.project.activeProjectId` directly, ensuring it reflects the true active project.

## Components and Interfaces

### LibraryPanel Component

**Current Interface:**
```typescript
export interface LibraryPanelProps {
  variant: "sidebar" | "full";
  activeProjectId: string | null;
  // ... other props
}
```

**No changes needed** - The interface is correct. The issue is in how the prop is passed from parent components.

### AssetsTab Component

**Current Interface:**
```typescript
export interface AssetsTabProps {
  projectId: string | null;
  scenes: Array<{ id: string; description: string }>;
  // ... other props
}
```

**No changes needed** - This component correctly passes `projectId` to `AssetManager`.

### AssetManager Component

**Current Behavior:**
- Loads assets when `projectId` prop changes
- Uses `useEffect` with `projectId` as dependency
- Correctly filters assets by project

**No changes needed** - This component already works correctly when given the right `projectId`.

## Data Flow

### Key State Sources

1. **App-level Active Project**: `appState.project.activeProjectId`
   - Source of truth for which project is currently active
   - Updated when user selects a project via `onSelectProject`
   - Should drive gallery view content

2. **Library State**: `appState.library`
   - Manages UI state (tabs, search, view modes)
   - Does NOT manage project selection
   - Independent of active project

3. **Sidebar Navigation**: Local to sidebar component
   - May involve hovering, expanding, or clicking projects
   - Should NOT affect gallery view
   - Only affects sidebar display

### Prop Flow Changes

#### AppShell.tsx
No changes needed - already provides `appState.project.activeProjectId` to layouts.

#### DesktopLayout.tsx
**Current:**
```typescript
<LibraryPanel
  variant="full"
  activeProjectId={activeProjectId}  // From props
  // ...
/>
```

**Should be:**
```typescript
<LibraryPanel
  variant="full"
  activeProjectId={activeProjectId}  // Ensure this is appState.project.activeProjectId
  // ...
/>
```

Verify that `activeProjectId` prop in `DesktopLayout` comes from `appState.project.activeProjectId`.

#### AppSidebar.tsx
**Current:**
```typescript
<LibraryPanel
  variant="sidebar"
  activeProjectId={activeProjectId}  // From props
  // ...
/>
```

**Should remain the same** - Sidebar can show the active project for visual indication, but its navigation shouldn't affect gallery.

## Error Handling

### No Active Project
- `AssetManager` already handles `projectId === null` case
- Displays empty state: "No project selected"
- No changes needed

### Project Deleted While Viewing
- Handled by existing project state management
- `activeProjectId` becomes `null` when project is deleted
- Gallery view shows empty state

### Asset Loading Errors
- Already handled by `AssetManager`
- Logs error to console
- Shows empty state or previous assets

## Testing Strategy

### Manual Testing
1. Open gallery view (assets tab in full library panel)
2. Verify assets from active project are displayed
3. Navigate in sidebar (hover, click different projects)
4. Verify gallery view content does NOT change
5. Actually select a different project (via `onSelectProject`)
6. Verify gallery view updates to show new project's assets

### Component Testing
1. Test `LibraryPanel` with different `activeProjectId` values
2. Verify `AssetsTab` receives correct `projectId`
3. Test `AssetManager` loads assets for given `projectId`
4. Verify `AssetManager` reloads when `projectId` changes

### Integration Testing
1. Test full flow from project selection to asset display
2. Verify sidebar navigation doesn't trigger asset reloads
3. Verify actual project selection triggers asset reload

## Implementation Notes

### Key Files to Review

1. **src/features/app-shell/components/DesktopLayout.tsx**
   - Verify `activeProjectId` prop source
   - Ensure it comes from `appState.project.activeProjectId`

2. **src/features/app-shell/components/AppSidebar.tsx**
   - Verify sidebar doesn't modify active project state
   - Ensure sidebar navigation is local only

3. **src/features/library/components/LibraryPanel.tsx**
   - No changes expected
   - Verify it correctly passes `activeProjectId` to `AssetsTab`

4. **src/features/library/components/AssetsTab.tsx**
   - No changes expected
   - Verify it correctly passes `projectId` to `AssetManager`

### Potential Issues

1. **Multiple Sources of Truth**
   - If sidebar maintains its own "selected project" state separate from app-level state
   - Solution: Sidebar should only use app-level `activeProjectId` for display

2. **Event Handlers**
   - If sidebar click handlers call `onSelectProject` for navigation
   - Solution: Distinguish between "navigate/preview" and "select/activate"

3. **Prop Drilling**
   - If `activeProjectId` is passed through many layers
   - Solution: Trace prop flow to ensure correct source at each level

## Migration Path

1. **Audit Current Behavior**
   - Test current gallery view behavior
   - Document when it incorrectly updates
   - Identify which user actions trigger unwanted updates

2. **Trace Prop Flow**
   - Follow `activeProjectId` from `AppShell` to `AssetManager`
   - Identify where incorrect value is introduced
   - Document the prop chain

3. **Fix Prop Sources**
   - Update components to use correct `activeProjectId` source
   - Ensure gallery view always uses `appState.project.activeProjectId`
   - Ensure sidebar navigation doesn't modify app-level state

4. **Verify Fix**
   - Test gallery view with sidebar navigation
   - Confirm assets don't change on sidebar interaction
   - Confirm assets update on actual project selection

5. **Add Safeguards**
   - Consider adding prop validation
   - Add comments documenting correct prop sources
   - Update component documentation
