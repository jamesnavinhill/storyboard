# Design Document

## Overview

This design document outlines the implementation approach for UI/UX improvements to the StoryBoard application. The improvements focus on five key areas:

1. **Default Layout Configuration** - Establishing sensible defaults for first-time users
2. **Persistent User Preferences** - Saving layout and UI state across sessions
3. **Settings Management** - Global settings with session-specific overrides
4. **Project Management Workflows** - Enhanced project actions and metadata editing
5. **Document Editing** - Text-based view for editing storyboard content

The design leverages the existing feature-first architecture, localStorage for persistence, and React hooks for state management. All changes maintain strict module boundaries and follow the established patterns in the codebase.

## Architecture

### State Management Strategy

The application uses a layered state management approach:

- **Layout State** (`src/features/layout/hooks/useLayout.ts`) - Manages panel dimensions and collapse states
- **UI State** (`src/features/app-shell/hooks/useAppShellState.ts`) - Manages view modes, chat agents, and UI preferences
- **Settings State** (`src/features/settings/state/settingsStore.ts`) - Manages global AI and app settings via Zustand
- **Session State** (`src/features/app-shell/hooks/useSessionOverrides.ts`) - Manages temporary setting overrides
- **Project State** (`src/features/project/state/useProjectState.ts`) - Manages project data and operations

### Persistence Layer

All persistent state uses browser localStorage with the following key patterns:

- Layout dimensions: `vb:layout:*` (sidebar, chat, scene manager widths)
- Collapse states: `vb:layout:*Collapsed` (boolean flags)
- UI preferences: `vb:lmd:*` (topTab, gtSub, currentView)
- Settings: `vb:settings:*` (global AI and app settings)
- Theme: `vibeBoardTheme` (light/dark mode)

**Design Decision**: We use localStorage instead of a backend persistence layer because:

- UI preferences are client-specific and don't need to sync across devices
- Reduces server load and API complexity
- Provides instant access without network latency
- Aligns with existing theme persistence pattern

### Default Layout Configuration

The layout system initializes with these defaults on first load:

```typescript
{
  sidebarWidth: 280,           // Expanded library panel
  sidebarCollapsed: false,     // Library visible
  chatWidth: 400,              // 30% of typical 1920px screen
  chatCollapsed: false,        // Chat visible
  storyboardCollapsed: false,  // Gallery visible (70% of center)
  sceneManagerWidth: 320,      // Manager panel width
  sceneManagerCollapsed: true, // Manager hidden by default
  chatAgent: "generate",       // Agent mode active
  currentView: "storyboard"    // Storyboard view active
}
```

**Design Decision**: The 30/70 chat-to-gallery ratio provides enough space for AI interaction while prioritizing visual content. The collapsed manager panel reduces initial cognitive load.

## Components and Interfaces

### 1. Layout Initialization System

**Location**: `src/features/layout/hooks/useLayout.ts`

**Current Implementation**: The layout hook already loads persisted dimensions from localStorage on initialization. We need to ensure proper defaults are set when no persisted values exist.

**Changes Required**:

- Add explicit default values for first-time users
- Ensure chat panel initializes in non-collapsed state
- Ensure scene manager initializes in collapsed state
- Set default chat/storyboard width ratio to 30/70

**Interface**:

```typescript
interface LayoutDefaults {
  sidebarWidth: number;
  sidebarCollapsed: boolean;
  chatWidth: number;
  chatCollapsed: boolean;
  storyboardCollapsed: boolean;
  sceneManagerWidth: number;
  sceneManagerCollapsed: boolean;
}

const DEFAULT_LAYOUT: LayoutDefaults = {
  sidebarWidth: 280,
  sidebarCollapsed: false,
  chatWidth: 400,
  chatCollapsed: false,
  storyboardCollapsed: false,
  sceneManagerWidth: 320,
  sceneManagerCollapsed: true,
};
```

### 2. UI State Persistence

**Location**: `src/features/app-shell/hooks/useAppShellState.ts`

**Current Implementation**: Partial persistence exists for `managerTopTab` and `groupTagSubTab`. We need to extend this to cover all UI state.

**Changes Required**:

- Persist `chatAgent` (chat mode selection)
- Persist `currentView` (storyboard/library/document)
- Persist `aspectRatio` (16:9 or 9:16)
- Add 500ms debounce to prevent excessive localStorage writes
- Load persisted values on initialization

**Interface**:

```typescript
interface UIStateStorage {
  chatAgent: ChatAgent;
  currentView: "storyboard" | "library" | "document";
  aspectRatio: "16:9" | "9:16";
  managerTopTab: "library" | "details" | "groups-tags" | "history";
  groupTagSubTab: "groups" | "tags";
}

const UI_STORAGE_KEYS = {
  chatAgent: "vb:ui:chatAgent",
  currentView: "vb:ui:currentView",
  aspectRatio: "vb:ui:aspectRatio",
  managerTopTab: "vb:lmd:topTab",
  groupTagSubTab: "vb:lmd:gtSub",
};
```

**Design Decision**: We use a 500ms debounce for persistence to balance responsiveness with performance. This prevents excessive writes during rapid UI changes (e.g., dragging panel resizers).

### 3. Global Settings Management

**Location**: `src/features/settings/state/settingsStore.ts`

**Current Implementation**: Settings are managed via Zustand store with workflow and template slices. Settings are loaded from the backend on project load.

**Changes Required**:

- Add localStorage persistence layer for global settings
- Sync settings to localStorage whenever they change
- Load settings from localStorage on app initialization
- Merge localStorage settings with backend settings (localStorage takes precedence)
- Fix styling conflicts in settings panel display

**Interface**:

```typescript
interface GlobalSettings {
  // Model settings
  chatModel: string;
  imageModel: string;
  videoModel: string;
  temperature?: number;
  
  // App settings
  videoAutoplay: "on-generate" | "manual" | "off";
  videoResolution: "720p" | "1080p" | "4k";
  videoDuration: number;
  
  // Workflow settings
  workflow: string;
  sceneCount: number;
}

const SETTINGS_STORAGE_KEY = "vb:settings:global";
```

**Design Decision**: We persist settings to localStorage in addition to the backend to provide instant availability on app load and offline capability. The backend remains the source of truth for project-specific settings.

### 4. Session Settings Override System

**Location**: `src/features/app-shell/hooks/useSessionOverrides.ts`

**Current Implementation**: Session overrides exist but are not clearly distinguished from global settings in the UI.

**Changes Required**:

- Ensure session overrides are stored in component state (not localStorage)
- Clear session overrides when switching projects or closing panels
- Add visual indicators in UI to show when session overrides are active
- Implement priority system: session overrides > global settings > defaults

**Interface**:

```typescript
interface SessionOverrides {
  overrides: Partial<Settings>;
  setOverrides: (overrides: Partial<Settings>) => void;
  clearOverrides: () => void;
  hasOverrides: boolean;
}

// Priority resolution
function resolveEffectiveSettings(
  defaults: Settings,
  global: Partial<Settings>,
  session: Partial<Settings>
): Settings {
  return { ...defaults, ...global, ...session };
}
```

**Design Decision**: Session overrides are intentionally not persisted to localStorage. This allows users to experiment with settings without affecting their global configuration. Overrides are cleared when the user navigates away or closes the relevant panel.

### 5. Project Context Menu

**Location**: `src/features/library/components/ProjectsTab.tsx` (new component)

**Current Implementation**: Projects are displayed in a list but lack quick action menus.

**Changes Required**:

- Add hover state detection for each project item
- Display three-dot menu icon on hover
- Implement context menu with "Manage" and "Delete" options
- Match styling of existing scene card context menus
- Ensure menu closes when hover ends

**Interface**:

```typescript
interface ProjectContextMenuProps {
  projectId: string;
  onManage: (projectId: string) => void;
  onDelete: (projectId: string) => void;
}

// Menu items
const PROJECT_MENU_ITEMS = [
  { id: "manage", label: "Manage", icon: Settings },
  { id: "delete", label: "Delete", icon: Trash2, variant: "destructive" },
];
```

**Design Decision**: We use a hover-triggered menu to reduce visual clutter while maintaining discoverability. The three-dot icon pattern is consistent with scene cards and familiar to users from other applications.

### 6. Project Deletion Confirmation

**Location**: `src/features/project/hooks/useProjectActions.ts`

**Current Implementation**: Project deletion exists but may lack confirmation dialog.

**Changes Required**:

- Add confirmation dialog before deletion
- Display warning message about permanent data loss
- Show project name in confirmation dialog
- Require explicit "Delete" button click (not just "OK")
- Provide "Cancel" option to abort

**Interface**:

```typescript
interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  projectName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DELETE_WARNING_MESSAGE = 
  "This will permanently delete the project and all its scenes, images, and videos. This action cannot be undone.";
```

**Design Decision**: We use a modal dialog (not a toast or inline confirmation) to ensure users consciously acknowledge the destructive action. The dialog blocks other interactions until resolved.

### 7. Project Manager Modal

**Location**: `src/features/library/components/ProjectManagerModal.tsx` (new component)

**Current Implementation**: Project creation exists but lacks a dedicated metadata editor.

**Changes Required**:

- Create modal component for project creation and editing
- Support two modes: "create" and "edit"
- Include fields: name (optional), description (optional), image (optional)
- Match styling of existing modals (e.g., export modal)
- Support image upload with preview
- Implement autosave behavior (see Requirement 8)

**Interface**:

```typescript
interface ProjectManagerModalProps {
  mode: "create" | "edit";
  projectId?: string;
  initialData?: {
    name?: string;
    description?: string;
    imageUrl?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProjectMetadata) => Promise<void>;
}

interface ProjectMetadata {
  name?: string;
  description?: string;
  image?: File;
}
```

**Design Decision**: We use a modal instead of an inline editor to provide focused editing without distractions. The modal pattern is consistent with other editing flows in the application (export, scene history).

### 8. Autosave System

**Location**: `src/features/library/hooks/useAutosave.ts` (new hook)

**Changes Required**:

- Create reusable autosave hook with configurable delay
- Trigger autosave after user inactivity (2 seconds for document, immediate for metadata)
- Trigger autosave on navigation away from editor
- Prevent autosave on initial load (only on user edits)
- Provide visual feedback during save operation

**Interface**:

```typescript
interface UseAutosaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delay?: number; // milliseconds
  enabled?: boolean;
}

interface UseAutosaveReturn {
  isSaving: boolean;
  lastSaved: Date | null;
  error: Error | null;
  forceSave: () => Promise<void>;
}

function useAutosave<T>(options: UseAutosaveOptions<T>): UseAutosaveReturn;
```

**Design Decision**: We use a debounced autosave approach to balance data safety with performance. The 2-second delay for document editing provides a good balance - long enough to avoid saving mid-thought, short enough to prevent significant data loss. Metadata changes save immediately on navigation to ensure no data is lost when closing the modal.

### 9. Icon-Only Gallery Controls

**Location**: `src/features/storyboard/components/StoryboardToolbar.tsx`

**Current Implementation**: Toolbar buttons likely have text labels.

**Changes Required**:

- Remove text labels from all top row controls
- Keep only icons visible
- Add `aria-label` attributes for accessibility
- Add tooltips on hover to indicate function
- Ensure icon sizes are consistent (20-24px)

**Interface**:

```typescript
interface IconButtonProps {
  icon: LucideIcon;
  label: string; // Used for aria-label and tooltip
  onClick: () => void;
  variant?: "default" | "primary" | "destructive";
}

// Example buttons
const GALLERY_CONTROLS = [
  { icon: Plus, label: "Add Scene" },
  { icon: Download, label: "Export Images" },
  { icon: Filter, label: "Filter Scenes" },
  { icon: Grid, label: "Grid View" },
  { icon: List, label: "List View" },
];
```

**Design Decision**: Icon-only buttons reduce visual clutter and provide more space for content. Tooltips and aria-labels ensure accessibility is maintained. This pattern is common in modern applications (Figma, Notion, etc.).

### 10. Document View Editor

**Location**: `src/features/storyboard/components/DocumentView.tsx` (new component)

**Current Implementation**: Document view exists but may be unpopulated or read-only.

**Changes Required**:

- Create editable text interface for document view
- Display all scene prompts in editable format
- Display style information in editable format
- Display project metadata in editable format
- Support standard text editing operations (copy, paste, undo)
- Update project data when content changes
- Replace unpopulated collapsible sections

**Interface**:

```typescript
interface DocumentViewProps {
  projectId: string;
  scenes: Scene[];
  metadata: ProjectMetadata;
  onUpdateScene: (sceneId: string, updates: Partial<Scene>) => void;
  onUpdateMetadata: (updates: Partial<ProjectMetadata>) => void;
}

interface DocumentSection {
  type: "metadata" | "scene" | "style";
  id: string;
  content: string;
  editable: boolean;
}
```

**Design Decision**: We use a structured text editor (not a plain textarea) to maintain the relationship between text content and underlying data models. This allows us to parse changes and update the correct scene/metadata records. The editor supports markdown-like syntax for better readability.

### 11. Document View Autosave

**Location**: `src/features/storyboard/components/DocumentView.tsx`

**Changes Required**:

- Integrate autosave hook (from Requirement 8)
- Set 2-second inactivity delay before triggering save
- Prevent autosave on initial render (only after user edits)
- Save pending changes when navigating away from document view
- Show visual indicator during save operation

**Implementation**:

```typescript
function DocumentView({ projectId, scenes, onUpdateScene }: DocumentViewProps) {
  const [localContent, setLocalContent] = useState(scenes);
  const [hasEdits, setHasEdits] = useState(false);
  
  const { isSaving, forceSave } = useAutosave({
    data: localContent,
    onSave: async (data) => {
      // Persist changes to backend
      await saveDocumentChanges(projectId, data);
    },
    delay: 2000,
    enabled: hasEdits,
  });
  
  // Save on navigation away
  useEffect(() => {
    return () => {
      if (hasEdits) {
        forceSave();
      }
    };
  }, [hasEdits, forceSave]);
  
  return (
    <div>
      {isSaving && <SaveIndicator />}
      <TextEditor value={localContent} onChange={handleChange} />
    </div>
  );
}
```

**Design Decision**: The 2-second delay prevents excessive save operations while typing. The forced save on navigation ensures no data is lost when switching views. Visual feedback (spinner or "Saving..." text) provides confidence that changes are being persisted.

## Data Models

### Layout State Model

```typescript
interface LayoutState {
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
  toggleStoryboardCollapse: () => void;
  toggleSceneManagerCollapse: () => void;
}
```

### UI State Model

```typescript
interface UIState {
  // View modes
  currentView: "storyboard" | "library" | "document";
  mobileView: "chat" | "storyboard";
  chatAgent: ChatAgent;
  
  // Preferences
  aspectRatio: "16:9" | "9:16";
  selectedStyles: PresetStyle[];
  
  // Panel states
  managerTopTab: "library" | "details" | "groups-tags" | "history";
  groupTagSubTab: "groups" | "tags";
  
  // Modal states
  isSettingsSheetOpen: boolean;
  settingsTab: "workflow" | "models" | "templates" | "app";
}
```

### Settings Model

```typescript
interface Settings {
  // AI Models
  chatModel: string;
  imageModel: string;
  videoModel: string;
  temperature?: number;
  
  // Generation
  sceneCount: number;
  workflow: string;
  
  // Video
  videoAutoplay: "on-generate" | "manual" | "off";
  videoResolution: "720p" | "1080p" | "4k";
  videoDuration: number;
}

interface SettingsState {
  global: Settings;
  session: Partial<Settings>;
  effective: Settings; // Computed: global + session
}
```

### Project Metadata Model

```typescript
interface ProjectMetadata {
  id: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Error Handling

### localStorage Failures

**Scenario**: localStorage is unavailable (private browsing, quota exceeded, disabled)

**Handling**:

```typescript
function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`Failed to persist ${key}:`, error);
    return false;
  }
}

function safeLocalStorageGet(key: string, fallback: string): string {
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch (error) {
    console.warn(`Failed to load ${key}:`, error);
    return fallback;
  }
}
```

**Design Decision**: We gracefully degrade when localStorage is unavailable. The app continues to function with in-memory state, but preferences won't persist across sessions. We log warnings for debugging but don't show errors to users.

### Autosave Failures

**Scenario**: Network error or server error during autosave

**Handling**:

```typescript
async function handleAutosave(data: any): Promise<void> {
  try {
    await saveToBackend(data);
    showToast({ type: "success", message: "Changes saved" });
  } catch (error) {
    console.error("Autosave failed:", error);
    showToast({ 
      type: "error", 
      message: "Failed to save changes. Please try again.",
      action: { label: "Retry", onClick: () => handleAutosave(data) }
    });
  }
}
```

**Design Decision**: We show user-facing error messages for autosave failures because they represent potential data loss. We provide a retry action to allow users to manually trigger the save.

### Project Deletion Failures

**Scenario**: Backend error during project deletion

**Handling**:

```typescript
async function handleDeleteProject(projectId: string): Promise<void> {
  try {
    await deleteProjectAPI(projectId);
    showToast({ type: "success", message: "Project deleted" });
  } catch (error) {
    console.error("Delete failed:", error);
    showToast({ 
      type: "error", 
      message: "Failed to delete project. Please try again." 
    });
    // Keep project in UI since deletion failed
  }
}
```

**Design Decision**: We don't optimistically remove the project from the UI. We wait for backend confirmation to avoid showing an inconsistent state if deletion fails.

### 11. Hidden Scrollbar Styling

**Location**: `src/styles/utilities.css`

**Purpose**: Provide a clean, polished interface by hiding scrollbars in key areas while maintaining scroll functionality.

**Implementation Approach**:

Create a reusable CSS utility class that hides scrollbars across all major browsers:

```css
/* Hide scrollbar while maintaining scroll functionality */
.hide-scrollbar {
  /* Firefox */
  scrollbar-width: none;
  
  /* IE and Edge */
  -ms-overflow-style: none;
}

/* Chrome, Safari, and Opera */
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
```

**Target Components**:

1. **DocumentView** - Apply to the scrollable content area (`.flex-1.overflow-y-auto`)
2. **ChatInputArea** - Apply to the textarea composer (`.composer-input`)
3. **Edit/Animate/Extend Panels** - Apply to scrollable modal content areas when implemented

**Design Decision**: We use a utility class approach rather than component-specific styles because:

- Promotes consistency across the application
- Makes it easy to apply to future components
- Follows the existing utility-first pattern in the codebase
- Centralizes browser compatibility handling

**Browser Compatibility**:

- Chrome/Edge: `-webkit-scrollbar` pseudo-element
- Firefox: `scrollbar-width: none`
- Safari: `-webkit-scrollbar` pseudo-element
- IE11: `-ms-overflow-style: none`

**Accessibility Considerations**:

- Scroll functionality remains fully intact
- Keyboard navigation (arrow keys, Page Up/Down) still works
- Screen readers are unaffected
- Users can still scroll with mouse wheel, trackpad, or touch gestures

## Testing Strategy

### Unit Tests

**Layout Initialization**:

- Test default values are applied on first load
- Test persisted values are loaded correctly
- Test invalid persisted values fall back to defaults

**UI State Persistence**:

- Test state changes trigger localStorage writes
- Test debouncing prevents excessive writes
- Test state is restored on app reload

**Settings Management**:

- Test global settings persist to localStorage
- Test session overrides don't persist
- Test priority resolution (session > global > defaults)

**Autosave**:

- Test autosave triggers after inactivity delay
- Test autosave triggers on navigation away
- Test autosave doesn't trigger on initial load
- Test autosave handles errors gracefully

### Integration Tests

**Project Context Menu**:

- Test menu appears on hover
- Test menu disappears when hover ends
- Test "Manage" opens project manager modal
- Test "Delete" shows confirmation dialog

**Project Manager Modal**:

- Test modal opens in create mode
- Test modal opens in edit mode with existing data
- Test form validation
- Test autosave behavior
- Test image upload

**Document View**:

- Test content displays correctly
- Test edits update underlying data
- Test autosave triggers correctly
- Test navigation away saves pending changes

### Manual Testing Checklist

- [ ] First-time user sees correct default layout
- [ ] Layout preferences persist across browser sessions
- [ ] UI state (view mode, chat agent) persists across sessions
- [ ] Global settings persist and apply correctly
- [ ] Session overrides work and don't persist
- [ ] Project context menu appears on hover
- [ ] Project deletion requires confirmation
- [ ] Project manager modal supports create and edit modes
- [ ] Autosave works in project manager modal
- [ ] Gallery controls are icon-only with tooltips
- [ ] Document view displays all content
- [ ] Document view autosave works correctly
- [ ] All features work when localStorage is disabled

## Implementation Notes

### Module Boundaries

All changes must respect the feature-first architecture:

- **Layout changes**: `src/features/layout/`
- **UI state changes**: `src/features/app-shell/`
- **Settings changes**: `src/features/settings/`
- **Project management**: `src/features/project/` and `src/features/library/`
- **Document view**: `src/features/storyboard/`

**No cross-feature imports** except through the app-shell orchestration layer.

### Shared Utilities

Create shared utilities in `src/utils/` for:

- `localStorage.ts` - Safe localStorage access helpers
- `debounce.ts` - Debounce utility for autosave
- `validation.ts` - Form validation helpers

### Accessibility

All interactive elements must include:

- `aria-label` for icon-only buttons
- `role` attributes for custom components
- Keyboard navigation support (Tab, Enter, Escape)
- Focus management for modals and dialogs

### Performance Considerations

- Debounce localStorage writes (500ms for UI state, 2s for document content)
- Use React.memo for expensive components (document editor)
- Lazy load document view component (already implemented via idlePrefetch)
- Avoid re-renders during autosave (use refs for save state)

## Migration Strategy

### Phase 1: Layout and Persistence (Requirements 1-2)

- Implement default layout configuration
- Add UI state persistence
- Test with existing users to ensure no disruption

### Phase 2: Settings Management (Requirements 3-4)

- Add global settings persistence
- Implement session override system
- Fix settings panel styling conflicts

### Phase 3: Project Management (Requirements 5-8)

- Add project context menu
- Implement deletion confirmation
- Create project manager modal
- Add autosave system

### Phase 4: Document View (Requirements 9-11)

- Convert gallery controls to icon-only
- Implement document view editor
- Add document autosave

Each phase can be deployed independently without breaking existing functionality.
