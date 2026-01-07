# Design Document

## Overview

This design addresses the workflow selection bug where selecting a workflow from the dropdown does not activate agent mode with the upload zone. The solution involves adding a useEffect hook to automatically switch chat modes when a workflow is selected, and conditionally rendering the upload dropzone based on the chat mode.

## Architecture

The fix will be implemented entirely within the ChatPanel component, leveraging existing state management and component structure. No new components or services are required.

### Component Hierarchy

```
ChatPanel
├── AgentDropdown (workflow selector)
├── ChatModeDropdown (mode selector)
├── UploadDropzone (conditionally rendered)
├── FileThumb[] (uploaded files)
├── Chat history
└── Message composer
```

## Components and Interfaces

### ChatPanel Component Changes

**State Management:**
- Existing state: `selectedWorkflowId`, `selectedSubtypeId`, `chatMode`
- No new state required

**Effect Hooks:**
- Add new useEffect to watch `selectedWorkflowId` changes
- When workflow is selected (not null), set `chatMode` to "agent"
- When workflow is deselected (null), set `chatMode` to "simple"

**Conditional Rendering:**
- Show UploadDropzone when `chatMode === "agent"`
- Position upload zone above file thumbnails and below chat mode dropdowns
- Hide upload zone in "simple" mode

### Data Flow

```
User selects workflow
    ↓
AgentDropdown.onWorkflowSelect()
    ↓
ChatPanel.handleWorkflowSelect()
    ↓
Update selectedWorkflowId state
    ↓
useEffect detects change
    ↓
Update chatMode to "agent"
    ↓
Re-render with UploadDropzone visible
```

## Implementation Details

### 1. Automatic Mode Switching

Add a useEffect hook in ChatPanel:

```typescript
useEffect(() => {
  if (selectedWorkflowId) {
    setChatMode("agent");
  } else {
    setChatMode("simple");
  }
}, [selectedWorkflowId]);
```

This ensures that:
- Selecting any workflow activates agent mode
- Clearing workflow selection returns to simple mode
- Mode changes trigger re-render with appropriate UI

### 2. Upload Zone Rendering

Modify the ChatPanel render to conditionally show UploadDropzone:

```typescript
{chatMode === "agent" && (
  <div className="mb-3">
    <UploadDropzone
      projectId={projectId}
      onFilesUploaded={handleFilesUploaded}
      onError={handleFileUploadError}
    />
  </div>
)}
```

Position: After chat mode dropdowns, before file thumbnails

### 3. Placeholder Text

The existing `getPlaceholder()` function already handles workflow-specific text:
- No workflow: "Select a workflow to get started..."
- Workflow selected: "Describe your {workflow} concept..."
- Subtype selected: "Describe your {subtype} concept..."

This provides clear feedback about the current workflow context.

## Error Handling

### Edge Cases

1. **Workflow deleted while selected**: If a workflow is deleted from settings while selected, the dropdown will show "Select Workflow" but mode will remain "agent". This is acceptable as it doesn't break functionality.

2. **Mode manually changed**: If user manually changes mode via ChatModeDropdown while a workflow is selected, the manual selection should take precedence. The useEffect should only run when workflow changes, not on every render.

3. **Mobile view switching**: Existing mobile view logic already handles view persistence. No changes needed.

## Testing Strategy

### Manual Testing

1. **Workflow Selection Flow**
   - Open app with no workflow selected
   - Verify chat mode is "simple" and no upload zone visible
   - Select a workflow from dropdown
   - Verify chat mode switches to "agent"
   - Verify upload zone appears
   - Verify placeholder text updates

2. **Workflow Deselection**
   - With workflow selected and agent mode active
   - Clear workflow selection (if UI allows)
   - Verify mode returns to "simple"
   - Verify upload zone disappears

3. **File Upload in Agent Mode**
   - Select workflow to activate agent mode
   - Upload files via dropzone
   - Verify files appear as thumbnails
   - Verify files persist after sending message
   - Verify agent mode remains active

4. **Mobile Responsiveness**
   - Test workflow selection on mobile layout
   - Verify upload zone appears correctly
   - Verify view switching preserves workflow state

### Integration Points

- AgentDropdown: Verify onWorkflowSelect callback fires correctly
- ChatModeDropdown: Verify mode can still be manually changed
- UploadDropzone: Verify component receives correct props
- Message submission: Verify workflow context is maintained

## Design Decisions

### Why useEffect instead of inline handler?

Using a useEffect hook to react to workflow selection changes provides:
- Separation of concerns (selection logic vs mode logic)
- Automatic synchronization between workflow and mode state
- Easier to test and reason about
- Consistent with existing pattern (mobile view auto-switch)

### Why not remove ChatModeDropdown?

Keeping the manual mode selector allows:
- Advanced users to override automatic behavior
- Future expansion of mode-specific features
- Debugging and testing flexibility
- User control over interface complexity

### Why position upload zone in chat panel?

The upload zone belongs in the chat panel because:
- Files are part of the conversation context
- Workflow selection is in the chat panel
- Maintains spatial relationship between related features
- Consistent with existing file thumbnail display

## Future Enhancements

1. **Workflow presets**: Auto-populate file purposes based on workflow type
2. **Workflow templates**: Pre-fill message templates for common workflows
3. **Workflow history**: Remember last-used workflow per project
4. **Workflow validation**: Warn if required files are missing for workflow
