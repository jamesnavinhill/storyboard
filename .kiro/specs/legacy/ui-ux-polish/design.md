# UI/UX Polish Design

## Overview

This design document outlines comprehensive user interface and user experience improvements across VibeBoard's main application areas. The improvements focus on better information hierarchy, space efficiency, consistent styling, and streamlined workflows. All changes maintain the existing feature-first architecture while enhancing usability and visual polish.

## Architecture Context

### Current Component Structure

**Sidebar (Library Feature):**

- `LibraryPanel.tsx`: Main container with toolbar and tabs
- `ProjectsTab.tsx`: Project list view
- `AssetsTab.tsx`: Asset list view
- Current layout: Toolbar → Content → Settings/Theme at bottom

**Chat Panel (Chat Feature):**

- `ChatPanel.tsx`: Main chat interface with mode switching
- `UploadDropzone.tsx`: File upload area
- `ChatModeDropdown.tsx`: Mode selection (Agent, Style, Document, Audio)
- `AgentDropdown.tsx`: Workflow selection
- Current: Separate views for different modes

**Main Panel (Storyboard Feature):**

- `StoryboardPanel.tsx`: Scene grid with filters
- `SceneCard.tsx`: Individual scene display
- `DocumentExport.tsx`: Export modal
- `DocumentHistory.tsx`: History modal
- Current: Mixed alignment for navigation elements

**Manager Panel (Layout Feature):**

- `LeftManagerDrawer/`: Currently named with incorrect positional reference
- Contains tabs for Library, Details, Groups & Tags, History
- Groups/Tags open in separate modals

**Settings (Settings Feature):**

- `EnhancedSettingsSheet.tsx`: Main settings modal
- `WorkflowManager.tsx`: Workflow configuration
- `TemplateLibrary.tsx`: Style template management
- `SettingsPanel.tsx`: App and model settings
- Current: Some settings duplicated across panels

### Theme System

Current theme implementation uses CSS variables:

- Dark theme: Default
- Light theme: Overrides with lighter colors
- Issue: Some components hardcode colors instead of using theme variables

## Design Decisions

### 1. Sidebar Project and Asset Reorganization

**Decision:** Implement collapsible project hierarchy with inline assets

**Current Structure:**

```
[Toolbar with tabs]
[Content area - flat list]
[Settings button]
[Divider]
[Theme toggle]
[Divider]
```

**New Structure:**

```
[Header]
[+ New Project button]
[Project 1 (collapsible)]
  ├─ Asset thumbnail 1
  ├─ Asset thumbnail 2
  └─ Asset thumbnail 3
[Project 2 (collapsible)]
  └─ ...
[Spacer - flexible]
[Theme toggle]
[Divider]
[Settings button]
```

**Implementation Details:**

1. **New Component: `ProjectCollapsible.tsx`**
   - Renders project name with expand/collapse icon
   - Shows asset count badge
   - Expands to reveal asset list with thumbnails
   - Uses local storage to persist expand/collapse state

2. **Modified: `LibraryPanel.tsx`**
   - Remove tab switching for sidebar variant
   - Always show projects view in sidebar
   - Add "New Project" button at top
   - Add flexible spacer before settings section

3. **Modified: `ProjectsTab.tsx`**
   - Add collapsible mode for sidebar variant
   - Keep grid/list mode for full variant
   - Render assets inline when expanded

4. **Styling Changes:**
   - Remove one divider (keep only one between settings and theme)
   - Add `margin-top: auto` to settings section for bottom alignment
   - Increase padding between project items
   - Add subtle hover states for project items

**Rationale:**

- Reduces cognitive load by showing hierarchy
- Eliminates need for tab switching in sidebar
- Provides quick access to assets without navigation
- More breathing room improves readability

### 2. Chat Panel Layout and Upload Zone Improvements

**Decision:** Auto-switch views on mode selection, compact upload zone

**Current Behavior:**

- Mode selection doesn't change view
- Upload zone takes significant vertical space
- Subtext always visible

**New Behavior:**

- Selecting chat mode automatically switches to chat view
- Upload zone IS NOT visible in chat view
- Compact horizontal layout for upload zone
- Subtext shown as tooltip

**Implementation Details:**

1. **Modified: `ChatPanel.tsx`**
   - Add `useEffect` to watch `chatMode` state
   - When mode changes, automatically switch to chat view
   - HIDE upload zone in chat view

2. **Modified: `UploadDropzone.tsx`**
   - Change layout from vertical to horizontal
   - Icon and "Upload files" text side-by-side
   - Remove visible subtext
   - Add tooltip with file type information
   - Reduce padding and height

3. **Modified: `ChatModeDropdown.tsx`**
   - Add "Manage Workflows" button at bottom of menu *ALREADY THERE
   - Button opens settings sheet with workflow tab active *GLOBAL SETTINGS NOT THE SESSION CHAT SETTINGS

**Layout Changes:**

```tsx
// Before (vertical):
<div className="upload-zone">
  <Icon />
  <div>Upload files</div>
  <div className="subtext">Supported: images, videos...</div>
</div>

// After (horizontal):
<div className="upload-zone-compact" title="Supported: images, videos...">
  <Icon />
  <span>Upload files</span>
</div>
```

**Rationale:**

- Auto-switching reduces clicks and confusion
- Horizontal layout saves vertical space for chat messages
- Tooltip keeps information accessible without clutter
- Direct link to workflow management improves discoverability

### 3. Main Panel Navigation and Modal Styling

**Decision:** Align navigation elements, fix modal backgrounds

**Current Issues:**

- Mixed alignment of navigation elements
- Export/History modals use translucent backgrounds (unusable)
- Missing layout toggle icon

**New Layout:**

```
[Left-aligned: Nav icons] [Right-aligned: Subtabs | Filters | Layout icon]
```

**Implementation Details:**

1. **Modified: `StoryboardPanel.tsx`**
   - Wrap navigation in flex container
   - Left section: Navigation icons (storyboard, gallery, documents)
   - Right section: Subtabs, filters, layout toggle
   - Add layout icon (Grid/List toggle)

2. **Modified: `DocumentExport.tsx`**
   - Remove translucent background
   - Use solid background from theme variables
   - Apply consistent modal styling
   - Ensure proper contrast for all text

3. **Modified: `DocumentHistory.tsx`**
   - Remove translucent background
   - Use solid background from theme variables
   - Apply consistent modal styling
   - Ensure proper contrast for all text

4. **New Component: `LayoutToggle.tsx`**
   - Icon button for grid/list view
   - Positioned in top-right navigation area

**CSS Changes:**

```css
/* Remove translucent backgrounds */
.modal-overlay {
  background: var(--modal-bg); /* Solid color from theme */
}

.modal-content {
  background: var(--surface-bg);
  border: 1px solid var(--border-color);
}

/* Navigation alignment */
.storyboard-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-left {
  display: flex;
  gap: 0.5rem;
}

.nav-right {
  display: flex;
  gap: 1rem;
  align-items: center;
}
```

**Rationale:**

- Clear visual hierarchy with aligned elements
- Solid backgrounds ensure readability
- Layout toggle provides user control
- Consistent with modern UI patterns

### 4. Manager Panel Simplification

**Decision:** Rename component, inline group/tag management

**Current Issues:**

- Named "LeftManagerDrawer" (positional reference)
- Groups/Tags open in separate modals
- Legacy styling inconsistent with app

**Changes:**

1. **Rename: `LeftManagerDrawer` → `ManagerDrawer`**
   - Update directory name
   - Update component name
   - Update all imports
   - Update documentation

2. **Modified: `ManagerDrawer.tsx`**
   - Add inline group management view
   - Add inline tag management view
   - Remove modal triggers
   - Update button, icon, and dropdown styles

3. **Integration with Existing Inline Managers:**
   - Use `GroupsInlineManager.tsx` (already exists in library feature)
   - Use `TagsInlineManager.tsx` (already exists in library feature)
   - Render these components directly in manager panel tabs

4. **Styling Updates:**
   - Replace legacy button classes with current design system
   - Update icon sizes and colors to match app
   - Modernize dropdown styling
   - Add hover states consistent with other panels

**Component Structure:**

```tsx
<ManagerDrawer>
  <Tabs>
    <Tab name="Library">
      {/* Existing library content */}
    </Tab>
    <Tab name="Details">
      {/* Existing details content */}
    </Tab>
    <Tab name="Groups & Tags">
      <GroupsInlineManager />
      <TagsInlineManager />
    </Tab>
    <Tab name="History">
      {/* Existing history content */}
    </Tab>
  </Tabs>
</ManagerDrawer>
```

**Rationale:**

- Descriptive name improves code clarity
- Inline management reduces modal fatigue
- Consistent styling improves polish
- Reuses existing inline manager components

### 5. Settings Panel Reorganization

**Decision:** Remove duplicates, organize by category, clean up template display

**Current Issues:**

- "General" settings appear at bottom of workflow panel
- Template badges cluttered
- Some settings missing from models/app panels

**Changes:**

1. **Modified: `WorkflowManager.tsx`**
   - Remove "General" settings section
   - Focus only on workflow-specific configuration
   - Move general settings to app settings panel

2. **Modified: `TemplateLibrary.tsx`**
   - Implement grid layout for template badges
   - Add spacing between items
   - Improve visual hierarchy
   - Add search/filter if many templates

3. **Modified: `SettingsPanel.tsx`**
   - Audit all available settings
   - Add missing model settings (temperature, top-p, top-k, etc.)
   - Add missing app settings (auto-save, default aspect ratio, etc.)
   - Organize into clear sections with headers

4. **Settings Audit:**
   - Model settings: temperature, topP, topK, maxTokens, stopSequences
   - App settings: theme, defaultAspectRatio, autoSave, exportFormat
   - Workflow settings: (keep in workflow panel)
   - Template settings: (keep in template panel)

**Layout Changes:**

```tsx
// Template Library - Grid Layout
<div className="template-grid">
  {templates.map(template => (
    <TemplateCard key={template.id} template={template} />
  ))}
</div>

// Settings Panel - Organized Sections
<SettingsPanel>
  <Section title="Model Configuration">
    <Setting name="temperature" />
    <Setting name="topP" />
    <Setting name="topK" />
  </Section>
  <Section title="Application">
    <Setting name="theme" />
    <Setting name="defaultAspectRatio" />
  </Section>
</SettingsPanel>
```

**Rationale:**

- Eliminates confusion from duplicate settings
- Logical organization improves discoverability
- Grid layout for templates improves scannability
- Complete settings coverage ensures configurability

### 6. Light Theme Storyboard Card Fixes

**Decision:** Use theme variables instead of hardcoded colors

**Current Issue:**

- Scene cards and media cards use hardcoded black backgrounds
- Unreadable in light theme

**Implementation:**

1. **Modified: `SceneCard.tsx`**
   - Replace hardcoded background colors with CSS variables
   - Use `var(--card-bg)` instead of `#000` or `#1a1a1a`
   - Use `var(--card-border)` for borders
   - Use `var(--text-primary)` for text

2. **Modified: `SceneCardPreview.tsx`**
   - Same variable replacements
   - Ensure image overlays use theme-aware colors

3. **Modified: `StackedGroupCard.tsx`**
   - Update background and border colors
   - Use theme variables throughout

4. **CSS Variable Additions:**

```css
/* Dark theme (default) */
:root {
  --card-bg: #1a1a1a;
  --card-border: #333;
  --card-hover-bg: #222;
}

/* Light theme */
[data-theme="light"] {
  --card-bg: #ffffff;
  --card-border: #e0e0e0;
  --card-hover-bg: #f5f5f5;
}
```

5. **Audit All Card Components:**
   - Search for hardcoded color values
   - Replace with appropriate CSS variables
   - Test in both themes
   - Ensure proper contrast ratios

**Rationale:**

- Theme variables ensure consistency
- Automatic adaptation to theme changes
- Maintains accessibility standards
- Future-proof for additional themes

## Components and Interfaces

### New Components

**ProjectCollapsible.tsx:**

```typescript
interface ProjectCollapsibleProps {
  project: ProjectSummary;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
  assets: Array<{
    id: string;
    thumbnail?: string;
    type: 'image' | 'video' | 'audio';
  }>;
}
```

**LayoutToggle.tsx:**

```typescript
interface LayoutToggleProps {
  mode: 'grid' | 'list';
  onChange: (mode: 'grid' | 'list') => void;
}
```

### Modified Components

**LibraryPanel.tsx:**

- Add `showCollapsible` prop for sidebar variant
- Add `onCreateProject` callback
- Remove tab switching logic for sidebar

**ChatPanel.tsx:**

- Add auto-switch effect on mode change
- Keep upload zone visible in chat view

**UploadDropzone.tsx:**

- Add `compact` prop for horizontal layout
- Add `tooltipText` prop for subtext

**StoryboardPanel.tsx:**

- Add navigation alignment wrapper
- Add layout toggle control

**ManagerDrawer.tsx:**

- Rename from LeftManagerDrawer
- Add inline group/tag management
- Update styling to match design system

**EnhancedSettingsSheet.tsx:**

- Remove general settings from workflow tab
- Add missing settings to models/app tabs

## Data Models

No data model changes required. All changes are UI/layout only.

## Error Handling

No new error handling required. Existing error handling remains unchanged.

## Testing Strategy

### Visual Regression Testing

1. **Theme Testing:**
   - Test all components in both light and dark themes
   - Verify no hardcoded colors remain
   - Check contrast ratios meet WCAG standards

2. **Layout Testing:**
   - Test sidebar at different heights
   - Verify collapsible projects work correctly
   - Test navigation alignment at different widths

3. **Interaction Testing:**
   - Verify auto-switch on chat mode selection
   - Test inline group/tag management
   - Verify modal backgrounds are solid and readable

### Component Testing

1. **ProjectCollapsible:**
   - Test expand/collapse functionality
   - Verify state persistence
   - Test asset thumbnail rendering

2. **UploadDropzone:**
   - Test compact layout
   - Verify tooltip appears on hover
   - Test file upload functionality

3. **ManagerDrawer:**
   - Test inline group management
   - Test inline tag management
   - Verify styling consistency

### Integration Testing

1. **Sidebar Flow:**
   - Create project → Verify appears in list
   - Expand project → Verify assets shown
   - Collapse project → Verify state saved

2. **Chat Flow:**
   - Select mode → Verify auto-switch
   - Upload file → Verify compact zone works
   - Manage workflows → Verify settings open

3. **Settings Flow:**
   - Open settings → Verify no duplicate options
   - Change model setting → Verify persists
   - Change app setting → Verify applies

## Implementation Notes

### Phase 1: Sidebar Reorganization

- Create ProjectCollapsible component
- Modify LibraryPanel for collapsible mode
- Update styling and spacing
- Test expand/collapse functionality

### Phase 2: Chat Panel Improvements

- Add auto-switch logic to ChatPanel
- Modify UploadDropzone for compact layout
- Add workflow management link
- Test mode switching

### Phase 3: Main Panel Navigation

- Align navigation elements
- Add layout toggle
- Fix modal backgrounds
- Test in both themes

### Phase 4: Manager Panel Simplification

- Rename LeftManagerDrawer to ManagerDrawer
- Integrate inline managers
- Update styling
- Test group/tag management

### Phase 5: Settings Reorganization

- Remove duplicate settings
- Add missing settings
- Reorganize template display
- Test all settings panels

### Phase 6: Theme Fixes

- Replace hardcoded colors with variables
- Test all cards in light theme
- Verify contrast ratios
- Final visual polish

## Risk Assessment

### Low Risk Changes

- Sidebar layout (additive, doesn't break existing)
- Chat panel auto-switch (improves UX)
- Navigation alignment (visual only)
- Settings reorganization (no data changes)

### Medium Risk Changes

- ManagerDrawer rename (requires import updates)
- Modal background changes (must ensure readability)
- Theme variable replacements (must test thoroughly)

### Mitigation Strategies

- Implement changes incrementally
- Test each phase before moving to next
- Keep git commits atomic for easy rollback
- Test in both themes after each change
- Verify no regressions in existing functionality

## Success Criteria

1. ✅ Sidebar shows collapsible projects with inline assets
2. ✅ New project button appears under header
3. ✅ Settings and theme have proper spacing at bottom
4. ✅ Only one divider between settings and theme
5. ✅ Chat mode selection auto-switches to chat view
6. ✅ Upload zone uses compact horizontal layout
7. ✅ Manage workflows button opens settings
8. ✅ Main panel navigation properly aligned
9. ✅ Layout toggle icon appears in top right
10. ✅ Export and history modals use solid backgrounds
11. ✅ ManagerDrawer renamed from LeftManagerDrawer
12. ✅ Groups and tags managed inline in panel
13. ✅ Manager panel styling matches design system
14. ✅ Settings panel has no duplicate options
15. ✅ Template badges displayed in clean grid
16. ✅ All model and app settings present
17. ✅ Storyboard cards readable in light theme
18. ✅ No hardcoded colors in card components
19. ✅ All components tested in both themes
20. ✅ No regressions in existing functionality
