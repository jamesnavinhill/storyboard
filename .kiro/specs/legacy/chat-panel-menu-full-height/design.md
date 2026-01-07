# Design Document

## Overview

This design modifies the StylePresetPicker and SettingsPanel components to utilize the full vertical space of the ChatPanel. The solution involves changing the positioning strategy from fixed max-height constraints to a dynamic approach that calculates the available space based on the ChatPanel's layout structure.

## Architecture

The ChatPanel has a flex column layout with three main sections:
1. Header (agent selection buttons)
2. Chat history (flex-1, scrollable)
3. Footer (input area with controls)

The popover menus (StylePresetPicker and SettingsPanel) are currently positioned absolutely within the footer section with fixed max-height values. The new design will position them to span from the footer to the top of the ChatPanel.

## Components and Interfaces

### StylePresetPicker

**Current Implementation:**
- Positioned absolutely with `bottom-0`
- Fixed max-height: `max-h-[min(70vh,520px)]`
- Contains: header, scrollable grid, sticky footer

**New Implementation:**
- Remove fixed max-height constraint
- Use `inset-0` positioning to cover full ChatPanel height
- Calculate bottom offset to account for the input area height
- Maintain internal flex layout with scrollable content area

**CSS Changes:**
```css
/* Current */
className="popover popover-elevated absolute left-0 right-0 p-2 sm:p-3 z-30 bottom-0 max-h-[min(70vh,520px)] flex flex-col"

/* New */
className="popover popover-elevated absolute inset-0 p-2 sm:p-3 z-30 flex flex-col"
```

### SettingsPanel

**Current Implementation:**
- Positioned absolutely with `bottom-0` (in popover variant)
- Fixed max-height: `max-h-[min(75vh,560px)]`
- Contains: scrollable settings sections, sticky footer

**New Implementation:**
- Remove fixed max-height constraint for popover variant
- Use `inset-0` positioning to cover full ChatPanel height
- Calculate bottom offset to account for the input area height
- Maintain internal flex layout with scrollable content area
- Keep sheet variant unchanged (used in different contexts)

**CSS Changes:**
```css
/* Current popover variant */
className="popover popover-elevated absolute left-0 right-0 p-3 z-30 bottom-0 max-h-[min(75vh,560px)] flex flex-col"

/* New popover variant */
className="popover popover-elevated absolute inset-0 p-3 z-30 flex flex-col"
```

### ChatPanel Integration

The ChatPanel footer section needs to be modified to provide proper positioning context for the popover menus:

**Current Structure:**
```tsx
<div className="border-t p-2 sm:px-3 sm:py-2.5 relative border-muted">
  {isPresetsPanelOpen && <StylePresetPicker ... />}
  {isSessionSettingsOpen && <SettingsPanel ... />}
  {/* input controls */}
</div>
```

**New Structure:**
The footer remains the same, but the popover menus will use `inset-0` to position relative to the entire ChatPanel (the parent with `flex flex-col h-full`), not just the footer. This requires adjusting the positioning context.

**Alternative Approach:**
Move the popover menus outside the footer div and position them relative to the ChatPanel root:

```tsx
<div className="flex flex-col h-full min-h-0">
  {/* header */}
  {/* chat history */}
  
  {isPresetsPanelOpen && <StylePresetPicker ... />}
  {isSessionSettingsOpen && <SettingsPanel ... />}
  
  <div className="border-t p-2 sm:px-3 sm:py-2.5 relative border-muted">
    {/* input controls */}
  </div>
</div>
```

This approach allows the menus to position relative to the full ChatPanel height.

## Data Models

No data model changes required. This is purely a visual/layout modification.

## Error Handling

No new error conditions introduced. The layout changes are CSS-based and will gracefully adapt to different viewport sizes through existing responsive utilities.

## Testing Strategy

### Manual Testing
1. Open StylePresetPicker menu and verify it extends to the top of ChatPanel
2. Open SettingsPanel menu and verify it extends to the top of ChatPanel
3. Verify scrolling works correctly within both menus
4. Verify "Done" buttons remain fixed at the bottom
5. Test on mobile viewport (< 768px)
6. Test on tablet viewport (768px - 1024px)
7. Test on desktop viewport (> 1024px)
8. Verify menus don't overflow ChatPanel boundaries
9. Verify z-index stacking works correctly
10. Verify closing menus works as expected

### Visual Regression Testing
- Compare before/after screenshots at different viewport sizes
- Ensure no layout shifts in other ChatPanel elements
- Verify backdrop/overlay behavior remains consistent
