# Design Document: Monolithic File Refactor

## Overview

This design decomposes the 2035-line `AppShell.tsx` and other monolithic files into focused, maintainable modules. The refactor follows a feature-first architecture where related functionality is co-located, and applies the single-responsibility principle to ensure each module has one clear purpose.

The key insight is that `AppShell` currently does too much: it manages layout state, orchestrates features, handles events, renders UI, and persists preferences. We'll separate these concerns into dedicated modules that can be developed, tested, and understood independently.

## Architecture

### High-Level Structure

```
src/
├── features/
│   ├── app-shell/
│   │   ├── AppShell.tsx              (< 300 lines - composition only)
│   │   ├── components/
│   │   │   ├── MobileLayout.tsx      (Mobile-specific layout)
│   │   │   ├── DesktopLayout.tsx     (Desktop-specific layout)
│   │   │   └── AppSidebar.tsx        (Sidebar component)
│   │   └── hooks/
│   │       ├── useAppShellState.ts   (Orchestrates all feature hooks)
│   │       └── useSessionOverrides.ts (Session-only settings)
│   ├── layout/
│   │   ├── hooks/
│   │   │   ├── useLayout.ts          (Main layout state hook)
│   │   │   ├── useResizablePanel.ts  (Resizing logic)
│   │   │   ├── useCollapsiblePanel.ts (Collapse/expand logic)
│   │   │   └── useLayoutPersistence.ts (LocalStorage sync)
│   │   ├── components/
│   │   │   ├── ResizablePanel.tsx    (Reusable resizable panel)
│   │   │   ├── PanelResizer.tsx      (Drag handle component)
│   │   │   └── CollapsiblePanel.tsx  (Panel with collapse button)
│   │   ├── utils/
│   │   │   ├── layoutCalculations.ts (Space calculation utilities)
│   │   │   └── layoutConstants.ts    (Moved from config/layout)
│   │   └── types.ts                  (Layout-specific types)
│   ├── library/
│   │   ├── components/
│   │   │   ├── LibraryPanel.tsx      (Main library panel)
│   │   │   ├── ProjectsTab.tsx       (Projects view)
│   │   │   ├── AssetsTab.tsx         (Assets view)
│   │   │   └── LibraryToolbar.tsx    (Search, filters, view toggle)
│   │   └── hooks/
│   │       ├── useLibraryState.ts    (Library UI state)
│   │       └── useLibraryFilters.ts  (Search and filter logic)
│   ├── scene/
│   │   ├── hooks/
│   │   │   ├── useSceneActions.ts    (Scene CRUD operations)
│   │   │   ├── useSceneManager.ts    (Scene manager drawer state)
│   │   │   └── useSceneHistory.ts    (History loading/restore)
│   │   └── components/
│   │       └── SceneManagerDrawer/   (Refactored drawer)
│   │           ├── index.tsx         (< 400 lines)
│   │           ├── DetailsTab.tsx
│   │           ├── GroupsTagsTab.tsx
│   │           └── HistoryTab.tsx
│   └── project/
│       └── hooks/
│           └── useProjectActions.ts  (Project CRUD operations)
└── components/
    └── LeftManagerDrawer/
        ├── index.tsx                 (< 400 lines - composition)
        ├── LibraryTab.tsx
        ├── DetailsTab.tsx
        ├── GroupsTagsTab.tsx
        └── HistoryTab.tsx
```

### Dependency Flow

```
AppShell (composition layer)
    ↓
Feature Hooks (useAppShellState, useLayout, useSceneActions, etc.)
    ↓
Services & Stores (projectStore, layoutStore, etc.)
    ↓
API/Storage Layer
```

**Key Principles:**
- Features don't import from other features
- Shared utilities are in `src/utils/`
- Shared components are in `src/components/`
- Layout is a separate feature, not mixed with app-shell

## Components and Interfaces

### 1. AppShell Refactor

**Current:** 2035 lines mixing everything
**Target:** < 300 lines, composition only

```typescript
// src/features/app-shell/AppShell.tsx
export const AppShell: React.FC = () => {
  // Single hook that orchestrates all features
  const appState = useAppShellState();
  
  // Theme is simple enough to stay here
  const { theme, toggleTheme } = useTheme();
  
  // Determine layout mode
  const isMobile = appState.layout.isMobileLayout;
  
  return (
    <div className="app-container h-screen overflow-hidden">
      {isMobile ? (
        <MobileLayout
          appState={appState}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      ) : (
        <DesktopLayout
          appState={appState}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}
      
      {/* Global modals/sheets */}
      <SettingsSheet
        isOpen={appState.ui.isSettingsOpen}
        onClose={appState.ui.closeSettings}
        settings={appState.project.settings}
        onSave={appState.project.updateSettings}
      />
      
      <SceneManagerDrawer
        isOpen={appState.scene.isManagerOpen}
        scene={appState.scene.selectedScene}
        onClose={appState.scene.closeManager}
        {...appState.scene.managerProps}
      />
    </div>
  );
};
```

**Key Changes:**
- All state management delegated to `useAppShellState`
- Layout rendering delegated to `MobileLayout` and `DesktopLayout`
- No event handlers defined here (all in hooks)
- No useState calls (all in feature hooks)

### 2. useAppShellState Hook

This hook orchestrates all feature hooks and provides a unified interface to AppShell.

```typescript
// src/features/app-shell/hooks/useAppShellState.ts
export interface AppShellState {
  project: ProjectState;
  layout: LayoutState;
  scene: SceneState;
  library: LibraryState;
  chat: ChatState;
  media: MediaState;
  ui: UIState;
}

export const useAppShellState = (): AppShellState => {
  // Session-only overrides (not persisted)
  const [sessionOverrides, setSessionOverrides] = useSessionOverrides();
  
  // Core project state
  const projectState = useProjectState({
    defaultSettings,
    welcomeMessage,
  });
  
  // Layout management
  const layout = useLayout();
  
  // Feature-specific state
  const scene = useSceneManager({ projectState });
  const library = useLibraryState({ projectState });
  const chat = useChatState({ projectState, sessionOverrides });
  const media = useMediaState({ projectState, sessionOverrides });
  
  // UI state (modals, sheets, etc.)
  const ui = useUIState();
  
  // Bridge store toasts to UI
  useToastBridge(projectState.__toasts, projectState.__dequeueToast);
  
  return {
    project: projectState,
    layout,
    scene,
    library,
    chat,
    media,
    ui,
  };
};
```

**Benefits:**
- Single source of truth for app state
- Easy to test (mock individual hooks)
- Clear separation of concerns
- Can add new features without modifying AppShell

### 3. Layout Feature Module

**Purpose:** Manage all resizable panel logic, collapse/expand, and persistence.

```typescript
// src/features/layout/hooks/useLayout.ts
export interface LayoutState {
  // Dimensions
  sidebarWidth: number;
  chatWidth: number;
  sceneManagerWidth: number;
  
  // Collapse states
  isSidebarCollapsed: boolean;
  isChatCollapsed: boolean;
  isStoryboardCollapsed: boolean;
  isSceneManagerCollapsed: boolean;
  
  // Responsive
  isMobileLayout: boolean;
  
  // Actions
  setSidebarWidth: (width: number) => void;
  setChatWidth: (width: number) => void;
  setSceneManagerWidth: (width: number) => void;
  toggleSidebarCollapse: () => void;
  toggleChatCollapse: () => void;
  toggleSceneManagerCollapse: () => void;
  
  // Resize handlers
  startResize: (target: PanelTarget) => (e: React.PointerEvent) => void;
  
  // Layout calculations
  calculateAvailableSpace: (containerWidth: number) => SpaceAllocation;
}

export const useLayout = (): LayoutState => {
  // Delegate to specialized hooks
  const dimensions = useLayoutDimensions();
  const collapse = useCollapsiblePanels();
  const resize = useResizablePanel();
  const responsive = useResponsiveLayout();
  
  // Persist to localStorage
  useLayoutPersistence({
    dimensions,
    collapse,
  });
  
  return {
    ...dimensions,
    ...collapse,
    ...resize,
    ...responsive,
  };
};
```

**Sub-hooks:**

```typescript
// src/features/layout/hooks/useLayoutDimensions.ts
export const useLayoutDimensions = () => {
  const [sidebarWidth, setSidebarWidth] = useState(() =>
    loadStoredDimension('sidebar', 288, MIN_WIDTH, MAX_WIDTH)
  );
  // ... similar for chat and scene manager
  
  return { sidebarWidth, setSidebarWidth, /* ... */ };
};

// src/features/layout/hooks/useCollapsiblePanels.ts
export const useCollapsiblePanels = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(() =>
    loadStoredBoolean('sidebarCollapsed', false)
  );
  // ... similar for other panels
  
  const toggleSidebarCollapse = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);
  
  return { isSidebarCollapsed, toggleSidebarCollapse, /* ... */ };
};

// src/features/layout/hooks/useResizablePanel.ts
export const useResizablePanel = (dimensions, collapse) => {
  const startResize = useCallback((target: PanelTarget) => 
    (event: React.PointerEvent) => {
      // Resize logic extracted from AppShell
      // ...
    },
    [dimensions, collapse]
  );
  
  return { startResize };
};
```

**Benefits:**
- Layout logic completely isolated
- Easy to test resize calculations
- Can swap layout implementations
- No layout code in AppShell

### 4. Scene Actions Hook

**Purpose:** Group all scene-related event handlers.

```typescript
// src/features/scene/hooks/useSceneActions.ts
export interface SceneActions {
  // CRUD
  updateScene: (id: string, updates: Partial<Scene>) => Promise<void>;
  duplicateScene: (id: string) => Promise<void>;
  createManualScene: (description: string, aspectRatio: AspectRatio) => Promise<void>;
  
  // Groups & Tags
  assignGroup: (sceneId: string, groupId: string | null) => Promise<void>;
  addTag: (sceneId: string, tagId: string) => Promise<void>;
  removeTag: (sceneId: string, tagId: string) => Promise<void>;
  
  // Reordering
  reorderScenes: (sceneIds: string[]) => Promise<void>;
  
  // Export
  exportImage: (imageUrl: string, description: string) => void;
  exportAllImages: () => void;
}

export const useSceneActions = (projectState): SceneActions => {
  const { projectStorage } = useServices();
  const { showToast } = useToast();
  
  const updateScene = useCallback(async (id, updates) => {
    if (!projectState.activeProjectId) return;
    try {
      const updated = await projectStorage.updateScene(
        projectState.activeProjectId,
        id,
        updates
      );
      projectState.updateSceneRecord(updated);
      showToast({ variant: 'success', description: 'Scene updated' });
    } catch (error) {
      console.error('Failed to update scene', error);
      showToast({ variant: 'error', description: 'Update failed' });
    }
  }, [projectState, projectStorage, showToast]);
  
  // ... other handlers
  
  return {
    updateScene,
    duplicateScene,
    // ...
  };
};
```

**Benefits:**
- All scene handlers in one place
- Easy to find and modify
- Can be tested independently
- Clear interface for consumers

### 5. Scene Manager Hook

**Purpose:** Manage scene manager drawer state and history.

```typescript
// src/features/scene/hooks/useSceneManager.ts
export interface SceneManagerState {
  // Selection
  selectedSceneId: string | null;
  selectedScene: Scene | null;
  sceneNumber: number | null;
  
  // Drawer state
  isManagerOpen: boolean;
  activeTab: SceneManagerTab;
  groupTagSubTab: GroupTagTab;
  
  // History
  historyEntries: SceneHistoryEntry[];
  isHistoryLoading: boolean;
  historyError: string | null;
  restoringHistoryId: string | null;
  
  // Actions
  openManager: (sceneId: string, options?: OpenOptions) => void;
  closeManager: () => void;
  setActiveTab: (tab: SceneManagerTab) => void;
  loadHistory: () => Promise<void>;
  restoreFromHistory: (historyId: string) => Promise<void>;
  
  // Props for drawer component
  managerProps: SceneManagerDrawerProps;
}

export const useSceneManager = ({ projectState }): SceneManagerState => {
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SceneManagerTab>('details');
  
  // Use dedicated history hook
  const history = useSceneHistory(selectedSceneId, projectState);
  
  const openManager = useCallback((sceneId, options) => {
    setSelectedSceneId(sceneId);
    if (options?.tab) setActiveTab(options.tab);
  }, []);
  
  const closeManager = useCallback(() => {
    setSelectedSceneId(null);
    history.clear();
  }, [history]);
  
  // Compute derived state
  const selectedScene = useMemo(() =>
    projectState.scenes.find(s => s.id === selectedSceneId) ?? null,
    [projectState.scenes, selectedSceneId]
  );
  
  const sceneNumber = useMemo(() => {
    if (!selectedSceneId) return null;
    const index = projectState.scenes.findIndex(s => s.id === selectedSceneId);
    return index >= 0 ? index + 1 : null;
  }, [selectedSceneId, projectState.scenes]);
  
  return {
    selectedSceneId,
    selectedScene,
    sceneNumber,
    isManagerOpen: selectedSceneId !== null,
    activeTab,
    ...history,
    openManager,
    closeManager,
    setActiveTab,
    managerProps: {
      scene: selectedScene,
      sceneNumber,
      activeTab,
      onClose: closeManager,
      // ... other props
    },
  };
};
```

### 6. Library Panel Component

**Purpose:** Extract library rendering from AppShell.

```typescript
// src/features/library/components/LibraryPanel.tsx
export interface LibraryPanelProps {
  variant: 'sidebar' | 'full';
  projects: ProjectSummary[];
  scenes: Scene[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onProjectAction: ProjectActions;
  // ... other props
}

export const LibraryPanel: React.FC<LibraryPanelProps> = ({
  variant,
  projects,
  scenes,
  activeProjectId,
  onSelectProject,
  onProjectAction,
}) => {
  const library = useLibraryState();
  
  const isSidebar = variant === 'sidebar';
  
  return (
    <div className={cn('library-panel', isSidebar && 'library-panel--sidebar')}>
      <LibraryToolbar
        variant={variant}
        activeTab={library.activeTab}
        onTabChange={library.setActiveTab}
        searchQuery={library.searchQuery}
        onSearchChange={library.setSearchQuery}
        viewMode={library.viewMode}
        onViewModeChange={library.setViewMode}
      />
      
      <div className="library-content">
        {library.activeTab === 'projects' ? (
          <ProjectsTab
            projects={library.filteredProjects}
            activeProjectId={activeProjectId}
            viewMode={library.viewMode}
            onSelect={onSelectProject}
            onAction={onProjectAction}
          />
        ) : (
          <AssetsTab
            scenes={library.filteredScenes}
            viewMode={library.viewMode}
            onAction={onProjectAction}
          />
        )}
      </div>
    </div>
  );
};
```

### 7. Mobile and Desktop Layouts

**Purpose:** Separate mobile and desktop rendering logic.

```typescript
// src/features/app-shell/components/MobileLayout.tsx
export const MobileLayout: React.FC<MobileLayoutProps> = ({
  appState,
  theme,
  onToggleTheme,
}) => {
  return (
    <div className="flex h-full flex-col">
      <MobileHeader
        project={appState.project}
        currentView={appState.ui.currentView}
        onViewChange={appState.ui.setCurrentView}
        onNewProject={appState.project.createProject}
        onExportAll={appState.scene.exportAllImages}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
      
      <main className="flex-1 overflow-hidden">
        <ChatPanel
          {...appState.chat.chatPanelProps}
          mobileView={appState.ui.mobileView}
          setMobileView={appState.ui.setMobileView}
        >
          {appState.ui.currentView === 'library' ? (
            <LibraryPanel
              variant="full"
              {...appState.library.libraryPanelProps}
            />
          ) : (
            <StoryboardPanel
              scenes={appState.project.filteredScenes}
              {...appState.scene.storyboardProps}
            />
          )}
        </ChatPanel>
      </main>
    </div>
  );
};

// src/features/app-shell/components/DesktopLayout.tsx
export const DesktopLayout: React.FC<DesktopLayoutProps> = ({
  appState,
  theme,
  onToggleTheme,
}) => {
  const { layout } = appState;
  
  return (
    <div className="layout-desktop flex h-full overflow-hidden">
      <ResizablePanel
        width={layout.sidebarWidth}
        isCollapsed={layout.isSidebarCollapsed}
        onResize={layout.startResize('sidebar')}
        onToggleCollapse={layout.toggleSidebarCollapse}
        position="left"
      >
        <AppSidebar
          {...appState.library.sidebarProps}
          theme={theme}
          onToggleTheme={onToggleTheme}
        />
      </ResizablePanel>
      
      <PanelResizer onResize={layout.startResize('sidebar')} />
      
      <ResizablePanel
        width={layout.chatWidth}
        isCollapsed={layout.isChatCollapsed}
        onToggleCollapse={layout.toggleChatCollapse}
        position="left"
      >
        <ChatPanel {...appState.chat.chatPanelProps} />
      </ResizablePanel>
      
      <PanelResizer onResize={layout.startResize('chat')} />
      
      <div className="flex-1 min-w-0">
        <StoryboardPanel
          scenes={appState.project.filteredScenes}
          {...appState.scene.storyboardProps}
        />
      </div>
      
      <PanelResizer onResize={layout.startResize('sceneManager')} />
      
      <ResizablePanel
        width={layout.sceneManagerWidth}
        isCollapsed={layout.isSceneManagerCollapsed}
        onToggleCollapse={layout.toggleSceneManagerCollapse}
        position="right"
      >
        <SceneManagerPanel {...appState.scene.managerProps} />
      </ResizablePanel>
    </div>
  );
};
```

### 8. LeftManagerDrawer Refactor

**Current:** 1255 lines
**Target:** < 400 lines

```typescript
// src/components/LeftManagerDrawer/index.tsx
export const LeftManagerDrawer: React.FC<LeftManagerDrawerProps> = (props) => {
  // Tab state management extracted to hook
  const tabs = useDrawerTabs();
  
  return (
    <div className="left-manager-drawer">
      <DrawerHeader
        activeTab={tabs.activeTab}
        onTabChange={tabs.setActiveTab}
      />
      
      <DrawerContent>
        {tabs.activeTab === 'library' && (
          <LibraryTab {...props} />
        )}
        {tabs.activeTab === 'details' && (
          <DetailsTab {...props} />
        )}
        {tabs.activeTab === 'groups-tags' && (
          <GroupsTagsTab
            {...props}
            subTab={tabs.groupTagSubTab}
            onSubTabChange={tabs.setGroupTagSubTab}
          />
        )}
        {tabs.activeTab === 'history' && (
          <HistoryTab {...props} />
        )}
      </DrawerContent>
    </div>
  );
};

// Each tab is a separate component file
// src/components/LeftManagerDrawer/LibraryTab.tsx
// src/components/LeftManagerDrawer/DetailsTab.tsx
// src/components/LeftManagerDrawer/GroupsTagsTab.tsx
// src/components/LeftManagerDrawer/HistoryTab.tsx
```

### 9. Store Refactoring

**Current:** projectStore.ts is 876 lines (client) and 1043 lines (server)
**Target:** < 500 lines per file

**Strategy:** Split by domain

```
src/features/project/state/
├── projectStore.ts          (< 300 lines - main store)
├── sceneStore.ts            (< 300 lines - scene operations)
├── groupStore.ts            (< 200 lines - group operations)
├── tagStore.ts              (< 200 lines - tag operations)
├── chatStore.ts             (< 200 lines - chat operations)
└── storeUtils.ts            (< 200 lines - shared utilities)

server/stores/
├── projectStore.ts          (< 300 lines - main store)
├── sceneStore.ts            (< 300 lines - scene operations)
├── groupStore.ts            (< 200 lines - group operations)
├── tagStore.ts              (< 200 lines - tag operations)
└── storeUtils.ts            (< 200 lines - shared utilities)
```

Each store module exports a slice that can be composed:

```typescript
// src/features/project/state/projectStore.ts
import { createSceneSlice } from './sceneStore';
import { createGroupSlice } from './groupStore';
import { createTagSlice } from './tagStore';
import { createChatSlice } from './chatStore';

export const useProjectStore = create<ProjectStore>((set, get) => ({
  // Core project state
  projects: [],
  activeProjectId: null,
  // ...
  
  // Compose slices
  ...createSceneSlice(set, get),
  ...createGroupSlice(set, get),
  ...createTagSlice(set, get),
  ...createChatSlice(set, get),
}));
```

## Data Models

No changes to existing data models. This refactor is purely structural.

## Error Handling

- Maintain existing error handling patterns
- Each hook handles its own errors
- Errors are surfaced via toast notifications (existing pattern)
- No new error handling mechanisms introduced

## Testing Strategy

### Unit Tests

1. **Hook Tests:** Test each hook in isolation with mocked dependencies
   - `useLayout` - test resize calculations, collapse logic
   - `useSceneActions` - test CRUD operations with mocked services
   - `useSceneManager` - test state transitions

2. **Component Tests:** Test each component with mocked props
   - `LibraryPanel` - test rendering, user interactions
   - `MobileLayout` / `DesktopLayout` - test layout rendering
   - `AppSidebar` - test sidebar interactions

3. **Store Tests:** Test store slices independently
   - `sceneStore` - test scene operations
   - `groupStore` - test group operations

### Integration Tests

1. **AppShell Integration:** Test that `useAppShellState` correctly orchestrates all hooks
2. **Layout Integration:** Test that resize and collapse work together correctly
3. **Scene Manager Integration:** Test opening/closing drawer, loading history

### Refactoring Tests

1. **Snapshot Tests:** Capture current behavior before refactoring
2. **Regression Tests:** Ensure all existing functionality still works
3. **Visual Regression:** Ensure UI looks identical after refactoring

## Migration Strategy

### Phase 1: Extract Layout Feature (Low Risk)

1. Create `src/features/layout/` structure
2. Extract layout hooks from AppShell
3. Extract layout components
4. Update AppShell to use new layout hooks
5. Test: Verify resize, collapse, persistence all work

### Phase 2: Extract Scene Management (Medium Risk)

1. Create `src/features/scene/hooks/`
2. Extract `useSceneActions` hook
3. Extract `useSceneManager` hook
4. Extract `useSceneHistory` hook
5. Update AppShell to use new hooks
6. Test: Verify scene operations work

### Phase 3: Extract Library Feature (Low Risk)

1. Create `LibraryPanel` component
2. Extract `useLibraryState` hook
3. Update AppShell to use LibraryPanel
4. Test: Verify library rendering works

### Phase 4: Split Layouts (Low Risk)

1. Create `MobileLayout` component
2. Create `DesktopLayout` component
3. Create `AppSidebar` component
4. Update AppShell to use new components
5. Test: Verify both layouts work

### Phase 5: Create useAppShellState (Medium Risk)

1. Create `useAppShellState` hook
2. Orchestrate all feature hooks
3. Update AppShell to use single hook
4. Test: Verify all features work together

### Phase 6: Refactor LeftManagerDrawer (Low Risk)

1. Extract tab components
2. Extract `useDrawerTabs` hook
3. Update drawer to use new structure
4. Test: Verify drawer works

### Phase 7: Split Stores (High Risk)

1. Create store slices
2. Compose slices in main store
3. Update imports throughout codebase
4. Test: Verify all store operations work

## Rollback Plan

Each phase is independent and can be rolled back:

1. Keep original files until phase is complete and tested
2. Use feature flags if needed for gradual rollout
3. Git branches for each phase
4. Can revert individual phases without affecting others

## Success Metrics

- AppShell.tsx: < 300 lines ✓
- LeftManagerDrawer/index.tsx: < 400 lines ✓
- All hooks: < 200 lines each ✓
- All store files: < 500 lines each ✓
- All existing tests pass ✓
- No new bugs introduced ✓
- Code coverage maintained or improved ✓
