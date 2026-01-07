# Design Document

## Overview

This design addresses layout inconsistencies across the Manager Panel's three tabs (Details, Tags, History). Currently, each tab renders with different dimensions, padding, and positioning, creating a disjointed user experience. The solution establishes a standardized container structure with consistent dimensions, padding, and alignment that matches the Library Panel's vertical positioning.

## Architecture

### Component Hierarchy

```
Manager Panel (SceneManageDrawer)
├── Tab Navigation (Details, Tags, History)
└── Tab Content Container (standardized)
    ├── Details Tab Content
    │   ├── Scene Title Input
    │   ├── Description Textarea
    │   └── Aspect Ratio Selector
    ├── Tags Tab Content
    │   ├── Groups Section
    │   │   ├── Group Selector
    │   │   └── Create Group Form
    │   └── Tags Section
    │       ├── Tag Selector
    │       └── Create Tag Form
    └── History Tab Content
        └── History Entry List
```

### Layout Strategy

The design uses a standardized container approach where all tab content is wrapped in a consistent structure:

1. **Fixed Container Class**: A single `.manager-tab-content` class applied to all tab content areas
2. **Consistent Padding**: Uniform padding (16px on all sides) across all tabs
3. **Vertical Alignment**: Content starts at the same vertical position as Library Panel content
4. **Overflow Management**: Consistent scroll behavior with hidden scrollbars

## Components and Interfaces

### 1. Manager Panel Container Structure

**Component:** `SceneManageDrawer.tsx`

**Current Implementation:**
- Each tab likely has different wrapper elements
- Inconsistent padding and dimensions
- No standardized container class

**Design Changes:**

```typescript
// Standardized tab content wrapper
interface ManagerTabContentProps {
  children: React.ReactNode;
  className?: string;
}

const ManagerTabContent: React.FC<ManagerTabContentProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`manager-tab-content hide-scrollbar ${className}`}>
      {children}
    </div>
  );
};
```

**CSS Implementation:**

```css
/* Standardized manager tab content container */
.manager-tab-content {
  width: 100%;
  height: 100%;
  padding: 16px;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Ensure consistent dimensions */
.manager-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.manager-tab-navigation {
  flex-shrink: 0;
  border-bottom: 1px solid var(--border);
}

.manager-tab-container {
  flex: 1;
  min-height: 0; /* Allow flex child to shrink */
  position: relative;
}
```

**Rationale:** A single container component with standardized CSS ensures all tabs have identical dimensions and padding. The flexbox layout prevents content overflow and maintains consistent heights.

### 2. Details Tab Standardization

**Component:** Details tab content in `SceneManageDrawer.tsx`

**Current Implementation:**
- Custom padding or container structure
- Potentially different width constraints

**Design Changes:**

```typescript
// Wrap Details tab content in ManagerTabContent
const DetailsTabContent = () => {
  return (
    <ManagerTabContent>
      <div className="form-group">
        <label className="form-label">Scene Title</label>
        <input
          type="text"
          className="form-input"
          value={sceneTitle}
          onChange={(e) => setSceneTitle(e.target.value)}
          placeholder="Enter scene title"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea
          className="form-textarea hide-scrollbar"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe this scene..."
          rows={6}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Aspect Ratio</label>
        <select
          className="form-select"
          value={aspectRatio}
          onChange={(e) => setAspectRatio(e.target.value)}
        >
          <option value="16:9">16:9 (Landscape)</option>
          <option value="9:16">9:16 (Portrait)</option>
        </select>
      </div>
    </ManagerTabContent>
  );
};
```

**Rationale:** Wrapping Details content in the standardized container ensures consistent padding and dimensions. Form elements use consistent styling classes.

### 3. Tags Tab Standardization

**Component:** Tags tab content in `SceneManageDrawer.tsx`

**Current Implementation:**
- Different container structure than Details
- Potentially different padding

**Design Changes:**

```typescript
// Wrap Tags tab content in ManagerTabContent
const TagsTabContent = () => {
  return (
    <ManagerTabContent>
      {/* Groups Section */}
      <div className="manager-section">
        <h3 className="manager-section-header">Groups</h3>
        <div className="form-group">
          <label className="form-label">Assign to Group</label>
          <select
            className="form-select"
            value={selectedGroupId || ''}
            onChange={(e) => handleGroupChange(e.target.value)}
          >
            <option value="">No group</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
        <GroupCreationForm onCreateGroup={handleCreateGroup} />
      </div>

      {/* Tags Section */}
      <div className="manager-section">
        <h3 className="manager-section-header">Tags</h3>
        <div className="tag-list">
          {selectedTags.map(tag => (
            <TagChip key={tag.id} tag={tag} onRemove={handleRemoveTag} />
          ))}
        </div>
        <TagSelector
          availableTags={availableTags}
          onSelectTag={handleAddTag}
        />
        <TagCreationForm onCreateTag={handleCreateTag} />
      </div>
    </ManagerTabContent>
  );
};
```

**CSS for Sections:**

```css
.manager-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.manager-section-header {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--foreground);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border);
}

.manager-section + .manager-section {
  margin-top: 1.5rem;
}
```

**Rationale:** The standardized container with section headers creates visual consistency. The section header styling matches across all tabs.

### 4. History Tab Standardization

**Component:** History tab content in `SceneManageDrawer.tsx`

**Current Implementation:**
- Different container structure
- Potentially different padding and dimensions

**Design Changes:**

```typescript
// Wrap History tab content in ManagerTabContent
const HistoryTabContent = () => {
  return (
    <ManagerTabContent>
      {historyEntries.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-text">No history yet</p>
          <p className="empty-state-subtext">
            Changes to this scene will appear here
          </p>
        </div>
      ) : (
        <div className="history-list">
          {historyEntries.map(entry => (
            <div key={entry.id} className="history-entry">
              <div className="history-entry-header">
                <span className="history-action">{entry.action}</span>
                <span className="history-timestamp">
                  {formatTimestamp(entry.timestamp)}
                </span>
              </div>
              {entry.description && (
                <p className="history-description">{entry.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </ManagerTabContent>
  );
};
```

**CSS for History:**

```css
.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.history-entry {
  padding: 0.75rem;
  background-color: var(--muted);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}

.history-entry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.history-action {
  font-weight: 500;
  color: var(--foreground);
  font-size: 0.875rem;
}

.history-timestamp {
  font-size: 0.75rem;
  color: var(--muted-foreground);
}

.history-description {
  font-size: 0.875rem;
  color: var(--muted-foreground);
  margin: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
}

.empty-state-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--muted-foreground);
  margin: 0 0 0.5rem 0;
}

.empty-state-subtext {
  font-size: 0.75rem;
  color: var(--muted-foreground);
  margin: 0;
}
```

**Rationale:** Consistent container structure with standardized history entry styling. Empty state provides clear feedback when no history exists.

### 5. Vertical Alignment with Library Panel

**Components:** `SceneManageDrawer.tsx`, `LibraryPanel.tsx`

**Design Changes:**

The Manager Panel should align its content area with the Library Panel's content area. This requires:

1. **Consistent Header Heights**: Both panels should have the same header height
2. **Content Start Position**: Content should start at the same vertical offset

```css
/* Library Panel structure (reference) */
.library-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.library-panel-header {
  height: 56px; /* Fixed header height */
  flex-shrink: 0;
  border-bottom: 1px solid var(--border);
  padding: 0 16px;
  display: flex;
  align-items: center;
}

.library-panel-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px;
}

/* Manager Panel should match */
.manager-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.manager-panel-header {
  height: 56px; /* Match library panel header */
  flex-shrink: 0;
  border-bottom: 1px solid var(--border);
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.manager-tab-navigation {
  height: 48px; /* Fixed tab navigation height */
  flex-shrink: 0;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 16px;
}

.manager-tab-container {
  flex: 1;
  min-height: 0;
  position: relative;
}

/* Total offset: 56px (header) + 48px (tabs) = 104px */
/* Library panel content starts at: 56px (header) */
/* To align, we need to account for the 48px tab navigation difference */
```

**Rationale:** Matching header heights and content start positions creates visual alignment between panels. The tab navigation adds extra height, but the content areas should still feel aligned.

### 6. Responsive Behavior

**Design Changes:**

```css
/* Mobile adjustments (< 640px) */
@media (max-width: 639px) {
  .manager-tab-content {
    padding: 12px; /* Slightly reduced padding on mobile */
  }

  .manager-section-header {
    font-size: 0.8125rem;
  }

  .manager-panel-header {
    height: 48px; /* Reduced header on mobile */
  }

  .manager-tab-navigation {
    height: 44px; /* Reduced tab height on mobile */
  }
}

/* Tablet adjustments (640px - 1023px) */
@media (min-width: 640px) and (max-width: 1023px) {
  .manager-tab-content {
    padding: 14px;
  }
}

/* Desktop (>= 1024px) */
@media (min-width: 1024px) {
  .manager-tab-content {
    padding: 16px;
  }
}
```

**Rationale:** Responsive padding ensures the interface remains usable on smaller screens while maintaining consistency across tabs at each breakpoint.

## Data Models

No new data models required. The changes are purely presentational and use existing scene, group, and tag data structures.

## Error Handling

No specific error handling required for layout changes. Standard React error boundaries will catch any rendering issues.

## Testing Strategy

### Visual Regression Tests

1. **Tab Dimension Consistency**
   - Capture screenshots of all three tabs
   - Verify identical widths and heights
   - Verify identical padding

2. **Vertical Alignment**
   - Capture side-by-side screenshots of Library Panel and Manager Panel
   - Verify content areas start at aligned vertical positions

3. **Responsive Behavior**
   - Test at mobile (375px), tablet (768px), and desktop (1440px) widths
   - Verify consistent padding and dimensions at each breakpoint

### Manual Testing Checklist

- [ ] Details tab has same width as Tags and History tabs
- [ ] Tags tab has same width as Details and History tabs
- [ ] History tab has same width as Details and Tags tabs
- [ ] All tabs have identical padding (16px on desktop)
- [ ] Switching between tabs causes no layout shifts
- [ ] Manager Panel content aligns vertically with Library Panel content
- [ ] Section headers have consistent styling across all tabs
- [ ] Scrollable areas use `.hide-scrollbar` class consistently
- [ ] Responsive padding adjusts consistently across all tabs
- [ ] No horizontal scrolling occurs in any tab
- [ ] Empty states display correctly in History tab

### Component Tests

```typescript
// Test consistent container structure
describe('ManagerTabContent', () => {
  it('applies consistent padding to all tabs', () => {
    const { container } = render(
      <ManagerTabContent>Test content</ManagerTabContent>
    );
    const content = container.querySelector('.manager-tab-content');
    expect(content).toHaveStyle({ padding: '16px' });
  });

  it('applies hide-scrollbar class', () => {
    const { container } = render(
      <ManagerTabContent>Test content</ManagerTabContent>
    );
    const content = container.querySelector('.manager-tab-content');
    expect(content).toHaveClass('hide-scrollbar');
  });
});
```

### 7. Button Styling Standardization

**Components:** All buttons in `SceneManageDrawer.tsx`, Export Document dialog, Document History dialog, Tag/Group Manager

**Current Implementation:**
- Inconsistent border radius (some sharp corners, some rounded)
- Varying button heights across different contexts
- Inconsistent padding and spacing

**Design Changes:**

```css
/* Standardized button styles */
.btn {
  height: 36px;
  padding: 0 16px;
  border-radius: var(--radius-md); /* 8px rounded corners */
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  white-space: nowrap;
}

/* Primary button variant */
.btn-primary {
  background-color: var(--primary);
  color: var(--primary-foreground);
  border-color: var(--primary);
}

.btn-primary:hover {
  background-color: var(--primary-hover);
  border-color: var(--primary-hover);
}

.btn-primary:active {
  background-color: var(--primary-active);
  transform: scale(0.98);
}

/* Secondary button variant */
.btn-secondary {
  background-color: var(--secondary);
  color: var(--secondary-foreground);
  border-color: var(--border);
}

.btn-secondary:hover {
  background-color: var(--secondary-hover);
  border-color: var(--border-hover);
}

.btn-secondary:active {
  background-color: var(--secondary-active);
  transform: scale(0.98);
}

/* Ghost button variant (for less prominent actions) */
.btn-ghost {
  background-color: transparent;
  color: var(--foreground);
  border-color: transparent;
}

.btn-ghost:hover {
  background-color: var(--muted);
}

.btn-ghost:active {
  background-color: var(--muted-hover);
  transform: scale(0.98);
}

/* Destructive button variant */
.btn-destructive {
  background-color: var(--destructive);
  color: var(--destructive-foreground);
  border-color: var(--destructive);
}

.btn-destructive:hover {
  background-color: var(--destructive-hover);
  border-color: var(--destructive-hover);
}

.btn-destructive:active {
  background-color: var(--destructive-active);
  transform: scale(0.98);
}

/* Ensure form inputs match button height */
.form-input,
.form-select,
.form-textarea {
  min-height: 36px;
  padding: 0 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background-color: var(--background);
  color: var(--foreground);
  font-size: 0.875rem;
  transition: border-color 0.15s ease;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-alpha);
}

.form-textarea {
  padding: 8px 12px;
  resize: vertical;
}

/* Button groups for aligned buttons */
.btn-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn-group-end {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: flex-end;
}
```

**Application Examples:**

```typescript
// Details tab - Save button
<button className="btn btn-primary" onClick={handleSave}>
  Save
</button>

// Details tab - Export Image button
<button className="btn btn-secondary" onClick={handleExportImage}>
  Export Image
</button>

// Tags/Groups - Create button
<button className="btn btn-primary" onClick={handleCreate}>
  Create
</button>

// History - Restore button
<button className="btn btn-secondary" onClick={handleRestore}>
  Restore
</button>

// Export Document dialog - Export button
<div className="btn-group-end">
  <button className="btn btn-ghost" onClick={handleCancel}>
    Cancel
  </button>
  <button className="btn btn-primary" onClick={handleExport}>
    <DownloadIcon size={16} />
    Export
  </button>
</div>

// Document History dialog - Close button
<button className="btn btn-ghost" onClick={handleClose}>
  Close
</button>
```

**Rationale:** Standardized button classes ensure consistent height (36px), border radius (8px), padding, and interactive states across all UI contexts. Form inputs match button height for visual alignment. Button variants (primary, secondary, ghost, destructive) provide semantic meaning while maintaining consistency.

## Performance Considerations

1. **Layout Recalculation**: Standardized container structure reduces layout thrashing when switching tabs
2. **Scroll Performance**: Hidden scrollbars with `overflow-y: auto` maintain smooth scrolling
3. **Flexbox Layout**: Modern flexbox layout is performant and well-optimized in all browsers
4. **CSS Transitions**: Lightweight transitions on buttons provide feedback without impacting performance

## Implementation Notes

1. **Incremental Approach**: Update one tab at a time to verify consistency
2. **CSS Variables**: Use existing CSS variables for colors, spacing, and borders
3. **Accessibility**: Ensure tab navigation and buttons remain keyboard accessible
4. **Testing**: Test on actual devices to verify alignment and responsive behavior
5. **Button Audit**: Review all buttons in Manager Panel, Export Document, and History dialogs to ensure consistent class application
