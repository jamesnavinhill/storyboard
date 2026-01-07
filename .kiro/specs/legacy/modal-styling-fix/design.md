# Design Document

## Overview

The DocumentExport and DocumentHistory modals currently use a different structure than the Edit/Animate/Extend modals, resulting in visual inconsistencies. This design addresses the structural differences and applies the hide-scrollbar utility to scrollable content areas.

## Architecture

### Current Issues

**DocumentExport and DocumentHistory:**
```tsx
<>
  <div className="modal-backdrop" onClick={onClose} />
  <div className="modal-content fixed inset-0 flex items-center justify-center pointer-events-none">
    <div className="bg-card border border-muted rounded-lg shadow-lg ...">
      {/* Content */}
    </div>
  </div>
</>
```

**Edit/Animate/Extend (Correct Pattern):**
```tsx
<div className="modal-backdrop" onClick={handleBackdropClick}>
  <div className="modal-content modal-centered">
    <div className="modal-header">...</div>
    <div className="modal-body">...</div>
  </div>
</div>
```

### Root Cause

The DocumentExport and DocumentHistory modals have:
1. An extra wrapper div with `fixed inset-0` that creates a second full-screen layer
2. Missing `hide-scrollbar` class on scrollable content areas
3. Inconsistent modal structure compared to other modals

## Components and Interfaces

### DocumentExport Component

**Changes Required:**
- Remove the extra `<div className="modal-content fixed inset-0 ...">` wrapper
- Apply modal structure directly inside the backdrop
- Add `hide-scrollbar` class to the modal-body div

### DocumentHistory Component

**Changes Required:**
- Remove the extra `<div className="modal-content fixed inset-0 ...">` wrapper
- Apply modal structure directly inside the backdrop
- Add `hide-scrollbar` class to the modal-body div that contains the scrollable history list

## Data Models

No data model changes required. This is purely a presentational fix.

## Error Handling

No error handling changes required. The modal functionality remains the same.

## Testing Strategy

### Manual Testing
1. Open DocumentExport modal and verify:
   - Single backdrop layer (no double background)
   - Scrollbar is hidden when content overflows
   - Visual consistency with Edit modal
   
2. Open DocumentHistory modal and verify:
   - Single backdrop layer (no double background)
   - Scrollbar is hidden when history list scrolls
   - Visual consistency with Edit modal

3. Compare all modals side-by-side:
   - Edit, Animate, Extend, DocumentExport, DocumentHistory
   - Verify consistent backdrop opacity and blur
   - Verify consistent modal positioning and sizing
   - Verify consistent scrollbar behavior

### Visual Regression
- Take screenshots of all modals before and after changes
- Verify DocumentExport and DocumentHistory match the Edit modal pattern
