# Design Document

## Overview

This design addresses 13 critical UI/UX issues across VibeBoard's storyboard, chat, and settings interfaces. The solution focuses on responsive layout improvements, interaction pattern enhancements, z-index management, and consistent styling across all scrollable areas. The design maintains the existing feature-first architecture while introducing shared utilities for common patterns like scrollbar hiding and responsive icon-text adaptation.

## Architecture

### Component Hierarchy

```
App Shell
├── Storyboard Panel
│   ├── Scene Cards (with hover controls)
│   ├── Context Menus (z-index managed)
│   └── Stacked Group Cards
├── Chat Panel
│   ├── Chat Mode Dropdown
│   ├── Agent Dropdown
│   ├── Style Presets Menu (updated)
│   ├── Upload Zone (position-stable)
│   └── File Purpose Selector (JSON fix)
├── Scene Manager Panel
│   ├── Groups & Tags Manager
│   └── Scene Details Editor
├── Settings Panel
│   └── Template Manager
└── Toast Notification System (auto-dismiss)
```

### Shared Utilities

New shared utilities will be created to support consistent patterns:

1. **Scrollbar Utility** (`src/styles/utilities.css`)
   - `.hide-scrollbar` class for consistent scrollbar hiding
   - Cross-browser compatible (Chrome, Firefox, Safari, Edge)

2. **Responsive Icon Utility** (`src/hooks/useResponsiveIcons.ts`)
   - Hook to determine when to show icon-only vs icon-text
   - Breakpoint management for consistent behavior

3. **Z-Index Management** (`src/styles/z-index.css`)
   - Centralized z-index scale for layering
   - Prevents z-index conflicts across components

## Components and Interfaces

### 1. Storyboard Layout Responsiveness

**Component:** `StoryboardPanel.tsx`

**Current Implementation:**
- Uses CSS Grid with auto-fit columns
- No explicit minimum card size constraints
- Responsive breakpoints not optimized for desktop

**Design Changes:**
```typescript
// Add responsive grid configuration
const GRID_CONFIG = {
  minCardWidth: {
    desktop: 320,  // Minimum 320px on desktop
    tablet: 280,   // Minimum 280px on tablet
    mobile: '100%' // Full width on mobile
  },
  breakpoints: {
    mobile: 640,   // Single column below 640px
    tablet: 1024,  // 2 columns between 640-1024px
    desktop: 1024  // 3+ columns above 1024px
  },
  maxColumns: {
    desktop: 4,    // Maximum 4 columns on desktop
    tablet: 2,     // Maximum 2 columns on tablet
    mobile: 1      // Always 1 column on mobile
  }
};
```

**CSS Implementation:**
```css
.storyboard-grid {
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

/* Mobile: Single column */
@media (max-width: 639px) {
  .storyboard-grid {
    grid-template-columns: 1fr;
  }
}

/* Tablet: 2 columns with minimum width */
@media (min-width: 640px) and (max-width: 1023px) {
  .storyboard-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    max-width: calc(2 * 280px + 2rem); /* Limit to 2 columns */
  }
}

/* Desktop: 2-4 columns with minimum width */
@media (min-width: 1024px) {
  .storyboard-grid {
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  }
  
  /* Prevent more than 4 columns */
  .storyboard-grid {
    max-width: calc(4 * 320px + 5rem);
  }
}
```

**Rationale:** Explicit minimum widths and column limits prevent cards from becoming unusably small while maintaining responsive behavior. The breakpoints align with common device sizes and ensure drag-and-drop remains functional.

### 2. Scene Card Media Controls Visibility

**Component:** `SceneCard.tsx`

**Current Implementation:**
- Top row controls (drag, details, context menu) already have proper hover behavior
- Video playback controls are always visible
- No logic to hide video controls when overlays are active

**Design Changes:**
```typescript
interface SceneCardState {
  isHovered: boolean;
  isMenuOpen: boolean;
  isPanelOpen: boolean;
  showDetails: boolean;
}

// Video controls visibility logic
const shouldShowVideoControls = (state: SceneCardState): boolean => {
  // Hide video controls when any overlay is active
  if (state.isMenuOpen || state.isPanelOpen || state.showDetails) {
    return false;
  }
  // Show only on hover
  return state.isHovered;
};
```

**CSS Implementation:**
```css
/* Hide video controls by default */
.scene-card video::-webkit-media-controls {
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}

/* Show video controls on hover, but not when overlays are active */
.scene-card:hover video::-webkit-media-controls {
  opacity: 1;
}

/* Force hide when menu, details, or panels are open */
.scene-card.menu-open video::-webkit-media-controls,
.scene-card.panel-open video::-webkit-media-controls,
.scene-card.details-open video::-webkit-media-controls {
  opacity: 0 !important;
}

/* Firefox */
.scene-card video {
  /* Firefox doesn't support hiding controls via CSS, use controls attribute conditionally */
}
```

**Alternative Implementation (Conditional controls attribute):**
```typescript
// In SceneCard component
const showVideoControls = shouldShowVideoControls({
  isHovered,
  isMenuOpen: menuOpen,
  isPanelOpen: panelsOpen,
  showDetails
});

// In JSX
<video
  src={scene.videoUrl}
  className="w-full h-full object-cover"
  controls={showVideoControls} // Conditionally add controls
  loop
  muted
/>
```

**Rationale:** Video playback controls should only appear on hover to reduce visual clutter. They must be hidden when any overlay (context menu, details, edit/animate panels) is active to prevent UI conflicts. The top row controls (drag, details toggle, context menu) already work correctly and should not be modified.

### 3. Context Menu Z-Index and Positioning

**Component:** `SceneCard.tsx` (context menu)

**Current Implementation:**
- Context menu rendered inline with card
- No z-index management
- No viewport boundary detection

**Design Changes:**

**Z-Index Scale** (`src/styles/z-index.css`):
```css
:root {
  --z-base: 0;
  --z-card: 1;
  --z-card-hover: 2;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-modal-backdrop: 900;
  --z-modal: 1000;
  --z-toast: 1100;
  --z-tooltip: 1200;
}
```

**Context Menu Positioning:**
```typescript
interface ContextMenuPosition {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

const calculateMenuPosition = (
  triggerRect: DOMRect,
  menuHeight: number,
  menuWidth: number
): ContextMenuPosition => {
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  };
  
  const position: ContextMenuPosition = {};
  
  // Vertical positioning
  const spaceBelow = viewport.height - triggerRect.bottom;
  const spaceAbove = triggerRect.top;
  
  if (spaceBelow >= menuHeight || spaceBelow >= spaceAbove) {
    position.top = triggerRect.bottom + 4;
  } else {
    position.bottom = viewport.height - triggerRect.top + 4;
  }
  
  // Horizontal positioning
  const spaceRight = viewport.width - triggerRect.right;
  
  if (spaceRight >= menuWidth) {
    position.left = triggerRect.right;
  } else {
    position.right = viewport.width - triggerRect.left;
  }
  
  return position;
};
```

**CSS Implementation:**
```css
.context-menu {
  position: fixed; /* Use fixed instead of absolute */
  z-index: var(--z-dropdown);
  background: var(--popover);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 180px;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  cursor: pointer;
  transition: background-color 0.15s;
}

.context-menu-item:hover {
  background-color: var(--accent);
}

.context-menu-item-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}
```

**Rationale:** Fixed positioning with viewport-aware calculations ensures menus never clip or hide behind other elements. The centralized z-index scale prevents conflicts across the application.

### 4. Chat Mode Consistency

**Component:** `ChatPanel.tsx`, `ChatModeDropdown.tsx`

**Current Implementation:**
- Chat modes may not properly disable agent features
- Mode state not properly isolated

**Design Changes:**
```typescript
type ChatMode = 'simple' | 'agent';

interface ChatModeConfig {
  mode: ChatMode;
  showWorkflowSelector: boolean;
  showStylePresets: boolean;
  enableAgentFeatures: boolean;
  placeholder: string;
}

const CHAT_MODE_CONFIGS: Record<ChatMode, ChatModeConfig> = {
  simple: {
    mode: 'simple',
    showWorkflowSelector: false,
    showStylePresets: true,
    enableAgentFeatures: false,
    placeholder: 'Chat about your storyboard...'
  },
  agent: {
    mode: 'agent',
    showWorkflowSelector: true,
    showStylePresets: true,
    enableAgentFeatures: true,
    placeholder: 'Select a workflow to get started...'
  }
};

// In ChatPanel component
const modeConfig = CHAT_MODE_CONFIGS[selectedMode];

// Conditionally render based on mode
{modeConfig.showWorkflowSelector && <AgentDropdown />}
{modeConfig.enableAgentFeatures && <AgentFeatures />}
```

**Rationale:** Explicit mode configurations ensure UI elements and behaviors are properly isolated between chat modes. This prevents agent features from leaking into simple chat mode.

### 5. File Upload Purpose Selection

**Component:** `FilePurposeSelector.tsx`

**Current Implementation:**
- JSON parsing error when selecting non-default purposes
- Likely caused by improper serialization

**Design Changes:**
```typescript
// Current problematic approach (assumed)
// const purpose = JSON.parse(event.target.value);

// Fixed approach
interface FilePurposeOption {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType;
}

const FILE_PURPOSES: FilePurposeOption[] = [
  {
    id: 'style-reference',
    label: 'Style Reference',
    description: 'Visual style, color palette, or aesthetic inspiration',
    icon: Palette
  },
  {
    id: 'character-reference',
    label: 'Character Reference',
    description: 'Character design, appearance, or personality',
    icon: User
  },
  // ... other purposes
];

// In component
const handlePurposeChange = (purposeId: string) => {
  const purpose = FILE_PURPOSES.find(p => p.id === purposeId);
  if (purpose) {
    onPurposeSelect(purpose.id);
  }
};

// In JSX
<select value={selectedPurposeId} onChange={(e) => handlePurposeChange(e.target.value)}>
  {FILE_PURPOSES.map(purpose => (
    <option key={purpose.id} value={purpose.id}>
      {purpose.label}
    </option>
  ))}
</select>
```

**Rationale:** Storing simple string IDs in select values instead of serialized JSON prevents parsing errors and simplifies the component logic.

### 6. Modal Background Opacity

**Components:** `DocumentExport.tsx`, `DocumentHistory.tsx`

**Current Implementation:**
- Modal backdrop may be transparent or missing
- Background content visible through modal

**Design Changes:**
```css
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: var(--z-modal-backdrop);
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease-out;
}

.modal-content {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: var(--z-modal);
  background-color: var(--card);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

**Rationale:** Explicit backdrop with proper opacity and blur effect ensures modals are visually distinct from page content. The z-index layering prevents any content bleed-through.

### 7. Upload Zone Position Stability

**Component:** `ChatPanel.tsx`, `UploadDropzone.tsx`

**Current Implementation:**
- Upload zone position shifts when files are attached
- Attached files may push upload zone down

**Design Changes:**
```typescript
// Component structure
<div className="chat-input-container">
  <div className="attached-files-area">
    {attachedFiles.map(file => (
      <FileThumb key={file.id} file={file} onRemove={handleRemove} />
    ))}
  </div>
  <div className="upload-zone-fixed">
    <UploadDropzone onUpload={handleUpload} />
  </div>
  <div className="message-input-area">
    <textarea />
    <button>Send</button>
  </div>
</div>
```

**CSS Implementation:**
```css
.chat-input-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid var(--border);
}

.attached-files-area {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  min-height: 0; /* Collapse when empty */
  max-height: 200px;
  overflow-y: auto;
}

.attached-files-area:empty {
  display: none;
}

.upload-zone-fixed {
  /* Fixed position in layout flow */
  order: 2;
}

.message-input-area {
  order: 3;
}
```

**Rationale:** Using flexbox order and explicit layout structure ensures the upload zone maintains its position regardless of attached files. The attached files area grows above the upload zone.

### 8. Error Notification Auto-Dismiss

**Component:** Toast notification system

**Current Implementation:**
- Error toasts may not auto-dismiss
- Inconsistent dismiss timing

**Design Changes:**
```typescript
interface ToastOptions {
  variant: 'success' | 'error' | 'info' | 'warning';
  description: string;
  duration?: number; // milliseconds
  dismissible?: boolean;
}

const DEFAULT_DURATIONS: Record<ToastOptions['variant'], number> = {
  success: 3000,
  error: 2000,    // 2 seconds for errors
  info: 4000,
  warning: 5000
};

const showToast = (options: ToastOptions) => {
  const duration = options.duration ?? DEFAULT_DURATIONS[options.variant];
  
  const toastId = generateId();
  addToast({ ...options, id: toastId });
  
  if (duration > 0) {
    setTimeout(() => {
      removeToast(toastId);
    }, duration);
  }
};
```

**Rationale:** Explicit 2-second duration for error toasts ensures they don't clutter the interface while still being visible long enough to read. The system remains flexible for other toast types.

### 9. Universal Scrollbar Styling

**Shared Utility:** `src/styles/utilities.css`

**Design Changes:**
```css
/* Hide scrollbar utility class */
.hide-scrollbar {
  /* Firefox */
  scrollbar-width: none;
  
  /* Chrome, Safari, Edge */
  -ms-overflow-style: none;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

/* Alternative: Thin scrollbar (if complete hiding causes UX issues) */
.thin-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}

.thin-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.thin-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.thin-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--border);
  border-radius: 3px;
}

.thin-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: var(--muted-foreground);
}
```

**Components to Update:**
- `StoryboardPanel.tsx` - Already has hidden scrollbar
- `ChatPanel.tsx` - Already has hidden scrollbar
- `SettingsPanel.tsx` - Add `.hide-scrollbar`
- `SceneManageDrawer.tsx` - Add `.hide-scrollbar` to description textarea
- `AgentDropdown.tsx` - Add `.hide-scrollbar` to workflow menu
- `StylePresetPicker.tsx` - Add `.hide-scrollbar`
- `DocumentEditor.tsx` - Add `.hide-scrollbar` to text input
- `SceneEditPanel.tsx` - Add `.hide-scrollbar`
- `SceneAnimatePanel.tsx` - Add `.hide-scrollbar`

**Rationale:** A single utility class ensures consistent scrollbar styling across all components. The cross-browser implementation handles Firefox, Chrome, Safari, and Edge.

### 10. Style Presets Integration

**Component:** `StylePresetsMenu.tsx`, `ChatPanel.tsx`

**Current Implementation:**
- Style presets opens as a dropdown menu
- Does not match the settings panel overlay pattern

**Design Changes:**
```typescript
// In ChatPanel.tsx
const [isStylePresetsOpen, setIsStylePresetsOpen] = useState(false);

// Update StylePresetsMenu to be a full-panel overlay component
interface StylePresetsMenuProps {
  selectedTemplateId: string | null;
  onTemplateSelect: (templateId: string) => void;
  onManageTemplates: () => void;
  onClose: () => void;
}

const StylePresetsMenu: React.FC<StylePresetsMenuProps> = ({
  selectedTemplateId,
  onTemplateSelect,
  onManageTemplates,
  onClose
}) => {
  const [templates, setTemplates] = useState<StyleTemplate[]>([]);
  
  // Fetch templates on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      const response = await fetch("/api/templates");
      const data = await response.json();
      setTemplates(data.templates || []);
    };
    void fetchTemplates();
  }, []);

  return (
    <div className="absolute inset-0 bg-background z-50 flex flex-col">
      {/* Header matching SettingsPanel style */}
      <div className="flex items-center justify-between p-4 border-b border-muted">
        <h2 className="text-lg font-semibold">Style Templates</h2>
        <button
          onClick={onClose}
          className="btn-base btn-ghost p-2"
          aria-label="Close style templates"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Template list - scrollable */}
      <div className="flex-1 overflow-y-auto hide-scrollbar p-4">
        <div className="space-y-2">
          {templates.map(template => (
            <button
              key={template.id}
              onClick={() => {
                onTemplateSelect(template.id);
                onClose();
              }}
              className={`w-full text-left p-4 rounded-lg border transition-colors ${
                selectedTemplateId === template.id
                  ? 'border-primary bg-primary/10'
                  : 'border-muted hover:bg-muted/50'
              }`}
            >
              <div className="font-medium">{template.name}</div>
              {template.description && (
                <div className="text-sm text-muted mt-1">
                  {template.description}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Footer with Manage Templates button */}
      <div className="p-4 border-t border-muted">
        <button
          onClick={() => {
            onManageTemplates();
            onClose();
          }}
          className="w-full btn-base btn-primary flex items-center justify-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Manage Templates
        </button>
      </div>
    </div>
  );
};

// In ChatPanel - render StylePresetsMenu as overlay
{isStylePresetsOpen && (
  <StylePresetsMenu
    selectedTemplateId={selectedTemplateId}
    onTemplateSelect={handleTemplateSelect}
    onManageTemplates={handleManageTemplates}
    onClose={() => setIsStylePresetsOpen(false)}
  />
)}
```

**Rationale:** The style presets panel uses the exact same overlay pattern as the SettingsPanel - covering the entire chat panel with absolute positioning, matching header/footer styling, and scrollable content area. This provides consistency and a familiar interaction pattern.

### 11. Chat Panel Bottom Row Icon-Only Display

**Component:** `ChatPanel.tsx`

**Current Implementation:**
- Chat panel bottom row buttons use `useResponsiveIcons` hook to show/hide text labels
- Text labels appear on desktop, hidden on mobile

**Design Changes:**
```typescript
// In ChatPanel.tsx - Remove useResponsiveIcons usage for bottom row buttons
// Bottom row buttons should ALWAYS be icon-only

// Remove this line:
// const showTextLabels = useResponsiveIcons();

// Update bottom row buttons to always show icons only with tooltips
<button
  type="button"
  onClick={() => fileInputRef.current?.click()}
  className="btn-base btn-ghost p-1.5"
  title="Attach image"
  aria-label="Attach image"
  disabled={isReadingAttachment}
>
  <Paperclip className="w-4 h-4" />
</button>

<button
  type="button"
  onClick={() => setIsStylePresetsOpen(true)}
  className="btn-base btn-ghost p-1.5"
  title="Style templates"
  aria-label="Style templates"
>
  <PaintBrushIcon className="w-4 h-4" />
</button>

<button
  type="button"
  onClick={() => setIsSessionSettingsOpen((p) => !p)}
  className="btn-base btn-ghost p-1.5"
  title="Session settings"
  aria-label="Session settings"
>
  <SettingsIcon className="w-4 h-4" />
</button>

<button
  type="button"
  className="btn-base btn-ghost p-1.5 cursor-not-allowed opacity-60"
  title="Voice input coming soon"
  aria-disabled="true"
  disabled
>
  <Mic className="w-4 h-4" />
</button>

<button
  type="button"
  onClick={handleSubmit}
  disabled={isLoading || isReadingAttachment || !input.trim()}
  className="btn-base btn-ghost p-1.5"
  aria-label="Send message"
  title="Send (Ctrl/Cmd+Enter)"
>
  <Send className="w-4 h-4" />
</button>
```

**CSS Implementation:**
```css
/* Ensure consistent icon button sizing */
.composer-bottom .btn-base {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.composer-bottom .btn-base svg {
  width: 1rem;
  height: 1rem;
}
```

**Rationale:** Chat panel bottom row buttons should always be icon-only for a clean, compact interface. Tooltips provide context on hover. This matches the design shown in the screenshots where all bottom row buttons are icon-only.

### 12. Group and Tag Creation Feedback

**Component:** `GroupsTagsInlineManagers.tsx`

**Current Implementation:**
- New groups/tags may not appear immediately
- No visual confirmation of creation

**Design Changes:**
```typescript
// In group/tag creation handler
const handleCreateGroup = async (name: string, color: string) => {
  try {
    const newGroup = await createGroup({ name, color });
    
    // Optimistic UI update
    setLocalGroups(prev => [...prev, newGroup]);
    
    // Show success toast
    showToast({
      variant: 'success',
      description: `Group "${name}" created successfully`
    });
    
    // Refresh from server to ensure consistency
    await refreshGroups();
    
  } catch (error) {
    showToast({
      variant: 'error',
      description: 'Failed to create group. Please try again.'
    });
  }
};

// Similar pattern for tags
const handleCreateTag = async (name: string, color: string) => {
  try {
    const newTag = await createTag({ name, color });
    
    setLocalTags(prev => [...prev, newTag]);
    
    showToast({
      variant: 'success',
      description: `Tag "${name}" created successfully`
    });
    
    await refreshTags();
    
  } catch (error) {
    showToast({
      variant: 'error',
      description: 'Failed to create tag. Please try again.'
    });
  }
};
```

**Rationale:** Optimistic UI updates provide immediate feedback while the server request completes. Success toasts confirm the action, and error handling ensures users know if something went wrong.

### 13. Scene Prompt Regeneration

**Component:** `SceneCard.tsx`, scene actions

**Current Implementation:**
- "Rerun Prompt" action fails
- Likely missing proper scene state or API call

**Design Changes:**
```typescript
// In scene actions
const handleRerunPrompt = async (sceneId: string) => {
  try {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) {
      throw new Error('Scene not found');
    }

    // Set loading state
    updateSceneUIState(sceneId, {
      activity: 'regenerating-prompt'
    });

    // Call API to regenerate with original parameters
    const updatedScene = await regenerateScenePrompt({
      sceneId,
      originalPrompt: scene.description,
      aspectRatio: scene.aspectRatio,
      stylePreset: scene.stylePreset
    });

    // Update scene with new content
    updateScene(sceneId, updatedScene);

    showToast({
      variant: 'success',
      description: 'Scene prompt regenerated successfully'
    });

  } catch (error) {
    console.error('Failed to regenerate prompt:', error);
    showToast({
      variant: 'error',
      description: 'Failed to regenerate prompt. Please try again.'
    });
  } finally {
    // Clear loading state
    updateSceneUIState(sceneId, {
      activity: null
    });
  }
};
```

**API Endpoint:**
```typescript
// server/routes/ai.ts
router.post('/scenes/:sceneId/regenerate', async (req, res) => {
  const { sceneId } = req.params;
  const { originalPrompt, aspectRatio, stylePreset } = req.body;

  try {
    const scene = await db.getScene(sceneId);
    if (!scene) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    // Regenerate using Gemini
    const newDescription = await geminiService.generateSceneDescription({
      prompt: originalPrompt,
      aspectRatio,
      stylePreset
    });

    // Update scene
    const updatedScene = await db.updateScene(sceneId, {
      description: newDescription,
      updatedAt: new Date()
    });

    res.json(updatedScene);

  } catch (error) {
    console.error('Regeneration error:', error);
    res.status(500).json({ error: 'Failed to regenerate scene' });
  }
});
```

**Rationale:** Proper error handling and loading states ensure users understand what's happening. The API endpoint reuses existing Gemini integration for consistency.

## Data Models

No new data models are required. All changes work with existing types:

```typescript
// Existing types remain unchanged
interface Scene {
  id: string;
  description: string;
  aspectRatio: '16:9' | '9:16';
  stylePreset?: string;
  groupId?: string;
  tagIds?: string[];
  uiState: SceneUIState;
  // ... other fields
}

interface SceneUIState {
  activity: 'generating-image' | 'editing-image' | 'generating-video' | 'regenerating-prompt' | null;
  panels: {
    edit: boolean;
    animate: boolean;
  };
}

// Add new activity type for regeneration
type SceneActivity = 
  | 'generating-image'
  | 'editing-image'
  | 'generating-video'
  | 'regenerating-prompt'
  | null;
```

## Error Handling

### Client-Side Error Handling

1. **Network Errors**: Display user-friendly error toasts with 2-second auto-dismiss
2. **Validation Errors**: Show inline validation messages near form inputs
3. **State Errors**: Log to console and attempt graceful recovery
4. **Rendering Errors**: Use React error boundaries to prevent full app crashes

### Server-Side Error Handling

1. **API Errors**: Return structured error responses with appropriate HTTP status codes
2. **Gemini API Errors**: Retry with exponential backoff, fallback to error state
3. **Database Errors**: Log errors and return 500 status with generic message

### Error Recovery Patterns

```typescript
// Optimistic update with rollback
const optimisticUpdate = async <T>(
  optimisticFn: () => void,
  apiFn: () => Promise<T>,
  rollbackFn: () => void
) => {
  optimisticFn();
  
  try {
    const result = await apiFn();
    return result;
  } catch (error) {
    rollbackFn();
    throw error;
  }
};
```

## Testing Strategy

### Unit Tests

1. **Utility Functions**
   - `calculateMenuPosition` - Test viewport boundary detection
   - `shouldShowControls` - Test hover state logic
   - `useResponsiveIcons` - Test breakpoint behavior

2. **Component Logic**
   - File purpose selection - Test all purpose types
   - Chat mode switching - Test mode isolation
   - Group/tag creation - Test optimistic updates

### Integration Tests

1. **Storyboard Layout**
   - Test responsive grid behavior at different viewport sizes
   - Test drag-and-drop with new layout constraints
   - Test card minimum sizes are maintained

2. **Context Menus**
   - Test menu positioning near viewport edges
   - Test z-index layering with overlapping cards
   - Test menu remains visible during panel transitions

3. **Chat Panel**
   - Test upload zone position stability with multiple files
   - Test chat mode switching disables/enables features
   - Test style presets menu integration

### Visual Regression Tests

1. **Scrollbar Styling**
   - Verify hidden scrollbars across all components
   - Test scrollbar behavior in different browsers

2. **Modal Backdrops**
   - Verify opaque backdrops on all modals
   - Test backdrop blur effect

3. **Responsive Icons**
   - Verify icon-only display on mobile
   - Verify icon-text display on desktop

### Manual Testing Checklist

- [ ] Storyboard cards maintain usable size when resizing panels
- [ ] Scene card controls appear/disappear on hover
- [ ] Context menus never clip or hide behind images
- [ ] Simple chat mode has no agent features
- [ ] All file purposes can be selected without errors
- [ ] Modal backdrops are fully opaque
- [ ] Upload zone stays in place when attaching files
- [ ] Error toasts auto-dismiss after 2 seconds
- [ ] All scrollbars are consistently styled
- [ ] Style presets menu shows templates and manage button
- [ ] Icon buttons show only icons on mobile with tooltips
- [ ] New groups/tags appear immediately after creation
- [ ] Rerun prompt successfully regenerates scenes

## Performance Considerations

1. **Responsive Layout**: CSS Grid calculations are performant; no JavaScript layout calculations needed
2. **Hover States**: CSS transitions are GPU-accelerated; minimal performance impact
3. **Context Menu Positioning**: Calculation only runs on menu open; negligible impact
4. **Scrollbar Hiding**: Pure CSS solution; no performance impact
5. **Responsive Icons**: Hook uses debounced resize listener to minimize re-renders

## Accessibility Considerations

1. **Hover Controls**: Ensure keyboard navigation can access hidden controls via focus states
2. **Context Menus**: Support keyboard navigation (arrow keys, Enter, Escape)
3. **Tooltips**: Provide tooltips for icon-only buttons on mobile
4. **Modal Focus**: Trap focus within modals when open
5. **Toast Notifications**: Announce to screen readers using ARIA live regions
6. **Color Contrast**: Ensure all UI elements meet WCAG AA standards

## Browser Compatibility

All solutions are tested and compatible with:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Specific compatibility notes:
- Scrollbar hiding uses both `-webkit-scrollbar` and `scrollbar-width` for cross-browser support
- CSS Grid is fully supported in all target browsers
- `position: fixed` for context menus works consistently across browsers
- Backdrop blur may have reduced effect in older Safari versions but degrades gracefully


### 14. Document View Button Styling Consistency

**Components:** Document view navigation buttons

**Current Implementation:**
- Edit, Export, and History buttons may have inconsistent styling
- Button styles don't match application design system

**Design Changes:**
```typescript
// In document view component
<div className="document-actions flex items-center gap-2">
  <button
    onClick={handleEdit}
    className="btn-base btn-ghost flex items-center gap-2 px-3 py-2"
  >
    <Edit className="w-4 h-4" />
    <span>Edit</span>
  </button>
  
  <button
    onClick={handleExport}
    className="btn-base btn-ghost flex items-center gap-2 px-3 py-2"
  >
    <Download className="w-4 h-4" />
    <span>Export</span>
  </button>
  
  <button
    onClick={handleHistory}
    className="btn-base btn-ghost flex items-center gap-2 px-3 py-2"
  >
    <History className="w-4 h-4" />
    <span>History</span>
  </button>
</div>
```

**CSS Implementation:**
```css
.document-actions {
  padding: 0.5rem;
  border-bottom: 1px solid var(--border);
}

.document-actions .btn-base {
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.15s ease;
}

.document-actions .btn-base:hover {
  background-color: var(--accent);
}

.document-actions .btn-base svg {
  flex-shrink: 0;
}
```

**Rationale:** Using the standard `btn-base` and `btn-ghost` classes ensures consistency with other buttons throughout the application. The flex layout with gap provides consistent spacing.

### 15. Document Modal Styling Consistency

**Components:** `DocumentExport.tsx`, `DocumentHistory.tsx`

**Current Implementation:**
- Modal styling may be inconsistent with other modals
- Typography, spacing, and colors don't match design system

**Design Changes:**
```typescript
// DocumentExport.tsx
const DocumentExport: React.FC<Props> = ({ onClose, onExport }) => {
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Export Document</h2>
          <button
            onClick={onClose}
            className="btn-base btn-ghost p-2"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="modal-body">
          <div className="space-y-4">
            <div>
              <label className="form-label">Export Format</label>
              {/* Format options */}
            </div>
            
            <div>
              <label className="form-label">
                <input type="checkbox" className="form-checkbox" />
                Include Assets
              </label>
              <p className="form-help-text">
                Include generated images and videos in the export
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            onClick={onClose}
            className="btn-base btn-ghost"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="btn-base btn-primary"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>
    </>
  );
};

// DocumentHistory.tsx
const DocumentHistory: React.FC<Props> = ({ onClose, versions }) => {
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Document History</h2>
          <button
            onClick={onClose}
            className="btn-base btn-ghost p-2"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="modal-body">
          <div className="space-y-4">
            {versions.map(version => (
              <div key={version.id} className="history-item">
                <div className="history-item-header">
                  <span className="history-version">Version {version.number}</span>
                  <span className="history-timestamp">{version.timestamp}</span>
                </div>
                <div className="history-item-content">
                  <p className="text-sm text-muted">{version.title}</p>
                </div>
                <button
                  onClick={() => handleRestore(version.id)}
                  className="btn-base btn-ghost btn-sm mt-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            onClick={onClose}
            className="btn-base btn-primary"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};
```

**CSS Implementation:**
```css
/* Modal structure */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: var(--z-modal-backdrop);
  animation: fadeIn 0.2s ease-out;
}

.modal-content {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: var(--z-modal);
  background-color: var(--card);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  max-width: 90vw;
  max-height: 90vh;
  width: 500px;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border);
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--foreground);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid var(--border);
}

/* History item styling */
.history-item {
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background-color: var(--background);
}

.history-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.history-version {
  font-weight: 600;
  color: var(--foreground);
}

.history-timestamp {
  font-size: 0.875rem;
  color: var(--muted-foreground);
}

/* Form elements */
.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--foreground);
  margin-bottom: 0.5rem;
}

.form-help-text {
  font-size: 0.875rem;
  color: var(--muted-foreground);
  margin-top: 0.25rem;
}

.form-checkbox {
  margin-right: 0.5rem;
}
```

**Rationale:** Consistent modal structure with header, body, and footer sections ensures all modals look and behave the same. Using standard button classes and form elements maintains design system consistency.

### 16. Manager Panel Tab Label Simplification

**Component:** `SceneManageDrawer.tsx` or manager panel tabs

**Current Implementation:**
- Tab label shows "Groups & Tags"
- Label is verbose and takes up unnecessary space

**Design Changes:**
```typescript
// In manager panel tabs
const MANAGER_TABS = [
  { id: 'details', label: 'Details', icon: FileText },
  { id: 'tags', label: 'Tags', icon: Tag },  // Changed from "Groups & Tags"
  { id: 'history', label: 'History', icon: Clock }
];

// In JSX
<div className="manager-tabs">
  {MANAGER_TABS.map(tab => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id)}
      className={`manager-tab ${activeTab === tab.id ? 'active' : ''}`}
    >
      <tab.icon className="w-4 h-4" />
      <span>{tab.label}</span>
    </button>
  ))}
</div>
```

**CSS Implementation:**
```css
.manager-tabs {
  display: flex;
  border-bottom: 1px solid var(--border);
  background-color: var(--background);
}

.manager-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--muted-foreground);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}

.manager-tab:hover {
  color: var(--foreground);
  background-color: var(--accent);
}

.manager-tab.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}

.manager-tab svg {
  flex-shrink: 0;
}
```

**Rationale:** Simplifying "Groups & Tags" to just "Tags" makes the label more concise while maintaining clarity. The functionality remains the same - users can still manage both groups and tags in this section.

### 17. Manager Panel Section Styling

**Component:** `SceneManageDrawer.tsx` sections (Details, Tags, History)

**Current Implementation:**
- Sections may have inconsistent styling
- Form inputs, buttons, and lists don't match design system

**Design Changes:**
```typescript
// Details Section
<div className="manager-section">
  <div className="manager-section-content">
    <div className="form-group">
      <label className="form-label">Scene Description</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="form-textarea hide-scrollbar"
        rows={4}
        placeholder="Describe this scene..."
      />
    </div>
    
    <div className="form-group">
      <label className="form-label">Aspect Ratio</label>
      <select
        value={aspectRatio}
        onChange={(e) => setAspectRatio(e.target.value)}
        className="form-select"
      >
        <option value="16:9">16:9</option>
        <option value="9:16">9:16</option>
      </select>
    </div>
  </div>
</div>

// Tags Section
<div className="manager-section">
  <div className="manager-section-header">
    <h3 className="manager-section-title">Groups</h3>
  </div>
  <div className="manager-section-content">
    <div className="form-group">
      <div className="input-group">
        <input
          type="text"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          className="form-input"
          placeholder="New group name"
        />
        <select
          value={newGroupColor}
          onChange={(e) => setNewGroupColor(e.target.value)}
          className="form-select"
        >
          {COLORS.map(color => (
            <option key={color} value={color}>{color}</option>
          ))}
        </select>
        <button
          onClick={handleCreateGroup}
          className="btn-base btn-primary"
        >
          Create
        </button>
      </div>
    </div>
    
    <div className="tag-list">
      {groups.map(group => (
        <div key={group.id} className="tag-item">
          <span className="tag-color" style={{ backgroundColor: group.color }} />
          <span className="tag-name">{group.name}</span>
          <button
            onClick={() => handleDeleteGroup(group.id)}
            className="tag-delete"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  </div>
  
  <div className="manager-section-header">
    <h3 className="manager-section-title">Tags</h3>
  </div>
  <div className="manager-section-content">
    {/* Similar structure for tags */}
  </div>
</div>

// History Section
<div className="manager-section">
  <div className="manager-section-content">
    <div className="history-list">
      {history.map(entry => (
        <div key={entry.id} className="history-entry">
          <div className="history-entry-header">
            <span className="history-action">{entry.action}</span>
            <span className="history-time">{entry.timestamp}</span>
          </div>
          <p className="history-details">{entry.details}</p>
        </div>
      ))}
    </div>
  </div>
</div>
```

**CSS Implementation:**
```css
/* Manager section structure */
.manager-section {
  display: flex;
  flex-direction: column;
}

.manager-section-header {
  padding: 1rem 1.5rem 0.5rem;
  border-bottom: 1px solid var(--border);
}

.manager-section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--foreground);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.manager-section-content {
  padding: 1.5rem;
}

/* Form elements */
.form-group {
  margin-bottom: 1.5rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--foreground);
  margin-bottom: 0.5rem;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  color: var(--foreground);
  background-color: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  transition: border-color 0.15s ease;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: var(--primary);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.input-group {
  display: flex;
  gap: 0.5rem;
}

.input-group .form-input {
  flex: 1;
}

.input-group .form-select {
  width: auto;
  min-width: 120px;
}

/* Tag list */
.tag-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.875rem;
  background-color: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.tag-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tag-name {
  flex: 1;
  font-size: 0.875rem;
  color: var(--foreground);
}

.tag-delete {
  padding: 0.25rem;
  color: var(--muted-foreground);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.15s ease;
}

.tag-delete:hover {
  color: var(--destructive);
}

/* History list */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.history-entry {
  padding: 0.875rem;
  background-color: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.history-entry-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.history-action {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--foreground);
}

.history-time {
  font-size: 0.75rem;
  color: var(--muted-foreground);
}

.history-details {
  font-size: 0.875rem;
  color: var(--muted-foreground);
  margin: 0;
}
```

**Rationale:** Consistent form styling, proper spacing, and clear visual hierarchy make the manager panel sections easy to use and visually cohesive with the rest of the application. The styling matches the design system used throughout VibeBoard.
